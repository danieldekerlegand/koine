# koine/decisions — Architecture Decision Records

The ADRs that record *why* the fabric is shaped the way it is. An ADR captures one decision — its
context, the choice, the alternatives rejected, and the consequences — and is **agnostic**: it
binds roles (producer / consumer / authority / host / provider), never a named product.

## The records

| ADR | Decision | Status |
|---|---|---|
| [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) | **Direct-dial peers, thin shared commons.** Data plane is direct peer-to-peer MCP/A2A with no central relay; the control plane is *route-by-lookup, not route-by-proxy* — a thin discovery registry that returns **addresses**, then peers dial each other. Fixes the two-routers rule (provider-router ≠ inter-participant router), the optional aggregator facade, and names the runtime-commons sibling that implements what koine specifies. | Accepted (2026-07-18) |
| [`ADR-0005-otio-canonical-timeline.md`](ADR-0005-otio-canonical-timeline.md) | **OpenTimelineIO is KMI's canonical timeline model.** Adopts the Academy Software Foundation's interchange format — which already ships the CMX3600 / `xmeml` / FCPXML adapters KMI listed as bespoke export targets — and demotes `application/vnd.koine.edl+json` to a legacy, deprecated form. Delimits what stays koine's **additive** layer over OTIO (content-addressed KINP asset ids, the asset-lineage graph, the analysis→KGP bridge), retains the asset-id ↔ path media map, and fixes the migration path. | Accepted (2026-08-02) |
| [`ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](ADR-0006-kgp-rdf-prov-jsonld-relationship.md) | **KGP keeps its bespoke canonical; the RDF-star / PROV / JSON-LD mapping becomes a specified projection.** Weighs aligning the KGP canonical with RDF 1.2 (RDF-star), W3C PROV, and JSON-LD against retaining TSV + the content-addressed claim hash, and retains — because the standards model *graphs*, while claim identity is a **byte** discipline they do not supply: dataset canonicalization hashes graphs (folding in the very annotations §3.1 excludes), and a JSON-LD context in the identity path fights offline-first minting. Pays the interop debt by fixing a lossless, round-trip-tested RDF-star/PROV/JSON-LD projection, and narrows KINP §9's "not adopting RDF" to *storage and identity*. | Accepted (2026-08-02) |
| [`ADR-0007-self-describing-participant.md`](ADR-0007-self-describing-participant.md) | **A participant is self-describing; its communication config lives at the edge.** Everything a peer needs in order to talk to a participant — its namespace + minting authority (KINP §3.4), its KCB capability manifest as the AgentCard extension (KCB §2), its egress policy (KGP §7.2), and its bridge/predicate mappings — is published by that participant, from its own repo and its own served endpoints. No central hub or shared config store holds it; the discovery registry returns an **address** to a self-description, never the self-description. Extends ADR-0001 (route-by-lookup, not route-by-proxy) to configuration, and is what lets a downstream participant hold its own config instead of depending on a shared store. | Accepted (2026-08-02) |
| [`ADR-0008-fabric-producer-adapter.md`](ADR-0008-fabric-producer-adapter.md) | **An application joins the fabric as a producer through a thin adapter.** The adapter only *translates* — local records into KGP claims over registry relations, KMI asset references + lineage, a KFT dataset **by reference**, and a KCB manifest on the AgentCard — while every generic data-plane bridge (admission, license/egress filtering, merge, the ADR-0006 projections, OTIO round-trips) is built once in the runtime commons. Per-application bridge and projection modules are **superseded**, generalizing KMI §4.3's withdrawal of `skill_export_*` and KINP §4.1's query-time merge view. Closes the grounding-relation fork: a mention→canonical assertion is a source-local-id **`same_as`** (or `based_on` across the §4.3 firewall), merged at query time — **no `mentions` relation is coined**. | Accepted (2026-08-06) |
| [`ADR-0009-capability-versioning-deprecation.md`](ADR-0009-capability-versioning-deprecation.md) | **Semver states intent, a content digest establishes identity.** Decides how a provider evolves a capability's schema without breaking subscribers — resolving KCB §7.2's fork (semver on capability names *vs* content-addressed schemas) by layering both: a capability is `(name, semver version)`, every port carries an algorithm-prefixed `schema_id` that makes a forgotten bump detectable, and a breaking change is published as a **successor alongside the predecessor**, never edited in place — the rule the immutable relation signature and content-addressed ids are already instances of. Fixes the subscriber-compatibility table, binds grants to a **major** so a breaking change cannot widen an issued token, keeps `cost` outside the digest but never silent (spend ceilings fail closed), and resolves KFT §11.5's inheritance: a finetuned model's pinned `kft_version` is an **archival** pin — retirement ends the obligation to emit or accept, never the ability to read. | Accepted (2026-08-13) |

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
