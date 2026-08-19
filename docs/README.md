# koine documentation

> **Status:** Current · **Updated:** 2026-08-18 · **Owner:** koine

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

## Explanation

*understanding-oriented — why it is this way*

- [Guide: publishing a self-describing participant](explanation/self-describing-participant.md)
