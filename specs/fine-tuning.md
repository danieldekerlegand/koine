# Koine Fine-Tuning Protocol (KFT)

**Spec version:** 0.3.0
**Status:** Ratified
**Last updated:** 2026-07-23
**Applies to:** agora (provider/implementation), Cuneiform (host: registry, grants, orgs),
Pinakes (specialized adapter + training-data producer), Insimul / Argos / Formant
(training-data producers + finetuned-model consumers).
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for model/entity ids, lineage
relations, and provenance; [`capability-bus.md`](capability-bus.md) (KCB 0.2.0) for the
capability shape, verbs, cost, and grants; [`grounding-pack.md`](grounding-pack.md) (KGP 0.4.0)
for knowledge training data and the egress/license/trust axes; [`media-interchange.md`](media-interchange.md)
(KMI 0.2.0) for media training data and weight/export assets;
[`conformance-scenario.md`](conformance-scenario.md) (KCS) for eval/reward.

> **A profile, not a fifth plane.** Fine-tuning does not move a new kind of data — it *composes*
> the four ratified planes into one operation: consume training data (KGP knowledge / KMI media)
> and a base-model entity (KINP), produce a new model entity (KINP) plus weight assets (KMI),
> orchestrated as a capability on the bus (KCB). KFT fixes only what is finetuning-specific — the
> `finetune` capability shape, the job manifest, the run/metrics lifecycle, and the model-artifact
> lineage conventions. Everything else is reuse. Dumb pipes: training data travels **by reference**
> (KGP pack ids, KMI asset ids), never inlined into a job.

This generalizes the real-but-siloed training harnesses already in the ecosystem — Pinakes's
`ml/` TRL+PEFT QLoRA pipelines and Cuneiform's (archived) `train.py` — and the *simulated*
finetune-job service in Cuneiform's engine, into one ratifiable contract that a shared executor
implements.

---

## 1. Scope

KFT defines:
- the **`finetune` capability** — its KCB manifest shape, ports, cost, and grants (§2),
- the **finetune job manifest** — the `invoke` payload (§3),
- **training data admission** — data-plane references and the NORMATIVE egress/license gate (§4),
- **models as entities, weights & exports as assets** — identity and lineage (§5),
- the **run lifecycle & training-exhaust stream** (§6),
- **authorization, cost & spend gating** (§7),
- **discovery** — the finetuned-model registry as reuse of the KCB registry (§8),
- the runtime split (informative, §9) and per-project mapping (§10).

KFT does **not** define: payload formats (KGP/KMI own them), engine/adapter internals or compute
provisioning (producer behavior, in agora/Cuneiform infra — §9), or reasoning semantics. It adds
no new identifier kind, no new plane, and no new transport.

---

## 2. The `finetune` capability

A training provider advertises `finetune` in its KCB capability manifest (KCB §2). Inputs and
outputs are **plane-typed ports** (KCB §2.1), so a single capability spans the entity, knowledge,
and media planes — which is exactly what fine-tuning needs (data in one plane, model out in
another):

```jsonc
{ "name": "finetune",
  "inputs": [
    { "plane": "entity",    "types": ["model"], "shape": "base-model" },              // KINP model entity
    { "plane": "knowledge", "dialect": "grounding-only", "shape": "training-set" },   // KGP data …
    { "plane": "media",     "media_types": ["image/*","video/*","audio/*"], "shape": "training-set" } // … or KMI data (multimodal)
  ],
  "outputs": [
    { "plane": "entity", "types": ["model"], "shape": "finetuned-model" },            // new KINP model entity
    { "plane": "media",  "media_types": ["application/vnd.koine.model+safetensors",
                                         "application/vnd.koine.model+gguf"], "shape": "weights" }
  ],
  "cost": { "tier": "paid", "meter": "gpu-seconds", "est_units": 1800000 }            // for spend gating (KCB delta K)
}
```

- A provider MAY advertise several `finetune` capabilities distinguished by the `modality` they
  accept (§3) — e.g. one whose media port takes `image/*` (text-to-image LoRA), one whose entity
  port takes text-generation base models. Path search (KCB §3) then routes a job to a provider
  that accepts its modality.
