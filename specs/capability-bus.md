# Koine Capability-Bus Protocol (KCB)

**Spec version:** 0.1.0 (candidate)
**Status:** Draft for review — not yet ratified
**Last updated:** 2026-07-17
**Applies to:** all five projects (Cuneiform hosts; every project both offers and consumes)
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for identifiers;
[`grounding-pack.md`](grounding-pack.md) (KGP) and `media-interchange.md` for the payloads it
carries.

> The **control plane**. Where the knowledge plane (KGP) and media plane move *data*, the
> capability bus moves *capability*: how a project advertises what it can do, how orgs and
> agents discover and invoke each other, and how knowledge/media flow as subscriptions.
> Transport is **MCP + A2A** — protocols Argos and Cuneiform already speak — so KCB is mostly
> a *convention* over existing standards, not a new runtime. Dumb pipes: the bus carries
> invocations and data *references* (KINP ids, KGP pack ids), never transforms payloads.

---

## 1. Scope

KCB defines:
- the **capability manifest** every project publishes (§2),
- the **discovery registry** and how it is populated (§3),
- the **verbs**: discover / describe / invoke / subscribe (§4),
- **trust & authorization** — capability grants, signing, per-world scoping (§5),
- the per-project **mapping** onto existing MCP/A2A surfaces (§6).

KCB does **not** define payload formats (KGP / media-interchange do), agent reasoning, or
infra provisioning (that is Cuneiform/kiln).

---

## 2. The capability manifest

Every project (and every agent/org within Cuneiform) publishes one manifest declaring who it
is and what it offers, in KINP terms:

```jsonc
{
  "kcb_version": "0.1.0",
  "identity":   "cuneiform:agent:composer",     // KINP agent/entity id
  "endpoints":  {
    "mcp":  "https://…/mcp",                     // MCP server (tools)
    "a2a":  "https://…/.well-known/agent-card.json"
  },
  "produces":   [                                // interchange types emitted
    { "plane": "media",     "media_types": ["audio/wav"] },
    { "plane": "knowledge", "worlds": ["*"], "dialect": "grounding-only" }
  ],
  "consumes":   [                                // interchange types accepted
    { "plane": "knowledge", "dialect": "grounding-only" }
  ],
  "capabilities": [                              // named, invocable units
    { "name": "compose", "input_schema": {…}, "output": { "plane": "media", "media_types": ["audio/midi"] } }
  ],
  "auth":       { "scheme": "capability-token", "grants_required": ["invoke:compose"] },
  "signing":    { "key_id": "…", "alg": "ed25519" }   // shared shape with KGP manifest.signing
}
```

- `identity` uses the KINP namespace, so **a capability provider is itself a fabric entity** —
  an agent can be referenced, grounded, and reasoned about like any other node.
- `produces`/`consumes` are typed against the **planes** (knowledge = KGP packs, media =
  assets/EDLs). This is what lets the registry answer "who can turn X into Y" by matching one
  provider's `produces` to another's `consumes`.

---

## 3. Discovery registry

A thin index of manifests — *who offers what*. **Cuneiform provisions and hosts it** (it is a
Cuneiform-generated org, per the ecosystem thesis: the interconnect fabric is itself
Company-as-Code). The registry is a cache/index over the projects' own MCP/A2A surfaces, not a
source of truth — a provider's manifest is authoritative; the registry just makes it findable.

- **Population:** projects register their manifest (push) or the registry crawls known A2A
  agent-cards / MCP servers (pull).
- **Query:** `find(produces|consumes|capability|plane|world)` → matching manifests, ranked.
- **Composition:** because `produces`/`consumes` are typed, the registry can compute a *path*
  from an input type to a desired output type across multiple providers — the concrete,
  bounded form of the "any-to-any" routing question, resolved by matching contracts rather
  than a central transform-gateway.

---

## 4. Verbs

