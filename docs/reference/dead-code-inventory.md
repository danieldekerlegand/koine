# Dead-code inventory — the candidates, and the search that found each one

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine
>
> **Informative.** This document binds no clause. It is the artifact a human approves
> *before* anything is deleted, and the record that stops the next sweep re-litigating
> the same files.

koine is a contracts repo — "dumb pipes, smart endpoints", no runtime code
([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)). The executable surface is
therefore small and entirely made of **guards**: five Node scripts under `scripts/`, the
merge gate `.chief/verify.sh`, and its test `.chief/verify-test.sh`. Everything else in the
tree is either prose (57 Markdown files), a published machine-readable asset
(`schemas/`, `registry/`, `policy/`), or Chief's own tasklist records under `tasks/`.

That shape decides what a sweep can find here. There are no unreferenced modules, no
unimported dependencies, and no feature flags — there is no `package.json`, no lockfile, and
no third-party code at all. What there *is*: **one duplicated implementation**, and a set of
**imported branches that cannot fire in this tree** inside a guard that was copied in from a
sibling repo.

## Contents

- [The method, and what it was run over](#the-method-and-what-it-was-run-over)
- [Class A — dead: removal candidates](#class-a-dead-removal-candidates)
- [Class B — duplicated implementations](#class-b-duplicated-implementations)
- [Class C — looks unused, is not: do not delete](#class-c-looks-unused-is-not-do-not-delete)
- [What was searched and came back empty](#what-was-searched-and-came-back-empty)

---

## The method, and what it was run over

Every search below is a command, run from the repo root on **2026-09-03** at
`chief/900-dead-code-paydown`. A candidate list without its method is unreviewable, so each
finding names the command that produced it and the scope that command covered.

The corpus, measured rather than assumed:

```
$ git ls-files | wc -l                                  # 140 tracked files
$ git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -rn
  65 json   57 md   7 tsv   5 mjs   2 sh   1 txt   1 LICENSE   1 gitignore
$ ls package.json                                        # none — no dependency graph to sweep
```

Two scoping rules used throughout:

- **`tasks/chief/completed/` is excluded as a citer.** A merged tasklist records what was
  true when it ran; it is history, and a reference count that includes it measures the past.
  It is *not* excluded as a target.
- **A registry row, a schema `$def`, a policy class and a relation name are contract
  surface, not code.** They are vendored downstream by drift-gated copy, so "nothing in this
  repo cites it" is not evidence of deadness. They appear in
  [Class C](#class-c-looks-unused-is-not-do-not-delete), never in Class A.

---

## Class A — dead: removal candidates

All four are inside `scripts/check-doc-links.mjs`. That file was not written for koine — it
was carried in from a sibling repo (`87c9aa9 verify: gate merges on documentation link
integrity`) with its host repo's exceptions attached, and its own comments name
`cuneiform`, `argos`, `studio-os`, `insimul` and `engine/quality.sh`, none of which exist
here. The guard itself is **live and must stay** — `.chief/verify.sh` selects it as
`guard-doc-links`, and it is the only thing in the tree that checks the 8 bare `docs/…`
citations in non-Markdown files (see [Class B](#class-b-duplicated-implementations)). What
follows is dead *within* a live file.

### A-1 — `EXCEPT_DIRS`, and the file it reads has never existed

`scripts/check-doc-links.mjs:42-53` (comment + IIFE) and its only use at line 81.

```
$ ls docs/.structure-exceptions
ls: docs/.structure-exceptions: No such file or directory
$ git log --oneline --all -- docs/.structure-exceptions
                                        # 0 commits — never existed, on any branch
```

`readFileSync` throws, the `catch` returns `[]`, and `EXCEPT_DIRS.some(...)` is a no-op on
every one of the 140 tracked files. The comment explaining it describes a generator
(`cuneiform` emitting `argos` and `studio-os`) that koine does not have and, per
[ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), cannot acquire.

### A-2 — `IGNORE`, and the file it reads has never existed

`scripts/check-doc-links.mjs:55-60` and its only use at line 80.

```
$ ls docs/.linkignore
ls: docs/.linkignore: No such file or directory
$ git log --oneline --all -- docs/.linkignore
                                        # 0 commits — never existed, on any branch
```

Same shape as A-1: an allowlist read from a file that is not there, so the guard has never
allowlisted anything. Note that koine's stated position is that there is **no allowlist for
a private-repo link** (`scripts/check-doc-integrity.mjs:13-14`), so a working `docs/.linkignore`
would be a contradiction, not a convenience.

### A-3 — the `docs/archive/` skip

`scripts/check-doc-links.mjs:70-75` (5 lines of comment + 1 of code).

```
$ ls -d docs/archive
ls: docs/archive: No such file or directory
$ git log --oneline --all -- docs/archive
                                        # 0 commits — never existed, on any branch
$ git grep -rn 'docs/archive' -- ':!scripts/'
                                        # no hits: no convention, no README, no ADR
```

koine has no archive convention. The comment argues a policy ("an archived doc records a
past state") that no document in this repo asserts and that
[`docs/README.md`](../README.md) — the map, whose rule is *a document not linked here does
not exist* — has no section for.

**Judgement to make at removal time:** A-3 is the one candidate here whose deletion would
matter if the convention were later adopted. It is cheap to re-add and free to keep. It is
listed because the sweep's standard is "names the search that found nothing", and this
search found nothing three ways.

### A-4 — the cross-repo `foreign` walk

`scripts/check-doc-links.mjs:98-117` (4 lines of comment + 15 of code) and its use at line 119.

The block parses every tracked `.json` file looking for objects that carry a `repo` or
`owner` key naming a *different* repo, and exempts `docs/…` strings underneath them.

```
$ git grep -lE '"(repo|owner)"[[:space:]]*:' -- '*.json' | wc -l
0                                        # of 65 tracked JSON files, none carries either key
```

`foreign` is therefore always an empty `Set`, and the `foreign.has(...)` guard at line 119
never fires. Two things make this worse than merely inert:

1. **It spawns a subprocess per JSON file.** `execFileSync('git', ['rev-parse',
   '--show-toplevel'])` at lines 104-105 runs inside the per-file loop — 65 spawns per gate
   run, to compute a value that is then never compared against anything.
2. **The value it computes is wrong in a worktree.** `--show-toplevel` returns the
   *worktree* path, so `own` reads `900-dead-code-paydown`, not `koine`. Every Chief run
   executes this guard from a worktree. The bug is invisible only because the branch is
   unreachable — which is exactly the failure mode this tasklist exists to retire.

The comment names `insimul`'s contract files as the forcing case. koine has no such files.

---

## Class B — duplicated implementations

Two implementations of one behaviour is the failure mode that costs most later, because they
drift. There is exactly one in this tree, and it is load-bearing on both sides, so it is a
finding to **record and decide**, not an automatic deletion.

### B-1 — relative Markdown link resolution, implemented twice

| | `scripts/check-doc-integrity.mjs` | `scripts/check-doc-links.mjs` |
|---|---|---|
| gate id | `guard-doc-integrity` | `guard-doc-links` |
| gate kind | **wall** (count is already zero) | **ratchet** vs `$CHIEF_BASE_BRANCH` |
| link regex | `MD_LINK`, line 34 | `MD_LINK`, line 38 |
| file discovery | `readdirSync` over 8 `DOC_DIRS` | `git ls-files`, whole tree |
| Markdown files reached | 56 | 57 (adds `.chief/agent-context.md`) |
| relative links checked | 1384 | 1371 |
| also checks `#anchor` targets | **yes** | no — fragment is stripped |
| also checks bare `docs/…` paths | no | **yes** — 8 in non-Markdown files |
| also checks the status mirrors | **yes** | no |

Measured with:

```
$ node scripts/check-doc-integrity.mjs | head -1
  56 markdown files, 1384 relative links checked
$ node scripts/check-doc-links.mjs
  dead references   0  (0 distinct targets)
```

…and, for the split between shared and unique work, a script that replays each guard's own
regex and skip rules over `git ls-files` (`MD_LINK` / `BARE_DOC` from
`check-doc-links.mjs:38-39`).

**What is genuinely duplicated:** 1371 of `check-doc-links`'s 1371 Markdown-link checks are
also performed by `check-doc-integrity`, more strictly — the latter additionally resolves the
`#anchor`, and errors on a link that escapes the repo where the former silently skips it.
Both walk the same `[text]` + `(path)` form with near-identical regexes and both call
`existsSync`.

**What is not:** `check-doc-links` alone checks **bare `docs/…` paths in non-Markdown files**
— 8 citations across `.chief/verify-test.sh` and the two active tasklists
`tasks/chief/91-*.json` and `tasks/chief/92-*.json`. `check-doc-integrity` does not read those
file types at all. That is the whole of `guard-doc-links`'s unique value today, and it is
real: a tasklist naming a doc that has been moved is precisely the rot the pairing
`901-docs-tell-the-truth` will create most of.

**Disposition:** the duplication is real and the two guards will drift. Merging them is a
*behaviour* change to the merge gate (a ratchet and a wall have different failure
semantics), so it is out of scope for a removal sweep and is recorded here as a finding
rather than a deletion. If it is ever taken: the answer is to fold `BARE_DOC` into
`check-doc-integrity` and retire `check-doc-links` whole, not to unify the regexes.

### B-2 — the fourth status mirror, restated in prose and checked by nothing

Not a duplicated *implementation* but the same drift risk, and it is already stated in
[`CLAUDE.md`](../../CLAUDE.md): the spec version/status appears in four places, and
`check-doc-integrity` checks three.

```
$ node scripts/check-doc-integrity.mjs | sed -n '2,7p'
  capability-bus         0.5.0  candidate
  ...
$ grep -c 'MIRRORS' scripts/check-doc-integrity.mjs   # 'README.md', 'specs/README.md', 'ECOSYSTEM.md'
```

The fourth — the *Current state* prose in `CLAUDE.md` — is unchecked and a stale version
there passes CI. **Not a removal candidate**; recorded so the sweep does not "simplify" the
prose mirror away on the theory that the guard covers it. It does not.

---

## Class C — looks unused, is not: do not delete

This class exists on purpose. Deleting any of it removes a stated contract, and the record
of *why each survived* is worth more than the deletions.

### C-1 — registry rows nothing in this repo cites

```
$ for f in registry/relations.tsv registry/relations/*.tsv; do
    tail -n +2 "$f" | cut -f1 | while read -r r; do
      [ "$(git grep -lF "$r" -- ':!registry/' | wc -l)" -eq 0 ] && echo "$r"
    done
  done
descended_from   caused_by   cine:scene_of   media:mentions   soc:employed_by   soc:resides_in

$ tail -n +2 registry/media-types.tsv | cut -f1 | while read -r r; do
    [ "$(git grep -lF "$r" -- ':!registry/' | wc -l)" -eq 0 ] && echo "$r"; done
application/vnd.koine.model+coreml   application/vnd.koine.model+tflite
```

Eight rows with zero in-repo citations. **All eight stay.** `registry/` is a published
vocabulary that downstream repos vendor by drift-gated copy; the consumers are outside this
tree by construction. And per `CLAUDE.md`, *a relation's signature is immutable once
published* — changing one means minting a new name, so removal is not an available move at
all. The relevant guard is `scripts/check-registry.mjs`, which checks the rows are
well-formed; nothing checks, or should check, that koine's own prose uses them.

### C-2 — the `tasks/chief/completed/` skip in `check-doc-links.mjs`

`scripts/check-doc-links.mjs:76-79`. Structurally identical to [A-3](#a-3-the-docsarchive-skip),
and the opposite verdict, because the search comes back differently:

```
$ ls -d tasks/chief/completed
tasks/chief/completed                    # exists — 45 records
```

It currently hides **0** dead citations (replayed `BARE_DOC` over the 45 completed records:
every `docs/…` path in them still resolves), so it is *deliberately unexercised*, not dead.
It fires the moment a doc moves, and rewriting a merged tasklist would falsify the work
record. Keep.

### C-3 — `--json`, `--strict` and `--list` on the guards

```
$ git grep -n -- '--json'   | grep -v '^scripts/'      # no hits
$ git grep -n -- '--strict' | grep -v '^scripts/'      # no hits
$ git grep -n -- '--list\b' | grep -v '^scripts/'      # only --list-gates, which IS used
```

Four scripts accept `--json`; `check-tasklist-categories.mjs` accepts `--strict`;
`check-doc-links.mjs` accepts `--list`. Nothing in the tree passes any of them, with one
exception: `check-doc-links.mjs` invokes **itself** with `--json` inside the ratchet
(line 136), so that one is exercised.

**All stay.** These are flags a developer sets by hand, not flags that *can no longer be
set* — the distinction this tasklist draws. `--strict` in particular is documented in
`check-tasklist-categories.mjs`'s header as the affordance for "a CI job that wants it",
i.e. an out-of-repo consumer. Removing them would break a human's debugging path to buy
nothing.

### C-4 — `SKIP_DIR` / `SKIP_EXT` in `check-doc-links.mjs`

`scripts/check-doc-links.mjs:36-37`. None of `/node_modules/`, `/target/`, `/.venv/`,
`/dist/`, `/build/` exists here, `/.chief/state/` is gitignored so `git ls-files` never
returns it, and:

```
$ git ls-files | grep -icE '\.(png|jpg|jpeg|gif|pdf|svg|ico|woff2?|gz|zip|lock)$'
0
```

Two inert one-line constants. **Keep**: they are two array literals, they are correct, and
they cost one `.some()` per file. Deleting them trades zero maintenance for a real risk the
day someone checks in an image.

### C-5 — `schemas/fixtures/*.json`

Each fixture is cited by exactly the guard that checks it. That is code a test exercises,
which the tasklist's own definition puts outside "dead". Verified:

```
$ node scripts/check-schemas.mjs | head -1
  9 schemas, 278 schema positions, 80 $refs, 3 fixtures checked
```

---

## What was searched and came back empty

Recorded so the next sweep does not repeat them.

| Search | Command | Result |
|---|---|---|
| Orphan Markdown (no inbound reference) | inbound-reference count per `*.md`, excluding `completed/` and self | **0 orphans**; lowest is `.chief/agent-context.md` (Chief's own template, read by the engine, not by a link) |
| Orphan schema files | `git grep -lF <basename>` per `schemas/*.json` | **0** — every schema and fixture is cited, min 1, max 20 |
| Unreferenced `$defs` in `schemas/` | walk all 9 schema documents, collect every `$ref`, diff against declared `$defs` | **0 of 10** `provenance.schema.json` defs unreferenced; 27 distinct `$ref` targets (80 occurrences), all resolving |
| Duplicated subschemas across `schemas/` | canonicalize every subschema >120 chars across the 9 documents, group identical ones | **1 group**, and it is a repeated *description string* on two positions that already share their constraint via `$ref` to `provenance.schema.json#/$defs/egress` — not a duplicated implementation |
| Orphan entity types / enum tokens | citation count per row, excluding `registry/` | **0** — every `entity-types.tsv` row and every `enums/modality.tsv` token is cited outside the registry |
| Commented-out code kept "just in case" | `grep -nE '^\s*(//\|#)\s*(const\|let\|function\|if\|for\|node \|echo )'` over `scripts/*.mjs .chief/*.sh` | **0** — the one hit is prose inside a comment paragraph |
| Unimported dependencies | `ls package.json` | **none exists** — no dependency graph, no third-party code |
| Unreachable branches in `.chief/verify.sh` | every mode (`--plan`, `--run`, `--list-gates`, bare) traced to a caller | **0 dead** — all four are exercised by `.chief/verify-test.sh` |
| Guard scripts nothing runs | `git grep -ln <name> -- ':!scripts/' ':!tasks/chief/completed/'` | **0 dead** — all five are rows in `.chief/verify.sh`'s gate table, and `verify-test.sh` asserts each row names a script that exists |

**One limit worth stating here, ahead of the undecidability register:** every search above is
static and scoped to this tree. koine's whole purpose is to be consumed from outside it, and
this portfolio has already been bitten by exactly that mistake. C-1's eight registry rows are
the clearest case — a static search over koine can prove only that *koine* does not cite
them.

## See also

- [Promotability — what stands between each spec and `ratified`](promotability.md)
- [`decisions/ADR-0001`](../../decisions/ADR-0001-control-plane-topology.md) — why there is no
  runtime code here to sweep
