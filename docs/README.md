# koine documentation

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine

**koine** is the contracts source-of-truth for the ecosystem — the interchange protocols (KINP identity · KGP knowledge · KCB capability-bus · KMI media · KFT fine-tuning · KCS conformance), the shared relation registry, and the ADRs. It carries **no runtime code**: *koine specifies, agora implements*. It is a genuine interop contract **between two companies**, which is why its clauses are role-scoped and product-agnostic rather than fussy.

The map. Structured per the ecosystem documentation standard — `rosetta`'s
`docs/reference/documentation-standard.md`, cited as text rather than linked because a
reference out of this repo resolves for nobody who has only this one —
**a document not linked here does not exist**.

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
- [The federation fold — a disposition for each of MA-1…MA-11](reference/federation-fold-dispositions.md) — and, after the fold landed, what it does to promotability and what the pass taught about the shared federation pattern itself
- [The capability-versioning fold — a disposition for each of V-1…V-8](reference/capability-versioning-fold-dispositions.md) — the reasoning that decided each fold's *extent* before a clause moved, including the one alternative rejected on the record and the two remainders deferred with triggers; the fold itself landed at KCB 0.5.0
- [The generative-audio modalities — what `text-to-audio` and `audio-to-audio` are, and why both land](reference/generative-audio-modalities.md) — the decision behind KFT §3.1's two audio rows, taken axis by axis before a row was written: the media plane verified rather than asserted, the case *against* `audio-to-audio` stated and answered, what is deliberately not minted, and the three participants the rows are forward-declared for
- [Downstream notice — the KFT audio modalities, and what each mirror must do](reference/generative-audio-modalities-downstream.md) — the other half of publishing a closed vocabulary: what formant's `KftModality`, lugh's narrow-provider envelope and agora's general trainer + validator must each do to pick the two rows up, which of koine's four statements of the enum to vendor from, and the findings **AUD-1…AUD-6** a sibling repo's tasklist can cite — including a version pin four minors stale that this fold makes worse
- [Fold coordination — the federation fold read against the capability-versioning fold](reference/fold-coordination-federation-versioning.md) — eleven seams where a KCB 0.4.9 clause and a KCB 0.5.0 clause govern the same object, ten agreeing and one not ([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)); also the reference implementation read against the folded text, and the plain answer on whether KCB is promotable

## Explanation

*understanding-oriented — why it is this way*

- [Guide: publishing a self-describing participant](explanation/self-describing-participant.md)
