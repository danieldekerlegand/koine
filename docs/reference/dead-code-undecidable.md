# What the sweep could not decide — the undecidable register, and the limits of the method

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine
>
> **Informative.** This document binds no clause. It is the third and last artifact of the
> dead-code sweep, after the [inventory](dead-code-inventory.md) and the removal pass it
> records. **Nothing named here was removed.** An honest *undecidable* list is a legitimate
> result of a sweep, and it is the only result that does not have to be re-derived next time.

The sweep removed 43 lines and kept everything else. This register covers the third
category — neither *dead* nor *demonstrably live*, but **not decidable by any search that
runs inside this tree**. Each entry names what could not be decided, the search that got as
far as it got, why it stops there, and — where one exists — **the observation that would
decide it**, so a future sweep inherits a route rather than a shrug.

The story that commissioned this named four mechanisms by which a thing can be reachable
without a static search seeing it. Measured against this tree, they do not divide evenly:

| Mechanism | Instances here | Where |
|---|---|---|
| A consumer **outside this repo** | **the dominant class** — 23 schema properties, 13 scenario files, 8 registry rows, 6 engine variables | [U-1](#u-1-23-property-names-declared-in-a-published-schema-and-named-nowhere-else-in-koine), [U-2](#u-2-the-scenario-set-and-the-set-equality-test-that-lives-in-another-repo), [U-3](#u-3-the-six-engine-variables-and-the-two-files-only-the-engine-reads) |
| **Reflection** over data-read keys | 25 of 56 keyword branches unreached; 1 of 3 tier values uninstantiated | [U-4](#u-4-25-of-56-keyword-branches-in-check-schemasmjs-and-why-that-number-decides-nothing) |
| **Dynamic dispatch** by string/glob | the gate and rule tables in `.chief/verify.sh` — **decided, and clean** | [What was decidable after all](#what-was-decidable-after-all) |
| **Generated code** | **zero** — no build step, no codegen, no generator anywhere in the tree | [U-5](#u-5-generated-code-the-search-that-found-nothing-to-be-undecided-about) |

That distribution is the finding, not an accident of this tree. koine is a contracts repo
whose entire purpose is to be consumed from outside itself
([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)), so its undecidability is
almost all of one kind: **the reader is elsewhere**.

## Contents

- [U-1 — 23 property names declared in a published schema and named nowhere else in koine](#u-1-23-property-names-declared-in-a-published-schema-and-named-nowhere-else-in-koine)
- [U-2 — the scenario set, and the set-equality test that lives in another repo](#u-2-the-scenario-set-and-the-set-equality-test-that-lives-in-another-repo)
- [U-3 — the six engine variables, and the two files only the engine reads](#u-3-the-six-engine-variables-and-the-two-files-only-the-engine-reads)
- [U-4 — 25 of 56 keyword branches in `check-schemas.mjs`, and why that number decides nothing](#u-4-25-of-56-keyword-branches-in-check-schemasmjs-and-why-that-number-decides-nothing)
- [U-5 — generated code: the search that found nothing to be undecided about](#u-5-generated-code-the-search-that-found-nothing-to-be-undecided-about)
- [The limits of the method](#the-limits-of-the-method)
- [What was decidable after all](#what-was-decidable-after-all)
- [One correction to the inventory](#one-correction-to-the-inventory)

---

## U-1 — 23 property names declared in a published schema and named nowhere else in koine

`schemas/*.schema.json` declares **125** distinct property names. Twenty-three of them are
named by no other file in the repo — not by a spec, not by a scenario, not by a README, not
by the guard that checks them:

```
$ node -e '<walk every schemas/*.schema.json, collect every key under "properties">'
125 distinct property names
$ for each: git grep -lF -- "$p" -- ':!schemas/' ':!tasks/chief/completed/' ':!.chief/state/'
23 with no hit
```

| Schema | Names with zero citations outside `schemas/` | Why the reader is outside |
|---|---|---|
| `canonical-world-export`, `canonical-graph-export` | `exportedAt`, `worldId`, `licenseNote`, `prologKb`, `predicateSchemaHash` | `CLAUDE.md`: *"`canonical-graph-export` is the neutral name the downstream runtime mirror uses too — keep the two identical."* The mirror is the consumer, and it is not in this tree. |
| `media-timeline` | `available_range`, `global_start_time`, `media_references`, `active_media_reference_key` | These are **OpenTimelineIO's own field names**, not koine's. KMI §4 adopts OTIO ([ADR-0005](../../decisions/ADR-0005-otio-canonical-timeline.md)); the schema is *a profile over* an OTIO document, so removing one is not a move koine is entitled to make. |
| `entity-grounding-snapshot` | `aliases`, `wikidata_qid`, `glottocode`, `iso639` | External identifier vocabularies. The citation koine could have is a prose example it never wrote; the citation that matters is a producer's payload. |
| `participant-self-description` | `agent_card`, `default_class`, `enforced_at`, `external_anchors`, `manifest_source`, `minting_authority`, `minting_rules`, `registry_optional`, `self_description_version`, `target_registries` | [ADR-0007](../../decisions/ADR-0007-self-describing-participant.md): *a participant is self-describing*. The document this schema constrains is **written by a participant and read by another participant** — neither is koine. A zero here is the design working. |

**All 23 stay, and the sweep records that it cannot do better than that.** The camelCase set
in the first row is the sharpest case: it is spelled unlike everything else in a snake_case
repo *because* it mirrors a runtime elsewhere, so the single strongest local signal that
something is foreign is also the reason it must not be touched. `prologKb` is worth naming
twice — this portfolio has already found a Prolog corpus reached by a path nobody found, and
this is that shape again.

**Re-running this search after this commit returns 0, and that is an artifact of writing it
down.** The table above names all 23, so a naive replay finds each one cited — by this
document. Measured, not predicted: with the register staged, the unmodified search returned
**1** (it had dropped `aliases`, which is how the omission above was caught) and returns **0**
once corrected. Any replay must exclude this file:

```
$ git grep -lF -- "$p" -- ':!schemas/' ':!tasks/chief/completed/' ':!.chief/state/'       ':!docs/reference/dead-code-undecidable.md'
```

A citation count is not evidence when the counter is inside the corpus. The same caveat
applies to `full-prolog` in [U-4](#u-4-25-of-56-keyword-branches-in-check-schemasmjs-and-why-that-number-decides-nothing)
and to every keyword name listed there.

**What would decide it:** a citation from the consuming repo, or a fixture. Two of the nine
schemas already have golden fixtures under `schemas/fixtures/`, and a fixture is exactly the
in-tree reader these names lack — it converts an undecidable name into a cited one at the
cost of one file. That is a *suggestion for whoever owns the schema*, not a finding against
it, and deliberately not work this tasklist does: minting fixtures is adding contract
surface, not paying down dead code.

## U-2 — the scenario set, and the set-equality test that lives in another repo

Thirteen files: `scenarios/README.md` plus twelve pressure tests. Whether any one of them is
live is decided **downstream**, and `CLAUDE.md` says so in as many words:

> *the downstream KCS encoding set is held to **set-equality** with `scenarios/*.md` by a test
> in the implementing repo; no guard in koine checks it, so a new scenario silently breaks
> that test.*

```
$ git ls-files scenarios/ | wc -l            # 13
$ git grep -ln 'set-equality\|set equality' -- ':!tasks/chief/completed/'
CLAUDE.md  scenarios/README.md  docs/reference/promotability.md
docs/reference/kcs-encoding-gate-verification.md  (+ 4 scenarios)
$ .chief/verify.sh --list-gates | grep -c scenario     # 0 — no gate covers scenarios/ as scenarios
```

`scenarios/README.md`'s **KCS encoding** column records that **nine of twelve** have an
encoding built and run downstream and **three do not** (findings DR-11, DR-12, DR-13, all
unowned). A static sweep over this tree cannot tell those three apart from dead scaffolding:
both look identical from here — a Markdown file that no encoding cites. The register of
record says they are a **pending obligation**, and that register is prose, not a check.

**All thirteen stay.** The asymmetry is what makes this entry belong here rather than in
Class C: the failure is not that a sweep might delete one, it is that a sweep **adding** one
also breaks the downstream test, with no local red light either way. This is the one place
in the tree where a *creation* is as dangerous as a deletion.

**What would decide it:** the set-equality assertion, mirrored here as a guard reading a
committed list of encoding ids. It cannot be written without the downstream repo's cooperation
(the ids live there), which is why [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)
puts it there — so this stays undecidable **by design**, not by omission.

## U-3 — the six engine variables, and the two files only the engine reads

`.chief/config` is *"sourced as bash by the engine"*. Nine of its ten lines are commented
defaults; the tenth, `CHIEF_TOOL=claude`, is live. Every name it defines has **zero readers
inside this tree**:

```
$ for v in CHIEF_TOOL CHIEF_TASKS_DIR CHIEF_STATE_DIR CHIEF_VERIFY CHIEF_AGENT_CONTEXT CHIEF_AUTO_MERGE; do
    git grep -lE "$v([^_]|\$)" -- ':!.chief/config' ':!.chief/state/' ':!tasks/chief/completed/'; done
(no output — 0 readers for all six)
```

Three things in `.chief/` are in the same position, and all three stay:

- **`.chief/agent-context.md`** — the one Markdown file of 59 that
  `check-doc-integrity.mjs`'s `DOC_DIRS` does not cover, and (per the inventory) the file with
  the fewest inbound references in the repo. It is a template the engine reads, so it is
  reachable by a path that is not a link. Zero inbound links is its *normal* state.
- **`CHIEF_BASE_BRANCH`** in the gate table's `--base "${CHIEF_BASE_BRANCH:-main}"`. The `:-main`
  default is exercised on every local run; the branch where the variable carries a value is
  taken only when an engine sets it. The sweep can see the fallback and never the other side.
- **`.chief/state/prd.json` and `progress.txt`** — tracked files written by the runtime, not
  by a citer. See [the correction below](#one-correction-to-the-inventory), which is about
  these two.

**What would decide it:** nothing available here. A commented-out default in `.chief/config`
is not dead code in the sense this sweep hunts — it is **published interface documentation for
an out-of-repo caller**, and the fact that it is expressed as shell comments is incidental.
A sweep that treats "0 readers in this repo" as "dead" deletes the contract and leaves the
implementation.

## U-4 — 25 of 56 keyword branches in `check-schemas.mjs`, and why that number decides nothing

`scripts/check-schemas.mjs` dispatches on keys read out of the data — `for (const [key, value]
of Object.entries(node))` at line 111, then `switch (key)` at line 129, with membership tests
against six vocabulary arrays. That is reflection: which branch runs is a property of the
corpus, not of the code. Replaying the walk over today's nine schemas:

```
$ node -e '<walk the 9 schemas, tally every key seen>'
KNOWN keyword branches:  56
occur in the 9 schemas:  31   ($comment $id $ref $schema description pattern title uniqueItems
                               const default enum examples required type additionalProperties
                               if items not propertyNames then allOf anyOf oneOf $defs properties
                               exclusiveMinimum maximum minItems minLength minProperties minimum)
occur in NO schema:      25   ($anchor $dynamicAnchor $dynamicRef contentEncoding contentMediaType
                               format deprecated readOnly writeOnly $vocabulary dependentRequired
                               contains else unevaluatedItems unevaluatedProperties prefixItems
                               dependentSchemas patternProperties exclusiveMaximum maxContains
                               maxItems maxLength maxProperties minContains multipleOf)
```

Two of the twenty-five carry hand-written validation, not just a table row — the
`dependentRequired` shape check and `patternProperties`' per-name regex compile. By the
narrow test they are unreached code in a live file, which is exactly Class A's shape.

**They stay, and the reason is that the number answers the wrong question.** The guard's
stated contract is the **draft-2020-12 vocabulary**, not this repo's nine documents: its whole
premise, in its own header, is that *a misspelled keyword is silently ignored, so the
constraint it means is absent*. `KNOWN` is what makes that check possible — a keyword absent
from the set is reported as a misspelling, so trimming `KNOWN` to today's 31 would make the
guard **reject** the first schema that legitimately used `maxItems`. The unreached branch and
the check that depends on it are the same object.

The same shape, smaller, twice more:

```
$ cut -f5 registry/relations.tsv registry/relations/*.tsv | sort | uniq -c
  20 grounding-only     9 horn-safe     0 full-prolog
```

`TIERS`' third value is instantiated by no row — and is defined by KGP §5, named in
`registry/README.md`, `schemas/README.md`, `provenance.schema.json` and four places in
`specs/grounding-pack.md`. It is published vocabulary with no local instance, the same
verdict as the inventory's [C-1](dead-code-inventory.md#c-1-registry-rows-nothing-in-this-repo-cites).
Likewise `kindOf`'s `registry/enums/<name>.tsv` branch generalizes over a directory holding
exactly one file.

**What would decide it:** a stated rule for guards, which this register proposes and does not
impose — *a guard that implements a published vocabulary is measured against the vocabulary,
never against the corpus.* Under it, U-4 stops being undecidable and becomes deliberately
unexercised, which is the [Class C](dead-code-inventory.md#class-c-looks-unused-is-not-do-not-delete)
verdict. It is filed here rather than there because deciding it takes a **judgement about
what the guard is for**, and no search returns that.

## U-5 — generated code: the search that found nothing to be undecided about

Of the four mechanisms the story names, one has **no instances in this tree**, and stating
that is the result rather than an omission:

```
$ git ls-files | grep -iE 'makefile|justfile|\.(mk|toml|ya?ml)$|package\.json|codegen|generate'
(no output)
$ git grep -n -iE '@generated|autogenerated|auto-generated|generated by|do not edit' \
    -- ':!tasks/chief/completed/' ':!.chief/state/'
LICENSE:114                      ("a display generated by the Derivative Works" — Apache 2.0 boilerplate)
docs/reference/kcs-encoding-gate-verification.md:66, scenarios/kcs-format-stress.md:102,
scenarios/kft-resume-checkpoint.md:140, tasks/chief/91-*.json:54   (all English prose)
```

There is no build step, no generator, no template expansion and no lockfile. Every tracked
file is hand-written and is the artifact itself. So no candidate anywhere in this sweep is
undecidable **because a generator would have re-created it**, and the next sweep can skip the
search rather than repeat it — until the day something adds one, at which point this paragraph
is the record of when that stopped being true.

## The limits of the method

Every search in the inventory and in this register is **static**, run over **tracked files**,
in **one repository**, at **one commit**. Four things follow, in descending order of how much
they have already cost this portfolio.

**1. Spatial — the consumer is in another repository, and that is the design.** koine
specifies; other repos implement ([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)).
`schemas/`, `registry/` and `policy/` are vendored downstream by drift-gated copy, and
`CLAUDE.md` names the mirror obligation explicitly for `canonical-graph-export`. So for the
entire published surface, `git grep` over koine answers a question nobody asked: *does koine
cite its own contract?* A no is the expected answer for a vocabulary that exists to be used
elsewhere. This is the failure mode with the worst record — `docs/studioos`, cited by 93
files, was called dead once — and it is why [U-1](#u-1-23-property-names-declared-in-a-published-schema-and-named-nowhere-else-in-koine)
and [C-1](dead-code-inventory.md#c-1-registry-rows-nothing-in-this-repo-cites) are refusals
to decide rather than deletions.

**2. Temporal — a search answers for the commit it runs at, and koine schedules conventions
before the tree has them.** This is not a hypothetical: A-3, the `docs/archive/` skip, was
deleted on this branch and restored, because the convention that needs it is written into
`tasks/chief/901-docs-tell-the-truth.json` — a tasklist that had not run yet. Grepping the
active tasklists is now part of every deadness search here, and it is a **partial** fix: it
sees work that is scheduled, and cannot see work that is intended and unwritten. Full write-up:
[what step 3 cost](dead-code-inventory.md#what-step-3-cost-and-why-the-cost-was-worth-paying).

**3. Reflective — a `switch` over keys read from data has no static call graph.** The
inventory's reachability counts are exact for the corpus they ran over and say nothing about
the code's contract. [U-4](#u-4-25-of-56-keyword-branches-in-check-schemasmjs-and-why-that-number-decides-nothing)
is 25 branches of this; the shell equivalent is `.chief/verify.sh`'s glob-matched rule table,
which happens to come out clean today ([below](#what-was-decidable-after-all)) but comes out
clean by measurement, not by construction.

**4. Semantic — the searches measure citation, and the question is obligation.** Every
technique used here counts references. Nothing in it can see that a file is load-bearing
because a *human* rule says so: that a relation's signature is immutable once published, that
an archived document must keep its stale links, that a completed tasklist must not be
rewritten. Each of those makes a zero-citation file undeletable for a reason no grep will ever
return, and each was recovered by reading `CLAUDE.md`, not by searching. **A sweep of this
repo that did not read the conventions would have deleted things this one kept.**

One thing the method is good at, stated so the limits are not read as a disclaimer: it is
exact about **absence within its scope**. "No `package.json` exists", "no rule names a
non-existent gate", "0 of 65 tracked JSON files carry a `repo` key" are complete answers, and
three of the four Class A removals rested on exactly that kind.

## What was decidable after all

Recorded here so a future sweep does not file them as undecidable on the strength of the word
*dispatch*. `.chief/verify.sh` selects gates by matching a changed path against a glob table
and looking gate ids up in another table — dynamic dispatch by string, no static call graph.
It resolves completely:

```
$ CHIEF_VERIFY_LIB=1 . .chief/verify.sh
$ comm -23 <(gate_table | cut -d'|' -f1 | sort) \
           <(rule_table | grep -v '^#' | cut -d'|' -f2 | tr ' ' '\n' | sort -u)
(empty — all 6 gate ids are named by at least one rule)

$ each rule glob vs `git ls-files`:
.chief/* → 6   scripts/* → 5   tasks/* → 50   schemas/*.schema.json → 9
schemas/fixtures/*.json → 3   registry/*.tsv → 7   *.md → 59   LICENSE → 1   .gitignore → 1
(no glob matches zero tracked paths)
```

Both directions are clean, and `.chief/verify-test.sh` asserts the second one already. The
tasklist **category** vocabulary resolves the same way — `CATEGORIES` lists four, the two live
tasklists use two, and all four appear across the 46 completed records, so nothing is
uninstantiated once history is counted as a target.

## One correction to the inventory

[C-4](dead-code-inventory.md#c-4-skipdir-skipext-in-check-doc-linksmjs) says of
`check-doc-links.mjs`'s `SKIP_DIR`: *"`/.chief/state/` is gitignored so `git ls-files` never
returns it."* **That is wrong**, and the sweep asserted it instead of running it:

```
$ git check-ignore -v .chief/state/prd.json     # no output — NOT ignored
$ git ls-files | grep '\.chief/state'
.chief/state/prd.json
.chief/state/progress.txt
```

`.gitignore` does carry `.chief/state/`, but both files were tracked before that rule existed
and an ignore rule does not untrack. So `git ls-files` **does** return them and the skip is
live: it removes two files from the scan that between them carry 8 bare `docs/…` citations
(replayed `BARE_DOC` over both: 8 found, **0** dead today). The verdict does not move —
**keep** — but the class does: `/.chief/state/` is *deliberately unexercised* in the same
sense as the other two skips beside it, not inert. Gating a live runtime log against today's
tree would make every finished run's note a merge blocker.

The lesson is the one this whole tasklist keeps arriving at from different directions: **an
assertion about tooling behaviour is a search that was not run.** It cost nothing to run and
it was wrong.

## See also

- [Dead-code inventory — the candidates, and the search that found each one](dead-code-inventory.md)
  — Classes A, B and C, the removal pass, and the retraction
- [`decisions/ADR-0001`](../../decisions/ADR-0001-control-plane-topology.md) — why the consumer
  is in another repository
- [`decisions/ADR-0007`](../../decisions/ADR-0007-self-describing-participant.md) — why a
  participant, not koine, reads `participant-self-description`
- [Promotability — what stands between each spec and `ratified`](promotability.md) — where the
  three encoding-less scenarios of [U-2](#u-2-the-scenario-set-and-the-set-equality-test-that-lives-in-another-repo) are tracked