- `cost.meter` is `gpu-seconds` (fine-tuning's natural unit); `est_units` lets the caller gate
  spend **before** invoking (§7). Fine-tuning is the highest-cost capability class on the bus, so
  the KCB cost/grant machinery is load-bearing here, not decorative.
- Because the output finetuned model is an **entity** with produced ports of its own, a finetuned
  model is itself discoverable and composable on the bus (§8).

---

## 3. The finetune job manifest

The `invoke` payload. All data is referenced by KINP/KGP/KMI id — nothing is inlined.

```jsonc
{
  "kft_version": "0.1.0",
  "job":        "cuneiform:activity:ft-run/9f2a",          // KINP activity id — this run (PROV, §5)
  "base_model": "hf:model:Qwen/Qwen2.5-3B-Instruct",       // KINP model-entity ref
  "modality":   "text-generation",                         // §3.1
  "method":     "qlora",                                   // sft | lora | qlora | full | dpo
  "dataset": {                                             // data-plane refs (§4), never inline
    "knowledge": ["kgp:pack:sha256-7b1e…"],                // KGP GroundingPack ids
    "media":     ["argos:asset:blake3-a1b2…"],             // KMI asset ids (multimodal)
    "header":    { /* dataset-jsonl-header (koine/schemas, ported by koine:10) */ }
  },
  "hyperparams": { "epochs": 3, "lr": 2e-4, "max_seq_len": 2048,
                   "lora": { "r": 16, "alpha": 32, "dropout": 0.05,
                             "target_modules": ["q_proj","k_proj","v_proj","o_proj"] } },
  "export":  ["gguf:Q4_K_M", "safetensors-adapter"],       // requested output variants (§5)
  "compute": { "class": "single-gpu-a100-80gb", "egress": "derived" }, // egress computed from data (§4)
  "eval":    ["kcs:scenario:vespace-rule-gen", "kcs:scenario:cefr-grade"], // KCS reward/eval (§6)
  "signing": { "key_id": "…", "alg": "ed25519" }           // shared signing shape (KCB §5 / KGP §9.3)
}
```

The machine-readable twin is `koine/schemas/finetune-job.schema.json` (draft-2020-12), landing in
`koine/schemas/` alongside the artifacts koine:10 ports, and validated in agora per
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) (koine specifies, agora implements) —
**not** in koine.

### 3.1 Modality vocabulary

`modality` is a closed vocabulary shared with the model-entity `type` refinement (§5) and the
capability's port types (§2). Initial set:

| `modality` | Data-plane port | Typical base | Typical `method` |
|---|---|---|---|
| `text-generation` | knowledge (KGP) | Qwen, Llama, Mistral | sft / lora / qlora / full / dpo |
| `image-text-to-text` | knowledge + media (KMI image) | Qwen-VL, Llama-VL | lora / qlora |
| `video-text-to-text` | knowledge + media (KMI video) | Qwen-VL | lora / qlora |
| `text-to-image` | media (KMI image) | FLUX, SD3.5 | lora / full |
| `text-to-video` | media (KMI video) | Wan, LTX, CogVideoX | lora |

The vocabulary is additive; a new modality adds a row plus a capability variant (§2), never a new
plane. Argos is the KMI authority for the image/video/audio training assets these modalities
consume, so multimodal fine-tuning inherits an existing, ratified data plane rather than a new one.

