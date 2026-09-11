# koine documentation

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine

**koine** is the contracts source-of-truth for the ecosystem — the interchange protocols (KINP identity · KGP knowledge · KCB capability-bus · KMI media · KFT fine-tuning · KCS conformance), the shared relation registry, and the ADRs. It carries **no runtime code**: *koine specifies, agora implements*. It is a genuine interop contract **between two companies**, which is why its clauses are role-scoped and product-agnostic rather than fussy.

The map. Structured per the ecosystem documentation standard — `rosetta`'s
`docs/reference/documentation-standard.md`, cited as text rather than linked because a
reference out of this repo resolves for nobody who has only this one —
**a document not reachable from here does not exist**. *Reachable*, not *listed*: the
explanatory documentation under `docs/` is listed below one file at a time, and the
**published contract surface** — which is most of this repository, and is deliberately not
filed under `docs/` — is reached through its own index, each one named and linked in
[Outside `docs/`](#outside-docs-the-contract-surface-and-why-it-is-not-filed-here) below. Nothing
is left to be found by `grep`.

## Guides

*task-oriented — how to do one thing*

- [Walkthrough: a capability, end to end](guides/walkthrough-capability-bus.md)

## Reference

*information-oriented — what it is*

- [The layer claim — what koine specifies, what it does not, and where it stands](reference/layer-claim.md)
- [Koine in context: A2A, MCP, and existing standards](reference/positioning.md)
- [Upstream standards — what koine pins, and the drift check](reference/upstream-standards.md)
- [The six governance dimensions, mapped onto koine](reference/governance-taxonomy-map.md)
- [Implementability audit — what a third party receives, and what they cannot build from it](reference/implementability-audit.md)
- [Interop trial — a spec-only producer, and what the receiving side does with it](reference/interop-trial.md)
- [KGP §4.1 round-trip gate — what the downstream artifact actually delivers](reference/kgp-projection-gate-verification.md)
- [The KCS-encoding gate — what the downstream suite actually delivers](reference/kcs-encoding-gate-verification.md)
- [Promotability — what stands between each spec and `ratified`](reference/promotability.md)
- [Dead-code inventory — the candidates, and the search that found each one](reference/dead-code-inventory.md) — the artifact approved *before* anything is deleted: Class A the removal candidates, Class B the one duplicated implementation, Class C what looks unused and is not (and why each survived), plus the searches that came back empty so the next sweep does not repeat them
- [What the sweep could not decide — the undecidable register, and the limits of the method](reference/dead-code-undecidable.md) — the other half of the same sweep: the candidates no search inside this tree can resolve (23 schema properties whose reader is a downstream mirror, the scenario set held to set-equality by a test in another repo, 25 unreached keyword branches in a guard that implements a vocabulary rather than a corpus), the four limits of a static single-repo method, and the one inventory claim that was asserted instead of run
- [The federation fold — a disposition for each of MA-1…MA-11](reference/federation-fold-dispositions.md) — and, after the fold landed, what it does to promotability and what the pass taught about the shared federation pattern itself
- [The capability-versioning fold — a disposition for each of V-1…V-8](reference/capability-versioning-fold-dispositions.md) — the reasoning that decided each fold's *extent* before a clause moved, including the one alternative rejected on the record and the two remainders deferred with triggers; the fold itself landed at KCB 0.5.0
- [The generative-audio modalities — what `text-to-audio` and `audio-to-audio` are, and why both land](reference/generative-audio-modalities.md) — the decision behind KFT §3.1's two audio rows, taken axis by axis before a row was written: the media plane verified rather than asserted, the case *against* `audio-to-audio` stated and answered, what is deliberately not minted, and the three participants the rows are forward-declared for
- [Downstream notice — the KFT audio modalities, and what each mirror must do](reference/generative-audio-modalities-downstream.md) — the other half of publishing a closed vocabulary: what formant's `KftModality`, lugh's narrow-provider envelope and agora's general trainer + validator must each do to pick the two rows up, which of koine's four statements of the enum to vendor from, and the findings **AUD-1…AUD-6** a sibling repo's tasklist can cite — including a version pin four minors stale that this fold makes worse
- [Documentation drift — what was read against the tree, and what was wrong](reference/doc-drift-corrections.md) — the register of record for the documentation sweep, in two passes. **What was wrong:** every correction it made, with what the document said, what the tree says, and the date it stopped being true; the shape nearly all of them share (a restated fact whose home is elsewhere), and why most of the fixes **remove** the copy rather than refresh it. **What was superseded:** the retention sweep — the supersession test applied class by class to all 60 Markdown documents in this repository, the documents that look superseded and are deliberately not, and the eleven days in this repo's own history that show what deleting one costs. Plus what the sweep left alone on purpose, and what its method cannot claim
- [Fold coordination — the federation fold read against the capability-versioning fold](reference/fold-coordination-federation-versioning.md) — eleven seams where a KCB 0.4.9 clause and a KCB 0.5.0 clause govern the same object, ten agreeing and one not ([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)); also the reference implementation read against the folded text, and the plain answer on whether KCB is promotable
- [Tasklist ledger — every completed tasklist and the commit it merged as](reference/tasklist-ledger.md) — the RECORD, generated by `scripts/roadmap-ledger.sh` and never hand-edited between its markers, where [`ROADMAP.md`](../ROADMAP.md) is the PLAN: a row here says a tasklist merged, never that the capability behind it is finished, which is a claim only the roadmap makes

## Explanation

*understanding-oriented — why it is this way*

- [Guide: publishing a self-describing participant](explanation/self-describing-participant.md)

## Outside `docs/` — the contract surface, and why it is not filed here

*Every one of these is a document. None of them is under `docs/`, and that is a **declared
exception** to the ecosystem documentation standard rather than an oversight.*

**The reason, stated once.** These directories are the **published artefacts of the contract**, not
writing about it. Downstream repositories vendor `schemas/` and `registry/` by drift-gated copy;
every spec cites its siblings, the registry, the policy files and the ADRs **by relative path**; and
the ratification gate in [`../specs/README.md`](../specs/README.md#the-ratification-gate) is stated
in terms of those paths. Moving them under `docs/` would rewrite roughly 1,400 relative links inside
this repo and silently break every citation held outside it, in exchange for filing a normative
contract in a tree whose four categories (tutorial / how-to / reference / explanation) are about
teaching. The standard governs the **explanatory** documentation, and that is what `docs/` holds.

| Index | What it holds |
|---|---|
| [`../specs/README.md`](../specs/README.md) | The six normative protocol specs, plus the ratification gate they are held to. A spec's own header is the only authority on its version and status. |
| [`../scenarios/README.md`](../scenarios/README.md) | The adversarial pressure tests that gate ratification, the numbered deltas each one returned, and the register of downstream findings DR-1…DR-13. |
| [`../decisions/README.md`](../decisions/README.md) | Every ADR, with the full table. **The one home for the ADR list** — this page deliberately does not restate it, because a second copy of a table is a second thing to keep in step. |
| [`../registry/README.md`](../registry/README.md) | The shared agnostic vocabularies (TSV) — relations, entity types, media types, enums. Data, not prose. |
| [`../schemas/README.md`](../schemas/README.md) | The machine-readable twin of the prose specs (JSON Schema draft-2020-12), each with a golden fixture. |
| [`../policy/README.md`](../policy/README.md) | The license-class and trust-tier closed vocabularies. |

That is the whole set. The two remaining top-level directories hold **no Markdown at all** and so
fall outside this map by construction rather than by exception: [`../scripts/`](../scripts/) (the
guards — `.mjs`) and `tasks/` (the repo's own work queue — `.json`, process metadata, not contract).

Three more documents sit at the repository root, where a first-time reader looks for them:
[`../README.md`](../README.md) (what koine is and the repository layout),
[`../ROADMAP.md`](../ROADMAP.md) (where each spec stands and what its promotion waits on) and
[`../ECOSYSTEM.md`](../ECOSYSTEM.md) (the informative, shape-level topology).

## The standard's seven directories — what koine has, and what it does not

The standard names seven directories under `docs/`. koine has three of them populated, and the
absence of the other four is deliberate in each case:

| Directory | State |
|---|---|
| `guides/` · `reference/` · `explanation/` | Present and listed above. |
| `tutorials/` | **Empty — nothing written.** koine ships no runtime, so there is no thing to be walked through from zero; the closest artefact is the [capability-bus walkthrough](guides/walkthrough-capability-bus.md), which is task-oriented and correctly filed under `guides/`. Absent rather than stubbed: an empty tutorial directory would advertise a tutorial. |
| `runbooks/` | **Empty — nothing to operate.** A runbook is for a running system; koine is contracts only, and the one operational procedure it does define (run the guards under [`../scripts/`](../scripts/) after touching a doc, a schema or the registry) is stated in `CLAUDE.md` and executed by `.chief/verify.sh`, not by a person following steps. |
| `archive/` | **Created on first use — and as of 2026-09-03 nothing has used it.** That is now a checked statement rather than an assumption: every Markdown document in this repository — 60 files, 59 of them in scope, classified by kind because what would supersede a spec is not what would supersede the record of a run — was read against a stated supersession test, and none was found superseded, so nothing has been archived and nothing has been deleted ([the retention sweep](reference/doc-drift-corrections.md#the-retention-sweep-what-was-archived-and-what-only-looked-superseded), which also records the nine documents that look superseded and are not, and what happened to this repository the one time a document was deleted instead). When something is superseded it moves here with a note naming what replaced it and when — it is never deleted. |
| `decisions/` | **At the repository root, not under `docs/`** — see the exception above; the ADRs are contract surface cited by relative path from the specs. |
