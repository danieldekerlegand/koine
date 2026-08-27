# The generative-audio modalities — what `text-to-audio` and `audio-to-audio` are, and why both land

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

[KFT §3.1](../../specs/fine-tuning.md)'s `modality` vocabulary
([`../../registry/enums/modality.tsv`](../../registry/enums/modality.tsv)) has five rows and no
audio. `grep -rn 'text-to-audio\|audio-to-audio'` over this repo returns nothing outside the
tasklist that commissioned this page. Two rows are proposed; this page **decides** them, axis by
axis, **before** a row is written — the same split the federation fold used
([`federation-fold-dispositions.md`](federation-fold-dispositions.md)), where deciding what to
land and landing it are separate acts.

**What this page is not.** It binds no clause and moves no version. It is not a status mirror:
[`../../specs/fine-tuning.md`](../../specs/fine-tuning.md)'s own header is the authority on KFT's
version and status. The landing zone named at the end is **intent**; the changelog entry that
lands the rows is the record.

**Verdict, up front.** **Both rows land.** `audio-to-audio` was the one genuinely open question —
it is a transformation, not a caption-to-asset generation — and the case for excluding it is
stated below **and answered**, rather than being skipped by symmetry with `text-to-audio`.

---

## 1. The plane, verified rather than asserted

A new modality "adds a row plus a capability variant (§2), **never a new plane**" (KFT §3.1). So
the first question is not what the rows say but whether the plane they name already carries audio.
It does, and here is where — four independent places in
[KMI](../../specs/media-interchange.md), none of them added for this:

| Where | What it establishes |
|---|---|
| **§2, the asset envelope** | `media_type` is an ordinary IANA type (the worked example is `video/mp4`); nothing narrows it to visual media. |
| **§2, `probe.streams[]`** | The probe's own example carries `{ "kind": "audio", "codec": "aac", "sample_rate": 48000, "channels": 2 }` — an audio stream's technical metadata already has a modelled shape. |
| **§6, the media-plane port profile** | KMI's *own worked example* of a media output port is `"media_types": ["audio/wav"]`, and the section names `mood(knowledge) → score(audio)` as a cross-plane transform. Audio is not a tolerated case here; it is the illustration. |
| **§8, the role map** | An **Audio producer** is a listed producer role: "Emits `audio/*` assets + instrument renders". |

**One correction to the framing this work arrived with.** The commissioning tasklist says "KMI
already lists `audio/*` in its media types". That is true of the *plane* and false of the *file*:
[`../../registry/media-types.tsv`](../../registry/media-types.tsv) registers only the media types
koine **mints** — `application/vnd.koine.model+safetensors`, the `+gguf`/`+onnx`/`+coreml`/`+tflite`
exports, and `application/vnd.koine.dataset+jsonl`. `audio/wav` is an IANA type that needs no koine
registration, exactly as `video/mp4` has none. So **`registry/media-types.tsv` does not change**
for these rows, and a future reader who goes looking for `audio/*` there and does not find it has
not found a gap.

**Conclusion.** `media(audio)` is an existing, ratified-in-shape plane. Both rows are additive over
it and neither requires a plane, an artifact kind, a media type, or a KCB verb.

---

## 2. `text-to-audio` — the third diffusion row

This one is the case KFT's shape already predicts. `text-to-image` and `text-to-video` are
`media(image)` / `media(video)` rows taking a caption and producing an asset; audio is the third
medium of that family and differs from them in nothing that §3.1 measures.

| Axis | Value | Why |
|---|---|---|
| `data_planes` | `media(audio)` | Same shape as `text-to-image`'s `media(image)`. The caption side is a prompt string travelling in the training record, not a KGP knowledge claim — which is precisely why the generation rows name one plane where the *understanding* rows (`image-text-to-text`, `video-text-to-text`) name `knowledge+media(…)`. |
| `typical_base` | Stable Audio Open, MusicGen, AudioLDM 2 | Open-weight caption→audio generators that are finetuned in practice. Bare family names, no version pins — matching the existing rows (`FLUX, SD3.5`; `Wan, LTX, CogVideoX`), which are informative and not [pinned upstream standards](upstream-standards.md). |
| `typical_method` | `lora\|full` | Identical to `text-to-image`. `dpo` is not applicable and `sft`/`qlora` are LLM-side; a provider **MUST** reject the incompatible combination at admission under FT-F, which is the clause that makes this column load-bearing rather than advisory. |
| `description` | Diffusion/autoregressive audio generation — music, SFX, and speech (TTS); caption→audio (KMI audio) training data | See §4 on why TTS rides this row rather than a sixth. |

