# Koine Capability-Bus Protocol (KCB)

**Spec version:** 0.4.3
**Status:** Candidate
**Last updated:** 2026-08-13
**Applies to:** every participant on the bus — the control-plane host, capability providers, and
capability consumers (most participants are both provider and consumer).
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for identifiers;
[`grounding-pack.md`](grounding-pack.md) (KGP) and `media-interchange.md` for the payloads it
carries.

> **Status note (0.4.3):** stays **Candidate**, on the same two counts as 0.4.0 — 0.4.1 added a
> transition clause (§2.3), 0.4.2 corrected two upstream references (§1.1) and 0.4.3 pins the MCP
> revision and audits which wire each verb assumes (§1.1, §4.1); none of the three is a gate. 0.3.0 changed the *shape* of the
> manifest — it is now an A2A AgentCard extension (§2), not a standalone
> `/.well-known/kcb-manifest.json` — and that re-validation is still outstanding. 0.4.0 adds the
> capability-versioning surface (§7, wired through §2/§2.1/§3/§5) per
> [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md). That fold is **additive**
> — fields added, none removed, nothing narrowed, no live subscriber broken — but it is new
> normative text, so the koine draft→candidate→ratified convention holds the status. Re-ratification
> path, **both** legs: (i) re-run
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the extension
> shape (no delta F/G/J/K/L is reopened — see **Pressure test**), and (ii) break-test §7 with the
> mutate-live-schema scenario (§7.5). Leg (ii) has been **written and run** —
> [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) — and did
> **not** pass clean: deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7, all additively foldable into a
> **0.5.0** minor. Both legs stay open. 0.4.1 moves the §2 extension URI's namespace root and
> opens the dual-accept window that retires the legacy root at **KCB 0.6.0** (§2.3); it neither
> adds a gate nor discharges one, and the two legs above are restated unchanged. 0.4.2 realigns the
> §2 example card with **A2A v1.0** and corrects the §4 MCP method names, and pins both upstreams in
> **§1.1**; it changes no KCB clause, field, or manifest shape, so the two legs are again restated
> unchanged. 0.4.3 pins **MCP revision 2026-07-28** in the same §1.1 table and adds **§4.1**, the
> per-verb audit of which MCP wire each clause assumes; it adds no field and removes none, and the
> two legs are restated unchanged once more.

> The **control plane**. Where the knowledge plane (KGP) and media plane move *data*, the
> capability bus moves *capability*: how a participant advertises what it can do, how orgs and
> agents discover and invoke each other, and how knowledge/media flow as subscriptions.
> Transport is **MCP + A2A** — open standards a conformant participant is likely to speak
> already — so KCB is mostly a *convention* over existing standards, not a new runtime. Dumb
> pipes: the bus carries invocations and data *references* (KINP ids, KGP pack ids), never
> transforms payloads.

---

## 1. Scope

KCB defines:
- the **capability manifest** every participant publishes (§2),
- the **discovery registry** and how it is populated (§3),
- the **verbs**: discover / describe / invoke / subscribe / **fetch** (§4),
- **trust & authorization** — capability grants, signing, per-world scoping (§5),
- the per-role **mapping** onto existing MCP/A2A surfaces (§6),
- **versioning, compatibility & deprecation** — how a capability evolves, and how a surface retires,
  without breaking a live subscriber (§7).

KCB does **not** define payload formats (KGP / media-interchange do), agent reasoning, or
infra provisioning (host-local concerns).

### 1.1 Upstream pins

KCB is a convention over two external standards, so every clause below is written against a
**named version**, not against "A2A" or "MCP" in the abstract. A bare reference would be
unimplementable: both standards have shipped breaking changes to surfaces this spec maps onto.

| Upstream | Pinned | Where it bites |
|---|---|---|
| **A2A** | **v1.0** | The host document of the §2 manifest. v1.0 replaced the v0.x top-level `"url"` with **`supported_interfaces[]`** (`AgentInterface{ url, protocol_binding }`) — see §2. |
| **MCP** | **revision 2026-07-28** | The transport of the §4 verbs. That revision made the core **stateless** and is a **breaking change** against its predecessor — see §4.1 for the per-clause audit. |

**The table of record is [`../docs/upstream-standards.md`](../docs/upstream-standards.md)**, which
holds every pin in the fabric and the drift-check cadence that keeps them honest; the two rows above
are restated here so this spec reads standalone, and if they ever disagree with that file **the file
wins and this section is the defect**. That direction is deliberate and is the reverse of how a
spec's own version works: an upstream revision is a shared fact — the pinned MCP revision is the
*same* fact for KCB and for KCS — so it is recorded once where one sweep can check it
([`README.md`](README.md) § *External standards — the pin rule*). A pin states what KCB was
**validated against**, not that the upstream is frozen; moving one is a spec change under
[`README.md`](README.md)'s lifecycle.

**What the pinned MCP revision has that its predecessor did not.** The 2026-07-28 revision replaced
a session-oriented wire with a **stateless core**: there is no `initialize` handshake, no session
id, and per-request context rides in a per-request **`_meta`** rather than in state accumulated on a
connection; a server describes itself through a **mandatory `server/discover`** instead of through
what the handshake returned. The two wires are therefore **not interchangeable** — a client speaking
one is not a client speaking the other — which is why a bare "over MCP" is unimplementable here and
why §4.1 states, clause by clause, which wire each of KCB's five verbs assumes. A KCB participant's
own revision is a property of the MCP endpoint it publishes (`params.mcp`, §2), not a KCB field:
this pin says what KCB was written and validated against, and a participant still on the older wire
is a participant KCB describes rather than one it excludes.

---

## 2. The capability manifest

Every participant (and every agent/org a control-plane host runs) advertises what it offers. It does **not**
publish a second, standalone document for this. A capability provider already publishes an **A2A
AgentCard** (the standard `/.well-known/agent-card.json`), which carries its identity and its
service endpoints. The KCB manifest is therefore defined as a **named extension of that card**,
not as a top-level file of its own: the KCB-specific payload rides as one entry under the card's
`capabilities.extensions[]` array.

The host card is an **A2A v1.0** card (§1.1). In v1.0 a card does **not** carry a
top-level `"url"`: an agent's addresses are the entries of **`supported_interfaces[]`**, each an
**`AgentInterface{ url, protocol_binding }`**, so one card may advertise the same agent over
several bindings (e.g. `JSONRPC` and `GRPC`). KCB reads the A2A endpoint off that array rather than
off a single field — everywhere this spec says "the card's own service URL" it means *an
`AgentInterface.url` from `supported_interfaces[]`*. Nothing in the KCB extension itself is affected
by this: the extension entry, its `uri`, and its `params` are the same under either card version
(§2.3 governs the extension `uri`, not the card).

