# Koine Media-Interchange Protocol (KMI)

**Spec version:** 0.1.0 (candidate)
**Status:** Draft for review — not yet ratified
**Last updated:** 2026-07-17
**Applies to:** Argos (producer/authority for media + EDL), Formant (audio producer),
Insimul (game-video producer), Pinakes & Cuneiform (consumers)
**Depends on:** [`identity.md`](identity.md) (KINP) for the `asset` id, `source_world`, and
`attaches_to`; [`grounding-pack.md`](grounding-pack.md) (KGP) for the analysis→knowledge
bridge; [`capability-bus.md`](capability-bus.md) (KCB) for transforms-as-capabilities.

> The **media data plane** — the fourth and final plane. Where KGP moves *facts*, KMI moves
> *bytes and the edits over them*: assets, their technical metadata, the asset-lineage graph
> (re-encodes, variants, clips), the timeline/EDL composition model, and the typed contract
> that makes "any-to-any" transformation a **path computed over capabilities** rather than a
> central transform-gateway. Generalizes Argos's existing asset library, `ffprobe`-based
> `asset_probe`, canonical JSON EDL, and NLE exporters (FCPXML / Premiere xmeml / DaVinci
> CMX3600 / Remotion) into one ecosystem contract.

Division of labor with KINP: KINP fixes the `asset` *identifier*, `source_world`, and
`attaches_to` (KINP §7.2). KMI defines everything else about an asset — technical metadata,
the asset-lineage relations (KINP delta E lives here), the EDL model, and transform typing.

---

## 1. Scope

KMI defines:
- the **asset envelope** — technical metadata over the KINP `asset` id (§2),
- the **asset-lineage graph** — `derived_from` / `variant_of` / `excerpt_of` /
  `perceptual_match` (§3),
- the **EDL / timeline** composition model + NLE projections (§4),
- the **analysis → knowledge bridge** into KGP (§5),
- **transform typing** — media profiles so KCB can compute any-to-any paths (§6),
- **byte transport** via a content-addressed store (§7),
- the per-project **mapping** (§8).

KMI does **not** define knowledge semantics (KGP), capability discovery/invocation (KCB), or
codec/render implementations (project-local; `ffmpeg` is the de-facto backbone).

---

## 2. The asset envelope

Extends KINP §7.2. The `id` is the byte hash (KINP §2/§6); everything else is metadata *about*
those bytes and is **excluded from the id** (a re-encode is a different asset — §3).

```jsonc
{
  "id":         "argos:asset:blake3-a1b2…",   // KINP: hash of bytes
  "media_type": "video/mp4",
  "bytes":      104857600,
  "source_world": "insimul:world:alderforest", // KINP §7.2 — REQUIRED at ingest
  "attaches_to":  ["insimul:world:alderforest:ent:npc-renaud"], // KINP entities depicted
  "produced_by":  "argos:run/1a2b",
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

- `probe` is the normalized output of a technical probe (Argos's `asset_probe`/`ffprobe`).
  Its shape is descriptive, not identity-bearing.
- An asset MAY be a *structured document* (an EDL, §4) rather than raw media; then
  `media_type` is `application/vnd.koine.edl+json` and `probe` is omitted.

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
{ "relation": "media:excerpt_of", "subject": "argos:asset:blake3-c3d4…",
  "object": "argos:asset:blake3-a1b2…", "confidence": 1.0 }
//   → the range lives on asset c3d4: "excerpt": { "source": "…a1b2…", "start_ms": 12000, "end_ms": 16000 }
{ "relation": "media:variant_of",  "subject": "argos:asset:blake3-e5f6…",
  "object": "argos:asset:blake3-c3d4…", "confidence": 1.0 }
```

---

## 4. The EDL / timeline model