| Verb | Transport | Meaning |
|---|---|---|
| **discover** | registry query (§3) | find providers by capability / interchange type / world |
| **describe** | MCP `list_tools` / A2A agent-card | fetch a provider's full manifest + schemas |
| **invoke** | MCP tool call / A2A task | run a capability; inputs/outputs are KINP ids + KGP/media payloads by reference |
| **subscribe** | A2A streaming / MCP notifications | register for a world or capability; receive KGP **deltas** (KGP §6) or media events as they occur |

`subscribe` is the control-plane half of KGP §6 subscriptions: KGP defines the delta payload,
KCB defines how a consumer registers and how the stream is delivered. Ordering-independence
(KGP §6) means the bus needs no exactly-once guarantee — content-addressed claim ids make
redelivery idempotent.

---

## 5. Trust & authorization

- **Capability grants.** Invocation requires a capability token naming the granted verbs
  (`invoke:compose`, `subscribe:world/consensus-reality`). Grants are issued by the hosting
  org's governance (Cuneiform workforce governance) and are **per-capability and per-world**,
  so a consumer can be trusted for one world/plane and not another.
- **Signing.** Manifests and KGP packs share one signing shape (`{key_id, alg}`); inter-project
  packs and invocations SHOULD be signed so provenance (KINP §7 `prov.agent`) is
  cryptographically attributable, not merely asserted.
- **Merge-review linkage.** A pack arriving from a low-trust provider feeds the hybrid merge
  **review queue** (KINP §11 decision 2) rather than auto-applying — trust level becomes an
  input to merge aggressiveness. This is the concrete tie between the control plane's auth and
  the knowledge plane's contamination controls.

Full auth mechanics (token issuance, rotation, identity providers like Keycloak/Authentik)
live in Cuneiform infra; KCB fixes only the *shape* of grants and signing so the planes agree.

---

## 6. Per-project mapping

| Project | Already has | KCB role |
|---|---|---|
| **Cuneiform** | MCP sidecars, A2A/`a2a-sdk`, workforce governance, generator seams (`_mcp`,`_a2a`) | **Host**: provisions the registry; issues grants; every workforce agent publishes a manifest. |
| **Argos** | `/mcp`, `/.well-known/agent-card.json`, surface map `/api/spec` | Publish manifest; `produces` media + `grounding-only` knowledge (with `source_world`); `subscribe` to grounding worlds. |
| **Pinakes** | resolver + KGP producer, graph API | Expose `resolve`/`reconcile`/`query` and KGP snapshot/delta as capabilities; the authority provider. |
| **Insimul** | game server, generators | Consume grounding capabilities; expose world-export as a capability; agents (NPCs) MAY publish manifests. |
| **Formant** | (agents planned) | Consumer now (ground plugin design); later **provider** — expose "play this plugin" as an invocable capability so Argos's composer/sound-designer agents can drive Formant plugins (Formant's own roadmap). |

---

## 7. Open questions

1. **Registry federation** — single Cuneiform-hosted registry vs. per-org registries that
   peer. (Mirrors KINP §11 decision 1; likely resolve the same way: one authority as a role,
   federation as a future option.)
2. **Capability versioning & deprecation** — how a provider evolves a capability's schema
   without breaking subscribers (semver on capability names? content-addressed schemas?).
3. **Backpressure & cost** — subscriptions to high-volume worlds; ties to Argos's cost gates
   and Cuneiform's costadvisor.

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
**Blocking deltas before ratification:** **F** (transform typing + registry path-matching must
span all planes, §2/§3 — else any-to-any can't route knowledge-touching transforms) and **G**
(add a `fetch(asset_id)` verb + `fetch:asset` grant, §4/§5 — cross-project CAS read). Should-fix:
**J** (world on media produce/consume typing, §2/§3), **K** (spend ceiling on grants, §5/§7),
**L** (tolerate dangling asset refs, §4). Stays **candidate** until F & G land.

## Changelog

- **0.1.0** (2026-07-17) — Initial candidate draft.