A2A's `AgentCard.capabilities.extensions` field is a list of **`AgentExtension`** objects, each
`{ uri, description, required?, params }` — the standard, in-band way to attach protocol-specific
metadata to a card without forking the A2A schema. The KCB manifest is one such extension,
identified by the stable extension URI **`https://w3id.org/koine/kcb/manifest/0.3`**; its `params`
object carries the KCB payload. That URI's namespace **root** moved at 0.4.1, and it is a matching
key — until **KCB 0.6.0** a consumer MUST also accept the legacy root as naming this same
extension (§2.3):

```jsonc
{
  // ── standard A2A AgentCard fields (abridged) ──
  "name":     "orchestrator:agent:composer",     // card identity — the KINP agent/entity id
  "supported_interfaces": [                       // A2A v1.0 — replaces v0.x's top-level "url"
    { "url": "https://…/a2a", "protocol_binding": "JSONRPC" }   // one AgentInterface; MAY be several
  ],
  "capabilities": {
    "extensions": [
      // ── the KCB manifest, as ONE AgentExtension on the card ──
      {
        "uri":         "https://w3id.org/koine/kcb/manifest/0.3",
        "description": "Koine capability-bus manifest",
        "required":    false,
        "params": {
          "kcb_version": "0.3.0",
          "mcp":         "https://…/mcp",          // MCP tools endpoint the extension still needs
          "produces":    [                          // ports emitted (§2.1)
            { "plane": "media", "media_types": ["audio/wav"], "world_pattern": "*",
              "schema_id": "sha256-…" }             // digest over this port's shape (§7.1)
          ],
          "consumes":    [                          // ports accepted
            { "plane": "knowledge", "dialect": "grounding-only", "schema_id": "sha256-…" },
            { "plane": "entity",    "types": ["mood", "scene"],  "schema_id": "sha256-…" }
          ],
          "capabilities": [                         // named, invocable units; i/o are ports
            { "name":    "compose",
              "version": "1.2.0",                                                  // semver, NEVER in the name (§7.1)
              "inputs":  [ { "plane": "knowledge", "shape": "mood-descriptor",
                             "schema_id": "sha256-…" } ],                          // knowledge IN
              "outputs": [ { "plane": "media", "media_types": ["audio/midi"],
                             "schema_id": "sha256-…" } ],                          // media OUT (delta F)
              "cost":    { "tier": "paid", "est_units": 1200 } }                   // path cost (delta K); outside the digest (§7.1)
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
  `consumes`, `capabilities` (with cross-plane ports, `cost`, and 0.4.0's `version`/`schema_id`,
  §7), `auth`, and `signing`. It
  **drops** the old top-level `identity` and `endpoints` blocks: those duplicated fields the
  AgentCard already carries and are now **read off the card itself** — `identity` from the card's
  own agent id (`name`), and the A2A endpoint from the card's own
  `supported_interfaces[]` (an `AgentInterface.url`; where the card advertises several bindings, the
  consumer selects one it speaks). Any non-A2A
  endpoint the extension still needs (e.g. the MCP tools URL) is a plain field in `params`.
- **A capability is `(name, version)`; a port carries a `schema_id`** (§7,
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)). Each entry in
  `params.capabilities` SHOULD carry a semver `version`, and each port in `params.produces`,
  `params.consumes`, and a capability's `inputs`/`outputs` SHOULD carry a content-addressed
  `schema_id`. Both are **additive and optional on read**: a card carrying neither is still a
  conformant manifest — a missing `version` reads as `0.0.0`-unknown (§7.1) and a missing
  `schema_id` means *no cross-check available*, never *invalid manifest* — and consumers MUST ignore
  manifest fields they do not understand (§7.2), so 0.3.0 and 0.4.0 readers and cards interoperate
  in both directions. The extension **URI does not move** for this addition: it names the
  payload-shape *family*, while the spec version rides in `params.kcb_version`. Minting a
  `…/manifest/0.4` URI for added optional fields would make every already-published card invisible
  to a crawler matching the old one — `compose-v2`'s fragmentation (§7.1) at the document level.
- Because the provider's identity is the card's KINP agent id, **a capability provider is itself a
  fabric entity** — an agent can be referenced, grounded, and reasoned about like any other node.
- **Prior art.** Extending A2A by convention rather than forking it is already the house style
  among control-plane implementations: an engine that defines the Google-A2A-aligned `AgentCard`
  type typically also extends the standard A2A `Message` with its own ACL extensions (e.g. a
  `fromAgent` / `toAgent` pair). The KCB manifest applies the same convention to the card's
  `capabilities.extensions[]`.

### 2.1 Ports span all planes (delta F)

Ports, capabilities, and their `cost` all live **inside the KCB extension's `params`** (§2) — the
`produces`, `consumes`, and `capabilities` arrays on `capabilities.extensions[]` whose `uri` is
`https://w3id.org/koine/kcb/manifest/0.3`. Collapsing the standalone manifest onto the AgentCard moves
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

Every port additionally carries an OPTIONAL **`schema_id`** — an algorithm-prefixed digest
(`sha256-…`, the KINP §3 form) over the canonicalized bytes of that port's *shape*. It does not
re-type the port; it is the subscriber's **cross-check** on the capability's declared `version`, so
that a schema edited without a bump is detectable rather than silent. What the canonicalization
covers, and what it deliberately excludes (`description`, `cost`, the `version` itself), is fixed in
§7.1; what a consumer does when a digest moves under an unchanged version is fixed in §7.2.

### 2.2 Migration — 0.2.0 standalone manifest → 0.3.0 card extension

0.2.0 served a standalone `/.well-known/kcb-manifest.json`; 0.3.0 folds that payload onto the peer's
existing A2A AgentCard as the `https://w3id.org/koine/kcb/manifest/0.3` extension (§2). Field-by-field:

| 0.2.0 standalone manifest field | 0.3.0 destination |
|---|---|
| `identity` (top-level) | **dropped** — read off the AgentCard's own agent id (`name`) |
| `endpoints.a2a` (self-reference to the card) | **dropped** — the A2A endpoint is the card's own `supported_interfaces[]` (A2A v1.0 `AgentInterface.url`) |
| `endpoints.mcp` (and any other non-A2A endpoint) | extension `params.mcp` (a plain `params` field) |
| `produces` | extension `params.produces` |
| `consumes` | extension `params.consumes` |
| `capabilities` (incl. cross-plane ports + `cost`) | extension `params.capabilities` |
| `auth` | extension `params.auth` |
| `signing` | extension `params.signing` |

