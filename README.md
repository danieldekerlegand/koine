# Koine

> *koinē* (κοινή) — "the common tongue." A shared language that lets independent AI
> systems understand each other's identity, knowledge, and media without custom glue.

Koine is a set of **open specifications** — protocols, not programs. If you are building AI
systems that need to exchange data with each other (who an entity is, what is known about it,
the media that depicts it, the capabilities each system offers), Koine defines a common format
for all of it, so any two systems can interoperate without building a one-off bridge between
them. There is **no code here** — only the contracts that each system implements in its own
codebase.

## The problem it solves

Connect *N* systems pairwise and you write *N²* bespoke integrations — every new system has to
learn every other system's private format. Koine replaces that web of point-to-point bridges
with a single shared format that everyone reads from and writes to. A new participant learns
*one* set of contracts, not one per peer.

The concrete case Koine was built for is not one team's convenience. Its first implementers are
products of **two separate companies** — **Ontolo Labs** (multimedia analysis, insight, and
manipulation; video-capable small models) and **Overpowered Inc.** (trend-aware game IP,
agentically produced and tested, with lore held by a neuro-symbolic authoring runtime) — plus
independent tooling and personal projects. Those participants deliberately do **not** share a
codebase, a license posture, or a data-containment policy, and their products must still
interoperate: game QA sends media to a multimedia analyzer; a world authority ships training data
to a fine-tuning provider. Each of those edges crosses a company boundary. That is why Koine is a
contract rather than a library, why it is owned by neither side, and why every clause is written
against a *role* instead of a system.

## How it works: a shared format, not a hub

