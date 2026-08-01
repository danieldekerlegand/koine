# Koine

> *koinē* (κοινή) — "the common tongue." A shared protocol layer that lets otherwise-
> independent neuro-symbolic systems speak to each other as one system.

Koine is the source-of-truth **contract fabric** for an agnostic neuro-symbolic ecosystem: the
protocols by which any conformant system publishes identity, knowledge, media, and capability,
and by which any other consumes them. It is a constitution, not a runtime — **no application
code lives here**, only the specs that participants implement in their own repositories.

The point is to collapse the N² integration problem. Participants aren't peers passing files
across bespoke edges; they are producers writing into, and consumers reading from, one shared
fabric. Design principle throughout: **dumb pipes, smart endpoints** — Koine defines a shared
namespace and shared contracts; intelligence stays in the endpoints, with no central
transform-gateway.

## Roles, not products

Koine is written against **roles**, never against named systems. A participant claims one or
more roles and is bound only by the clauses for the roles it claims. A single deployment is
usually several of these at once.

| Role | What it does |
|---|---|
| **Producer** | Writes into the fabric — claims, assets, worlds — under Koine identifiers. |
| **Consumer** | Reads from the fabric, ingesting only what its declared portability tier admits. |
| **Authority** | Holds the canonical record for a domain and answers resolution/reconciliation for it. A role, not a privileged node. |
| **Host** | Provisions the control plane — discovery registry, capability grants, orgs, infra. |
| **Provider** | Offers a capability on the bus and executes invocations against it. |

## The protocols

Six specs, carried across three planes plus the identity keystone that makes joins possible at
all. Each is versioned independently (see the doc header).

| Spec | Protocol | Plane | Status |
|---|---|---|---|
| [`specs/identity.md`](specs/identity.md) | Identity & Namespace (KINP) | keystone — shared namespace for every join | ✅ ratified |
| [`specs/grounding-pack.md`](specs/grounding-pack.md) | Grounding-Pack (KGP) | data — knowledge (facts / predicates / graph) | ✅ ratified |
| [`specs/media-interchange.md`](specs/media-interchange.md) | Media-Interchange (KMI) | data — media (assets, EDLs, metadata) | ✅ ratified |
| [`specs/capability-bus.md`](specs/capability-bus.md) | Capability-Bus (KCB) | control (orgs, infra, tools) over MCP / A2A | 🚧 candidate 0.3.0 |
| [`specs/conformance-scenario.md`](specs/conformance-scenario.md) | Conformance-Scenario (KCS) | test format for validating the above | ✅ ratified |
| [`specs/fine-tuning.md`](specs/fine-tuning.md) | Fine-Tuning (KFT) | a profile composing the four planes | ✅ ratified |

Each spec is validated by a pressure test in [`scenarios/`](scenarios/) before ratification. KCB
0.3.0 remains candidate pending re-validation of its AgentCard-extension manifest.

## How to conform

1. **Implement the spec in your own repo.** Adopt the roles you claim and honor the clauses for
   those roles — Koine specifies, you implement.
2. **Validate against the schemas.** [`schemas/`](schemas/) is the machine-readable twin of the
   prose specs (JSON Schema draft-2020-12); check your exports against them.
3. **Use the shared vocabularies.** Relations, entity kinds, media kinds, and enums come from
   [`registry/`](registry/) — extend by adding a namespaced domain file, not by forking.
4. **Vendor with a drift gate.** Cross-repo sharing is a byte-identical mirror plus a test that
   fails on drift — never a divergent fork. Propose contract changes here (a spec edit), not in
   your copy.

## Repository layout

| Path | Contents |
|---|---|
| [`specs/`](specs/) | The six protocol specs — the authoritative prose contracts. |
| [`registry/`](registry/) | Shared vocabularies: relations, entity/media kinds, enums. |
| [`schemas/`](schemas/) | Machine-readable twin of the specs (JSON Schema); validators + fixtures live downstream. |
| [`policy/`](policy/) | License-class and trust-tier policy. |
| [`scenarios/`](scenarios/) | End-to-end pressure tests that gate ratification. |
| [`decisions/`](decisions/) | Architecture Decision Records. |

## Design decisions

Rationale for the split (contracts here, runtime elsewhere) and the direct-dial control-plane
topology lives in [`decisions/`](decisions/).

## Scope — shape, not instance

Koine holds the **shape** of the contract and nothing else. "A canonical graph export has nodes
and edges" is shape, and it is here. "*This* producer's `depicts` edge lands on *that*
authority's namespace" is deployment **instance** data — as are topology, bridge tables, and
implementation records — and it is not. Those live in an operator's own private integration
repo. Nothing under `specs/`, `schemas/`, `registry/`, or `policy/` depends on such a repo: a
new participant needs only what is here.