- **Both MAY be served during transition — and the window now has a declared end.** A provider MAY
  continue serving the standalone `/.well-known/kcb-manifest.json` alongside the card extension; the
  extension on `/.well-known/agent-card.json` is the authoritative form wherever both are offered.
  0.3.0 bounded that window by a *condition* ("until all consumers crawl the extension"), which is
  not something a consumer can plan against, so under the deprecation policy (§7.3) this
  deprecation now names its own end: **the standalone manifest location is removed at KCB 0.5.0.**
  Past that version a provider MUST NOT rely on the standalone file being read and a registry is no
  longer obliged to crawl it. Nothing already published is invalidated (§7.3f), and the removal
  version MAY be moved later, never earlier (§7.3e).
- **`signing` MUST be preserved intact.** [`grounding-pack.md`](grounding-pack.md) line 313 declares
  `manifest.signing = {key_id, alg}` the *shared* signing shape between the KCB manifest and KGP
  packs; the collapse moves `signing` into `params` but MUST NOT change its shape, so provenance
  attribution (KINP §7) stays cryptographically valid across the migration.

### 2.3 Transition — the extension URI's namespace root moved (0.4.1)

The extension URI is a **matching key**, not a fetch target: a consumer identifies the KCB manifest
by string-comparing the `uri` of each entry in the card's `capabilities.extensions[]`. Changing that
string is therefore breaking for any consumer that matches on the old literal, and this section
states what a conformant participant does about it rather than leaving each implementation to guess.

**What moved.** Only the namespace *root*. The path and version segment are byte-unchanged, so the
two URIs name the same manifest-payload family and the same `0.3` shape:

| | Extension URI |
|---|---|
| **Legacy** — deprecated at 0.4.1, removed at **KCB 0.6.0** | `https://koine.dev/kcb/manifest/0.3` |
| **Current** — the form a producer emits | `https://w3id.org/koine/kcb/manifest/0.3` |

The root moved because the legacy hostname was **verified unregistered on 2026-08-11** — DNS held no
record for it and the host could not be resolved at all. An unregistered hostname standing as an
identifying URI is squattable, and there is no recovery once conformant implementations have shipped
the literal: a string already compiled into peers you do not operate cannot be recalled. `w3id.org`
is a community-run, redirect-only permanent-identifier service, so the identifier no longer depends
on any private domain registration staying renewed. Registration provenance (the PR that created the
entry) and the full rationale are recorded in
[ADR-0007](../decisions/ADR-0007-self-describing-participant.md)'s amendment log.

**The dual-accept window.** For the whole window — from 0.4.1 up to, but not including, **KCB
0.6.0**:

- **a. A consumer MUST accept both.** A consumer matching manifest extensions MUST treat an entry
  whose `uri` carries the legacy root and an entry whose `uri` carries the current root as
  identifying the **same** KCB manifest extension, and MUST read `params` identically from either. A
  consumer that matches only one of the two is non-conformant for the duration of the window.
- **b. A producer MUST emit the current form.** Every manifest a producer publishes MUST carry the
  `https://w3id.org/koine/…` URI on its KCB extension entry; a producer MUST NOT publish the legacy
  form alone.
- **c. Serving both is permitted; the current form is authoritative.** Per §7.3d a producer MAY
  *additionally* publish a second extension entry bearing the legacy URI with **byte-identical**
  `params`, so that a consumer written before this window still discovers it. Where both entries are
  present the current-root entry is authoritative, and a consumer MUST NOT count the legacy mirror
  as a second, distinct manifest.
- **d. The legacy form is deprecated on sight.** Discovery (§3) MUST keep returning a peer whose card
  carries only the legacy entry — marked deprecated, carrying the **0.6.0** removal version, and
  ranked below any peer that satisfies the same query with the current root (§7.3d).
- **e. At KCB 0.6.0 the obligation ends, not the readability.** Past 0.6.0 a producer MUST NOT emit
  the legacy URI and a consumer is no longer obliged to accept it. Nothing already published is
  invalidated (§7.3f) — an archival record naming the legacy URI stays resolvable (§7.4) — and the
  removal version MAY be moved later, never earlier (§7.3e).

**Why 0.6.0 rather than 0.5.0.** §7.3c requires at least one full minor between declaring and
removing, which 0.5.0 satisfies arithmetically; but 0.5.0 already carries §2.2's standalone-manifest
removal, and stacking two retirements in one release leaves a subscriber that first meets this
deprecation at 0.5.0 no version in which to act on it. 0.6.0 spends the whole 0.5.0 cycle as the
window. Per §7.3b that window is measured in KCB's own minor versions, never in wall-clock dates.

**Downstream obligation — named here, performed elsewhere.** Any implementation that pins the legacy
literal must migrate. A runtime commons carries the string in several places, including a
**byte-for-byte conformance corpus**: a corpus compared by bytes does not accept a substituted
string, so its fixtures must be re-emitted and re-hashed, not edited in place. Per
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) runtime work is not done in koine —
that migration is the cross-repo tasklist `agora:72-kcb-extension-uri-migration`, which depends on
this one. No schema in this repository models the AgentCard extension entry, so nothing here rejects
a legacy peer's card; clause **a** is prose, and prose is where a consumer's obligation lives. The
one schema that does name the URI — `participant-self-description.schema.json`'s
`manifest_extension_uri`, what a participant *declares it serves* — is the twin of clause **b** and
so admits the current form only.

---

## 3. Discovery registry

A thin index of manifests — *who offers what*. **The control-plane host provisions and hosts
it** (it is itself a host-provisioned org, per the fabric thesis: the interconnect fabric is
itself Company-as-Code). The registry is a cache/index over participants' own MCP/A2A surfaces,
not a source of truth — a provider's manifest is authoritative; the registry just makes it
findable.

- **Population:** participants register their manifest (push), or the registry crawls known A2A
  agent-cards / MCP servers (pull) and **reads the KCB extension off each peer's
  `/.well-known/agent-card.json`** — it looks for the `capabilities.extensions[]` entry whose
  `uri` is `https://w3id.org/koine/kcb/manifest/0.3` and indexes that entry's `params` (ports,
  capabilities, cost, and — where present — each capability's `version` and each port's
  `schema_id`, §7.1). There is no separate manifest file to crawl; a card without the extension
  simply advertises no KCB ports.
- **Query:** `find(port | plane | world | capability)` → matching manifests, ranked. Ports are
  the extension `params`' `produces`/`consumes`/capability ports (§2.1); media ports match by
  `media_type` **and** `world_pattern` (delta J). A capability query matches a capability **name
  plus an OPTIONAL version range** (§7.1): the bare name matches every published version, a range
  (e.g. `^1`) only what satisfies it.
- **Ranking across versions (§7).** Among entries satisfying the same query the registry MUST rank
  the **highest satisfying version** first, and MUST rank a **deprecated** entry below any
  non-deprecated entry that satisfies the same query — while still returning it, marked and carrying
  its removal version (§7.3d). This is what makes a successor discoverable *beside* its predecessor:
  an unpinned consumer migrates by re-discovering, a consumer pinned to `^1` keeps finding 1.x, and
  either way a subscriber meets a break or a deprecation at **discovery or `describe`** time rather
  than at `invoke` (§7.2).
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
  mandatory path. The registry + resolver reference implementation is a downstream runtime
  concern, not part of this contract.

