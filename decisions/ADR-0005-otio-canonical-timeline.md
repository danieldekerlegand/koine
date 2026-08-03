# ADR-0005 — Adopt OpenTimelineIO as KMI's canonical timeline model

**Status:** Accepted (2026-08-02)
**Deciders:** ecosystem owner
**Refines:** [`../specs/media-interchange.md`](../specs/media-interchange.md) (KMI) §2, §4, §8, §9
**Applies to:** media authorities (producer/authority for assets + timelines), media producers of
any modality, media consumers, and transform providers.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

KMI 0.2.0 §4 defines a **bespoke canonical JSON EDL** (`application/vnd.koine.edl+json`) as the
composition model, and declares it the **source of truth**: tracks of clips referencing assets by
KINP id, with NLE formats relegated to **one-directional projections** (`skill_export_fcpxml`,
`skill_export_premiere`, `skill_export_davinci`, …). Round-trip fidelity is guaranteed only
through the bespoke form.

Three pressures on that design:

1. **It is reinvention.** [OpenTimelineIO](https://opentimeline.io) (OTIO) is the Academy Software
   Foundation's interchange format for editorial timelines — an open, versioned, JSON-serialized
   composition model (`Timeline` / `Stack` / `Track` / `Clip` / `Gap` / `Transition`, rational-time
   `TimeRange`s, effects, markers, namespaced metadata). It is the standard the post-production
   industry already converges on.
2. **OTIO already ships the adapters KMI lists as targets.** The CMX3600, FCP7 `xmeml`, and FCPXML
   adapters that KMI §4 enumerates as bespoke one-directional `skill_export_*` projections exist
   in OTIO as maintained, bidirectional adapters. Keeping a parallel canonical timeline means
   koine owns — and must keep correct — five exporters that an external standard already
   maintains, against formats whose quirks are the expensive part.
3. **The expressiveness ceiling is already an open question.** KMI §9.1 asks how far the bespoke
   EDL should go (nested sequences, keyframed effects, color grades) before deferring to a native
   format. OTIO answers that question by construction: nesting, effects, transitions, markers, and
   per-adapter metadata are in the model, and the schema is versioned with upgrade functions.

The counter-pressure: OTIO deliberately has **no identity model, no lineage model, and no
knowledge semantics**. Its media references are URLs/paths — exactly the "media offline" fragility
KMI §4 (delta I) exists to fix. So OTIO cannot simply *replace* KMI §4; the question is which layer
each concern belongs to.

## Decision

**1. OTIO is KMI's canonical timeline / composition model.**
The composition — how assets are arranged into an edit — is expressed as an **OTIO `Timeline`** in
its JSON serialization. A timeline remains an **asset** in the KINP sense (content-addressed by the
hash of its serialized bytes, KINP §7.2), so edits are still versioned and deduplicated like any
other asset and a timeline can still `media:derived_from` a prior timeline. The timeline asset's
`media_type` is the OTIO JSON type, and `probe` remains omitted for structured-document assets
(KMI §2).

**2. The bespoke `application/vnd.koine.edl+json` EDL is demoted to a legacy, deprecated form.**
It is no longer the source of truth and no longer normative for new work. It remains *readable* —
existing EDL assets stay valid assets — but it is a compatibility surface, not the model.

**3. NLE interchange goes through OTIO's adapters, not through bespoke projections.**
The `skill_export_fcpxml` / `_premiere` / `_davinci` family is replaced by "serialize the canonical
OTIO timeline through the corresponding OTIO adapter" (CMX3600, `xmeml`, FCPXML, …). koine
specifies *that* the canonical form is OTIO and *what koine adds*; it does not re-specify the
adapters. Export remains a KCB capability typed by media-plane ports (KMI §6) — only the
implementation stops being koine's to define.

**4. The asset-id ↔ resolved-path media map (delta I) is retained, unchanged in purpose.**
OTIO's `ExternalReference` addresses media by `target_url`, so the exact failure delta I was
written for — a projection that references media by path, going "media offline" on the far side —
applies identically to OTIO output. Every serialization handed to a consumer that resolves media by
path MUST ship the media map that relinks KINP asset ids to resolved paths.

**5. What stays koine's ADDITIVE layer over OTIO — and is therefore NOT replaced:**

| Additive layer | Why OTIO does not cover it |
|---|---|
| **Asset ids as content-addressed KINP entities** (KINP §7.2) — a clip's media reference resolves to a KINP `asset` id, not to a bare path | OTIO has no identity model; `ExternalReference.target_url` is a location, not an identity. Content-addressing is what makes references self-verifying, cacheable, and dedupable (KMI §7) |
| **The asset-lineage graph** (`media:derived_from` / `media:variant_of` / `media:excerpt_of` / `media:perceptual_match`, KMI §3) | OTIO models *this cut*, not how the media files relate to each other across re-encodes, renditions, excerpts, and perceptual matches. Lineage is a graph over assets; a timeline is one node in it |
| **The analysis → KGP knowledge bridge** (KMI §5) | OTIO markers/metadata are free-form annotations with no assertion semantics, no confidence, no provenance, and no world scoping. The bridge emits KGP assertions into the asset's `source_world`, which is what keeps the KINP §4.3 firewall correct |

Two adjacent guarantees ride on the asset envelope (KMI §2), not on the timeline, and are likewise
unaffected: **`source_world` conditional-on-ingest and per-asset** (delta H) and **transform typing
by cross-plane KCB ports** (KMI §6).

**6. Placement of the additive layer inside OTIO.**
koine's additions attach through OTIO's own extension point — its **namespaced `metadata` dicts** —
rather than by forking the schema. The KINP asset id for a clip's media travels with that clip's
media reference; lineage and analysis do **not** travel inside the timeline at all — they are KGP
assertions in the knowledge plane, exactly as today. A conformant OTIO reader that knows nothing
about koine still opens the timeline; a koine consumer additionally resolves ids, lineage, and
analysis. The normative field-level shape is KMI §4's to fix (see *Relationship to the specs*).

**7. Migration and compatibility.**

- **No existing edit is orphaned.** Every construct in the bespoke EDL has a total mapping onto
  OTIO:

  | Bespoke EDL (KMI 0.2.0 §4) | OTIO |
  |---|---|
  | the EDL document | `Timeline` (its `tracks` a `Stack`) |
  | `fps` | the rate of the timeline's `RationalTime` / `TimeRange` values |
  | `tracks[]` with `kind: video\|audio` | `Track` with `kind: Video\|Audio` inside the `Stack` |
  | clip `{ in_ms, out_ms }` | `Clip.source_range` — a `TimeRange` (start + duration) at the timeline rate |
  | clip `timeline_ms` | position in the track's ordered children, with `Gap` filling any lead-in |
  | clip `asset` (KINP id) | the clip's `ExternalReference`, carrying the KINP asset id (additive layer, decisions 1 + 6) |
  | clip `effects[]`, `gain_db` | `Clip.effects` / namespaced clip metadata |
  | `transitions[]` | `Transition` items placed in the track at the cut |

- **Conversion mints a new asset; it never rewrites the old one.** Because assets are
  content-addressed, a converted timeline has different bytes and therefore a different id. The
  OTIO timeline is emitted as a **new asset** linked `media:derived_from` the legacy EDL asset
  (KMI §3) — so the migration is itself recorded in the additive layer, and the legacy edit remains
  fetchable and auditable at its original id.
- **Both forms MAY be served during the transition.** A producer MAY continue to serve
  `application/vnd.koine.edl+json` alongside the OTIO form for already-published edits. It MUST NOT
  emit the legacy type for **new** timelines once it claims conformance to the KMI version that
  folds this ADR. A consumer SHOULD accept both while the transition window is open and MUST treat
  the OTIO form as authoritative when both are offered for the same edit.
- **Retirement.** The legacy type is deprecated on the KMI version that folds this ADR and is
  removed from the spec no earlier than the following **minor** version, once the pressure test
  (`../scenarios/e2e-media-transform.md`) re-validates cleanly against the OTIO model. Retirement
  removes the *obligation to emit or accept*, not the ability to read archived assets.
- **Per koine's `draft → candidate → ratified` convention this is a normative change**, so KMI
  drops back to **candidate** pending re-validation against the pressure test.

## Consequences

**Positive**
- koine stops maintaining a timeline model and five format exporters that an industry standard
  already maintains, and inherits its adapter ecosystem, versioned schema, and upgrade path.
- KMI §9.1 (the EDL expressiveness ceiling) is largely closed: nesting, effects, transitions, and
  markers are in the adopted model rather than pending in koine's.
- Interoperability widens beyond the fabric — any OTIO-speaking tool can read a koine timeline
  without implementing a koine-specific format.
- The additive layer gets *sharper* by subtraction: what remains in koine (identity, lineage,
  knowledge bridge) is precisely what no timeline format provides, which is the fabric's actual
  contribution.
- Round-tripping to and from NLE formats becomes bidirectional rather than one-directional.

**Negative / costs**
- koine takes a dependency on an **external standard's** versioning and governance. Mitigation: the
  dependency is on a *serialization format*, not a library — koine remains contracts-only
  ("dumb pipes, smart endpoints"), and the KMI spec pins which OTIO schema version(s) a conformant
  timeline may declare.
- Consumers must read OTIO rather than a small purpose-built JSON. The model is larger and the
  floor for a minimal consumer rises.
- Additive data lives in namespaced metadata, which a naïve non-koine round-trip through a
  third-party tool can drop. The media map and the lineage graph make that recoverable, but
  recovery is not free.
- The bespoke EDL exists in the field; the transition window (decision 7) is real work.

**Neutral**
- Existing bespoke-EDL assets remain valid, fetchable, content-addressed assets forever — nothing
  is deleted, only deprecated.
- Nothing in KMI §3, §5, §6, or §7 changes in meaning; this decision is scoped to §4 and the §2
  timeline-asset note.

## Alternatives considered

- **Keep the bespoke canonical JSON EDL.** Rejected: it is reinvention of a maintained standard,
  leaves koine owning five format exporters, and leaves §9.1's expressiveness ceiling open with no
  answer other than "grow the bespoke model until it is OTIO."
- **Adopt an NLE-native format (FCPXML / `xmeml` / CMX3600) as canonical.** Rejected: each is
  tool-shaped rather than neutral, lossy in different directions, and adopting one privileges one
  vendor's tool over the others — exactly the product-binding koine's role vocabulary exists to
  avoid. These stay as export/import targets, which is what OTIO's adapters make them.
- **Adopt an authoring-interchange format such as AAF as canonical.** Rejected: heavier, binary,
  and narrower in tool coverage than OTIO for the conform-and-export path KMI actually models;
  OTIO reaches it through an adapter if a participant needs it.
- **Dual-canonical — keep both forms authoritative.** Rejected: two sources of truth is no source
  of truth. It forces every consumer to implement both, and the mapping's lossy edges become
  silent divergence rather than a one-time migration.
- **Extend OTIO's schema with koine-specific classes (a fork).** Rejected in favor of namespaced
  metadata (decision 6): a fork breaks compatibility with every stock OTIO reader, which is the
  entire benefit being bought.

## Relationship to the specs

- **KMI** §4 is rewritten to make OTIO canonical, demote `application/vnd.koine.edl+json`, and
  reframe the projection table onto OTIO's adapters while retaining the media map (delta I); the
  §2 timeline-asset note, the §1 scope list, the §8 role mapping, and §9's open questions are
  updated for consistency. KMI's version is bumped and its status drops to **candidate**.
- **The machine-readable twin** in `../schemas/` gains a media-timeline schema consistent with the
  rewritten §4 — role-scoped, with illustrative CURIEs in the KINP §3.4 placeholder namespaces.
  koine's schema constrains the **koine-additive** shape; it does not restate OTIO's own schema,
  which OTIO versions itself.
- **KINP** is untouched: the `asset` id, `source_world`, and `attaches_to` (KINP §7.2) are exactly
  what decision 5 keeps.
- **KGP** and **KCB** are untouched: lineage and analysis remain KGP assertions, and export/render
  remain KCB capabilities typed by cross-plane ports.
- **`../scenarios/e2e-media-transform.md`** is re-expressed against the OTIO canonical timeline and
  re-run; re-ratification of KMI depends on it.
- How any particular deployment schedules its own migration off the legacy type is a deployment
  fact, recorded in that deployment's own integration repo — not here.
