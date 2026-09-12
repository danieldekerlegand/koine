# Koine Media-Interchange Protocol (KMI)

**Spec version:** 0.3.8
**Status:** Candidate
**Last updated:** 2026-09-12
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

> **Status note (0.3.1):** names the removal version the 0.3.0 deprecation left open —
> `application/vnd.koine.edl+json` is removed at **KMI 0.4.0** (§4.4), under the fabric-wide
> deprecation policy stated once in [`capability-bus.md`](capability-bus.md) §7.3
> ([ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)). Patch-level and
> additive: it closes a declared window rather than changing the model shape, so no delta is
> reopened and the re-ratification path above is unchanged.

> **Status note (0.3.4):** adds **§7.1**, the normative CAS-federation clause applying
> [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md): a single shared content-addressed
> store (§7) stays conformant unchanged, and **per-project stores that replicate on reference** are
> specified as an additive composition in which the KINP `asset` id — the hash of the bytes — is
> **byte-stable across stores**, so a replicated copy is the same asset rather than a new one. It
> adds a **second** re-ratification count, the cross-authority break test in
> [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), which is
> the same test KINP §11 decision 1 and KCB §3.1 name; it gates §7.1 alone and does not move the
> KCB-re-run count below. That test is now written and run as
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), and is **not clean**
> — the id stayed byte-stable under every attack tried, but **MA-5** (blocking) and **MA-10** are
> open, so the second count does not close.

> **Status note (0.3.5):** **MA-5 and MA-10 are folded** (§2's optional `license`/`egress`, §7.1(d)'s
> travels-with-the-bytes carve-out, §7.1(e)'s not-served-onward rule, §7.1(f)'s three-valued answer)
> — and **the second count still does not close**. A fold does not close its own gate: new normative
> text re-enters validation, so the count **changed shape rather than closing**, from *fold MA-5 and
> MA-10* to **a re-run of Steps 8–10 of
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) against the folded
> text**. Stated plainly so a reader does not have to infer it: **this fold clears neither of KMI's
> two counts.** The first (the [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md)
> re-run) is **KCB's** work and is untouched here, so even a clean re-run of the second leaves KMI
> **Candidate**. What the fold does to each spec's gate is set out in
> [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md);
> the ranking of what stands between each spec and `ratified` is kept once, in
> [`../docs/reference/promotability.md`](../docs/reference/promotability.md).

> **Status note (0.3.7):** **MA-12 is folded** — the carrier half on
> [`capability-bus.md`](capability-bus.md) **§4.5** (KCB 0.5.2), and here a paragraph in §7.1(f)
> naming it as where the three answers are carried. Patch: no field, enum or envelope is minted on
> this plane, **no `asset` id moves**, no envelope field is added, no schema twin is touched, and a
> single-store deployment behaves exactly as at 0.3.6; **0.4.0 stays spent** on §4.4's EDL removal.
> **Neither count closes.** Count (i) changes shape a fourth time — *fold **MA-13**, then re-run
> Steps 8–10 of [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md)* —
> because MA-13 stands and a fold does not close its own gate; count (ii) is **KCB's** work and is
> unmoved. **DEFER-C is unmoved.** *(Walked by hand 2026-09-12, same day: **MA-12 does not
> reproduce**, Step 8 holds a third time, Step 9 does not flip on MA-13, and Step 10 does not flip on
> two **KCB-side** findings — **MA-17** (High, carrier: §4.5(a) names the outcomes and no field to read
> them from) and **MA-18** (Med). Count (i) takes a **fifth** shape — fold MA-13 here, MA-17 + MA-18 in
> KCB §4.5(a), then re-run — and no version or clause moves for the walk.)*

> **Status note (0.3.8):** **MA-13 is folded**, and it is the half of count (i) that genuinely is this
> spec's own work. §7.1(d) now names the **serving** participant's evaluated pair as the one that
> travels with a replicated copy — never the pair carried by the envelope the *requesting* participant
> already holds — and §7.1(e) states that where a holder has **more than one** conformant
> `license`/`egress` pair for one `asset` id the **most restrictive governs**, per axis, with a holder
> forbidden to prefer its own; (e) bullet 2's MUST is scoped to the pairs a holder **holds or has
> received**, leaving the fail-closed default for **absence** exactly as it was at 0.3.5.
> [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive
> discipline **reused**, as [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)
> reuses it for a federated merge and as [`fine-tuning.md`](fine-tuning.md) §4.2 already takes the most
> restrictive `egress` across a job's inputs. **Patch and additive: no field, enum or envelope is
> minted, no `asset` id moves, no clause of §2–§6 moves, no KGP clause or enforcement point moves, and
> no schema twin is touched**; a holder that only ever sees one pair behaves exactly as at 0.3.7, and
> **0.4.0 stays spent** on §4.4's EDL removal. **DEFER-C is unmoved.** **Count (i) does not close** — a
> fold does not close its own gate, so it becomes a re-run of Steps 8–10 of
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) against text carrying
> **both** this fold and MA-12's — and count (ii) is **KCB's** work and unmoved, so **KMI stays
> Candidate** whatever that re-run returns.

> **Status note (0.3.3):** folds the §9.5 additive-metadata-survival pressure break. A third-party
> OTIO round-trip may remain structurally valid while dropping `metadata.koine.asset`; KMI now
> requires fail-closed id re-attachment on re-import (§4.2a), so the status remains **Candidate**.

> **Status note (0.3.2):** narrows what KMI *claims* about lineage and makes the narrowing
> operational. §3's relation set is unchanged; what changes is that §3 is now explicitly a
> **bridge** between two occupied vocabularies rather than a third one — §3.1 engages **C2PA**'s
> signed derivation chain and **MovieLabs OMC v2.8**'s richer derivation vocabulary, §3.2/§3.3
> specify the projections onto each with their lossy edges named, and §3.4 fixes the shared
> conformance obligation ([ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md)).
> §4.1 gains the OTIO **upstream pin** (v0.18.1, pre-1.0) whose risks
> [ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md) now records.
> **Patch rather than minor**, for two independent reasons: nothing that conformed at 0.3.1 stops
> conforming — emitting a projection is OPTIONAL and no existing clause, relation, envelope, or
> timeline shape changes meaning — and §4.4 has already declared **0.4.0** as the removal version
> for `application/vnd.koine.edl+json`, whose removal is gated on the outstanding pressure-test
> re-run, so publishing this content as 0.4.0 would either break that declaration or force a
> removal its gate has not cleared. No delta is reopened and the re-ratification path above is
> unchanged.

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
knowledge (§4.2). Division of labor with the standards that already model **derivation** — C2PA
and MovieLabs OMC: they own the vocabulary, KMI is a **bridge** onto them and claims only the
ground neither occupies — the analysis→knowledge bridge (§5) and world-scoping (§3.1).

---

## 1. Scope

KMI defines:
- the **asset envelope** — technical metadata over the KINP `asset` id (§2),
- the **asset-lineage graph** — `derived_from` / `variant_of` / `excerpt_of` /
  `perceptual_match` (§3) — what that graph does and does **not** claim relative to the
  standards that already model derivation (§3.1), and its specified **projections** onto C2PA
  (§3.2) and MovieLabs OMC (§3.3) with their conformance obligation (§3.4),
- the **timeline / composition** model — the adopted OTIO model, koine's additive layer over it,
  and NLE interchange through OTIO's adapters (§4),
- the **analysis → knowledge bridge** into KGP (§5),
- **transform typing** — the media-plane port profile; cross-plane typing lives in KCB §2.1 (§6),
- **byte transport** via a content-addressed store, and how stores **federate** (§7, §7.1),
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
  "produced_by":  "analyzer:activity:1a2b",
  "probe": {                                   // technical metadata (ffprobe-shaped)
    "duration_ms": 42000,
    "streams": [
      { "kind": "video", "codec": "h264", "width": 1920, "height": 1080,
        "fps": "24000/1001", "color_space": "bt709" },
      { "kind": "audio", "codec": "aac", "sample_rate": 48000, "channels": 2 }
    ]
  },
  "license":    "CC-BY-4.0",                   // OPTIONAL — the policy governing THESE BYTES (§7.1d/e)
  "egress":     "exportable",                  // OPTIONAL — "exportable" | "local-only"; travels with a copy
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
- **`license` and `egress` (optional; MA-5).** The policy that governs **these bytes**, so that the
  gate at an authority boundary has an operand to decide with (§7.1(e)). Both are **excluded from
  the id** like every other field here: attaching a policy does not mint a new asset, and changing
  one never moves an `asset` id. The values are KGP's, **reused and not redefined** — `license` is a
  licence class / SPDX identifier per KGP §7.1 and
  [`../policy/license-classes.json`](../policy/license-classes.json); `egress` is a KGP §7.2 egress
  class, `exportable` or `local-only`.
  - **Where they are enforced is KMI's to state, and it is not where KGP enforces its own.** KGP
    §7.2 filters `local-only` **records** out at pack construction. These fields govern **bytes**,
    and they are evaluated by the participant that *serves* them, in its own authority domain, at
    the moment of a `fetch` — §7.1(e). No KGP clause changes and no KGP enforcement point moves.
  - **Both are optional, and absent is not `exportable`.** An envelope carrying neither is
    conformant and is exactly a 0.3.4 envelope; what absence means at a domain boundary is fixed by
    §7.1(e), which fails closed on it.
  - They are envelope fields, so they are asserted by whoever asserted the envelope and are read off
    its `prov` — never off the store that served the bytes (§7.1(d)). KMI requires no signing or
    hard binding on the pair; a deployment that wants one uses the signing shape KCB §5 already
    defines.

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

### 3.1 Prior art — C2PA and MovieLabs OMC, and what KMI claims (INFORMATIVE)

Derivation is **not** unoccupied ground, and this spec previously read as though it were. Two
bodies of work already model how one asset comes from another, and the table above must be read
against them rather than beside them.