---

## 4. Verbs

| Verb | Transport | Meaning |
|---|---|---|
| **discover** | registry query (§3) | find providers by capability / interchange type / world |
| **describe** | one A2A agent-card fetch (`/.well-known/agent-card.json`) + MCP `tools/list` for tool schemas | fetch the provider's AgentCard **including its KCB extension** (`capabilities.extensions[]`, §2) in a single fetch — there is no second `/.well-known/kcb-manifest.json` to retrieve |
| **invoke** | MCP `tools/call` / A2A task | run a capability; inputs/outputs are KINP ids + KGP/media payloads by reference |
| **subscribe** | A2A streaming (MCP notifications only on the pre-2026-07-28 wire — §4.1) | register for a world or capability; receive KGP **deltas** (KGP §6) or media events as they occur |
| **fetch** | CAS GET by `asset` id | retrieve asset bytes by their KINP id; integrity self-verifies against the hash (delta G). Requires a `fetch:asset` grant (§5). |

`subscribe` is the control-plane half of KGP §6 subscriptions: KGP defines the delta payload,
KCB defines how a consumer registers and how the stream is delivered. Ordering-independence
(KGP §6) means the bus needs no exactly-once guarantee — content-addressed claim ids make
redelivery idempotent. Because a stream may deliver a **reference** (an EDL, a claim) before the
referenced asset's bytes have propagated, consumers MUST tolerate dangling asset references and
`fetch` them lazily on demand; producers MUST NOT assume bytes are pre-propagated (delta L).

### 4.1 Which MCP wire each verb assumes

KCB pins **MCP revision 2026-07-28** (§1.1), whose core is stateless. Because that revision breaks
against its predecessor, every clause above that touches MCP is audited here rather than left to the
reader: a verb is either *wire-independent* — it is a request/response exchange that never needed a
session — or it is named as assuming one wire. **No KCB clause requires the `initialize` handshake
or a session id.**

| Clause | How it uses MCP | Under the pinned revision |
|---|---|---|
| §2 `params.mcp` | An **address**, not a connection | Wire-independent. The field names where a peer's MCP surface is; it has never carried, or implied, a session. |
| §3 registry crawl | Pull over a peer's MCP/A2A surfaces | Wire-independent. The crawl reads the KCB extension off the **A2A card** (§2); its MCP leg is request/response. |
| §4 **describe** — `tools/list` | Request/response | Wire-independent. KCB reads the manifest off the A2A card, so `tools/list` supplies *tool schemas* only. The pinned revision's mandatory **`server/discover`** is the MCP-native way to learn what a server is; KCB neither requires nor forbids calling it, because the KCB payload is not served from there. |
| §4 **invoke** — `tools/call` | Request/response | Wire-independent, and *better* served by the pinned revision: a capability grant (§5) and the invoked capability's version travel **per call**, which is exactly what per-request `_meta` is for. Nothing in §5 or §7 reads state left by a previous call. |
| §4 **fetch** | CAS `GET` by asset id | Wire-independent — not an MCP call at all. |
| §4 **subscribe** | Server→client **stream** | **The one session-shaped clause.** A stateless core has no client-scoped channel a server may push to, so under the pinned revision a `subscribe` stream is delivered over **A2A streaming**. "MCP notifications" names the pre-2026-07-28 wire; a participant on that wire MAY still deliver there, and a consumer MUST NOT assume it. |

The `subscribe` split costs the contract nothing, and that is by construction: KGP §6 deltas are
ordering-independent and content-addressed, so redelivery is idempotent and the bus needs no
exactly-once guarantee (§4). Which leg carries the stream is therefore a transport choice, not a
semantic one — no assertion in §5, no rule in §7, and no KCS assertion (KCS §5) reads it.

Two consequences for a reader on the older wire. First, nothing here retires it: KCB describes both,
and the pin records which one KCB was validated against. Second, a scenario that drives real
participants must **record which revision each speaks**, because a green run on one wire is not
evidence for the other — that recording is KCS's, and is noted there
([`conformance-scenario.md`](conformance-scenario.md) §4).

---

## 5. Trust & authorization

- **Capability grants.** Invocation requires a capability token naming the granted verb + scope
  — `invoke:compose`, `subscribe:world/consensus-reality`, `fetch:asset` (delta G). Grants are
  issued by the hosting org's governance (the control-plane host's workforce governance) and are
  **per-capability, per-world, and carry a spend ceiling** (`budget_units`, delta K), so a
  cross-participant chain (knowledge producer → media producer → paid model) cannot exceed the caller's authorized
  spend. Path-finding (§3) prefers zero-cost routes and surfaces the projected cost before an
  `invoke`.
- **A grant binds to `(capability, major)`** (§7,
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)). `invoke:compose` issued
  while `compose` was at major 1 authorizes every **1.x** — which is what §7.2's compatibility rule
  exists to make safe — and does **not** authorize major 2. A provider therefore cannot widen what
  an already-issued token permits by publishing a breaking change: the successor requires a new
  grant from the hosting org's governance. Fail closed. The grant's `invoke:<capability>` **form is
  unchanged** — the major travels with the issuance and is never encoded into a new grant name,
  which would fragment authorization the way `compose-v2` fragments discovery (§7.1).
- **A re-priced capability fails closed, never silently.** `cost` sits *outside* a port's
  `schema_id` (§7.1) because price is not shape, so re-pricing does not re-digest the contract and
  does not signal a break that is not one; it is a **minor** bump (§7.2), so the version moves and a
  pinned subscriber can see it. Enforcement is unchanged: path search (§3) returns the projected
  cost *before* invoke, and the grant's `budget_units` ceiling is evaluated at invoke against the
  **then-published** cost — a raise beyond the caller's remaining ceiling fails at the gate rather
  than overspending (delta K). A capability moving `cost.tier` from `free` to `paid` is this case
  and not a special one: path search stops preferring it, a zero-budget grant stops reaching it, and
  there is no silent bill.
- **Signing.** Manifests and KGP packs share one signing shape (`{key_id, alg}`); inter-project
  packs and invocations SHOULD be signed so provenance (KINP §7 `prov.agent`) is
  cryptographically attributable, not merely asserted.
- **Merge-review linkage.** A pack arriving from a low-trust provider feeds the hybrid merge
  **review queue** (KINP §11 decision 2) rather than auto-applying — trust level becomes an
  input to merge aggressiveness. This is the concrete tie between the control plane's auth and
  the knowledge plane's contamination controls.

Full auth mechanics (token issuance, rotation, identity providers like Keycloak/Authentik)
live in the control-plane host's infra; KCB fixes only the *shape* of grants and signing so the
planes agree.

---

