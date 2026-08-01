# koine/decisions — Architecture Decision Records

The ADRs that record *why* the fabric is shaped the way it is. An ADR captures one decision — its
context, the choice, the alternatives rejected, and the consequences — and is **agnostic**: it
binds roles (producer / consumer / authority / host / provider), never a named product.

## The records

| ADR | Decision | Status |
|---|---|---|
| [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) | **Direct-dial peers, thin shared commons.** Data plane is direct peer-to-peer MCP/A2A with no central relay; the control plane is *route-by-lookup, not route-by-proxy* — a thin discovery registry that returns **addresses**, then peers dial each other. Fixes the two-routers rule (provider-router ≠ inter-participant router), the optional aggregator facade, and names the runtime-commons sibling that implements what koine specifies. | Accepted (2026-07-18) |

## Why only ADR-0001 is here

This repo holds **contract shape**, not deployment instance data. ADR-0001 is the one agnostic,
contract-level stance (*koine specifies, the runtime commons implements*), so it stays. The later
records in koine's original numbering — **ADR-0002 / 0003 / 0004** (bridge reconciliation, the
contract-layer consolidation, and the Erlang provider-router) — are **deployment-history** decisions
tied to a specific operator's rollout. They were moved to that operator's **private integration
repo**, which continues koine's ADR numbering.

So a citation of `ADR-000N` for **N ≥ 2** refers to a document that is deliberately **not in this
repo** — there is no missing file here to link, by design (see [`../CLAUDE.md`](../CLAUDE.md)). New
ADRs added here must clear the same bar: if a decision would read the same for any other ecosystem,
it belongs here; if it names a particular deployment's topology or adoption program, it is instance
data and belongs downstream.
