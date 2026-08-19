#!/usr/bin/env bash
# .chief/verify.sh — Chief merge gate for koine.
#
# Chief runs this after a tasklist's stories are done and its branch has been
# rebased onto the base. Exit 0 ALLOWS the merge, non-zero BLOCKS it (the branch
# is left for review). Runs with cwd = repo root, the finished branch checked
# out; $CHIEF_BASE_BRANCH names the base.
#
# This is NOT a stub. koine already shipped its guards and ran none of them at
# merge time, so every tasklist merged unverified. The changed-file set (vs
# $CHIEF_BASE_BRANCH) now selects which guards run, so a tasks-only branch stays
# cheap while a prose branch pays for the documentation gates.
#
# A path matching NO rule selects the `umbrella`, which is every other gate in
# the table. A spec repo is where an unnoticed defect propagates furthest —
# schemas and the registry are vendored downstream by drift-gated copy — so a
# file class nobody has thought about is gated by DEFAULT, never silently
# ungated. Adding a rule is how a path gets cheaper, and that is a deliberate
# act with a reason written next to it.
#
# Usage:
#   .chief/verify.sh                  run the gates the branch diff selects
#   .chief/verify.sh --plan           print the selected gates, run nothing
#   .chief/verify.sh --plan a/b c/d   plan for an explicit changed-file list
#   .chief/verify.sh --run a/b c/d    run the gates an explicit list selects
#   .chief/verify.sh --list-gates     print the dispatch table
#
# `--plan` with no file list reads STDIN when stdin is not a tty — which it never
# is under an agent's tool shell or a CI step, so a bare `--plan` there reports
# "no changed files" rather than the branch's plan. Pipe the list in:
#   git diff --name-only main...HEAD | .chief/verify.sh --plan
#
# Sourcing with CHIEF_VERIFY_LIB=1 defines the functions without running the
# gate. .chief/verify-test.sh uses that seam two ways: `--plan` to test the
# dispatch in isolation, and `--run` over a swapped-in fake gate table to test
# the RUNNER's contract (a red gate blocks, a green plan passes) without
# invoking a real guard.
set -uo pipefail

# ── Gate table ────────────────────────────────────────────────────────────────
# The ONLY place a gate's command is written down. Columns: id | working dir |
# shell command. Every gate is a script under scripts/ that a developer runs by
# hand with the same command — never a check that exists only inside this hook.
#
# guard-doc-links is a RATCHET against the base, not a wall: it blocks a
# regression and tolerates pre-existing rot, so the rot is retired deliberately
# instead of blocking every merge. guard-doc-integrity is a wall — it covers the
# published contract surface, where the count is already zero.
gate_table() {
  cat <<'EOF'
guard-doc-integrity|.|node scripts/check-doc-integrity.mjs
guard-doc-links|.|node scripts/check-doc-links.mjs --ratchet --base "${CHIEF_BASE_BRANCH:-main}"
guard-categories|.|node scripts/check-tasklist-categories.mjs
verify-selftest|.|if [ "${CHIEF_VERIFY_INNER:-0}" = 1 ]; then echo "verify-selftest: already inside the self-test — skipping"; else bash .chief/verify-test.sh; fi
EOF
}

