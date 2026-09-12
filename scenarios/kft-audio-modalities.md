# Scenario: the two audio modality rows, walked end to end (KFT pressure leg)

**Purpose:** pressure-test [`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT 0.7.1,
*Candidate*) §3.1's two audio rows — `text-to-audio` and `audio-to-audio` — which have been
published since **0.7.0** and which that spec's own *Pressure test* section records as
**unexercised vocabulary**: *"no pass or leg exercises an audio job … neither may be cited in a
re-ratification until one does."* This is that leg. It is **AUD-6**
([`../docs/reference/generative-audio-modalities-downstream.md`](../docs/reference/generative-audio-modalities-downstream.md)
§8), the only one of that page's six findings that is koine's own.

**The claim under test is a sentence, not a feeling.** §3.1 closes its audio paragraph with an
additivity argument, and the argument is what a leg can actually attack:

> Neither row moves a clause of §4: both sides of an audio pair are `dataset.media[]` entries, so
> §4.2's effective-egress union over *every media asset* and §4.3's license/trust union already
> reach them.

And it mints the second row on a **distinguishing property**, stated twice:

> `audio-to-audio` is **not** that shape: it is voice conversion, source separation and
> enhancement, its corpus is paired asset↔asset with **no caption side** …

So this leg has an unusually sharp target. It walks one job per row, reads §4's text rather than
restating §3.1's summary of it, and asks whether the property §3.1 argues at length has anything in
§4 that can carry it. Same method as every pass in this directory: each step is marked ✅ *held* or
🔴/🟡 *broke*, and §Findings collects the deltas. **Only what this leg forces is carried into a
fold.**

**Delta series.** Findings here are **AU-1…AU-6**. The `FT-` series has one letter left (FT-A…FT-Y
are spent), so this leg mints its own the way [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md)
(BP-) and [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md) (AP-) did. **`AU-n` is not
`AUD-n`**: `AUD-1…AUD-6` are the *downstream adoption* findings of
[`../docs/reference/generative-audio-modalities-downstream.md`](../docs/reference/generative-audio-modalities-downstream.md),
four of them discharged in other repos. The two series are about different things and must not be
conflated.

Focused follow-up to [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md), whose audio
stressor is the coinage these rows exist to make unnecessary (*"a media producer's audio LoRA
(`text-to-image`-style, media-in/model-out)"*) and is therefore **not** evidence for them, and to
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md), which fixed the shape of a focused KFT leg.

## Setup

The **media producer** `mediastore` holds the audio corpora and the training-record files, the
**control-plane host** `orchestrator` issues the `invoke:finetune` grant and hosts the registry, the
**identity authority** `refkb` holds the base-model entities with their `ext:hf:…` external anchors
(FT-G), and two capability **providers** are registered (KCB §3, FT-K): the cloud-capable general
trainer `provider:org:trainer`, which advertises a `finetune` accepting `text-to-audio`, and the
in-tier specialist `provider:org:local-trainer`, which advertises one accepting `audio-to-audio`.
These are the KINP §3.4 placeholder namespaces, not deployment names or endpoints.

**Job A — `text-to-audio`.** A caption→audio LoRA over a licensed sound-effects corpus, entirely
`exportable`, deliberately the least exotic job the row admits:

```jsonc
{ "kft_version": "0.7.1",
  "job":        "orchestrator:activity:ft-run.a1d0",
  "base_model": "refkb:model:audio-diffusion-open",     // ext:hf:… anchored, Apache-2.0
  "modality":   "text-to-audio",
  "method":     "lora",
  "dataset": { "media":   ["mediastore:asset:blake3-sfx1…", "mediastore:asset:blake3-sfx2…"],
               "records": ["mediastore:asset:blake3-cap9…"],   // caption↔asset rows (FT-I)
               "header":  [ { "record": "header", "datasetKind": "captions",
                              "egress": "exportable", "license": "CC-BY-4.0",
                              "tier": "curated", "recordCount": 24000 } ] },
  "hyperparams": { "epochs": 8, "lr": 1e-4, "lora": { "r": 32, "alpha": 64 } },
  "compute": { "class": "single-gpu-a100-80gb", "egress": "derived" },
  "seed": 7, "config_hash": "sha256-cfga1d0…" }
```

**Job B — `audio-to-audio`.** A voice-conversion `full` finetune over **paired** recordings: 6,000
source↔target utterances. One side is a consented personal voice sample, so the corpus is mixed —
`personal` / `local-only` on the source side, `exportable` on the target side. `full` leads this
row's `method` ordering by §3.1's own reasoning (small task-specific architectures, not foundation
models), so the job takes it:

```jsonc
{ "kft_version": "0.7.1",
  "job":        "orchestrator:activity:ft-run.b2e1",
  "base_model": "refkb:model:voice-convert-base",       // a community checkpoint, no Hub coordinate
  "modality":   "audio-to-audio",
  "method":     "full",
  "dataset": { "media": ["mediastore:asset:blake3-src0…", /* … 5,999 source ids … */
                         "mediastore:asset:blake3-tgt0…"  /* … 5,999 target ids … */ ] },
  "hyperparams": { "epochs": 200, "lr": 2e-4 },
  "compute": { "class": "local-mps", "egress": "derived" },
  "seed": 7, "config_hash": "sha256-cfgb2e1…" }
```

The grant's ceiling is **900,000** `gpu-seconds` for Job B (§7). Job B's manifest as written above
is where Step 3 begins; it validates, and that is the problem.

---

## Step 1 — Job A is expressible, and the media plane already carries it

✅ **Held, and it needed nothing minted.** Checked against the text rather than inferred:

- **The port exists.** §2's media input port literally advertises
  `"media_types": ["image/*","video/*","audio/*"]` with `"shape": "training-set"`. An `audio/wav`
  asset routes to it with no change. This is the third of the four independent KMI confirmations
  [`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md)
  cites, and it is the one on KFT's own surface.
