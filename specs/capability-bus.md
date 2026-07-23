# Koine Capability-Bus Protocol (KCB)

**Spec version:** 0.3.0
**Status:** Candidate
**Last updated:** 2026-07-22
**Applies to:** all five projects (Cuneiform hosts; every project both offers and consumes)
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for identifiers;
[`grounding-pack.md`](grounding-pack.md) (KGP) and `media-interchange.md` for the payloads it
carries.

> **Status note (0.3.0):** dropped from Ratified back to **Candidate** because 0.3.0 changes the
> *shape* of the manifest — it is now an A2A AgentCard extension (§2), not a standalone
> `/.well-known/kcb-manifest.json` — which re-enters validation per the koine
> draft→candidate→ratified convention. Re-ratification path: re-run
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the
> extension shape (no delta F/G/J/K/L is reopened — see **Pressure test**).

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
- the **verbs**: discover / describe / invoke / subscribe / **fetch** (§4),
- **trust & authorization** — capability grants, signing, per-world scoping (§5),
- the per-project **mapping** onto existing MCP/A2A surfaces (§6).

KCB does **not** define payload formats (KGP / media-interchange do), agent reasoning, or
infra provisioning (that is Cuneiform/kiln).

---

## 2. The capability manifest

Every project (and every agent/org within Cuneiform) advertises what it offers. It does **not**
publish a second, standalone document for this. A capability provider already publishes an **A2A
AgentCard** (the standard `/.well-known/agent-card.json`), which carries its identity and its
service endpoints. The KCB manifest is therefore defined as a **named extension of that card**,
not as a top-level file of its own: the KCB-specific payload rides as one entry under the card's
`capabilities.extensions[]` array.

A2A's `AgentCard.capabilities.extensions` field is a list of **`AgentExtension`** objects, each
`{ uri, description, required?, params }` — the standard, in-band way to attach protocol-specific
metadata to a card without forking the A2A schema. The KCB manifest is one such extension,
identified by the stable extension URI **`https://koine.dev/kcb/manifest/0.3`**; its `params`
object carries the KCB payload:

```jsonc
{
  // ── standard A2A AgentCard fields (abridged) ──
  "name":     "cuneiform:agent:composer",        // card identity — the KINP agent/entity id
  "url":      "https://…/a2a",                    // A2A service endpoint (the card's own)
  "capabilities": {
    "extensions": [
      // ── the KCB manifest, as ONE AgentExtension on the card ──
      {
        "uri":         "https://koine.dev/kcb/manifest/0.3",
        "description": "Koine capability-bus manifest",
        "required":    false,
        "params": {
          "kcb_version": "0.3.0",
          "mcp":         "https://…/mcp",          // MCP tools endpoint the extension still needs
          "produces":    [                          // ports emitted (§2.1)
            { "plane": "media", "media_types": ["audio/wav"], "world_pattern": "*" }
          ],
          "consumes":    [                          // ports accepted
            { "plane": "knowledge", "dialect": "grounding-only" },
            { "plane": "entity",    "types": ["mood", "scene"] }
          ],
          "capabilities": [                         // named, invocable units; i/o are ports
            { "name": "compose",
              "inputs":  [ { "plane": "knowledge", "shape": "mood-descriptor" } ], // knowledge IN
              "outputs": [ { "plane": "media", "media_types": ["audio/midi"] } ],  // media OUT (delta F)
              "cost":    { "tier": "paid", "est_units": 1200 } }                   // for path cost (delta K)
          ],
          "auth":     { "scheme": "capability-token", "grants_required": ["invoke:compose"] },
          "signing":  { "key_id": "…", "alg": "ed25519" }  // shared shape with KGP manifest.signing
        }
      }
    ]
  }
}
```

- The KCB extension carries **only** the KCB-specific fields — `kcb_version`, `produces`,
  `consumes`, `capabilities` (with cross-plane ports + `cost`), `auth`, and `signing`. It
  **drops** the old top-level `identity` and `endpoints` blocks: those duplicated fields the
  AgentCard already carries and are now **read off the card itself** — `identity` from the card's
  own agent id (`name`), and the A2A endpoint from the card's own service URL. Any non-A2A
  endpoint the extension still needs (e.g. the MCP tools URL) is a plain field in `params`.
- Because the provider's identity is the card's KINP agent id, **a capability provider is itself a
  fabric entity** — an agent can be referenced, grounded, and reasoned about like any other node.
- **Prior art (in-ecosystem).** Extending A2A by convention rather than forking it is already the
  house style: Cuneiform's
  `cuneiform/core/engine/crates/cuneiform-engine/src/a2a/protocol.rs` defines the Google-A2A-aligned
  `AgentCard` type and already extends the standard A2A `Message` with two ACL extensions
  (`fromAgent` / `toAgent`, lines 98–114). The KCB manifest applies the same convention to the
  card's `capabilities.extensions[]`.

### 2.1 Ports span all planes (delta F)