**C2PA** ships a **cryptographically signed derivation chain**. A C2PA manifest records each input
to an asset as a **`c2pa.ingredient`** assertion whose `relationship` field is one of
**`parentOf`** (the asset this one was opened from and edited into), **`componentOf`** (an input
placed *into* a composite), or **`inputTo`** (an input consumed by a process — the relationship an
AI/ML generator's training or prompt inputs take). Each ingredient carries a **hash-based "hard
binding"** to the bytes it names, and the manifest as a whole is signed by a credentialed actor, so
the chain is not merely recorded but **attestable**: a consumer can verify that the named input is
the bytes it claims to be and that a specific signer asserted the link.

That chain is also **deployed**. C2PA runs a **conformance program** with certified products, and
**as observed 2026-08-13 it lists 159 certified products** — including **Google** (roughly 35
entries), **OpenAI**, **Amazon Bedrock**, **Getty Images**, **Qualcomm** (in silicon), and **Sony**.
The figure is recorded with its observation date deliberately: it will be stale, and a stale figure
that is visibly dated is evidence, where an undated one is a claim. What will **not** go stale is
the shape of the finding — capture silicon, model providers, and stock libraries are already
emitting signed derivation chains.

**MovieLabs OMC v2.8** ships a derivation vocabulary that is **richer than C2PA's and richer than
§3's**. Where §3 offers four relations and C2PA three relationships, OMC distinguishes
**Revision**, **Variant**, **Derivation**, **Representation**, and **Alternative** — separating, for
instance, a new *version* of a work from a differently-encoded *rendition* of it from a
functionally-substitutable *alternative*, distinctions §3 collapses into `media:variant_of`.

**The consequence for KMI's claim.** Both differentiators this spec originally advertised over OTIO
— content-addressed asset identity (§2) and the asset-lineage graph (§3) — are therefore **already
modelled elsewhere**: identity by C2PA's hard bindings, lineage by C2PA's ingredient relationships
and, in more detail, by OMC's vocabulary. Publishing a third derivation vocabulary against a signed,
certified, widely deployed one **and** against a richer domain one would be a losing move on its
own terms, and this spec does not make it. **§3 is a bridge, not a claim to that ground:** its
relations exist because a fabric-internal asset graph has to be expressible in the KGP envelope
(confidence, provenance, world) that the rest of koine already speaks, and they are **projected**
onto C2PA (§3.2) and OMC (§3.3) — canonical form retained, mapping specified, lossy edges named,
conformance tested as a round-trip (§3.4) — which is the same discipline
[ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) applies to KGP against
RDF-star / PROV / JSON-LD, and is recorded for KMI in
[ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md).

**Being the bridge is the deliberate position, not a retreat from a larger one.** Neither C2PA nor
OMC nor OTIO is a competitor to be beaten here; each occupies a layer KMI needs and would otherwise
have to reinvent worse. What a bridge is *for* is the thing none of them does: carry derivation
across a boundary between two of them, and into a plane none of them reaches. A producer whose
problem is **attestable provenance for published media** should emit C2PA, and KMI's projection is
how it does so without leaving the fabric; a producer whose problem is **production-domain
modelling** should speak OMC, likewise. KMI earns its place by connecting those to knowledge, not by
replacing either.

**What KMI does claim, and why it is unoccupied.** Two things, both narrower and more defensible
than the claim they replace:

1. **The analysis → knowledge bridge (§5).** Nothing in OTIO, C2PA, OMC, or **IPTC** connects
   media-analysis output to a **knowledge graph**. Those standards describe the asset — its
   derivation, its rights, its structure, its captions — and stop at its edge. §5 takes what an
   analyzer *observed in the media* and emits it as **KGP assertions** with confidence and
   provenance over registry relations, so that an observation about footage becomes a queryable,
   mergeable fact about the **entities** the footage depicts. That is a different object than a
   description of the file, and no standard on this page produces it.
2. **World-scoping (§2, §5).** `source_world`, conditional on ingest and **per-asset**, scopes
   every claim extracted from an asset into the world it depicts, and is what engages the KINP §4.3
   firewall so that analyzing fictional footage never contaminates real-world knowledge. Derivation
   standards have no notion of an asset depicting a world distinct from consensus reality, because
   they answer "where did these bytes come from," not "which reality is what they show a fact
   about." Per-asset attribution across composites (delta H, §5) is the sharp end of this and has
   no counterpart in any of them.

**The test to re-apply.** If C2PA or OMC (or IPTC, or OTIO) later specifies a binding from
media-analysis output to a knowledge graph with per-assertion confidence and provenance, **or** a
scoping construct that separates depicted-world facts from consensus-reality facts, then the claim
above is occupied and KMI should adopt rather than bridge — the same re-open test KGP §3.4 states
for its own canonical.

---

### 3.2 Projection — KMI lineage → C2PA ingredient relationships

Per [ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md), the mapping from §3's
relation set onto C2PA is **specified here rather than left to implementers**, so that the bridge
§3.1 claims is testable instead of asserted. C2PA is **not** canonical for KMI lineage and is never
authoritative on ingest; §3's relations remain the fabric-internal form, because they are what the
KGP envelope (confidence, provenance, world) can carry.

**Pinned revision.** This projection is written against the **C2PA Specification 2.1** ingredient
assertion (`c2pa.ingredient.v3`) and its `relationship` value space, as recorded in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md). Per that file's rule 2 a pin is a
claim about what koine was validated against, not a claim the upstream is frozen; moving it is a
spec change under the drift check.

**Anchoring.** C2PA's derivation record is **per-asset and manifest-anchored**: the manifest
describes the asset it travels with, and its ingredients are that asset's inputs. A KMI edge
`subject R object` therefore projects into the **subject's** manifest as an ingredient naming the
**object**. This is a structural narrowing before any relation is mapped — §3's graph is global and
traversable in both directions, a manifest is a local inbound view — and it is the first entry in
the *does not survive* list below.

| KMI relation (§3) | C2PA `relationship` | Notes |
|---|---|---|
| `media:derived_from` | **`parentOf`** when the subject has exactly one such inbound edge; **`componentOf`** for every additional one | C2PA admits at most one `parentOf` per manifest. Where a composite has several derivation parents, the producer MUST **designate** which is the parent; absent a designation all of them project as `componentOf`. The projection MUST NOT pick one arbitrarily. |
| `media:variant_of` | **`parentOf`** (or `componentOf` under the same one-parent rule) | C2PA has no rendition relationship. `derived_from` and `variant_of` therefore land on the **same** value and are indistinguishable in the projection alone (see below). |
| `media:excerpt_of` | **`parentOf`** (or `componentOf` under the same one-parent rule) | The cut range on the excerpt asset's envelope (§2 `excerpt`) has **no ingredient field**; it does not survive. |
| `media:perceptual_match` | **not projected** | Every C2PA relationship asserts a *directed derivation or consumption* that was observed. `perceptual_match` is a **symmetric, probabilistic similarity signal and never identity** (§3, KINP delta E); emitting it as an ingredient would assert a derivation nobody observed, inside a signed document. Reported, never projected. |
| a KMI relation whose `confidence` < 1.0 | **not projected** | A C2PA manifest is signed: everything in it is attested, and the format carries no per-ingredient confidence. Projecting an uncertain edge would launder a probabilistic assertion into an attestation. Reported. |

**Carrying what C2PA does not model.** So that the round-trip below can close, a producer emitting
this projection MUST carry the KMI-side facts C2PA has no field for in a **koine-namespaced custom
assertion** on the same manifest — at minimum the projected edge's §3 relation name, the subject
and object **KINP asset ids**, and the edge's `world`. A consumer that does not understand the
assertion still reads a valid C2PA manifest; a consumer that does recovers the KMI edge exactly.

**What does NOT survive the projection.** Stated positively, because §3.1's claim depends on this
being honest rather than on the mapping looking total:

- **The graph's global shape.** Only the subject's inbound edges appear in its manifest. Outbound
  edges (what was derived *from* this asset) are not recoverable from that manifest alone.
- **The `derived_from` / `variant_of` distinction**, which collapses onto one C2PA value.
- **The excerpt range** (§2 `excerpt`) — C2PA has no sub-range operand on an ingredient.
- **`perceptual_match` entirely**, and with it every probabilistic lineage edge.
- **Per-edge confidence** — there is no field for it, by design.
- **`source_world`** and the §5 analysis→knowledge assertions, which C2PA does not model at all
  (§3.1 — this is the ground KMI claims, not ground C2PA declines).
- **KMI `prov`.** A KMI edge's `prov` names the **agent that asserted the edge**, with no credential
  claim attached. C2PA's signer is a **credentialed actor attesting the whole manifest**. The two
  MUST NOT be conflated: projecting `prov` onto the signer would upgrade an unsigned assertion into
  an attestation. Whoever signs the manifest signs it on their own authority.
- **The identity hash is not the hard binding.** A KINP `asset` id is the algorithm-prefixed hash of
  the whole byte stream (§2, KINP §2/§6). A C2PA hard binding is computed with **exclusion ranges**
  for the embedded manifest store, so for any asset carrying an embedded manifest the two values are
  **not equal** and neither substitutes for the other. A producer MUST NOT publish a KINP asset id
  as a hard binding, or read one back as an asset id; the asset id travels in the custom assertion
  above.

---

### 3.3 Projection — KMI lineage → MovieLabs OMC derivation

The same discipline, onto the other target. **MovieLabs OMC v2.8** (pinned in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md)) distinguishes **Revision**,
**Variant**, **Derivation**, **Representation**, and **Alternative** — a vocabulary richer than §3's
(§3.1). Here the loss runs in the **opposite direction from §3.2**: C2PA is coarser than §3 and
collapses it; OMC is finer than §3 and §3 cannot fill it.

| KMI relation (§3) | OMC v2.8 relation | Notes |
|---|---|---|
| `media:derived_from` | **Derivation** | The general "this came from that" relation; the mapping is direct. |
| `media:variant_of` | **Representation** (default) | §3's definition — *a rendition of A at a different resolution / format / bitrate* — is literally OMC's Representation. A producer with the domain knowledge to tell a **Variant** (an intentionally different version) or an **Alternative** (a functionally substitutable one) MAY project to those instead; it MUST NOT guess, and absent that knowledge the default stands. |
| `media:excerpt_of` | **Derivation** | OMC's derivation vocabulary carries no sub-range operand, so the §2 `excerpt` range does not travel on the relation. A producer whose OMC profile models the portion elsewhere MAY place it there; otherwise the range is reported as unprojected. |
| `media:perceptual_match` | **not projected** | All five OMC relations are asserted production relationships; none is probabilistic. Same rule, same reason, as §3.2. |
| **Revision** | **no KMI source** | §3 does not model versioning of a *work* — that a new asset is the next revision of the same thing rather than a derivative of it. An OMC **Revision** read into KMI degrades to `media:derived_from`, losing exactly the distinction OMC exists to draw. This is the sharpest single argument for bridging rather than restating (ADR-0010). |

**What does NOT survive the projection.**

- **Round-tripping OMC → KMI → OMC is lossy on the fine axis:** Representation, Variant, and
  Alternative all read back as `media:variant_of`, and Revision reads back as `media:derived_from`.
  A producer that received an OMC-side distinction and needs it preserved MUST carry it beside the
  KMI edge; §3 will not hold it.
- **The excerpt range**, as above.
- **`perceptual_match` and per-edge confidence** — OMC, like C2PA, has no place for a probabilistic
  derivation edge.
- **`source_world` and the §5 bridge.** OMC comes closest of any standard on this page: it models
  **narrative objects** (Character, Narrative Scene, and their kin) as first-class production data,
  which is the nearest counterpart to world-scoping in the prior art and is named here rather than
  elided. It is still a different object. OMC's narrative entities describe *what a production is
  about*; `source_world` is a **per-asset scope on extracted assertions** that engages the KINP §4.3
  firewall, and OMC binds no analysis output to those entities with per-assertion confidence and
  provenance. §3.1's re-open test is stated against exactly that gap, and OMC is the standard most
  likely to close it.

---

### 3.4 Conformance of the §3.2 / §3.3 projections

Both projections carry the same obligations, and they are **weaker than KGP's on purpose**:

- **Neither projection is lossless**, and neither claims to be — unlike KGP §4.1's, which round-trips
  losslessly over its binary core. Both targets are asymmetric to §3 (one coarser, one finer), so
  the obligation is **complete or reported**: every edge a producer declines to project MUST appear
  in the projection's report, never be silently dropped.
- **Over the subset it does project, a projection MUST round-trip**: reading the emitted document
  back MUST recover the same §3 edges — same relation, same subject and object asset ids, same
  world — for every edge it projected. That round-trip, not a document shape, **is** the conformance
  criterion, which is why no schema in [`../schemas/`](../schemas/) gains a projection document
  shape (ADR-0006's rule, applied here).
- **Emitting a projection is OPTIONAL** for a conformant producer. A producer that emits one MUST
  emit it per this mapping — a private mapping is the interop failure these sections exist to close.
- **Ingest is unaffected.** Neither target is authoritative on ingest; a C2PA manifest or an OMC
  record arriving from outside is *evidence* that mints §3 edges under the producer's normal
  provenance and confidence rules, not a substitute for them.
- **A relation added to §3 later MUST land in both tables above, or be explicitly declared
  unprojected**, with the reason. A relation that is simply absent from them is a defect.

**The follow-up.** The machine-checked round-trip fixture for these two projections — take a KMI
asset-lineage graph, emit each projection, read it back, and show the recovered edges and the report
together account for every input edge — is a **downstream validator artifact** per
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md): conformance fixtures and validators
live with the implementing runtime, not in koine. It is **named here as a follow-up and not built
here**, tracked cross-repo alongside KGP's equivalent projection fixture (see `../tasks/chief/`).
Because emitting a projection is optional, this fixture gates the **projections'** conformance and
**not** KMI's own re-ratification: that path is unchanged and remains the outstanding re-run of
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) (see **Pressure test**).
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

