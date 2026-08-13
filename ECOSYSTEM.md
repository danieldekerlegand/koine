# The Koine ecosystem — a living topology

**Status:** Informative — this document binds no clause. **Last updated:** 2026-08-11

This is the *shape-level* map of the fabric the Koine contracts describe: the topology
principles every deployment inherits, the protocol planes and where each stands, and — as an
informative "known implementations" pointer (per the convention in `CLAUDE.md`) — which sibling
repositories currently play which role. Normative text lives only in [`specs/`](specs/); a spec
never depends on anything named here.

**Shape, not instance.** This file describes how *any* conformant deployment is arranged. How a
*particular* deployment is wired — its hosts, endpoints, bridge mappings, namespaces, commercial
terms — is instance data and lives in that operator's own private integration repo, never here
(see §7 and `CLAUDE.md` "What does NOT belong here").

---

## 1. Topology principles

Fixed by [ADR-0001](decisions/ADR-0001-control-plane-topology.md) (control-plane topology:
direct-dial peers, thin shared commons):

- **Data plane: direct peer-to-peer.** Participants connect to each other directly over
  **MCP + A2A**. There is no central server that relays or transforms inter-participant
  traffic — *dumb pipes, smart endpoints*.
- **Control plane: route-by-lookup, never route-by-proxy.** The discovery registry indexes
  capability manifests and hands back **addresses**; peers then dial each other directly.
  Authoritative manifests stay at the providers — the registry is a cache/index, never a hop.
- **The conformance console is an observer, not a hub.** It opens the same direct links
  production uses, injects scenario traffic, and records what it sees. It never routes.
- **Two routers, never merged.** The provider-router (a gateway to *model backends*) is one
  leaf capability on the bus; inter-participant routing is the KCB control plane. They are
  distinct concerns and no participant routes its peer traffic through the provider-router.
- **Liaisons are adapters, not middlemen.** A dedicated liaison agent exists only to front a
  surface that cannot speak MCP/A2A natively, or to decompose a genuinely cross-participant
  request — never as a mandatory hop between two peers that already speak the protocol.

## 2. The protocol planes

Six specs, versioned independently; each spec's own header is authoritative for its status
(`draft → candidate → ratified`, demoted on any model-shape change).

| Spec | Protocol | Plane | Version · status |
|---|---|---|---|
| [`specs/identity.md`](specs/identity.md) | **KINP** — Identity & Namespace | keystone — the shared namespace every join is expressed in | 0.2.1 · ✅ ratified |
| [`specs/grounding-pack.md`](specs/grounding-pack.md) | **KGP** — Grounding-Pack | data — knowledge (claims / provenance / graph) | 0.5.2 · 🚧 candidate |
| [`specs/media-interchange.md`](specs/media-interchange.md) | **KMI** — Media-Interchange | data — media (assets, lineage, OTIO timelines, transforms) | 0.3.1 · 🚧 candidate |
| [`specs/capability-bus.md`](specs/capability-bus.md) | **KCB** — Capability-Bus | control — discover / invoke / subscribe / fetch over MCP + A2A | 0.4.0 · 🚧 candidate |
| [`specs/conformance-scenario.md`](specs/conformance-scenario.md) | **KCS** — Conformance-Scenario | test — declarative scenario data over **N real** participants' own connections, with cross-plane assertions | 0.2.0 · ✅ ratified |
| [`specs/fine-tuning.md`](specs/fine-tuning.md) | **KFT** — Fine-Tuning | *profile* — composes the four planes into a `finetune` capability (not a fifth plane) | 0.4.0 · 🚧 candidate |

## 3. Who plays which role — known implementations (informative)

Koine's clauses bind **roles** (producer / consumer / authority / host / provider), never
products. The table below is the current cast — which sibling repository presently implements
which role, and **which organization owns it**. It is descriptive, changes as the ecosystem
evolves, and binds nothing.

The owner column is not bookkeeping. The known implementations span **two separate companies**
plus neutral infrastructure and independent projects, so some edges in §4 are *inter-company*
integrations between parties that share no codebase, license posture, or containment policy.
That is the reason the clauses are role-scoped rather than product-scoped, and the reason koine,
agora, and tessera are owned by neither company.