Ports, capabilities, and their `cost` all live **inside the KCB extension's `params`** (§2) — the
`produces`, `consumes`, and `capabilities` arrays on `capabilities.extensions[]` whose `uri` is
`https://koine.dev/kcb/manifest/0.3`. Collapsing the standalone manifest onto the AgentCard moves
*where* these fields are served (card extension, not a second file) but not *what* they carry: the
plane-typed port model (F), `world_pattern` world-scoping (J), and capability `cost` (K) are all
preserved verbatim as extension `params`, not dropped.

A **port** is a typed connection point used by the extension's `produces`, `consumes`, and every
capability's `inputs`/`outputs`. Its `plane` selects the type vocabulary:

| Port plane | Typed by | Example |
|---|---|---|
| `knowledge` | KGP `dialect` + optional `worlds`, plus a `shape` naming the payload | a mood descriptor; a GroundingPack |
| `media` | KMI `media_types` + optional `world_pattern` (delta J) | `audio/wav` from world `alderforest` |
| `entity` | KINP entity `types` | a `mood` / `scene` / `plugin` entity ref |

Because ports are plane-typed, a capability may **consume knowledge and produce media** — the
"compose a score from a mood" leg the pressure test exposed (F). The `compose` capability in the
§2 example carries exactly this shape (a `knowledge` input, a `media` output) inside the
extension's `params.capabilities`, so the cross-plane example remains valid on the card. Path-finding
(§3) therefore matches these extension ports **across planes**, not media-to-media only.
`world_pattern` on a media port (in `params.produces`) lets the registry answer "media *from world
X*" (J); without it, world-scoped media discovery is impossible. `cost` on a capability (in
`params.capabilities`) lets path search prefer cheaper routes and gate spend (K).

### 2.2 Migration — 0.2.0 standalone manifest → 0.3.0 card extension

0.2.0 served a standalone `/.well-known/kcb-manifest.json`; 0.3.0 folds that payload onto the peer's
existing A2A AgentCard as the `https://koine.dev/kcb/manifest/0.3` extension (§2). Field-by-field:

| 0.2.0 standalone manifest field | 0.3.0 destination |
|---|---|
| `identity` (top-level) | **dropped** — read off the AgentCard's own agent id (`name`) |
| `endpoints.a2a` (self-reference to the card) | **dropped** — the A2A endpoint is the card's own `url` |
| `endpoints.mcp` (and any other non-A2A endpoint) | extension `params.mcp` (a plain `params` field) |
| `produces` | extension `params.produces` |
| `consumes` | extension `params.consumes` |
| `capabilities` (incl. cross-plane ports + `cost`) | extension `params.capabilities` |
| `auth` | extension `params.auth` |
| `signing` | extension `params.signing` |

- **Both MAY be served during transition.** A provider MAY continue serving the standalone
  `/.well-known/kcb-manifest.json` alongside the card extension until all consumers crawl the
  extension (§3); the extension on `/.well-known/agent-card.json` is the 0.3.0 authoritative form.
- **`signing` MUST be preserved intact.** [`grounding-pack.md`](grounding-pack.md) line 313 declares
  `manifest.signing = {key_id, alg}` the *shared* signing shape between the KCB manifest and KGP
  packs; the collapse moves `signing` into `params` but MUST NOT change its shape, so provenance
  attribution (KINP §7) stays cryptographically valid across the migration.

---

## 3. Discovery registry

A thin index of manifests — *who offers what*. **Cuneiform provisions and hosts it** (it is a
Cuneiform-generated org, per the ecosystem thesis: the interconnect fabric is itself
Company-as-Code). The registry is a cache/index over the projects' own MCP/A2A surfaces, not a
source of truth — a provider's manifest is authoritative; the registry just makes it findable.

- **Population:** projects register their manifest (push), or the registry crawls known A2A
  agent-cards / MCP servers (pull) and **reads the KCB extension off each peer's
  `/.well-known/agent-card.json`** — it looks for the `capabilities.extensions[]` entry whose
  `uri` is `https://koine.dev/kcb/manifest/0.3` and indexes that entry's `params` (ports,
  capabilities, cost). There is no separate manifest file to crawl; a card without the extension
  simply advertises no KCB ports.
- **Query:** `find(port | plane | world | capability)` → matching manifests, ranked. Ports are
  the extension `params`' `produces`/`consumes`/capability ports (§2.1); media ports match by
  `media_type` **and** `world_pattern` (delta J).
- **Composition:** because the extension's ports are plane-typed (§2.1), the registry computes a
  *path* from a start port to a goal port **across planes and providers** — e.g. `text →
  narration:audio`, `mood(knowledge) → score:audio`, `assets → edl → CMX3600` — the bounded,
  contract-matched form of any-to-any (delta F), resolved by matching the ports crawled off peers'
  card extensions rather than a central transform-gateway. Path search **prefers zero-`cost`
  routes** using each capability's `params.capabilities[].cost` and returns the path's projected
  cost so the caller can gate spend before invoking (delta K).