**Upstream pin (INFORMATIVE).** This section is written against **OpenTimelineIO v0.18.1**,
recorded in [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) and reviewed on that
file's cadence. Two facts about that pin are stated rather than left implicit, as observed
**2026-08-13**: OTIO is **not 1.0** (v0.18.1 is tagged a prerelease; the "1.0 Release" milestone was
due 2026-04-10 and is ~4 months overdue, with about a third of its issues open), and its
`target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break
against each other** (OTIO issue **#1985**). Neither reverses the adoption — see the 2026-08-13
amendment log in [ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md) — and the second is
the concrete, cited case for §4.2's **asset-id envelope** and §4.3's **media map**: a KINP asset id
is an identity where `target_url` is only a location. Which OTIO **core schema versions** a
conformant timeline may declare remains open (§9.1); this note pins the revision KMI was written
against, not a conformance range.

### 4.2 koine's additive layer over OTIO

OTIO addresses media by **location** (`ExternalReference.target_url`) and has no identity model,
no lineage model, and no assertion semantics. KMI supplies exactly those three — and only the
first of them travels *inside* the timeline. Supplying them is not the same as **claiming** them:
identity and lineage are supplied here because a timeline needs them and OTIO does not carry them,
but both are already modelled — and, for lineage, modelled better — by C2PA and by MovieLabs OMC,
so KMI projects onto those rather than competing with them and claims only the third, assertion
semantics (§3.1).

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
- **Re-import after metadata loss is fail-closed.** If a third-party OTIO round-trip removes
  `metadata.koine.asset`, a producer MUST treat the clip as having lost its KMI identity. It MAY
  re-attach an id only when it can identify a previously published asset and verify that the
  recovered bytes hash to that asset's KINP id (for example, by resolving an entry in the media
  map and checking the bytes). Before accepting the timeline as canonical KMI, the producer MUST
  restore the verified id in `metadata.koine.asset`.
- A `target_url`, media-map path, filename, clip name, ordering, source range, or perceptual
  similarity alone is not proof of identity. If exact byte verification is unavailable or fails,
  the producer MUST reject or quarantine the clip and report the unresolved asset; it MUST NOT
  guess or attach the old id to replacement bytes. Re-encoding replacement bytes mints a new asset
  id (§2), even when the result is perceptually similar.
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
- **The type is removed at KMI 0.4.0.** From that version a producer MUST NOT emit
  `application/vnd.koine.edl+json` and a consumer is no longer obliged to accept it. Removal ends
  the *obligation* to emit or accept — never the ability to read archived assets, which stay valid,
  fetchable, and resolvable at their original content-addressed ids.
- That window is declared under the fabric-wide deprecation policy, stated once for every retiring
  surface in [`capability-bus.md`](capability-bus.md) §7.3
  ([ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)): a deprecation names its
  own end (§7.3a); the end is a **version of this spec**, not a calendar date, because a version is
  a deadline a consumer can read off the contract while a date is a deployment fact (§7.3b); it is
  at least one full minor after the 0.3.0 that declared the deprecation, so declaring and removing
  are never the same publication (§7.3c); both forms stay served and functional for the whole window
  (§7.3d); and **0.4.0 may move later, never earlier** — pulling it in would break every consumer
  that planned against it (§7.3e).

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
    @ world(alderforest) :- confidence(0.88), src('analyzer:activity:1a2b').
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

One shared store per authority domain is the default and stays conformant unchanged; where a
deployment runs more than one, the stores **replicate on reference** (§7.1).

### 7.1 CAS federation — per-project stores that replicate on reference (0.3.4)

How byte transport works when more than one store exists. This was KMI's open question 3 through
0.3.3 — *a single shared store vs. per-project stores that replicate on reference* — deferred
there because two sibling specs deferred the same question at their own surfaces. It is decided
once, for all three, by
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md): **an authority is a role, not a
hard dependency.** KINP applies that decision to the identity-authority role (§11 decision 1
there) and KCB to discovery (KCB §3.1); this section applies it to the bytes.

This section is **additive**. A deployment that runs exactly one shared store (§7) is conformant
unchanged: no lineage relation is added or narrowed (§3), the `fetch` verb and its grant are
untouched (KCB §4/§5), and nothing below is required of a participant whose deployment has one
store. At 0.3.5 the fold of **MA-5** adds two **optional** fields to the §2 envelope — `license` and
`egress`, excluded from the id — which (d) and (e) below read; an envelope that carries neither is
conformant, and a single-store deployment behaves exactly as at 0.3.4.

**a. Federation composes stores; it never touches asset identity.** The `asset` id *is* the hash
of the bytes (§2, KINP §2/§6), so the same bytes carry the **same id in every store** — identity
is a property of the content, not of the holder. A store MUST NOT mint, rewrite, scope, or
namespace an id for a copy it holds, and MUST NOT treat "which store served it" as part of the
identifier. A store is authoritative for **what it holds**, never for what an id *means*: two
stores serving the same id are serving the same asset by construction, and that is the property
the whole of this section relies on.

**b. Replication is triggered by a reference, and retrieval stays a direct dial
([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).** When a participant references an
asset its project store does not hold, that store MAY obtain the bytes from a peer store that does
and, after the verification in (c), MAY retain the copy — that is the whole of "replicate on
reference". *Which* store to ask is a control-plane **lookup**: a store advertises `fetch:asset`
like any other capability (KCB §2/§4) and is found through the registry, including across peers
(KCB §3.1), after which the consumer or store dials the holder **directly**. No store is a
mandatory gateway, and none is required to be reachable for another to serve what it already
holds. Bulk or scheduled pre-replication is a deployment choice this contract neither requires
nor forbids; it changes no clause here.

**c. Verification on receipt is mandatory and is what makes replication safe.** A participant that
receives bytes from a peer store MUST verify them against the KINP `asset` id before serving,
retaining, or accepting them as that asset, and MUST **reject** on mismatch. It MUST NOT re-mint
an id for bytes that failed verification and MUST NOT serve unverified bytes under the requested
id. Because the id is the hash, a verified copy is indistinguishable from the original: replication
adds availability, never a new asset.

**d. Provenance and lineage do not replicate implicitly.** Bytes are self-verifying; the envelope
(§2), the lineage graph (§3), and analysis-derived knowledge (§5) are not — they travel as KMI and
KGP payloads carrying their own `prov` (KINP §4). A store that replicates bytes MUST NOT
synthesize an envelope, a lineage edge, or a `prov` record for them, and holding a copy is **not**
a `derived_from` / `variant_of` / `excerpt_of` edge (§3) — a copy is the same asset, and none of
§3's relations describes replication. Which participant asserted an envelope is read off that
envelope's `prov`, never off the store the bytes came from; the §3.2/§3.3 projections are likewise
unaffected, since a C2PA hard binding and an OMC derivation both bind to content, not to a holder.

**The one exception, and it is narrow: the governing policy travels with the bytes (MA-5, MA-13).**
The `license` / `egress` pair on the §2 envelope is the **single** thing this clause permits to
accompany a replication besides the bytes themselves, and it travels precisely because it is
**not** synthesized: it is the asset's own governing policy, read off an envelope a participant
asserted, not a fact the receiving store invents about bytes it just received.

**Which** copy of it travels is fixed here rather than left to the topology, and that is the
**MA-13** correction. The pair is an ordinary §2 envelope field — **per-asserter**, unsigned, read
off its own `prov` — while the `asset` id binds **bytes**, so two participants holding the same id
may each assert a conformant envelope with a **different** pair. What travels with a replicated copy
is therefore the **serving** participant's pair **as it evaluated it under (e)**, never — as this
clause said through 0.3.7 — the pair carried by the envelope the *requesting* participant already
holds. The reason is measured, not a preference between two equally good sources: the serving
participant is the party that MUST evaluate the pair before it serves at all (e), so the value
already exists at the instant of the serve and carrying it forward invents nothing; whereas the
requester may hold **no** envelope whatever — it is asking for bytes it does not have — and where it
holds one it may hold the permissive copy of a divergent pair, which is precisely how a copy
governed by `local-only` somewhere else was replicated under an `exportable` reading with **no
misbehaviour at any hop**.

Everything else here stands unchanged, and the narrowness of the exception is unchanged with it — no
envelope is fabricated, no lineage edge is written, no `prov` record is minted, **no field is added
to §2** and **no `asset` id moves** (the pair is outside the id by §2's own rule, and (a)'s byte
hash is untouched). The pair is still **not** authorship or provenance: who asserted an envelope is
read off that envelope's `prov`, never off the store the bytes came from, and a serving participant
that passes on the pair it evaluated is **passing on an assertion, not making one** — which is why
this remains a carry and not a synthesis, and why (d)'s prohibition on synthesizing an envelope for
replicated bytes is undisturbed. A store that receives bytes and no policy has received bytes and no
policy; (e) says what it may then do with them.

**e. The authority boundary is observable, and egress is evaluated at it.** A participant that
serves an asset is a participant (§8) and MUST be identifiable by its **KINP id**, so a consumer
can tell whose copy it holds and attribute availability and cost to that holder. Replication on
reference is a `fetch`, so it is gated exactly as a `fetch` is: the serving participant MUST
evaluate the request against its own authority domain's license, egress, and trust-tier policy
(KGP §7, [`../policy/license-classes.json`](../policy/license-classes.json)) and MUST **fail
closed** where a
`fetch:asset` grant (KCB §5) does not authorize it. An asset whose governing policy forbids egress
from an authority domain MUST NOT be replicated across that boundary, and a peer's willingness to
serve a copy MUST NOT be read as having pre-cleared that decision for anyone else.

**The gate has an operand, and a copy whose policy did not travel is not served onward (MA-5).**
Before 0.3.5 the rule above was right about *where* the decision is made and had nothing to decide
with at a second holder: the §2 envelope carried no `license` and no `egress`, KGP §7's classes are
properties of **records** filtered at pack construction rather than properties of bytes, and (d)
rightly forbids synthesizing the envelope that would carry them. A second holder could therefore
only refuse everything — replication inoperative — or serve under **its own** domain's policy,
after which one legitimate fetch plus (b)'s *MAY retain* ends the originating domain's control
permanently. With §2's pair the gate is decidable at every holder:

- A participant that serves a copy MUST evaluate the asset's **own** `license` and `egress` — the
  values that travelled with it under (d) — **in addition to**, never instead of, its own authority
  domain's policy. Both must permit the serve; either alone may refuse it.
- Where an `egress` of `local-only` governs an asset, it MUST NOT be replicated across an
  authority-domain boundary and no holder may serve it across one, irrespective of that holder's own
  policy. This MUST binds a holder over the pairs it **holds or has received** — which of them
  governs, where there is more than one, is fixed immediately below (**MA-13**). It is an obligation
  to act on what a holder knows, never a duty to discover what it does not: no verb returns another
  participant's envelope for an id, and (d) forbids synthesizing one.
- A holder that holds bytes **without** the governing policy — a copy taken before this clause, or
  one whose envelope it never received — MUST NOT serve them onward across an authority-domain
  boundary. It MAY still serve them inside its own domain, and it MUST NOT synthesize the missing
  pair in order to pass this gate; (d) forbids that, and passing a gate is not a reason to invent an
  assertion. **Fail closed.**

This adds no new decision point and moves none: the serving participant decides, in its own domain,
as it already did.

**Two conformant pairs may disagree, and the most restrictive governs (MA-13).** The rule above
speaks of *"an asset's `egress`"* as though an asset had exactly one, and §2 does not make it one.
The pair is an ordinary envelope field — **per-asserter**, unsigned, read off its own `prov` — while
the `asset` id binds **bytes**, so two participants holding the same bytes hold the same id ((a),
working as designed) and may each assert a **conformant** envelope carrying a different pair.
Through 0.3.7 nothing ranked them, so a holder that had only the permissive one satisfied bullet 1,
breached bullet 2 and could not discover the pair that would have stopped it — MA-5's
laundering hole returning through **divergence** rather than absence, with **no misbehaviour at any
hop**. This is what §2's attribution answer does not reach: attribution says *whose* assertion a pair
is, and the question here is which honest assertion **governs**.

- Where a holder has **more than one** conformant `license` / `egress` pair for one `asset` id —
  its own envelope's and one that travelled under (d), or two that travelled by different routes —
  the **most restrictive** of them governs the serve. It is taken **per axis**: the narrowest
  `license` class admitted by any of them (KGP §7.1,
  [`../policy/license-classes.json`](../policy/license-classes.json)), and `local-only` over
  `exportable` on `egress` (KGP §7.2).
- A holder **MUST NOT** prefer its own pair, and MUST NOT prefer the pair that permits the serve.
  A holder that serves under the permissive pair of a divergent set breaches this clause even where
  every other clause it can evaluate is satisfied.

This is [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s
**monotone-restrictive** discipline — the restriction always wins, with no arbitration and no trusted
third party — **reused rather than a second convention invented**: it is the rule
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) applies when a federated
merge meets two readings of a gate, and the rule [`fine-tuning.md`](fine-tuning.md) §4.2 already
applies when it takes the *most restrictive* `egress` across all of a job's inputs. The asymmetry is
measured, not stylistic: a restriction taken in error costs a **refused serve**, which is recoverable
— the requester asks in the domain that holds the restrictive envelope, or the two asserters reconcile
out of band — while a restriction missed is bytes across an authority boundary, which no later
correction undoes.

**What this ranks, and what it deliberately leaves alone.** It ranks the pairs a holder **holds or
has received**, and nothing more: it obliges no holder to go looking for another pair, makes none
discoverable (no verb returns another participant's envelope for an id, and (d) forbids synthesizing
one), and is **not a reconciliation** — both assertions remain conformant and attributable to their
own `prov`, and what is decided is which governs **this serve**, not which is true. The fail-closed
default for **absence** is unchanged and is bullet 3's, not this rule's: a holder with bytes and **no**
governing policy MUST NOT serve them onward across an authority-domain boundary, MAY still serve them
inside its own domain, and MUST NOT synthesize the missing pair to pass the gate. No field is minted,
**no `asset` id moves**, and **no KGP clause or enforcement point moves** — KGP §7.2 still filters
`local-only` **records** out at pack construction, while these fields govern **bytes** and are
evaluated by the serving participant at `fetch` time (§2). **DEFER-C is unmoved.**

**f. An unreachable store delays retrieval; it invalidates nothing.** Per ADR-0012, an authority
role is not a hard dependency. A store that cannot be reached MAY delay or deny byte retrieval —
which §7 already tolerates, since a reference can legitimately arrive before its bytes propagate
(KCB delta L) — but MUST NOT invalidate the `asset` id, its envelope (§2), a lineage edge (§3), a
timeline that references it (§4), an analysis claim derived from it (§5), or a grant already
issued (KCB §5). A reference whose bytes are not yet reachable is a **pending fetch**, never a
broken identifier.

**Absence must be answerable, not merely unreached (MA-10).** *Pending* is the right default and it
becomes unfalsifiable when the only two answers are *here* and *silence*: retention is a **MAY**
(b), no clause requires a minimum replica count or a durable holder, and a consumer that polls every
store it can reach cannot tell *not yet propagated* from *no holder remains*. So a store MUST be
able to answer, for an id it is asked for, **not held, and not expected** — it holds no copy and has
no replication of that id in flight or scheduled — **distinctly from** *not reachable* and from
*not held, pending*. A consumer that reaches every store in the set it can see and gets *not held,
and not expected* from all of them MAY conclude for **that set**; it MUST NOT conclude anything
about a store it could not reach, and nothing above changes — the id, the envelope, a lineage edge,
a timeline, and an already-issued grant all stay valid whatever the answer is.

**The answers are carried on the verb that delivers them (MA-12).** What is above is an obligation
on a **store**, and through 0.3.6 it had no wire: KCB §4 typed `fetch` as a CAS GET by `asset` id
with a grant and **no response vocabulary at all**, so two conformant participants could not
interoperate on the very distinction this paragraph requires a store to make — the clause was
asserted and unmechanized. It is fixed where it belongs. **KCB §4.5** is the carrier: a **named**
outcome on the `fetch` response itself. A store that distinguishes *not held, and not expected*
from *not held, pending* MUST express that in §4.5's vocabulary rather than in an
implementation-private status string — the whole point of the distinction is that the **caller**
reads it the same way — and a response carrying no outcome, or no response at all, reads *not held,
pending*.

KMI mints no field, enum, or envelope for any of this, and that is the division of labour rather
than an omission: **§7 defines the payloads, not the pipe.** This clause states what the answers
**mean** — which is why §4.5 cites it rather than restating them — and KCB states what is on the
wire; on disagreement about a **meaning**, this clause governs and §4.5 is the bug. Three
consequences of the split are worth stating here rather than leaving a reader to derive them from
the other plane: the answer is owed **per request** and describes the id it was asked for, never a
registration-time property of a store; *not held, and not expected* MUST NOT be **synthesized** by a
party that did not determine it, so only the store asked may assert it and only about **itself**;
and silence is *not reachable*, which is the **absence** of an answer and never an assertion that no
holder remains. The conclusion rule above is unchanged in either direction — a consumer still
concludes only for the set it reached — and so is everything (f) refuses to invalidate. Additive on
both planes: **no `asset` id moves**, no envelope field is added, no lineage relation or timeline
shape changes, and a deployment with one store behaves exactly as it did at 0.3.6.

That is a **contract**, not an operational mandate: no minimum replica count, no retention
obligation, no durability guarantee — koine specifies what crosses a boundary, not how a store is
operated. The optional *designated durable holder* the break test also proposed is deliberately not
written, and is deferred with its forcing trigger stated in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md)
(DEFER-C).

**Re-ratification.** This section is new normative text and is candidate on the cross-authority
break test in
[`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), which must
break-test the pattern ADR-0012 shares across all three planes — for this section specifically,
*per-project CAS replication on reference that loses content identity, provenance, or availability
semantics.* It is a **second** count on this spec's status and gates §7.1 alone; the outstanding
KCB re-run recorded under **Pressure test** is unaffected.

