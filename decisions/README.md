# koine/decisions — Architecture Decision Records

The ADRs that record *why* the fabric is shaped the way it is. An ADR captures one decision — its
context, the choice, the alternatives rejected, and the consequences — and is **agnostic**: it
binds roles (producer / consumer / authority / host / provider), never a named product.

## The records

| ADR | Decision | Status |
|---|---|---|
| [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) | **Direct-dial peers, thin shared commons.** Data plane is direct peer-to-peer MCP/A2A with no central relay; the control plane is *route-by-lookup, not route-by-proxy* — a thin discovery registry that returns **addresses**, then peers dial each other. Fixes the two-routers rule (provider-router ≠ inter-participant router), the optional aggregator facade, and names the runtime-commons sibling that implements what koine specifies. | Accepted (2026-07-18) |
| [`ADR-0005-otio-canonical-timeline.md`](ADR-0005-otio-canonical-timeline.md) | **OpenTimelineIO is KMI's canonical timeline model.** Adopts the Academy Software Foundation's interchange format — which already ships the CMX3600 / `xmeml` / FCPXML adapters KMI listed as bespoke export targets — and demotes `application/vnd.koine.edl+json` to a legacy, deprecated form. Delimits what stays koine's **additive** layer over OTIO (content-addressed KINP asset ids, the asset-lineage graph, the analysis→KGP bridge), retains the asset-id ↔ path media map, and fixes the migration path. | Accepted (2026-08-02) |

## Why the numbering skips ADR-0002 – ADR-0004

This repo holds **contract shape**, not deployment instance data. The records above are the
agnostic, contract-level stances (*koine specifies, the runtime commons implements*), so they stay.
Three records in koine's original numbering — **ADR-0002 / 0003 / 0004** (bridge reconciliation, the
contract-layer consolidation, and the Erlang provider-router) — are **deployment-history** decisions
tied to a specific operator's rollout. They were moved to that operator's **private integration
repo**, which continues koine's ADR numbering.

So a citation of `ADR-0002`, `ADR-0003`, or `ADR-0004` refers to a document that is deliberately
**not in this repo** — there is no missing file here to link, by design (see
[`../CLAUDE.md`](../CLAUDE.md)). Those three numbers stay reserved; new agnostic ADRs take the next
free number **at or above 0005**, so nothing collides with the downstream sequence. New
ADRs added here must clear the same bar: if a decision would read the same for any other ecosystem,
it belongs here; if it names a particular deployment's topology or adoption program, it is instance
data and belongs downstream.
