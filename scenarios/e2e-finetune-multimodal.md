# Scenario: Multimodal fine-tune, multi-provider (KFT second pressure pass)

**Purpose:** the second pressure pass KFT 0.2.0 called for before ratification — stress
[`../specs/fine-tuning.md`](../specs/fine-tuning.md) against **fully-multimodal** finetunes
(image-text-to-text, text-to-video) whose data is KMI assets, **and** against the **multi-provider**
topology now decided (a runtime commons hosts a **general** `finetune` provider; a specialist
participant exposes **its own specialized** `finetune` provider; the registry routes between
them). Same method as
[`e2e-finetune.md`](e2e-finetune.md): mark what held / broke; §Findings collects deltas; delta
labels continue at **FT-I**. This pass deliberately hunts the seams the text-only pass could not
reach.

**The stories:**

- **Job 3 (knowledge producer):** finetune a `Qwen2.5-VL` into a media-understanding model
  (`image-text-to-text`) on **paired** samples — each is one KMI screenshot asset + its caption/QA text.
- **Job 4 (world producer + knowledge producer):** a `text-to-video` LoRA (base `Wan2.2`) on
  world-producer gameplay **video assets** (KMI, carrying `source_world`), for stylized world trailers. Large corpus; some clips are
  **player-recorded** and `local-only`.

**Setup:** two `finetune` providers publish manifests (KCB §3) — a general trainer (accepts all
modalities via LLaMA-Factory/diffusers) and a specialized trainer (a TRL+PEFT path for small
language models on local accelerators). The knowledge producer `analyzer` is the KMI authority for
the training assets.

---

## Step 1 — Provider discovery & selection (KFT §8/§9; KCB §3)

A text-generation sibling of Job 3 is submitted. It matches **both** providers' `finetune`
capabilities (both accept `text-generation`).

🔴 **BROKE (FT-K).** KFT §9 says the registry "routes a job to a provider that accepts its modality"
— but two providers accept it, and KCB §3 path search only "prefers zero-`cost` routes." Both have
real GPU cost; there is **no tiebreak** for *which finetune provider* wins, and no way for a caller
to say "use the specialized SLM path for this one." Selection is undefined the moment more than
one provider exists — which the multi-provider decision guarantees. **Delta FT-K.**

---

## Step 2 — VLM paired training data (Job 3; KFT §3/§4.1)

Job 3's samples are **pairings**: screenshot asset `analyzer:asset:blake3-s1…` ⟷ "What UI state is
shown?". The job manifest (§3) carries `dataset.knowledge[]` and `dataset.media[]` as **separate
arrays**.

