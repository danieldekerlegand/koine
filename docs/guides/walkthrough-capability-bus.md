# Walkthrough: a capability, end to end

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine

This is a worked example of the **Capability-Bus** protocol ([`../specs/capability-bus.md`](../../specs/capability-bus.md),
"KCB") — the part of Koine that lets one system offer a capability and another find and use it.
It's the best way to build intuition for how the whole fabric fits together, because a single
capability call touches identity, knowledge, and media at once.

The goal is one complete loop in three moves: a **provider** *advertises* a capability, a
**consumer** *discovers* it, and the two *dial each other directly*. Nothing is relayed through a
central server — the registry hands back an **address**, and the peers connect to each other
([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) explains why).

> **Before you start**, it helps to have skimmed two specs: [Identity](../../specs/identity.md)
> (how entities are named) and [Capability-Bus](../../specs/capability-bus.md) (the protocol itself).
> The identifiers below use KINP's placeholder namespaces — `mediastore` is a made-up media
> provider, `analyzer` a made-up knowledge consumer. Substitute your own.

Our example provider is a `composer` agent: give it a *mood* (knowledge) and it returns a *score*
(media).

## Step 1 — Advertise: publish a manifest

A provider already serves an [A2A](https://a2a-protocol.org) **AgentCard** at
`/.well-known/agent-card.json`. The KCB manifest is **not** a second file — it rides inside that
card as one entry in `capabilities.extensions[]`, identified by a stable URI. This keeps a
provider to a single served document.

The card below is an **A2A v1.0** card, which is the version KCB pins
([KCB §1.1](../../specs/capability-bus.md)). In v1.0 an agent's addresses are the entries of
`supported_interfaces[]` — each an `AgentInterface{ url, protocol_binding }` — and there is no
top-level `"url"`. Nothing in the KCB extension changes with the card version: the entry, its
`uri` and its `params` are the same either way.

```jsonc
{
  "name": "mediastore:agent:composer",              // the provider's shared identity (a KINP id)
  "supported_interfaces": [                          // A2A v1.0 — where it actually answers
    { "url": "https://mediastore.example/a2a", "protocol_binding": "JSONRPC" }
  ],
  "capabilities": {
    "extensions": [
      { "uri": "https://w3id.org/koine/kcb/manifest/0.3", // marks this entry as a KCB manifest
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

Because the provider's identity *is* a Koine entity id, the provider is itself a first-class
citizen of the fabric — it can be described and reasoned about like any other entity, not just
called.

## Step 2 — Discover: find it in the registry

A **discovery registry** (run by a Host) crawls each peer's AgentCard, reads the KCB manifest
entry, and indexes what it advertises — its ports, capabilities, and cost. A card without the
extension simply advertises no capabilities. A consumer then asks the registry to *find* one:

```
discover(capability = "compose",
         consumes   = { plane: "knowledge", shape: "mood-descriptor" },
         produces   = { plane: "media",     media_types: ["audio/midi"] })
  → [ { agent: "mediastore:agent:composer",
        address: "https://mediastore.example/a2a",     // ← an ADDRESS, not a proxy
        cost: { tier: "paid", est_units: 1200 } } ]     //   read off an AgentInterface.url
```

Because every port is typed by which *plane* it speaks (knowledge, media…), the registry can do
more than a flat lookup: it can **chain** providers into a path across planes
(`mood → score`), prefer free routes over paid ones, and return the projected cost so the caller
can check its budget *before* spending anything.

## Step 3 — Dial: connect directly and invoke

The registry has now done its whole job: it returned an address. The consumer opens the **same
direct connection production traffic uses** — nothing is relayed — and calls `invoke`. Inputs and
outputs are passed **by reference** (as ids), never inlined:

```
invoke("compose",
       on    = "https://mediastore.example/a2a",       // dial the provider directly
       input = { plane: "knowledge", ref: "analyzer:claim:sha256-9f3c…" }, // a mood, by reference
       grant = "invoke:compose")                        // a capability grant with a spend ceiling
  → { output: "mediastore:asset:blake3-a1b2…" }         // a media asset id
```

Two things make this safe across trust boundaries:

- **The grant carries a spend ceiling.** A chain of cross-system calls can never exceed the
  budget the original caller authorized.
- **The result is an id, not bytes.** You fetch the actual asset on demand with the `fetch` verb
  (a content-addressed read), and its integrity self-verifies against the hash in the id.

## That's the whole loop

**Advertise → discover → dial** — dumb pipes, smart endpoints. To see it stretched to its full
size, read the pressure tests these steps are distilled from:

- [`../scenarios/e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) — the four-participant
  version, adding narration, clip-cutting, an edit list, and the media→knowledge bridge.
- [`../scenarios/e2e-worlds-to-fabric.md`](../../scenarios/e2e-worlds-to-fabric.md) — the identity-side
  counterpart: mint a name, then `resolve` and `reconcile` it.

> **Corrected 2026-09-03.** The card above used to carry a top-level `"url"`, which is the **A2A
> v0.x** shape. KCB replaced it with `supported_interfaces[]` at **0.4.2** (§1.1, §2) when it pinned
> A2A **v1.0**, and the correction never reached this page — so a reader building from this
> walkthrough would have published a card the pinned upstream no longer defines. The manifest
> `params` are byte-unchanged, because the card version does not reach them. Deliberately **not**
> changed at the same time: `kcb_version` still reads `0.3.0`, matching the spec's own §2 example —
> this page illustrates that example and is not a second place to state the current version. Record:
> [`../reference/doc-drift-corrections.md`](../reference/doc-drift-corrections.md).
