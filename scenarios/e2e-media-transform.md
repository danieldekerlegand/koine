# Scenario: Media transform across participants (KCB + KMI pressure test)

**Purpose:** stress-test [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB
0.1.0) and [`../specs/media-interchange.md`](../specs/media-interchange.md) (KMI 0.1.0)
against concrete data crossing **four** participants, deliberately hunting for seam bugs before
either is ratified. Same method as the identity pressure test: each step marks what *held* and
what *broke*; §Findings collects the deltas and flags which block ratification.

**The story:** in the **knowledge producer**'s chat, a user says: *"Make a 30-second recap
trailer of my Alderforest playthrough, with narration and an original orchestral score,
delivered as a DaVinci project."* This forces discovery + path-planning (KCB), a
cross-participant transform chain (world-producer video + media-producer score + TTS narration
→ timeline → NLE project), byte transport, and the media→knowledge bridge — every surface of both
specs at once.

**Setup (manifests published to the host-provisioned registry, KCB §3):** the **world producer**
`worldsim` (produces game video for its worlds), the **media producer** `mediastore` (`compose`
capability → audio), the **knowledge producer** `analyzer` (transforms:
narrate/storyboard/video-gen/conform/render/export; consumes media + knowledge), and the
**identity authority** `refkb` (resolver + KGP). All are KINP entities (KCB §2).

---

## Step 1 — Discovery & path planning (KCB §3/§4; transform typing KCB §2 / KMI §6)

The knowledge producer asks the registry to compute a path from the prompt to an NLE project.
It needs legs:
`text → narration(audio)`, `gameplay → clips`, `mood → score(audio)`, `assets → timeline`,
`timeline → CMX3600`.

✅ **Held** for the media legs: the registry matches `produces`↔`consumes` profiles —
`narrate: text/plain → audio/wav`, `conform: assets → timeline`,
`export: timeline → CMX3600`. The timeline port's `media_type` is
`application/vnd.opentimelineio+json` (KMI §4); path-matching is unaffected by *which* timeline
model sits behind that port.

🔴 **BROKE (F, structural).** The **score** leg is *"compose a score matching the trailer's
mood."* Its input is not a `media_type` — it is a **mood/emotion descriptor derived from the
playthrough** (a KGP knowledge payload / entity refs). KMI §6 types transforms by **media
profiles only**, and the registry's path-matching (KCB §3) matches `produces`/`consumes`
without any rule for a transform that **consumes knowledge and produces media**. Path-finding
cannot route the score leg at all. This is core to the any-to-any promise. **Delta F.**

---

## Step 2 — Invoke narration (KCB `invoke`; KMI §2 asset)

It invokes `narrate(text) → audio/wav`; the output asset is minted (byte hash).

🔴 **BROKE (H).** KMI §2 requires `source_world` *"at ingest."* But narration is **generated**,
not ingested — it depicts no world, and it is not *true in* Alderforest. Forcing a world onto a
synthesized asset is semantically wrong, yet the field is REQUIRED. **Delta H.**

---

## Step 3 — Compose the score via the media producer (cross-participant `invoke`; grants §5; cost §7)

The knowledge producer invokes the media producer's `compose`; that provider resolves to a paid
model tier.

🔴 **BROKE (K).** The caller's grant (`invoke:compose`, KCB §5) has **no budget dimension**. The
chain knowledge-producer → media-producer → paid-model can spend unbounded; the caller's local
cost gates don't propagate across an `invoke`. **Delta K.**

---

## Step 4 — Fetch the world producer's master bytes to cut clips (KMI §7 CAS; KCB verbs §4)

The knowledge producer references the playthrough video by KINP id but must **fetch the bytes**
to render.

🔴 **BROKE (G, structural).** KCB verbs are discover / describe / invoke / subscribe — there is
**no asset-retrieval verb**. KMI §7 says byte-fetch "rides KCB" but defines no operation and no
grant. Cross-participant CAS read — the thing that makes reference-by-id usable — is a hole.
**Delta G.**

---

## Step 5 — Conform the timeline + excerpts (KMI §3/§4)

It cuts clips (`media:excerpt_of`, range on the excerpt asset) and builds the multitrack
**OTIO `Timeline`** (a `Stack` of `Track`s: V1 clips, A1 score, A2 narration), referencing every
asset by id at `media_reference.metadata.koine.asset` (KMI §4.2a). The timeline is itself an asset —
`application/vnd.opentimelineio+json`, content-addressed, probe omitted (§2/§4).