That test is now written and run:
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md). **Content identity and
provenance held**; availability and policy did not. (a)'s byte-stable id survived every attack tried
— re-minting is forbidden in terms, (c)'s mandatory verify rejected corrupted bytes, and a verified
copy is indistinguishable from the original; (d)'s refusal to make a copy a §3 lineage edge held
even through the §3.2/§3.3 C2PA and OMC projections, which bind to content and so cannot see a
replication; (f) correctly invalidated nothing when a store went dark. Two deltas are open:
**MA-5** (blocking — (e)'s egress/license gate has **no operand**, because the §2 envelope carries
no `license` and no `egress`, KGP §7's classes are record properties rather than byte properties,
and (d) rightly forbids synthesizing the envelope that would carry them; so a second holder either
refuses everything or serves under its own domain's policy) and **MA-10** ((b)'s *MAY retain* plus
no minimum replica count makes (f)'s *pending fetch* unfalsifiable — a consumer cannot distinguish
*not yet propagated* from *no holder remains*).

**Both are folded at 0.3.5** — MA-5 by §2's optional `license` / `egress` pair, (d)'s narrow
travels-with-the-bytes carve-out and (e)'s not-served-onward rule; MA-10 by (f)'s three-valued
answer, where *not held, and not expected* is distinguishable from *not reachable*. The extent of
each, and the one remainder deliberately not folded (**DEFER-C**, a designated durable holder), are
reasoned in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).
**The §7.1 count nevertheless stays open**: a fold does not close its own gate, and this count now
reads as a **re-run of Steps 8–10 against the folded text**. The outstanding KCB re-run count under
**Pressure test** is unaffected and does not move. See that scenario's *Re-ratification — what this
pass gates* section.

**That re-run has now been walked — by hand, on 2026-09-03 — and this count does NOT close.**
Steps 8–10 were read against the folded text of §2 and §7.1 rather than replayed
(`kcs:multi-authority` came back `green` over six blocking deltas, **DR-8**). **Steps 8 and 9 flip**:
Step 8 holds as the regression set — (a)'s byte-stable id, (c)'s verify-and-reject and (d)'s refusal
to make a copy a §3 lineage edge all survive re-attack — and Step 9, the step **MA-5** broke, now
walks, because §2's optional `license`/`egress` give (e)'s gate the operand it lacked, (d)'s narrow
carve-out lets the governing policy travel *carried* rather than synthesized, and (e)'s
not-served-onward rule closes laundering-by-retention **at the retainer**. **Step 10 does not flip**,
and the reason is a new delta, **MA-12** (Med, carrier). (f)'s substance holds — a decommissioned
store still invalidates no id, envelope, lineage edge, timeline or grant — and MA-10's fold is the
right answer, but **the answer it requires has no wire to arrive on**: KCB §4 types `fetch` as *"a CAS
GET by `asset` id"* with no response vocabulary, §7 of this spec defines *"the payloads, not the
pipe"* and mints no field, enum or envelope for any of the three answers, and KCB cites §7.1(f)
nowhere — so the *inherit-by-citation* half of what the dispositions record classes as a **two-spec**
delta was never written. Worse, KCB §4.2f independently calls a **rate-limited refusal** a *pending
fetch*, so a **fourth** state shares the one word (f) uses for its default, on the same verb. Two
conformant implementations therefore cannot interoperate on the distinction, which is the exact
consequence MA-10 was folded to remove — MA-8's class of break (*a clause asserted with no carrier*),
one plane over, where MA-8's fold could not reach. The fold MA-12 asks for is additive and named in
the scenario: give the three answers a carrier on the verb that must deliver them, with **absent
reading *pending*** and never *not expected*, and have KCB §4 cite §7.1(f) as the clause that defines
their meaning. No `asset` id moves, no envelope field is added, and a single-store deployment is
unaffected. **DEFER-C is unmoved** — MA-12 asks only that the answer (f) already requires be
*expressible*, not for a durability mandate, a minimum replica count, a retention obligation or a
designated durable holder. **Nothing else about this spec's status moves.** Count (ii) — the
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) re-run — is **KCB's**
work, untouched by this walk and unmoved, so **KMI is not promotable on this pass and would not have
been on a clean one**: clearing one of two counts is not a promotion. The walk is recorded in that
scenario's *Re-run — Steps 1–10 walked by hand against the folded text (2026-09-03)* section.

