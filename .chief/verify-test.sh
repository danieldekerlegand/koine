#!/usr/bin/env bash
# .chief/verify-test.sh — tests for the .chief/verify.sh merge gate.
#
# A dispatch table that is read but never run is a guess. Two things are asserted
# here, and they fail for different reasons:
#
#   1. DISPATCH — `--plan` resolves the gates for a synthetic changed-file list
#      and prints them, running nothing. Cheap, hermetic, and the reason the
#      path→gate mapping is checkable rather than merely readable.
#   2. THE RUNNER'S CONTRACT — a red gate must BLOCK. That is the whole point of
#      a merge gate and the one property a dispatch test cannot show, so it is
#      exercised against a swapped-in FAKE gate table through verify.sh's
#      CHIEF_VERIFY_LIB=1 sourcing seam: the real main(), no real guard.
#
# .chief/verify.sh selects this test itself whenever a branch touches .chief/.
set -uo pipefail

# The umbrella runs every gate in the table, this one included. Re-entering the
# self-test from inside itself would recurse, so the flag makes the inner run a
# no-op — see the verify-selftest row of the gate table.
export CHIEF_VERIFY_INNER=1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERIFY="$REPO_ROOT/.chief/verify.sh"
PASS=0
FAIL=0

ok()   { printf '  %-52s PASS\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '  %-52s FAIL\n' "$1"; FAIL=$((FAIL + 1)); }

# plan_is <name> <expected gates, space separated> -- <changed paths...>
plan_is() {
  local name="$1" expected="$2" got
  shift 2
  [ "${1:-}" = "--" ] && shift
  got="$(cd "$REPO_ROOT" && "$VERIFY" --plan "$@" 2>&1 | tr '\n' ' ')"
  got="$(printf '%s' "$got" | sed -e 's/  */ /g' -e 's/^ //' -e 's/ $//')"
  if [ "$got" = "$expected" ]; then
    ok "$name"
  else
    bad "$name"
    echo "    expected: [$expected]"
    echo "    got:      [$got]"
  fi
}

ALL_GATES="guard-doc-integrity guard-doc-links guard-categories verify-selftest"

echo "verify-test: dispatch (.chief/verify.sh --plan)"

plan_is "a spec edit → the two documentation gates" \
  "guard-doc-integrity guard-doc-links" -- \
  specs/capability-bus.md

plan_is "Markdown anywhere → the documentation gates" \
  "guard-doc-integrity guard-doc-links" -- \
  README.md decisions/ADR-0009-capability-versioning-deprecation.md docs/guides/walkthrough-capability-bus.md

plan_is "a tasklist edit → the category gate only" \
  "guard-categories" -- \
  tasks/chief/80-chief-verify-gate-wiring.json

plan_is "a guard script → the guards themselves" \
  "guard-doc-integrity guard-doc-links guard-categories" -- \
  scripts/check-doc-integrity.mjs

plan_is "the gate itself → this self-test" \
  "verify-selftest" -- \
  .chief/verify.sh

plan_is "no-gate path → nothing selected, passes fast" \
  "verify: 1 changed file(s), none with a configured gate — passing fast" -- \
  LICENSE

# The default that makes the gate safe to leave alone. koine's schemas and its
# shared registry are vendored downstream by drift-gated copy, so a file class
# with no rule must cost the world, not nothing.
plan_is "an unruled path (registry) → the umbrella, every gate" \
  "$ALL_GATES" -- \
  registry/relations.tsv

plan_is "an unruled path (schemas) → the umbrella, every gate" \
  "$ALL_GATES" -- \
  schemas/grounding-pack.schema.json

plan_is "mixed diff → the union, in gate-table order" \
  "guard-doc-integrity guard-doc-links guard-categories" -- \
  tasks/chief/80-chief-verify-gate-wiring.json specs/identity.md

plan_is "one unruled path in a mixed diff still widens it" \
  "$ALL_GATES" -- \
  README.md policy/license-classes.json

# ── Execution: does a red gate actually BLOCK the merge? ──────────────────────
# The tests above prove the right gates are SELECTED. These prove the RUNNER's
# contract: any gate failure exits non-zero, an all-green plan exits 0, and a
# failure stops the rest of the plan. They run the real main() with both tables
# swapped for cheap fakes, so no real guard is invoked.
TMPDIR_TEST="$(mktemp -d -t verify-test)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT

# run_fake <gate-table lines> <rule-table lines> <changed paths...>
run_fake() {
  local gates="$1" rules="$2"
  shift 2
  cat >"$TMPDIR_TEST/harness.sh" <<HARNESS
CHIEF_VERIFY_LIB=1 . "$VERIFY"
gate_table() { cat <<'GATES'
$gates
GATES
}
rule_table() { cat <<'RULES'
$rules
RULES
}
main --run "\$@"
HARNESS
  ( cd "$TMPDIR_TEST" && bash "$TMPDIR_TEST/harness.sh" "$@" 2>&1 )
}

# exec_is <name> <expected exit code> <gate table> <rule table> -- <paths...>
exec_is() {
  local name="$1" want="$2" gates="$3" rules="$4" out rc
  shift 4
  [ "${1:-}" = "--" ] && shift
  out="$(run_fake "$gates" "$rules" "$@")"
  rc=$?
  if [ "$rc" -eq "$want" ]; then
    ok "$name"
  else
    bad "$name"
    echo "    expected exit: $want, got: $rc"
    printf '    output: %s\n' "$out"
  fi
  LAST_OUT="$out"
}

echo ""
echo "verify-test: execution (.chief/verify.sh --run, fake gate table)"

exec_is "a red gate → exits NON-ZERO (blocks the merge)" 1 \
  'red|.|false' \
  'fixture/*|red' -- \
  fixture/thing.md

case "$LAST_OUT" in
  *'gate "red" FAILED'*'fixture/thing.md'*) ok "the red run names the gate + the changed path" ;;
  *) bad "the red run names the gate + the changed path"; printf '    output: %s\n' "$LAST_OUT" ;;
