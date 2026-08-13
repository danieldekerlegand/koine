# ADR-0005 — Adopt OpenTimelineIO as KMI's canonical timeline model

**Status:** Accepted (2026-08-02)
**Amended:** 2026-08-13 — the *risks* now record OTIO's real maturity (v0.18.1, pre-1.0) and the
concrete `target_url` interop hazard it produces; the **adoption decision, its date, and its status
are unchanged and reaffirmed**. See [*Amendment log*](#amendment-log).
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
- **The adopted standard is not 1.0, and its interchange surface has a known break** (recorded
  2026-08-13; see the [amendment log](#amendment-log)). OTIO is at **v0.18.1**, tagged a
  *prerelease*: its **"1.0 Release" milestone was due 2026-04-10** and is roughly **four months
  overdue**, with about **a third of its issues still open**. The concrete consequence for
  interchange is that **`target_url` is under-specified** — under-specified enough that
  **Adobe Premiere Beta 26.1 and DaVinci Resolve 20.2 do not round-trip against each other**
  (OTIO issue **[#1985](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/issues/1985)**).
  So the "media offline" fragility decision 4 and decision 5 were written against is not a
  hypothetical koine invented to justify its own layer: it is an **acknowledged, open, cited defect
  in the adopted standard**, reproduced between two of the most widely deployed NLEs. Mitigation is
  already in the decision, not new work — the KINP asset id on the clip's media reference
  (decision 5) is the identity `target_url` does not carry, and the asset-id ↔ resolved-path media
  map (decision 4) is what relinks it on the far side. The residual cost is the pin itself: koine
  is pinned to a pre-1.0 upstream whose schema may still move, tracked as a row in
  [`../docs/upstream-standards.md`](../docs/upstream-standards.md) and as KMI §9.1
  (which OTIO core schema versions a conformant timeline may declare).
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

## Amendment log

### 2026-08-13 — OTIO's pre-1.0 maturity and the `target_url` break are recorded; the adoption stands

**What changed.** *Consequences → Negative / costs* gains one bullet stating what this record had
left implicit: the standard it adopts is **not 1.0**. As observed **2026-08-13**, OTIO is at
**v0.18.1**, tagged a *prerelease*; its **"1.0 Release" milestone was due 2026-04-10** and is about
**four months overdue**, with roughly **a third of its issues open**. And the part of OTIO koine
leans on hardest for interchange — how a clip addresses its media — is the part that is
under-specified: **`target_url` is loose enough that Adobe Premiere Beta 26.1 and DaVinci Resolve
20.2 break against each other**, filed upstream as **OTIO issue #1985**. The observation is dated
so it ages visibly, per [`../docs/upstream-standards.md`](../docs/upstream-standards.md) rule 2 (a
pin is a claim about what koine was validated against, not a claim the upstream is frozen).

**What did *not* change.** The decision: **OTIO is KMI's canonical timeline / composition model**,
accepted **2026-08-02**, status **Accepted**, and **reaffirmed here**. Decisions 1–7 are unedited
in substance; the bespoke `application/vnd.koine.edl+json` EDL stays demoted and deprecated, NLE
interchange still goes through OTIO's adapters, and the additive layer of decision 5 is unchanged.
Nothing here supersedes, reverses, or re-opens the adoption. This is an amendment to the
**risks**, not a new decision — and no alternative rejected above becomes more attractive because
of it: every one of them was rejected for reasons (reinvention, tool-shaping, dual-truth, forking)
that a pre-1.0 upstream does not touch.

**Why the adoption survives its own risk — and is in fact strengthened.** The natural reading of
"the standard is pre-1.0 and two flagship NLEs break against each other" is *do not adopt it*. That
reading gets the layering backwards. Read it against what koine actually took from OTIO and what it
kept for itself:

- What koine adopted from OTIO is the **composition model** — tracks, clips, rational time,
  transitions, effects, nesting. That surface is mature, is what the adapters exercise, and is not
  what #1985 is about.
- What koine explicitly **did not** delegate to OTIO is **identity** (decision 5, and the
  counter-pressure paragraph in *Context*: "OTIO deliberately has no identity model … its media
  references are URLs/paths — exactly the 'media offline' fragility"). #1985 is precisely a defect
  in address-by-path. It is the failure mode the additive layer was designed against, now with a
  reproduction and an issue number attached.

Before this amendment, "OTIO's `target_url` is a location, not an identity" read as a design
preference a reader could reasonably weigh differently. It is not a preference: two of the most
widely deployed NLEs in the industry currently disagree about what a `target_url` means, in an
open upstream issue. That converts the justification for koine's explicit asset-id envelope from a
hand-wave into a **citation**. The adoption is *more* defensible after recording the risk than
before, because the record now shows koine adopted the mature half and retained the half that is
demonstrably not settled.

**The honest cost, stated plainly.** Depending on a pre-1.0 upstream means the schema may still
move under koine, and a 1.0 that is four months late may be later still. Two things bound it: the
dependency is on a *serialization format*, not a library (koine holds no runtime — ADR-0001), and
the pin is reviewed on the cadence in [`../docs/upstream-standards.md`](../docs/upstream-standards.md)
rather than on hope. The open question that would tighten it further — which OTIO core schema
versions a conformant timeline may declare — is already KMI §9.1 and stays open; this amendment
records the maturity picture that makes answering it matter, and does not answer it.

**Re-open test.** This record should be revisited if either fact reverses in a way that changes the
layering rather than the schedule: if OTIO **specifies `target_url` resolution** normatively enough
that a content-addressed id adds nothing (which would make decision 5's identity row a candidate
for retirement, not the adoption), or if OTIO's pre-1.0 churn produces a **breaking composition-model
change** koine's additive layer cannot ride over. A 1.0 that merely lands late is neither: it is the
schedule slipping, which the pin already tracks.

**Spec effect.** Risks and rationale only. **No clause of KMI changes because of this amendment** —
§4's OTIO conformance rules, §4.2's additive layer, and §4.3's media map are untouched, and KMI's
re-ratification path is still the outstanding re-run of
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) shared with KCB. The
KMI-side landing is the §4.1 upstream-pin note plus a dated changelog entry; the pin table's OTIO
row in [`../docs/upstream-standards.md`](../docs/upstream-standards.md) is the record of the
observation.

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