- **No registry row is owed.** `audio/wav` is IANA's, not koine's to mint
  ([`../registry/media-types.tsv`](../registry/media-types.tsv) carries model and dataset types
  only), exactly as `video/mp4` is.
- **The caption side has a home.** §4.1's FT-I rule puts per-sample pairing on
  `dataset.records[]` — *"a row references both a KMI `asset` id **and its text**"* — which is the
  caption↔asset shape Job A needs, and the shape §4.1 names for *"the caption side of
  text-to-image"*. Job A's `records[]` file carries a `dataset-jsonl-header` per §4.1/FT-O, and the
  positional `header[]` array gives the provider its axes before a byte moves.
- **Nothing else moves.** No plane, no artifact kind, no media type, no KCB verb, no port kind, and
  no `registry/` row is added for Job A. `modality: text-to-audio` × `method: lora` is a coherent
  pair and FT-F's admission check validates it from the enum, not from prose.

---

## Step 2 — The gate over both jobs, read against §4.2 and §4.3's own text

This is the step §3.1's additivity claim stakes itself on, so it is walked twice — once per row —
against §4.2's enumeration rather than against §3.1's summary of it.

✅ **§4.2 holds, for both rows.** §4.2's first bullet takes the most restrictive class across
*"**all** its training data — every knowledge record (KGP §7.2), every media asset, and every
`dataset.records[]` file (its header's `egress`, §4.1) — **and the base-model entity's own egress
class (FT-B)**."* Job A's inputs are two media assets, one record file and a base: all three carriers
are enumerated, all read `exportable`, and the job may burst to the cloud backend its
`compute.class` names. Perturbed — one caption row flipped to `local-only` — the header's
file-level aggregate is the *most restrictive over its rows* (§4.1, FT-N), so the file reads
`local-only`, the run's effective class is `local-only`, and §4.2's fourth bullet forbids the
cloud placement the manifest asked for. The refusal is a report, never a silent downgrade. **Job B
is the case §3.1's sentence is actually about**, and it works: both sides of every pair are
`dataset.media[]` entries, *every media asset* reaches them, the `local-only` source side pins the
whole run in-tier, and `provider:org:local-trainer` takes it. Flip Job B's tier to one without the
accelerator and FT-J fires correctly — admission fails with a report rather than hanging or
cloud-placing.

✅ **§4.3 holds, for both rows.** The union license reaches every media asset the same way, and
FT-B's base-model clause carries: a non-commercially-licensed audio base makes the finetuned model
non-commercial however permissive the corpus, which for `audio-to-audio` — whose typical bases are
community checkpoints rather than foundation models — is the ordinary case rather than the exotic
one. The `personal` tier travels as a descriptive signal and is **not** read as a gate, which is
FT-N's rule holding on a corpus it was not written for.

🟡 **Broke, on the claim rather than the gate → AU-2 (first half).** The gate does reach both
rows. §3.1's stated **reason** does not: *"both sides of an audio pair are `dataset.media[]`
entries"* is **`audio-to-audio`'s** reason, offered for **both** rows, and it is false for Job A,
whose caption side is a `dataset.records[]` row (Step 1) and not a media entry at all. Job A's
conclusion survives *for a different reason* — §4.2 enumerates record files separately — so the
error is in the sentence, not in the gate, and it is the sentence that was the 0.7.0 fold's whole
additivity argument. The other half of AU-2 arrives in Step 4.

---

## Step 3 — Job B: which source goes with which target?

Job B's corpus is 6,000 pairs. The manifest above lists 12,000 `dataset.media[]` ids in one flat
array. Nothing in it says which source utterance is paired with which target, and voice conversion
is a *paired* objective — the pairing is not an optimization, it is the supervision. Every slot §3
and its machine-readable twin offer is tried:

| Slot attempted | Result |
|---|---|
| `dataset.media[]`, two entries per pair | **Right id kind, wrong meaning.** §4.1 is explicit that `dataset.knowledge[]` and `dataset.media[]` *"name the **referenced corpora**, not the training samples"*. A flat array of 12,000 ids is a fetch-and-egress manifest. Nothing fixes an order, a stride, or a role, so one provider pairs positionally `(2i, 2i+1)`, a second pairs first-half-to-second-half, and a third reads filenames — three different trainings from one manifest, all conformant. |
| Two arrays (`media_source[]` / `media_target[]`) | **Not schema-valid.** [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)'s `dataset` object is `"additionalProperties": false` with exactly `knowledge` / `media` / `records` / `descriptor` / `header`. There is no extension slot and no vendor escape hatch, by design (§3: *a proposal to add a field that duplicates one of theirs is a defect*) — which is why the absence of a **non**-duplicating field is a hole and not an oversight. |
| `dataset.records[]` | **The right surface, with no stated row.** §4.1's FT-I bullet *is* the join surface, and it types a row as *"both a KMI `asset` id **and its text**"* — then enumerates the shapes it covers: *"which image goes with which caption, the basic shape of every image/video-text-to-text (and the caption side of text-to-image)"*. An **asset↔asset row with no text side** is in neither the type nor the enumeration. And nothing else fixes it: [`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) is `"additionalProperties": true` and carries **no** field, layout, or column keyword — `datasetKind` is a free string with illustrative examples. So the slot accepts the file and no clause says what a conformant row in it looks like. |
| `dataset.descriptor[]` (Croissant `recordSet` / `field` can describe two asset columns) | **Describable, unreadable.** §4.1.1 is NORMATIVE that a descriptor is *"never an admission input"*, is *"not a fourth corpus slot"*, and that on disagreement *"the header wins and the descriptor is the bug"*. A converter or a human may read the layout there; no normative reader of KFT may. |
| `hyperparams.pairing` | The permissive slot no normative clause reads — **FT-S**, already paid for on [`kft-resume-checkpoint.md`](kft-resume-checkpoint.md), and §3.4's precedent refuses a gating ref carried there as `invalid` (§8.1). |

🔴 **BROKE (AU-1, high — structural, and blocking).** §3.1 mints `audio-to-audio` on exactly one
distinguishing property — *paired asset↔asset with **no caption side*** — and the only pairing
carrier KFT names is typed *asset **plus text***. The row is admissible vocabulary (the enum, the
schema, FT-F's check) whose corpus has no expressible supervision, so two conformant providers
produce two different models from one manifest and **neither is wrong**. It reproduces with **one
provider, one store and one job**, and it needs no federation, no resume, no multi-provider
routing and no cloud placement to reach.

This is the axis [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named,
arriving on the KFT plane: *a rule with a declared normative consequence and nothing that carries
it*. The sharper reading is that §3.1 **identified** the property in advance, argued it at length
against a rejected alternative, and then landed it in a section (§4.1) whose one carrier sentence
was written for the caption case.

---

## Step 4 — §3.1's additivity claim, scored

🟡 **BROKE (AU-2, med-high — scope).** The claim is *"Neither row moves a clause of §4."* §4 is
four sections, and the claim is true of two of them:

| §4 clause | Verdict |
|---|---|
| §4.2 — the egress gate | ✅ **True, for both rows**, walked in Step 2. No clause moves. |
| §4.3 — license & trust lineage | ✅ **True, for both rows**, walked in Step 2. No clause moves. |
| §4.1.1 — Croissant, by reference | ✅ **True.** A descriptor is never an admission input; nothing here reaches it. |
| §4.1 — references, not payloads | 🔴 **False for `audio-to-audio`.** AU-1 moves the FT-I bullet. |

So the claim over-reaches by one clause, and gives the wrong row's reason for the two it gets
right. Both halves are one sentence's worth of fix, and both are worth writing rather than
inheriting: an additivity claim that is 80% true reads as fully true to the next author, and this
one has already been restated four times (KFT §Pressure test, ROADMAP,
[`../docs/reference/promotability.md`](../docs/reference/promotability.md), and
[`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md)),
each restatement taking the conclusion and dropping the reason.

**What is *not* found here, and it matters for how narrow the fold stays.** §4.2's and §4.3's
mechanisms were attacked directly and did not yield — including the mixed-class paired corpus, the
base-model clause and the unsatisfiable pin. Every finding in this leg is a **carrier** or a
**scope** break. **No model is in question.**

---

## Step 5 — Routing, and the refusal that cannot route

Job B reaches `provider:org:trainer` — the general trainer, which advertises `text-to-audio` and
not `audio-to-audio`. §2 is explicit about how a consumer was supposed to avoid that:

> A provider MAY advertise several `finetune` capabilities distinguished by the `modality` they
> accept (§3) … Path search (KCB §3) then routes a job to a provider that accepts its modality.
> They all share the **name** `finetune` and are told apart by their *ports*.

✅ **The refusal grade holds.** §8.1 gives the right code without a new one: an in-enum modality
outside *this* provider's envelope is `out-of-envelope` — **re-routable** — and an unknown token is
`invalid`. (Worth recording because a provider-side string like *unknown-modality* is that
provider's own wording, not a KFT `code`; §8.1's vocabulary needs nothing minted for audio.)

🔴 **BROKE (AU-3, med-high — discovery).** The two audio rows are the **first pair in §3.1's own
table with an identical *Data-plane port* value**, and it is checkable rather than impressionistic:
of the seven rows, `media (KMI audio)` is the **only** value that appears twice, and
[`../registry/enums/modality.tsv`](../registry/enums/modality.tsv)'s `data_planes` column agrees
(`media(audio)` twice, every other value once). Both rows therefore declare the *same* port
signature — a media input port over `audio/*`, a records input port, a model entity output, a
weights output — so:

- **Path search cannot discriminate.** §2's *told apart by their ports* is false for this pair for
  the first time, and §2 forbids the workaround by name: a variant advertised as `finetune-audio`
  *"would be invisible to a consumer searching for `finetune`, which is exactly the fragmentation
  KCB §7.1 forbids."*
- **The refusal cannot route either.** §8.1's `route_to[]` is defined as *"resolvable registry
  addresses … of providers whose advertised `finetune` ports accept this job's modality"* — and for
  the audio pair the ports establish no such thing. The best `provider:org:trainer` can emit is
  *every provider with an audio media port*, which includes itself; the alternative is an empty
  route that discards the specialist that would have taken the job. §8.1's own rule — *"an empty
  route is a truthful answer and a wrong one is worse than none"* — makes the indiscriminate list
  the worse of the two, so §1.1's **third** defensible claim (graded refusal routing) degrades on
  the first modality pair whose ports collide.

**The carrier exists and nothing names it for this.** KCB §7.1 (the V-2 fold) establishes that a
port's bare `shape` carries **routing** identity and not payload identity — which is precisely the
job here — while §2's worked AgentCard shows `"shape": "training-set"` on every port of every
variant. A carrier that exists, is right for the purpose, and is pointed at by nothing is **V-10's
class**, one plane over.

---

## Step 6 — The budget prices a paired corpus twice

🔴 **BROKE (AU-4, med).** §7's cardinality rule reasons from *what the arrays are*:

> For `dataset.knowledge[]` and `dataset.media[]`, cardinality is resolvable from the manifest —
> **the arrays enumerate their members**. A single `dataset.records[]` asset (§4.1) may hold ten
> rows or ten million, so cardinality is *not* recoverable from the reference …

For Job B the members and the samples are different numbers: 6,000 training pairs are **12,000**
media ids. FT-E's admission-time estimate resolves cardinality from the array, prices 12,000
samples, and against a 900,000-unit ceiling fitted to the job it refuses **`over-budget`** (§8.1) a
run that fits — with a truthfully **empty** `route_to[]`, because no provider is cheaper. That is
FT-V's failure shape arriving through *cardinality* rather than through completed work, and it is
reachable on the ordinary path for every paired-media corpus.

The fold has to answer which array is the sample count, because AU-1's answer creates the second
half of the problem: once the pairing rides `dataset.records[]`, `recordCount` carries the sample
count and `dataset.media[]`'s enumeration must **not** also be counted, or the estimate
double-counts from the other side. The two are one edit and are filed separately because they land
on §4.1 and §7 respectively.

---

## Step 7 — The portability claim does not reach either row

§1.1's fourth defensible claim is **cross-provider portability**, and §3.3 discharges it *"as a
specified artefact rather than asserted as a property"* by mapping a job onto four pinned targets:
**Axolotl**, **LLaMA-Factory**, **TRL** and the **OpenAI fine-tuning API**.

🔴 **BROKE (AU-5, med-high — scope).** None of the four trains a diffusion audio model or a
voice-conversion network, and it is measurable rather than arguable: not one of the audio rows'
`typical_base` families (Stable Audio Open, MusicGen, AudioLDM 2 · RVC, so-vits-svc, Demucs) is in
any pinned target's model surface, and §3.3.3's one import-only legacy source (torchtune, wound
down) is a text-LLM recipe format too. §3.3.2's matrix nonetheless states a correspondence for
`modality` in **all four** columns — *"implied by base + config"*, *"`template` / task"*, *"implied
by trainer class"*, *"implied by `model`"* — with the disposition column reading **n/a**, i.e.
mapped and never refused. Two conformant readings then disagree:

- **By the matrix row**, `modality` is mapped for every job, so a converter emits a config — for a
  job the target cannot execute, which §3.3.4's round-trip criterion (a) fails on *"the same
  meaning"* and which in practice fails at the far end as a load error.
- **By §3.3.1**, the gating set names *"the `modality × method` compatibility FT-F validates"*, the
  target has no field for it, and the **Refused** disposition is therefore mandatory: *"MUST fail
  the conversion with a report … MUST NOT substitute a nearest-neighbour value."*

§3.3.4 cannot arbitrate, because under the second reading nothing was emitted to round-trip. The
defect is not that KFT's portability claim is untrue for audio — a spec is allowed to have targets
— it is that the claim is stated **unscoped**, so the matrix asserts a mapping where the honest
answer is a refusal. The fix is a disposition, not a fifth target.

---

## Step 8 — What held

Recorded so the fold stays narrow, and because six of these were tried rather than assumed:

✅ **The gate's behaviour, twice.** §4.2 and §4.3 reach every carrier an audio job has, including
the mixed-class paired corpus, the base-model clause (FT-B) and the unsatisfiable in-tier pin
(FT-J). As in the third and fourth passes, every finding here is about making a fact
**expressible**, never about what the gate does with one.

✅ **Artifact typing and lineage.** Audio model weights are large bytes → KMI assets under §5.3,
and §5.3.1's **KitOps / ModelPack** adoption carries the multi-component case (a text encoder, a
DiT and an autoencoder travel as typed `model.parts[]` of one package) without KFT minting a
layout. **No new artifact kind and no new media type** — which is why nothing in this leg is a
missing model.

✅ **Output inheritance.** §5.4 is modality-blind and correct here: the `local-only` source side of
Job B's corpus binds the finetuned voice model and **every** weight asset it generates, a
checkpoint inherits **at publication** rather than at completion, and a `local-only`-inheriting
voice model MUST NOT be registered in a cross-boundary registry or pushed to a Hub. This is the
clause that matters most for a consented-voice corpus, and it needed nothing.

✅ **The telemetry stream.** §6's event carries `checkpoint` and `samples[]` as KMI asset ids,
which are media-type agnostic — an audio preview clip rides `samples[]` exactly as an image grid
does (FT-L), and `job+step` idempotency is untouched.

✅ **The refusal vocabulary.** §8.1 needs nothing minted (Step 5).

✅ **The registry pointer resolves.** [`../registry/entity-types.tsv`](../registry/entity-types.tsv)
refines the `model` entity by `modality` against `enums/modality.tsv`, and both audio tokens are in
that file — so a `model` entity for an audio base or a finetuned voice model is expressible with no
registry edit.

🟡 **One cleanup falls out of Job B's `method` (AU-6, med).** §5.3's export matrix has four rows —
LoRA adapter, merged fp16, GGUF, ONNX/CoreML/TFLite — and **none of them is the output of a `full`
finetune**: the first row's artifact is an adapter, the second is a *merge* of an adapter with a
base, and a full finetune produces neither. [`../registry/media-types.tsv`](../registry/media-types.tsv)
carries the same two shapes only (*"LoRA adapter or merged fp16 … derived_from base weights
(adapter) or adapter+base (merged)"*), and §5.3.1 argues the ModelPack adoption on the adapter case
specifically. The gap is **pre-existing** — `text-generation` and `text-to-image` both admit `full`
— and is filed here because `audio-to-audio` is the first row whose **typical** `method` ordering
*leads* with `full`, which turns an edge case into the ordinary path. The fix is one row and one
registry description, and it is not audio-specific.

---

## Findings — required spec deltas

| # | Severity | Gap | Forced question | Spec |
|---|---|---|---|---|
| **AU-1** | **High (structural)** | §3.1 mints `audio-to-audio` on the property that its corpus is *paired asset↔asset with no caption side*, and §4.1's FT-I bullet — the only pairing carrier KFT names — types a row as *"a KMI `asset` id **and its text**"* and enumerates only caption shapes. `dataset.media[]` is the corpora *"not the training samples"*, the schema's `dataset` is `additionalProperties: false`, the header schema fixes no row layout, and a Croissant descriptor is never an admission input. Two conformant providers train two different models from one manifest. | How does a **paired asset↔asset** corpus state its pairing? | KFT §4.1 (the FT-I bullet), no schema change required |
| **AU-2** | Med-High (scope) | §3.1's *"Neither row moves a clause of §4"* is true of §4.2, §4.3 and §4.1.1 and **false of §4.1** (AU-1), and the reason it gives — *"both sides of an audio pair are `dataset.media[]` entries"* — is `audio-to-audio`'s reason offered for both rows, false for `text-to-audio`, whose caption side is a `dataset.records[]` row. The conclusion survives for `text-to-audio` for a **different** reason, which is why the error is in the claim. | Which clauses of §4 does each row actually reach, and by which carrier? | KFT §3.1 (one sentence) |
| **AU-3** | Med-High (discovery) | The audio pair is the **only** duplicate in §3.1's *Data-plane port* column (checked across all seven rows; `registry/enums/modality.tsv`'s `data_planes` agrees), so §2's *told apart by their ports* is false for it and §8.1's `route_to[]` — defined over *"ports [that] accept this job's modality"* — can name only *every audio provider* or nobody. §2 forbids a name split; KCB §7.1's port `shape` is the routing carrier and nothing points at it for this. | How does a consumer, or a refusing provider, tell two modalities apart when their ports are identical? | KFT §2 and §8.1 |
| **AU-4** | Med | §7 resolves cardinality because *"the arrays enumerate their members"*; for a paired corpus N samples are 2N members, so FT-E's estimate doubles and refuses `over-budget` a job that fits, with a truthfully empty `route_to[]`. AU-1's fold creates the converse: once pairing rides `records[]`, counting `media[]` as well double-counts from the other side. | Which array is the **sample** count for a paired corpus? | KFT §7 |
| **AU-5** | Med-High (scope) | §3.3's four pinned targets train no audio model, and §3.3.2's `modality` row asserts a correspondence in all four columns with disposition **n/a** while §3.3.1's gating set makes `modality × method` gating and its **Refused** disposition mandatory — two conformant readings, one emitting a config the target cannot execute, and §3.3.4 unable to arbitrate because the other emits nothing. | Is §1.1's portability claim **scoped**, and does an unexecutable modality refuse? | KFT §3.3.2 (a disposition, not a fifth target) |
| **AU-6** | Med | §5.3's export matrix and `registry/media-types.tsv` have no row for a **`full`** finetune's weights — the adapter and the merged-fp16 rows are the only two, and §5.3.1 argues the packaging adoption on the adapter case. Pre-existing across `text-generation`/`text-to-image`; first made the **typical** path by `audio-to-audio`, whose method ordering leads with `full`. | What is a full finetune's weight artifact, and what is it `derived_from`? | KFT §5.3 + [`../registry/media-types.tsv`](../registry/media-types.tsv) |

**Blocking: AU-1.** Without it a published row has no expressible corpus, and the two tokens stay
uncitable for the reason AUD-6 gave and one layer deeper. **Should-fix: AU-2, AU-3, AU-5** — each is
a claim this spec makes about itself that a reader implements against. **AU-4 and AU-6** are
correctness fixes on clauses that already exist.

**None requires redesign, and none reaches another spec.** Every delta is an additive field-free
clause or a table row in **KFT alone** — checked per step: no KMI clause (§2's envelope, §3's
lineage, §7's transport), no KCB clause (§2's ports, §4's verbs, §5's grant, §7's versioning), no
KGP clause and no KINP clause is read differently by this walk. Two of the six are literally one
edit each (AU-2 a sentence, AU-6 a row), and AU-1 and AU-4 belong in one §4.1/§7 edit. **All six are
unowned.**

---

## What this leg does not force

It walks two rows of one section on purpose, so what it forces is unambiguous:

- **§11.1 / §11.2 / §11.4 / §11.6 are untouched.** Neither job expressed an engine preference, ran
  multi-node, bound an `eval[]`, or converted to a target that separates `method`'s two axes.
- **A third audio row is deliberately not walked.** This leg exercises **published** vocabulary
  only. `audio-text-to-text` is declined-with-a-trigger in
  [`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md)
  §4 and is a decision, not a delta; if a third row is ever ratified it re-enters validation here
  and this leg is where it lands.

  **Corrected 2026-09-12 — that condition fired the same day this leg landed.** The trigger §4
  published was read against a dated ask, the verdict was **ratify**
  ([`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md)
  §7), and **`audio-text-to-text` is published at KFT 0.8.0** in all four statements of the
  vocabulary. The bullet above stands as written — this leg walked **KFT 0.7.1** and exercises the
  two rows that were published when it was walked — and what it reserved is now **owed**: the third
  row is unexercised vocabulary, it re-enters validation **here**, and a job for it is the next
  extension of this leg. Two consequences are already known and are **not** new deltas. **AU-1
  widens from two rows to three** — §4.1's FT-I bullet *enumerates* its members, so the fold that
  answers AU-1 must carry the third `…-text-to-text` row; same sentence, same defect. And **AU-3
  does not widen**: the new row's *Data-plane port* is `knowledge + media (KMI audio)`, distinct
  from the `media (KMI audio)` pair, so it is discriminable by port and adds no ambiguity to the one
  AU-3 found. KFT's third condition — this leg's AU-1…AU-6 — **widens in scope rather than gaining
  a sibling**, and counts (i) and (ii) still do not move.
- **KCS delta R reaches audio and is not re-filed.** A generated `audio/wav` is exactly the case
  KCS 0.3.0 forbids asserting by byte equality, and `structure_matches`'s comparison basis is fixed
  nowhere ([`kcs-format-stress.md`](kcs-format-stress.md#findings-from-the-re-validation)) — with
  two `asset` ids over deliberately-differing bytes as its operands, which is R's own worked case.
  That is **KCS's** open blocking delta, cited here as a consequence and **not** counted as a
  seventh finding.
- **No status moves.** KFT stays **candidate** and no version moves for this walk: the leg moves no
  clause of any spec, and recording it is a *Pressure test* paragraph plus an Editorial changelog
  entry, the same discipline every hand-walk in this directory follows.

**What it costs KFT, stated plainly.** AU-1…AU-6 are open deltas from a pass, so under
[the ratification gate](../specs/README.md#the-ratification-gate) they are a **third** condition on
KFT's promotion, additional to counts (i) (FT-W, the producer-exhaust re-run) and (ii) (FT-X/FT-Y,
the resume re-run) — **neither of which moves**, because neither job here carries `resume` and
neither corpus is a producer's exhaust. It is **not a re-run gate**: it is a fold, then this leg
again. And it settles AUD-6 halfway: the rows are now **exercised by a pass** and were found
**not clean**, which is worth more to a re-ratification than a clean walk would have been, and
strictly less than a closed count.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**There is none, and that is a finding rather than a gap in the write-up.** This leg has **no KCS
encoding** and has never been run downstream. The obligation is stated here, on the day the file
landed, because this repo has already paid for the alternative: `kft-resume-checkpoint.md`,
`kcb-subscription-firehose.md` and `kcb-cross-owner-posture.md` each recorded *"no encoding"* for a
week after one had landed (**DR-11**/**DR-12**/**DR-13**, all closed 2026-08-26 and learned
2026-09-02). The direction of the error is reversed here — a file arriving *without* an encoding
rather than an encoding arriving unnoticed — and the cause is the same one: **the cross-repo
obligation has no red light in this repo, in either direction.** `.chief/verify.sh` checks links,
status mirrors, schemas and the registry, and nothing in it can notice that this directory now holds
**thirteen** documents while the downstream encoding set holds twelve.

| | |
|---|---|
| Encoding | **none.** The downstream set is held to **set-equality** with `scenarios/*.md` by `coverage.test.ts`, so this file **breaks that test** until an encoding lands (`KOINE_SCENARIOS.length === 12` today). Building it is downstream runtime work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned** |
| Run | none |
| Artifact | the current artifact of record — `sha256-eb8fdc9c…36dd5`, generated 2026-08-26, **twelve** scenarios, `partial-live` — does not and cannot include this leg |

### Findings — from the absence of a downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| **DR-14** | **Blocking (for KFT alone)** | The thirteenth scenario has no KCS encoding and no run. AU-1…AU-6 have no machine-replayable document citing them, and neither does the vocabulary they are about — so **AUD-6's second half is untouched**: the rows are now exercised by a *pass* and still not by an *encoding*. | [The ratification gate](../specs/README.md#the-ratification-gate) forbids promoting a spec whose scenario has no KCS encoding, so **KFT loses the artefact gate on this count** — on top of, not instead of, its three open conditions. It also breaks downstream `coverage.test.ts` set-equality on arrival. Encoding it is downstream work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**. When it is built it must assert the **folded** text, not this leg's pre-fold reading — **DR-7**/**DR-8**'s hazard, stated in advance for once: an encoding that predates its fold returns `green` while asserting nothing. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands); neither applies to a
scenario that was never run. **DR-6** does apply in advance — the **training-provider** role has
been a stand-in in all three KFT passes, so a run of this leg would very likely observe its
refusals against a recorded provider rather than a live one.

---

## Verdict — the rows are exercised, and not clean

AUD-6 said the two audio tokens were **unexercised vocabulary** and that a scenario plus its
encoding were *"the join neither side can author alone."* The scenario half is now written and the
answer is not the reassuring one: `text-to-audio` walks almost clean (AU-2's reason, AU-5's
disposition), while `audio-to-audio` — the row §3.1 argued hardest for, and correctly — has **no
expressible corpus** (AU-1), **no discriminable port** (AU-3), a **doubled price** (AU-4), and a
weight artifact its own typical method has no row for (AU-6).

The pattern is the one this repo keeps finding and is worth naming on a fifth spec: **the mechanism
is checked hard and the claim the prose makes about it is not.** §4.2's gate, §4.3's union, §5.4's
inheritance and §8.1's grades were attacked directly and **all held** — on a corpus none of them was
written for. What broke was §3.1's sentence about them, §2's sentence about ports, §3.3's sentence
about portability, and §4.1's sentence about rows. Six findings, **zero** model breaks, and every
fold additive and KFT-only.