## 6. Mapping onto existing surfaces (by role)

| Role | Typical starting point | KCB participation |
|---|---|---|
| **Control-plane host** | MCP sidecars, an A2A SDK, workforce governance, agent generator seams | Provisions the registry (§3); issues grants (§5); every agent it runs publishes the KCB extension **on its own A2A agent-card** (no separate manifest file). |
| **Media authority** | an HTTP `/mcp` surface, a served `/.well-known/agent-card.json`, an API surface map | Publish the KCB extension **on the agent-card it already serves**; the extension's `params.produces` carries media ports with `world_pattern` (delta J) so a peer can discover "media *from world X*" by crawling that card; `produces` media + `grounding-only` knowledge (with `source_world`); `subscribe` to grounding worlds. |
| **Knowledge authority** | a resolver + KGP producer, a graph API | Expose `resolve`/`reconcile`/`query` and KGP snapshot/delta as capabilities; the authority provider. |
| **World producer** | a simulation/game server, generators | Consume grounding capabilities; expose world-export as a capability; in-world agents MAY publish their own manifests. |
| **Domain consumer → provider** | no agent surface yet | Consumer first (ground its own design work); later a **provider** — expose its native operation ("render this instrument") as an invocable capability so a peer's agents can drive it. |

---

## 7. Versioning, compatibility & deprecation

How a provider evolves a capability's schema without breaking subscribers. This was KCB's open
question 2 through 0.3.0, stated as a fork — *semver on capability names* vs *content-addressed
schemas*. [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) decides it by
layering both, because they answer different questions: **semver states intent, the content digest
establishes identity, and the digest is what makes the intent falsifiable.**

The bus is built for exactly the situation that breaks subscribers — a capability is discovered by
its **ports** (§2.1) and matched by the registry's path search (§3) rather than read by a human
before each call, so a consumer binds to a *shape* at discovery time and may hold that binding for
the life of a `subscribe` (§4); and a manifest rides on the peer's own card (§2), is crawled and
cached (§3), and has no push channel to invalidate what a subscriber already bound to. This section
is what a subscriber holds instead of that channel.

It is **additive** to §2 — fields, not a redefinition of the manifest. The extension URI does not
move, existing `params` field names are unchanged, `signing` stays shape-identical to KGP's
`manifest.signing`, the port model of §2.1 is not re-typed, and both new fields are optional on read.

### 7.1 A capability is `(name, version)`; a port carries a `schema_id`

**Capability identity.** Every entry in `params.capabilities` (§2) SHOULD carry a semver
**`version`**. The pair `(name, version)` — not the name alone — is the unit of **discovery** (§3),
of **grant scope** (§5), and of what a subscriber pins. The version is **a field, never part of the
name**: `compose` at `2.0.0` stays discoverable as `compose`, and `compose-v2` is not conformant,
because the registry matches capability *names* and a successor hiding under a different name is
invisible to a subscriber searching for the original. A capability entry without `version` is read
as **`0.0.0`-unknown** and MUST be treated by a consumer as pinnable only by digest.

**Port identity.** Every port — in `params.produces`, `params.consumes`, and each capability's
`inputs`/`outputs` — SHOULD carry a **`schema_id`**: an algorithm-prefixed digest in the KINP §3
form (`sha256-<lowercase hex>`) over the canonicalized bytes of that port's declaration.

**Canonicalization.** The bytes hashed are a JSON serialization of the port object reduced to shape
and normalized, so that two providers declaring the same port produce the same digest and one
provider re-serializing produces no drift:

1. **Keep only shape keys** — `plane`, plus that plane's type vocabulary from §2.1's table:
   `dialect`, `worlds`, `shape` (knowledge); `media_types`, `world_pattern` (media); `types`
   (entity). Every other key is dropped before hashing, explicitly including `description`, `cost`,
   the capability's own `version`, and `schema_id` itself. `cost` is priced, not typed (§5), so a
   re-price must not re-digest; and folding the `version` in would make every digest trivially
   unique and therefore useless as a cross-check *on* that version.
2. **Normalize values** — array-valued vocabularies (`media_types`, `types`, `worlds`) are sorted
   lexicographically by Unicode code point and de-duplicated; a key whose value is absent or empty
   is dropped rather than serialized as `null` or `[]`.
3. **Normalize the serialization** — UTF-8; object keys sorted lexicographically by code point; no
   insignificant whitespace; no trailing newline; shortest-form JSON string escaping. The same byte
   discipline KINP §3 applies to a claim id.
4. **Hash and prefix** — `sha256` over those bytes, lowercase hex, prefixed with the algorithm name
   and a hyphen. A future algorithm is a **new prefix**, never a reinterpretation of this one.

**Falsifiability is the point.** A consumer recomputes the digest from the card it fetched itself
(`describe`, §4) and compares it against the published value. The digest is a **fact** the consumer
can check from bytes in hand; the `version` is a **claim** the provider makes. Digests catch a
forgotten bump and are silent on meaning; versions carry meaning and cannot be verified. Neither
replaces the other, and a missing `schema_id` means *no cross-check is available* — never *invalid
manifest*.

### 7.2 The subscriber-compatibility rule

A **live subscriber** is any consumer holding a discovery binding or an open `subscribe` (§4)
against a `(name, major)`. This table is normative: it fixes what a provider MAY change under a
given bump.

| Change to a published capability | Bump | Breaks a live subscriber? |
|---|---|---|
| Add a **new capability** to the manifest | minor | No |
| Add an **optional** input field, or an optional input port | minor | No |
| **Widen** an input port — accept more `media_types`, a broader `world_pattern`, more entity `types` | minor | No |
| **Add** an output field, or an additional produced `media_type` | minor | No — consumers MUST ignore unknown output fields |
| Editorial only — `description`, examples; no `schema_id` change | patch | No |
| Change `cost` | minor, and never silent (§5) | No |
| Add a **required** input, or make an optional input required | **major** | Yes |
| **Remove or rename** a capability, a port, or a field | **major** | Yes |
| **Narrow** an input, or **remove/narrow** an output type | **major** | Yes |
| **Tighten** a produced port's `world_pattern` | **major** | Yes — it silently shrinks what the subscriber discovers (delta J) |
| Change the **meaning** of an existing field at unchanged type | **major** | Yes — and only the declared bump can say so |

Two obligations fall out of that table, and both are normative.

- **Consumers MUST ignore unknown fields.** A consumer MUST ignore output fields it does not
  understand, and MUST NOT reject a manifest carrying capabilities or ports it does not understand.
  Without this, every additive change is breaking and the minor tier is fiction. It is the same
  tolerance §4 already requires of consumers for dangling asset references (delta L).
