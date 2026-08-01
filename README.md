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

## Tutorial: implement a KCB contract end-to-end

A worked example of one protocol, start to finish: the **Capability-Bus** ([`specs/capability-bus.md`](specs/capability-bus.md),
KCB). The goal — a **provider** advertises a capability, a **consumer** discovers it, and the two
**dial each other directly**. No traffic flows through a hub ([`decisions/ADR-0001-control-plane-topology.md`](decisions/ADR-0001-control-plane-topology.md)):
the registry hands back an *address*, not a proxy. All identifiers below use the KINP §3.4
placeholder namespaces (`mediastore` = a media provider, `analyzer` = a knowledge consumer) —
substitute your own.

### 1. Advertise — publish a manifest (KCB §2)

A provider already serves an A2A **AgentCard** at `/.well-known/agent-card.json`. The KCB manifest
is **not** a second file — it rides as one entry in that card's `capabilities.extensions[]`,
identified by the stable extension URI `https://koine.dev/kcb/manifest/0.3`. A `composer` agent
that turns a *mood* (knowledge) into a *score* (media) publishes:

```jsonc
{
  "name": "mediastore:agent:composer",              // card identity = the KINP agent id (KCB §2)
  "url":  "https://mediastore.example/a2a",          // the card's own A2A endpoint
  "capabilities": {
    "extensions": [
      { "uri": "https://koine.dev/kcb/manifest/0.3", // the KCB manifest, as ONE AgentExtension
        "description": "Koine capability-bus manifest",
        "params": {
          "kcb_version": "0.3.0",
          "produces": [ { "plane": "media", "media_types": ["audio/midi"], "world_pattern": "*" } ],
          "consumes": [ { "plane": "knowledge", "dialect": "grounding-only" } ],
          "capabilities": [
            { "name": "compose",
              "inputs":  [ { "plane": "knowledge", "shape": "mood-descriptor" } ],  // knowledge IN
              "outputs": [ { "plane": "media", "media_types": ["audio/midi"] } ],   // media OUT
              "cost":    { "tier": "paid", "est_units": 1200 } } ],
          "auth":    { "scheme": "capability-token", "grants_required": ["invoke:compose"] },
          "signing": { "key_id": "…", "alg": "ed25519" } }
      }
    ]
  }
}
```

Because the provider's identity *is* the card's KINP agent id, **the provider is itself a fabric
entity** — it can be grounded and reasoned about like any other node.

### 2. Discover — find it in the registry (KCB §3/§4)

The host-provisioned **discovery registry** crawls each peer's `/.well-known/agent-card.json`, reads
the `capabilities.extensions[]` entry whose `uri` is `https://koine.dev/kcb/manifest/0.3`, and
indexes that entry's `params` (its ports, capabilities, and cost). A card without the extension
simply advertises no KCB ports. The consumer then runs a **discover** query — `find(port | plane |
world | capability)`:

```
discover(capability = "compose",
         consumes   = { plane: "knowledge", shape: "mood-descriptor" },
         produces   = { plane: "media",     media_types: ["audio/midi"] })
  → [ { agent: "mediastore:agent:composer",
        address: "https://mediastore.example/a2a",     // ← an ADDRESS, not a proxy
        cost: { tier: "paid", est_units: 1200 } } ]
```

Because ports are **plane-typed**, the registry can even chain providers into a *path* across planes
(`mood(knowledge) → score(media)`) and prefer zero-`cost` routes, returning the projected spend so
the caller can gate its budget before invoking.

### 3. Dial — connect directly and invoke (KCB §4/§5)

The registry has done its only job: it returned an **address**. The consumer now opens the **same
direct A2A/MCP link production uses** to that address — nothing is relayed through the registry — and
calls **invoke**, passing inputs/outputs *by reference* (KINP ids, KGP pack ids), never inlined:

```
invoke("compose",
       on    = "https://mediastore.example/a2a",       // dial the provider directly
       input = { plane: "knowledge", ref: "analyzer:claim:sha256-9f3c…" }, // a mood descriptor, by ref
       grant = "invoke:compose")                        // a capability token (KCB §5), spend-ceilinged
  → { output: "mediastore:asset:blake3-a1b2…" }         // a KMI asset id — fetch the bytes with `fetch`
```

Invocation requires a **capability grant** (`invoke:compose`) carrying a spend ceiling, so a
cross-participant chain can't exceed the caller's authorized budget. The returned `asset` id is
retrieved on demand with the **fetch** verb (a content-addressed CAS GET, gated by a `fetch:asset`
grant), and integrity self-verifies against the hash.

That is the whole loop — **advertise → discover → dial**, dumb pipes and smart endpoints. The full
four-participant version of this story (adding narration, clip-cutting, an EDL, and the
media→knowledge bridge) is the pressure test in
[`scenarios/e2e-media-transform.md`](scenarios/e2e-media-transform.md); the identity-side
counterpart (mint a CURIE → `resolve` / `reconcile` it) is
[`scenarios/e2e-worlds-to-fabric.md`](scenarios/e2e-worlds-to-fabric.md).

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
