# Koine Media-Interchange Protocol (KMI)

**Spec version:** 0.3.0
**Status:** Candidate
**Last updated:** 2026-08-02
**Applies to:** media authorities (producer/authority for assets + timelines), media producers of
any modality, and media consumers.
**Depends on:** [`identity.md`](identity.md) (KINP) for the `asset` id, `source_world`, and
`attaches_to`; [`grounding-pack.md`](grounding-pack.md) (KGP) for the analysis→knowledge
bridge; [`capability-bus.md`](capability-bus.md) (KCB) for transforms-as-capabilities.
**Adopts:** [OpenTimelineIO](https://opentimeline.io) (OTIO) as the canonical timeline /
composition model (§4, [ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md)).

> **Status note (0.3.0):** dropped from Ratified back to **Candidate** because 0.3.0 changes the
> *canonical composition model* — a timeline is now an OTIO `Timeline` (§4) and the bespoke
> `application/vnd.koine.edl+json` EDL is deprecated (§4.4) — which re-enters validation per the
> koine draft→candidate→ratified convention. Re-ratification path: re-run
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the OTIO
> model (no delta F/H/I is reopened — see **Pressure test**).

> The **media data plane** — the fourth and final plane. Where KGP moves *facts*, KMI moves
> *bytes and the edits over them*: assets, their technical metadata, the asset-lineage graph
> (re-encodes, variants, clips), the timeline/composition model, and the typed contract
> that makes "any-to-any" transformation a **path computed over capabilities** rather than a
> central transform-gateway. It generalizes what a media authority already builds in isolation —
> an asset library, a probe over technical metadata, an editorial timeline, and NLE interchange
> (FCPXML / `xmeml` / CMX3600 / programmatic render) — into one interchange contract.

Division of labor with KINP: KINP fixes the `asset` *identifier*, `source_world`, and
`attaches_to` (KINP §7.2). KMI defines everything else about an asset — technical metadata,
the asset-lineage relations (KINP delta E lives here), and transform typing. Division of labor
with **OTIO**: OTIO owns the composition model (tracks, clips, timing, transitions, effects,
nesting); KMI owns the **additive layer** OTIO has no model for — identity, lineage, and
knowledge (§4.2).

---

## 1. Scope

KMI defines:
- the **asset envelope** — technical metadata over the KINP `asset` id (§2),
- the **asset-lineage graph** — `derived_from` / `variant_of` / `excerpt_of` /
  `perceptual_match` (§3),
- the **timeline / composition** model — the adopted OTIO model, koine's additive layer over it,
  and NLE interchange through OTIO's adapters (§4),
- the **analysis → knowledge bridge** into KGP (§5),
- **transform typing** — the media-plane port profile; cross-plane typing lives in KCB §2.1 (§6),
- **byte transport** via a content-addressed store (§7),
- the per-role **mapping** (§8).

KMI does **not** define knowledge semantics (KGP), capability discovery/invocation (KCB),
codec/render implementations (participant-local; `ffmpeg` is the de-facto backbone), or the
composition model and its NLE adapters (adopted from OTIO — §4).

---

## 2. The asset envelope

Extends KINP §7.2. The `id` is the byte hash (KINP §2/§6); everything else is metadata *about*
those bytes and is **excluded from the id** (a re-encode is a different asset — §3).

```jsonc
{
  "id":         "analyzer:asset:blake3-a1b2…", // KINP: hash of bytes
  "media_type": "video/mp4",
  "bytes":      104857600,
  "source_world": "worldsim:world:alderforest",// REQUIRED for INGESTED world-depicting assets; null if generated (delta H)
  "attaches_to":  ["worldsim:world:alderforest:ent:npc-renaud"], // KINP entities depicted
  "produced_by":  "analyzer:run/1a2b",
  "probe": {                                   // technical metadata (ffprobe-shaped)
    "duration_ms": 42000,
    "streams": [
      { "kind": "video", "codec": "h264", "width": 1920, "height": 1080,
        "fps": "24000/1001", "color_space": "bt709" },
      { "kind": "audio", "codec": "aac", "sample_rate": 48000, "channels": 2 }
    ]
  },
  "prov": { /* W3C-PROV shape, as KINP §7.1 */ }
}
```

- `probe` is the normalized output of a technical probe (an `ffprobe`-style asset probe).
  Its shape is descriptive, not identity-bearing.
- An asset MAY be a *structured document* (a timeline, §4) rather than raw media; then
  `media_type` is `application/vnd.opentimelineio+json` and `probe` is omitted. The deprecated
  `application/vnd.koine.edl+json` (§4.4) is likewise probe-less and remains a valid asset type
  to *read*.
- **`source_world` (delta H).** Required only for **ingested** assets that *depict* a world —
  it scopes any knowledge *extracted from* them (§5) and is what engages the firewall (KINP
  §4.3). **Generated/synthesized** assets (a TTS narration, a composed score, a render) depict
  no world → `source_world: null`. The field is **per-asset**, so a composite never imposes one
  world on its ingested constituents (§5).
- **`excerpt` (optional).** For an asset that is a rendered sub-range of another, records
  `{ "source": <asset id>, "start_ms", "end_ms" }` — the cut range that the binary
  `media:excerpt_of` link (§3) deliberately omits.

---

## 3. The asset-lineage graph (KINP delta E)

Byte-exact hashing means the *same content* re-encoded mints a *different* `asset` id. KMI
records how assets relate with a dedicated relation set — an **asset graph** parallel to, and
distinct from, the KGP knowledge graph. These relations use the KGP envelope + registry
(added under the `media` domain), so they carry confidence and provenance.

| Relation | Meaning | Identity-bearing? |
|---|---|---|
| `media:derived_from` | B is a transcode/re-encode/render of A (lossy or lossless) | No — B is its own asset |
| `media:variant_of` | B is a rendition of A at a different resolution/format/bitrate | No |
| `media:excerpt_of` | B is a time/space sub-range of A (a clip, a crop, a thumbnail) — carries the range | No |
| `media:perceptual_match` | A and B are perceptually the *same content* (probabilistic) | **No — never identity** |

**`perceptual_match` is a similarity signal, never identity** (KINP delta E, explicit).
Byte hash = identity; a perceptual hash (pHash / audio fingerprint / embedding) produces a
`perceptual_match` link with confidence, which feeds the hybrid review queue exactly like a
KINP `same_as` proposal (KINP §11 decision 2) — it is *proposed*, never auto-merged into
identity. **Shared *meaning* across re-encodes is still carried at the entity level via
`attaches_to`** — two re-encodes of the same footage attach to the same entities regardless of
whether `perceptual_match` has been computed.

All lineage relations are **binary** (subject, relation, object), like every KGP assertion.
Parameters such as an excerpt's cut range are not extra relation arguments — they are recorded
on the excerpt *asset's* envelope (§2, optional `excerpt` block), keeping the graph binary.

```jsonc
// A 4-second clip pulled from the ingested master, then downscaled for preview:
{ "relation": "media:excerpt_of", "subject": "analyzer:asset:blake3-c3d4…",
  "object": "analyzer:asset:blake3-a1b2…", "confidence": 1.0 }
//   → the range lives on asset c3d4: "excerpt": { "source": "…a1b2…", "start_ms": 12000, "end_ms": 16000 }
{ "relation": "media:variant_of",  "subject": "analyzer:asset:blake3-e5f6…",
  "object": "analyzer:asset:blake3-c3d4…", "confidence": 1.0 }
```

---

## 4. The timeline / composition model (OpenTimelineIO)

The composition — how assets are arranged into an edit — is an **OpenTimelineIO (OTIO)
`Timeline`** in its JSON serialization. KMI **adopts** OTIO, the Academy Software Foundation's
editorial-interchange format, instead of defining a timeline model of its own
([ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md)). koine specifies only what OTIO
deliberately leaves open — *identity*, *lineage*, and *knowledge* — as an additive layer (§4.2).

A timeline is itself an **asset**: content-addressed by the hash of its serialized bytes, with
`media_type` `application/vnd.opentimelineio+json` and `probe` omitted (§2). So edits are
versioned and deduplicated like any other asset, and a timeline MAY `media:derived_from` a prior
timeline (§3). OTIO has no IANA-registered media type; KMI fixes this identifier so a media-plane
port (§6) can name it. The self-contained bundle serializations (`.otiod` directory / `.otioz`
zip) MAY be carried instead as `application/vnd.opentimelineio+zip`, which is one way to satisfy
the media-map obligation in §4.3.

### 4.1 Conformance to OTIO

- A canonical timeline MUST be a valid OTIO JSON document whose root is a `Timeline`.
- Composition structure is **OTIO's, unmodified**: `Stack` → `Track` (`kind: "Video" | "Audio"`)
  → `Clip` / `Gap` / `Transition`, with nested `Stack`s for nested sequences, plus OTIO `Effect`s
  and `Marker`s. Timing is OTIO `RationalTime` / `TimeRange` (`value` + `rate`) — **the rate is
  carried by each time value itself**; KMI defines no separate frame-rate field.
- Multitrack V/A is the usual conform target (one video track over several audio tracks) and needs
  nothing beyond OTIO's `Track.kind` — it is a `Stack` of `Track`s, not a KMI construct.
- Each item declares its own `OTIO_SCHEMA` version (e.g. `"Timeline.1"`, `"Clip.2"`). A producer
  MUST emit versions from the OTIO **core** schema family. A consumer that meets a schema version
  it does not know SHOULD apply OTIO's own schema upgrade/downgrade path rather than rejecting the
  document; version negotiation is OTIO's mechanism, not KMI's.
- **KMI adds no classes to OTIO's schema.** Everything koine contributes rides OTIO's own
  extension point — namespaced `metadata` dicts, under the `koine` key (§4.2). A stock OTIO reader
  opens a koine timeline unchanged; a koine consumer additionally resolves ids, lineage, and
  analysis.

### 4.2 koine's additive layer over OTIO

OTIO addresses media by **location** (`ExternalReference.target_url`) and has no identity model,
no lineage model, and no assertion semantics. KMI supplies exactly those three — and only the
first of them travels *inside* the timeline.

**(a) Clips reference assets by KINP id.** A `Clip`'s media reference MUST carry the KINP `asset`
id of the media it plays, in `metadata.koine.asset`:

```jsonc
{ "OTIO_SCHEMA": "Clip.2",
  "name": "renaud-approach",
  "source_range": {                                   // in/out, at the media's own rate
    "OTIO_SCHEMA": "TimeRange.1",
    "start_time": { "OTIO_SCHEMA": "RationalTime.1", "value": 288, "rate": 23.976 },
    "duration":   { "OTIO_SCHEMA": "RationalTime.1", "value":  96, "rate": 23.976 } },
  "media_reference": {
    "OTIO_SCHEMA": "ExternalReference.1",
    "target_url":  "file:///conform/renaud-approach.mov",          // location — may be stale
    "metadata": { "koine": { "asset": "analyzer:asset:blake3-c3d4…" } }   // identity — always
  } }
```

- The **id is authoritative; the `target_url` is advisory.** A consumer that can `fetch` by asset
  id (§7) MUST prefer the id over the URL when the two disagree or the URL does not resolve.
- A producer that has no path to offer MUST still carry the id — on a `MissingReference` if
  necessary — so an offline timeline is still resolvable in the fabric.
- Nothing is inlined: the timeline carries references, never bytes (§7).
- Where OTIO supports multiple media references per clip, the alternates SHOULD be the assets
  linked `media:variant_of` (§3) — each carrying its own `metadata.koine.asset`.

**(b) The asset-lineage graph (§3) stays outside the timeline.** How assets relate across
re-encodes, renditions, excerpts, and perceptual matches is a graph *over assets*; a timeline is
one node in it, not its container. Lineage links are KGP assertions (§3) and are unchanged by this
adoption.

**(c) The analysis → knowledge bridge (§5) stays outside the timeline.** OTIO `Marker`s are
free-form annotations with no confidence, no provenance, and no world scoping. Knowledge extracted
from media is emitted as **KGP assertions** into the asset's `source_world` (§5) — which is what
keeps the KINP §4.3 firewall correct. A producer MAY mirror an assertion as a `Marker` for
editorial display; the KGP assertion remains the normative form.

**(d) Optional koine metadata on the timeline itself.** Under `metadata.koine` on the `Timeline`, a
producer MAY carry `kmi_version` (the KMI version it was built against — the `contractVersion`
convention every koine schema shares) and the `media_map` of §4.3. Both are OPTIONAL; neither is
needed for a timeline to be canonical. Lineage (b) and analysis (c) are **not** carried here.

Two adjacent guarantees ride the **asset envelope** and the **capability**, not the timeline, and
are likewise unchanged: `source_world` conditional-on-ingest and per-asset (delta H, §2/§5), and
transform typing by cross-plane KCB ports (§6).

The machine-readable twin of this section is
[`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json), which checks
koine's additive layer over an OTIO document without re-specifying OTIO itself.

### 4.3 NLE interchange — OTIO's adapters

NLE formats are reached through **OTIO's own adapters**. koine specifies *that* the canonical form
is OTIO and *what koine adds*; it does not re-specify the adapters, and the bespoke one-directional
`skill_export_*` family is withdrawn (ADR-0005).

| Target format | OTIO adapter | Direction |
|---|---|---|
| **CMX3600 EDL** | `cmx_3600` | read + write |
| **FCP7 `xmeml`** | `fcp_xml` | read + write |
| **FCPXML** | `fcpx_xml` | read + write |
| **AAF** | `aaf` | read + write |
| **`ffmpeg` / programmatic render** | none — the render capability (§6) consumes the OTIO timeline directly | — |

Import/export remains a **KCB capability typed by media-plane ports** (§6): `timeline → CMX3600`
is a capability like any other, and path search (KCB §3) routes through it. Only the
*implementation* stops being koine's to define. Because the adapters are bidirectional, an edit
that leaves the fabric can come back — round-tripping is no longer one-directional, though it is
lossy at each format's own edges.

**Media map (delta I) — retained, unchanged in purpose.** Adapter output addresses media by **file
path**, exactly as the bespoke projections did, and OTIO's own `ExternalReference` is
`target_url`-based. So any serialization handed to a consumer that resolves media by path MUST
ship an **asset-id ↔ resolved-path media map** — or an equivalent self-contained OTIO bundle
(§4) — so the far side can relink. Without it every clip goes "media offline." The map is one entry
per referenced asset (`{ <asset id>: <resolved path or URL> }`); it MAY ride the canonical timeline
at `metadata.koine.media_map` (§4.2d), or travel beside the adapter output.

### 4.4 Legacy `application/vnd.koine.edl+json` (deprecated)

KMI ≤ 0.2.0 defined a bespoke canonical JSON EDL. As of 0.3.0 it is **deprecated**: readable, not
normative, and no longer the source of truth (ADR-0005).

- Existing EDL assets **remain valid**, fetchable, content-addressed assets. Nothing is invalidated.
- A producer MUST NOT emit `application/vnd.koine.edl+json` for a **new** timeline. It MAY continue
  to serve the legacy form alongside the OTIO form for already-published edits.
- A consumer SHOULD accept both while the transition window is open, and MUST treat the **OTIO
  form as authoritative** when both are offered for the same edit.
- The type is removed from this spec no earlier than the next **minor** version, and removal ends
  the obligation to emit or accept it — not the ability to read archived assets.

Every legacy construct maps totally onto OTIO, so no existing edit is orphaned:

| Legacy EDL (KMI ≤ 0.2.0 §4) | OTIO |
|---|---|
| the EDL document | `Timeline` (its `tracks` a `Stack`) |
| `fps` | the `rate` of each `RationalTime` / `TimeRange` |
| `tracks[]` with `kind: video\|audio` | `Track` with `kind: Video\|Audio` inside the `Stack` |
| clip `{ in_ms, out_ms }` | `Clip.source_range` — a `TimeRange` (start + duration) at that rate |
| clip `timeline_ms` | position in the track's ordered children, with `Gap` filling any lead-in |
| clip `asset` (KINP id) | `media_reference.metadata.koine.asset` (§4.2a) |
| clip `effects[]`, `gain_db` | `Clip.effects` / namespaced clip metadata |
| `transitions[]` | `Transition` items placed in the track at the cut |

Conversion **mints a new asset** — converted bytes hash differently, so the timeline gets a new id
— linked `media:derived_from` the legacy EDL asset (§3). The migration is therefore recorded in the
lineage graph itself, and the legacy edit stays fetchable and auditable at its original id.

---

## 5. Analysis → knowledge bridge

This is where the media plane **feeds** the knowledge plane. Media analysis
(vision / ASR / av-analysis) produces **KGP assertions**, scoped to the asset's
`source_world`, with subjects among the entities the asset `attaches_to`, using the `cine:`
(and other domain) relations from the registry:

```prolog
% From vision-analysis of clip c3d4, in the asset's source_world:
cine:shows(analyzer:asset:blake3-c3d4…, worldsim:world:alderforest:ent:npc-renaud)
    @ world(alderforest) :- confidence(0.88), src('analyzer:run/1a2b').
```

Consequences that fall out of the earlier planes for free:
- Because the assertion lands in `source_world` (not consensus reality), the **firewall**
  (KINP §4.3) holds: analyzing fictional footage never contaminates real-world knowledge.
- Because assertions are content-addressed and normalized (KGP §3), analysis of two
  re-encodes of the same footage (linked by `media:perceptual_match`) converges on the same
  claims once their entity refs reconcile.
- Attribution is **per-asset (delta H)**: analysis of a *composite* (a render, a preview)
  attributes each claim to the **constituent clip's** `source_world` — traced via
  `media:excerpt_of` / `media:derived_from` — not to the composite's own. A generated render has
  `source_world: null`, so scoping the whole render to one world would wrongly drop its clips'
  claims out of every fictional world; per-constituent attribution keeps the firewall correct
  across editing.

---

## 6. Transform typing (any-to-any as a computed path)

"Any-to-any" conversion (PDF→movie, movie→PDF) is realized as **typed transforms**, not a gateway.
A transform is a **KCB capability** whose inputs/outputs are **ports** (KCB §2.1), which span
all planes. KMI owns only the **media profile** — the `media`-plane port type: a `media_type`
plus optional constraints (resolution ceiling, codec, duration) and `world_pattern`. Knowledge-
and entity-plane port types are owned by KGP / KINP.

```jsonc
{ "capability": "narrate",
  "inputs":  [ { "plane": "knowledge", "shape": "script" } ],          // NOT media-only (delta F)
  "outputs": [ { "plane": "media", "media_types": ["audio/wav"], "constraints": { "tts": true } } ] }
```

- Because ports span planes (KCB §2.1), a transform may consume **knowledge** and produce
  **media** — e.g. `mood(knowledge) → score(audio)`, or `analysis: media → knowledge` (§5).
  Media-profile-only typing (this spec's 0.1.0 draft) could not express those; **delta F** fixed
  it in KCB, and KMI now defers cross-plane typing there.
- The **discovery registry computes a path** from a start port to a goal port across providers
  *and planes* (KCB §3) — e.g. `pdf → text → treatment → shot-list → images → video`. That path
  *is* the any-to-any pipeline; no component needs global knowledge of the others.
- Transform runtime concerns (a provider's paid→accelerated→local→placeholder fallback ladder, zero-spend
  completion) are **producer behavior**; a capability's declared `cost` (KCB §2.1) lets path
  search prefer cheap/zero-spend routes and gate spend (delta K). KMI fixes only the media
  profile vocabulary so paths are computable and total.

---

## 7. Byte transport

Assets are large; envelopes and timelines are small. KMI is a **reference-by-id** protocol:

- Envelopes, timelines, and lineage/analysis links travel inline (or in KGP packs for the
  knowledge-side links).
- **Bytes live in a content-addressed store (CAS)** keyed by the KINP `asset` id and are
  fetched out-of-band. Because the id *is* the hash, integrity is self-verifying and any node
  can cache. (A producer that already stores run artifacts on local disk keeps doing so; the
  CAS generalizes that across participants.)
- Byte retrieval is the KCB **`fetch`** verb — a CAS GET by `asset` id (KCB §4) — authorized by
  a `fetch:asset` grant (KCB §5, **delta G**). Reference and byte-fetch both ride the capability
  bus; KMI defines the payloads, not the pipe. Because a reference can arrive before its bytes
  propagate, consumers `fetch` lazily and tolerate dangling refs (KCB delta L).

---

## 8. Mapping (by role)

| Role | KMI participation | Emits / accepts |
|---|---|---|
| **Media authority** | **Producer + authority** for assets & timelines | Owns the canonical OTIO timelines (§4) + the koine additive layer on them (§4.2) + `asset_probe`; runs NLE interchange through OTIO's adapters with a media map (§4.3); emits analysis → KGP (§5); hosts the run-artifact CAS. |
| **Audio producer** | Producer | Emits `audio/*` assets + instrument renders; consumes timelines to place audio; later a *transform provider* ("render this instrument") via KCB. |
| **World producer** | Producer | Emits video/render assets with `source_world` = the world/playthrough; consumes assets for in-engine use. |
| **Knowledge authority** | Consumer | Consumes analysis-derived KGP (not bytes); may catalog media entities. |
| **Control-plane host** | Consumer + host | Provisions the CAS + transform capabilities as orgs; agents invoke transforms. |

---

## 9. Open questions

1. **OTIO schema-version pinning** — which OTIO core schema versions a conformant timeline may
   declare, and how strictly §4.1's "apply OTIO's upgrade/downgrade path" binds a consumer that
   meets an unknown version. (The *expressiveness ceiling* this question used to ask about the
   bespoke EDL — nested sequences, keyframed effects, color grades — is closed by adoption:
   they are in the adopted model. ADR-0005.)
2. **Profile vocabulary granularity** — how fine constraints get (e.g. "H.264 High@L4.1")
   before path-finding becomes brittle; likely a coarse core + optional constraints.
3. **CAS operational model** — single shared store vs. per-project stores that replicate on
   reference (mirrors KINP §11 authority fork and KCB §8 registry federation).
4. **Perceptual-hash choice** — which pHash/audio-fingerprint/embedding backs
   `media:perceptual_match`, and recording it (like KGP `embedding_model`) so scores are
   comparable.
5. **Additive-metadata survival** — a naïve round-trip through a third-party OTIO tool can drop
   `metadata.koine` (§4.2a). The media map and the lineage graph make recovery possible; whether
   KMI should require a producer to *re-attach* ids on re-import, and how it detects that they
   were lost, is open.

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
All blocking deltas were folded in 0.2.0 and are **carried forward unchanged** by 0.3.0: **F**
(transforms typed by cross-plane KCB ports; KMI owns only the media profile, §6), **H**
(`source_world` conditional on ingest, `null` for generated, per-asset attribution across
composites, §2/§5), and **I** (asset-id ↔ path media map, now on OTIO adapter output, §4.3);
plus the KCB-side **G** (`fetch` verb + grant, §7) and **L** (dangling-reference tolerance, §7).

**Re-validation (0.3.0) — recorded, clean.** Because 0.3.0 replaces the canonical composition
model, the scenario's timeline-bearing steps were re-run against the OTIO model: leg typing
(Step 1), conform (Step 5), and render/interchange (Step 6). The additive layer holds — binary
`media:excerpt_of` with range-on-asset, per-asset `source_world` (H), clips referencing assets by
KINP id, and the asset-id ↔ path media map (I), which OTIO's `target_url`-based references
*reconfirm* rather than retire. See the scenario's **Re-validation — KMI 0.3.0** section. No delta
is reopened; one non-blocking exposure is noted (namespaced metadata can be dropped by a
third-party round-trip — §9.5).

KMI nonetheless stays at **candidate**: the same scenario also gates **KCB 0.3.0**, whose §2
manifest→AgentCard-extension change its discovery steps exercise and which has not been re-run.
Promotion of both follows that pass.

## Changelog

- **0.3.0** (2026-08-02) — **Candidate.** Adopted **OpenTimelineIO** as the canonical timeline /
  composition model per
  [ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md): §4 is rewritten around the OTIO
  `Timeline` (§4.1 conformance, §4.2 koine's additive layer via namespaced `metadata`, §4.3 NLE
  interchange through OTIO's bidirectional adapters), and the bespoke
  `application/vnd.koine.edl+json` EDL is **deprecated** with a total construct mapping and a
  transition window (§4.4). The `skill_export_*` projection family is withdrawn; the asset-id ↔
  path media map (delta I) is retained. §2's structured-document note, §1's scope list, §7's
  transport wording, §8's role mapping, and §9.1 are updated for consistency. **Unchanged in
  meaning:** the asset envelope (§2) including `source_world` (H), the asset-lineage graph (§3),
  the analysis→KGP bridge (§5), transform typing (§6), and byte transport (§7). Status drops to
  candidate pending re-validation against the pressure test.
  Landed with the section's machine-readable twin,
  [`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json) (§4.2), which
  adds the OPTIONAL `metadata.koine` timeline carriers `kmi_version` and `media_map` (§4.2d/§4.3);
  and with the re-validation pass folded into
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) (Steps 1/5/6).

- **Editorial** (2026-07-31) — Agnostic reframe, part 2: asset envelopes, lineage links, the EDL
  example, and the analysis→KGP bridge use the KINP §3.4 illustrative placeholder namespaces
  (`analyzer` / `mediastore` / `worldsim`); probe, EDL-provenance, transform-ladder, and CAS notes
  name **roles** instead of products. No normative change — the envelope, lineage relations, EDL
  schema, port typing, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.2.0** (2026-07-17) — **Ratified.** Folded pressure-test deltas F (cross-plane transform
  typing via KCB ports), H (`source_world` conditional/per-asset + composite attribution),
  I (NLE media map); wired byte retrieval to the KCB `fetch` verb/grant (G) with lazy
  dangling-ref handling (L).
- **0.1.0** (2026-07-17) — Initial candidate draft. Closes the fourth (media) plane; absorbs
  KINP delta E (asset-lineage graph, perceptual matching scoped as similarity-not-identity).