**Steps 8–10 were then re-attacked the same day, and Step 9 reverses: new delta MA-13 (High,
structural).** The second pass was run for one reason — KCB's four other counts were walked hours
later and **four of their seven new findings sit on one axis**: *an operand deliberately kept outside
a content digest, carrying a declared normative consequence, with nothing that carries it*
([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named that axis for KCB's
`schema_id`). §2's `license`/`egress` pair is outside the `asset` id by the same design and (d)/(e)
hang a gate on it, so the byte plane had to be read against the axis rather than assumed unaffected.
Step 8 holds — an operand outside a digest is a hazard for **decisions taken over it**, never for the
identity the digest establishes, which is why every finding on this axis is a carrier or perimeter
break and none is a model break. Step 10 re-confirms **MA-12** and narrows its fold's shape. **Step 9
does not flip.** MA-5's fold is not what breaks: the operand exists, travels carried, is evaluated in
addition to the serving domain's policy, and closes laundering-by-retention at a holder with **no**
pair. What breaks is that (e)'s second bullet is a MUST over *"an asset's `egress`"* while §2 makes
the pair an ordinary envelope field — **per-asserter**, unsigned, read off its own `prov` — and the
`asset` id binds **bytes**. Two participants holding the same bytes hold the same id (that is (a),
working) and may each assert a conformant envelope with a **different** pair; (d) then sources the
travelling pair from *"the envelope the requesting participant already holds"*. A holder that has only
the permissive envelope therefore satisfies bullet 1 while breaching bullet 2, **cannot discover** the
restrictive one — no verb returns another envelope for an id, and (d) rightly forbids synthesizing one
— and serves onward across a boundary with every clause it can evaluate satisfied. MA-5's laundering
hole returns through **divergence** rather than absence, with **no misbehaviour at any hop**, which is
what distinguishes it from the downgrade exposure §2 answers by attribution: attribution says who
said what, and the question here is which conformant assertion *governs*. The fold is **KMI-only and
additive** and mints no field — (d) names the **serving** participant's evaluated pair as the one that
travels; (e) states that where a holder has more than one conformant pair the **most restrictive
governs** and a holder MUST NOT prefer its own (ADR-0013's monotone-restrictive discipline, reused as
ADR-0014 reuses it, and as KFT §4.2 already takes the most restrictive `egress` across a job's
inputs); and bullet 2's MUST is scoped to the pairs a holder holds or has received, leaving (e)'s
fail-closed default for **absence** unchanged. **No `asset` id moves, no envelope field is added, no
KGP clause moves, no schema twin is touched, and DEFER-C is unmoved.** Count (i) therefore changed
shape a third time — *fold **MA-12** and **MA-13**, then re-run Steps 8–10 again* — and both folds are
**unowned**. One premise was tested rather than inherited: as a **count**, (i) is still KMI's own and
gates §7.1 alone, but as **work** it is half KCB's, because MA-12's carrier belongs on KCB §4's verb;
MA-13 is the half that genuinely is KMI's. Recorded in that scenario's *Re-run — Steps 8–10
re-attacked after the KCB walks (2026-09-03, second pass)* section, which also records **all three**
conditions on this spec's promotion and that **none** holds: count (i) above; count (ii), the
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) re-run, **walked the same
day and not clean** (**MT-1**) and **KCB's** work either way; and the conformance gate, which fails on
two documents for two reasons — **DR-4** (`kcs:kmi-otio-roundtrip` is `kcs:media-transform` re-titled)
and **DR-8** (`kcs:multi-authority` predates the 0.3.5 fold and asserts none of §2's `license`/`egress`
or §7.1(d)(e)(f), so that encoding must be **extended**, the **DR-7** shape). **KMI stays Candidate
and is not promotable**, and would not have been on a clean pass of count (i).

**MA-12 is folded at 0.3.7, and count (i) changes shape a fourth time.** The carrier the second pass
asked for is written — **KCB §4.5** (KCB 0.5.2), the named `fetch` response vocabulary, and the
paragraph above, which points this clause at it without restating it. The fold is the extent the
break forces and no more, reasoned as **MA-12**'s row in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md):
an answer (f) already required became **sayable**, and nothing else. **DEFER-C is unmoved** and keeps
its stated trigger — no minimum replica count, no retention obligation, no durability guarantee, no
designated durable holder — and no store acquires an obligation to *hold*, only to *say*. Count (i)
therefore now reads *fold **MA-13**, then re-run Steps 8–10 again*: **MA-13 stands**, so this fold
closes nothing on its own, and a fold does not close its own gate in any case. Count (ii) is
restated and does not move — it is **KCB's** work — so **KMI stays Candidate**, and the walk that
does clear Step 10 will still leave it there while MA-13 and count (ii) stand.

**That walk has now been run — by hand, 2026-09-12 — and count (i) does NOT close, for a fifth
shape.** Steps 8–10 were read against **KMI 0.3.7 / KCB 0.5.2**, never replayed (`kcs:multi-authority`
now predates **three** folds — **DR-8**). **MA-12 does not reproduce**: KCB §4.5's outcomes are named
in the table that types the verb, owed per request, never synthesized, absence reads *pending*, §4.2f
is reconciled, and **(f)'s conclusion rule is preserved word for word** — and the premise that rule
rests on is better carried than the first pass could assume, since (b) already routes store discovery
through the registry (KCB §2/§4, §3.1) and §3.1's `incomplete[]` tells a consumer when its own
discovery was incomplete. **Step 8 holds a third time** — the axis question was put to (a) once more
and separates the same way: an operand outside a digest is a hazard for decisions taken over it, never
for the identity the digest establishes. **Step 9 does not flip**: **MA-13 stands**, (d) and (e) are
byte-unchanged here, and the walk confirmed that §4.5 neither widens nor narrows it — a `fetch`
response that disclosed a restrictive pair would be one holder learning another's envelope, which (d)
forbids it to synthesize and no verb returns, so keeping the pair off the wire is the right division
and MA-13's answer remains the most-restrictive-governs rule **inside this spec**. **Step 10 does not
flip either**, on two new deltas that are **KCB's** and not this spec's: **MA-17** (High, carrier) —
§4.5(a) forbids a consumer to *infer* an outcome and then fixes no field for it, on the one verb KCB
types by no protocol, so the implementation-private status string this clause forbids returns as the
**slot** rather than the value, and because absence reads *pending* the failure is silent — and
**MA-18** (Med, mis-route). Both are one additive §4.5(a) edit, both **unowned**, and neither moves a
clause here: this clause states the **meanings**, and what MA-17 asks for is a **slot**. Count (i)
therefore reads *fold **MA-13** (this spec), and **MA-17 + MA-18** (KCB §4.5(a)), then re-run Steps
8–10 again* — the half-KMI reading of this count holding for a second time. Count (ii) is restated and
does not move, the conformance gate is unmoved (**DR-4**, **DR-8**/**DR-7**), **DEFER-C is unmoved**,
and **KMI stays Candidate** — as it would have on a clean walk, since one of its two counts is not
KMI's to discharge. Record: that scenario's *Re-run — Steps 8–10 walked by hand against KCB 0.5.2 /
KMI 0.3.7 (2026-09-12)* section.

**MA-13 is folded at 0.3.8, and count (i) does not close on it.** The fold is the one the second
pass named and no more: (d) names the **serving** participant's evaluated pair as the one that
travels, the divergence rule above states that the **most restrictive** of the pairs a holder holds
or has received governs and that a holder MUST NOT prefer its own, and (e) bullet 2's MUST is scoped
to what a holder can know, with the fail-closed default for **absence** left exactly where 0.3.5 put
it. **KMI-only and additive** — no field, enum or envelope is minted, **no `asset` id moves**, no
clause of §2–§6 moves, no KGP clause or enforcement point moves, no schema twin is touched, and
**DEFER-C is unmoved**; the extent is reasoned as **MA-13**'s row in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md),
beside MA-1…MA-12. **A fold does not close its own gate**, so count (i) now reads *re-run Steps 8–10
against text carrying **both** this fold and MA-12's* — the first walk on which both of the deltas
that reversed Step 9 and held Step 10 are in the text. **MA-17** and **MA-18** remain **KCB's** work
on KCB's verb and no clause here waits on them. Count (ii) is restated and does not move (it is
KCB's, and **not clean** — **MT-1**), the conformance gate is unmoved (**DR-4**, **DR-8**/**DR-7**),
and **KMI stays Candidate** whatever that re-run returns, because one of its two counts is not KMI's
to discharge.