- **A digest change with no version change is a defect**, not a compatible edit. A provider MUST
  bump at least the minor when a port's `schema_id` changes. A consumer observing a `schema_id`
  that differs from the one it bound to at an **unchanged** `version` has detected a **silent
  mutation**: it MUST treat the capability as unusable and MUST NOT guess which side is right.
  Re-discovery (§3), not a retry, is the recovery.

**A breaking change is published as a successor, never edited in place.** A provider MUST NOT mutate
a published `(name, major)` into an incompatible shape. It publishes an **additional** entry in
`params.capabilities` at the new major, serves **both** for a transition window, and marks the
predecessor deprecated with a declared removal version (§7.3). So the signal for a break is the
*appearance of a new major beside the old one*, visible at discovery or `describe` time: the
capability a subscriber bound to keeps working, the successor is discoverable next to it, an
unpinned consumer migrates by re-discovering and a pinned one when it chooses. **A subscriber never
learns of a break by failing an invoke.**

This is the rule two other parts of the fabric are already instances of: a **relation signature** is
immutable once published ([`../registry/README.md`](../registry/README.md)) because changing it
changes every dependent claim id, and a **claim or asset id** *is* its content (KINP §3). In all
three cases the fabric evolves by adding a successor and retiring the predecessor on a declared
schedule — never by mutating a published surface.

### 7.3 Deprecation — a retiring surface names its own end

The window §7.2 opens, stated once for **every** retiring surface the bus has: a capability major, a
media type, a manifest location (§2.2), an extension URI.

- **a. A deprecation is a declaration, and it names its own end.** To deprecate a surface is to
  publish, in the same release: (i) the successor, (ii) an explicit deprecated marking on the
  predecessor, and (iii) a **removal version** — the version at which the obligation to emit or
  accept the predecessor ends. A deprecation that names no removal is not a deprecation; it is an
  unbounded promise a subscriber cannot plan against.
- **b. The window is measured in the retiring surface's own versions, never in wall-clock dates.**
  For a capability that axis is §7.1's semver. For a surface with no version of its own — a media
  type, a manifest location, an extension URI — it is the **minor version of the spec that defines
  it**. A version is a deadline a consumer can read off the contract; a calendar date is a
  *deployment* fact, visible only to the operator and enforceable by nothing on the wire.
- **c. Never in the same release: at least one full minor.** The declared removal MUST be at least
  one minor after the version that declared the deprecation, so that declaring and removing are
  never the same publication and a consumer one version behind still meets the deprecation before
  the removal.
- **d. Both forms are served, and the predecessor stays functional, for the whole window.**
  Deprecated means *superseded*, not *degraded*. Where both are offered for the same thing the
  **successor is authoritative**. Discovery (§3) MUST keep returning a deprecated entry — marked,
  and carrying its removal version — while ranking it below any non-deprecated entry that satisfies
  the same query, so a subscriber meets the deprecation at discovery or `describe` time.
- **e. A declared removal moves later, never earlier.** Extending a window is a fresh declaration
  and is compatible with everyone. **Shortening** one breaks every subscriber that planned against
  it and MUST NOT be done; a predecessor that must go sooner than declared goes as a new major under
  §7.2, not as a re-dated retirement.
- **f. Removal ends the obligation, never the readability.** Past the removal version a producer
  MUST NOT emit the retired form and a consumer is no longer obliged to accept it. Nothing already
  produced is invalidated: content-addressed artifacts stay valid and fetchable, and an archival
  record naming a retired contract version stays resolvable (§7.4). Retirement is a statement about
  the **live** contract only.

Three surfaces are mid-window under this policy today: KCB's own standalone
`/.well-known/kcb-manifest.json`, removed at **KCB 0.5.0** (§2.2); the **legacy namespace root**
of the §2 manifest extension URI, removed at **KCB 0.6.0** (§2.3); and KMI's deprecated
`application/vnd.koine.edl+json`, removed at **KMI 0.4.0**
([`media-interchange.md`](media-interchange.md) §4.4).

### 7.4 An archival pin is not a live binding

A record that *names* a contract version is not a subscriber to it, and the two are governed
differently on purpose. The case the fabric already has is a finetuned model, which pins the
`kft_version` it was trained under ([`fine-tuning.md`](fine-tuning.md) §11.5) and — because the run
was an `invoke` on this bus — the `(name, version)` and port `schema_id`s of the `finetune`
capability that produced it.

A live subscriber must be **protected from change**; an archival pin must merely stay
**resolvable**. So retirement under §7.3 ends the obligation to *emit or accept* a retired version,
and never the ability to *read* what was recorded under it. A finetuned model therefore does not
"break" when its producing capability reaches a new major: it still reproduces, audits, and compares
against the contract it names. A **re-run** is a new `invoke` and is governed by §5's grant rule
like any other — the pin explains what was trained; it does not authorize training again.

### 7.5 Pressure test for this section

§7 is normative text that has not yet been broken against, and an unexercised canonicalization
(§7.1) rots. Before KCB re-ratifies, the **mutate-live-schema** scenario MUST break-test it: a
provider ships a capability v2 while a v1 subscriber is live, and the scenario asserts that the v1
binding survives, that a `schema_id` change under an unchanged `version` is caught as a silent
mutation (§7.2), that the v1 grant does not reach v2 (§5), and that a cost raise fails closed
against the spend ceiling rather than overspending. Prefer finding the break to asserting
correctness.

**That scenario has landed and been run:**
[`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md). All four
assertions above were exercised and **three broke**, along with four more the section had not
anticipated — deltas **V-1…V-8**, of which **V-2, V-4, V-5 and V-7** are blocking. §7's *model* is
not in question (semver for intent, digest for identity, successor-never-mutate-in-place all held,
several under direct attack); its *perimeter* is: nothing carries a version at invoke time (V-5) and
the second major has no address on the transport (V-4), so the dual-serving window §7.2 mandates
cannot be operated; no §7 signal reaches a streaming subscriber (V-7); and the digest is blind on
knowledge ports (V-2) and incomparable across a spec minor (V-3). Every proposed fold is additive.
The scenario's *Re-ratification — what this pass gates* section states the condition precisely: this
pass discharges §7.5's requirement that the break-test be **written and run**, and does **not**
discharge the gate, because the run was not clean. **KCB stays Candidate** until those folds land
(a minor — **0.5.0**, the version §7.3 already schedules for §2.2's removal) and the break-test
re-runs clean.

---

## 8. Open questions

1. **Registry federation** — a single host-provisioned registry vs. per-org registries that
   peer. (Mirrors KINP §11 decision 1; likely resolve the same way: one authority as a role,
   federation as a future option.)
2. **Subscription backpressure** — flow-control for high-volume-world subscriptions (per-invoke
   *cost* is now handled by capability `cost` + grant spend ceilings, §2.1/§5); firehose
   flow-control remains an infra concern for the host's cost advisor.

*Resolved and moved:* **capability versioning & deprecation** was open question 2 through 0.3.0. It
is decided by [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) and is now
normative **§7**; the numbering of the two questions above shifted accordingly in 0.4.0.

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
All blocking deltas were folded in 0.2.0: **F** (ports span all planes, §2.1/§3), **G**
(`fetch` verb §4 + `fetch:asset` grant §5), **J** (`world_pattern` on media ports, §2.1/§3),
**K** (capability `cost` + grant spend ceiling + cost-aware path search, §2.1/§3/§5), **L**
(dangling-reference tolerance, §4).

**0.3.0 re-check — the AgentCard-extension collapse reopens none of F/G/J/K/L.** The change is
one of *shape and location*, not of the port/cost/world model: F's cross-plane ports and K's
capability `cost` moved verbatim into the extension's `params.produces`/`consumes`/`capabilities`
(§2.1), and J's `world_pattern` still rides on media ports in `params.produces` — the port table,
the "compose a score from a mood" cross-plane leg, and cost-aware path search all hold unchanged,
now matched off peers' card extensions (§3). G (`fetch` verb + `fetch:asset` grant) and L
(dangling-reference tolerance) live in §4/§5 and are untouched by the manifest collapse. Because no
delta is reopened, the 0.3.0 **Candidate** has a clean re-ratification path: re-run
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the extension
shape (discovery now crawls the `https://w3id.org/koine/kcb/manifest/0.3` extension off
`/.well-known/agent-card.json` rather than fetching a standalone `/.well-known/kcb-manifest.json`)
and confirm each leg still resolves; nothing in the port contract needs to change to re-ratify.