`modality` and `method` are **not** independent: a provider **MUST validate** the
`modality × method` combination (and the base model's architecture) **at admission** and reject an
incompatible request — e.g. `dpo` on `text-to-image` — with a report, before any compute is
committed (FT-F). The `modality` vocabulary, the `model` entity type, and the weight/export
`media_type`s (§5.3) are registered in koine's shared registry (`registry/`, `registry/relations/media.tsv`)
so path-matching and validators recognize them (FT-H).

---

## 4. Training-data admission (NORMATIVE)

Training data is referenced, described, and **gated** by the data planes — KFT adds the rule that
turns those planes' existing axes into fine-tuning admission control.

### 4.1 References, not payloads

- **Knowledge/text data** is one or more KGP GroundingPacks (`kgp:pack:…`); their `dialect`
  (KGP §5) and the shared relation registry describe the content. A `dataset-jsonl-header`
  (the machine-readable header koine:10 ports into `koine/schemas/`) describes the training-record
  layout and carries the license + trust tier that travel with the set.
- **Media data** (multimodal) is one or more KMI assets (`…:asset:…`), fetched lazily via the KCB
  `fetch:asset` verb + grant (KMI §7, KCB delta G). Augmented/derived training samples are recorded
  in the KMI asset-lineage graph (`media:variant_of` / `media:derived_from`, KMI §3), so a training
  corpus is itself a byte-reproducible, lineage-tracked artifact.
- **Paired multimodal samples (FT-I).** `dataset.knowledge[]` and `dataset.media[]` name the
  *referenced corpora*, not the training samples. The **per-sample pairing** — which image goes with
  which caption, the basic shape of every image/video-text-to-text (and the caption side of
  text-to-image) finetune — rides the **`dataset-jsonl-header` training records** (koine:10): a row
  references both a KMI `asset` id *and* its text. Alignment thus travels with the same records that
  already carry license + trust tier; the arrays are the fetch/egress manifest, the records are the
  join.

### 4.2 The egress gate (NORMATIVE)

KGP §7.2 already defines `local-only` as knowledge "hard-gated out of … any export or **training
set**." KFT operationalizes that sentence:

- The **effective egress class** of a finetune run is the *most restrictive* egress class across
  **all** its training data — every knowledge record (KGP §7.2) and every media asset — **and the
  base-model entity's own egress class (FT-B).** If any input — data *or* base — is `local-only`, the
  run's effective egress is `local-only`. (A can't-leave base pins an all-`exportable` corpus to
  local compute just as a `local-only` record does.)
- A `local-only` run **MUST** execute on local / in-tier compute. The provider **MUST NOT** ship
  the training data, the base weights, or the job to any compute backend that crosses the
  originating trust boundary (a rented/cloud GPU, a managed training API). Only an **all-`exportable`**
  corpus MAY burst to external compute.
- The check is applied by the capability provider **at job admission** (mirroring KGP §7.2's
  "producer filters at pack construction"), *before* placement. A request whose `compute.class`
  names a cross-boundary backend for a `local-only` corpus is **rejected with a report**, never
  silently downgraded or silently placed locally.
- `compute.egress: "derived"` (§3) instructs the provider to compute the effective class from the
  data; an explicit `"local-only"` pins it; `"exportable"` asserts an expectation the provider MUST
  still verify against the data and reject if violated.
- **An egress pin may be unsatisfiable (FT-J).** If the pinned local/in-tier compute **cannot run**
  the job (e.g. `local-only` video-diffusion data on a tier without the required GPU), the provider
  **MUST fail at admission with a report** — never hang, never silently cloud-place (a privacy
  breach), never silently downscope the data. An impossible-to-place gated job is a rejected job.

This makes the local-vs-cloud placement decision **contract-governed**, not an operator setting:
the same axis that keeps private knowledge out of cross-project packs keeps it off rented GPUs.

### 4.3 License & trust lineage

- Every training record/asset carries an SPDX **license class** (KGP §7.1). The finetuned model's
  provenance (§5) records the **union** of license classes across its training corpus **and the base
  model's own license (FT-B)** — a non-commercial base (e.g. FLUX.1-dev) makes the model
  non-commercial regardless of the data. A downstream consumer admits or rejects the *model* with the
  same class-based allowlist it applies to a pack (KGP §7.1) — so "may this finetuned model ship
  commercially?" is answerable from its lineage.
- The **provenance trust tier** (KGP §7, `curated`/`acquired`/`synthetic`/`personal`) travels as a
  descriptive data-quality signal on the run — orthogonal to egress (§4.2) and license. It is not an
  admission gate here, but it is recorded so eval (§6) and model-selection can weigh it.

---

## 5. Models, weights & exports (identity + lineage)

Fine-tuning produces artifacts on two planes; KFT fixes how they are identified and linked so the
whole training lineage is queryable on the fabric.

### 5.1 Models are KINP entities

Base and finetuned models are KINP entities of type `model` (with a `modality` refinement, §3.1).
An **external** base model (Hugging Face Hub, etc.) is a *minted* KINP `model` entity carrying an
**external anchor** to its Hub coordinate — exactly as KINP entities anchor to Wikidata QIDs — so it
is a resolvable fabric node, not an ad-hoc `hf:…` string (FT-G). A finetuned model id is likewise
**minted, not content-addressed** (§5.2, FT-C). The finetuned model links to its base with the
reserved lifecycle relations (KINP §4):

