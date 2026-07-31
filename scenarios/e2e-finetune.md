# Scenario: Fine-tune across participants (KFT pressure test)

**Purpose:** stress-test [`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT 0.1.0)
against two concrete finetune jobs crossing multiple participants and modalities, deliberately
hunting for seam bugs **before** it leaves Draft. Same method as the media pressure test
([`e2e-media-transform.md`](e2e-media-transform.md)): each step marks what *held* and what
*broke*; §Findings collects the deltas and flags which block promotion to Candidate. KFT composes
four ratified planes, so the hunt is specifically at the seams KFT *adds* — the egress gate, model
identity, and the model/weight artifact conventions.

**The stories.** Two jobs submitted to the finetune capability in the same week:

- **Job 1 (world producer + identity authority):** finetune `Qwen2.5-3B-Instruct` into an SLM that authors Prolog
  rules, on rejection-sampled Alderforest world data. The corpus is mostly `curated`/`exportable`
  verbalizations — but includes a handful of **player-authored** rules marked `personal` /
  `local-only`. Deliver as GGUF, registered and composable.
- **Job 2 (media producer + knowledge producer):** a `text-to-image` LoRA for generating
  plugin-skin art, trained on the knowledge producer's reference **image assets** (KMI), base
  `FLUX.1-dev`. Deliver as an invocable capability so the media producer's designer agents can
  drive it.

**Setup:** manifests for the general finetune provider (`provider:org:trainer`), the identity
authority `refkb` (KGP producer + resolver), the knowledge producer `analyzer` (KMI authority),
and the host-provisioned registry are published (KCB §3). All are KINP entities.

---

## Step 1 — Admission & path planning (KCB §2/§3; KFT §2/§3)

The registry routes each job to a `finetune` provider whose capability accepts the job's
`modality` (§2). Job 1 → a text-generation provider; Job 2 → an image provider.

✅ **Held:** modality-typed capability variants route correctly; the job manifest (§3) carries base
model, method, dataset refs, and export targets by reference — nothing inlined.

🔴 **BROKE (FT-F).** Job 2 is submitted with `method: dpo` (a copy-paste from Job 1). `dpo` is
meaningless for `text-to-image`, but KFT §3.1 lists modality and method as **independent** free
fields with no compatibility contract. The job admits, a GPU is provisioned, and it fails only deep
in the engine. Cost was already committed. **Delta FT-F.**

---

## Step 2 — Base-model identity (KFT §5.1)

Both jobs name external base models: `Qwen2.5-3B-Instruct`, `FLUX.1-dev`. §3 wrote these as
`hf:model:Qwen/…`.

🔴 **BROKE (FT-G).** `hf:` is **not a KINP namespace** (KINP namespaces are the ecosystem projects),
and KFT defines no convention for anchoring an external (Hugging Face Hub) model as a fabric entity.
So the base model is not a resolvable KINP node, and the finetuned model's `derived_from` link (§5.1)
points at a dangling id — the lineage that the whole spec leans on cannot actually be minted. KINP
already has **external anchors** for exactly this (as entities anchor to Wikidata QIDs); KFT must
say a base model is a minted KINP `model` entity carrying an external anchor to its Hub coordinate.
**Delta FT-G.**

---

## Step 3 — Egress admission (KFT §4.2) — the core gate

Job 1's corpus mixes `exportable` verbalizations with one `local-only` player rule. The provider
computes effective egress = most-restrictive = `local-only`, pins the run to local MPS, and rejects
the `single-gpu-a100-80gb` cloud placement with a report.

✅ **Held — the key result.** The §4.2 gate works exactly as intended: one `local-only` record in the
training set is enough to keep the entire run off rented compute. KGP §7.2's "…or **training set**"
clause is genuinely enforced.

🔴 **BROKE (FT-B).** The gate aggregates over **training data only**. Job 2's data is all
`exportable`, so §4.2 green-lights cloud — but `FLUX.1-dev` carries a **non-commercial** base
license, and (in the proprietary-base case) a base model may itself be `local-only`. A base model's
own egress + license are load-bearing constraints that §4.2 ignores entirely; an `exportable`
dataset on a can't-leave base still must not go to cloud, and a non-commercial base forbids a
commercial output regardless of the data. The aggregation must include the **base model entity**.
**Delta FT-B.**

---

## Step 4 — The output artifact (KFT §5.3/§8)

Job 1 finishes on the local accelerator and mints GGUF weight assets (§5.3); §8 registers the
finetuned model in the discovery registry.

🔴 **BROKE (FT-A, structural).** The model was trained on `local-only` player data and can memorize
it — but §5.3 mints the weight asset and §8 registers the model with **no egress or license carried
forward**. Nothing stops the local-only-trained GGUF from being pushed to a cloud registry or shared
cross-participant, **exfiltrating the very data the §4.2 gate protected**. §4.2 is only *half a gate*: it
governs where training *runs*, not what the *output* may do. A finetuned model + its weight assets
MUST inherit the most-restrictive egress and the union license of {training data ∪ base model}, and
that inherited egress must gate registration/publication. **Delta FT-A.**

---

## Step 5 — Spend gating (KFT §7)

Job 2's image dataset is a set of KMI asset ids fetched lazily (KMI §7). The grant carries a
`budget_units` ceiling; §7 says a run projecting over the ceiling is rejected before it starts.

🔴 **BROKE (FT-E).** The capability manifest's `cost.est_units` (§2) is **static**, but Job 2's true
GPU-seconds depend on the dataset cardinality, which isn't known until the assets are `fetch`ed. The
spend ceiling is therefore **unenforceable at invoke time** for any variable-size job — the provider
either over-reserves or discovers the overage mid-run. §7 needs an **admission-time per-job
estimate** computed after resolving dataset size (a `describe`-time quote), not just the static
manifest figure. **Delta FT-E.**

---

## Step 6 — The metrics stream (KFT §6)

The consumer `subscribe`s to progress events.

🟡 **BROKE (FT-H, cleanup).** §6 names this the **"training-exhaust"** stream — but the ecosystem
already uses "training-exhaust JSONL" for the **dataset records** (the `dataset-jsonl-header`
schema). Two different things under one name, on adjacent surfaces of the same spec. Rename
the metric stream (e.g. **training-telemetry**). Relatedly, the weight `media_type`s
(`application/vnd.koine.model+gguf`, …) and the `model` entity type + `modality` refinement (§3/§5)
are invented in prose but **not registered** in koine's shared registry (`registry/relations/media.tsv`,
entity-type vocabulary) — path-matching and validators won't know them. **Delta FT-H.**

---

## Step 7 — Re-run & reproducibility (KFT §5.2)

The authority re-runs Job 1 with identical inputs to reproduce the SLM for its convergence-QA gate.

🔴 **BROKE (FT-C, structural).** KGP packs and KMI assets are **content-addressed** — same inputs →
same id, byte-reproducible; that discipline is a load-bearing fabric assumption (KGP §2.1). A
finetuned model is **not** reproducible that way: GPU nondeterminism means two identical runs produce
different weights, hence (if content-addressed) different ids — or (if minted) two unrelated model
entities with no defined relation. §5 treats a model as a fabric entity alongside packs/assets
without confronting this. KFT must state that a finetuned model id is **minted, not
content-addressed** (models are the first non-reproducible *generated* entity on the fabric), that
the **reproducibility anchor is the run** (the `job` PROV activity with pinned input ids +
seed/config), and that a re-train links to its predecessor with a lifecycle relation (a `retrains` /
`supersedes`, KINP §4). **Delta FT-C.**

---

## Step 8 — Eval (KFT §6.1)

Job 1's SLM is evaluated by a KCS scenario (`vespace-rule-gen`) in the conformance console.

🔴 **BROKE (FT-D).** The model is `local-only` (per FT-A it inherits the gate), but the console runs
it — and its eval prompts — in the console's own tier, **across the tier boundary**. That is the FT-A exfiltration
hole again, on the eval path: a local-only model's eval MUST run in-tier, and eval data carries its
own egress class. §6.1 invokes eval with no egress awareness. **Delta FT-D.**

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **FT-A** | **High (structural)** | The §4.2 egress gate governs training *placement* but not the *output*; a local-only-trained model can be published, exfiltrating the gated data. | Finetuned model + weight assets **inherit** the most-restrictive egress + union license of {data ∪ base}; inherited egress gates registration/publication (§8). | KFT §4.2/§5.3/§8 |
| **FT-B** | **High** | §4.2 aggregates training-data egress only; ignores the **base model's** own egress + license (e.g. FLUX non-commercial, a proprietary/local-only base). | Effective egress + license aggregate over training data **and the base model entity**. | KFT §4.2/§4.3 |
| **FT-C** | **High (structural)** | Models are treated like content-addressed packs/assets, but training is nondeterministic — identical inputs ≠ identical model id, and re-runs have no defined relation. | Model id is **minted, not content-addressed**; reproducibility anchor = the run (PROV activity + pinned inputs + seed); re-train links via `retrains`/`supersedes`. | KFT §5.1/§5.2 |
| **FT-D** | Med | Eval (§6.1) invokes a (possibly local-only) model + eval data across the tier boundary in the console — exfiltration on the eval path. | Eval of a local-only model runs **in-tier**; eval data carries its own egress class. | KFT §6.1 |
| **FT-E** | Med | Static `cost.est_units` can't gate a variable-size (lazily-fetched) dataset; the spend ceiling is unenforceable at invoke. | Provider computes an **admission-time per-job estimate** after resolving dataset cardinality; ceiling checked against that. | KFT §7 |
| **FT-F** | Med | `modality` and `method` are independent free fields; an incompatible combo (dpo × text-to-image) admits and fails late, after spend. | Provider validates modality×method (and base-arch) compatibility **at admission** and rejects with a report. | KFT §3.1 |
| **FT-G** | Med (structural-ish) | `hf:model:…` is not a KINP namespace; no convention anchors an external (Hub) base model, so `derived_from` dangles. | External base models are minted KINP `model` entities carrying an **external anchor** to their Hub coordinate (as entities anchor to QIDs). | KFT §5.1 |
| **FT-H** ✅ resolved | Cleanup | "training-exhaust" collides with the dataset-records name; weight media types + `model` entity type + `modality` unregistered. | Rename the metric stream (**training-telemetry**, KFT 0.2.0 §6); **register** the model media types ([`../registry/media-types.tsv`](../registry/media-types.tsv)), the `model` entity type ([`../registry/entity-types.tsv`](../registry/entity-types.tsv)), the `modality` enum ([`../registry/enums/modality.tsv`](../registry/enums/modality.tsv)), and the `retrains` model-lineage relation ([`../registry/relations.tsv`](../registry/relations.tsv)) — landed in koine:20. | KFT §6/§3.1/§5, `registry/` |

---

## Schema conformance — what the (downstream) validator must enforce

The machine-readable job manifest is [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
(draft-2020-12); its golden positive example is [`../schemas/fixtures/finetune-job.json`](../schemas/fixtures/finetune-job.json),
which validates green. Per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) the `ajv`/`jsonschema`
validators and the conformance CI for this manifest are built **downstream**, not in koine — koine
ships only the contract plus that one golden fixture.

Structural validation (draft-2020-12) catches shape errors — a missing required field (`compute`,
`base_model`, …), a bad `modality`/`method`/`compute.egress` enum value, an empty `dataset` (neither
`knowledge` nor `media`). It **cannot**, by construction, catch the finetuning-specific *semantic* rules
this pressure test surfaced. Two negative cases the validator/admission step MUST reject that the
schema alone will pass:

1. **Incompatible `modality × method` (FT-F).** A job that is structurally valid but pairs
   `"modality": "text-to-image"` with `"method": "dpo"` MUST be rejected **at admission** with a report,
   before compute is committed — the enums are each individually legal, so only the compatibility contract
   (§3.1) rejects it. `dpo × text-to-image` is the canonical negative fixture.
2. **A cross-boundary `compute.class` under a `local-only` effective egress (FT-B / §4.2).** A job whose
   `{data ∪ base}` aggregates to `local-only` but requests a rented `compute.class`
   (e.g. `single-gpu-a100-80gb`) MUST be rejected (or repinned to local) — even when
   `compute.egress` is the permissive default `derived`, because the effective egress is computed from the
   referenced records, not asserted in the manifest.

Both are behavior of the provider's admission path, driven by the registry vocabulary
([`../registry/enums/modality.tsv`](../registry/enums/modality.tsv)) and the KGP §7.2 aggregation — the
schema's job is only to guarantee the manifest is well-formed enough for that step to run.

---

## Verdict

The **core gate holds where it fires** (Step 3): a single `local-only` record keeps a whole run off
rented compute — KGP §7.2's training-set clause is real, and that is the result worth keeping. But
the pressure test shows §4.2 is only **half a gate**, and models strain the fabric's content-address
assumption:

- **FT-A / FT-D** — the gate governs *training placement* but neither the *output model* nor the
  *eval path*, so gated data leaks back out through the weights. This is the one that most threatens
  the thesis: a privacy gate you can walk around is not a gate.
- **FT-B** — the base model's own egress/license must be in the aggregation, or non-commercial /
  can't-leave bases escape.
- **FT-C** — a finetuned model is the first **non-content-addressed generated entity**; the spec must
  say so and move reproducibility to the run.

**Blocking for Candidate: FT-A, FT-B, FT-C.** Should-fix before/at Candidate: FT-D, FT-E, FT-F, FT-G.
Cleanup: FT-H. None require redesign — forward-propagate the gate (A/D), widen the aggregation to the
base (B), add a minted-identity + `retrains` rule (C), a per-job estimate (E), an admission
compatibility check (F), an external-anchor convention (G).

> **Resolution (2026-07-22):** deltas FT-A…FT-H folded into **KFT 0.2.0** (§4.2 base-model +
> output-inheritance, §4.3 base license, §5.1 minted identity + external anchor, §5.2 run-as-anchor
> + `retrains`, §5.4 output egress/license inheritance, §6 rename to *training-telemetry*, §6.1
> in-tier eval, §7 admission-time estimate, §3.1 compatibility check, registry note). KFT is now
> **Candidate**, pending ecosystem-owner ratification and a second (fully-multimodal) pressure pass.
> This document is the record of what the pressure test found.