esac

exec_is "a green gate → exits 0 (allows the merge)" 0 \
  'green|.|true' \
  'fixture/*|green' -- \
  fixture/thing.md

exec_is "an unruled path runs the fake umbrella, red included" 1 \
  'green|.|true
red|.|false' \
  'other/*|green' -- \
  unruled/thing.txt

exec_is "the first failure stops the plan" 1 \
  'first|.|false
second|.|touch ran-second' \
  'fixture/*|first second' -- \
  fixture/thing.md

if [ -e "$TMPDIR_TEST/ran-second" ]; then
  bad "later gates do not run after a failure"
  echo "    the gate after the failing one still ran"
else
  ok "later gates do not run after a failure"
fi

# ── The real gate, end to end ─────────────────────────────────────────────────
# No fakes: the actual guards over an actual changed-file list. Only paths with a
# NARROW rule are used — an unruled path would select the umbrella, and the
# umbrella contains this self-test.
echo ""
echo "verify-test: the real gate"

if (cd "$REPO_ROOT" && "$VERIFY" --run tasks/chief/80-chief-verify-gate-wiring.json >/dev/null 2>&1); then
  ok "a tasks-only diff runs the real guard and exits 0"
else
  bad "a tasks-only diff runs the real guard and exits 0"
fi

# ── Gate commands: standalone, and nothing that lives only in the hook ────────
# A gate whose command is inline shell is a check a developer cannot run, which
# is how a hook and a working tree drift apart. Every gate must name a script
# that exists in the repo and is runnable by hand with the same command.
echo ""
echo "verify-test: gate commands (runnable standalone)"

while IFS='|' read -r id dir cmd; do
  [ -n "$id" ] || continue
  script="$(printf '%s\n' "$cmd" | grep -oE '(scripts|\.chief)/[A-Za-z0-9_.-]+\.(mjs|sh)' | head -1)"
  if [ -n "$script" ] && [ -f "$REPO_ROOT/$dir/$script" ]; then
    ok "$id runs a script that exists"
  else
    bad "$id runs a script that exists"
    echo "    command names no runnable repo script: [$cmd]"
  fi
done <<EOF
$(cd "$REPO_ROOT" && "$VERIFY" --list-gates)
EOF

echo ""
echo "verify-test: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