```prolog
% base is a minted entity with an external anchor to the Hub coordinate (FT-G):
same_as(pinakes:model:qwen2.5-3b-instruct, ext:hf:Qwen/Qwen2.5-3B-Instruct).
based_on(cuneiform:model:qwen2.5-3b-insimul-slm, pinakes:model:qwen2.5-3b-instruct).
derived_from(cuneiform:model:qwen2.5-3b-insimul-slm, pinakes:model:qwen2.5-3b-instruct).
```

### 5.2 The run is a PROV activity

The `job` id (§3) is a KINP PROV **activity** (KINP §7.1). Its provenance record makes the run
fully attributable and the lineage bidirectionally queryable ("what trained this model?" / "what
derives from this base?"):

```jsonc
{ "activity": "cuneiform:activity:ft-run/9f2a",
  "agent":    "agora:org:trainer",                 // signed (§7); the training provider
  "used":     ["kgp:pack:sha256-7b1e…", "argos:asset:blake3-a1b2…",
               "hf:model:Qwen/Qwen2.5-3B-Instruct"],
  "generated":["cuneiform:model:qwen2.5-3b-insimul-slm",
               "cuneiform:asset:blake3-w0…"],       // the weight asset(s), §5.3
  "seed": 42, "config_hash": "sha256-cfg…",         // reproducibility anchor lives on the RUN (FT-C)
  "budget_units": 1800000, "spent_units": 1732004 } // §7
}
```

**Models are the fabric's first non-content-addressed *generated* entity (FT-C).** GPU
nondeterminism means two identical runs do not produce byte-identical weights, so a finetuned model
id **cannot** be content-addressed the way KGP packs and KMI assets are (KGP §2.1). The
**reproducibility anchor is the run** — the `job` activity with its pinned input ids, `seed`, and
`config_hash` — not the model bytes. A re-train over the same inputs mints a *new* model entity
linked to its predecessor with a `retrains` / `supersedes` lifecycle relation (KINP §4), never a
silent id collision.

### 5.3 Weights & exports are KMI assets — the export matrix *is* the lineage graph

Model weights are large bytes → KMI assets (byte-hash id, `application/vnd.koine.model+…` media
type, fetched via `fetch:asset`). **Every export format is another asset in the KMI lineage graph
(KMI §3)** — no bespoke export registry:

| Artifact | KMI media type | Lineage link |
|---|---|---|
| LoRA adapter | `application/vnd.koine.model+safetensors` | `media:derived_from` base weights |
| merged fp16 | `application/vnd.koine.model+safetensors` | `media:derived_from` adapter + base |
| GGUF Q4_K_M | `application/vnd.koine.model+gguf` | `media:variant_of` merged fp16 |
| ONNX / CoreML / TFLite | `application/vnd.koine.model+onnx` (etc.) | `media:variant_of` merged fp16 |

Quantizations are `variant_of` (same model, different byte encoding) exactly as KMI models
resolution variants of a video — so Cuneiform's planned GGUF/ONNX/CoreML/TFLite export surface
falls out of the ratified media plane for free, with lineage, rather than as a new subsystem.

### 5.4 Output egress & license inheritance (NORMATIVE, FT-A)

The §4.2 gate governs where training *runs*; this rule governs what the *output* may do — without
it, the gate is only half a gate (a model trained on `local-only` data can memorize it, and a
published model would exfiltrate exactly what §4.2 protected).

- The finetuned model entity **and every weight/export asset it generates** inherit the **most
  restrictive egress class** and the **union license** of `{training data ∪ base model}` (§4.2/§4.3).
- A `local-only`-inheriting model **MUST NOT** be registered in a cross-boundary registry, pushed to
  a cloud/Hub, or `fetch`ed across the tier boundary — the same enforcement KGP §7.2 applies to
  packs, now applied to model artifacts. The registry (§8) rejects a cross-boundary registration of a
  `local-only` model and reports it.
- Inheritance is carried on the model's provenance (§5.2) and on each weight asset's envelope, so it
  travels with the bytes and is answerable without re-deriving the corpus.

---

## 6. Run lifecycle & the training-telemetry stream

- **Start.** `invoke` (KCB §4) begins an async run (A2A task). Lifecycle states — reusing the names
  Cuneiform's engine already models for parity — `pending → running → succeeded | failed |
  canceled`.
- **Progress.** A consumer `subscribe`s (KCB §4) to receive the **training-telemetry** stream — the
  real replacement for the fabricated loss curve in Cuneiform's current stub runner. (Named
  *telemetry*, not "training-exhaust", to avoid colliding with the `dataset-jsonl-header`
  training-record convention that already owns that term — FT-H.):

  ```jsonc
  { "job": "cuneiform:activity:ft-run/9f2a", "step": 120,
    "metrics": { "train_loss": 0.83, "eval_loss": 1.02, "lr": 1.7e-4, "grad_norm": 0.4 },
    "checkpoint": "cuneiform:asset:blake3-ck12…",     // optional KMI asset (resumable)
    "samples":    ["argos:asset:blake3-pv3…"],        // optional preview assets — grids/clips (FT-L)
    "ts": "2026-07-22T18:04:11.000Z" }
  ```

  Events are idempotent under redelivery (content-addressed job+step), so the stream needs no
  exactly-once guarantee (KCB §4). A `checkpoint` reference MAY arrive before its bytes propagate;
  consumers tolerate the dangling ref and `fetch` lazily (KCB delta L).
- **Completion.** The terminal event carries the generated finetuned-model entity id, its weight
  asset ids (§5.3), the resolved eval results (§6.1), and `spent_units` (§7).
- **Eval / reward** *(§6.1)*. `job.eval` names KCS conformance scenarios (Insimul's VESPACE and CEFR
  harnesses, Pinakes's frozen eval protocols) run against the finetuned model **as a capability**,
  over the real path, in agora's conformance console (KCS, ADR-0001 §7). The same scenarios serve as
  reward signals for preference methods (`method: dpo`) and as release gates. **Eval respects the
  egress gate (FT-D):** a model that inherits `local-only` (§5.4) is evaluated **in-tier**, never
  shipped to the console across the boundary, and eval data carries its own egress class.

---

## 7. Authorization, cost & spend gating

- **Grant.** `invoke` requires an `invoke:finetune` capability token (KCB §5), per-world and
  per-capability, carrying a **`budget_units` ceiling** (KCB delta K). Because fine-tuning is the
  most expensive capability class, the ceiling is a hard admission gate: a run whose projected
  `cost` (§2, `gpu-seconds`) exceeds the ceiling is **rejected before it starts**, and placement
  (§4.2) selects a backend that respects both the ceiling and the egress class.
- **Admission-time estimate (FT-E).** The manifest's static `cost.est_units` (§2) cannot gate a
  variable-size job whose data is `fetch`ed lazily (KMI §7). The provider therefore computes a
  **per-job estimate** at admission — after resolving dataset cardinality — and checks *that* against
  the ceiling; a run is admitted only if the resolved estimate fits, not merely the manifest figure.
- **Issuer.** Grants are issued by Cuneiform workforce governance (KCB §5/§6); Cuneiform hosts the
  registry and provisions the training provider as an org.
- **Signing.** The job manifest (§3) and the resulting model entity's provenance (§5.2) SHOULD be
  signed with the shared `{key_id, alg}` shape (KCB §5, KGP §9.3), so *who* trained *what* on
  *which* data under *which* budget is cryptographically attributable, not merely asserted. A model
  arriving from a low-trust training agent feeds the same merge/review posture as a low-trust pack
  (KCB §5, KINP §11 decision 2).

---

## 8. Discovery — the finetuned-model registry is reuse, not a new registry

A finetuned model is a KINP entity that a capability can `produce`; therefore it is registered in
the **agora discovery registry** (KCB §3) and resolved via the **resolver** (KINP §8) like any other
fabric node. This *is* the "finetuned-registry" that Cuneiform's CLI and the deprecated rosetta
roadmap named — the existing index, not a bespoke one.

Because ports are plane-typed and path-searchable (KCB §2.1/§3), a finetuned model is **composable**:
a query "find a model that produces `audio/midi` from a `mood` (knowledge)" returns a finetuned
Formant model and an address to invoke it directly. Fine-tuning thus feeds capability composition —
each finetuned model is a new leg the registry can route through — rather than terminating in a
private artifact store.

**Provider selection (FT-K).** More than one `finetune` provider can match a job — agora's general
trainer and Pinakes's specialized provider (§9) both accept `text-generation`. The registry
disambiguates by preferring the more **specialized** matching provider, then lower `cost` (KCB §3); a
job MAY name a target provider explicitly; an unbroken tie is **surfaced to the caller**, not resolved
silently.

---

## 9. Execution runtime (informative)

Per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) decision 1 ("two distinct routers,
never merged"), the `finetune` capability's **general implementation** is a leaf capability in the
**agora** runtime commons — a general `trainer` / finetune-router, sibling to the provider-router, and explicitly
**not** merged into it (inference routing and long-running stateful GPU training are different
concerns; merging routers is the anti-pattern KCB exists to prevent). KFT fixes only the contract;
the engine ladder and compute backend are **producer behavior**, exactly as KMI §6 leaves transform
runtime to the producer's "sacred ladder":

- **Engine ladder inside agora's general trainer** (selected by `modality`+`method`): LLaMA-Factory
  (text-generation + VLM), Unsloth (fast single-GPU LLM), Axolotl (multi-GPU LLM), and diffusers +
  ai-toolkit/SimpleTuner (text-to-image/video).
- **Multiple providers, not one router (FT-K).** Pinakes runs its **own** specialized `finetune`
  provider — its `ml/` TRL+PEFT path (SLM + neurosymbolic + Mac-MPS smoke) — as a distinct capability
  on the bus, **not** an adapter inside agora's trainer. The registry (§8) routes each job between
  agora's general provider and Pinakes's specialized one; training logic is deliberately
  **multi-provider**, so agora is the home of the *general* executor, not the sole trainer.
- **Compute backend** (SkyPilot/Modal → local MPS or rented/cloud GPU) selected under the §4.2
  egress gate and the §7 spend ceiling.

Cuneiform is the control-plane host: it provisions the trainer as an org, hosts the registry, issues
grants, and its Go CLI / HTTP surface becomes a KCB client (discover → invoke → subscribe) — its
stub loss curve replaced by the §6 stream, its 404 registry by §8, its export subcommands by §5.3.

---

## 10. Per-project mapping

| Project | Role | KFT participation |
|---|---|---|
| **agora** | Runtime | Implements the `finetune` capability (the `trainer` leaf, §9); hosts registry + resolver (§8); runs KCS eval in the console (§6.1). |
| **Cuneiform** | Control-plane host | Provisions the trainer org; issues `invoke:finetune` grants (§7); its CLI is a KCB client; provisions the CAS for weight assets (§5.3). |
| **Pinakes** | Producer + **specialized `finetune` provider** | Emits knowledge training data (KGP packs from verbalization/KGQA); runs its own specialized `finetune` capability on the bus (its `ml/` TRL+PEFT path — SLM + neurosymbolic + MPS), routed to by the registry (§8, FT-K); owns eval protocols (§6.1). |
| **Insimul** | Producer + consumer | Emits rejection-sampled SFT data (world facts, VESPACE/CEFR reward); consumes finetuned SLMs (GGUF) into `LocalAIService`. |
| **Argos** | Producer + consumer | KMI authority for image/video/audio **training assets** (§3.1/§4.1); consumes finetuned media models. |
| **Formant** | Consumer → producer | Consumes finetuned audio models (task 17's "Cuneiform finetune endpoint" resolves here); later a `produce`r ("play this plugin", KCB §6). |

---

## 11. Open questions

1. **Adapter selection policy** — does the provider pick the engine (LLaMA-Factory vs Unsloth vs
   diffusers) purely from `modality`+`method`, or does the job manifest allow a hint? Keep it
   producer-internal (§9) unless a pressure test forces it into the contract.
2. **Multi-node / distributed runs** — cost metering and checkpoint lineage (§5.3/§6) across GPUs;
   likely a producer concern, but the `cost` unit and checkpoint-asset shape must not preclude it.
3. **Resumption & warm-start** — a run `based_on` a prior finetuned model (continued pre-training,
   sequential LoRA) is expressible via §5 lineage; confirm the job manifest carries a resume
   checkpoint ref cleanly.
4. **Eval-as-reward coupling** — how tightly `method: dpo` binds to a KCS scenario as its reward
   (§6.1); whether reward scenarios need a distinct KCS profile.
5. **Capability versioning** — inherits KCB open question 2 (schema evolution of a capability without
   breaking subscribers); a finetuned model pins the `kft_version` it was trained under.

---

## Pressure test

**Exercised by two passes** — [`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) (text,
found FT-A…FT-H → folded into 0.2.0) and
[`../scenarios/e2e-finetune-multimodal.md`](../scenarios/e2e-finetune-multimodal.md) (fully-multimodal
+ multi-provider, found FT-I…FT-L → folded into 0.3.0). With both passes clear of unresolved blockers,
KFT is **Ratified** (2026-07-23) — the four-plane composition holds under both a text and a
fully-multimodal, multi-provider pass with no redesign required. The stressors exercised:

- **Egress gate (§4.2):** a Pinakes Qwen SLM QLoRA over a corpus containing one `local-only` record
  — the run MUST pin to local MPS and MUST reject a `single-gpu-a100-80gb` (cloud) placement with a
  report. Verifies the training-set clause of KGP §7.2 is actually enforced.
- **Cross-plane ports (§2):** a Formant audio LoRA (`text-to-image`-style, media-in/model-out) whose
  training data is KMI assets and whose output feeds capability composition (§8) — verifies a
  `finetune` capability spanning media + entity planes is expressible and path-searchable.
- **Lineage & license (§4.3/§5):** a finetuned model trained on mixed-license data — verifies the
  union license class on the model provenance drives a downstream consumer's admit/reject correctly.
- **Metrics idempotency (§6):** redelivered training-exhaust events converge (content-addressed
  job+step), and a checkpoint ref delivered before its bytes is tolerated (KCB delta L).

---

## Changelog

- **0.3.0 — Ratified** (2026-07-23) — Status Candidate → **Ratified** after both pressure passes
  (`scenarios/e2e-finetune.md`, `scenarios/e2e-finetune-multimodal.md`) cleared with no unresolved
  blockers and no redesign. No contract change from the 0.3.0 candidate — ratification is the status
  transition on the same normative surface. Fine-tuning is now a **ratified profile** composing the
  four planes; downstream runtime work (agora general `trainer`, Pinakes specialized provider,
  cuneiform KCB client) is recorded as cross-repo follow-ups (§9), not built in koine.
