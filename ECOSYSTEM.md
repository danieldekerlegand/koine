# The Ecosystem

**Status:** Living document · **Last updated:** 2026-07-17

The single, authoritative topology for the five-project ecosystem. It supersedes the partial
topology docs scattered across the projects (Pinakes `ECOSYSTEM_TOPOLOGY.md`, Argos
`TOPOLOGY.md`, and the two `LINGUASCRAPE_SYNC_PLAN.md` copies in Insimul and Argos) — those
should be reduced to stubs pointing here.

---

## 1. The five projects

Each is a distinct product; together they share one neuro-symbolic research spine (reconciling
LLMs/statistical models with symbolic/GOFAI).

| Project | One-liner | Location |
|---|---|---|
| **Insimul** | Hybrid-AI fictional worlds → games in any genre/platform, run by a Prolog core. | `~/Development/workspace` |
| **Pinakes** | Global neuro-symbolic knowledge web + visualizations; the grounding data layer. | `~/Development/pinakes` |
| **Cuneiform** | Company-as-Code: templated agentic organizations + self-hosted infra. | `~/Development/cuneiform` |
| **Argos** | Any-to-any multimedia ingestion, neuro-symbolic KBs, and manipulation. | `~/Development/argos` |
| **Formant** | AI-built audio plugins/instruments, ultimately played agentically. | `~/Development/formant` |

---

## 2. The thesis: a fabric, not a mesh of pipes

The projects are **not peers passing files across N² bespoke edges**. They are producers of,
and consumers from, **one shared neuro-symbolic fabric**. There is no "Insimul → Pinakes"
pipe; there is Insimul *writing worlds into the fabric* and Pinakes being the fabric's
canonical store. The fabric **is** the interconnect, collapsing N² integration into
"write-to-fabric / read-from-fabric."

Guiding principle throughout: **dumb pipes, smart endpoints.** Koine defines shared contracts
and a shared namespace; intelligence stays in the projects. No central transform-gateway (the
ESB / distributed-monolith trap).

### 2.1 Three planes

| Plane | Carries | Owner / transport | Contract |
|---|---|---|---|
| **Control** | agent orgs, infra, tools, capabilities | Cuneiform + MCP/A2A | [`specs/capability-bus.md`](specs/capability-bus.md) (KCB, ratified) |
| **Data — knowledge** | facts / predicates / graph | Pinakes (canonical store) | [`specs/grounding-pack.md`](specs/grounding-pack.md) (KGP, ratified) |
| **Data — media** | assets, EDLs, metadata | Argos-originated interchange | [`specs/media-interchange.md`](specs/media-interchange.md) (KMI, ratified) |

Underpinning all three is the keystone that makes cross-project *intersection* possible at
all: [`specs/identity.md`](specs/identity.md) (**KINP, ratified**). Get identity right and the
fabric, the joins, and most of the routing fall out for free — which is why it was specified
first.

---

## 3. The stack: each project donates one layer

The deeper reframe behind unification: each project currently spans the **entire** stack
vertically and privately. Unification means slicing **horizontally** so each keeps the one
layer it already does best, and the others stop re-inventing it.

| Layer | Canonical owner (crown jewel) | Redundant copies retired |
|---|---|---|
| **5 · Products / experiences** | Insimul (worlds), Argos (media studio), Formant (audio) | — (stay distinct) |
| **4 · Codegen: IR→template→target** | Formant's export engine (reference pattern) | Argos NLE export, Insimul engine templates, Cuneiform generator — share conventions, not 4 engines |
| **3 · Agent runtime + infra** | **Cuneiform** (CCL/kiln/workforce) | seeded with **Argos's working pipeline + provider ladder**; retires Formant's planned agents, Insimul's ad-hoc generators |
| **2 · Symbolic reasoning core** | **Insimul-native** (`libinsimul`: Trealla ABI + conformance corpus) | tau-prolog, SWI fallbacks, Cuneiform `agent.pl` runners |
| **1 · Grounding / knowledge data** | **Pinakes** (canonical schema + TSV↔Neo4j↔Prolog/Datalog) | Argos's triple store, Insimul's Neo4j plan |
| **0 · Dev harness (meta)** | **Chief** (converged from Ralph) | Ralph, per-repo US-story runners |

One-line thesis: **Pinakes grounds it, Insimul-native reasons over it, Cuneiform staffs and
ships it, Argos/Formant/Insimul are the products — and Chief builds all of it.** Everything
redundant is a second copy of one of those roles.

---

## 4. Producers & consumers, as fabric I/O

