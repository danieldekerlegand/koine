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

---

## Re-run — the KCB legs walked by hand against KCB 0.5.0 (2026-09-03)

**What this is.** KCB's **count (i)**, outstanding since 2026-07-22 and the oldest of its five: *re-run
this pass against the §2 AgentCard-extension manifest shape*. It is walked here against KCB **0.5.0 as
published**, not against 0.3.0 as the count was declared, because a re-run is against the **current**
folded text and five folds have landed on the surfaces this scenario reads since the count opened —
0.4.6 (§3.1), 0.4.7 (§4.2), 0.4.8 (§4.3), 0.4.9 (§3/§5) and 0.5.0 (§2.4/§4.4/§7). A re-run that
skipped them would discharge a gate against text nobody runs.

**Method, and why it is not a replay.** By hand, against the prose. `kcs:media-transform` ran
`green` / `partial-live` on 2026-08-24 and is recorded above; it is **not** the verdict here, for two
separate reasons. **DR-7/DR-8**: an encoding deliberately does not assert an unfolded delta, and this
one was written before §2.4, §4.4 and §7.3g existed. **DR-1**: the one participant this scenario is
about on the provider side — the composer — answered from a `standin` recording, so the provider half
of Steps 3 and 4 was never live. The green line is evidence for what it encodes and for nothing here.

**Which steps this walk covers.** Steps **1, 3, 4** and **8** are the KCB legs — deltas F (cross-plane
ports), K (capability `cost` + spend ceiling), G (`fetch` verb + grant), J (`world_pattern`) and L
(dangling-reference tolerance). Steps **2, 5, 6, 7** are KMI legs; the manifest's shape and location do
not reach them, and they were re-validated clean at KMI 0.3.0 in *Re-validation — KMI 0.3.0* above.
KMI 0.3.5's MA-5 fold adds optional `license`/`egress` to the §2 asset envelope and moves no clause
those four steps read — `source_world` still rides the envelope per-asset (Steps 2, 7), lineage is
still a graph over assets outside the timeline (Steps 5, 6) — so the OTIO re-validation stands
unamended.

### Per-step verdicts

| Step | Delta under test | Verdict |
|---|---|---|
| **1** — Discovery & path planning | F, J, K | 🟡 **holds for F/J/K, and breaks on a new seam** → **MT-1** |
| **3** — Cross-participant `invoke` | K | ✅ **holds** *(regression)* — and the two folds that touch it are confirmed additive by execution |
| **4** — Fetch the master bytes | G, L | ✅ **holds** *(regression)* |
| **8** — Discover-by-world | J | ✅ **holds** *(regression)* |
| 2, 5, 6, 7 | H, I, and the OTIO layer | — *not reached by the manifest shape; re-validated at KMI 0.3.0 and unmoved by MA-5* |

### Step 1 — Discovery & path planning 🟡 *holds for F/J/K, breaks on a new seam*

**What holds, and it is the whole of what the count asked.** The collapse of the standalone manifest
onto the AgentCard is a change of *shape and location*, not of the port model, and every leg of Step 1
resolves off the card extension:

- **F.** §2.1 states the plane-typed port table inside the extension's `params`, and the `compose`
  entry in §2's own example card carries a `knowledge` input and a `media` output — the mood→score leg
  itself, on the card. §3's *Composition* bullet computes the path *"by matching the ports crawled off
  peers' card extensions"*. The cross-plane leg is matched, and it is matched where the count asked.
- **J.** `world_pattern` rides a media port in `params.produces` (§2.1), and §3's *Query* bullet
  matches media ports by `media_type` **and** `world_pattern`. Step 8 is the same fact from the other
  side.
- **K.** `cost` rides a capability in `params.capabilities` (§2.1) and §3's path search *"prefers
  zero-`cost` routes … and returns the path's projected cost"*. Unchanged.
- **The crawl itself.** §3's *Population* bullet reads the extension entry whose `uri` is
  `https://w3id.org/koine/kcb/manifest/0.3` off `/.well-known/agent-card.json`, and §2.3's dual-accept
  window makes the legacy root match the same extension until 0.6.0. 0.5.0's discharge of §2.2's
  standalone-manifest removal (§7.3f) takes nothing away from this leg: it ends an *obligation* to
  crawl a second file that this scenario never needed.