Nothing else in KFT moves for it. §4.2's egress gate reads "every media asset" and audio assets are
media assets; §5.3's export matrix is architecture-agnostic; §5.1's model entity is refined by
`modality` and takes a new token by construction.

---

## 3. `audio-to-audio` — the decided row

### 3.1 The case for excluding it

Stated at its strongest, because it is the reason this row was flagged rather than assumed:

`audio-to-audio` is not a caption-to-asset shape. Voice conversion, source separation and speech
enhancement take a signal and return a modified signal — nearer a **filter** than a generator, and
[KMI §6](../../specs/media-interchange.md) already types filters: a transform is a KCB capability
with a media input port and a media output port, and `audio/wav → audio/wav` is expressible there
today without KFT hearing about it. If the fabric can already *invoke* the thing, why does the
fine-tuning profile need a token for it?

### 3.2 Why that case fails

Three answers, in ascending order of how decisive they are.

1. **The enum is not generation-only.** Three of its five rows — `text-generation`,
   `image-text-to-text`, `video-text-to-text` — are understanding or completion modalities, not
   caption-to-asset generation. Whatever `modality` selects for, "is it generative?" is not it, so
   "audio-to-audio is a transform" excludes nothing.

2. **KMI §6 and KFT §3.1 answer different questions.** §6 types an **invocation** — what a
   transform consumes and produces on the bus. §3.1 names what a **training run** is adapting a
   model *to be*, and it is shared with the model entity's `type` refinement (§5) and the
   `finetune` capability's port types (§2). A model that performs a transform is still a model that
   gets trained. That §6 can invoke the finished artifact is an argument that the two fit together,
   not that one replaces the other.

3. **Excluding it does not remove the case; it corrupts it.** Per-speaker voice-conversion
   finetuning is among the most routinely performed audio finetunes there is. With no token, a
   provider expressing such a job must either abuse `text-to-audio` — which makes FT-F's mandatory
   `modality × method` admission check validate a declaration that is false, the one thing a closed
   vocabulary exists to prevent — or the job is inexpressible on the fabric while remaining
   trivially performable off it. Both outcomes are worse than a row.

**Decided: `audio-to-audio` lands.**

### 3.3 It lands on its own axes, not by symmetry

Two of its four columns differ from the diffusion rows, and the differences are the substance of
this decision rather than a footnote to it.

| Axis | Value | How it differs from `text-to-audio` |
|---|---|---|
| `data_planes` | `media(audio)` | **Same token, different corpus shape.** Both sides of a training pair are KMI assets; there is no caption side at all. The token names the plane, and the plane is the same one — which is why the pairing distinction is carried in `description`, not by inventing a plane notation the other four rows do not use. |
| `typical_base` | RVC, so-vits-svc, Demucs | **Not foundation models.** The other rows name large pretrained bases; these are small task-specific architectures. That is a real asymmetry and it is what sets the next column. |
| `typical_method` | `full\|lora` | **`full` leads.** Where `text-to-image` and `text-to-audio` put `lora` first because the base is large and adapters are the economical route, an audio-to-audio base is small enough that full training is the common case, with `lora` reserved for the diffusion-based enhancement and conversion models. Ordering here is informative, but it is the honest ordering. |
| `description` | Audio transformation — voice conversion, source separation, enhancement; paired audio→audio (KMI audio) training data, no caption side | Names the absent caption side explicitly, so a reader does not infer the diffusion shape from the neighbouring row. |

### 3.4 The paired corpus needs no new gate — checked, not assumed

Both sides of an `audio-to-audio` pair are KMI assets, so a job references them through
`dataset.media[]`. §4.2's effective egress class is "the *most restrictive* egress class across
**all** its training data — every knowledge record, **every media asset**, and every
`dataset.records[]` file … and the base-model entity's own egress class". Input and target audio are
both media assets, so both are already inside that union and the most-restrictive rule already
covers the case where a target stem is `local-only` and its input is not. §4.3's license/trust
lineage takes the same union.

**So no clause of §4 moves for either row.** This was checked against §4.2's text rather than
inferred from the fact that the rows are additive.

---

## 4. What is deliberately **not** minted

Recorded so a later reader can tell an omission from a decision.