**0.4.0 — a second gate.** The versioning fold (§7) reopens no delta either: it adds `version` and
`schema_id` as optional `params` fields (§2/§2.1) and leaves the port model, the verbs, `signing`,
and the extension URI untouched, so the 0.3.0 re-check above still holds verbatim. But §7 states
rules the media-transform scenario never exercises — a live subscriber across a version bump, a
digest that moves without one, a grant meeting a new major, a cost raise meeting a ceiling — and it
therefore has its own break-test:
[`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) (§7.5).
**Re-ratifying KCB needs both passes:** the extension-shape re-run *and* a clean mutate-live-schema
pass. The break-test has now been **written and run**, and it is **not clean** — deltas **V-1…V-8**,
blocking **V-2** (the digest is blind on knowledge ports), **V-4** (a second major is unaddressable
on the transport), **V-5** (nothing carries a version at invoke time, so §5's grant rule has no
operand) and **V-7** (no §7 signal reaches a live `subscribe`). All folds are additive; see §7.5 and
that scenario's *Findings* and *Re-ratification* sections. The extension-shape re-run remains
outstanding and independent.

## Changelog

- **Editorial** (2026-08-13) — Fixed the **direction of authority** on §1.1's pin table. It read
  *"the pin of record is this table"*, which conflicted with KMI §4.1, KFT §3.2 and §4.1.1, and
  [`../docs/upstream-standards.md`](../docs/upstream-standards.md) itself, all of which treat that
  file as the record — leaving two documents each claiming to be the one place a pin could be wrong.
  §1.1 now states that the file wins and that §1.1 is a standalone-readability restatement, with the
  reason the direction is the reverse of a spec's own version/status mirrors: an upstream revision is
  a shared fact across specs, so it is recorded once where a single drift sweep can check it, whereas
  a spec's own version is a property of that spec and its header wins. **No pin value changed** —
  A2A **v1.0** and MCP **revision 2026-07-28** are the same two rows — and **no clause changed**: §2
  and its extension entry, §2.3's dual-accept window, §3, §4's verbs, §4.1's per-verb wire audit,
  §5's grants and §7's versioning surface are byte-unchanged, so a manifest conformant at 0.4.3 is
  conformant unchanged. Stays **0.4.3 Candidate** on the same two restated gates.
- **0.4.3** (2026-08-13) — **Candidate.** Pinned the **MCP revision** KCB maps onto — **2026-07-28**
  — in the **§1.1** table beside the A2A pin, and added **§4.1**, a per-clause audit of which MCP
  wire each verb assumes. *Why a pin was required here and not merely tidy:* that revision is a
  **breaking change**. It replaced a session-oriented wire with a **stateless core** — no
  `initialize` handshake, no session id, per-request context in a per-request **`_meta`** — and made
  **`server/discover`** the mandatory way a server describes itself, in place of what the handshake
  used to return. The two wires are not interchangeable, so "over MCP" without a revision is not an
  implementable instruction. *What §4.1 settles:* **no KCB clause requires the handshake or a session
  id**, and each is now said so explicitly rather than left to inference — `params.mcp` is an address,
  the §3 crawl and §4 `describe`/`invoke` are request/response (a grant and a capability version
  travel per call, which is what `_meta` is for), and `fetch` is not an MCP call at all. The single
  session-shaped clause is §4 **`subscribe`**: a stateless core has no client-scoped channel a server
  can push to, so under the pinned revision a subscription stream is delivered over **A2A streaming**,
  and "MCP notifications" is named for what it is — the **pre-2026-07-28** wire, still permitted to a
  participant on it, never assumable by a consumer. That split is free because KGP §6 deltas are
  ordering-independent and content-addressed (§4), so no §5 rule, no §7 rule and no KCS assertion
  reads which leg carried the stream. *Scope — what did not move:* **no field is added to or removed
  from any KCB surface.** The manifest is byte-identical — the `capabilities.extensions[]` entry, its
  `uri` (§2.3) and every `params` field; no participant is required to declare its MCP revision,
  because the revision is a property of the endpoint `params.mcp` already names, and where a run needs
  it recorded that is a scenario's job (KCS §4, informative). The verbs, the grant model, §7's
  versioning surface, and every pre-existing MUST/SHOULD are unchanged. *Classification:* **patch** —
  a clause that was silent is now explicit, and a transport disjunction §4 already offered is
  attributed to the wire each half needs; a manifest that conformed at 0.4.2 conforms unchanged at
  0.4.3, and an implementation on the pinned revision was always the intended reader. (Independently:
  **0.5.0 is spoken for** — §7.3 declared §2.2's standalone manifest removed there — so a minor could
  not be spent on this without breaking that promise.) Status stays **Candidate** on the *unchanged*
  pair of gates restated at 0.4.1 and 0.4.2 — the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) and a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **0.4.2** (2026-08-13) — **Candidate.** Corrected two references that had drifted behind the
  standards KCB rides on, and pinned both in a new **§1.1**. *(i) A2A.* The §2 example AgentCard
  showed the **v0.x** top-level `"url"`; **A2A v1.0** replaced it with **`supported_interfaces[]`**,
  each entry an **`AgentInterface{ url, protocol_binding }`**. The example, the §2 prose that reads
  the A2A endpoint "off the card's own service URL", and §2.2's migration row now all describe the
  v1.0 shape — so koine's canonical illustration of the document its manifest rides inside is no
  longer a major version behind it. *(ii) MCP.* §4's `describe` row named the pre-JSON-RPC-namespacing method for
  listing tools; under the pinned revision the method is **`tools/list`**. The `invoke` row's prose "MCP tool call" is likewise now the method,
  **`tools/call`**. *Scope — what did not move:* the **KCB manifest's own shape is unchanged**. The
  `capabilities.extensions[]` entry, its `uri` (`https://w3id.org/koine/kcb/manifest/0.3`, §2.3), and
  every `params` field — `kcb_version`, `mcp`, `produces`, `consumes`, `capabilities`, `auth`,
  `signing` — are byte-identical; only the *host card* around it and the *method names* KCB calls
  move. §7's versioning surface, the verbs themselves, the grant model and every MUST/SHOULD are
  untouched. *Classification:* **patch** — nothing is added to or removed from a KCB surface and
  nothing narrows; a manifest that conformed at 0.4.1 conforms unchanged at 0.4.2, and a consumer
  already speaking A2A v1.0 and current MCP was always the intended reader. The corrections make the
  spec match what a conformant implementation must already do. Status stays **Candidate** on the
  *unchanged* pair of gates restated at 0.4.1 — the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) and a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **0.4.1** (2026-08-13) — **Candidate.** Moved the §2 manifest extension URI's namespace **root** to
  a `w3id.org` permanent identifier — `https://koine.dev/kcb/manifest/0.3` →
  `https://w3id.org/koine/kcb/manifest/0.3` — and opened the transition window that retires the
  legacy root (**§2.3**, new). *Reason:* the legacy hostname was **verified unregistered on
  2026-08-11** (DNS held no record; the host would not resolve), so the identifier the fabric names
  itself by was squattable, with no recovery once conformant implementations had shipped the literal;
  registering it ourselves would only have converted the exposure into a renewal that must never
  lapse. Provenance of the w3id entry and the full rationale:
  [ADR-0007](../decisions/ADR-0007-self-describing-participant.md)'s amendment log. *The window:* the
  URI is a **matching key**, so from 0.4.1 up to but not including **KCB 0.6.0** a consumer MUST
  accept **both** roots as identifying the same extension, a producer MUST emit the w3id form (and
  MAY additionally serve a byte-identical legacy mirror entry, §7.3d), discovery marks the legacy
  form deprecated and ranks it below (§7.3d), and at 0.6.0 the obligation — never the readability
  (§7.3f/§7.4) — ends. 0.6.0 rather than 0.5.0 because §7.3c's one-minor minimum would otherwise land
  the removal in the same release as §2.2's, leaving a subscriber that first meets this deprecation
  no version in which to act (§2.3). *Classification:* **patch**, not minor — nothing is removed and
  nothing narrows during the window (the read side *broadens* to two accepted roots, and §7.3c
  forbids declaring and removing in one publication, as KMI 0.3.1 did for `edl+json`); the narrowing
  is the 0.6.0 removal, and that is the minor. The manifest payload shape, the `…/kcb/manifest/0.3`
  path and version segment, the verbs, `signing`, §7's versioning surface, and every other MUST/SHOULD
  are unchanged. In-repo occurrences moved with it (both ADR bodies, docs, `ROADMAP.md`, and
  `schemas/participant-self-description.schema.json` + its fixture, whose `manifest_extension_uri`
  pattern is the twin of the producer clause and so admits the w3id form only); the 0.3.0/0.4.0
  entries below are **not** rewritten — they record the root current when those versions shipped.
  *Downstream, not done here:* implementations pinning the legacy literal migrate under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) — the cross-repo tasklist
  `agora:72-kcb-extension-uri-migration`, which depends on this one and whose **byte-for-byte
  conformance corpus** must be re-emitted and re-hashed rather than string-substituted. Status stays
  **Candidate** on the *unchanged* pair of gates: the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) **and** a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **Editorial** (2026-08-13) — §7.5's break-test is no longer a forward reference: it names the
  landed scenario [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)
  and records its outcome (deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7 — §7's model held, its
  perimeter did not), as do the status note and the **Pressure test** §. No normative change: no
  clause, field, canonicalization or version-range rule is touched, and the deltas are **not folded
  here** — they land in a later minor (**0.5.0**), which is also where §7.3 already schedules §2.2's
  removal. Version and status are unchanged: **0.4.0, Candidate**, still on both gates.