The pairwise arrows the ecosystem "feels" like — reframed as reads/writes against the fabric.
The value is not in the arrows but in the **shared identity** (§5) that lets any of these be
*joined* ("intersection"), including feedback loops the arrows can't express.

| Project | Writes to fabric | Reads from fabric |
|---|---|---|
| **Pinakes** | consensus-reality knowledge (KGP, authority) | user/world facts to reconcile |
| **Insimul** | fictional-world facts (`based_on` real entities) | grounding for world-gen → *worlds get more coherent over time* |
| **Argos** | knowledge extracted from user media (`source_world`-scoped) | grounding for ingestion → *smarter about your content over time* |
| **Formant** | plugin/gear entities + audio assets | DSP/music-theory/gear knowledge to ground design |
| **Cuneiform** | agent/org entities | queries the whole fabric; provisions the resolver + registry |

Higher-order connections the pairwise view hides: **feedback loops** (Argos→fabric→Argos),
**N-way joins** (game character × real basis × uploaded footage — one query on shared ids),
**Cuneiform provisioning the fabric itself**, and **Formant↔Argos bidirectionality** (agents
playing plugins).

---

## 5. Identity is the keystone

Routing across the ecosystem is only hard because representations and *identities* don't
match. KINP fixes both. Essentials (full spec in [`specs/identity.md`](specs/identity.md)):

- **Three id kinds:** entity (stable/minted/resolved), assertion (content-hash), asset
  (byte-hash).
- **`same_as` vs `based_on` firewall:** keeps fictional entities from contaminating real-world
  knowledge while keeping both jointly queryable.
- **World/context model:** truth is true-in-a-world, with inheritance (consensus-reality ⊃
  fiction ⊃ playthrough).
- **Offline-first minting** + a thin **resolver** (Pinakes as authority; borrows the
  OpenRefine/Wikidata Reconciliation API + W3C PROV).

Ratified decisions: Pinakes = single canonical authority (a role, not a hard dependency);
hybrid merge policy (auto-threshold + review queue); Prolog `@world(W)` argument.

---

## 6. Repository topology & OSS boundary

- **Federated repos + published shared packages, NOT a monorepo.** The languages
  (Rust/Go/Python/TS/C) and OSS boundaries differ per project; a monorepo fights both.
  Insimul's submodule + GitHub Packages model is the template to generalize.
- **Koine** (this repo) is the contracts-only commons — no runtime code.
- **`agora`** is the *runtime*-commons sibling to Koine ([ADR-0001](decisions/ADR-0001-control-plane-topology.md)):
  the shared implementations — provider-router, discovery registry + resolver, protocol client
  libs/schemas, and the conformance console. Koine specifies; agora implements.
- **OSS commons vs. product line:** Layers 0–2 (Chief harness, Pinakes grounding, Insimul-native
  Prolog core) = open-source commons; Layer 3 (Cuneiform) = partly-OSS substrate; Layer 5
  products = some commercial, distributed **as Cuneiform orgs**.

---

## 7. Adoption sequence

The four unification axes are largely independent but have a natural order (cheapest/unblocking
first):

1. **Topology & portfolio** *(this doc)* — federated repos, published packages, OSS/product line.
2. **Horizontal plumbing** — extract the LLM provider router from Argos's "sacred ladder"
   (removes duplication from 4 projects **and** unblocks Cuneiform's unwired workforce); finish
   Ralph→Chief.
3. **Grounding** — KINP (done) + KGP: elevate GroundingPack to a live producer; resolve
   source-of-truth by *role* (Pinakes TSV = knowledge data; Prolog = runtime reasoning).
4. **Agent runtime** — wire Cuneiform's workforce using Argos's working pipeline + the extracted
   router.

---

## 8. Spec status

| Spec | Plane / role | Status |
|---|---|---|
| [`specs/identity.md`](specs/identity.md) (KINP) | identity keystone | **Ratified** 0.2.x |
| [`specs/grounding-pack.md`](specs/grounding-pack.md) (KGP) | knowledge data plane | **Ratified** 0.4.0 |
| [`specs/capability-bus.md`](specs/capability-bus.md) (KCB) | control plane | **Ratified** 0.2.0 |
| [`specs/media-interchange.md`](specs/media-interchange.md) (KMI) | media data plane | **Ratified** 0.2.0 |
| [`specs/conformance-scenario.md`](specs/conformance-scenario.md) (KCS) | test/verification format | **Ratified** 0.2.0 |
| [`registry/`](registry/) | shared vocabularies | Relation registry seeded |

See [`README.md`](README.md) for the repo's purpose and [`CLAUDE.md`](CLAUDE.md) for working
conventions.
