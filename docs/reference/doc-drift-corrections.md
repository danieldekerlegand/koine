# Documentation drift — what was read against the tree, and what was wrong

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine · **Informative**

**This document binds no clause.** It is the record of one sweep: every document in this repository
read against the tree it describes, and the corrections that pass produced. Where it and a spec
disagree the spec wins and this file is the bug.

It exists because **a silently fixed document teaches nobody why it drifted**. Each entry below
states what the document said, what the tree says, when it stopped being true, and — where there is
one — the structural reason it went stale without anyone noticing. That last column is the useful
one: five of the six corrections have the same shape.

**The half a link-checker cannot do.** `scripts/check-doc-integrity.mjs` and
`scripts/check-doc-links.mjs` were green before this sweep and are green after it, and were green
on every day each defect below was live. Every one of these documents parsed, linked and resolved
perfectly while describing something the tree no longer held. That is the whole reason this pass is
done by reading rather than by running.

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

### The shape they share

Five of the six are the **same defect**: a document that restates a fact whose home is somewhere
else, and then does not move when the home does.

- C-1 restated a count the three status tables already carry and a guard already checks.
- C-2 restated the spec's own §2 example.
- C-3 and C-4 restated directory contents — and both were **right when written**, which is the
  point: a correct count is a defect with a fuse on it.
- C-6 restated the contents of `scripts/` and `schemas/`.

Only **C-5** is a plain omission rather than a stale copy.

That is why four of the six fixes **remove the copy** rather than refresh it. C-1 now holds no
count at all and points at the tables; the root README's `docs/` row points at `docs/README.md`
instead of listing three of its documents. A restatement refreshed is a restatement that will go
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

The honest summary is narrower than "the docs are true": **six specific claims that disagreed with
the tree were found by reading, and are now corrected and dated.**
