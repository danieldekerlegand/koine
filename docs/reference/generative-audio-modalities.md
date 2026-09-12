# The generative-audio modalities — what `text-to-audio` and `audio-to-audio` are, and why both land

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

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

**Second verdict, added 2026-09-12 — the third row.** [§4](#4-what-is-deliberately-not-minted)
declined an `audio-text-to-text` row in 2026-08 and published the condition that reverses the
decline. That condition has since been met. [§7](#7-the-audio-text-to-text-ask-the-trigger-fired-2026-09-12)
reads the ask against the trigger **as written**, checks the row against the columns §3.1 actually
carries rather than admitting it on the trigger alone, and **ratifies** it. §4's bullet is left
standing as the record of the decline; deciding what to land and landing it remain separate acts,
so the four-surface edit is **not** in this publication.

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
  — **Answered 2026-09-12: the trigger fired and the row is ratified. See
  [§7](#7-the-audio-text-to-text-ask-the-trigger-fired-2026-09-12).** This bullet is left as
  written; it is the dated record of the decline, not a statement of the current vocabulary.
- **No `audio` plane.** Ruled out by §3.1's own sentence and unnecessary by §1.
- **No row in [`../../registry/media-types.tsv`](../../registry/media-types.tsv).** Per §1's
  correction — `audio/*` is IANA's, not koine's to mint.

---

## 5. Who these rows are for — a forward declaration, not an oversight

A modality nobody can train today is still worth contracting when a named provider is waiting on
the vocabulary. Both of these are. Roles below are read from
[`../../ECOSYSTEM.md`](../../ECOSYSTEM.md) §2's role map, which is informative and shape-level; the
statement of what each repo must do is [§6](#6-where-the-rows-land) and the separate
[downstream notice](generative-audio-modalities-downstream.md), which carries the per-repo actions
as findings **AUD-1…AUD-6**.

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

**And `audio-text-to-text` landed at KFT 0.8.0** (2026-09-12), in the same four surfaces, on the
verdict in [§7](#7-the-audio-text-to-text-ask-the-trigger-fired-2026-09-12) below — **appended,
never inserted**, because §1 of the [downstream notice](generative-audio-modalities-downstream.md)
records that the four statements are equal *including order* and that a mirror may index
positionally. `registry/entity-types.tsv` again needed no edit and was checked rather than assumed
(the `model` row's `refinement_enum` is a **path**). Status stayed **Candidate**, all three counts
were restated and none moved, and the token is recorded in *Pressure test* as **unexercised
vocabulary** exactly as the first two were — with one difference this time: the leg it re-enters
validation on already exists and reserved the slot.

---

## 7. The `audio-text-to-text` ask — the trigger fired (2026-09-12)

[§4](#4-what-is-deliberately-not-minted) declined this row and, unusually, published the condition
that would reverse the decline. This section reads the ask against that condition, decides, and
records the decision **in the same document as the decline** so a later reader meets both in one
place.

### 7.1 What was asked, by whom, and when

**The asker is named by role.** This repo is public and its rows are role-scoped and
product-agnostic by design ([`CLAUDE.md`](../../CLAUDE.md): *write clauses against roles, never
against a named product*), so the ask is recorded as a role from
[`../../ECOSYSTEM.md`](../../ECOSYSTEM.md) §2 and not as a repository. The asker holds the
**specialized `finetune` provider** role — the narrow, **local-only** trainer for containment-gated
(`synthetic` / `personal`) training data, listed in ECOSYSTEM §2's *Fine-tuning role assignments*
and already named in [§5](#5-who-these-rows-are-for-a-forward-declaration-not-an-oversight)'s table
as the participant `audio-to-audio` was published ahead of.

| | What was asked |
|---|---|
| **When** | A written proposal dated **2026-08-25**, held as `docs/reference/koine-audio-modality-proposal.md` in that provider's own tree. |
| **What** | One token — **`audio-text-to-text`** — on [KFT §3.1](../../specs/fine-tuning.md)'s `modality` table. |
| **At which methods** | **`lora` / `qlora`**. `sft` is **deliberately not asked for**: both of that provider's backends implement LoRA SFT, so a full-weight supervised path is not one it can honour and asking for it would put a column in the table no implementation stands behind. |
| **What stands behind it** | A capability probe, a tested audio processor, a declared memory profile, and an **Apache-2.0** anchored base **already committed** behind a row it cannot reach. Ratification day is enumerated there as *one edit in one file*. |

**This is the first citation of that proposal in this repo.** Checked before writing:
`grep -rn 'koine-audio-modality-proposal'` over this tree matched exactly one line — the
[`../../ROADMAP.md`](../../ROADMAP.md) row that records the ask — and no spec, registry, schema or
reference page cited it at all. A proposal nobody upstream has written down is indistinguishable
from one nobody read, which is the failure this subsection exists to close.

**One correction to the enumeration above.** *Ratification day is one edit in one file* is the
**provider's** count of its own work, and it is right about that. It is not koine's: here the
vocabulary has [four statements](#6-where-the-rows-land) and a
status mirror behind them.

### 7.2 The trigger, quoted and applied

§4's bullet, verbatim:

> **No `audio-text-to-text` row.** Audio *understanding* — transcription, captioning, audio QA — is
> the fourth member of the `…-text-to-text` family and is a genuine gap. It is **not** minted here
> because nothing has asked for it: no participant in `ECOSYSTEM.md` §2 is waiting on it, and §5's
> forward-declaration standard below is that a row is worth contracting when a named provider needs
> the vocabulary. The trigger: the first consumer that does.

The bullet states **three** things and the verdict follows from reading each, not from preferring
an outcome:

| Clause as published | Reading on 2026-09-12 |
|---|---|
| *"nothing has asked for it"* | **False now.** A written, dated ask exists (§7.1). It is specific to a token, a table and a method pair rather than a wish for audio support. |
| *"no participant in ECOSYSTEM §2 is waiting on it"* | **False now.** The asker holds an ECOSYSTEM §2 role, and the same role §5's table already records as waiting on `audio-to-audio`. The row it is waiting on has changed; the fact of waiting has not. |
| *"a row is worth contracting when a named provider needs the vocabulary"* (§5's standard) | **Met, and over-met.** §5's bar is a named provider *needing the vocabulary*; the evidence here goes past the bar to a committed implementation. |

**What the trigger does not say, checked so the bar is not raised retroactively.** It does not
condition on an implementation existing — [§5](#5-who-these-rows-are-for-a-forward-declaration-not-an-oversight)
is explicit that *"a modality nobody can train today is still worth contracting"* and that the
contract is published **ahead of** the provider on purpose. So the probe, the processor, the memory
profile and the committed base are **corroboration, not the qualification**. Had the ask arrived
with none of them it would still have fired this trigger. Recording that matters: a trigger that
silently gains conditions on the day it fires is not a trigger.

**What the ask is blocked on, and why it blocks an arm rather than a combination.** Until koine
answers, an audio-understanding job at that provider is refused **`unknown-modality`** at the
*vocabulary* gate. That gate runs **before** §4.2's placement gate, before the base anchor and
before the capability probe — so the refusal is not one unsupported `modality × method` pair
falling out of [§8.1](../../specs/fine-tuning.md)'s graded routing, it is the whole
audio-understanding arm being unreachable. **Ratifying the row is koine's act; adopting the release
is the provider's**, and only the first of those is blocked on this page.

**The trigger has fired.**

### 7.3 The row is checked against the columns §3.1 carries — the trigger says *when* to decide, not *what*

A fired trigger obliges a decision; it does not make the decision. The row is therefore put through
the same three questions §1–§3 put the first two rows through.

- **Does it need a new plane?** No — and this is §1's question, which §3.1 answers in its own
  sentence (*a new modality adds a row plus a capability variant, never a new plane*). The row's
  data-plane port is **knowledge (KGP) + media (KMI audio)**, the same pairing
  `image-text-to-text` and `video-text-to-text` already carry, with the audio side resting on the
  four independent places [§1](#1-the-plane-verified-rather-than-asserted) verified KMI already
  carries audio.
- **Does it differ from every published row on a column §3.1 actually carries?** This is the bar
  §4's `text-to-speech` bullet sets, applied to an addition rather than a split. Yes, twice over:
  it differs from `image-text-to-text` / `video-text-to-text` on the **Data-plane port** column and
  on **Typical base**, and from `text-to-audio` / `audio-to-audio` on the **Data-plane port** column
  — those two are `media (KMI audio)` alone, this one also consumes knowledge. It also differs on
  the thing `modality` names: §3.1 says the token names *what a training run adapts a model to
  **be***, and this run adapts a model to **emit text**.
- **What does a job do today without the token?** Exactly what §3.1's own argument for
  `audio-to-audio` describes, one step worse. It must declare `text-to-audio` — false, and the
  direction is reversed, not merely imprecise — which makes **FT-F**'s mandatory admission check
  *validate a declaration that is false*; or it is refused `unknown-modality` and the arm is
  blocked. There is no near-miss token that is merely coarse.
- **Does a clause of §4 move?** Checked against §4's text rather than inferred — the discipline
  [AU-2](../../scenarios/kft-audio-modalities.md) exists to enforce, after §3.1's *"neither row
  moves a clause of §4"* turned out to be true of §4.2/§4.3/§4.1.1 and **false of §4.1**. For this
  row the answer is **no**, and for a reason that is the reverse of `audio-to-audio`'s: its corpus
  is a paired **asset + text** corpus, which is precisely the shape §4.1's **FT-I** bullet names
  (*"a row references both a KMI `asset` id **and** its text"*). §4.2's effective-egress union and
  §4.3's license/trust union reach `dataset.media[]` and `dataset.knowledge[]` already. The row
  lands on the side of §4.1 that **carries**.
- **One consequence for an open finding, recorded rather than left to be found.** FT-I's bullet
  carries the shape but **enumerates** its members — *"every image/video-text-to-text (and the
  caption side of text-to-image)"*. That closed enumeration is the defect
  [AU-1](../../scenarios/kft-audio-modalities.md) is filed against. A third `…-text-to-text` member
  therefore **widens AU-1's fold from two rows to three**; it does not open a new delta, because it
  is the same sentence and the same defect. AU-1 stays blocking and stays unowned.

### 7.4 The asymmetry, weighed before the verdict — not after

§3.1 fixes three properties of this vocabulary and all three bear on the decision: it is **closed**,
it is **additive** (a row plus a capability variant, never a new plane), and its tokens are
**immutable once published** — *a change is a new token, never an edit in place*, the same
discipline as a relation signature.

So **minting is cheap and unminting is impossible**, and the real question is not *is the row
useful* but **is one token the right grain**.

- **Against one token:** transcription, captioning and audio QA are three tasks, and a later
  provider could need them apart.
- **For one token, which is the decided reading:** it is the grain the family already uses.
  `image-text-to-text` covers captioning, VQA and OCR under one row; `text-to-audio` covers music,
  SFX and TTS under one row, on the reasoning of §4's `text-to-speech` bullet — the upstream splits
  are *pipeline routing*, a provider concern, not anything §3.1 measures. Splitting
  `audio-text-to-text` later is **additive and cheap**; having minted three tokens that collapse is
  not undoable.
- **The split trigger is restated so the next reader meets a condition rather than a silence**, in
  the same terms §4 gave TTS: a provider whose admission check must accept a **method** or a
  **base** for one of transcription / captioning / audio QA and refuse it for another — at which
  point the rows differ on a column §3.1 carries, and a further token is the additive move.
- **The cost of being wrong, each way.** Minting a row no one ends up training costs a dead row —
  a risk class §5 accepts *by design*, since it publishes contracts ahead of providers. Declining
  costs the arm (§7.2) and leaves FT-F validating a false declaration for anyone who works around
  it. The asymmetry runs toward minting, and the immutability constraint is answered by the grain,
  not by delay.

### 7.5 Verdict — **ratify**, and the landing is a separate act

**`audio-text-to-text` is ratified into KFT §3.1's `modality` vocabulary**, at **`lora` / `qlora`**
as asked, on a **knowledge + media (KMI audio)** data-plane port, as the fourth member of the
`…-text-to-text` family. The trigger §4 published has fired (§7.2), the row is distinguishable on
columns §3.1 carries and moves no clause of §4 (§7.3), and one token is the right grain with its
split condition stated (§7.4).

Three things are stated here rather than left to be derived at landing:

1. **`typical_method` is *typical*, not the admission set.** §3.1's fourth column informs; **FT-F**
   is the gate — a provider **MUST** validate the `modality × method` combination and the base
   architecture at admission and reject an incompatible request with a report, before compute is
   committed. `lora / qlora` is recorded as asked *and* as decided: it is what the asker can honour
   and what both sibling rows already carry, so no column in this table stands behind an
   implementation that does not exist.
2. **The landing is not this publication.** Deciding what to land and landing it are separate acts
   — the split this page opens with, borrowed from
   [`federation-fold-dispositions.md`](federation-fold-dispositions.md). The edit touches the
   [four statements of one vocabulary](#6-where-the-rows-land) §6 enumerates, of which one — the
   registry README's prose list — **no guard checks**.
3. **The version move, with its reasoning, belongs to the landing.** By the **0.7.0 precedent** a
   new `modality` token is a KFT **minor**: §3.1's table is normative surface a reader implements
   against, and a new admissible token widens what a conformant provider must recognise. It is
   **additive** — nothing conformant at 0.7.x stops conforming — so the status does not move for
   that reason, and a normative vocabulary change **re-enters validation** rather than riding the
   existing status. **The row closes no gate**, and it has a leg to re-enter validation on that the
   first two rows did not: [`kft-audio-modalities.md`](../../scenarios/kft-audio-modalities.md),
   which was written for exactly that and says so.

### 7.6 Landed — KFT 0.8.0, 2026-09-12

The act §7.5 held separate has been performed, the same day and by the next story of the same
tasklist. Recorded here so this page does not stop one step short of the thing it decided.

- **The token is in all four statements** §6 enumerates —
  [`../../registry/enums/modality.tsv`](../../registry/enums/modality.tsv) (8 rows),
  [KFT §3.1](../../specs/fine-tuning.md)'s table (8 rows),
  [`../../schemas/finetune-job.schema.json`](../../schemas/finetune-job.schema.json)'s
  `properties.modality.enum` (8 tokens), and
  [`../../registry/README.md`](../../registry/README.md)'s unguarded prose bullet — **equal
  including order**, which was proved by diffing the TSV's first column against the schema enum
  rather than by reading them side by side.
- **Appended, never inserted.** §1 of the [downstream notice](generative-audio-modalities-downstream.md)
  records that a mirror may index positionally, so the family grouping this row belongs to is a
  *semantic* fact and file order is a *compatibility* one. The 0.7.0 landing appended for the same
  reason.
- **`registry/entity-types.tsv` was checked, not assumed.** The `model` row's `refinement_enum` is
  the **path** `enums/modality.tsv`, so it picks up a new token by resolving and needed no edit.
  `registry/media-types.tsv` does not move either: it registers only the types koine *mints*.
- **KFT 0.7.1 → 0.8.0, minor, status unchanged.** The reasoning §7.5 point 3 stated, applied: §3.1's
  table is normative surface, a new admissible token widens what a conformant provider must
  recognise, and nothing conformant at 0.7.x stops conforming. All three of KFT's counts are
  restated and **none moves**; the three status mirrors moved with the header and
  `check-doc-integrity.mjs` was run to prove it.
- **The row is unexercised vocabulary and says so in *Pressure test*** — the same reading 0.7.0's
  two rows were given, so it may not be cited in a re-ratification until a pass walks an
  audio-understanding job. It adds **no fourth count**: the leg
  [`kft-audio-modalities.md`](../../scenarios/kft-audio-modalities.md) reserved this slot in
  advance, and the one open delta the row touches — **AU-1**, whose defect is that §4.1's FT-I
  bullet *enumerates* its members — widens from two rows to three on the same sentence. KFT's third
  condition **widens in scope**; it does not gain a sibling.
- **What is not koine's, stated so it is not mistaken for done.** The provider's adoption is its
  own act under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), and the other two
  mirrors of this enum have their own drift gates; what each must do is
  [§10 of the downstream notice](generative-audio-modalities-downstream.md). And the token is not
  yet *exercised*: that needs a pass on the leg above **and** its KCS encoding (**DR-14**, still
  unowned and downstream).