The composition — how assets are arranged into an edit — is a **canonical JSON EDL**
(Argos's format, promoted here). It is itself an asset
(`application/vnd.koine.edl+json`, content-addressed), so edits are versioned and
deduplicated like any other asset, and an EDL can `media:derived_from` a prior EDL.

```jsonc
{
  "kmi_edl_version": "0.1.0",
  "id":     "argos:asset:blake3-ed10…",
  "fps":    "24000/1001",
  "tracks": [
    { "id": "V1", "kind": "video", "clips": [
        { "asset": "argos:asset:blake3-c3d4…", "in_ms": 0, "out_ms": 4000,
          "timeline_ms": 0, "effects": [] } ] },
    { "id": "A1", "kind": "audio", "clips": [
        { "asset": "formant:asset:blake3-aa01…", "in_ms": 0, "out_ms": 4000,
          "timeline_ms": 0, "gain_db": -3.0 } ] },
    { "id": "A2", "kind": "audio", "clips": [ /* narration */ ] },
    { "id": "A3", "kind": "audio", "clips": [ /* SFX */ ] }
  ],
  "transitions": [ { "kind": "crossfade", "track": "V1", "at_ms": 4000, "dur_ms": 500 } ]
}
```

- Multitrack V/A (Argos's conform target: V1/A1–A3). Clips reference assets **by KINP id** with
  in/out points; nothing is inlined.
- **Canonical JSON EDL is the source of truth**; NLE formats are one-directional projections
  (mirrors KGP §4's TSV→projection rule):

| Projection | Target | Notes |
|---|---|---|
| **FCPXML** | Final Cut Pro | Argos `skill_export_fcpxml` |
| **xmeml** | Adobe Premiere | `skill_export_premiere` |
| **CMX3600 EDL** | DaVinci Resolve | `skill_export_davinci` |
| **Remotion `.tsx`** | programmatic React video | `skill_export_remotion` |
| **ffmpeg script** | headless render | `skill_export_ffmpeg` |

A consumer never treats a projection as authoritative — round-trip fidelity is only guaranteed
through the canonical JSON EDL.

---

## 5. Analysis → knowledge bridge

This is where the media plane **feeds** the knowledge plane. Media analysis
(vision / ASR / av-analysis) produces **KGP assertions**, scoped to the asset's
`source_world`, with subjects among the entities the asset `attaches_to`, using the `cine:`
(and other domain) relations from the registry:

```prolog
% From vision-analysis of clip c3d4, in the asset's source_world:
cine:shows(argos:asset:blake3-c3d4…, insimul:world:alderforest:ent:npc-renaud)
    @ world(alderforest) :- confidence(0.88), src('argos:run/1a2b').
```

Consequences that fall out of the earlier planes for free:
- Because the assertion lands in `source_world` (not consensus reality), the **firewall**
  (KINP §4.3) holds: analyzing fictional footage never contaminates real-world knowledge.
- Because assertions are content-addressed and normalized (KGP §3), analysis of two
  re-encodes of the same footage (linked by `media:perceptual_match`) converges on the same
  claims once their entity refs reconcile.

This closes the loop the ecosystem is built around: **media in → knowledge out**, and (via KGP
producers) **knowledge in → media out**.

---

## 6. Transform typing (any-to-any as a computed path)

Argos's "any-to-any" (PDF→movie, movie→PDF) is realized here as **typed transforms**, not a
gateway. A transform is a **KCB capability** whose input/output are **media profiles**:

```jsonc
{ "capability": "narrate", "input":  { "profile": "text/plain" },
                           "output": { "profile": "audio/wav", "constraints": { "tts": true } } }
```

- A **profile** is a `media_type` plus optional constraints (resolution ceiling, codec,
  duration). KMI owns the profile vocabulary; KCB owns discovery/invocation.
- Because every transform declares `produces`/`consumes` profiles (KCB §2), the **discovery
  registry computes a *path*** from an input profile to a desired output profile across
  multiple providers (KCB §3) — e.g. `pdf → text → treatment → shot-list → images → video`.
  That path *is* the any-to-any pipeline; no component needs global knowledge of the others.
- Transform runtime concerns (Argos's paid→mlx→local→placeholder "sacred ladder",
  zero-spend completion, cost gates) are **producer behavior**, not part of the contract — KMI
  fixes only the profile typing so paths are computable and total.

---

## 7. Byte transport

Assets are large; envelopes/EDLs are small. KMI is a **reference-by-id** protocol:

- Envelopes, EDLs, and lineage/analysis links travel inline (or in KGP packs for the
  knowledge-side links).
- **Bytes live in a content-addressed store (CAS)** keyed by the KINP `asset` id and are
  fetched out-of-band. Because the id *is* the hash, integrity is self-verifying and any node
  can cache. (Argos already stores run artifacts under `data/assets/`; the CAS generalizes
  that across projects.)
- Transport of both references and byte-fetch authorization rides the capability bus (KCB);
  KMI defines the payloads, not the pipe.

---

## 8. Per-project mapping

| Project | Role | Emits / accepts |
|---|---|---|
| **Argos** | **Producer + authority** for media & EDL | Owns the canonical JSON EDL + NLE projections + `asset_probe`; emits analysis → KGP (§5); hosts run-artifact CAS. |
| **Formant** | Audio producer | Emits `audio/*` assets + plugin renders; consumes EDLs to place audio; later a *transform provider* ("render this plugin") via KCB. |
| **Insimul** | Game-video producer | Emits gameplay video assets with `source_world` = the world/playthrough; consumes assets for in-engine use. |
| **Pinakes** | Consumer | Consumes analysis-derived KGP (not bytes); may catalog media entities. |
| **Cuneiform** | Consumer + host | Provisions the CAS + transform capabilities as orgs; agents invoke transforms. |

---

## 9. Open questions

1. **EDL expressiveness ceiling** — how far the canonical EDL goes (nested sequences,
   keyframed effects, color grades) before it should defer to a projection's native format.
2. **Profile vocabulary granularity** — how fine constraints get (e.g. "H.264 High@L4.1")
   before path-finding becomes brittle; likely a coarse core + optional constraints.
3. **CAS operational model** — single shared store vs. per-project stores that replicate on
   reference (mirrors KINP §11 authority fork and KCB §7 registry federation).
4. **Perceptual-hash choice** — which pHash/audio-fingerprint/embedding backs
   `media:perceptual_match`, and recording it (like KGP `embedding_model`) so scores are
   comparable.

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
**Blocking deltas before ratification:** **F** (transform typing must span planes — media
profile ∪ knowledge type ∪ entity ref, §6) and **H** (`source_world` REQUIRED only for
*ingested* assets that depict a world; generated assets → `null`; attribution is **per-asset**,
so composite analysis attributes claims to constituent clips, §2/§5). Should-fix: **I** (NLE
projections carry an asset-id ↔ path media map, §4). Stays **candidate** until F & H land.

## Changelog

- **0.1.0** (2026-07-17) — Initial candidate draft. Closes the fourth (media) plane; absorbs
  KINP delta E (asset-lineage graph, perceptual matching scoped as similarity-not-identity).