**That re-run has now been walked — by hand, 2026-09-12 — and count (i) does NOT close, for a sixth
shape.** Steps 8–10 were read against **KMI 0.3.8 / KCB 0.5.2**, the first text carrying **both**
folds, and never replayed (`kcs:multi-authority` now predates **four** folds — **DR-8**). **MA-13
does not reproduce.** Each leg was attacked and none yielded: (d) sources the travelling pair from the
**serving** participant, which is the one party that must have evaluated it before serving at all,
where the requester may hold no envelope whatever; the restriction is **monotone along a chain**,
because what travels is the pair *as evaluated under (e)* and it joins the next holder's set to be
ranked again, so laundering-by-divergence is closed by construction rather than by a rule about
retainers; a holder may prefer neither its own pair **nor** the permissive one; bullet 2 is **meetable**
where through 0.3.7 it was a MUST a conformant holder could be in permanent undetectable breach of;
and bullet 3's fail-closed absence default is **byte-unchanged**. The route the fold declines — a
holder that never obtained the bytes through this contract — is the declared residual it states, not a
delta. **Step 8 holds a fourth time**, on the same separation: an operand outside a digest is a hazard
for decisions taken over it, never for the identity the digest establishes — two holders disagreeing
about what governs an asset still agree about **which** asset it is. **Step 10 does not flip and is
unchanged**: §4.5 and (f) are byte-unchanged, **MA-17** and **MA-18** are unfolded and **KCB's**, and
the one cross-check owed is recorded — a serve refused under a foreign or composed pair answers
`refused` like any other gate refusal, so the divergence rule opens no new KCB delta. **Step 9
half-flips**, on the perimeter of this fold's own sentence, and both findings are **this spec's**:
**MA-20** (High, carrier) — (d) permits the pair to accompany a replicated copy and fixes **no shape,
field, envelope or attribution** for it in transit, while §2 defines the pair's *meaning* by its
carrier (*asserted by whoever asserted the envelope, read off its `prov`*), so what arrives is a §2
field **outside a §2 envelope**: two conformant stores put it in different places and neither reads
the other (MA-17's failure on this plane), the receiver cannot attribute what it gets, and the one
thing that would carry attribution — the envelope with its `prov` — is what (d)'s narrowness excludes;
because bullet 3 fails **closed**, an unread pair is heard as **no pair** and the failure is silent.
It reproduces with **two stores, one authority and one pair**. And **MA-19** (Med-High, collision) —
(e)'s **per-axis** most-restrictive reading can produce, on cross-cutting divergence, a pair **no
participant asserted**, which (d) then carries: against (d)'s MUST NOT synthesize and against the
justification that makes the carve-out safe (*not synthesized … read off an envelope a participant
asserted*; *passing on an assertion, not making one*). Fail-safe, so nothing leaks — what it costs is
(e)'s own asymmetry argument, since a composed pair has no holding domain to ask and no asserters to
reconcile, and composed at each hop it **ratchets**. Both are **one additive, KMI-only §7.1(d) edit**,
and the answer is one this repo has already decided:
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) merges **attributions, never
contents** — carry the **set** of attributed pairs, let (e) compose over it to decide **this serve**,
and let the composition be a derived governing value rather than the thing that travels. 0.3.8 reused
that ADR's second half (monotone-restrictive, from ADR-0013) and not its first. Count (i) therefore
reads *fold **MA-19 + MA-20** (this spec, §7.1(d), one edit) and **MA-17 + MA-18** (KCB §4.5(a), one
edit), then re-run Steps 8–10 again*, and all four are **unowned** — so the 0.3.8 note's observation
that this spec had **no koine-side item of its own** outstanding is **withdrawn**: it had one for a
few hours. Count (ii) is restated and does not move (**KCB's**, and not clean — **MT-1**), the
conformance gate is unmoved (**DR-4**, **DR-8**/**DR-7**), **DEFER-C is unmoved**, and **KMI stays
Candidate** — as it would have on a clean walk, since one of its two counts is not KMI's to discharge.
**No version and no clause moved for this walk.** Record: that scenario's *Re-run — Steps 8–10 walked
by hand against KMI 0.3.8 / KCB 0.5.2 (2026-09-12, fifth pass)* section.

---

## 8. Mapping (by role)

| Role | KMI participation | Emits / accepts |
|---|---|---|
| **Media authority** | **Producer + authority** for assets & timelines | Owns the canonical OTIO timelines (§4) + the koine additive layer on them (§4.2) + `asset_probe`; runs NLE interchange through OTIO's adapters with a media map (§4.3); emits analysis → KGP (§5); hosts the run-artifact CAS. |
| **Audio producer** | Producer | Emits `audio/*` assets + instrument renders; consumes timelines to place audio; later a *transform provider* ("render this instrument") via KCB. |
| **World producer** | Producer | Emits video/render assets with `source_world` = the world/playthrough; consumes assets for in-engine use. |
| **Knowledge authority** | Consumer | Consumes analysis-derived KGP (not bytes); may catalog media entities. |
| **Control-plane host** | Consumer + host | Provisions the CAS + transform capabilities as orgs; agents invoke transforms. Where a deployment runs more than one store, each holder is a participant with its own KINP id and the stores replicate on reference (§7.1). |

---

## 9. Open questions

1. **OTIO schema-version pinning** — which OTIO core schema versions a conformant timeline may
   declare, and how strictly §4.1's "apply OTIO's upgrade/downgrade path" binds a consumer that
   meets an unknown version. (The *expressiveness ceiling* this question used to ask about the
   bespoke EDL — nested sequences, keyframed effects, color grades — is closed by adoption:
   they are in the adopted model. ADR-0005.)
2. **Profile vocabulary granularity** — how fine constraints get (e.g. "H.264 High@L4.1")
   before path-finding becomes brittle; likely a coarse core + optional constraints.
3. **CAS operational model** — **resolved in 0.3.4** by §7.1. It mirrored KINP §11 decision 1 and
   KCB's registry-federation question, and all three are decided together by
   [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md): a single shared store stays
   conformant, and per-project stores **replicate on reference** with the `asset` id byte-stable
   across stores. KINP's half is §11 decision 1 there; KCB's is now normative **KCB §3.1**. The
   numbering of the questions here is unchanged, so §9.1/§9.2/§9.4 still name what they always
   did.
4. **Perceptual-hash choice** — which pHash/audio-fingerprint/embedding backs
   `media:perceptual_match`, and recording it (like KGP `embedding_model`) so scores are
   comparable.
5. **Additive-metadata survival** — **closed in 0.3.3** by §4.2a's fail-closed re-import rule:
   a producer detects loss when `metadata.koine.asset` is absent, re-attaches only after exact
   byte verification against a known KINP asset id, and rejects or quarantines an unverified
   clip. The rule does not make `target_url`, a media-map path, or perceptual similarity identity.

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

KMI nonetheless stays at **candidate**: the same scenario also gates **KCB 0.4.0**, whose §2
manifest→AgentCard-extension change its discovery steps exercise and which has not been re-run.
Promotion of both follows that pass. **That re-run has now been walked — by hand, on 2026-09-03,
against KCB 0.5.0 — and it is not clean** (**MT-1**, a break in KCB §3's path planning; see that
scenario's *Re-run — the KCB legs walked by hand against KCB 0.5.0* section). **No KMI clause is read
differently by it** and the OTIO re-validation above is unmoved, so this count stays open on **KCB's**
edit, not on a KMI one.

**Second count (0.3.4).** §7.1 is new normative text that this scenario does not exercise — it has
one store. It is candidate on the cross-authority break test in
[`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), the same
test KINP §11 decision 1 and KCB §3.1 name, which must hunt per-project CAS replication on reference that
loses content identity, provenance, or availability semantics
([ADR-0012](../decisions/ADR-0012-federated-authority-roles.md), *Consequences*). It gates §7.1
alone; the KCB re-run count above is unaffected and no delta is reopened. That test has now been
run — [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), **not clean**:
identity and provenance held, **MA-5** and **MA-10** are open, and the count stays open with them.
Both were folded at 0.3.5 and the count became a **re-run of Steps 8–10**, which was walked twice on
2026-09-03 and **did not close either time** — **MA-12** (Step 10, carrier, two-spec) and **MA-13**
(Step 9, structural, KMI-only). See §7.1's closing paragraphs; the count now waits on those two
additive folds, and **count (ii) below is unaffected and does not move**.

**Downstream evidence (2026-08-24), and the one place it is thinner than it looks.** The KCS
encodings of both scenarios above were run over real MCP/A2A links and both came back `green`
([`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md#downstream-results),
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md#downstream-results)).
Neither closes a count, and one carries a caveat an owner must read before citing it:

- **Positive.** On the media pass, delta **H**'s `source_world_is` and delta **I**'s asset-id ↔ path
  media map were asserted over bound values a step produced, and the §5 analysis→KGP bridge
  (`asset_attaches_to`) held with both operands bound at once. The composer role was a delta-N
  stand-in, so this is the *requesting* side observed against a recorded provider.
- **The caveat — DR-4, and it lands on this spec.**
  [`../scenarios/kmi-otio-roundtrip.md`](../scenarios/kmi-otio-roundtrip.md), the focused leg that
  produced **M-1** and gates §4.2a's re-attachment rule, is encoded downstream as
  `kcs:kmi-otio-roundtrip` — which is `kcs:media-transform` re-titled over the **same fixture**.
  It asserts nothing OTIO-specific and never drops a namespaced-metadata carrier, so **M-1 and the
  0.3.3 fold answering it are unexercised**. The artefact gate is met for that document by
  **count, not by content**. This opens no third count — M-1 is not one of the two above — but no
  owner may cite that encoding as evidence for §4.2a, because the run never attempted it. Closing
  it is downstream work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is
  unowned.
- **Reading rule.** `green` here means every encoded step and assertion passed with no transport
  failure. The multi-authority pass came back green over **six** open blocking deltas, MA-5 among
  them, because an encoding deliberately does not assert an unfolded delta. It is not a verdict on
  §7.1.

## Changelog

- **Editorial** (2026-09-12) — **count (i) re-run against text carrying both folds; it does not
  close, and it takes a sixth shape.** Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) walked **by hand**
  against **KMI 0.3.8 / KCB 0.5.2** — the first text holding **both** the MA-12 carrier fold and the
  MA-13 ranking fold — and never replayed (`kcs:multi-authority` predates **four** folds; **DR-8**).
  **MA-13 does not reproduce**: (d) sources the travelling pair from the party that must have
  evaluated it, the restriction is **monotone along a chain**, a holder may prefer neither its own
  pair nor the permissive one, bullet 2 is meetable, and bullet 3's fail-closed absence default is
  byte-unchanged. **Step 8 holds a fourth time** and **Step 10 is unchanged** (MA-17 / MA-18 unfolded
  and **KCB's**). **Step 9 half-flips** on the perimeter of the fold's own sentence, and both
  findings are **this spec's**: **MA-20** (High, carrier) — (d) permits the pair to travel and fixes
  **no shape, field, envelope or attribution** for it, while §2 defines the pair's meaning by its
  carrier, so what arrives is a §2 field outside a §2 envelope: unreadable between two conformant
  stores, unattributable at the receiver, and **silent** because bullet 3 reads an unread pair as no
  pair; reproduces with **two stores, one authority, one pair** — and **MA-19** (Med-High, collision)
  — (e)'s **per-axis** reading can compose a pair **no participant asserted**, which (d) then carries
  against its own MUST NOT synthesize and its own *passing on an assertion, not making one*
  justification; fail-safe, but it **ratchets** and leaves no asserter to appeal to. **One additive,
  KMI-only §7.1(d) edit** for both, the answer being
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s — a merge merges
  **attributions, never contents** — whose first half 0.3.8 did not reuse. Count (i) now reads *fold
  MA-19 + MA-20 here and MA-17 + MA-18 in KCB §4.5(a), then re-run Steps 8–10 again*; all four are
  **unowned**, so 0.3.8's observation that this spec had **no koine-side item of its own** is
  **withdrawn**. Count (ii) restated and unmoved (**KCB's**, not clean — **MT-1**), the conformance
  gate unmoved (**DR-4**, **DR-8**/**DR-7**), **DEFER-C unmoved**, **KMI stays Candidate**. **No
  version and no clause moves**: §1–§6, §8, §9 and every normative clause of §7 are byte-unchanged;
  the edit is §7.1's gate paragraph, this entry and a scenario section.

- **0.3.8** (2026-09-12) — **MA-13 folded: which of two conformant policy pairs governs a serve
  (patch).** 0.3.5's MA-5 fold gave §7.1(e)'s egress gate the operand it never had, and the
  2026-09-03 re-attack of Steps 8–10 found that the operand was not **singular**: §2 makes
  `license`/`egress` an ordinary envelope field — **per-asserter**, unsigned, read off its own `prov`
  — while the `asset` id binds **bytes**, so two participants holding the same bytes hold the same id
  and may each assert a **conformant** envelope carrying a different pair. (e) bullet 2 was a MUST
  over *"an asset's `egress`"* as though there were one; (d) sourced the travelling pair from *"the
  envelope the requesting participant already holds"*; and a holder with only the permissive copy
  satisfied bullet 1, breached bullet 2, and **could not discover** the pair that would have stopped
  it. MA-5's laundering hole returned through **divergence** rather than absence, with **no
  misbehaviour at any hop** — which is why §2's attribution answer, sufficient for the *downgrade*
  case, does not reach it: attribution says whose assertion a pair is, and the question is which
  honest assertion **governs**.

  **Three edits, each held to what the break forces.** (1) **§7.1(d)** names the **serving**
  participant's pair, *as it evaluated it under (e)*, as the one that travels with a replicated copy —
  measured, not a preference between equal sources: the server must evaluate before it serves at all,
  so the value exists at the instant of the serve, whereas the requester may hold **no** envelope
  whatever. (2) **§7.1(e)** states that where a holder has **more than one** conformant pair for one
  `asset` id the **most restrictive governs**, taken **per axis** (narrowest `license` class;
  `local-only` over `exportable`), and that a holder **MUST NOT** prefer its own pair or the pair that
  permits the serve. (3) **(e) bullet 2's MUST is scoped** to the pairs a holder **holds or has
  received** — an obligation to act on what it knows, never a duty to discover what it does not.

  **The rule is reused, not invented.**
  [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive
  discipline — the restriction always wins, no arbitration, no trusted third party — applied here as
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) applies it to a federated
  merge and as [`fine-tuning.md`](fine-tuning.md) §4.2 already applies it across a finetune job's
  inputs. The asymmetry is measured: a restriction taken in error costs a **refused serve**, which is
  recoverable; a restriction missed is bytes across an authority boundary, which nothing undoes.

  **Patch, and additive at every surface.** No field, enum or envelope is minted; **no `asset` id
  moves** (the pair is outside the id by §2's own rule and (a)'s byte hash is untouched); no clause of
  §2, §3, §4, §5 or §6 moves; **no KGP clause or enforcement point moves** — KGP §7.1/§7.2 still
  classify and filter **records** at pack construction, while these fields govern **bytes** at `fetch`
  time; no schema twin is touched
  ([`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json) profiles an OTIO
  document and models neither the §2 envelope nor a `prov` record); and a holder that only ever sees
  one pair behaves exactly as at 0.3.7. **0.4.0 stays spent** on §4.4's EDL removal (KCB §7.3c forbids
  declaring and removing in the same publication), which is the other reason this is a patch.
  **DEFER-C is unmoved** — MA-13 is about which policy governs a serve, not about whether any store is
  obliged to hold. Extent reasoned as **MA-13**'s row in
  [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).

  **No count closes and none is added.** A fold does not close its own gate, so count (i) becomes a
  re-run of Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) against text carrying
  **both** this fold and MA-12's. **MA-17** and **MA-18** stay **KCB's** work on KCB's verb. Count
  (ii) is **KCB's** and unmoved (**MT-1**), the conformance gate still fails on **DR-4** and
  **DR-8**/**DR-7**, and **KMI stays Candidate** — as it would on a clean re-run, since one of its two
  counts is not KMI's to discharge.

- **Editorial** (2026-09-12) — **count (i) walked by hand against the folded text, and it does not
  close.** Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) re-run against **KMI
  0.3.7 / KCB 0.5.2**, prose and not a replay (**DR-8**). **MA-12 does not reproduce** — KCB §4.5
  carries the three answers, §7.1(f)'s conclusion rule is preserved word for word, and the *set it can
  see* premise is carried by §7.1(b)'s registry lookup plus KCB §3.1's `incomplete[]`. **Step 8 holds
  a third time** ((a)/(c)/(d) re-attacked on the digest axis and unmoved), **Step 9 does not flip** —
  **MA-13 stands, unfolded**, and §4.5 correctly gives it no route to the missing operand — and **Step
  10 does not flip** on two findings that are **KCB's**: **MA-17** (High, carrier — §4.5(a) names the
  outcomes and no field to read them from) and **MA-18** (Med, mis-route). Count (i) now reads *fold
  MA-13 here, and MA-17 + MA-18 in KCB §4.5(a), then re-run Steps 8–10 again* — the fifth shape this
  count has taken, and the second time its **work** has landed on the other plane. Count (ii) is
  **KCB's** and unmoved (**MT-1**); the conformance gate still fails on **DR-4** and **DR-8**/**DR-7**;
  **DEFER-C is unmoved**. **No version moves and no clause moves** — §1–§6, §8 and §9 byte-unchanged,
  §7's normative text byte-unchanged, no `asset` id moves and no schema twin is touched; the edit is
  §7.1's gate paragraph, this entry and a scenario section. **KMI stays Candidate and is not
  promotable**, as it would have been on a clean walk.

- **0.3.7** (2026-09-12) — **MA-12 folded: §7.1(f)'s three answers get a carrier, and it is on the
  other plane's verb (patch).** 0.3.5's MA-10 fold gave (f) a three-valued answer — a store MUST be
  able to say *not held, and not expected* distinctly from *not reachable* and from *not held,
  pending* — and the 2026-09-03 re-run of Steps 8–10 found that **nothing carried it**: KCB §4 typed
  `fetch` as a CAS GET by `asset` id with a grant and no response vocabulary, KCB cited §7.1(f)
  nowhere, and §4.2f had independently spent the word *pending fetch* on a rate-limited refusal, so a
  fourth state shared (f)'s default word on the same verb. Two conformant participants could not
  interoperate on the distinction, which is the exact consequence MA-10 was folded to remove —
  **MA-8's class of break, one plane over**.

  **The fold is two-spec, and the halves are not symmetric.** The carrier is
  [`capability-bus.md`](capability-bus.md) **§4.5** (KCB 0.5.2): named outcomes on the `fetch`
  response, owed **per request**, never **synthesized**, with absence reading *pending*. KMI's half
  is one paragraph in **§7.1(f)** pointing at it — and pointedly nothing more. **§7 defines the
  payloads, not the pipe**, so this spec mints no field, no enum and no envelope for the answers; it
  keeps the **meanings** (which is why §4.5 cites this clause rather than restating it, and why on
  disagreement about a meaning this clause governs) and states the three consequences of the split a
  reader would otherwise have to derive from the other plane — per request, never synthesized,
  silence is the absence of an answer and not an assertion that no holder remains. §7.1(f)'s
  conclusion rule is **unchanged in either direction**: a consumer still concludes only for the set
  it reached.

  **Patch, and additive at every surface.** No clause of §2, §3, §4, §5 or §6 moves; **no `asset` id
  moves** and no envelope field is added; no lineage relation, media type, timeline shape or `fetch`
  grant changes; no schema twin is touched
  ([`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json) profiles an OTIO
  document and models neither the §2 envelope nor a `prov` record); and a deployment with one store
  behaves exactly as at 0.3.6 — a store that never distinguishes *not expected* from *pending*
  remains conformant, since what the fold requires is that a store which **does** make the
  distinction has a name for it its caller reads the same way. **0.4.0 stays spent** on §4.4's EDL
  removal, which is the other reason this is a patch. **DEFER-C is unmoved** and keeps its stated
  trigger in
  [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md):
  no minimum replica count, no retention obligation, no durability guarantee, no designated durable
  holder. MA-12 asked that an answer (f) already required be **sayable**, not that any store be
  obliged to **hold** — and the fold's extent is reasoned as MA-12's own row on that page, alongside
  the MA-1…MA-11 dispositions.

  **No count closes and none is added.** Count (i) changes shape a fourth time — *fold **MA-13**,
  then re-run Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md)* — since MA-13 (High,
  structural) stands and a fold does not close its own gate; count (ii), the
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) re-run, is **KCB's**
  work, **not clean** (**MT-1**) and unmoved; and the fabric-wide conformance gate still fails on two
  documents (**DR-4**, and **DR-8**/**DR-7** — `kcs:multi-authority` predates this fold too and must
  be **extended**, not replayed). **KMI stays Candidate and is not promotable.**

- **0.3.6** (2026-09-12) — **The run-activity spelling, corrected in the two places KMI shows it
  (patch).** KINP 0.5.0 resolved **IMP-7** by admitting `activity` to §3.1's `<kind>` enum and
  stating the run-activity spelling normatively as `<namespace>:activity:<local-id>`, recognisable
  by its kind segment alone. Two worked examples here carried one of the two spellings that fold
  found **non-conformant** — §2's asset envelope wrote `"produced_by": "analyzer:run/1a2b"` (no
  kind segment, and a solidus outside `<local-id>`'s charset) and §6's analysis→knowledge bridge
  wrote the same id inside a `src(…)` annotation. KMI's `produced_by` was the load-bearing one: it
  is why a spelling KINP's own grammar never admitted reached a **third** spec, and why a consumer
  reading an asset envelope could not pattern-match a run activity against a KFT job id. Both now
  read `analyzer:activity:1a2b`.

  **Patch, and deliberately nothing more.** No clause moves: §2's envelope fields, their
  requiredness and the `license`/`egress` pair added at 0.3.5 are untouched, §3's lineage relations
  and §3.1–§3.4's projections are untouched, §4's OTIO adoption and §4.4's deprecation are
  untouched, and §6 keeps its port typing and its bridge rule — the change is the *value* shown in
  two examples. **No `asset` id moves** (the id hashes the bytes, and `produced_by` is envelope
  metadata outside it) and **no claim id moves** (all of `prov` is excluded from KGP §3.1's hashed
  set, and `src(…)` is an annotation beside `confidence(…)`, never a relation argument). **No
  schema twin is touched** — [`../schemas/media-timeline.schema.json`](../schemas/media-timeline.schema.json)
  profiles an OTIO document and models neither the §2 envelope nor a `prov` record. Nothing that
  conformed at 0.3.5 stops conforming, because the corrected spelling was never conformant under
  KINP §3.1 in the first place; a holder of an id minted under the legacy form gets KINP §3.1's
  stated transition (a resolver MAY accept it on **read** and MUST return the `activity` form as
  canonical; a minter MUST NOT emit it). **0.4.0 stays spent** on §4.4's EDL removal, which is the
  other reason this is a patch rather than a minor.

  **No gate moves and none is added.** Both outstanding counts are restated unchanged — count (i)
  (fold **MA-12** and **MA-13**, then re-run Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md)) and count (ii)
  (`e2e-media-transform.md`, not clean → **MT-1**, and KCB's work either way) — as is the
  fabric-wide conformance gate with **DR-4** and **DR-8**/**DR-7** open against it. **KMI stays
  Candidate and is not promotable.** One cross-repo consequence, stated here rather than left to be
  found: the downstream KCS encodings replay scenario documents, and
  [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) carries this same
  example id, so an encoding that pins the literal `analyzer:run/1a2b` will need the one-token
  update (ADR-0001, downstream, **unowned**).

- **Editorial** (2026-09-03, second entry) — **Steps 8–10 were re-attacked after KCB's four counts
  were walked, and Step 9 reverses: new delta MA-13 (High, structural).** The re-attack was not
  bookkeeping: four of the seven findings those KCB walks returned sit on **one axis** — *an operand
  deliberately kept outside a content digest, with a declared normative consequence and nothing
  carrying it* — and §2's `license`/`egress` pair is outside the `asset` id by exactly that design.
  **Step 8 holds** (an operand outside a digest is a hazard for decisions taken over it, never for the
  identity the digest establishes). **Step 10 re-confirms MA-12** and constrains its fold: the three
  answers must land as a **named response vocabulary on KCB §4's `fetch`** rather than as prose §4 is
  left to imply (**V-10**'s failure mode), must be owed **per request** rather than at registration
  (**BP-7**'s), and a store MUST NOT synthesize *not held, and not expected* (ADR-0014's
  never-invent-an-uncarried-value rule). **Step 9 does not flip**: §7.1(e)'s second bullet is a MUST
  over *"an asset's `egress`"*, while §2 makes the pair a **per-asserter** envelope field and the
  `asset` id binds **bytes**, so two conformant envelopes for one id may disagree, (d) sources the
  travelling pair from the **requester's** copy, and a holder with only the permissive one satisfies
  bullet 1, breaches bullet 2, and cannot discover the pair that would have stopped it. **No
  misbehaviour at any hop**, which is why §2's attribution answer — sufficient for the *downgrade*
  case — does not reach it. The fold named is **KMI-only and additive**: (d) names the **serving**
  participant's evaluated pair as the one that travels, (e) states that the **most restrictive** of
  the pairs a holder has governs (ADR-0013's discipline, as ADR-0014 and KFT §4.2 already use it), and
  bullet 2's MUST is scoped to what a holder can know, with the fail-closed default for **absence**
  unchanged. **No version moves and no clause moves**: this entry and §7.1's closing paragraph are the
  whole of the edit — no `asset` id, envelope field, lineage relation, media type, timeline shape or
  `fetch` grant changes, and no `schemas/*.json` is touched. **DEFER-C is unmoved.** Count (i) now
  reads *fold **MA-12** (two-spec: KCB §4 + KMI §7.1(f)) and **MA-13** (KMI-only), then re-run Steps
  8–10 again*; both are **unowned**. **All three** conditions on this spec's promotion are recorded in
  the scenario and **none holds** — count (i) above, count (ii) (walked the same day, **not clean** →
  **MT-1**, and KCB's work), and the conformance gate (**DR-4** on one document, **DR-8**/**DR-7** on
  the other). **KMI stays Candidate and is not promotable.**
- **Editorial** (2026-09-03) — **count (i) was re-run, and it does not close.** Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) were walked **by hand**
  against the folded §2 and §7.1 — not replayed, because `kcs:multi-authority` returns `green` over
  the deltas it predates (**DR-8**). **Steps 8 and 9 flip**: the regression set holds and **MA-5**, the
  blocking delta 0.3.5 folded, does not reproduce — (e)'s gate has its operand, the policy travels
  carried rather than synthesized, and a copy whose policy did not travel is not served onward.
  **Step 10 does not flip.** MA-10's three-valued answer is the right fold and (f)'s substance is
  intact, but the answer has **no carrier on the wire**: KCB §4's `fetch` defines no response
  vocabulary, §7 here defines the payloads and not the pipe, KCB cites §7.1(f) nowhere so the
  inherit-by-citation half of a two-spec delta was never written, and KCB §4.2f already calls a
  rate-limited refusal a *pending fetch* — a fourth state sharing (f)'s default word on the same verb.
  Recorded as new delta **MA-12** (Med, carrier; KCB §4 + KMI §7.1(f)), with the additive fold named
  and **DEFER-C explicitly unmoved**. **No version moves and no clause moves**: this entry and §7.1's
  closing paragraph are the whole of the edit — no `asset` id, envelope field, lineage relation, media
  type, timeline shape or `fetch` grant changes, and no `schemas/*.json` is touched. **No count
  closes** — count (i) stays open, now waiting on MA-12's fold rather than on the re-run, and count
  (ii) (the [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) re-run) is
  KCB's work, untouched and unmoved. **KMI stays Candidate and is not promotable.**
- **0.3.5** (2026-08-26) — **The federation fold, media half.** Folds the two deltas
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) — the ADR-0012
  cross-authority break test §7.1 names as this spec's second re-ratification count — recorded
  against KMI. **MA-5** (blocking): the §2 asset envelope gains two **optional** fields, `license`
  and `egress`, valued from KGP §7.1's licence classes and §7.2's egress classes and **excluded from
  the id** like every other envelope field, so **no `asset` id moves**; §7.1(d) gains the one narrow
  carve-out its own reasoning already implied — the governing policy is the single thing that
  accompanies replicated bytes, and it travels precisely because it is *carried*, never synthesized;
  and §7.1(e) gains the consequence that makes the gate decidable at a second holder — an asset's own
  policy is evaluated **in addition to** the serving domain's, `local-only` never crosses an
  authority-domain boundary, and a copy whose policy did **not** travel MUST NOT be served onward.
  **MA-10**: §7.1(f) gains a three-valued answer — a store MUST be able to say *not held, and not
  expected* distinctly from *not reachable* — which is what makes *pending* falsifiable for the
  reachable set. (f)'s substance is untouched and still invalidates nothing.
  **Patch, not minor:** every field is optional on read and write, an envelope carrying neither
  behaves exactly as at 0.3.4, no lineage relation, media type, timeline shape or `fetch` grant
  moves, and **0.4.0 is already spent** on §4.4's EDL removal (KCB §7.3c forbids declaring and
  removing in the same publication) — the same reasoning KCB used to land §3.1 at 0.4.6 and §4.2 at
  0.4.7.
  **No KGP clause changes.** The classes are **reused, not redefined**: KGP §7.2 still filters
  `local-only` **records** at pack construction, while these fields govern **bytes** and are
  evaluated by the serving participant at `fetch` time (§7.1(e)) — stated in §2 so the two
  enforcement points are not confused. **No schema twin changes** either: no `schemas/*.json` models
  the §2 asset envelope, and `provenance.schema.json`'s `$defs.license` / `$defs.egress` are the
  vocabularies reused rather than shapes altered.
  **One remainder is deliberately not folded** — an asset reference naming a designated durable
  holder (**DEFER-C**, from MA-10) — with the future break that would force it stated in
  [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md),
  along with what §7.1 deliberately still does **not** specify: no minimum replica count, no
  retention obligation, no durability guarantee.
  **Status: stays Candidate.** New normative text re-enters validation and a fold does not close its
  own gate; the §7.1 count is now a **re-run of Steps 8–10 against the folded text**, and the
  outstanding KCB re-run count under *Pressure test* is restated and does not move.