**🔴 BROKE (MT-1, high — structural). A path plan carries no version, and §4.4c's second case selects
one silently.** The re-run finds it by putting Step 1 next to a fact that did not exist when Step 1 was
written: §7.2 now **mandates** a dual-serving window, and §2.4 has just made one operable.

§7.1 makes `(name, version)` — *"not the name alone"* — the unit of discovery, and §3 ranks the
**highest satisfying version first**. So where `mediastore` serves `compose 1.4.0` and `compose 2.0.0`
side by side, the leg §3 matches into the plan is **`2.0.0`'s** ports. `analyzer` then invokes to
execute that leg. §4.4a's `version` operand is **optional**; §4.4c resolves *operand, else the grant's
major, else refuse*; and `analyzer`'s grant is `invoke:compose`, issued at major 1. With no operand the
call resolves to **`1.4.0`** — a major the grant authorizes, so §5's gate does not fire, nothing is
refused, and **the leg that runs is not the leg that was planned**. Where the two majors differ in
their ports — 2.0.0 adds a required `style_ref` input and tightens the output `world_pattern`, which is
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md)'s Step 7 exactly — the caller receives a
**different contract than the one path search matched**, with no signal at either end.

*Why this is not V-5 restated.* V-5 was an **authorization** hole: a version-free call resolved to
*highest published* let a v1-granted caller reach v2, inverting fail-closed into fail-open. §4.4c
closes it, and forbids that default **by name**. MT-1 is the **symmetric** selection one plane over,
and it is not forbidden: resolving to the *granted* major is a silent selection too, and the party it
silently disagrees with is not the grant — the grant is satisfied — but **§3's own path plan**. §4.4c's
stated reasoning transfers without amendment (*"there is no hub to arbitrate a disagreement about which
major was meant"*); what is new is that here the two disagreeing parties are two sections of KCB.

*Why it is High.* It lands on **delta F**, the cross-plane leg that is the any-to-any promise and the
one this scenario exists for; and it fails **silently** rather than closed, which is the class §7.2
rates non-recoverable everywhere else it appears.

*The fold is additive and one spec.* §3 already indexes each capability's `version` (*Population*) and
MA-8's response shape already carries per-entry manifest data, so a returned path leg can **name the
`(name, version)` it was matched over** at no new field; and §4.4c gains one further rule — an `invoke`
fulfilling a named plan leg whose resolved major differs from the planned one is **refused**, naming
both, in the instrument §4.4c and §5 already share. The minimal alternative is to make §4.4a's operand
REQUIRED of a caller fulfilling a §3 path leg against a provider publishing more than one major. Either
is additive; neither moves a digest, a grant name, a verb, or §7.1's ban on version-in-the-name.
→ KCB §3/§4.4.

### Step 3 — Cross-participant `invoke` ✅ *holds (regression)*

Delta K reproduces nothing. The chain knowledge-producer → media-producer → paid model runs under
`invoke:compose` with `budget_units`, path search returns the projected cost before the call, and a
raise beyond the remaining ceiling fails at the gate (§5). Three folds since 0.3.0 touch this step and
**all three are confirmed additive by walking it rather than by reading their additivity claims**:

- **§4.4d (`quoted_cost`, V-1).** Optional. `analyzer` carries none and behaviour is 0.4.9's exactly.
- **§4.3 (posture).** `analyzer` declares no `posture` operand, so per §4.3b the dispatch *"gates on
  nothing and is served exactly as it was at 0.4.7"*. `compose` declares no `effect`, which reads
  *unknown* — and `unknown` is refused only *"wherever a posture gates on class"*, which here is
  nowhere. Every leg of this scenario still runs. This is the additivity claim of 0.4.8 executed
  against a pass that predates it.
- **§5's MA-6 rules.** The issuer-naming and unit rules bite a grant *crossing an authority-domain
  boundary*; this scenario is single-domain, so they are silent, which is what 0.4.9 said they would be.
- **§4.4c(4).** `mediastore` publishes one major of `compose` in this scenario's cast, so a version-free
  call is served exactly as at 0.4.9. MT-1 above is the two-major case, and it is Step 1's.

### Step 4 — Fetch the master bytes ✅ *holds (regression)*

Delta G is intact: `fetch` is one of §4's five verbs, addressed by `asset` id, integrity self-verifying
against the hash, gated by a `fetch:asset` grant (§5). Three later clauses were probed against it and
none reopens it. §4.3a gives `fetch` **no** effect class deliberately, because KMI §7.1 over KGP §7
already gates it fail-closed in the right domain — so a posture adds no second gate here. §4.2f lets a
CAS holder limit the fan-out, and requires the limit to be a **refusal**, which lands on delta L's
existing pending-fetch tolerance rather than on a new surface. KMI 0.3.5's §7.1(d)(e) evaluates the
asset's own `license`/`egress` in addition to the serving domain's — this fetch is in-domain, so the
added evaluation is a no-op, which is MA-5's own claim executed. **MA-12 is not reached by this step**:
`worldsim` holds the bytes and serves them, so §7.1(f)'s *not held, and not expected* answer — the one
with no carrier — never has to be given.

### Step 8 — Discover-by-world ✅ *holds (regression)*

Delta J is intact and is the same fact as Step 1's J leg read from the query side: media `produces`
entries in the extension's `params` carry `world_pattern`, and §3's *Query* bullet matches on it. §3's
0.4.9 response shape (`served_by`, `observed_at`, `incomplete[]`) is emitted only by a federating
deployment and is absent here, exactly as MA-8's fold said it would be.

### What this re-run does and does not close

**Count (i) does NOT close.** The question it was opened to ask — *does the port/cost/world model
survive being served as an AgentCard extension?* — is answered **yes**, and answered by execution
rather than by the *0.3.0 re-check* paragraph's reading. Every one of F, G, J, K and L holds against
the card, and the three folds that landed on these steps after the count opened are confirmed additive
by running them rather than by citing their own additivity claims. That is the substance of the count,
and it is the first time it has been walked.

It does not close because the walk found **MT-1**, and MT-1 is a break in the leg the count gates:
§3's path planning, which is delta F's surface and this scenario's Step 1. So the count **changes
shape** rather than closing, in the same way KINP's, KMI's, KFT's and KCB count (iii)'s did on this
date: from *re-run this pass against the extension shape* to **fold MT-1 (additive; KCB §3 + §4.4, no
digest moves, no grant name moves, no verb added), then re-run Steps 1, 3, 4 and 8 again**. It is
**unowned**.

**What it does not touch.** KMI's own half of this scenario is unmoved: the OTIO re-validation above
stands, no KMI clause is read differently, and KMI's count (ii) — *"rides with KCB"* — therefore stays
open on this count, not on a KMI edit. No spec version moves for this walk and **no clause moves**:
the edit is this section, a gate paragraph in
[`../specs/capability-bus.md`](../specs/capability-bus.md) and a changelog entry.

---

## Re-run — Steps 1, 3, 4 and 8 walked by hand against KCB 0.5.7 / KMI 0.3.8 (2026-09-12)

**What this is.** The re-run count **(i)** took after the 2026-09-03 walk found **MT-1**: *fold MT-1
(additive; KCB §3 + §4.4), then re-run Steps 1, 3, 4 and 8 again*. That fold has landed, in the
house form for a fold with a carrier half and an enforcement half — two patches in one publication
cycle, **KCB 0.5.6** (§3's path leg names the `(name, version)` it was matched over) and **KCB
0.5.7** (§4.4c refuses a resolved major that differs from a presented plan leg). This section is the
re-run against that text. A fold does not close its own gate, so the question here is not *was MT-1
folded* but *does MT-1 reproduce, and does anything else break on the way through*.

**Method, and why it is not a replay.** By hand, against the **prose**, at KCB **0.5.7** and KMI
**0.3.8** — the first text carrying both halves. `kcs:media-transform` ran `green` / `partial-live`
on 2026-08-24 and is recorded below; it is **not** the verdict here, for three separate reasons.
**DR-7**: an encoding deliberately does not assert an unfolded delta, and this one was written
before §2.4, §4.4 and §7.3g existed, let alone §3's MT-1 bullet — it now predates **eight**
publications of the spec it gates. **DR-4**: `kcs:kmi-otio-roundtrip` is this same scenario
re-titled over the same fixture, so the downstream set carries one encoding of it and not two.
**DR-1**: the provider half of Steps 3 and 4 answered from a `standin` recording and was never live.
An exit code is not a verdict here.

**Which steps, and why these.** Steps **1, 3, 4** and **8** are the KCB legs — deltas **F**
(cross-plane ports), **K** (capability `cost` + spend ceiling), **G** (`fetch` verb + grant), **J**
(`world_pattern`) and **L** (dangling-reference tolerance) — and Step **1** is where MT-1 was found
and where both halves of its fold land. Steps **2, 5, 6, 7** are KMI legs, re-validated clean at KMI
0.3.0 in *Re-validation — KMI 0.3.0* above and unmoved since: MA-5 (0.3.5) added optional
`license`/`egress` to the §2 envelope, MA-13's fold (0.3.8) states which of two conformant pairs
governs a serve, and MA-12's KMI half (0.3.7) names KCB §4.5 as §7.1(f)'s carrier — none of the
three moves a clause those four steps read (`source_world` still rides the envelope per-asset;
lineage is still a graph over assets outside the timeline). The OTIO re-validation stands unamended.

### Per-step verdicts

| Step | Delta under test | Verdict |
|---|---|---|
| **1** — Discovery & path planning | F, J, K, **MT-1** | 🟡 **MT-1 does not reproduce; F/J/K hold; breaks on the fold's own perimeter** → **MT-2**, **MT-3** |
| **3** — Cross-participant `invoke` | K | ✅ **holds** *(regression)* — and 0.5.6/0.5.7 are confirmed additive by execution |
| **4** — Fetch the master bytes | G, L | ✅ **holds** *(regression)* |
| **8** — Discover-by-world | J | ✅ **holds** *(regression)* — and is deliberately outside the new clause |
| 2, 5, 6, 7 | H, I, and the OTIO layer | — *not reached by §3/§4.4; re-validated at KMI 0.3.0 and unmoved by MA-5, MA-12 or MA-13* |

### Step 1 — Discovery & path planning 🟡 *MT-1 does not reproduce; the clause breaks on its perimeter*

**MT-1 does not reproduce, and it was re-attacked on the ground it was filed on.** MT-1 was filed as
*two sections of KCB disagreeing with nothing on the wire carrying the disagreement*: §3 built a plan
over the highest satisfying version and said nowhere which, and §4.4c(2) resolved a version-free
`invoke` to the granted major, so `analyzer` — planning over `compose 2.0.0`, holding a grant issued
at major 1 — was served **`1.4.0`** with no gate breached and no signal at either end. Walked again
at 0.5.7 with the same cast and the same two published majors:

- §3's plan now **says what it planned over**. The returned leg names `(compose, 2.0.0)` — the exact
  version of the entry whose ports satisfied the leg, *"never a range, never the name alone, and
  never a version the registry did not match"* — and the projected cost is *"the cost of exactly the
  legs as named"*. The half of MT-1 that made the disagreement **unsayable** is gone, and it is gone
  without a ranking change: the leg named is the one *Ranking across versions* already selected.
- §4.4c now **catches the disagreement**. `analyzer` presents `planned_leg = (compose, 2.0.0)`, the
  order resolves at (2) to major **1**, the majors differ, and the provider MUST refuse **plan
  mismatch** *"naming the major it resolved **and** the major the caller planned over"*. The silent
  serve is a named refusal, and the refusal names the right condition — the caller learns it planned
  against a contract it is not authorized to run, which is a fact about its grant and its plan
  together and which neither §5's gate nor §4.4c's first rule could have told it.
- **Nothing was minted to do it, and the boundaries hold under direct attack.** The comparison is on
  the major alone, so `1.4.0` against major 1 is not a mismatch and an ordinary compatible upgrade is
  not turned into a refusal (probed). The check is applied **after** the resolution order and never
  inside it — *"MUST NOT treat it as a fifth case … MUST NOT let it stand in for a missing `version`
  operand at (c)(3)"* — so no default is minted and *highest published* appears nowhere (probed by
  trying to use `planned_leg` as a selector: the clause forbids it in terms). A leg naming another
  capability is refused rather than ignored, which is the one place §7.2's ignore-unknown-**fields**
  rule could have been over-read into discarding an understood field with a disagreeing value. And
  the grant rule is byte-unchanged and named a different party — the disagreement caught is with
  §3's plan, and where the resolution read the grant the grant was correct.
- **F, J and K hold, and K is now stronger by construction.** F's cross-plane mood→score leg still
  matches off the card extension (§2.1's plane-typed port table, §3's *Composition*); J's
  `world_pattern` still rides a media port and is still matched by §3's *Query*; K's cost-aware path
  search is unchanged and the new bullet **binds the quote to the leg** — the projected cost is read
  *from the same entries* the legs were named from, so a caller gating spend on the plan is gating
  against the same `(name, version)` it planned over. That is delta K and delta F composing rather
  than merely coexisting, and it is the first time this scenario has been able to say so.

**🔴 BROKE (MT-2, High — carrier). A path result has no shape, and `planned_leg` is typed against
it.** §3's new bullet is NORMATIVE about what a leg **names** and states, as the reason it costs
nothing, that *"it mints no field"*. Put beside the request that produces it, that claim does not
hold:

- §3's *Query* bullet types the registry's one query as `find(port | plane | world | capability)` →
  **"matching manifests, ranked"**. §4's verb table types `discover` as *"registry query (§3) — find
  providers by capability / interchange type / world"*. Neither takes a **(start port, goal port)**
  pair, and neither returns a **path**. The *Composition* bullet asserts the registry computes one
  and the MT-1 bullet opens *"Where a `find` returns a path"* — but no clause of §3, §4 or §7 says
  how a path is **asked for** or what a path **is** on the wire: no legs array, no ordering, no
  field a leg's `name` and `version` are read from, no place the projected cost sits.
- §4.4c then types its operand **against that absence**: `planned_leg` is *"the `(name, version)`
  §3 named for the leg this call executes, **carried as §3 returned it**"*. A provider is required
  to compare a value whose shape is fixed nowhere, and a caller is required to carry it forward
  unchanged from a result that has no form. Two conformant registries return a plan in two shapes
  and neither caller's `planned_leg` is readable by the other's provider.
- The contrast is **inside this spec, and recent**. MA-8 minted `served_by`, `observed_at` and
  `incomplete[]` precisely because §3.1 asserted three clauses with no carrier in the `find`
  response; §4.5 (0.5.2) named `fetch`'s four outcomes in the table that types the verb on the
  stated ground that *"where every other structured response on this bus is typed somewhere"*; and
  ADR-0014's marking got its carrier at 0.5.1 for the same reason. The registry's **path** result is
  now the structured response that is typed nowhere, and the fold that most needed it to be typed is
  the one that declined to.
- **Why High.** It is the carrier for the fold's own operand, so the enforcement half is inoperable
  across an authority boundary exactly where MT-1 bites — and it reproduces with **one registry, one
  provider and no federation**, which is where ADR-0014's carrier gap and MA-17's reproduced too.
  It fails **silently** in the direction that matters: a `planned_leg` a provider cannot parse is a
  `planned_leg` that is absent, and *"Absent, nothing changes"* makes an unreadable plan and an
  unpresented one the same plan — which is MT-1's own silence returning through the shape rather
  than through the clause.
- **The fold is additive and one spec.** Give §3 the path request and result the *Composition*
  bullet has always assumed — a start port and a goal port as a `find` form, and a result that is an
  ordered list of legs, each naming `name`, `version` and the address it resolves to, with the
  projected cost at the result level — in MA-8's shape and with MA-8's discipline (a carrier for
  clauses already normative, emitted only where a deployment computes paths, ignorable by a consumer
  that does not read it, §7.2). Nothing here needs a new verb: `discover` already *is* the registry
  query. → KCB §3 (and §4's `discover` row).

**🔴 BROKE (MT-3, Med-High — scope). The cross-check binds the party that cannot detect the
condition, and no response names the resolved major.** §4.4c's refusal fires only where the caller
presents `planned_leg`, which is OPTIONAL and deliberately so (§4.4e: *"no requirement that a caller
pin"*). Walk the case where it is absent, which is the case MT-1 was filed on:

- `analyzer` plans over `compose 2.0.0`, presents nothing, and is served major **1** — *silently, no
  gate breached and no signal at either end*, which is MT-1's sentence verbatim. The fold's answer is
  that the caller should have presented its plan; the difficulty is that the caller is the one party
  that **cannot know a selection happened**, and the provider — which resolved at (c)(2) knowing it
  publishes two majors — owes nothing.
- The asymmetry is **inside §4.4c's own order**. At **(3)** a provider publishing more than one major
  MUST refuse rather than pick, *"and MUST NOT resolve to the highest published major"*, because a
  selection among majors is not the provider's to make. At **(2)** a provider publishing more than
  one major **does** select among them — correctly, on the grant's authority — and says nothing. The
  authorization is sound; what is missing is that the *selection* is unstated, and the two majors
  differ in their ports (2.0.0 adds a required `style_ref` and tightens the output `world_pattern`,
  which is [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md)'s Step 7 exactly).
- **No response names the resolved major**, so the disagreement is not detectable after the fact
  either. §4's `invoke` row types the request side — the version and the quoted cost travel as
  operands — and no clause of §4, §4.4 or §7 puts the resolved `(name, version)` in the response.
  KMI does not supply it by another route: §2's `produced_by` names the run activity, not the
  capability version that ran, so the output asset of a `compose` leg is un-attributable to a major.
  A caller can learn which contract executed **only** by pre-declaring which one it expected.
- **This is MA-12's shape on the other verb.** 0.5.2 gave `fetch` a named response vocabulary
  because a store's normative answer had nowhere to land; `invoke` resolves a major by an order §4.4c
  calls NORMATIVE and the result of that resolution is carried nowhere at all.
- **Why Med-High and not High.** It fails **silently** rather than closed, which is the class §7.2
  rates non-recoverable — but it is reachable only where a provider publishes more than one major and
  the caller declines an operand available to it, and the caller that does present one is fully
  protected. It is a narrowing of MT-1's blast radius, not a reopening of it.
- **The fold is additive and one spec.** Where a provider resolves at (c)(2) **and publishes more
  than one major of that name**, it MUST name the resolved `(name, version)` in its response — the
  same move §3 makes for the plan and §4.5 makes for `fetch`, one plane over, and the smallest thing
  that makes a selection **stated** rather than guessed-at. It mints no default, no negotiation and
  no obligation on the caller, and an `invoke` against a single-major provider is untouched.
  → KCB §4/§4.4c.

### Step 3 — Cross-participant `invoke` ✅ *holds (regression)*

Delta K reproduces nothing and the two new clauses are confirmed additive **by execution**.
`mediastore` publishes **one** major of `compose` in this scenario's cast, so: §3's plan names that
one `(name, version)` and the projected cost is read off the same entry; `analyzer` carries no
`planned_leg` and no `version`, so §4.4c resolves at **(4)** — *"exactly as it did at 0.4.9"* — and
the new cross-check is never reached, *"Absent, nothing changes"* executed rather than read. The
chain knowledge-producer → media-producer → paid model still runs under `invoke:compose` with
`budget_units`, the projected cost still arrives before the call, and a raise beyond the remaining
ceiling still fails at the gate (§5). §4.4d's `quoted_cost` is carried by nobody here; §4.3's posture
gates on nothing (`analyzer` declares none, `compose` declares no `effect`); §5's MA-6 issuer and
unit rules are silent because this cast is single-domain. MT-2 does not reach this step, because a
one-leg plan whose leg is never presented is a plan nothing reads. MT-3 does not reach it either:
with one published major there is no selection to state.

### Step 4 — Fetch the master bytes ✅ *holds (regression)*

Delta G is intact and neither 0.5.6 nor 0.5.7 touches it: `fetch` is one of §4's five verbs,
addressed by `asset` id, self-verifying against the hash, gated by a `fetch:asset` grant (§5), and
§4.4's operands are `invoke`'s. Three later clauses were probed against it again. §4.5's named
outcomes (0.5.2) are reached only in the `held` case here — `worldsim` holds the bytes and serves
them — so the outcome carried is the bytes themselves and **MA-17 is not reached by this step**, as
the 2026-09-03 walk recorded. §4.2f's fan-out limit is still a **refusal** and still lands on delta
L's pending-fetch tolerance rather than a new surface. KMI **0.3.8**'s MA-13 fold was put to this
step for the first time: this fetch is in-domain, `worldsim` holds one conformant `license`/`egress`
pair for the master, so §7.1(e)'s most-restrictive-governs rule ranks a set of one and (d) carries
the pair the serving participant evaluated — a **no-op**, which is 0.3.8's own additivity claim
executed rather than cited. Delta L is unmoved.

### Step 8 — Discover-by-world ✅ *holds (regression)*

Delta J is intact and is Step 1's J leg read from the query side: media `produces` entries in the
extension's `params` carry `world_pattern` and §3's *Query* bullet matches on it. The MT-1 bullet is
deliberately outside this step and was checked to be: it governs *"where a `find` returns a path"*,
and a discover-by-world query returns **matching manifests, ranked** and no path, so no leg is named
and nothing is added to this response. §3's 0.4.9 federation shape (`served_by`, `observed_at`,
`incomplete[]`) is absent here because this deployment does not federate, and §2's `deprecated` /
`removal_version` (0.5.1) are absent because no provider in this cast published either — both
conformant unchanged, which is what those folds said they would be.

### What this re-run does and does not close

**Count (i) does NOT close, and it changes shape for the second time.** What the count exists to ask
— *does the port/cost/world model survive being served as an AgentCard extension?* — was answered
**yes** by execution on 2026-09-03 and is answered yes again here; F, G, J, K and L hold for a second
consecutive walk, now against text carrying five more folds. **MT-1 does not reproduce**: §3's plan
says what it planned over, §4.4c refuses the disagreement naming both majors, the comparison is
bounded on the major, no default is minted, and the grant rule is untouched and correctly named a
different party. The count does not close because the walk found **MT-2** (High, carrier — the path
result has no shape, and `planned_leg` is typed against it) and **MT-3** (Med-High, scope — the
cross-check binds the party that cannot detect the condition, and no response names the resolved
major). Both land on the fold published hours earlier, and **neither is a break in its model**: §3's
naming rule and §4.4c's refusal instrument were attacked directly and did not yield. Count (i) now
reads **fold MT-2 (§3's path request and result, in MA-8's shape) and MT-3 (§4.4c names a resolved
major where it selected among several), then re-run Steps 1, 3, 4 and 8 again**. Both are additive,
both are **KCB-only**, and both are **unowned**.

**MT-2 is the seventh finding in this repo on one axis** — *a rule with a declared normative
consequence and nothing that carries it*, after MA-8, V-10, BP-7, ADR-0014's marking, MA-17 and
MA-20 — and this walk is the **fifth consecutive** one in this repo to break on a fold's own
perimeter rather than its model (after §4.5's MA-17, KMI §7.1(d)'s MA-19/MA-20, §7.1's V-12/V-14 and
§7.3g's V-16/AP-10). The shape is the same every time: the mechanism is checked hard and the
**claim the prose makes about it** is not — here, *"it mints no field"*, which was true of the leg
and false of the path.

**What a clean count (i) would and would not have bought, stated because it is easy to over-read.**
This count is also **KMI's second promotion condition** (*"rides with KCB"*), so a clean walk here is
worth more than one spec's count — but it closes only **KCB count (i)**. KCB's other five counts are
untouched by this walk and none moves: (ii) the §7.5 mutate-live-schema re-run, (iii) the
cross-authority re-run, (iv) the firehose re-run, (v) the cross-owner-posture re-run plus ADR-0013's
**W3**, and (vi) the §4.5 re-run. **KCB is not promoted and is not promotable**, and would not have
been on a clean walk. KMI is not promoted either: its count (i) stands on MA-19/MA-20 and MA-17/MA-18,
and the fabric-wide conformance gate still fails on **DR-4** and **DR-8**/**DR-7**.

**What it does not touch.** KMI's own half of this scenario is unmoved — the OTIO re-validation above
stands, no KMI clause is read differently, and the one KMI clause this walk did exercise (§7.1(d)(e)
at 0.3.8) was a no-op in-domain as its fold said it would be. **No spec version moves for this walk
and no clause moves**: the edit is this section, two gate paragraphs and a *Pressure test* paragraph
in [`../specs/capability-bus.md`](../specs/capability-bus.md), a changelog entry, a disposition row
in [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md),
and the promotability record.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes: the run date, the participants **by role**, what passed, what broke. Instance-free — the
> namespaces are the KINP §3.4 placeholders, not any deployment's cast. It **promotes nothing**: an
> owner MAY cite a recorded pass and MUST answer a recorded failure.

**Run of 2026-08-24** · encoding `kcs:media-transform` · KCS 0.3.0 · evidence
`sha256-2d9e6c43…c17bb3` **(superseded 2026-08-26 by `sha256-eb8fdc9c…36dd5`, twelve scenarios — this scenario's own per-scenario entry is byte-identical in it, checked 2026-09-03)**, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

| | |
|---|---|
| Participants, by role | world **producer** (`worldsim`, live) · knowledge **producer** (`analyzer`, live) · identity **authority** (`refkb`, live) · media **provider** (`mediastore` composer, **stand-in**) |
| Over what links | **3 of 4 live** (75%). The composer answered from a delta-N `standin` recording, not over a live link. |
| Encoded as | 11 steps + **16** assertions, of which **3** are `expect: reject` |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**What passed.** Every encoded assertion.

- **Step 1 / delta F** — three `capability_path_exists` probes: discovery plans the cross-plane
  mood→score path, which is the leg delta F opened.
- **Steps 2/5/7** — three `source_world_is` probes plus `asset_attaches_to`: world scoping survives
  every hop of the media plane, and media hangs off entities by identifier (KMI §7.2).
- **Steps 3/5 / delta G** — `cost_within_ceiling` and two `refused` steps: the spend ceiling is
  demonstrated by a refusal that actually happened, not by a number sitting in a manifest.
- **Step 6 / delta L** — `dangling_ref_tolerated`: an unresolvable reference narrows the answer and
  breaks nothing.
- **Step 7 / KMI §5** — `analysis_attributed_to_constituent` plus `claim_in_world` and
  `provenance_present`: the composite's analysis lands in the **constituent clip's** world, which is
  the media→knowledge bridge property, and the firewall holds across it.

**What the run does not say.** The one participant this scenario is *about on the provider side* —
the composer that performs the transform — was a stand-in. The cross-participant `invoke` of Step 3
and the CAS byte-`fetch` of Step 4 therefore exercised the **consumer** half over a live link and
the **provider** half against a recording. Promotion of that role from stand-in to live is a cast
change only, not a document change, so re-running it needs an adopter and not an edit. See **DR-1**.

**What this leaves for KCB and KMI.** Both remain candidate. This run is evidence that the encoded
discovery legs hold **against a recorded card**, and the outstanding re-run named in
[`README.md`](README.md) — this scenario against KCB's §2 AgentCard-extension manifest shape — asks
whether they hold against a *live* one. That is exactly the half the stand-in did not answer.

### Findings — from the downstream run

None local to this scenario: every encoded assertion held and the run opened no new break. The
suite-wide limits **DR-1** (stand-in coverage — binding here, 1 of 4 slots) and **DR-2**
(aggregate-only evidence) are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).