Koine is deliberately a **specification only**. It defines a shared namespace and shared data
shapes; the intelligence — and all the traffic — stays in the participating systems, which talk
to each other **directly**. Nothing is routed through a central server (there isn't one). The
guiding rule is *dumb pipes, smart endpoints*: keep the shared layer thin, keep the cleverness
at the edges.

## Core concepts

**Roles, not products.** Koine never names specific systems. Instead, a participant claims one
or more *roles*, and is bound only by the rules for the roles it claims. One real deployment is
usually several of these at once.

| Role | What it does |
|---|---|
| **Producer** | Publishes data into the shared format — claims, assets, worlds. |
| **Consumer** | Reads that data, taking in only what it's permitted to. |
| **Authority** | Holds the canonical record for some domain and answers questions about it. |
| **Host** | Runs the shared infrastructure — the discovery registry, access grants. |
| **Provider** | Offers a capability others can discover and call. |

## The protocols

Koine is six specifications, grouped by what they carry. Each is versioned independently and
ratified only after passing a concrete pressure test.

| Specification | In plain terms | Version | Status |
|---|---|---|---|
| [Identity & Namespace](specs/identity.md) (KINP) | How every entity gets a stable, shared name — the keystone the rest build on | 0.2.1 | ✅ ratified |
| [Grounding-Pack](specs/grounding-pack.md) (KGP) | How knowledge (facts, relationships, graphs) is exchanged | 0.5.1 | 🚧 candidate |
| [Media-Interchange](specs/media-interchange.md) (KMI) | How media (assets, edit lists, metadata) is exchanged | 0.3.0 | 🚧 candidate |
| [Capability-Bus](specs/capability-bus.md) (KCB) | How a system advertises a capability and another discovers and calls it | 0.3.0 | 🚧 candidate |
| [Conformance-Scenario](specs/conformance-scenario.md) (KCS) | A test format for proving an implementation is correct | 0.2.0 | ✅ ratified |
| [Fine-Tuning](specs/fine-tuning.md) (KFT) | How model fine-tuning is described across the above | 0.4.0 | 🚧 candidate |

Each spec's header is the authority for its current version and status. The path from
🚧 candidate back to ✅ ratified — which re-validations are outstanding and why — is tracked in
[`ROADMAP.md`](ROADMAP.md). For the shape-level map of the whole fabric these specs describe
(the topology principles, the protocol planes, and the informative pointer to known
implementations), see [`ECOSYSTEM.md`](ECOSYSTEM.md).

## Using Koine: how to conform

You adopt Koine in your *own* repository — there is nothing to install from here.

1. **Implement the specs for the roles you claim.** Honor the rules for those roles; ignore the rest.
2. **Validate against the schemas.** [`schemas/`](schemas/) is the machine-readable twin of the prose specs (JSON Schema) — check your data against it.
3. **Use the shared vocabularies.** Relation names, entity kinds, and media kinds come from [`registry/`](registry/). Extend it by adding a namespaced file, never by forking.
4. **Vendor with a drift gate.** If you copy a file from here, add a test that fails when your copy diverges — and propose changes as edits *here*, not in your copy.
5. **Publish your own self-description.** Your namespace, capability manifest, egress policy, and vocabulary mappings live in *your* repo and are served from *your* endpoints — there is no central config store. The [self-describing participant guide](docs/self-describing-participant.md) is the checklist.

### Joining as a fabric producer

If you already have an application with its own store, you do **not** build a bridge for each system
you want to reach. You write one **thin adapter** that translates your records into the shapes this
repo already specifies — knowledge as [KGP](specs/grounding-pack.md) claims over the shared
[relations](registry/), media as [KMI](specs/media-interchange.md) asset references and lineage,
training data as a [KFT](specs/fine-tuning.md) dataset *by reference*, and your capability manifest
on your [KCB](specs/capability-bus.md) AgentCard. Everything generic downstream of that — admission,
license and egress filtering, entity merge, the RDF/PROV/JSON-LD projections — is built once in the
runtime, not once per application. Grounding a record to a canonical entity is a `same_as` link, not
a new relation. [ADR-0008](decisions/ADR-0008-fabric-producer-adapter.md) records the pattern and
why per-application bridge and projection code is superseded by it.

## Learn by example

The best way to understand the protocols is to watch one work end to end:

- **[Capability-Bus walkthrough](docs/walkthrough-capability-bus.md)** — a provider advertises a
  capability, a consumer discovers it, and the two connect directly, with real message payloads.
- **[Self-describing participant guide](docs/self-describing-participant.md)** — the adopter
  checklist for the four things you publish about yourself (namespace, capability manifest, egress
  policy, vocabulary mappings), where each lives, and which spec fixes its shape. See
  [ADR-0007](decisions/ADR-0007-self-describing-participant.md) for why none of it is centralized.
- **[Pressure-test scenarios](scenarios/)** — the full end-to-end stories each spec must pass
  before it's ratified, including the four-participant media-transform scenario.

## How Koine relates to A2A, MCP, and existing standards

Koine is a **specification, not a runtime** ([agora](https://github.com/danieldekerlegand/agora)
is the runtime that implements it), and it layers *above* A2A and MCP rather than competing with
them — reusing them, and mature domain standards, for what they already do well, and adding only
the identity/knowledge/media/capability *meaning* those layers leave undefined. The full
positioning — the gaps it fills and exactly what it builds on — is in
**[`docs/positioning.md`](docs/positioning.md)**.

## Repository layout

| Path | Contents |
|---|---|
| [`specs/`](specs/) | The six protocol specifications — the authoritative contracts. |
| [`registry/`](registry/) | Shared vocabularies: relations, entity kinds, media kinds, enums. |
| [`schemas/`](schemas/) | Machine-readable twin of the specs (JSON Schema). |
| [`policy/`](policy/) | License-class and trust-tier policy — the two closed JSON vocabularies behind every record's `license` and `tier` fields, which consumers load to decide what a record is allowed to do. |
| [`scenarios/`](scenarios/) | End-to-end pressure tests that gate ratification. |
| [`decisions/`](decisions/) | Architecture Decision Records — the "why" behind the design. |
| [`docs/`](docs/) | Guides and positioning — the walkthrough, the adopter checklist, how Koine relates to existing standards. |
| `tasks/` | The repo's own work queue — machine-readable tasklists that drive spec/scenario work; process metadata, not part of the contracts. |
| [`ROADMAP.md`](ROADMAP.md) | Where each spec stands and the path from candidate to ratified. |
| [`ECOSYSTEM.md`](ECOSYSTEM.md) | The living, shape-level topology of the fabric (informative). |

## Scope: shape, not instance

Koine holds the **shape** of a contract and nothing else. *"A graph export has nodes and edges"*
is shape, and it lives here. *"This system's data maps onto that system's namespace"* is a
specific deployment's detail — it lives in that operator's own repo, never here. A new
participant needs only what's in this repository.

## License

Apache-2.0 — see [`LICENSE`](LICENSE).