| Repo | Owner | Role(s) in the fabric | What it contributes |
|---|---|---|---|
| **koine** | shared / cross-org | the contracts | This repo — specs, schemas, registry vocabularies, policy, scenarios, ADRs. No runtime code: *"koine specifies, agora implements."* |
| **agora** | shared / cross-org | the runtime commons (host) | Reference implementations any participant can run or judge itself against: the provider-router (model-backend gateway, a leaf capability), the KCB discovery registry, the KINP resolver, egress-gated KGP knowledge sync, the translation engine, the conformance console, and the *general* KFT trainer. |
| **tessera** | shared / cross-org | provider (memory substrate) | Pooled-RAM inference-caching fabric under the agentic runtime. Joins as an ordinary KCB provider — discovered and dialed like any peer, never a coordinator. |
| **lugh** | Ontolo Labs | provider (specialized KFT trainer) | The narrow, local-only `finetune` provider for containment-gated (`synthetic` / `personal`) training data. Trains the video-capable small models that run inside the Argos runtime. Refuses out-of-envelope jobs with a graded code that names the general trainer — a rejection is a routing signal, not a failure. |
| **argos** | Ontolo Labs | producer / consumer | Any-to-any agentic multimedia: KMI assets and lineage in a content-addressed store, analysis claims into KGP, capabilities on KCB. |
| **studio-os** | Overpowered Inc. | producer / consumer | The IP factory: trend-aware IP construction evaluated against audience-persona agents, with a governance ledger over the run. Produces the IP the world authority then makes canonical. |
| **insimul** | Overpowered Inc. | producer / consumer | Hybrid-AI fictional worlds → games; a Prolog core holds canonical world state. Produces world corpora (KGP), consumes routing and training. |
| **talos** | Overpowered Inc. | tooling / provider | AI game-QA pipeline (build → playtest → capture → analyze → feedback); defines the analysis contract a media participant implements; exposes its conductor as a KCB/MCP surface. |
| **pinakes** | personal | authority / producer | The canonical knowledge authority — a Wikidata-anchored cultural/linguistic graph, published over KGP/KCB with KINP identity. |
| **formant** | personal | consumer (provider planned) | Audio-plugin/instrument IDE; routes model calls through the provider-router and fine-tuning through KFT. |
| **cuneiform** | shared tooling | host / consumer | Company-as-Code agent organizations; the most integrated MCP/A2A consumer — discovers capabilities, routes `finetune` jobs, reads the graded refusal taxonomy. Also the *export* origin of argos and studio-os — provenance, not ownership. |
| **chief / chief-cloud** | shared tooling | tooling (not fabric) | The autonomous tasklist runner every repo is built with, and its remote control plane. Build harness — not a fabric participant. |
| **praxis / vita** | personal | standalone (agora-optional) | Consumer products outside the fabric: BYO-key model access with an *optional* route through the provider-router — no ecosystem dependency. |

### Edges that cross an organizational boundary (informative)

Two of the known edges connect participants under different owners. They are ordinary fabric
traffic — the contracts do not distinguish them — but implementers should treat them as external
integrations rather than internal composition:

| Edge | Crosses | Plane |
|---|---|---|
| **talos → argos** (Tier-B/C A/V analysis of playtest captures) | Overpowered Inc. → Ontolo Labs | KCB discovery, then direct MCP/A2A; findings as KGP claims |
| **insimul → lugh** (world-derived corpora for specialized fine-tuning) | Overpowered Inc. → Ontolo Labs | KFT job, containment-gated by data classification |

A third boundary is upstream rather than lateral: **pinakes** (personal) supplies corpora to both
companies, so an upstream license term — CC-BY-SA, CC-BY-NC-SA — propagates into two different
commercial products from one source. KGP's egress gating is where that gets enforced.

### Fine-tuning role assignments (KFT §8/§9, informative)

KFT deliberately names roles, not repos; the concrete assignments live here:

| KFT role | Current implementation |
|---|---|
| General `finetune` provider (cloud-capable, egress-gated ladder) | **agora** (trainer) |
| Specialized `finetune` provider (local-only by data classification) | **lugh** (`lugh:agent:finetune`) |
| Registry / provider selection (prefer specialized, then cheaper) | **agora** (KCB registry) |
| Orchestrating host (discover → invoke → subscribe to §6 telemetry) | **cuneiform** (job routing); client + validator land in **agora** |
| Training-data producers | **pinakes** (corpus) · **insimul** (converted worlds) · **argos** (edit-ops exhaust) |

## 4. Who dials whom