- **Route-by-lookup, not proxy ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).**
  The registry returns *addresses*; peers then connect **directly** over MCP/A2A — no
  inter-service traffic flows through it. An optional **aggregator facade** MAY present a unified
  tool namespace to clients (forwarding without transforming) for convenience, but is never the
  mandatory path. The registry + resolver reference implementation lives in the `agora` runtime
  commons.

---

## 4. Verbs

| Verb | Transport | Meaning |
|---|---|---|
| **discover** | registry query (§3) | find providers by capability / interchange type / world |
| **describe** | one A2A agent-card fetch (`/.well-known/agent-card.json`) + MCP `list_tools` for tool schemas | fetch the provider's AgentCard **including its KCB extension** (`capabilities.extensions[]`, §2) in a single fetch — there is no second `/.well-known/kcb-manifest.json` to retrieve |
| **invoke** | MCP tool call / A2A task | run a capability; inputs/outputs are KINP ids + KGP/media payloads by reference |
| **subscribe** | A2A streaming / MCP notifications | register for a world or capability; receive KGP **deltas** (KGP §6) or media events as they occur |
| **fetch** | CAS GET by `asset` id | retrieve asset bytes by their KINP id; integrity self-verifies against the hash (delta G). Requires a `fetch:asset` grant (§5). |

`subscribe` is the control-plane half of KGP §6 subscriptions: KGP defines the delta payload,
KCB defines how a consumer registers and how the stream is delivered. Ordering-independence
(KGP §6) means the bus needs no exactly-once guarantee — content-addressed claim ids make
redelivery idempotent. Because a stream may deliver a **reference** (an EDL, a claim) before the
referenced asset's bytes have propagated, consumers MUST tolerate dangling asset references and
`fetch` them lazily on demand; producers MUST NOT assume bytes are pre-propagated (delta L).

---

## 5. Trust & authorization

- **Capability grants.** Invocation requires a capability token naming the granted verb + scope
  — `invoke:compose`, `subscribe:world/consensus-reality`, `fetch:asset` (delta G). Grants are
  issued by the hosting org's governance (Cuneiform workforce governance) and are
  **per-capability, per-world, and carry a spend ceiling** (`budget_units`, delta K), so a
  cross-project chain (Argos → Formant → paid model) cannot exceed the caller's authorized
  spend. Path-finding (§3) prefers zero-cost routes and surfaces the projected cost before an
  `invoke`.
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
| **Cuneiform** | MCP sidecars, A2A/`a2a-sdk`, workforce governance, generator seams (`_mcp`,`_a2a`) | **Host**: provisions the registry; issues grants; every workforce agent publishes the KCB extension **on its own A2A agent-card** (no separate manifest file). |
| **Argos** | `/mcp`, `/.well-known/agent-card.json`, surface map `/api/spec` | Publish the KCB extension **on the `/.well-known/agent-card.json`** it already serves; the extension's `params.produces` carries media ports with `world_pattern` (delta J) so a peer can still discover "media *from world X*" by crawling Argos's card; `produces` media + `grounding-only` knowledge (with `source_world`); `subscribe` to grounding worlds. |
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
3. **Subscription backpressure** — flow-control for high-volume-world subscriptions (per-invoke
   *cost* is now handled by capability `cost` + grant spend ceilings, §2.1/§5); firehose
   flow-control remains an infra concern (Cuneiform costadvisor).

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
All blocking deltas were folded in 0.2.0: **F** (ports span all planes, §2.1/§3), **G**
(`fetch` verb §4 + `fetch:asset` grant §5), **J** (`world_pattern` on media ports, §2.1/§3),
**K** (capability `cost` + grant spend ceiling + cost-aware path search, §2.1/§3/§5), **L**
(dangling-reference tolerance, §4). Ratified.

## Changelog

- **0.3.0** (2026-07-22) — **Candidate.** Redefined the §2 manifest as a named A2A **AgentCard
  extension** (`capabilities.extensions[]`, uri `https://koine.dev/kcb/manifest/0.3`) instead of a
  standalone document. Collapsed the two well-known files into one: the KCB payload now rides on the
  peer's existing `/.well-known/agent-card.json`, so there is no separate
  `/.well-known/kcb-manifest.json`. Dropped the duplicated top-level `identity`/`endpoints` (now read
  off the card); moved `produces`/`consumes`/`capabilities`/`auth`/`signing` into the extension's
  `params` with all deltas F/J/K preserved. Added a field-by-field migration note (§2.2). Status
  dropped Ratified→Candidate pending re-validation of the extension shape against
  `scenarios/e2e-media-transform.md`.
- **0.2.0** (2026-07-17) — **Ratified.** Folded pressure-test deltas: F (cross-plane ports),
  G (`fetch` verb + `fetch:asset` grant), J (`world_pattern` on media ports), K (spend ceilings
  and cost-aware path search), L (dangling-reference tolerance).
- **0.1.0** (2026-07-17) — Initial candidate draft.