🔴 **BROKE (FT-I, structural).** Separate corpus arrays lose the **per-sample alignment** — which
image goes with which text. Every multimodal modality (image/video-text-to-text, and the caption
side of text-to-image) is trained on *pairs*, not two independent bags. KFT has no structure for the
join. The pairing must live in the **training records** (the `dataset-jsonl-header`'d rows, koine:10)
— a row referencing *both* a KMI `asset` id and its text — and §3/§4.1 must say the `knowledge`/`media`
arrays are the *referenced corpora* while the per-sample pairing rides the records. As written, "full
multimodal" cannot express its most basic sample shape. **Delta FT-I.**

---

## Step 3 — Egress pin meets capacity (Job 4; KFT §4.2)

Job 4's corpus includes `local-only` player clips → effective egress `local-only` → §4.2 pins the run
to local compute. But `text-to-video` diffusion training needs an 80 GB GPU; the local tier is a
36 GB Mac.

🔴 **BROKE (FT-J).** The gate correctly refuses cloud (✅ the §4.2 rule fires) — but it pins the job to
a tier that **cannot run it**. §4.2 defines the *refusal* but not the outcome when the pinned tier is
**infeasible**: nothing says the provider must fail-with-report rather than hang, silently cloud-place
(a privacy breach), or silently downscope the data. An egress pin can be *unsatisfiable*, and the
spec must define that as an admission failure with a report. **Delta FT-J.**

---

## Step 4 — Progress previews (Job 4; KFT §6)

The consumer `subscribe`s. A diffusion run's signal is not a scalar loss curve — it is **sample
previews** (a grid of generated frames each N steps), the only way to judge a generative finetune.

🟡 **BROKE (FT-L, cleanup).** The training-telemetry event (§6) carries a scalar `metrics` map + an
optional `checkpoint` asset — **no channel for sample-preview assets**. A generative run can't stream
what matters. Additive fix: allow `samples: [<asset id>]` on the telemetry event (preview images/clips
are KMI assets like any other, fetched lazily). **Delta FT-L.**

---

## Step 5 — Weights, export & inheritance (Job 4; KFT §5.3/§5.4)

The `text-to-video` LoRA is minted as a `safetensors` KMI asset; `variant_of` lineage records its
exports. Trained on `local-only` clips, it inherits `local-only` (§5.4).

✅ **Held.** Weight-as-KMI-asset + lineage composes cleanly for a media model exactly as for a text
model; the §5.4 inheritance correctly marks the LoRA `local-only`, so it cannot be pushed to a shared
registry. The FT-A fold does its job on a media-trained model — the key multimodal result.

---

## Step 6 — Composability of the finetuned media model (KFT §8)

The finetuned VLM (Job 3) registers and advertises a capability: `produces` a `knowledge` port
(captions/answers) from a `media` input port (images).

✅ **Held.** A finetuned media model is a first-class capability provider — discoverable and
path-searchable (KCB §2.1/§3), so it slots straight into the any-to-any graph. Multimodal fine-tuning
*feeds* capability composition, as intended. Base-license aggregation (Wan2.2 terms) also holds now
(FT-B fold).

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **FT-I** | **High (structural)** | `dataset.knowledge[]`/`media[]` are separate bags; per-sample image↔text alignment — the basic shape of every multimodal finetune — is inexpressible. | Per-sample pairing rides the `dataset-jsonl-header` training records (a row referencing both a KMI asset id and text); §3/§4.1 name the arrays as referenced corpora, records carry the join. | KFT §3/§4.1, koine:10 header |
| **FT-J** | Med | An egress pin (§4.2) can be **unsatisfiable** — the local tier can't run the job — with no defined outcome (hang / silent cloud / silent downscope all wrong). | An unsatisfiable egress-pinned placement is an **admission failure with a report**, never a silent downgrade. | KFT §4.2 |
| **FT-K** | Med | With two+ `finetune` providers (a general one plus a specialized one), provider selection is undefined; KCB cost-prefs don't disambiguate; caller can't target one. | Registry tiebreak: prefer the more **specialized**, then lower cost; the job MAY name a target provider; ties surface to the caller. | KFT §8/§9, KCB §3 |
| **FT-L** | Cleanup | Telemetry (§6) carries scalars + a checkpoint, but no **sample previews** — the only meaningful signal for a generative finetune. | Allow `samples: [<asset id>]` on the telemetry event (previews are KMI assets, fetched lazily). | KFT §6 |

---

## Verdict

The **big multimodal bet pays off**: because training data is just KMI assets and a finetuned model
is just a KCB capability, `image-text-to-text` and `text-to-video` finetunes compose on the ratified
planes with **no new plane** — weights/lineage (Step 5), the egress-inheritance gate on a
media-trained model (Step 5), and composability (Step 6) all hold. That is the result that justifies
"full multimodal now."

But two seams the text-only pass couldn't reach broke:

- **FT-I** — paired-sample expression — is **structural and blocking**: without it, the profile can't
  represent the fundamental input of every multimodal finetune.
- **FT-J / FT-K** — the egress gate can pin to an *infeasible* tier, and multi-provider selection
  (which the specialized-provider decision makes unavoidable) has no tiebreak.

**Blocking for ratification: FT-I.** Should-fix: FT-J, FT-K. Cleanup: FT-L. None require redesign — FT-I
moves the join into the records (where license/tier already live), FT-J adds a defined admission
failure, FT-K adds a selection rule to the registry.

> **Resolution (2026-07-22):** FT-I…FT-L folded into **KFT 0.3.0** (§3/§4.1 paired records, §4.2
> unsatisfiable-pin failure, §6 `samples` previews, §8/§9 provider selection + specialist-as-provider
> reframe). KFT remains **Candidate**: with two pressure passes clean of *unresolved* blockers, it is
> ready for ecosystem-owner ratification sign-off. This document records the second pass.