✅ **Held:** binary `excerpt_of` + range-on-asset (the §3 fix) composes cleanly; multitrack V/A
references by id with nothing inlined. Both survive the model change: lineage is a graph *over
assets* and stays outside the timeline (§4.2b), so the §3 fix is untouched, and multitrack V/A is
`Track.kind` — OTIO's own, no KMI construct. Clip in/out is a `TimeRange` of `RationalTime`s
carrying their own rate; the excerpt's *cut range* still lives on the excerpt asset's envelope, not
in the timeline.

🟡 **BROKE (L, minor).** The playthrough is still running; a `subscribe` delta (KCB §4) delivers
a new clip **reference** before its bytes have propagated to a fetchable CAS. Nothing says a
consumer must tolerate a dangling reference. **Delta L.**

---

## Step 6 — Render + NLE interchange (KMI §4.3)

It renders `draft.mp4` (`media:derived_from` the canonical timeline + sources) and writes the
timeline out to CMX3600 through OTIO's `cmx_3600` adapter (KMI §4.3). The render capability
consumes the OTIO timeline directly — no intermediate projection.

🔴 **BROKE (I).** CMX3600 / FCPXML reference media by **file path**, not KINP id. Handing the user
an NLE project requires an **asset-id ↔ local-path media map** so the NLE can relink; unspecified,
every clip goes "media offline." **Delta I** — and adopting OTIO does *not* retire it: OTIO's own
`ExternalReference` is `target_url`-based, so the gap is identical in the adopted model. The map is
retained (KMI §4.2d/§4.3), optionally riding the timeline at `metadata.koine.media_map`, with the
self-contained bundle serialization as the alternative.

---

## Step 7 — Analysis → knowledge + firewall check (KMI §5)

It runs continuity/av-analysis on the render, emitting KGP claims. What `source_world`?

✅ **Held — but only once Delta H is sharpened.** The render is a *generated composite* whose
constituents are *ingested* Alderforest excerpts. Analysis of the Alderforest footage must land
in `worldsim:world:alderforest#save-7f` (so the firewall holds — it never touches consensus
reality), **not** in one world for the whole render. So `source_world` is **per-asset**, and
analysis of a composite attributes each claim to the **constituent clip's** world, not the
container's. This confirms the media→knowledge loop and the firewall interplay, and it
sharpens **Delta H**.

---

## Step 8 — Discover-by-world, back at Step 1 (KCB §2/§3)

Re-examining Step 1: to discover *"video from world `alderforest#save-7f`"* the registry must
match on world. But a manifest's media `produces` entry (KCB §2) carries only `media_types` —
**no world field** (only the *knowledge* produce entry has `worlds`). So "give me media from
world X" is unmatchable. **Delta J.**

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| F | **High** | Transform typing is media-profile-only; can't route transforms that consume/produce **knowledge** (e.g. mood→score, media→analysis). | Transform typing + registry path-matching span **all planes** (media profile ∪ knowledge type ∪ entity ref). | KCB §2/§3, KMI §6 |
| G | **High** | No asset-retrieval verb/grant; cross-project CAS read undefined. | Add `fetch(asset_id)` (CAS GET) verb + `fetch:asset` grant; integrity self-verifies via the hash. | KCB §4/§5, KMI §7 |
| H | **High** | `source_world` REQUIRED "at ingest" breaks for **generated** assets; and it must be **per-asset**, attributed to constituents in a composite. | Required only for **ingested** assets that *depict* a world (firewall governs *extraction*); generated assets → `source_world: null`. Analysis of a composite attributes claims to constituent clips. | KMI §2/§5 |
| I | Med | NLE projections reference media by path, not id → media goes offline. | Projections carry an **asset-id ↔ path media map**; round-trip fidelity only via the canonical timeline.¹ | KMI §4 |
| J | Med | Media `produces`/`consumes` typing has no world → can't discover/subscribe "media from world X." | Add `world` / `world_pattern` to media produce/consume typing. | KCB §2/§3 |
| K | Med | Capability grants have no budget; cross-participant invoke chains can spend unbounded. | Grants carry a **spend ceiling**; path-finding prefers zero-spend (the fallback ladder) and surfaces projected cost. | KCB §5/§7 |
| L | Minor | Subscribe can deliver a reference before its bytes are fetchable. | Consumers MUST tolerate dangling asset refs and fetch lazily; producers must not assume pre-propagation. | KCB §4 |

¹ As found (KMI 0.2.0) the canonical timeline was koine's own JSON EDL, and one-directional export
was the only route out. Under KMI 0.3.0 the canonical form is OTIO and its adapters read *and*
write, so an edit that leaves the fabric can come back — lossy at each format's edges, but no
longer one-way. The media-map obligation is unchanged; see **Re-validation** below.

Also folded in as notes (not standalone deltas): assets — including timelines — are signable with
the shared `{key_id, alg}` shape (KCB §5); a composite's provenance is the **union over its
lineage graph** (`derived_from`/`excerpt_of`), so multi-source attribution falls out of KMI §3.