# ── Dispatch rules ────────────────────────────────────────────────────────────
# First matching GLOB wins, so put the more specific pattern first. Columns:
# glob | space-separated gate ids ("-" = no gate, passes fast). A changed path
# matching NO rule selects every gate (see plan_gates).
rule_table() {
  cat <<'EOF'
# The gate owns itself: a branch editing the dispatch runs the test that asserts it.
.chief/*|verify-selftest
# A guard SCRIPT is the gate, so editing one runs the guards themselves — the only
# way to learn that a guard still works is to run it.
scripts/*|guard-doc-integrity guard-doc-links guard-categories
# A tasklist is JSON, not prose: the category vocabulary is the whole of what can
# be wrong with it, and the doc gates have nothing to say about it.
tasks/*|guard-categories
# Every Markdown file, wherever it lives. Both failures the doc guards catch are
# SILENT — a dead link and a status table that disagrees with the spec header it
# mirrors both read as ordinary prose.
*.md|guard-doc-integrity guard-doc-links
LICENSE|-
.gitignore|-
EOF
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
# gate_ids — every gate id in table order, one per line.
gate_ids() {
  while IFS='|' read -r id _dir _cmd; do
    [ -n "$id" ] || continue
    printf '%s\n' "$id"
  done <<EOF
$(gate_table)
EOF
}

# gates_for_path <path> — the gate ids one changed path selects, one per line.
# Prints `__umbrella__` when no rule matches (unknown path ⇒ run the world).
gates_for_path() {
  local path="$1" glob ids matched=0
  while IFS='|' read -r glob ids; do
    [ -n "$glob" ] || continue
    case "$glob" in '#'*) continue ;; esac
    # shellcheck disable=SC2254  # deliberate: $glob is a pattern, not a literal
    case "$path" in
      $glob)
        matched=1
        [ "$ids" = "-" ] && break
        # shellcheck disable=SC2086  # deliberate: $ids is a space-separated gate list
        printf '%s\n' $ids
        break
        ;;
    esac
  done <<EOF
$(rule_table)
EOF
  [ "$matched" -eq 0 ] && printf '__umbrella__\n'
  return 0
}

# plan_gates < changed-paths — the gates to run, deduped and ordered as the gate
# table declares them, each line "<gate id>|<the changed path that selected it>".
plan_gates() {
  local selected path gate
  selected=""
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    for gate in $(gates_for_path "$path"); do
      if [ "$gate" = '__umbrella__' ]; then
        # Unmatched path: the umbrella is every gate in the table, attributed to
        # the path that earned it, so the run says WHY it went wide.
        for gate in $(gate_ids); do
          selected="$selected$gate|$path
"
        done
        break
      fi
      selected="$selected$gate|$path
"
    done
  done
  # Reorder into gate-table order and keep the first path that selected each gate.
  local id line
  for id in $(gate_ids); do
    line="$(printf '%s' "$selected" | grep "^$id|" | head -1)"
    [ -n "$line" ] && printf '%s\n' "$line"
  done
  return 0
}

# run_gate <id> <path> — run one gate; 0 = pass.
run_gate() {
  local want="$1" path="$2" id dir cmd
  while IFS='|' read -r id dir cmd; do
    [ "$id" = "$want" ] || continue
    printf '\n→ %s  (selected by %s)\n' "$id" "$path"
    ( cd "$dir" && eval "$cmd" )
    return $?
  done <<EOF
$(gate_table)
EOF
  printf 'verify: unknown gate "%s"\n' "$want" >&2
  return 1
}

# run_plan < plan-lines — run each planned gate, stopping at the first failure.
run_plan() {
  local id path rc=0
  while IFS='|' read -r id path; do
    [ -n "$id" ] || continue
    if ! run_gate "$id" "$path"; then
      printf '\n✗ verify: gate "%s" FAILED (selected by changed path %s) — blocking merge\n' "$id" "$path" >&2
      rc=1
      break
    fi
  done
  return $rc
}

main() {
  local mode="run"
  if [ "$#" -gt 0 ]; then
    case "$1" in
      --plan) mode="plan"; shift ;;
      --list-gates) gate_table; return 0 ;;
      --run) shift ;;
      -*) printf 'verify: unknown argument "%s"\n' "$1" >&2; return 2 ;;
    esac
  fi

  # The changed-file list: an explicit argument list wins (both modes), then a
  # piped list when planning, else the branch diff — what chief actually gates.
  local changed
  if [ "$#" -gt 0 ]; then
    changed="$(printf '%s\n' "$@")"
  elif [ "$mode" = "plan" ] && [ ! -t 0 ]; then
    changed="$(cat)"
  else
    : "${CHIEF_BASE_BRANCH:=main}"
    changed="$(git diff --name-only "$CHIEF_BASE_BRANCH"...HEAD)"
  fi

  if [ -z "$changed" ]; then
    echo "verify: no changed files — nothing to gate (allowing merge)"
    return 0
  fi

  local plan
  plan="$(printf '%s\n' "$changed" | plan_gates)"

  if [ -z "$plan" ]; then
    printf 'verify: %s changed file(s), none with a configured gate — passing fast\n' \
      "$(printf '%s\n' "$changed" | grep -c .)"
    return 0
  fi

  if [ "$mode" = "plan" ]; then
    printf '%s\n' "$plan" | cut -d'|' -f1
    return 0
  fi

  printf 'verify: gating %s changed file(s) with: %s\n' \
    "$(printf '%s\n' "$changed" | grep -c .)" \
    "$(printf '%s\n' "$plan" | cut -d'|' -f1 | tr '\n' ' ')"

  if printf '%s\n' "$plan" | run_plan; then
    echo ""
    echo "✓ verify: all selected gates green — allowing merge"
    return 0
  fi
  return 1
}

if [ "${CHIEF_VERIFY_LIB:-0}" = "1" ]; then
  # shellcheck disable=SC2317  # reached when sourced as a library
  return 0 2>/dev/null || exit 0
fi

main "$@"