- **0.4.0** (2026-08-13) — **Candidate.** Encoded the capability-versioning decision
  ([ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)): the old §7 open question
  2 is now the normative **§7**. A capability is `(name, semver version)` and every port carries a
  content-addressed `schema_id` whose canonicalization bytes are fixed here (§7.1); the
  subscriber-compatibility table, the ignore-unknown-fields obligation, the digest-without-a-bump
  defect, and successor-never-mutate-in-place are normative (§7.2); the deprecation policy — a
  removal version declared *at* deprecation, measured in versions rather than dates, at least one
  minor out, dual-served, moveable later but never earlier, ending obligation but never readability
  — is stated once for every retiring surface (§7.3); and an archival pin is distinguished from a
  live binding (§7.4). Wired through §2 (`version`/`schema_id` in the extension example and its
  optional-on-read rule), §2.1 (`schema_id` on ports), §3 (name + version-range matching;
  highest-satisfying-version first and deprecated ranked below), and §5 (a grant binds to
  `(capability, major)`; a `cost` change is a minor that fails closed at the ceiling). §2.2's
  standalone `/.well-known/kcb-manifest.json` gains the removal version its condition-bounded window
  lacked — **KCB 0.5.0**. Open questions renumbered into §8. **Additive** per ADR-0009 decision 8:
  fields added, none removed, nothing narrowed, extension URI unchanged at
  `…/kcb/manifest/0.3` (that fold moved no URI; the namespace *root* moves later — §2),
  `signing` shape-identical, no delta F/G/J/K/L reopened, and
  0.3.0 cards and already-issued grants still valid — hence a minor bump. Status stays **Candidate**,
  now gated on the 0.3.0 extension re-run **and** the §7.5 mutate-live-schema break-test
  (`chief/56-live-schema-mutation-scenario`).

- **Editorial** (2026-07-31) — Agnostic reframe, part 2: the §2 card identity uses the KINP §3.4
  illustrative placeholder namespaces; registry hosting, grant issuance, auth infra, and the §7
  open questions (§8 as of 0.4.0) name the **host** role rather than a named product. No normative change — the
  manifest shape, extension URI, verbs, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.3.0** (2026-07-22) — **Candidate.** Redefined the §2 manifest as a named A2A **AgentCard
  extension** (`capabilities.extensions[]`, uri `…/kcb/manifest/0.3`, under the namespace root
  current at the time — the root has since moved, §2) instead of a
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