- **0.3.0** (2026-07-22) — Folded second-pass deltas from `scenarios/e2e-finetune-multimodal.md`:
  **FT-I** (per-sample multimodal pairing rides the `dataset-jsonl-header` training records; the
  `knowledge`/`media` arrays are referenced corpora — §3/§4.1), **FT-J** (an unsatisfiable
  egress-pinned placement is an admission failure with a report — §4.2), **FT-K** (registry provider
  selection — prefer specialized then cheaper, job MAY target a provider, ties surface — §8/§9; also
  reframes Pinakes as its **own** specialized `finetune` provider, not an adapter inside agora),
  **FT-L** (`samples` preview assets on the telemetry event — §6). Additive; remains Candidate,
  ready for owner ratification.
- **0.2.0** (2026-07-22) — **Candidate.** Folded pressure-test deltas from
  `scenarios/e2e-finetune.md`: **FT-A** (output model + weight assets inherit the most-restrictive
  egress + union license, gating registration/publication — §5.4), **FT-B** (egress/license
  aggregation includes the base model — §4.2/§4.3), **FT-C** (models are minted, not
  content-addressed; the run is the reproducibility anchor; `retrains`/`supersedes` on re-train —
  §5.1/§5.2), **FT-D** (in-tier eval for local-only models — §6.1), **FT-E** (admission-time per-job
  cost estimate — §7), **FT-F** (modality×method compatibility validated at admission — §3.1),
  **FT-G** (external base models as minted KINP entities with an external anchor — §5.1), **FT-H**
  (metric stream renamed `training-exhaust`→`training-telemetry`; model media types + entity type +
  modality registered — §6/§3.1). No redesign; all additive extensions.
- **0.1.0** (2026-07-22) — Initial draft. Defines fine-tuning as a **profile** composing KCB
  (the `finetune` capability, §2; lifecycle/metrics, §6; cost/grants, §7), KGP (knowledge training
  data + the NORMATIVE egress/license gate, §4), KMI (media training data + weight/export assets as
  lineage, §5.3), and KINP (model entities + PROV run lineage, §5). Adds no new plane, identifier, or
  transport. Pressure test (`scenarios/e2e-finetune.md`) pending before Candidate.
