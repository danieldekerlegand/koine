# Documentation drift — what was read against the tree, and what was wrong

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine · **Informative**

**This document binds no clause.** It is the record of one sweep in two passes: every document in
this repository read against the tree it describes — first for **what was wrong** (the corrections
below), then for **what was superseded** (the [retention
sweep](#the-retention-sweep-what-was-archived-and-what-only-looked-superseded), which decides what
moves to `docs/archive/` and what stays where it is). Where it and a spec disagree the spec wins and this
file is the bug.

It exists because **a silently fixed document teaches nobody why it drifted**. Each entry below
states what the document said, what the tree says, when it stopped being true, and — where there is
one — the structural reason it went stale without anyone noticing. That last column is the useful
one: six of the seven corrections have the same shape.

**The half a link-checker cannot do.** `scripts/check-doc-integrity.mjs` and
`scripts/check-doc-links.mjs` were green before this sweep and are green after it, and were green
on every day each defect below was live. Every one of these documents parsed, linked and resolved
perfectly while describing something the tree no longer held. That is the whole reason this pass is
done by reading rather than by running.

**The second pass asks a different question.** Not *is this document true* but *is this document
still the current answer* — and the two are independent, because a document can be accurate in
every particular and still have been replaced. The rule it applies is the standard's:
**nothing is deleted; a superseded document moves to `docs/archive/` with a note naming what
replaced it and when.** What that pass found is below, along with the price this repository has
already paid, once, for the other policy.

---

## The corrections

| # | Document | What it said | What the tree says | Wrong since |
|---|---|---|---|---|
| **C-1** | [`layer-claim.md`](layer-claim.md) §2 | *"two of the six are ratified, four are candidate"* | One — KGP 0.5.2. The page now states **no count** and points at the machine-checked tables and [`promotability.md`](promotability.md). | **2026-08-20** |
| **C-2** | [`../guides/walkthrough-capability-bus.md`](../guides/walkthrough-capability-bus.md) Step 1 | An AgentCard with a top-level `"url"` | A2A **v1.0** has no top-level `"url"`; addresses are `supported_interfaces[]` entries of `AgentInterface{ url, protocol_binding }` ([KCB §1.1, §2](../../specs/capability-bus.md)) | **2026-08-13** (KCB 0.4.2) |
| **C-3** | [`implementability-audit.md`](implementability-audit.md) §1 | `scenarios/` = **7** Markdown files; `decisions/` = **8** ADRs (0001, 0005–0011) — **both correct on 2026-08-18**, the day it was written | **12** and **11** (0001, 0005–**0014**) | **2026-08-20** / **2026-08-23** |
| **C-4** | [`implementability-audit.md`](implementability-audit.md) IMP-16 | *"one ratified format spec (KCS 0.2.0) and seven prose pressure tests"* | KCS **0.3.0**, `candidate`; **twelve** pressure tests | **2026-08-20** |
| **C-5** | [`../../README.md`](../../README.md) *Repository layout* | Eight directories and two root files; **no `scripts/` row**. `docs/` described as three documents. | `scripts/` is a top-level directory holding the five guards. `docs/` holds the reference set, and its own README is the map. | **from the table's first draft** |
| **C-6** | [`../../CLAUDE.md`](../../CLAUDE.md) *Conventions* / `schemas/` | Four guards named; eight of nine schemas named | Five guards (`check-doc-links.mjs` was unnamed); nine schemas (`participant-self-description.schema.json` was omitted) | **from each addition** |
| **C-7** | [`dead-code-inventory.md`](dead-code-inventory.md), opening paragraph | *"Everything else in the tree is either prose (**57** Markdown files)"* — correct on the morning of 2026-09-03, when the dead-code sweep wrote it | **60** tracked Markdown files (59 outside `.chief/`). The sentence now carries **no count**: the number was incidental to the point it was making. | **2026-09-03, the same day** — armed by *this* sweep's own additions |

### The shape they share

Six of the seven are the **same defect**: a document that restates a fact whose home is somewhere
else, and then does not move when the home does.

- C-1 restated a count the three status tables already carry and a guard already checks.
- C-2 restated the spec's own §2 example.
- C-3 and C-4 restated directory contents — and both were **right when written**, which is the
  point: a correct count is a defect with a fuse on it.
- C-6 restated the contents of `scripts/` and `schemas/`.
- C-7 restated a file count that `git ls-files` holds — and it was armed by **this sweep's own
  additions**, hours after it was written. It is the cleanest demonstration in the register that a
  *correct* number is a defect with a fuse on it, and the shortest fuse yet observed here.

Only **C-5** is a plain omission rather than a stale copy.

That is why five of the seven fixes **remove the copy** rather than refresh it. C-1 now holds no
count at all and points at the tables; the root README's `docs/` row points at `docs/README.md`
instead of listing three of its documents; C-7's sentence makes its point — *everything that is not
a guard is prose or a published asset* — without counting anything. A restatement refreshed is a restatement that will go
stale again on the next change, and this repository already pays for four version/status mirrors
that a guard has to hold together.

Where a restatement is **kept** it is kept for a stated reason. The walkthrough still shows a full
manifest, because a walkthrough that says *"see §2"* teaches nothing — and it now says in writing
that it illustrates the spec's example, including that its `kcb_version` deliberately still reads
`0.3.0` to match it. That is a restatement with its direction declared: if the two disagree, the
spec wins and the walkthrough is the bug.

---

## What the code sweep left behind — checked, and the answer is nothing

The tasklist this sweep belongs to depends on [`900-dead-code-paydown`](dead-code-inventory.md)
deliberately, so that documentation of removed code is corrected once rather than written twice.
That sweep removed **43 lines from one file** — `scripts/check-doc-links.mjs`: `EXCEPT_DIRS`,
`IGNORE`, and the cross-repo `foreign` walk. It removed no schema, no registry row, no policy value,
no clause and no public command; `--json`, `--ratchet`, `--base` and `--list` all still parse, and
the guard's observable output is identical either side.

So the question is narrow: **does any document describe those three removed branches as live?**

```
$ git grep -c 'EXCEPT_DIRS\|linkignore\|structure-exceptions' -- '*.md'
docs/reference/dead-code-inventory.md:11   # 11 hits, one file — the record OF the removal
```

Nothing else in the tree mentions them, and the inventory's hits are the removal record itself,
which describes them in the past tense on purpose. There was no third document to correct. The one
consequence the sweep *did* leave for this pass is **C-6**: with `check-doc-links.mjs` edited and
re-argued, `CLAUDE.md` naming four guards out of five became conspicuous.

---

## Scope, and what this sweep did not touch

- **`ROADMAP.md` is out of scope by the tasklist's own instruction**, which reconciles it
  portfolio-wide on its own evidence standard. One drift was found there and is **reported, not
  fixed**: `ROADMAP.md`'s Phase 0 paragraph reads *"That count is **0 of 6**"*, which was true from
  2026-08-23 and stopped being true on **2026-08-28** when KGP 0.5.2 was ratified. It disagrees with
  [`promotability.md`](promotability.md), with the three status tables, and with the spec header
  that governs both. It is exactly the class `CLAUDE.md` warns about — *"prose all over the repo
  that **counts** statuses"* — and it belongs to whoever next moves a status.
- **No normative surface was touched.** No file under `specs/`, `schemas/`, `registry/` or
  `policy/` changed in this pass, no spec version moved, and no clause moved. The corrections are
  confined to `docs/`, the root `README.md` and `CLAUDE.md`.
- **[`upstream-standards.md`](upstream-standards.md) was read but not edited.** It is the *table of
  record* for external pins, and `CLAUDE.md` states the rule: a difference found on a drift check
  opens a **finding**, never a silent prose update. Checking those pins against their upstreams is a
  drift check, not a documentation sweep, and this pass did not run one.
- **[`governance-taxonomy-map.md`](governance-taxonomy-map.md) was read but not edited.** It names
  its measurement basis explicitly — *"Measured 2026-08-18 against KINP 0.2.1 · KGP 0.5.2 · KCB
  0.4.4 · KMI 0.3.2 · KCS 0.2.0 · KFT 0.5.0"* — so its versions are the record of when the
  measurement was taken, not a claim about today. Refreshing them would destroy the only thing that
  makes the finding checkable. A **re-measurement** against current headers is real work and is not
  this sweep.

---

## The retention sweep — what was archived, and what only looked superseded

The standard says a superseded document **moves to `docs/archive/` with a note naming what replaced
it and when**, and is never deleted. Applying that rule means first answering a question no guard
asks: *which documents are superseded?* This pass answered it for all **60** tracked Markdown files.

**The answer is none.** Nothing was archived, nothing was deleted, and `docs/archive/` still does
not exist. That is a result rather than an omission — but it is only worth anything if the method is
stated, so it is.

### The method

**Supersession is not staleness.** A document is superseded when *something else is now the answer
to the question it was written to answer* — which is a different test from "is it accurate", and a
different test again from "is it recent". A dated record of a pass can be years old, describe
versions that have all moved since, and still be the only answer to its question.

So the test is applied per class, because what would replace a spec is not what would replace a
record of a run:

| Class | Files | What supersession would look like | Found |
|---|---|---|---|
| **Normative contract surface** — the six specs plus the index READMEs of [`specs/`](../../specs/README.md), [`registry/`](../../registry/README.md), [`schemas/`](../../schemas/README.md), [`policy/`](../../policy/README.md) | 10 | A spec is superseded when it is **withdrawn, or replaced by another spec**. A version bump is not supersession: the header moves and the document stays. | **None.** All six planes are live, each spec header is the authority on its own version, and no plane has been retired. |
| **Decision records** — the eleven ADRs plus [`decisions/README.md`](../../decisions/README.md) | 12 | An ADR is superseded when a **later ADR reverses or replaces the decision** — and even then the convention is to mark it *in place*, because the record of a decision that was later reversed is the most valuable kind there is. | **None.** Every ADR reads `Accepted`. The two amended ones say so in as many words — ADR-0005: *"Nothing here supersedes, reverses, or re-opens the adoption"*; ADR-0006 the same — and ADR-0014 *"contradicts neither"*. [ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md) does supersede three **spec clauses** as the decision source; a clause is not a document. |
| **Dated evidence** — the twelve pressure tests plus [`scenarios/README.md`](../../scenarios/README.md), and the thirteen records under `docs/reference/` | 26 | **Not superseded by construction.** A record of what was observed on a date cannot be replaced by a later observation; the later one is a *second* record. Its claims can be **overtaken** — that is what the date is for — and the document stays. | **None** — and this is the class most likely to be archived by mistake, because *overtaken* reads like *superseded*. The sharpest cases are below. |
| **Living maps** — [`../../README.md`](../../README.md), `ROADMAP.md`, [`../../ECOSYSTEM.md`](../../ECOSYSTEM.md), [`../../CLAUDE.md`](../../CLAUDE.md), [`docs/README.md`](../README.md), [`promotability.md`](promotability.md), [`upstream-standards.md`](upstream-standards.md) | 7 | Superseded when **another document becomes the map** — the fate of a page edited in place until something replaces it wholesale. | **None.** Each is the single home for what it holds, and the first pass above reduced to one home every case where two of them could disagree. |
| **Teaching documents** — [`../guides/walkthrough-capability-bus.md`](../guides/walkthrough-capability-bus.md), [`../explanation/self-describing-participant.md`](../explanation/self-describing-participant.md), [`positioning.md`](positioning.md), [`layer-claim.md`](layer-claim.md) | 4 | Superseded when a **newer document teaches the same thing better** — the only class where two documents genuinely compete for one reader. | **None.** The one overlapping pair is deliberate and declared: `positioning.md` opens by saying `layer-claim.md` *"states the same position in one page … This document is the long form."* Two lengths of one argument, with the relationship written down, is not the duplication the first pass was hunting. |
| Process metadata — `.chief/agent-context.md` | 1 | Out of scope: harness configuration, not documentation of the contracts. | — |

### What looks superseded and is not

This is the half worth writing down. **Nine** documents in this tree would fail a naive freshness
test, and three more are absent from it altogether; not one of them is stale — each is either
history, or somewhere else on purpose:

| Document | Why it looks superseded | Why it stays, unchanged |
|---|---|---|
| [`capability-versioning-fold-dispositions.md`](capability-versioning-fold-dispositions.md) | Written **before** the fold it reasons about. KCB 0.5.0 landed on 2026-08-26 and the spec now states every disposition normatively. | It answers a question the spec does not: **why each fold stopped where it did**, including the shape-registry alternative rejected on the record and the two remainders deferred with triggers. The page already says this of itself — *"retained as the reasoning that decided each fold's extent, not as a record of the spec's state."* Archive it and the next fold re-litigates it. |
| [`federation-fold-dispositions.md`](federation-fold-dispositions.md) | Same shape: eleven deltas, all folded since, three specs moved. | Same reason, and it is **cited by four of the six specs** — [KINP](../../specs/identity.md) alone five times, as the record carrying DEFER-A's and DEFER-B's forcing triggers. A document a normative spec cites by relative path is not archivable while the citation stands; moving it would be a link change in `specs/`, which is a spec edit. |
| [`interop-trial.md`](interop-trial.md) | Findings INT-1…INT-11 taken on 2026-08-18, against specs that have moved several versions each since. | It is the record of **one trial on one day**, and the only place the six forks it found are written down. Its findings can be overtaken; overtaking them is a re-run, which is real work and is not a documentation sweep. |
| [`governance-taxonomy-map.md`](governance-taxonomy-map.md) | Its measurement pins six spec versions, five of which have moved. | Those versions **are** the record of when the measurement was taken. Refreshing them destroys the only thing that makes the finding checkable — already stated under *Scope* below, and it is the same argument. |
| [`implementability-audit.md`](implementability-audit.md) | Audit findings from 2026-08-18; three ADRs and five scenarios have appeared since. | Its **counts** were corrected in the first pass (C-3, C-4) because a count claims to describe today. Its **findings** were not, because they claim to describe 2026-08-18. The two halves of one document are treated differently on purpose. |
| [`dead-code-inventory.md`](dead-code-inventory.md) · [`dead-code-undecidable.md`](dead-code-undecidable.md) | The sweep they belong to is finished and merged. | The inventory is what stops the next sweep re-litigating the same files; the undecidable register hands it a route instead of a shrug. Both are *forward-looking* documents that happen to be written in the past tense. |
| [`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md) · [`kcs-encoding-gate-verification.md`](kcs-encoding-gate-verification.md) | Both gates are now resolved — KGP was promoted on 2026-08-28. | Each records a claim that was **believed and found false**. The reason KGP's ratification can be trusted is that this record exists and says how the artifact was read and perturbed at a named sha. Deleting the evidence would leave the promotion resting on an assertion again, which is the exact failure the record exists to prevent. |
| ADR-0002 · ADR-0003 · ADR-0004 | Absent from the tree, and cited by number in several places. | Not superseded — **relocated**. They were moved to the operator's private integration repo on 2026-07-31 as deployment instance data, the numbers stay permanently reserved, and [`decisions/README.md`](../../decisions/README.md) carries the note saying so. Archiving a copy here would reintroduce the instance data `CLAUDE.md` keeps out. |

### The price of the other policy, already paid here

The tasklist behind this sweep says archival costs nothing and deletion costs a great deal. This
repository does not have to take that on faith — it did it once:

```
$ git log --diff-filter=AD --name-status --date=short --pretty=format:'%h %ad %s' -- ECOSYSTEM.md
2e228c6 2026-08-11 docs: recreate ECOSYSTEM.md — the public shape-level living topology
A	ECOSYSTEM.md

4ed42e1 2026-07-31 feat: US-2 - Move the project-specific instance data + deployment docs to rosetta
D	ECOSYSTEM.md

a1938a0 2026-07-17 Ratify KGP 0.2.0; add KCB control-plane spec, relation registry, ECOSYSTEM
A	ECOSYSTEM.md
```

`ECOSYSTEM.md` was deleted on **2026-07-31** as instance data, and was needed again **eleven days
later**. It was not restored — it was **rewritten**. The deleted file ran 159 lines under eight
numbered sections (*The five projects*, *The stack*, *Identity is the keystone*, *Repository
topology & OSS boundary*, *Adoption sequence*, *Spec status*, …); the replacement runs 166 lines
under seven differently-titled ones, and comparing the two line by line returns **no line in
common**. The one thing that visibly survived is a **single paragraph** in the new §6, recording
that the old §6's submodule-and-published-packages guidance *"is superseded"* — a summary of a
document, standing in for the document.

The honest qualification: it was never *unrecoverable*. `git show 4ed42e1^:ECOSYSTEM.md` prints it
in full today. What it stopped being is **reachable** — nothing in the tree names it, no link
points at it, and the replacement shares not one line with it, which is what a rewrite from scratch
looks like whether the old text was never opened or opened and discarded. That distinction, between
recoverable and reachable, is the whole of what the archive rule buys: `git log` loses nothing and
surfaces nothing.

---

## What this sweep cannot claim

It cannot claim the documentation is now true. Documentation correctness is not machine-checkable in
general, and the method here was one reader comparing prose to a tree — which finds a count that
disagrees with `ls` and an example that disagrees with its spec, and does not find a paragraph whose
*reasoning* has quietly stopped applying. Specifically not verified:

- **No spec prose was re-read against its own clauses.** Six specs, tens of thousands of words of
  normative text with internal cross-references, are outside this pass entirely.
- **No external pin was checked against its upstream** (see above).
- **The audit findings in [`implementability-audit.md`](implementability-audit.md) were not
  re-derived.** Its counts are corrected; IMP-1…IMP-19 were not re-run against three ADRs and five
  scenarios that did not exist when they were written. Some may have been answered since. This
  document does not say which.
- **Reachability is not readability.** Every document is linked and every link resolves; that says
  nothing about whether the set is *findable* by someone who does not already know what they want.

And on the retention half specifically:

- **"Nothing is superseded" is a judgement, not a measurement.** No guard computes it and none
  could: the test is *has something else become the answer to this document's question*, and that is
  read, not run. What is checkable is stated above — every ADR's `Accepted` status, every spec
  header, the declared relationship between the one overlapping teaching pair — and the rest is one
  reader applying a stated test to 60 files.
- **Supersession from outside this repository would not have been caught.** The test was applied
  within the tree. If a sibling repo now publishes the current answer to a question a document here
  answers, this pass had no way to see it — and koine deliberately holds no dependency on those
  repos, so there is nothing here to check against.
- **Banner accuracy was not re-verified.** All 20 files under `docs/` read `Status: Current`, and
  this pass asked whether any had been *replaced* — not whether each banner's `Status` and `Updated`
  fields match the content beneath them. A document can be current, correct in its banner, and still
  contain a paragraph nobody has re-read since it was written.
- **The archive mechanism is untested.** The rule is now written down in two places and nothing has
  ever exercised it. The first document archived here will be the first use of the note format, the
  first update to `docs/README.md`'s `archive/` row, and the first time the guards see a link into
  `docs/archive/`.

The honest summary is narrower than "the docs are true": **seven specific claims that disagreed with
the tree were found by reading and are now corrected and dated; and of 60 documents examined against
a stated supersession test, none was found superseded, so nothing was archived and nothing was
deleted.**