- **No `text-to-speech` row.** TTS is caption→audio on the same plane with the same methods, and
  the upstream taxonomies that split it (Hugging Face's `text-to-audio` vs `text-to-speech`) split
  on *pipeline routing*, which is a provider concern, not on anything §3.1 measures. Splitting later
  is additive and cheap; unsplitting is not, because §3.1's tokens are **immutable once published**.
  The trigger that would force the split: a provider whose admission check must accept a method or a
  base for one and refuse it for the other — at which point the two rows differ on a column §3.1
  actually carries.
- **No `audio-text-to-text` row.** Audio *understanding* — transcription, captioning, audio QA — is
  the fourth member of the `…-text-to-text` family and is a genuine gap. It is **not** minted here
  because nothing has asked for it: no participant in [`../../ECOSYSTEM.md`](../../ECOSYSTEM.md)
  §2 is waiting on it, and §5's forward-declaration standard below is that a row is worth
  contracting when a named provider needs the vocabulary. The trigger: the first consumer that does.
- **No `audio` plane.** Ruled out by §3.1's own sentence and unnecessary by §1.
- **No row in [`../../registry/media-types.tsv`](../../registry/media-types.tsv).** Per §1's
  correction — `audio/*` is IANA's, not koine's to mint.

---

## 5. Who these rows are for — a forward declaration, not an oversight

A modality nobody can train today is still worth contracting when a named provider is waiting on
the vocabulary. Both of these are. Roles below are read from
[`../../ECOSYSTEM.md`](../../ECOSYSTEM.md) §2's role map, which is informative and shape-level; the
statement of what each repo must do is [§6](#6-where-the-rows-land) and the separate downstream
report.

| Participant | Role (ECOSYSTEM §2) | Which row, and why |
|---|---|---|
| **formant** | consumer, provider planned — "Audio-plugin/instrument IDE; routes model calls through the provider-router and fine-tuning through KFT" | **Both.** An instrument IDE is the caption→instrument-render case (`text-to-audio`) and the tone/voice-conversion and stem-separation case (`audio-to-audio`) in one product. formant's `KftModality` is required by its own tasklist to be a **verbatim mirror** of this enum, so it is blocked on the rows existing — it cannot honestly mirror an enum that lacks them. |
| **lugh** | provider — the narrow, **local-only** `finetune` provider for containment-gated (`synthetic` / `personal`) training data | **`audio-to-audio` especially.** Its typical corpus is a user's own recordings, which classify `personal` and commonly carry `egress: local-only`. §4.2 then makes the run `local-only`, which under §4.2's placement rule **MUST** execute on local/in-tier compute — i.e. routes to lugh and not to the general trainer. This row's most common real corpus is one only lugh can take. |
| **agora** | host — the **general** KFT trainer | **Both**, as the all-`exportable` case. Also the party for whom `typical_method` is not decorative: FT-F's admission check is the general trainer's, and a token it does not recognise is a refusal. |

So: **not an oversight.** If a later reader finds a row with no implementation behind it, the answer
is that the contract was published ahead of the provider deliberately, for the three participants
named above, and this paragraph is the record of that choice.

---

## 6. Where the rows land

Intent for the edit that follows this page, not a record of it:

| Surface | What changes |
|---|---|
| [`../../registry/enums/modality.tsv`](../../registry/enums/modality.tsv) | Two rows appended, existing five-column shape unchanged. |
| [`../../registry/README.md`](../../registry/README.md) | Its `enums/modality.tsv` bullet enumerates the five tokens in prose — a fourth statement of the vocabulary, and it goes stale silently. |
| [`../../specs/fine-tuning.md`](../../specs/fine-tuning.md) §3.1 | Two rows in the modality table, plus a changelog entry recording both additions **and** the reasoning of §3.2/§4 above. |
| [`../../schemas/finetune-job.schema.json`](../../schemas/finetune-job.schema.json) | `properties.modality.enum` — verified against the TSV, never assumed to follow it. |

Three statements of one vocabulary that can disagree is the drift `node scripts/check-registry.mjs`
and `node scripts/check-doc-integrity.mjs` exist to catch; the registry README's prose list is a
fourth and **no guard checks it**, which is the same hazard `CLAUDE.md` records for the *Current
state* prose.

A normative vocabulary change re-enters validation rather than riding the existing status, and
neither of these rows closes a gate.

**Landed** at **KFT 0.7.0** (2026-08-27) in all four surfaces above; the spec's own header and its
0.7.0 changelog entry are the record, and this page remains the *reasoning*, not a status mirror.
Status stayed **Candidate**, both standing gates were restated and neither moved, and the two
tokens are recorded in *Pressure test* as **unexercised vocabulary** — no pass or leg walks an audio
job — rather than as a third gate.