- **Editorial** (2026-08-26) — Recorded the **downstream results** of both gating scenarios in
  *Pressure test*. The KCS encodings of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) and
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) were run over real
  MCP/A2A links on 2026-08-24 and both came back `green`; **neither count moves**. Positive: delta
  **H**'s `source_world_is`, delta **I**'s media map and §5's analysis→KGP bridge were asserted over
  bound values under machine replay. The caveat is **DR-4** and it lands here —
  [`../scenarios/kmi-otio-roundtrip.md`](../scenarios/kmi-otio-roundtrip.md), the leg that produced
  **M-1** and gates §4.2a, is encoded downstream as `kcs:media-transform` **re-titled over the same
  fixture**, asserts nothing OTIO-specific, and never drops a namespaced-metadata carrier, so M-1
  and the 0.3.3 fold answering it are **unexercised**: that document's artefact gate is met by
  *count*, not by *content*, and no owner may cite the encoding as evidence for §4.2a. This opens no
  third count (M-1 is not one of the two) and closing it is downstream work under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), unowned. The reading rule is stated
  with it: the multi-authority pass came back green over **six** open blocking deltas, MA-5 among
  them, because an encoding deliberately does not assert an unfolded delta. **No clause changes and
  the status does not move** — KMI stays **Candidate** on both counts.