```
                 ┌────────────────────────────────┐
                 │   koine — contracts only       │
                 │   (nothing dials koine;        │
                 │    everyone implements it)     │
                 └────────────────────────────────┘

  ┌──────────────┐  1. register manifest /        ┌───────────────────┐
  │ participant  │ ─── lookup a capability ─────► │  discovery        │
  │  (any role)  │ ◄── 2. gets an ADDRESS back ── │  registry (agora) │
  └──────┬───────┘      (never a relayed call)    └───────────────────┘
         │
         │ 3. dials the peer directly — MCP / A2A
         ▼
  ┌──────────────┐
  │     peer     │    no proxy · no relay · no central hub
  └──────────────┘

  Leaf capabilities (the provider-router, the trainers, any provider's
  ports) are dialed the same way — discovered, then reached directly.

  Observer: the conformance console opens the same direct links
  production uses to replay KCS scenarios. It watches; it never routes.
```

Every producer/consumer/authority/provider above — studio-os, insimul, pinakes, argos, formant,
cuneiform, tessera, lugh — sits in the "participant" box and reaches every other the same way.
There is no privileged edge: an authority is dialed like a provider, the runtime commons' own
services are dialed like any peer's, and an absent registry degrades discovery, never a peer's
ability to serve a connection it has already made. **Nor does organizational ownership create a
privileged edge** — the two cross-company edges above are dialed by exactly the same lookup-then-
direct-dial path as two peers inside one company. The boundary shows up in contracts and
containment policy, never in topology.

## 5. What travels on each plane

- **KINP** ids name everything the other planes move — entities, worlds, assets, models — so a
  join across participants is a query, not an integration.
- **KGP** GroundingPacks carry knowledge: authority → consumer (grounding), producer →
  authority (extracted or contributed facts), always egress/license/trust-filtered.
- **KMI** carries media by reference: asset envelopes, lineage graphs, OTIO timelines;
  analysis results bridge back into KGP.
- **KCB** carries capability: manifests as A2A AgentCard extensions, discovery, `invoke` /
  `subscribe` / `fetch`, grants and spend ceilings.
- **KCS** scenarios drive any combination of the above over real connections and assert what
  was observed.
- **KFT** composes all four: training data in (KGP/KMI, by reference), a base model (KINP) in,
  a new model entity (KINP) + weight assets (KMI) out, orchestrated as a KCB capability.

## 6. Cross-repo conventions

- **Vendor with a drift gate — not submodules.** When a repo needs a byte-identical copy of a
  koine file (a schema, a vocabulary), it vendors the copy and adds a test that fails when the
  copy diverges; changes are proposed as edits *here*, never made in the copy. An earlier
  revision of this document (§6, 2026-07-17) endorsed a submodule + published-packages model as
  the template to generalize; **that guidance is superseded** — vendor-with-drift-gate is the
  ecosystem convention, and this revision resolves the conflict a downstream ADR recorded
  against the old text. (One meta-repo still uses submodules *internally* to compose its own
  packages; that is its private structure, not the cross-repo sharing mechanism.)
- **Self-describing participants.** Each participant's namespace, capability manifest, egress
  policy, and vocabulary mappings live in *its own* repo and are served from *its own*
  endpoints — there is no central config store
  ([ADR-0007](decisions/ADR-0007-self-describing-participant.md),
  [`docs/self-describing-participant.md`](docs/self-describing-participant.md)).
- **One thin adapter per producer.** An application joins the fabric by translating its records
  into the shapes already specified here — never by building a bridge per peer
  ([ADR-0008](decisions/ADR-0008-fabric-producer-adapter.md)).
- **Contract changes happen here.** A divergent fork of a spec, schema, or vocabulary is never
  the mechanism; an ADR plus a spec edit is.

## 7. Where the instance topology lives

This document ends at *shape*. The **instance** topology — which hosts run which services,
real endpoints and ports, the operator's bridge/predicate mappings, deployment-history ADRs,
commercial framing — is deliberately absent, per the "shape, not instance" rule
(`README.md` §Scope). It lives in the operator's private integration repo, which continues
koine's ADR numbering (0002–0004 are permanently reserved to it). Koine never links there, and
no participant needs it to conform: everything a new participant needs is in this repository.

---

*This file is informative and living: update it when a role changes hands, a spec's header
changes status, or a new participant joins — and keep every statement shape-level.*