## Verdict

The **fabric's spine holds**: the four planes compose end-to-end, and — the key result — the
firewall survives the media→knowledge bridge (Step 7), *provided* `source_world` becomes
per-asset and generated-vs-ingested aware (H). But the seams between the **new** planes (KCB,
KMI) and the ratified ones have two **structural** holes:

- **F** — cross-plane transform typing — is the one that most threatens the thesis: without it,
  "any-to-any" can't route anything that touches knowledge, which is most interesting
  transforms.
- **G** — asset retrieval — is what makes reference-by-id actually usable across participants.

**Blocking for ratification: F, G, H.** Should-fix before or immediately after: I, J, K.
Cleanup: L. None require redesign — F extends the typing/path-matching rule across planes, G
adds one verb + grant, H relaxes a "required" to "conditional." KCB and KMI should stay
**candidate** until F/G/H land.

> **Resolution (2026-07-17):** all deltas F–L were folded into **KCB 0.2.0** (F cross-plane
> ports, G `fetch` verb + grant, J `world_pattern`, K capability `cost` + grant spend ceilings,
> L dangling-ref tolerance) and **KMI 0.2.0** (F transforms typed by KCB ports, H `source_world`
> conditional/per-asset, I NLE media map). Both specs are now **ratified**. This document stands
> as the historical record of what the pressure test found.

## Re-validation — KMI 0.3.0 (OTIO adoption)

**KMI 0.3.0** ([ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md)) replaces the canonical
composition model: a timeline is an **OpenTimelineIO `Timeline`**, and the bespoke
`application/vnd.koine.edl+json` EDL is deprecated. Because that is a normative change to the model
this scenario exercises, KMI dropped back to **candidate** and the steps that touch the timeline —
**1** (typing the conform/export legs), **5** (conform), **6** (render + interchange) — were re-run
against the adopted model above. The question is narrow: *does koine's additive layer still hold
when the composition model underneath it is someone else's?*

| Additive-layer assertion | Step | Result under OTIO |
|---|---|---|
| Binary `media:excerpt_of` with the cut range on the **excerpt asset**, not in the relation | 5 | ✅ **Holds** — lineage is a graph over *assets* and stays outside the timeline (KMI §4.2b). OTIO has no lineage model to collide with, and the range still lives on the asset envelope (§2). |
| `media:derived_from` from the render back to the timeline + sources | 6 | ✅ **Holds** — same reason; and the timeline is still an asset, so it is still a node in that graph (§4). |
| Per-asset, conditional `source_world` (**delta H**) — the generated narration/score/render carry `null`, analysis of the composite attributes to the constituent clip's world | 2, 7 | ✅ **Holds, untouched** — `source_world` rides the **asset envelope** (§2), never the timeline; the firewall check of Step 7 is unaffected by the composition model. |
| Asset-id ↔ resolved-path **media map** (**delta I**) | 6 | ✅ **Holds, and is still required** — OTIO's `ExternalReference` is `target_url`-based, so "media offline" applies identically. Retained in §4.3, optionally carried at `metadata.koine.media_map` (§4.2d). |
| Clips reference assets **by KINP id**, nothing inlined | 5 | ✅ **Holds** — the id rides OTIO's own extension point, `media_reference.metadata.koine.asset` (§4.2a); a producer with no path carries it on a `MissingReference`. |
| Analysis → KGP assertions, not annotations in the edit | 7 | ✅ **Holds** — OTIO `Marker`s are a non-normative editorial mirror; the KGP assertion stays normative (§4.2c). |

🟡 **New exposure (not a blocking delta).** The additive layer now rides third-party
`metadata` dicts, so a round-trip through a tool that does not preserve namespaced metadata can drop
`metadata.koine` — a failure mode the bespoke model could not have. Recovery is possible via the
media map and the lineage graph; whether a producer MUST re-attach ids on re-import is
[KMI §9.5](../specs/media-interchange.md#9-open-questions), open.

**No delta is reopened.** F, G, H, J, K, L never touched the composition model. I is *reconfirmed*
rather than re-broken — the same gap, in the adopted model, with the same fix.

> **Resolution (2026-08-02):** the OTIO re-validation pass above is recorded against **KMI 0.3.0**
> (§4 rewritten around the OTIO `Timeline`, §4.4 deprecating the bespoke EDL) and its
> machine-readable twin [`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json).
> The additive layer survives the model change intact. Promotion back to **ratified** is *not*
> claimed here: **KCB 0.3.0** redefines the §2 manifest as an A2A AgentCard extension, which this
> scenario's Steps 1/3/8 exercise and which has not been re-run. Both specs stay **candidate**
> until that pass lands.