- **Editorial** (2026-08-24) — The cross-authority break test §7.1 names as this spec's **second**
  re-ratification count has **landed and been run**:
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), in which two
  authority domains' stores replicate on reference. It did **not** pass clean, but the half §7.1
  exists to protect **held**: the `asset` id was byte-stable across stores under every attack tried,
  a corrupted copy was rejected by (c)'s mandatory verify, (d)'s refusal to record a copy as a §3
  lineage edge survived the §3.2/§3.3 C2PA and OMC projections, and (f) invalidated no id, envelope,
  edge, timeline or grant when a store went dark. Two deltas are open: **MA-5** (blocking — (e)'s
  egress/license gate has no operand, since the §2 envelope carries neither field and (d) forbids
  synthesizing one, so one legitimate fetch plus (b)'s *MAY retain* ends the originating domain's
  control permanently) and **MA-10** ((f)'s *pending fetch* becomes unfalsifiable under optional
  retention with no durable holder). MA-5 adds two envelope fields excluded from the id and MA-10
  makes absence answerable — both additive, and **0.4.0 remains spoken for** by §4.4's EDL removal.
  **No clause changes and the status does not move** — KMI stays **Candidate** on both counts, and
  the outstanding KCB re-run is untouched by that pass.
- **0.3.4** (2026-08-24) — **Candidate.** Applied
  [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) to byte transport: **§9 open
  question 3 (CAS operational model) is resolved by a new normative §7.1**, so the single shared
  content-addressed store of §7 generalizes to **per-project stores that replicate on reference**.
  What §7.1 fixes: the `asset` id is the hash of the bytes, so it is **byte-stable across stores**
  and a store may never mint, rewrite, scope, or namespace an id for a copy — a replicated copy is
  the same asset, which is what makes federation safe rather than a second identity regime;
  *which* store to ask is a control-plane lookup answered by the registry (KCB §3.1) after which
  the holder is dialed **directly**, so ADR-0001's route-by-lookup-not-proxy stance is preserved
  and no store is a mandatory gateway; a receiver MUST verify bytes against the id and reject on
  mismatch; provenance and lineage do **not** replicate implicitly — holding a copy is not a §3
  edge and synthesizing an envelope or `prov` for a replicated blob is forbidden; replication is a
  `fetch`, so the **serving** participant evaluates license/egress/trust-tier against its own
  authority domain and fails closed, and an asset barred from leaving a domain is not replicated
  across it; and an unreachable store yields a **pending fetch**, never a broken identifier — the
  ADR's *an authority is a role, not a hard dependency* stated at this surface. *Classification:*
  **patch** — the fold is additive (no envelope field, no lineage relation, no verb or grant
  changed, nothing narrowed), a single-store deployment conformant at 0.3.3 is conformant
  unchanged, and **0.4.0 is spoken for** by §4.4's removal of `application/vnd.koine.edl+json`,
  which KCB §7.3c forbids folding into an unrelated publication. §9's numbering is deliberately
  **not** shifted — question 3 is marked resolved in place, the way §9.5 already is — so every
  existing §9.1/§9.4/§9.5 reference still resolves. Status: this is new normative text, so it adds
  a **second** count to Candidate — the cross-authority break test in
  [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), the same
  test KINP 0.3.0 and KCB 0.4.6 name — gating §7.1 alone. The outstanding KCB re-run is restated
  and does not move; no delta is reopened.
- **0.3.3** (2026-08-20) — **Candidate.** Folded the only question forced by the adversarial
  [`kmi-otio-roundtrip.md`](../scenarios/kmi-otio-roundtrip.md) pressure-test leg (§9.5). A
  producer MUST detect a missing `metadata.koine.asset` on re-import, MAY re-attach only after
  exact byte verification against the known KINP asset id, MUST restore the verified id before
  accepting canonical KMI, and MUST reject or quarantine an unverified clip rather than guess.
  The OTIO `target_url`, media map, names, edit ranges, and perceptual similarity remain
  non-identity hints. Questions §9.1–§9.4 remain open; no schema or registry surface changes.

- **0.3.2** (2026-08-13) — **Candidate.** **KMI's lineage claim is narrowed from "a vocabulary" to
  "a bridge."** Three additions under §3, none of which touch §3's relation set:
  - **§3.1 (informative) engages the prior art KMI had never named.** **C2PA** already ships a
    *cryptographically signed* derivation chain — the `c2pa.ingredient` assertion with
    `parentOf` / `componentOf` / `inputTo` relationships and hash-based **hard bindings** — behind a
    conformance program with **159 certified products as observed 2026-08-13** (Google ~35 entries,
    OpenAI, Amazon Bedrock, Getty, Qualcomm silicon, Sony). **MovieLabs OMC v2.8** ships a *richer*
    derivation vocabulary than either: **Revision / Variant / Derivation / Representation /
    Alternative**. So the asset-lineage graph is **no longer claimed as unoccupied ground**. What
    KMI claims is what neither occupies: the **analysis → knowledge bridge** (§5) — nothing in
    OTIO, C2PA, OMC, or IPTC connects media-analysis output to a knowledge graph — plus
    **world-scoping** (§2, §5). §3.1 states the re-open test that would retire the claim.
  - **§3.2 and §3.3 make the bridge operational**, on the discipline
    [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) established for KGP:
    koine's canonical form is retained and each external target gets a *specified* mapping. §3.2
    projects §3's relations onto C2PA ingredient relationships (pinned: **C2PA Specification 2.1**,
    `c2pa.ingredient.v3`); §3.3 projects them onto **OMC v2.8**'s derivation vocabulary. Both name
    what does **not** survive rather than implying losslessness — including that
    `media:perceptual_match` is not projected at all, that KMI `prov` is not the C2PA signer, that a
    KINP asset id is not a C2PA hard binding, and that OMC's **Revision has no KMI source**.
  - **§3.4 fixes the conformance obligation** as *complete or reported*, not lossless: round-trip
    over the projected subset **is** the criterion, so **no `schemas/` document shape is added** for
    a projection. The machine-checked fixture is a **downstream** validator per
    [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), named as a follow-up and explicitly
    **not** a new ratification gate.

  Recorded in [ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md) (bridge, not a
  third vocabulary — with *ship a third vocabulary* / *adopt C2PA wholesale* / *adopt OMC wholesale*
  weighed and rejected). Separately, **§4.1 gains the OTIO upstream pin**: **v0.18.1**, **not 1.0**
  (prerelease; the 1.0 milestone was due 2026-04-10 and is ~4 months overdue, about a third of
  issues open), and `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci
  Resolve 20.2 break against each other** (OTIO issue **#1985**) — recorded in
  [ADR-0005](../decisions/ADR-0005-otio-canonical-timeline.md)'s dated **amendment log** as a
  *risk*, with the OTIO adoption **reaffirmed unchanged**, because #1985 is the concrete, citable
  case for §4.2's asset-id envelope and §4.3's media map. All three pins take rows in
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md). **Unchanged in meaning:** the
  asset envelope (§2) including `source_world`, the §3 relation set and its semantics, §4's OTIO
  model and additive layer, the analysis→KGP bridge (§5), transform typing (§6), and byte transport
  (§7). Patch rather than minor — see the 0.3.2 status note. No delta is reopened; the
  re-ratification path is still the outstanding re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md), shared with KCB.

- **0.3.1** (2026-08-13) — **Candidate.** Names the removal version that 0.3.0's deprecation of
  `application/vnd.koine.edl+json` left open: the type is **removed at KMI 0.4.0** (§4.4), under
  the fabric-wide deprecation policy [`capability-bus.md`](capability-bus.md) §7.3 states once for
  every retiring surface, per
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md). Patch rather than minor
  **by that policy**: §7.3c requires the declared removal to be at least one full minor after the
  version that declared the deprecation (0.3.0), so publishing this clause as 0.4.0 would make the
  declaration and the removal the same release. Nothing else changes — the asset envelope, the
  lineage graph, §4's OTIO model and its additive layer, the analysis→KGP bridge, transform typing,
  and every other MUST/SHOULD clause are unchanged in meaning, no delta is reopened, and the
  re-ratification path is still the outstanding re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).

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
