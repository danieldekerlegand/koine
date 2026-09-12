# Koine Fine-Tuning Protocol (KFT)

**Spec version:** 0.7.1
**Status:** Candidate
**Last updated:** 2026-09-12
**Applies to:** `finetune` capability providers (general and specialized), the control-plane host
(registry, grants, orgs), training-data producers, and finetuned-model consumers.
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for model/entity ids, lineage
relations, and provenance; [`capability-bus.md`](capability-bus.md) (KCB 0.4.x) for the
capability shape, verbs, cost, and grants; [`grounding-pack.md`](grounding-pack.md) (KGP 0.5.x)
for knowledge training data and the egress/license/trust axes; [`media-interchange.md`](media-interchange.md)
(KMI 0.3.x) for media training data and weight/export assets;
[`conformance-scenario.md`](conformance-scenario.md) (KCS 0.2.x) for eval/reward.

> **How to read these pins — track-current, `MAJOR.MINOR.x`.** Every pin above is spelled
> `MAJOR.MINOR.x` and names the plane's **current published version**, not its last-ratified one.
> The rule is uniform across all five pins, and the patch position is a wildcard for all five —
> a mixed header (one pin current, another last-ratified) states no rule at all.
> - **Why track-current.** This repo publishes exactly one text per spec: the link in
>   `Depends on:` resolves to that plane's current version. A pin to a superseded version
>   therefore names a document no reader can retrieve. Through 0.4.0 the KCB/KGP/KMI pins read
>   0.2.0 / 0.4.0 / 0.2.0 — each plane's *last-ratified* version — and had gone silently stale as
>   the planes moved; they now track KCB 0.4.x, KGP 0.5.x, KMI 0.3.x.
> - **A candidate profile may compose candidate planes.** Three of the five pins (KGP, KMI, KCB)
>   are candidate, as is KFT itself. That is deliberate and not a defect: what a profile may not
>   do is compose a version whose text is unavailable.
> - **Re-check trigger.** A **minor or major** bump in any pinned plane obliges a re-read of the
>   sections KFT cites (§2 → KCB §2/§2.1, §4 → KGP §7/§7.2, §5 → KMI assets/lineage, §7 → KCB §5)
>   before KFT's next status transition. A **patch** bump does not: in koine's lifecycle a patch
>   carries editorial, rationale, or deprecation-naming changes that do not move a cited clause,
>   and a patch that does move one is a defect in that plane's versioning — the spec-level analogue
>   of KCB §7.2's *digest-without-a-bump*.

> **A profile, not a fifth plane.** Fine-tuning does not move a new kind of data — it *composes*
> the four ratified planes into one operation: consume training data (KGP knowledge / KMI media)
> and a base-model entity (KINP), produce a new model entity (KINP) plus weight assets (KMI),
> orchestrated as a capability on the bus (KCB). KFT fixes only what is finetuning-specific — the
> `finetune` capability shape, the job manifest, the run/metrics lifecycle, and the model-artifact
> lineage conventions. Everything else is reuse. Dumb pipes: training data travels **by reference**
> (KGP pack ids, KMI asset ids), never inlined into a job.

This generalizes the real-but-siloed training harnesses participants build independently —
TRL+PEFT QLoRA pipelines, one-off `train.py` scripts, simulated finetune-job services — into one
ratifiable contract that any conformant executor implements.

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
- the runtime split (informative, §9) and per-role mapping (§10).

KFT does **not** define: payload formats (KGP/KMI own them), engine/adapter internals or compute
provisioning (provider- and host-local behavior — §9), or reasoning semantics. It adds
no new identifier kind, no new plane, and no new transport.

It also does not define three things a maintained external standard already holds, which KFT
**adopts by reference** rather than restating: **dataset description** (MLCommons Croissant,
§4.1.1), **weights packaging** (KitOps / ModelPack, §5.3.1), and **published model lineage** (the
Hugging Face `base_model` convention, §5.1.1). Each of those sections states the **seam** — what the
external standard covers, what KFT adds on top, and what a producer must supply that the standard
cannot express — so an implementer can tell which document to read for which field. The rule behind
all three: *where something is already standardized and adopted, KFT cites it and holds only the
fields it has no place for.* The pins are recorded in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md).

A fourth external standard is engaged **differently**, and the difference matters: KFT does not adopt
**Kubeflow `TrainJob`** by reference, it *resembles* it. TrainJob already ships the
dataset-and-model-**by-reference** job shape, so §3's manifest follows that structure rather than
diverging from it (§3.2). Nothing in KFT delegates to TrainJob, no KFT field is defined by it, and a
producer never fetches it — what is borrowed is a **shape, not a scope**. TrainJob carries no
license, egress, trust-tier, or budget field anywhere in its API, which is exactly the seam §4 fills.

### 1.1 What KFT holds — the four defensible claims

Once the three adoptions above are subtracted and the fourth standard's shape is borrowed, **four**
things are left that no maintained standard holds. They are collected here, in one place, so an
implementer can see what KFT is *for* rather than inferring it from the sections it is spread across —
and each is stated with the reason nothing else covers it, because a claim without that reason is
marketing. Everything else in this document is either composition of the four ratified planes or a
reference to somebody else's standard.

**1. The `objective × adaptation` taxonomy (§3, §3.1).** Fine-tuning varies along **two independent
axes** — *what is being optimized* (supervised, preference, continued pre-training) and *how the
weights are reached* (full-weight, LoRA, QLoRA, adapter-then-merge). KFT types the pair as a
first-class, closed vocabulary and **validates the combination at admission** (FT-F), before compute
is committed. Nothing else expresses the space:

- the **OpenAI fine-tuning API** models only the objective axis — `method.type` is
  `supervised` / `dpo` / `reinforcement` — and treats adaptation as an unexposed platform decision, so
  a caller cannot ask for (or be refused) a specific adaptation;
- **Kubeflow `TrainJob`** buries adaptation entirely in `spec.trainer.{command,args}` (§3.2) — argv,
  which no consumer can read, route on, validate, or refuse. A method that is a string inside an
  argument array is not part of a contract, it is a comment.

Read against the two axes, §3's `method` vocabulary decomposes like this:

| `method` | objective axis | adaptation axis |
|---|---|---|
| `sft` | supervised | unpinned — full-weight unless a `hyperparams.lora` block narrows it |
| `full` | supervised | full-weight, pinned |
| `lora` | supervised | low-rank adapter |
| `qlora` | supervised | low-rank adapter over a quantized base |
| `dpo` | preference | unpinned |

That decomposition is **informative and reading-only** — it renames no field and moves no
admission outcome — and it exposes an honest gap the claim would otherwise paper over: one enum is
carrying both axes, so `sft`/`full` overlap on the objective axis and the common real combination
*preference objective + low-rank adaptation* (`dpo` + LoRA) is expressible only by the presence of
a `hyperparams.lora` block rather than by the method token. §11.6 records that as an open question;
closing it is an **additive optional field**, never a change to `method`'s value space or to FT-F.

**2. Egress-gated placement (§4.2).** The class of the *data* decides where the *compute* may run:
a corpus (or base) that is `local-only` under KGP §7.2 pins the run to local / in-tier compute, and a
job asking for a cross-boundary backend is refused at admission, never downgraded and never silently
placed. §4.2 is the operationalization of KGP §7.2's "hard-gated out of … any export or **training
set**" clause — the sentence that would otherwise be unenforceable, because the moment a corpus is
handed to a trainer it is the *trainer's* placement, not the pack's filter, that decides whether it
leaves the boundary. Nothing else holds it: **no** trainer job format in §3.3's matrix — and no field
anywhere in TrainJob (§3.2) — carries a license class, a redistribution/egress class, a provenance
trust tier, or a spend ceiling. Kubernetes admission control governs *cluster* resources via RBAC and
quota; Croissant's `license` is a descriptive string, not an enforcing class (§4.1.1). The data-policy
axis simply is not present in the layer where placement is decided, and KFT puts it there.

**3. Graded refusal routing (§8.1).** A registry routes on a *match*; KFT also routes on a
**refusal**. Everywhere else, a job outside a runner's envelope terminates the interaction — a stack
trace, an HTTP 400, a quota rejection — and the caller is left to re-discover on its own. Under §8.1
a refusal is graded (is this job *invalid*, or merely *not for me*?) and, when the grade says another
provider could take it, the report **names that provider's resolvable address** (§8, §2). Multi-provider
fine-tuning (FT-K) is the reason this is load-bearing rather than a nicety: a specialized local-only
provider refusing an out-of-envelope job is the *normal* path, not an error path, and the refusal is
the routing signal that keeps it one hop instead of a re-search.

**4. Cross-provider job portability (§3.3).** Nothing converts a fine-tuning job between the trainers
the field actually uses — **Axolotl, LLaMA-Factory, TRL, and the OpenAI fine-tuning API** (190k+
combined GitHub stars, as observed 2026-08-13) — so a training job today is written against one runner
and rewritten by hand for the next; the objective, the adaptation, the hyperparameters and the data
binding are re-expressed in four incompatible vocabularies that agree on the semantics and disagree on
every key. The four planes already make the *data* portable by reference; §3.3 makes the **job**
portable, as a normative mapping with named lossy edges and a refuse-rather-than-drop rule. This is
plausibly the single most valuable thing KFT delivers, which is why it is a **specified artefact**
(§3.3) and not an aspiration recorded here.

Claims 1–3 are stated normatively where they live (§3.1/FT-F, §4.2, §8.1); claim 4 is specified in
§3.3. This subsection **binds no clause of its own** — it is the index to the four, and if it ever
disagrees with them, they win.

---

## 2. The `finetune` capability

A training provider advertises `finetune` in its KCB capability manifest (KCB §2). At the pinned
**KCB 0.4.x that manifest is one named extension of the provider's A2A AgentCard**, not a document
of its own: the block below is an entry in `capabilities.extensions[].params.capabilities` on the
card the provider already serves (KCB §2). The standalone `/.well-known/kcb-manifest.json` that
KFT's earlier KCB 0.2.0 pin implied is deprecated, and KCB §7.3 fixes its removal at **KCB 0.5.0**
(KCB §2.2 carries the field-by-field migration) — so a provider that advertises `finetune` only on
the standalone file is conformant today and unreachable after that version. Inputs and
outputs are **plane-typed ports** (KCB §2.1), so a single capability spans the entity, knowledge,
and media planes — which is exactly what fine-tuning needs (data in one plane, model out in
another):

```jsonc
{ "name": "finetune",
  "version": "1.0.0",                                                                 // semver, NEVER in the name (KCB §7.1)
  "inputs": [
    { "plane": "entity",    "types": ["model"], "shape": "base-model" },              // KINP model entity
    { "plane": "knowledge", "dialect": "grounding-only", "shape": "training-set" },   // KGP data …
    { "plane": "media",     "media_types": ["image/*","video/*","audio/*"], "shape": "training-set" }, // … or KMI data (multimodal)
    { "plane": "media",     "media_types": ["application/vnd.koine.dataset+jsonl"],
                            "shape": "training-records" }                                             // … plus the §4.1 record files (FT-M)
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
  that accepts its modality. They all share the **name** `finetune` and are told apart by their
  *ports*: a specialized variant advertised as `finetune-image` would be invisible to a consumer
  searching for `finetune`, which is exactly the fragmentation KCB §7.1 forbids.
- **Versioning fields (KCB 0.4.x).** A capability is a `(name, semver version)` pair and every port
  SHOULD carry a content-addressed `schema_id` over its declared shape (KCB §7.1); `cost` sits
  outside that digest, so a re-price does not re-digest the contract. The `schema_id`s are elided
  from the illustration above for brevity — that is abridgement, not a KFT exemption, and KFT
  restates neither rule. §11.5 records the one consequence specific to fine-tuning: what a
  finetuned model's pinned versions mean once the capability moves.
- `cost.meter` is `gpu-seconds` (fine-tuning's natural unit); `est_units` lets the caller gate
  spend **before** invoking (§7). Fine-tuning is the highest-cost capability class on the bus, so
  the KCB cost/grant machinery is load-bearing here, not decorative.
- Because the output finetuned model is an **entity** with produced ports of its own, a finetuned
  model is itself discoverable and composable on the bus (§8).

---

## 3. The finetune job manifest

The `invoke` payload. All data is referenced by KINP/KGP/KMI id — nothing is inlined. The manifest
has **two intakes** — a base model and a dataset — and each is a *reference plus, optionally, the
document that describes it in its own standard's terms*, never an inlined description. That is the
shape **Kubeflow `TrainJob`** already ships as `initializer.{model,dataset}.storageUri`, and §3.2
states the correspondence field by field. A third, optional reference — `resume` (§3.4) — is not a
third intake: it names neither a new base nor new data, but the interrupted leg of *this* training
that the job picks up from.

```jsonc
{
  "kft_version": "0.1.0",
  "job":        "orchestrator:activity:ft-run.9f2a",       // KINP activity id — this run (PROV, §5)
  "base_model": "refkb:model:qwen2.5-3b-instruct",         // intake 1 — KINP model-entity ref, externally anchored (§5.1)
  "base_model_descriptor": ["refkb:asset:blake3-mk1f…"],   // the base's published card / ModelKit, by reference (§3.2)
  "modality":   "text-generation",                         // §3.1
  "method":     "qlora",                                   // sft | lora | qlora | full | dpo
  "resume": {                                              // OPTIONAL — a continuation leg (§3.4); absent = a cold run
    "checkpoint": "orchestrator:asset:blake3-ck40…",       // the KMI checkpoint asset to resume from (§6)
    "of_job":     "orchestrator:activity:ft-run.7c3d",     // the leg that published it — the `continues` target (§5.2)
    "at_step":    4000                                     // the §6 step it was published at (§7 nets the estimate from here)
  },
  "dataset": {                                             // intake 2 — data-plane refs (§4), never inline
    "knowledge": ["kgp:pack:sha256-7b1e…"],                // KGP GroundingPack ids
    "media":     ["analyzer:asset:blake3-a1b2…"],          // KMI asset ids (multimodal)
    "records":   ["mediastore:asset:blake3-e9d7…"],        // training-record JSONL, as KMI assets (§4.1, FT-M)
    "header":    [ { /* dataset-jsonl-header — one per records[] entry (§4.1, FT-O) */ } ],
    "descriptor":["refkb:asset:blake3-cr0a…"]              // Croissant v1.1 description(s), by reference (§4.1.1)
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

The machine-readable twin is [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
(draft-2020-12), which sits alongside its `$ref`ed
[`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) and
[`../schemas/provenance.schema.json`](../schemas/provenance.schema.json), and is validated **downstream** per
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) (koine specifies, implementers
validate) — **not** in koine.

**Four of this manifest's surfaces are references, not descriptions.** `dataset.descriptor[]`
names a **Croissant** document (§4.1.1), `base_model` names a KINP entity whose external anchor is
the base's Hub coordinate (§5.1/§5.1.1), `base_model_descriptor[]` names that base's **published
card / ModelKit manifest** (§3.2, §5.1.1/§5.3.1), and `export[]` names output variants whose
*packaging* is KitOps / ModelPack's (§5.3.1). §3 carries the reference and the fields those standards
have no place for — it never restates them, and a proposal to add a field that duplicates one of
theirs is a defect rather than an extension.

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
| `text-to-audio` | media (KMI audio) | Stable Audio Open, MusicGen, AudioLDM 2 | lora / full |
| `audio-to-audio` | media (KMI audio) | RVC, so-vits-svc, Demucs | full / lora |

The vocabulary is additive; a new modality adds a row plus a capability variant (§2), never a new
plane. A **media authority** holds the image/video/audio training assets these modalities
consume, so multimodal fine-tuning inherits an existing, ratified data plane rather than a new one.

**The two audio rows, and what distinguishes them.** `text-to-audio` is the third row of the
`text-to-image` / `text-to-video` family and differs from them in nothing this table measures —
music, sound effects and speech synthesis (TTS) all ride it, over a caption→audio corpus.
`audio-to-audio` is **not** that shape: it is voice conversion, source separation and enhancement,
its corpus is paired asset↔asset with **no caption side**, and both of its right-hand columns
differ on purpose — its typical bases are small task-specific architectures rather than foundation
models, which is why `full` leads its `method` ordering where the diffusion rows lead with `lora`.
That a transformation modality belongs in this vocabulary at all is a decided question, not an
assumed one: `modality` names what a **training run adapts a model to be**, which is a different
question from what a finished transform **consumes and produces on the bus** (KMI §6), and without
a token a voice-conversion job must declare `text-to-audio` — making FT-F's mandatory admission
check below validate a declaration that is false. The full adjudication, the rejected alternatives
(`text-to-speech` as a sixth row, an `audio-text-to-text` row, an `audio` plane), and the named
providers these rows are published ahead of are in
[`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md)
(informative). Neither row moves a clause of §4: both sides of an audio pair are `dataset.media[]`
entries, so §4.2's effective-egress union over *every media asset* and §4.3's license/trust union
already reach them.

`modality` and `method` are **not** independent: a provider **MUST validate** the
`modality × method` combination (and the base model's architecture) **at admission** and reject an
incompatible request — e.g. `dpo` on `text-to-image` — with a report, before any compute is
committed (FT-F). The `modality` enum ([`../registry/enums/modality.tsv`](../registry/enums/modality.tsv)),
the `model` entity type ([`../registry/entity-types.tsv`](../registry/entity-types.tsv)), and the
weight/export `media_type`s (§5.3, [`../registry/media-types.tsv`](../registry/media-types.tsv)) are
registered in koine's shared registry so path-matching and validators recognize them from data, not
prose — closing **FT-H**. These tokens are immutable once published (a change is a new token, never an
edit in place), the same discipline as an immutable relation signature.

### 3.2 Job shape — the Kubeflow `TrainJob` precedent

Dataset-and-model-by-reference is not a koine invention, and §3 does not pretend it is. **Kubeflow
Trainer v2's `TrainJob`** (API group `trainer.kubeflow.org/v1alpha1`, as observed **2026-08-13**)
already expresses a training job as two initializers — `spec.initializer.dataset.storageUri` and
`spec.initializer.model.storageUri` — each a *reference* to data that lives elsewhere, with the
runtime named separately by `spec.runtimeRef`. That is the structure §3 follows. Resembling an
established shape costs KFT nothing and hands an implementer a layout they already know; the place
KFT differs is §4, and §4 must not move to buy this.

| Kubeflow `TrainJob` | KFT §3 | What the correspondence is |
|---|---|---|
| `spec.initializer.model.storageUri` | `base_model` (+ optional `base_model_descriptor[]`) | Same move, stronger reference: TrainJob names the base by a storage URI (`hf://…`, `s3://…`); KFT names it by a **KINP `model` entity** whose external anchor *carries* that coordinate (§5.1, FT-G), so one id resolves on the fabric and off it |
| `spec.initializer.dataset.storageUri` | `dataset.{knowledge,media,records}[]` (+ optional `dataset.descriptor[]`) | Same move, three slots, because a koine corpus is knowledge, media, or training records (§4.1) — and its *description* is Croissant's (§4.1.1), not a field here |
| `spec.initializer.*.{env,secretRef}` | the KCB `fetch:asset` grant (§4.1, KCB §5) | Access to a referenced input is a **grant on the bus**, not a credential field in the job |
| `spec.runtimeRef` | the `finetune` capability `(name, version)` + `schema_id` (§2) | Which executor runs the job is a capability binding (KCB §7), not an in-manifest runtime name |
| `spec.trainer.{numNodes,resourcesPerNode}` | `compute.class` (§3) | KFT requests a **class**, not a pod resource shape; placement is the provider's, and §4.2 constrains it |
| `spec.trainer.{command,args}` | `method` + `hyperparams` (§3, §3.1) | The one deliberate divergence — TrainJob passes the adaptation method through **argv**, KFT makes it a typed field validated against `modality` at admission (§3.1, FT-F) |
| *(no counterpart)* | `job`, `seed`, `config_hash`, `signing`, `eval` | The run as a PROV activity and its reproducibility anchor (§5.2, FT-C), its attributability (§7), and its eval binding (§6) |

**Reference plus describing standard, never inlined description (NORMATIVE).** Each intake is
expressed as (a) a fabric-resolvable **reference** — a KINP entity id for the model, KGP pack / KMI
asset ids for the data — and (b) OPTIONALLY a reference to the **document that describes it** in its
own standard's terms: `dataset.descriptor[]` for the dataset (Croissant v1.1, §4.1.1) and
`base_model_descriptor[]` for the base (its published Hugging Face model card and/or its KitOps /
ModelPack `Kitfile` — §5.1.1, §5.3.1). Both descriptor slots are **KMI asset ids**, fetched under the
same `fetch:asset` grant as any other asset, and both are **optional**. A manifest **MUST NOT** inline
either description, and KFT **MUST NOT** grow a field that restates one of theirs.

**A descriptor is never an admission input (NORMATIVE).** The rule §4.1.1 states for
`dataset.descriptor[]` binds `base_model_descriptor[]` identically: §4.2's egress gate, §4.3's
license/trust lineage, and §7's spend estimate read the `dataset-jsonl-header` and the referenced
packs / assets / KINP entities — **never** a descriptor. A provider **MUST NOT** derive an egress
class, license class, trust tier, record count, or base-model coordinate from a descriptor, and
**MUST NOT** admit or refuse a job on its contents. Where a descriptor disagrees with the header or
with the base-model entity, **the header and the entity win and the descriptor is the bug**.

**What `TrainJob` does not have.** The alignment is a shape, not a scope. TrainJob has **no license
field, no egress or redistribution class, no provenance trust tier, and no budget or spend ceiling**
anywhere in its API — because it is a Kubernetes *workload* resource, whose admission control is
RBAC, quotas, and admission webhooks over **cluster** resources, not over the **data's** license,
redistribution class, or trust. Those four are precisely the seam KFT fills: §4.2 (egress gate),
§4.3 (license & trust lineage), §5.4 (output inheritance), and §7 (cost and spend ceilings) have no
TrainJob counterpart to inherit from, and adopting TrainJob's structure creates no obligation to
adopt its (absent) data policy.

**The gate does not move (NORMATIVE).** This alignment is structural and naming only. §4 admits and
refuses exactly the jobs it did at KFT 0.4.0, for exactly the same reasons and from exactly the same
inputs, and every finding folded by the three pressure passes — **FT-A…FT-Q** — is untouched. A
0.4.0 manifest remains conformant unchanged: `base_model_descriptor[]` is optional and additive, and
no existing field changed type, name, or meaning. Any proposed alignment edit that *would* change an
admission outcome is **out of scope for the alignment** and is raised as its own change against §4,
never landed as a side effect of resembling TrainJob.

**On the pin.** `trainer.kubeflow.org/v1alpha1` is an **alpha** API and may break; that costs KFT
nothing beyond a citation, since §3 depends on TrainJob for **no clause** — it names a precedent, not
a dependency. The pin of record is [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md).

### 3.3 Cross-provider job portability — the trainer mapping (NORMATIVE)

A job manifest only one runner can execute is a config file, not a contract. The four planes already
make the *data* portable by reference; this section makes the **job** portable, and it is the fourth
defensible claim of §1.1 discharged as a specified artefact rather than asserted as a property.

**What a conversion is.** A **conversion** transforms a §3 manifest into the job description of an
external trainer (**emit**), or an external trainer's job description into a §3 manifest (**import**).
A conversion is performed by a capability provider (§9) or by tooling downstream of one; KFT specifies
the mapping and its failure modes, not the converter. The trainer surfaces mapped here are pinned by
dated observation in [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) — a mapping to an
unversioned moving target is unfalsifiable, which is the whole point of that table.

**Conversion is downstream of admission and can only narrow it (NORMATIVE).** §4's gate runs on the
**KFT manifest**, before any conversion, on exactly the inputs §4 already names. A converter therefore
**MUST NOT** admit anything §4 refused, and a conversion failure is an *additional* refusal on an
already-admitted job — never a second, softer gate. Nothing in this section is an admission input, and
no clause here changes which jobs §4 admits.

#### 3.3.1 The three dispositions

Every §3 field has exactly one disposition per target. A converter **MUST** classify each field, and
**MUST NOT** leave a field unclassified:

- **Mapped** — the target has a field with the same meaning. The converter writes it.
- **Carried out of band** — the target has no field for it, but nothing gating depends on the target
  knowing it. The converter **MUST** record it in the **conversion record** (below) and MAY omit it
  from the emitted config. Silent omission is a defect; recorded omission is conformant.
- **Refused** — the target has no field for it **and** something gating does depend on it. The
  converter **MUST fail the conversion with a report** (§8.1) and **MUST NOT** emit a config. It
  **MUST NOT** substitute a nearest-neighbour value, and **MUST NOT** downgrade the field to
  out-of-band to make the conversion succeed.

**The gating set (NORMATIVE).** A field is *gating* if §4.2, §4.3, §5.4, or §7 reads it, or if
changing it changes what the run is. Exhaustively: the **effective egress class** (§4.2), the **union
license class** and **provenance trust tier** (§4.3, §5.4), the **budget ceiling** (§7), the
**adaptation axis** of `method` (§1.1, §3.1) when the job pins one, the **resume ref**
`resume.checkpoint` (§3.4 — §4.2 reads it, and it fixes what the run continues from), and the
`modality × method` compatibility FT-F validates. Dropping any of these silently is the failure mode this section exists
to forbid: every one of them is invisible in the emitted config, so the loss is undetectable at the
far end and shows up only as a policy breach or a differently-trained model.

**Safely droppable.** `dataset.descriptor[]` and `base_model_descriptor[]` are the *only* fields a
converter may drop without recording them, and only because §3.2's *a descriptor is never an admission
input* rule already guarantees nothing depends on them. Everything else is mapped, recorded, or
refused.

**The conversion record.** A conversion **MUST** produce a record naming: the target and its pinned
revision, the KFT `job` activity id (§5.2), every out-of-band field with its value, and every field the
target expresses **more weakly** than KFT does. The record is a KMI asset attached to the run's PROV
activity (§5.2), so "this run was executed through a converted job, and here is what the target never
saw" is answerable from lineage rather than from a runbook. A run executed through a conversion whose
record is absent is **not** conformant.

#### 3.3.2 The mapping matrix

Targets, as observed **2026-08-13**: **Axolotl** (YAML config), **LLaMA-Factory** (YAML / CLI args over
a registered `dataset_info.json`), **TRL** (Python config objects — `SFTConfig` / `DPOConfig` +
`peft.LoraConfig`; *not* a declarative job file, see below), and the **OpenAI fine-tuning API**
(`POST /v1/fine_tuning/jobs`). `—` means the target has no counterpart.

| KFT §3 field | Axolotl | LLaMA-Factory | TRL | OpenAI FT API | Disposition when `—` |
|---|---|---|---|---|---|
| `base_model` (via its `ext:hf:…` anchor, §5.1) | `base_model` | `model_name_or_path` | model id argument to the trainer | `model` (allow-listed bases only) | n/a |
| `dataset.{knowledge,media,records}[]` | `datasets[].path` | `dataset` (name registered in `dataset_info.json`) | a `datasets.Dataset` | `training_file` (an uploaded file id) | n/a |
| `dataset.header[]` (license · trust · **egress** · `recordCount`) | — | — | — | — | **out of band, and its egress axis gates** (below) |
| `dataset.descriptor[]` (Croissant, §4.1.1) | — | — | — | — | droppable |
| `base_model_descriptor[]` (§3.2) | — | — | — | — | droppable |
| `modality` (§3.1) | implied by base + config | `template` / task | implied by trainer class | implied by `model` | n/a |
| `method` — **objective axis** | `rl: dpo`; absent = supervised | `stage: sft \| dpo \| pt \| rm \| ppo` | trainer class (`SFTTrainer` / `DPOTrainer`) | `method.type` (`supervised` / `dpo` / `reinforcement`) | n/a |
| `method` — **adaptation axis** | `adapter: lora \| qlora` | `finetuning_type` (+ `quantization_bit`) | `peft.LoraConfig` (+ quantized load) | **—** | **REFUSE if pinned** |
| `hyperparams.{epochs,lr,max_seq_len}` | `num_epochs`, `learning_rate`, `sequence_len` | `num_train_epochs`, `learning_rate`, `cutoff_len` | `SFTConfig` / `TrainingArguments` | `method.*.hyperparameters.{n_epochs, learning_rate_multiplier}`; **no sequence-length control** | out of band (`max_seq_len`) |
| `hyperparams.lora.{r,alpha,dropout,target_modules}` | `lora_r`, `lora_alpha`, `lora_dropout`, `lora_target_modules` | `lora_rank`, `lora_alpha`, `lora_dropout`, `lora_target` | `LoraConfig(r, lora_alpha, lora_dropout, target_modules)` | — | **REFUSE** (with the adaptation axis) |
| `export[]` (§5.3) | `output_dir` + a post-hoc merge / convert step | `export_dir` / the export CLI | `save_pretrained` + external conversion | — (the platform retains the weights) | **REFUSE** if an export variant is requested |
| `compute.class` | accelerate / DeepSpeed config | accelerate / DeepSpeed config | accelerate config | — (managed placement) | out of band |
| `compute.egress` + the **effective egress class** (§4.2) | — | — | — | — **and structurally cross-boundary** | **REFUSE** — see below |
| `resume.checkpoint` (§3.4) | a local checkpoint path, after the ref is `fetch`ed to bytes | a local checkpoint path, after the ref is `fetch`ed to bytes | a local checkpoint path on the constructed config object | **—** — its `model` accepts an already-finetuned model, which is §3.4's *warm start*, not resumption | **REFUSE** — gating |
| `resume.{of_job,at_step}` (§3.4) | — | — | — | — | out of band — the leg identity (§5.2) and §7's netting operand |
| license class · trust tier (§4.3) | — | — | — | — | out of band + §5.4 re-asserted on return |
| budget ceiling / `spent_units` (§7) | — | — | — | — (account billing, not a per-job ceiling) | out of band |
| `job`, `config_hash`, `signing` (§5.2, §7) | — | — | — | `metadata` (free-form, unverified) | out of band |
| `seed` | `seed` | `seed` | `TrainingArguments.seed` | `seed` | n/a |
| `eval[]` — KCS scenarios (§6.1) | — | — | — | — | out of band — **never** mapped onto `eval_dataset` / `validation_file` |

Five consequences are normative:

- **A `local-only` job MUST NOT be converted to a managed cloud target.** The OpenAI fine-tuning API
  executes on the provider's infrastructure by construction, so converting a run whose effective
  egress class (§4.2) is `local-only` **is** the boundary crossing §4.2 forbids. The converter
  **MUST refuse**; there is no configuration of the target that makes it conformant. The same test
  applies to any self-hosted target: a conversion is admissible only where the *execution* stays
  in-tier, which is a property of the deployment, not of the format.
- **An unexpressible adaptation axis is a refusal, not a substitution.** A job pinning `lora`,
  `qlora`, or `full` converted to a target that cannot express adaptation **MUST** be refused. Mapping
  `qlora` onto a bare `method.type: supervised` silently trains a different model than the one the
  manifest describes, at a different cost, with a different artifact kind on the far side (§5.1.1's
  `base_model_relation` would be wrong too). If the job leaves the adaptation axis unpinned (`sft`,
  `dpo` with no `hyperparams.lora` block), the conversion proceeds and the record notes that the
  target chose.
- **An eval binding is never demoted to a validation file.** `eval[]` names **KCS scenarios** run
  against the finetuned model *as a capability* (§6.1). A held-out file is not that, and mapping one
  onto the other converts a conformance gate into a loss number. It is carried out of band and the
  scenarios run on the fabric after the run returns.
- **A resume ref converts as bytes, never as a reference — and never into a cold run.** Every
  target that can resume at all takes a **local path**, so a conversion resolves `resume.checkpoint`
  to bytes through `fetch:asset` and the KINP id, the leg it continues (`of_job`), and the step it
  resumes at (`at_step`) are all invisible on the far side — carried out of band, never dropped
  silently. A target with **no** resume surface **MUST** be refused, not handed the job as a cold
  run: a cold run over the same manifest trains a different model, at full cost, discarding work the
  checkpoint already holds. And because §4.2 now reads the checkpoint, a leg resuming a
  `local-only`-inheriting one carries a `local-only` effective class into the first consequence above
  — the managed-cloud refusal — however `exportable` its new corpus is.
- **License, trust tier and egress are re-asserted on the way back.** No target returns them, so the
  artifacts a conversion brings home carry **only** what §5.4 derives from the KFT-side inputs. A
  converter **MUST NOT** treat a target's silence as `exportable` or as an absent restriction.

**On TRL specifically.** TRL has no declarative job document — its "job format" is the construction of
`SFTConfig` / `DPOConfig` and an optional `peft.LoraConfig` in Python. The mapping above is therefore
a mapping onto **config-object fields**, and an emitting converter produces code or an argument vector
rather than a file. That is a real asymmetry and not a modelling shortcut: TRL is the one target where
the round-trip conformance criterion below must be evaluated against constructed objects.

#### 3.3.3 Import, and the legacy sources

**Import is lossy in the direction that matters, and MUST NOT be papered over (NORMATIVE).** No
target in the matrix carries an egress class, a license class, a trust tier, or a record count, so a
manifest produced by importing one is **incomplete by construction**. An importer:

- **MUST NOT** synthesize a `dataset-jsonl-header` or any of its axes. It emits the job with the
  `dataset.header[]` slot **unfilled** — absent, not defaulted — so §4.1's one-header-per-record-file
  requirement is unmet and §4 refuses the job until a producer supplies the axes. An absent header is
  *not* the `exportable` default of §4.1: that default applies to a header that omits `egress`, never
  to a manifest with no header at all.
- **MUST NOT** infer an egress class from where the source job was running, and **MUST NOT** infer a
  license class from the base model's or dataset's name.
- **MUST** record the source format and its pinned revision in the conversion record, so an imported
  job is distinguishable from an authored one.

**torchtune — a legacy source format only.** torchtune's YAML recipe configs are accepted as an
**import** source and appear in this section for that reason alone. The project is **officially wound
down** — its README carries the wind-down notice and its last release is **v0.6.1, 2025-04-07** (as
observed 2026-08-13). It is therefore **NOT** a live emit target, **NOT** a recommended backend, and
**MUST NOT** appear in a provider's engine ladder (§9) as a supported runner. A converter MAY read a
torchtune recipe; it **MUST NOT** emit one. Note that torchtune expresses the adaptation axis in the
**recipe name** (`lora_finetune_single_device` and siblings) rather than in a field — an importer
recovers `method` from the recipe identifier, and where it cannot, leaves `method` unset rather than
guessing, which fails admission under FT-F exactly as it should.

#### 3.3.4 Conformance

Conformance for a conversion is the **round-trip**, not a document shape — the same criterion KMI
§3.4 fixes for its lineage projections. A converter is conformant when, for every job it emits:
(a) every mapped field appears in the target with the same meaning, (b) every unmapped non-droppable
field appears in the conversion record, (c) every gating field that is unmappable produced a refusal
instead of a config, and (d) re-importing the emitted job yields a manifest that differs from the
original **only** in fields the record already names. KFT therefore mints no schema for a converted
job — the target owns its own format — and the conversion **fixtures** are a downstream follow-up
under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) (koine specifies, implementers
validate), added to the §9.1 handoff list rather than built here.

### 3.4 Resumption — the continuation leg (NORMATIVE)

A training run is interrupted — a preempted host, a crashed process, an expired lease — and the work
already done sits on disk as a **checkpoint**. §6 has always published that checkpoint's KMI asset id
on the telemetry stream and annotated it *resumable*, and until 0.6.0 no §3 field could name one: the
only slot that accepted the ref was `hyperparams`, which no normative clause reads
([`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md), FT-R/FT-S). This
section closes that. A resume ref is a **first-class, gating input**, and a resumed run is a
**continuation leg** of a training that began before it.

**Resumption is not warm start.** The two cases §11.3 held in one sentence are different shapes, and
they stay separate:

| | Names | Is | Expressed by |
|---|---|---|---|
| **Warm start** — continued pre-training, sequential LoRA | a *released* model | a **new training** over a finished model | `base_model` — a finetuned model is a KINP `model` entity like any other (§5.1), so this needs no new surface and none is added |
| **Resumption** — the same training, picked up | a *mid-run* checkpoint | the **same training**, one leg later | `resume` (this section) |

`base_model` remains REQUIRED in both: a continuation leg has the same base as the leg it continues,
and a resumed warm start simply carries both fields.

**The `resume` object.** Optional. Absent ⇒ the job is a **cold** run and every clause below is
inert — which is why every 0.5.0 manifest stays conformant and why §4 admits and refuses a cold job
on exactly the inputs it did before. Present ⇒ the job is a continuation leg.

| Field | | Meaning |
|---|---|---|
| `checkpoint` | REQUIRED | KMI asset id of the checkpoint to resume from — the same id §6 published. §5.3 already types it (`application/vnd.koine.model+…` bytes, byte-hash id, `fetch:asset`); no new artifact kind, media type, or plane is introduced here. |
| `of_job` | REQUIRED | KINP activity id of the leg that published it (§5.2) — what makes the leg attributable and what §5.2's `continues` edge points at. |
| `at_step` | REQUIRED | The §6 `step` the checkpoint was published at: §7's netting operand and the boundary §6's join rule turns on. |

Four rules bind it:

- **The ref is a pinned input of the run.** §5.2's `used[]` **MUST** include `resume.checkpoint`, and
  the reproducibility anchor (FT-C) is the `job` activity with **its pinned input ids — the resume ref
  among them —** `seed`, and `config_hash`. Without this, two legs agreeing on `job` shape, `seed` and
  `config_hash` produce different models, and the anchor stops determining the run at exactly the
  point resumption enters.
- **`resume` is the only slot.** A provider **MUST NOT** accept a resume ref carried anywhere else in
  the manifest. A checkpoint id appearing in `hyperparams` — permissive by §3, and read by no clause
  of §4.2, §4.3, §5.2 or §7 — is **not** a resume ref: the provider **MUST refuse the job** with code
  `invalid` (§8.1) rather than execute it, because executing it is the §4.2 bypass this fold exists to
  close (a checkpoint of a `local-only` corpus placed on cross-boundary compute by a gate that never
  saw it).
- **A checkpoint is never corpus.** `resume.checkpoint` **MUST NOT** appear in
  `dataset.{knowledge,media,records}[]`. Those slots are admitted *as training data* — folded into
  §4.2's aggregate and §4.3's union as corpus, and priced by §7 as samples — and a checkpoint is not
  data the run learns from. It **gates** (§4.2 reads it) without being **counted** (§7 does not price
  it as samples), and the two are different things.
- **The leg is a new activity.** A resumed run **MUST NOT** reuse the activity id it continues; §5.2
  fixes what it mints instead and how the legs are linked.

Where each remaining obligation lands: admission reads the ref in **§4.2/§4.3**, activity identity and
the `continues` chain are **§5.2**, the class a mid-run checkpoint carries is **§5.4**, the telemetry
stream and the curve-join rule are **§6**, and the remainder estimate against a chain-cumulative
ceiling is **§7**. Conversion is **§3.3.2**'s two rows and its fifth normative consequence.

---

## 4. Training-data admission (NORMATIVE)

Training data is referenced, described, and **gated** by the data planes — KFT adds the rule that
turns those planes' existing axes into fine-tuning admission control.

### 4.1 References, not payloads

Training data is referenced under **three** slots, one per kind of thing a corpus can be:

- **Knowledge/text data** (`dataset.knowledge[]`) is one or more KGP GroundingPacks (`kgp:pack:…`);
  their `dialect` (KGP §5) and the shared relation registry describe the content.
- **Media data** (`dataset.media[]`, multimodal) is one or more KMI assets (`…:asset:…`), fetched
  lazily via the KCB `fetch:asset` verb + grant (KMI §7, KCB delta G). Augmented/derived training
  samples are recorded in the KMI asset-lineage graph (`media:variant_of` / `media:derived_from`,
  KMI §3), so a training corpus is itself a byte-reproducible, lineage-tracked artifact.
- **Training records (`dataset.records[]`, FT-M)** are the JSONL files holding the training **rows**
  themselves — a producing application's *training exhaust* (accepted edits, generations, preference
  pairs, QA labels), and the join surface FT-I puts the per-sample pairing on. Such a file is neither
  a bundle of KGP entities/assertions/links (KGP §2) nor image/video/audio bytes, so it gets its own
  slot: it is referenced as a **KMI asset** carrying the media type
  `application/vnd.koine.dataset+jsonl`
  ([`../registry/media-types.tsv`](../registry/media-types.tsv)), content-addressed and fetched with
  the same `fetch:asset` verb and grant as any other asset. Referencing it as an *asset* is what
  keeps by-reference discipline honest — the rows never enter the manifest.

Every file in `dataset.records[]` opens with a **`dataset-jsonl-header`**
([`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json)): the
first line of the file, describing the training-record layout and carrying the license, trust tier,
**egress class** and record count that travel with the set.

- **The header rides the manifest too, once per record file (FT-O).** `dataset.header` is that first
  line, copied inline — an **array**, positionally one per `dataset.records[]` entry (a single header
  object is the degenerate one-file form). It exists so the provider can run the §4.2 egress gate and
  the §7 spend estimate **before** fetching a byte. A provider that later fetches the file **MUST**
  verify the inline header against the file's actual first record and **reject the job with a report**
  on disagreement — the inline copy is a claim, the file is the truth.
- **The header's axes are file-level aggregates (FT-N/FT-P).** `egress` is the **most restrictive**
  class over the file's rows and `license` the **union** of theirs; `recordCount` is the number of
  rows after the header. A producer **MUST NOT** emit a file whose header understates any row —
  the same producer-filters-at-construction discipline KGP §7.2 applies to a pack. A producer whose
  rows differ in class splits the file rather than widening the header.
- **Dataset description (`dataset.descriptor[]`)** is not a fourth corpus slot — it is the
  *description* of the three above, and it is **Croissant's, not KFT's** (§4.1.1). The slot holds
  KMI asset ids of Croissant v1.1 documents; it is optional, additive, and **never read by the
  admission gate**.
- **Paired multimodal samples (FT-I).** `dataset.knowledge[]` and `dataset.media[]` name the
  *referenced corpora*, not the training samples. The **per-sample pairing** — which image goes with
  which caption, the basic shape of every image/video-text-to-text (and the caption side of
  text-to-image) finetune — rides the **`dataset.records[]` training records**: a row references both
  a KMI `asset` id *and* its text. Alignment thus travels with the same records that already carry
  license + trust tier; the corpus arrays are the fetch/egress manifest, the records are the join.

#### 4.1.1 Dataset description — MLCommons Croissant, adopted by reference

**KFT does not describe datasets; Croissant does.** MLCommons **Croissant v1.1** is the ML-dataset
description format — a schema.org `Dataset` vocabulary in JSON-LD, with `distribution`
(`FileObject` / `FileSet`) for the files and `recordSet` / `field` for the records, their fields,
their data types, and their splits — and it is the one with real adoption: **Hugging Face, Kaggle,
and OpenML** publish it for their datasets. A KFT job therefore **points at a Croissant-described
dataset**. It does not re-express what Croissant already says, and the fields it holds instead are
exactly the ones Croissant has no place for.

- `dataset.descriptor[]` is a set of **KMI asset ids**, each naming a Croissant v1.1 document
  carrying the IANA type `application/ld+json`. **koine mints no media type for it** — that is the
  point of adopting rather than restating — and the document is fetched with the same `fetch:asset`
  verb and grant as any other asset (§4.1), so by-reference discipline is unchanged.
- The array is **not positional**: one descriptor MAY cover any subset of `knowledge[]` /
  `media[]` / `records[]`, and a job MAY carry several. (Contrast `dataset.header`, which *is*
  positional — one per `records[]` entry, FT-O — because it is an admission input and every record
  file needs its own.)
- The slot is **OPTIONAL**. A producer whose corpus has a published Croissant description
  **SHOULD** reference it; a job without one is exactly as conformant as it was at KFT 0.4.0.
- KFT **MUST NOT** grow a field that restates a Croissant one. Field layout, data types, splits,
  file organization, citation, and the human-facing dataset description belong to Croissant; adding
  any of them to §3 is a defect, not an extension.

**The seam.**

| | Held by | Covers |
|---|---|---|
| **What Croissant covers** | Croissant v1.1 | dataset name / description / citation; `distribution` file layout; `recordSet` / `field` structure, data types and splits; the descriptive `license` string or URL |
| **What KFT adds on top** | KFT §3 / §4.1 | a **fabric-resolvable reference** to that document (a content-addressed KMI asset, fetched under a `fetch:asset` grant) and the join to the KGP pack / KMI asset ids the run actually trains on — Croissant describes a dataset, KFT names *which fabric objects* a *particular run* consumed |
| **What a producer must still supply** | `dataset-jsonl-header` (§4.1) + the referenced packs/assets | the **license class** (§4.3, KGP §7.1), the **egress class** (§4.2, FT-N), the **provenance trust tier** (§4.3), and **`recordCount`** (§7, FT-P). Croissant has no egress and no trust-tier concept at all; its `license` is a descriptive string, not koine's *enforcing* class; and any count it carries is documentation, not an admission input |

**The gate does not read Croissant (NORMATIVE).** A descriptor is descriptive metadata and **never
an admission input**. §4.2's egress gate, §4.3's license/trust lineage, and §7's spend estimate read
the `dataset-jsonl-header` and the referenced packs/assets — exactly as they did at 0.4.0. A
provider **MUST NOT** derive an egress class, license class, trust tier, or record count from a
Croissant document, and **MUST NOT** admit or refuse a job on its contents. Where a descriptor
disagrees with a header, **the header wins and the descriptor is the bug** — the same
the-inline-copy-is-a-claim discipline §4.1 already applies to the header itself. This is what makes
the adoption safe: it adds a document an implementer may read, not a rule the gate must run. §3.2
generalizes this clause to **every** descriptor slot, model side included.

**The re-open test.** If Croissant later specifies an *enforcing* egress/redistribution class and a
provenance trust tier with the semantics KGP §7 gives them, the third row above is occupied and KFT
should carry the header's axes as a Croissant extension rather than beside it — the same re-open
discipline KGP §3.4 and KMI §3.1 state for their own claims.

---

### 4.2 The egress gate (NORMATIVE)

KGP §7.2 already defines `local-only` as knowledge "hard-gated out of … any export or **training
set**." KFT operationalizes that sentence:

- The **effective egress class** of a finetune run is the *most restrictive* egress class across
  **all** its training data — every knowledge record (KGP §7.2), every media asset, and every
  `dataset.records[]` file (its header's `egress`, §4.1) — **and the base-model entity's own egress
  class (FT-B).** If any input — data *or* base — is `local-only`, the run's effective egress is
  `local-only`. (A can't-leave base pins an all-`exportable` corpus to local compute just as a
  `local-only` record does.)
- **A resume ref joins the aggregate (§3.4).** Where the job carries `resume`, the effective egress
  class is taken over `{training data ∪ base model ∪ resume.checkpoint}`. A checkpoint carries the
  class §5.4 bound to it when it was published, and it *is* the weights that already absorbed the
  earlier leg's corpus — so a leg resuming a `local-only`-inheriting checkpoint is `local-only`
  however `exportable` its own new data is. Continued pre-training over a fresh corpus is precisely
  the case this closes: without it the gate computes over `{new corpus ∪ base}`, finds everything
  `exportable`, and admits a cross-boundary placement for bytes that memorized what §4.2 was
  protecting.
- **The gate reads the header, never the trust tier (FT-N).** For a record file the *only* descriptor
  available at admission is its `dataset-jsonl-header`, so that header MUST carry the class
  explicitly. A provider **MUST NOT** infer egress from the `tier` — KGP §7.2 makes the trust tier
  descriptive and the egress class enforcing, and `personal` data that happens to be `exportable`
  (or `curated` data that is not) is exactly the case an inference gets wrong. A record file whose
  header omits `egress` takes KGP §7.2's `exportable` default, which is why understating it (§4.1) is
  a producer bug, not a permissive choice.
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
- **The gate sits upstream of every encoding (KGP 0.5.x) — no clause added.** KGP §7.2 filters
  `local-only` at pack construction and states that enforcement is **never delegated to a
  serialization or projection**, so the RDF-star / PROV / JSON-LD projection KGP 0.5.x specifies
  (KGP §4.1) carries the egress class only so a consumer can *re-check* it. A projected corpus is
  therefore not a route around this gate: the rules above already bind the referenced pack, whatever
  encoding it arrives in. The claim-identity surface KFT depends on (KGP §3/§3.3) is byte-unchanged
  across 0.4.0 → 0.5.x, so no `kgp:pack:…` reference in a job manifest (§3) moved.

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
- **A resume ref is in the union too (§3.4).** Where the job carries `resume`, the union license is
  taken over the checkpoint's inherited license as well, and its trust tier travels the same way. The
  earlier leg's corpus is *in the weights* whether or not this leg re-lists those records in its own
  `dataset` — so a continuation leg that lists only a permissively-licensed new corpus does not
  launder the restriction the leg it continues acquired.

---

## 5. Models, weights & exports (identity + lineage)

Fine-tuning produces artifacts on two planes; KFT fixes how they are identified and linked so the
whole training lineage is queryable on the fabric.

### 5.1 Models are KINP entities

Base and finetuned models are KINP entities of type `model` (with a `modality` refinement, §3.1) —
the type + its refinement registered in [`../registry/entity-types.tsv`](../registry/entity-types.tsv).
An **external** base model (Hugging Face Hub, etc.) is a *minted* KINP `model` entity carrying an
**external anchor** to its Hub coordinate — exactly as KINP entities anchor to Wikidata QIDs — so it
is a resolvable fabric node, not an ad-hoc `hf:…` string (FT-G). A finetuned model id is likewise
**minted, not content-addressed** (§5.2, FT-C). The finetuned model links to its base with the
reserved lifecycle relations (KINP §4):

```prolog
% base is a minted entity with an external anchor to the Hub coordinate (FT-G):
same_as(refkb:model:qwen2.5-3b-instruct, ext:hf:Qwen/Qwen2.5-3B-Instruct).
based_on(orchestrator:model:qwen2.5-3b-worldsim-slm, refkb:model:qwen2.5-3b-instruct).
derived_from(orchestrator:model:qwen2.5-3b-worldsim-slm, refkb:model:qwen2.5-3b-instruct).
```

#### 5.1.1 Published lineage — the Hugging Face `base_model` convention, adopted by reference

The fabric-internal answer to "what was this trained from" is the KINP relation pair above
(`based_on` / `derived_from`), because that is what the KGP envelope — confidence, provenance,
world — can carry. The **published** answer already has a convention, and KFT reuses it rather than
minting a parallel field: the Hugging Face Hub's model-card metadata key **`base_model`**, carried
by millions of repos and **validated and linked by the Hub itself**, alongside
**`base_model_relation`** (`adapter` / `quantized` / `finetune` / `merge`). Minting a koine
"trained-from" key to sit beside a working, validated, universally-emitted one would compete with it
and lose; there is nothing KFT could put in such a field that `base_model` does not already say.

- When a producer **publishes** a weight or export asset (§5.3) to the Hub, it **MUST** populate
  `base_model` from the base entity's **external anchor** — the `same_as ext:hf:…` link §5.1
  already requires (FT-G) — and **SHOULD** populate `base_model_relation` from the job's `method`
  and artifact kind:

  | KFT artifact | `method` | `base_model_relation` |
  |---|---|---|
  | LoRA / QLoRA adapter | `lora`, `qlora` | `adapter` |
  | full or preference-tuned weights | `sft`, `full`, `dpo` | `finetune` |
  | merged fp16 weights | any (merge step, §5.3) | `merge` |
  | GGUF / ONNX / CoreML / TFLite export | any (quantize/convert, §5.3) | `quantized` |

- **When the base has no Hub coordinate.** A locally-trained base, a licensed vendor checkpoint, or
  an earlier finetune of the fabric's own has no `ext:hf:…` anchor. The producer **MUST NOT** invent,
  guess, or approximate one: an unresolvable `base_model` value is strictly worse than an absent one,
  because the Hub validates and links the key and a dangling coordinate misattributes lineage to
  whatever repo it happens to name. Instead, `base_model` is **omitted**, and the base's **KINP
  entity id** is recorded in the model-card body and in the run's PROV `used` (§5.2), which is where
  the authoritative answer lives anyway. Nothing fabric-internal changes: `based_on` / `derived_from`
  are present in **every** case, Hub coordinate or not.
- `base_model` is therefore a **projection** of §5.1's relations onto the Hub, not their canonical
  form — and it is a projection that may be unavailable by design, since a model inheriting
  `local-only` (§5.4) is never pushed to the Hub at all.
- **The card is referenceable from the job (§3.2).** A job MAY name the base's published card — the
  same document that carries `base_model` / `base_model_relation` — in `base_model_descriptor[]`, as
  a KMI asset id. That is the model-side twin of `dataset.descriptor[]` (§4.1.1) and it is
  descriptive only: the base's lineage of record is the KINP entity and its `same_as` anchor, so a
  provider **MUST NOT** read a base-model coordinate, license, or egress class out of a referenced
  card (§3.2).

**The seam.**

| | Held by | Covers |
|---|---|---|
| **What the HF convention covers** | Hub model-card metadata | the published `base_model` coordinate and `base_model_relation` kind, validated and back-linked by the Hub, for models that live on the Hub |
| **What KFT adds on top** | KFT §5.1 / §5.2 | lineage for bases and models that are **not** on the Hub; the run **activity** that produced the edge (`seed`, `config_hash`, pinned input ids — FT-C); and the same edge expressed as a first-class fabric claim, so "what derives from this base?" is answerable by query rather than by crawling model cards |
| **What a producer must still supply** | KFT / KINP | the `same_as` external anchor (§5.1), the `retrains` / `supersedes` edge on a re-train (§5.2), and the §5.4 egress + union-license inheritance that decides whether the model may be published to the Hub **at all** — none of which the Hub convention expresses |

---

### 5.2 The run is a PROV activity

The `job` id (§3) is a KINP PROV **activity** (KINP §7.1). Its provenance record makes the run
fully attributable and the lineage bidirectionally queryable ("what trained this model?" / "what
derives from this base?"):

```jsonc
{ "activity": "orchestrator:activity:ft-run.9f2a",
  "agent":    "provider:org:trainer",              // signed (§7); the training provider
  "used":     ["kgp:pack:sha256-7b1e…", "analyzer:asset:blake3-a1b2…",
               "refkb:model:qwen2.5-3b-instruct"],        // the base entity, not a raw hf:… string (FT-G)
  "generated":["orchestrator:model:qwen2.5-3b-worldsim-slm",
               "orchestrator:asset:blake3-w0…"],    // the weight asset(s), §5.3
  "seed": 42, "config_hash": "sha256-cfg…",         // reproducibility anchor lives on the RUN (FT-C)
  "budget_units": 1800000, "spent_units": 1732004 } // §7
}
```

**Models are the fabric's first non-content-addressed *generated* entity (FT-C).** GPU
nondeterminism means two identical runs do not produce byte-identical weights, so a finetuned model
id **cannot** be content-addressed the way KGP packs and KMI assets are (KGP §2.1). The
**reproducibility anchor is the run** — the `job` activity with its pinned input ids, `seed`, and
`config_hash` — not the model bytes. A re-train over the same inputs mints a *new* model entity
linked to its predecessor with a `retrains` / `supersedes` lifecycle relation (KINP §4;
[`../registry/relations.tsv`](../registry/relations.tsv) — `retrains` is registered there alongside
`supersedes` / `retracts`), never a silent id collision.

**A resumed run is a NEW activity, linked by `continues` (NORMATIVE).** A run that resumes from a
checkpoint (§3.4) **MUST** mint a new `job` activity and **MUST NOT** reuse or amend the record of the
leg it continues. A KINP PROV activity is one occurrence with one `agent`, one `used[]`, and one
`budget_units`/`spent_units` pair; a continuation leg differs in all of them, and §6's lifecycle has
no transition back into `running` from a terminal state. The new leg is linked to the one it continues
by **`continues`**, registered in [`../registry/relations.tsv`](../registry/relations.tsv) beside
`retrains` and `supersedes` and distinct from both: `retrains` is a re-train **from scratch** over the
same pinned inputs, `supersedes` **replaces** a prior record. A continuation leg re-trains nothing and
replaces nothing — it picks up work in progress.

- The edge runs from the new leg to `resume.of_job`. Legs form a chain; the training's **root** is the
  leg with no outgoing `continues`.
- **"What trained this model?" is answered over the chain, not over one leg.** The finetuned model
  entity is minted by the leg that reaches `succeeded` and pins **that** leg's activity id (§5.1); the
  corpus, spend, and placement history of the whole training is recovered by walking `continues` to
  the root, with each leg's own `used[]`, `seed`, `config_hash`, and `spent_units` staying on its own
  record. A model whose producing run resumed **MUST** leave that chain resolvable — an unresolvable
  `continues` target is a broken lineage, the same defect as an unresolvable `used[]` id.
- Every leg is separately attributable and separately signed (§7), so resumption on a different
  provider, in a different tier, or under a different grant is **visible as such** rather than folded
  into one record of a run that never happened that way.

### 5.3 Weights & exports are KMI assets — the export matrix *is* the lineage graph

Model weights are large bytes → KMI assets (byte-hash id, `application/vnd.koine.model+…` media
type — registered in [`../registry/media-types.tsv`](../registry/media-types.tsv) — fetched via
`fetch:asset`). **Every export format is another asset in the KMI lineage graph
(KMI §3)** — no bespoke export registry; the `media:derived_from` / `media:variant_of` links below
are the KMI relations in [`../registry/relations/media.tsv`](../registry/relations/media.tsv):

| Artifact | KMI media type | Lineage link |
|---|---|---|
| LoRA adapter | `application/vnd.koine.model+safetensors` | `media:derived_from` base weights |
| merged fp16 | `application/vnd.koine.model+safetensors` | `media:derived_from` adapter + base |
| GGUF Q4_K_M | `application/vnd.koine.model+gguf` | `media:variant_of` merged fp16 |
| ONNX / CoreML / TFLite | `application/vnd.koine.model+onnx` (etc.) | `media:variant_of` merged fp16 |

Quantizations are `variant_of` (same model, different byte encoding) exactly as KMI models
resolution variants of a video — so a host's GGUF/ONNX/CoreML/TFLite export surface
falls out of the ratified media plane for free, with lineage, rather than as a new subsystem.

**What the KMI 0.3.x pin changes here: nothing.** KFT uses only the asset envelope (KMI §2), the
lineage graph (KMI §3), and byte transport (KMI §7) — the surfaces 0.3.x left untouched. It cites
no clause of KMI §4, so neither the OTIO adoption nor the deprecation of
`application/vnd.koine.edl+json` (KMI §4.4, removed at **KMI 0.4.0** under KCB §7.3) reaches a
model artifact: weights and exports are plain assets, never timeline items.

#### 5.3.1 Weights packaging — KitOps / ModelPack, adopted by reference

The table above types weight and export artifacts as KMI assets and fixes their **lineage**. How the
bytes are *laid out inside a package* is a different question, and it is already answered:
**KitOps / ModelPack** packages a model as an **OCI artifact** described by a `Kitfile`, whose
**`model.parts[]` entries each carry a `type`** — a vocabulary that already contemplates the **LoRA
adapter** case, which is precisely KFT's `method: lora | qlora` output. Adapter, base, config,
docs, and datasets travel as typed parts of one package with registry push/pull semantics and
tooling behind them.

- KFT **specifies no weights layout, part-type vocabulary, or package manifest**, and **MUST NOT**
  mint one. A producer MAY package weights and exports as a ModelPack/KitOps ModelKit; where it
  does, the packaging is that standard's and the §5.3 table still types the assets and their
  lineage. A producer that ships bare `safetensors`/`gguf` assets is equally conformant — KFT's
  obligations are about identity and lineage, not containers.
- A ModelKit's parts and a KFT export matrix are **not** in competition: a part is a file in a
  package, an export is a node in the lineage graph. One ModelKit MAY carry several KMI assets, and
  one KMI asset MAY appear in several ModelKits.

**The seam.**

| | Held by | Covers |
|---|---|---|
| **What KitOps / ModelPack covers** | the `Kitfile` + OCI artifact | package layout; `model.parts[]` and their `type` (including the LoRA/adapter case); co-packaged config, docs, and datasets; distribution through an OCI registry with digest addressing and push/pull semantics |
| **What KFT adds on top** | KFT §5.2 / §5.3 | a **KINP/KMI asset identity** per artifact and the **lineage graph** between them — which adapter derives from which base weights, which GGUF is a `variant_of` which merge — expressed in the KGP envelope so model artifacts are queryable beside knowledge, plus the **run activity** (§5.2) that generated them |
| **What a producer must still supply** | KFT §5.4 / KMI §2 | the **egress class** and **union license** the artifacts inherit (§5.4) — a ModelKit expresses neither, and *an OCI registry push is exactly the cross-boundary publication §5.4 forbids for a `local-only`-inheriting model* — plus the KMI asset envelope (byte-hash id, `source_world`) and the `job` activity id |

**Which KMI lineage obligations remain KFT's.** All of them: the §5.3 table's `media:derived_from` /
`media:variant_of` edges, their registration in
[`../registry/relations/media.tsv`](../registry/relations/media.tsv), the model media types in
[`../registry/media-types.tsv`](../registry/media-types.tsv), and the §5.4 inheritance are unchanged
by this adoption. Packaging is orthogonal to lineage, and adopting a package format discharges no
lineage clause.

---

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
- **Checkpoints inherit at publication, not at completion (NORMATIVE).** §5.2 mints the model entity
  when the run *completes*, so scoping inheritance to the model "and every weight/export asset it
  generates" would leave everything a **running** job emits unbound. It does not: every **checkpoint**
  asset a run publishes (§6) inherits the run's effective egress class and union license **from the
  moment it is published** — both are already computed at admission (§4.2/§4.3) — and carries them on
  its KMI envelope. There is no window during which a checkpoint of a `local-only` run is unclassified,
  and the rule holds whether or not the run is ever resumed.
- **Publishing a checkpoint id is not widening its class.** §6 puts the checkpoint reference on a
  `subscribe` stream and instructs consumers to `fetch` lazily; the reference is an **address**, and
  the class on the envelope governs that fetch exactly as it governs a weight asset's. A
  `local-only`-inheriting checkpoint **MUST NOT** be fetched across the tier boundary, pushed to a
  cloud store, or replicated into a store outside the authority domain (KMI §7.1) — and a provider
  offered such a ref by a resuming leg outside that boundary refuses it under §4.2.
- Inheritance is carried on the model's provenance (§5.2) and on each weight asset's envelope, so it
  travels with the bytes and is answerable without re-deriving the corpus.

---

## 6. Run lifecycle & the training-telemetry stream

- **Start.** `invoke` (KCB §4) begins an async run (A2A task). Lifecycle states — the conventional
  set, for parity with existing control-plane engines — `pending → running → succeeded | failed |
  canceled`.
- **Progress.** A consumer `subscribe`s (KCB §4) to receive the **training-telemetry** stream — the
  real replacement for a stub runner's fabricated loss curve. (Named
  *telemetry*, not "training-exhaust", to avoid colliding with the `dataset-jsonl-header`
  training-record convention that already owns that term — FT-H.):

  ```jsonc
  { "job": "orchestrator:activity:ft-run.9f2a", "step": 120, "attempt": 1,
    "metrics": { "train_loss": 0.83, "eval_loss": 1.02, "lr": 1.7e-4, "grad_norm": 0.4 },
    "checkpoint": "orchestrator:asset:blake3-ck12…", // optional KMI asset (resumable)
    "samples":    ["analyzer:asset:blake3-pv3…"],     // optional preview assets — grids/clips (FT-L)
    "ts": "2026-07-22T18:04:11.000Z" }
  ```

  Events are idempotent under redelivery (content-addressed job+step), so the stream needs no
  exactly-once guarantee (KCB §4). A `checkpoint` reference MAY arrive before its bytes propagate;
  consumers tolerate the dangling ref and `fetch` lazily (KCB delta L). The class that ref resolves
  under is fixed at publication by §5.4 — a stream carrying a checkpoint id never widens what a
  consumer may do with the bytes.
- **A continuation leg streams under its own `job` id, and `step` keeps counting (NORMATIVE, §3.4).**
  Because §5.2 requires a resumed run to mint a **new** activity, the `job+step` key above stays sound
  across a resumption: two legs never collide on it, and the idempotency guarantee is unchanged and
  unweakened. `step` is counted from the start of the **training** (the root leg), not from the resume
  point, so the legs of one training share one continuous step axis — with a deliberate **overlap**,
  since the steps between the last checkpoint and the interruption are re-executed and legitimately
  produce different metric values the second time.
- **The join rule (NORMATIVE).** A consumer reconstructing **one** training curve across legs orders
  the legs by the §5.2 `continues` chain and, where two legs' `step` ranges overlap, takes the **later
  leg as authoritative**: the earlier leg's events above its successor's `resume.at_step` describe work
  that was discarded when the checkpoint was resumed from. `attempt` is an optional 1-based ordinal
  along that chain, emitted as a convenience so a consumer can order legs without resolving lineage —
  it is **not** authoritative, the chain wins on any disagreement, and a consumer that never sees one
  loses nothing.
- **Completion.** The terminal event carries the generated finetuned-model entity id, its weight
  asset ids (§5.3), the resolved eval results (§6.1), and `spent_units` (§7).
- **Eval / reward** *(§6.1)*. `job.eval` names KCS conformance scenarios (a world producer's
  rule-generation and grading harnesses, an authority's frozen eval protocols) run against the
  finetuned model **as a capability**, over the real path, in a downstream conformance console
  (KCS, ADR-0001 §7). The same scenarios serve as
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
- **What the grant is scoped to (KCB 0.4.x).** A grant binds to `(capability, major)` (KCB §5): an
  `invoke:finetune` token issued while `finetune` was at major 1 authorizes every **1.x** and does
  **not** authorize major 2, and the major never enters the grant name. Two consequences for a
  training run, neither of them a KFT clause: a provider cannot widen an already-issued ceiling by
  publishing a breaking `finetune`, and a **re-price** is a version bump the pinned caller can see
  rather than a silent bill — the ceiling is evaluated at invoke against the *then-published* cost,
  so a raise past the remaining ceiling fails at the gate (KCB §5). The per-job estimate below is
  KFT's own addition on top of that machinery, not a replacement for it.
- **Admission-time estimate (FT-E).** The manifest's static `cost.est_units` (§2) cannot gate a
  variable-size job whose data is `fetch`ed lazily (KMI §7). The provider therefore computes a
  **per-job estimate** at admission — after resolving dataset cardinality — and checks *that* against
  the ceiling; a run is admitted only if the resolved estimate fits, not merely the manifest figure.
- **Cardinality of a record file comes from its header (FT-P).** For `dataset.knowledge[]` and
  `dataset.media[]`, cardinality is resolvable from the manifest — the arrays enumerate their members.
  A single `dataset.records[]` asset (§4.1) may hold ten rows or ten million, so cardinality is *not*
  recoverable from the reference, and transferring the file to count it would defeat the
  before-you-fetch estimate this clause exists for. The header's **`recordCount`** carries it, and the
  provider **MUST** re-check the count when it fetches (§4.1) and **fail the run with a report** if
  the file exceeds the estimate the ceiling was granted against.
- **A continuation leg is estimated on the remainder (NORMATIVE, §3.4).** Where the job carries
  `resume`, resolving cardinality is not enough: the corpus and `epochs` are unchanged, so an
  unmodified estimate prices the **whole** training again. The provider **MUST** estimate the
  **remaining** work — the resolved total less the work completed at `resume.at_step` — and **MUST**
  verify `at_step` against the prior leg's provenance (§5.2) and telemetry (§6) rather than trusting
  the manifest, refusing with code `invalid` (§8.1) on disagreement. That is the same discipline §4.1
  applies to an inline `dataset-jsonl-header`: the manifest states it up front so the gate can run
  before any transfer, and the provider re-checks it against the artifact.
- **The ceiling bounds the training, not the leg (NORMATIVE).** A continuation leg's estimate is
  checked against the ceiling **net of the cumulative `spent_units` of every leg in its §5.2
  `continues` chain**. Both failures this closes are real. Against a fresh full ceiling, one training
  is authorized twice and §7's hard gate stops bounding a run at all — every preemption
  re-authorizes it. Against the *remaining* ceiling with a *whole-run* estimate, the leg is refused
  `over-budget` (§8.1) for work it will not do, with a truthfully empty `route_to[]` because no
  provider can do it cheaper — making resumption impossible under any ceiling fitted to the job, the
  tighter the grant the more certainly. A leg whose **remainder** genuinely exceeds the remaining
  ceiling is still refused `over-budget`, unchanged; that refusal is now about the work left, which is
  what the ceiling was granted against.
- **Issuer.** Grants are issued by the control-plane host's workforce governance (KCB §5/§6); the
  host hosts the registry and provisions the training provider as an org.
- **Signing.** The job manifest (§3) and the resulting model entity's provenance (§5.2) SHOULD be
  signed with the shared `{key_id, alg}` shape (KCB §5, KGP §9.3), so *who* trained *what* on
  *which* data under *which* budget is cryptographically attributable, not merely asserted. A model
  arriving from a low-trust training agent feeds the same merge/review posture as a low-trust pack
  (KCB §5, KINP §11 decision 2).

---

## 8. Discovery — the finetuned-model registry is reuse, not a new registry

A finetuned model is a KINP entity that a capability can `produce`; therefore it is registered in
the **KCB discovery registry** (KCB §3) and resolved via the **resolver** (KINP §8) like any other
fabric node. This *is* the "finetuned-registry" that host CLIs and earlier deployment roadmaps
named — the existing index, not a bespoke one.

Because ports are plane-typed and path-searchable (KCB §2.1/§3), a finetuned model is **composable**:
a query "find a model that produces `audio/midi` from a `mood` (knowledge)" returns a finetuned
audio model and an address to invoke it directly. Fine-tuning thus feeds capability composition —
each finetuned model is a new leg the registry can route through — rather than terminating in a
private artifact store.

**Provider selection (FT-K).** More than one `finetune` provider can match a job — a general
trainer and a specialized provider (§9) may both accept `text-generation`. The registry
disambiguates by preferring the more **specialized** matching provider, then lower `cost` (KCB §3); a
job MAY name a target provider explicitly; an unbroken tie is **surfaced to the caller**, not resolved
silently.

### 8.1 Graded refusal routing (NORMATIVE)

Discovery routes a job on a **match** (§8). This section routes it on a **refusal** — the third
defensible claim of §1.1. Under FT-K a job may reach a provider that cannot take it while another
provider can, and in a multi-provider fabric that is the ordinary path, not an error path: a
specialized, containment-bound provider refusing an out-of-envelope job is exactly what it is *for*.
Everywhere else in the field that refusal is terminal — a stack trace, an HTTP 400, a quota rejection —
and the caller re-discovers from scratch. Here it is a routing signal.

KFT already specifies every point at which a job is refused: `modality × method` incompatibility
(§3.1, FT-F), the egress gate and an unsatisfiable egress pin (§4.2, FT-J), a header that disagrees
with its file or a `recordCount` overrun (§4.1, §7), a projected cost over the grant ceiling (§7), and
a conversion that would drop a gating field (§3.3). Each of those says *"refused with a report"*.
**This section fixes what that report carries; it does not change which jobs are refused.**

- A refusal report **MUST** carry a `code` from this graded vocabulary, and the grade **MUST**
  distinguish *no provider can take this* from *I cannot take this*:

  | `code` | Meaning | Another provider may take it |
  |---|---|---|
  | `invalid` | The manifest is malformed, self-contradictory, or names an unresolvable id | No |
  | `incompatible` | The requested `modality × method` (or base architecture) is not a coherent job (FT-F) | No |
  | `out-of-envelope` | Coherent, but outside *this* provider's advertised ports, modality, or scale | **Yes** |
  | `unsatisfiable-here` | Coherent and in-envelope, but this provider's in-tier compute cannot run it under the job's egress pin (FT-J) | **Yes**, in-tier |
  | `refused-policy` | A normative gate refused it here — egress (§4.2), license (§4.3), or ceiling (§7) | **Only** where the same gate would pass |
  | `over-budget` | The admission-time estimate exceeds the grant ceiling (§7, FT-E) | Yes, under a different grant or a cheaper provider |

- When the grade admits a re-route — `out-of-envelope`, `unsatisfiable-here`, and the qualified
  `refused-policy` / `over-budget` cases — the report **SHOULD** carry **`route_to[]`**: resolvable
  registry addresses (§8, KINP §8) of providers whose advertised `finetune` ports accept this job's
  modality and method. It is an **address**, never a product name — the same
  registry-returns-an-address discipline [ADR-0007](../decisions/ADR-0007-self-describing-participant.md)
  states for self-descriptions — and it is a **hint**, not a delegation: the refusing provider does not
  forward the job, re-issue the grant, or speak for the named provider's admission, which runs again
  from scratch on arrival.
- **A route MUST NOT breach the gate it just enforced (NORMATIVE).** A `refused-policy` refusal over
  the §4.2 egress gate **MUST NOT** name a provider that would cross the same boundary — routing a
  `local-only` job to a cloud-capable trainer converts a correct refusal into the exact privacy breach
  §4.2 exists to prevent. Where no in-tier candidate exists, `route_to[]` is **empty or absent**; an
  empty route is a truthful answer and a wrong one is worse than none.
- A report **SHOULD** carry the offending field path and the class or value that failed, so a caller
  can repair rather than re-guess; it **MUST NOT** disclose the *contents* of a `local-only` corpus in
  doing so (naming the class is enough).
- **The gate does not move (NORMATIVE).** This section adds no admission input and no admission
  outcome. Every job admitted at KFT 0.4.0 is still admitted, every job refused is still refused for
  the same reason and from the same inputs, and FT-A…FT-Q are untouched. What changes is the shape of
  a refusal that was already going to happen.

---

## 9. Execution runtime (informative)

Per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) decision 1 ("two distinct routers,
never merged"), the `finetune` capability's **general implementation** is a leaf capability in a
runtime commons — a general `trainer` / finetune-router, sibling to the provider-router, and explicitly
**not** merged into it (inference routing and long-running stateful GPU training are different
concerns; merging routers is the anti-pattern KCB exists to prevent). KFT fixes only the contract;
the engine ladder and compute backend are **provider behavior**, exactly as KMI §6 leaves transform
runtime to the provider's fallback ladder:

- **Engine ladder inside the general trainer** (selected by `modality`+`method`): e.g. LLaMA-Factory
  (text-generation + VLM), Unsloth (fast single-GPU LLM), Axolotl (multi-GPU LLM), and diffusers +
  ai-toolkit/SimpleTuner (text-to-image/video).
- **Multiple providers, not one router (FT-K).** A participant MAY run its **own** specialized
  `finetune` provider — say a TRL+PEFT path tuned for small language models on local accelerators —
  as a distinct capability on the bus, **not** an adapter inside the general trainer. The registry
  (§8) routes each job between the general provider and any specialized one; training logic is
  deliberately **multi-provider**, so the runtime commons is the home of the *general* executor, not
  the sole trainer.
- **Compute backend** (a cloud-launcher → local accelerator or rented/cloud GPU) selected under the
  §4.2 egress gate and the §7 spend ceiling.

The **control-plane host** provisions the trainer as an org, hosts the registry, issues grants, and
its CLI / HTTP surface becomes a KCB client (discover → invoke → subscribe) — any stub loss curve
replaced by the §6 stream, a 404 registry by §8, export subcommands by §5.3.

### 9.1 Downstream runtime work (informative — cross-repo follow-ups, not built in koine)

Per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) (koine = contracts, no runtime code)
and the multi-provider decision (FT-K), ratifying KFT here **hands three runtime programs to
implementers**. None is authored or built in koine; each is run under its own repo's quality gates.
This subsection is **informative** — it describes what implementers must build and binds no clause.
The concrete repo-by-repo assignments, tasklist stems, and build order are deployment facts recorded
in that deployment's own integration repo (its adoption program map and topology), not here.

| # | Program | Role that builds it | What it is |
|---|---|---|---|
| (a) | general `finetune` provider | capability **provider** (runtime commons) | The **general** `finetune` provider — the `trainer`/finetune-router leaf capability, sibling to (and **never merged with**) the provider-router; the §9 engine ladder, with backend selection **gated by the §4.2 egress class**. Cloud-capable. |
| (b) | specialized `finetune` provider | capability **provider** (specialist) | A participant's **own specialized** `finetune` provider exposed as a distinct capability **on the bus, NOT an adapter inside the general trainer**, routed to by the registry (§8/FT-K). Where its data is synthetic/proprietary/personal-tier, the provider is inherently **local-only**. |
| (c) | `finetune` client | control-plane **host** | The KCB **client** replacing any stub runner — discover → invoke → **subscribe** to the real §6 training-telemetry stream, wiring up export (§5.3) and the registry (§8), and issuing `invoke:finetune` grants (§7). Its live end-to-end run is externally blocked on ≥1 real provider. |

Two further handoffs follow from the three above:
- **A `finetune-job.schema.json` validator + conformance CI** for §3 — the machine-readable twin's
  syntactic gate, landing wherever the shared validators live (ADR-0001: downstream, not in koine).
  The **semantic** admission rules (modality×method, egress aggregation) stay in the providers
  (a) / (b).
- **A job-conversion suite for §3.3** — emit/import converters for the Axolotl, LLaMA-Factory, TRL and
  OpenAI targets, plus the **round-trip fixtures** §3.3.4 makes the conformance criterion (and the
  torchtune *import-only* reader). Downstream per ADR-0001, alongside the schema validator above.
- **A flagship consumer bridge** — a media or design participant realigning its generic "finetune
  bridge" onto the real KFT contract.

Other consumers (participants that load finetuned media models or SLM GGUF weights) consume through
their existing model loaders — point a loader at a registry-resolved asset — so they need
configuration, not a dedicated wiring program.

---

## 10. Mapping (by role)

| Role | KFT participation | Responsibilities |
|---|---|---|
| **General `finetune` provider** | Runtime | Implements the `finetune` capability (the `trainer` leaf, §9); hosts registry + resolver (§8); runs KCS eval in the conformance console (§6.1). |
| **Control-plane host** | Host | Provisions the trainer org; issues `invoke:finetune` grants (§7); its client tooling is a KCB client; provisions the CAS for weight assets (§5.3). |
| **Knowledge authority** | Producer + **specialized `finetune` provider** | Emits knowledge training data (KGP packs from verbalization/KGQA); MAY run its own specialized `finetune` capability on the bus (e.g. a small-model neurosymbolic path on local accelerators), routed to by the registry (§8, FT-K); owns eval protocols (§6.1). |
| **World producer** | Producer + consumer | Emits rejection-sampled SFT data (world facts, task-specific reward); consumes finetuned small models back into its local inference service. |
| **Media authority** | Producer + consumer | KMI authority for image/video/audio **training assets** (§3.1/§4.1); consumes finetuned media models. |
| **Domain consumer → producer** | Consumer → producer | Consumes finetuned models for its own domain; later a `produce`r of an invocable capability over them (KCB §6). |

---

## 11. Open questions

1. **Adapter selection policy** — does the provider pick the engine (LLaMA-Factory vs Unsloth vs
   diffusers) purely from `modality`+`method`, or does the job manifest allow a hint? Keep it
   producer-internal (§9) unless a pressure test forces it into the contract.
2. **Multi-node / distributed runs** — cost metering and checkpoint lineage (§5.3/§6) across GPUs;
   likely a producer concern, but the `cost` unit and checkpoint-asset shape must not preclude it.
3. **Resumption & warm-start** — **resolved** (2026-08-26) by
   [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md), the focused
   pressure leg this note's own *unless a pressure test forces it into the contract* clause was
   waiting for. The question held two claims in one sentence and they turned out to be different
   shapes. The **warm-start** half is **confirmed as written and needed no new surface**: a prior
   finetuned model is a KINP `model` entity, so `base_model` takes it, and §5 lineage, §5.4
   inheritance, and §5.1.1 publication all compose transitively (leg, Step 1). The **resume** half did
   **not** carry cleanly — `hyperparams` was the only slot that accepted the ref and no normative
   clause reads it — and is folded at **0.6.0**: **§3.4** adds the `resume` ref, **§4.2/§4.3** read it,
   **§5.2** makes a continuation leg a new activity linked by `continues`, **§5.4** binds a mid-run
   checkpoint's class at publication, **§6** fixes the leg's stream and the curve-join rule, and **§7**
   estimates the remainder against a chain-cumulative ceiling. FT-R…FT-V.
4. **Eval-as-reward coupling** — how tightly `method: dpo` binds to a KCS scenario as its reward
   (§6.1); whether reward scenarios need a distinct KCS profile.
5. **Capability versioning** — **resolved** (2026-08-13), and resolved once for the whole fabric
   rather than twice: KCB's open question 2 is now normative
   [`capability-bus.md`](capability-bus.md) §7 per
   [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md), so a `finetune`
   capability evolves like any other — it is a `(name, semver version)` whose every port carries a
   content-addressed `schema_id` (KCB §7.1), subscriber compatibility is the §7.2 rule, and a
   retiring surface names its removal version under §7.3. The fact this section added is the
   resolution's own case: **a finetuned model pins the `kft_version` it was trained under** — and
   under KCB §7.4 that pin is an *archival record on an immutable artifact*, not a live binding.
   It must stay **resolvable**, not protected from change, so a model does not break when its
   producing capability reaches a new major; it still reproduces, audits, and compares against the
   contract it names, while a **re-run** is a fresh `invoke` governed by §7's grant rule (KCB §5)
   like any other. Three distinct pins are worth recording on the model (§5.1/§5.2): the **spec**
   versions (`kft_version`, `kcb_version`), the **manifest-shape** version (the KCB §2 extension
   URI), and the **capability** version. Informative here — this section states no clause of its
   own, and §§2–8 are unchanged by the resolution.
6. **One enum, two axes** — §1.1's taxonomy claim is KFT's, and §1.1's own decomposition table shows
   `method` carrying **both** axes in a single token: `sft` and `full` overlap on the objective axis,
   and *preference objective + low-rank adaptation* (`dpo` + LoRA — a common real configuration) is
   expressible only by the presence of a `hyperparams.lora` block rather than by the method token.
   Every target in §3.3's matrix separates the two (Axolotl `rl:` + `adapter:`, LLaMA-Factory `stage:`
   + `finetuning_type:`, TRL trainer-class + `LoraConfig`), so the conversion is where the conflation
   bites first. The fix is an **additive optional** `objective` field with `method` retained and
   unchanged in value space — never a redefinition of `method`, which would move FT-F's admission
   check and break every 0.4.0 manifest. Deferred to a pressure pass rather than guessed at: the
   question is whether an unpinned axis should be a provider default or an admission refusal.

---

## Pressure test

**Exercised by three end-to-end passes and two focused legs** —
[`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) (text,
found FT-A…FT-H → folded into 0.2.0),
[`../scenarios/e2e-finetune-multimodal.md`](../scenarios/e2e-finetune-multimodal.md) (fully-multimodal
+ multi-provider, found FT-I…FT-L → folded into 0.3.0), and
[`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md)
(a producing application's **training exhaust** entering the fabric under
[`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md),
found FT-M…FT-Q → folded into 0.4.0). The focused legs are
[`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) — a single-accelerator
run interrupted mid-training, attacking **§11.3 alone** and saying explicitly which sibling questions
it leaves untouched, found FT-R…FT-V → folded into 0.6.0 — and
[`../scenarios/kft-audio-modalities.md`](../scenarios/kft-audio-modalities.md) (2026-09-12), which
walks **§3.1's two audio rows** for the first time, one job per row, and found **AU-1…AU-6**,
**unfolded**.

The first two passes cleared with no redesign and KFT was **Ratified** on 2026-07-23 — the four-plane
composition holds under both a text and a fully-multimodal, multi-provider pass. The third pass then
found the §4 reference slots incomplete for a *producer-emitted* corpus, so 0.4.0's additive fold
returns the spec to **Candidate** pending owner re-ratification; nothing in the ratified surface was
withdrawn or changed in meaning. The stressors exercised across the three passes:

- **Egress gate (§4.2):** an authority-run SLM QLoRA over a corpus containing one `local-only`
  record — the run MUST pin to a local accelerator and MUST reject a `single-gpu-a100-80gb` (cloud)
  placement with a report. Verifies the training-set clause of KGP §7.2 is actually enforced.
- **Cross-plane ports (§2):** a media producer's audio LoRA (`text-to-image`-style, media-in/model-out) whose
  training data is KMI assets and whose output feeds capability composition (§8) — verifies a
  `finetune` capability spanning media + entity planes is expressible and path-searchable.
- **Lineage & license (§4.3/§5):** a finetuned model trained on mixed-license data — verifies the
  union license class on the model provenance drives a downstream consumer's admit/reject correctly.
- **Metrics idempotency (§6):** redelivered training-exhaust events converge (content-addressed
  job+step), and a checkpoint ref delivered before its bytes is tolerated (KCB delta L).
- **Interruption and resumption (§3.4/§5.2/§6/§7, focused leg):** a run killed at step 4,180 whose
  step-4,000 checkpoint is offered back as an input — verifying that the ref has a slot the gate
  reads, that a mid-run checkpoint carries a class before any model entity exists, that the resumed
  leg is a distinct activity reachable from the model it eventually produces, and that the budget
  prices the remainder rather than the whole training twice.
- **A producer's own exhaust (§4.1, third pass):** an application's run records — accepted NL edits,
  generations, preference pairs, QA labels — offered as a training set through a thin adapter
  (ADR-0008), verifying that a corpus which is neither KGP claims nor image/video/audio bytes has a
  reference slot, an admission-time egress class, and a resolvable cardinality *before* any transfer.
- **The two audio rows (§3.1, second focused leg):** a caption→audio `text-to-audio` LoRA and a
  **paired** `audio-to-audio` voice-conversion `full` finetune whose source side is `personal` /
  `local-only` — verifying that the media port already carries audio, that §4.2's aggregate and
  §4.3's union reach both sides of a pair, and that a corpus with **no caption side** can say which
  source goes with which target. The first three hold; the last does not (**AU-1**).

**What re-ratification is still waiting on — restated at 0.5.0, not replaced.** The gate is the
same one 0.4.0 opened and it has not moved: a re-run of the third pass's
*Re-validation — KFT 0.4.0* section in
[`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md) by the
spec owner, which walks the corrected §3/§4.1 flow clean as written but has not been re-executed
since. **That re-run has now been executed — walked by hand on 2026-09-03 — and it did *not* close
the gate.** Four of the five deltas flip and the regression set holds: FT-M's `records[]` slot, FT-O's
positional headers, FT-P's `recordCount` and FT-Q's schema citations are all present in the prose, the
schemas and the registry, and a 0.3.0-shaped manifest still validates and gates identically — the
0.4.0 fold's additivity claim is now confirmed by execution rather than by reading. **FT-N half-flips.**
Its normative half is intact and stays intact (§4.2 reads the header, never the `tier`), but the
sentence carrying it asserts the header is *the only descriptor available at admission*, and **KMI
0.3.5's MA-5 fold made that false two days after this pass's downstream run**: a `dataset.records[]`
file is a KMI asset, its §2 envelope may now carry its own `egress`, and no clause in either spec ranks
the two carriers. They can disagree — a permissive envelope lets KMI §7.1(e) replicate across an
authority-domain boundary a corpus §4.2 correctly pinned `local-only` — and their **absence** defaults
are opposite, so a job declaring `egress` nowhere is admitted here on KGP §7.2's `exportable` default
and then fails closed at the fetch, after placement and around FT-J. That is new delta **FT-W**, and
the count therefore **changes shape**: from *re-run the fold* to **fold FT-W in §4.1/§4.2 (additive,
one spec — KMI needs no change), then re-run that section again**. The walk moved **no version and no
clause** — §3, §4, §5, §7 and the schemas are byte-unchanged — and **KFT stays 0.7.0 Candidate**. The
record is that scenario's *Re-run — the FT-M…FT-Q intake fold walked against KFT 0.7.0 (2026-09-03)*
section, which also carries two residuals (the `header`↔`records[]` positional coupling is prose-only;
two `koine:10` citations survive in a sibling scenario's historical record). 0.5.0 neither discharges nor widens it: §4's admission inputs, outcomes and reasons are
byte-unchanged (§3.2, §4.1.1 and §8.1 each say so normatively), so that re-run reads the same flow
against the same clauses. Two surfaces 0.5.0 adds are **not** exercised by any of the three passes and
the owner should read them as new normative text rather than as re-validated text: the §3.3 conversion
mapping and the §8.1 refusal vocabulary. Neither is on the *data* path — §3.3 acts strictly downstream
of admission and §8.1 shapes a refusal that had already been decided — and §3.3.4 fixes conversion
conformance as a **round-trip tested downstream** (ADR-0001, §9.1), which is why they are recorded here
as unexercised surface rather than as a second scenario gate. The **dependency pins are no longer part of that
gate** — the `Depends on:` header tracks each plane's current published version under one stated
rule, and every in-body cross-plane citation (§2 → KCB §2/§2.1 and §7.1, §4.2 → KGP §7/§7.2,
§5.3 → KMI §2/§3/§7, §7 → KCB §5) has been re-read against those pins and annotated where the
plane text moved, so the stale-pin loose end is closed rather than unstated. What survives is the
standing obligation in the header's **re-check trigger**: a minor or major bump in a pinned plane
obliges re-reading those same sections before KFT's next status transition — **and the 2026-09-03 walk
found that trigger has fired three times unpulled.** Three of the five pins are stale against the
track-current rule the header states: KINP reads 0.2.x and is **0.4.0**, KCB reads 0.4.x and is
**0.5.0**, KCS reads 0.2.x and is **0.3.0**, all three minor bumps landed 2026-08-26 (KGP 0.5.x and
KMI 0.3.x are patch-current and correct). At least one cited clause moved with them: §7's grant
paragraph is labelled *"(KCB 0.4.x)"* and KCB 0.5.0's **V-5** added an `invoke` `version` operand under
an exhaustive operand-else-grant-else-**refuse** resolution rule. This is **not** a finding against the
FT-M…FT-Q fold — it is on §7's grant surface, not §4's admission path — and it opens no third gate; it
is a **precondition on the status transition**, and it is recorded rather than quietly re-inherited as
closed, because *closed by `chief/71`* was true on 2026-08-13 and has not been true since.

**0.6.0 adds a second gate, and it is narrow.** A re-run of
[`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) against the folded
text: the leg was written against 0.5.0 and each of its five findings is now answered by normative
clauses, so what it walked as breaks (its Steps 2–6) it must walk clean, and its Step 1 and Step 7
*what held* sections must stay held. This gate is **additional to**, not a replacement for, the third
pass's outstanding re-run, which is restated above and does not move. One honest difference from
0.5.0's fold: 0.5.0 left §4's admission inputs byte-unchanged, and **0.6.0 does not** — where a job
carries `resume`, `resume.checkpoint` joins §4.2's aggregate and §4.3's union. A **cold** job (no
`resume`, which is every 0.4.0- and 0.5.0-era manifest) is admitted and refused on exactly the inputs
it was before, which is why the third pass's re-run is unaffected; but the gate is no longer computed
over one field set for every job, and the owner should read §3.4, §4.2, §4.3, §5.4, §6 and §7 as
**changed** normative surface rather than as re-validated text.

**Gate (ii) was walked on 2026-09-03, and it does not close either.** The six sections were read cold
against `resume`-carrying jobs — and, because the fold is a composition point, against the plane text
those clauses cite today, which is not the plane text of the hour they were written. The record is
[`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) § *Re-run — the
FT-R…FT-V resumption fold walked against KFT 0.7.0 (2026-09-03)*. **Three of five deltas flip
outright** — **FT-R** has its slot in §3.4 and in the schema (`resume` optional, its trio REQUIRED,
`additionalProperties: false`, absent from the top-level `required`), **FT-T** has `continues`
registered in [`../registry/relations.tsv`](../registry/relations.tsv) with the right signature and
both disclaimers, **FT-V** has its remainder estimate and its chain-cumulative ceiling — and Steps 1
and 7 hold, including *no new plane, artifact kind, media type, or KCB verb*. **The fold's model was
never in question; its perimeter was**, and both breaks come from plane folds that landed **later the
same day** and that no reading of KFT alone can see:

- **FT-S half-flips → new delta FT-X (High, gate integrity).** The `hyperparams` bypass is closed
  twice over and the continued-pre-training front door is shut. But §4.2/§4.3 read the checkpoint's
  class off the KMI §2 envelope and state **no rule for a silent one** — reachable by resuming a run
  started under 0.5.0 (before §5.4's bind-at-publication existed), or by holding bytes replicated
  without an envelope (KMI §7.1(d) forbids synthesizing one and §7.1(e) permits serving them inside
  the domain). The two planes now state **opposite** absence defaults for the same field: §4.2's
  nearest stated default is KGP §7.2's `exportable`, fail-open, while KMI §2 says *absent is not
  `exportable`* and §7.1(e) fails closed. So the FT-S breach returns through the **carrier** rather
  than the slot — an unclassified checkpoint of a `local-only` corpus admitted to cross-boundary
  compute by a provider **inside** the originating domain, where KMI §7.1(e) never sees it. Same
  plane fold as **FT-W** and a different failure: FT-W is a two-carrier *ranking* problem, FT-X a
  one-carrier *absence* problem, and FT-W's fix does not reach it. Fold both in one §4.2/§4.3 edit.
- **FT-U half-flips → new delta FT-Y (High, operand durability).** The `job+step` collision is gone
  and the join rule is right. But §3.4's REQUIRED `checkpoint` and `at_step` live **only** on §6's
  telemetry stream — §5.2's record does not carry them and `generated[]` is written at completion,
  which an interrupted leg never reaches — and **KCB §4.2b then made that stream sheddable**
  (`on_overflow: drop`, plus `coalesce`/`defer` a producer may apply unasked on a losslessness
  argument stated for *KGP payloads*, which a telemetry event is not). KCB §4.2c's recovery operand
  is typed to a KGP pack id and has no admissible value here, and §2 declares no telemetry port to
  carry a `volume`. §7's *MUST verify `at_step` against the prior leg's provenance and telemetry* has
  no durable source. Fold: **§5.2** records the last published checkpoint id and step per leg
  (including a `failed` leg), **§6** makes a checkpoint-bearing event non-sheddable.

**One clause was rescued rather than broken, and it is recorded because nothing else records it.**
§5.4 requires a checkpoint to carry its class *on its KMI envelope*; the KMI §2 envelope had **no**
`license`/`egress` field when §5.4 was published (`49e63e6`), and MA-5 added it hours later
(`7ee8da0`). The near-miss landed on the right side.

Count (ii) therefore **changes shape**, from *re-run the leg* to **fold FT-X and FT-Y (additive,
KFT-only — KMI and KCB need no change), then re-run that section again**. Gate (i) is **restated and
does not move**, and the walk confirmed why by execution rather than by inheritance: §3.4's `resume`
is absent from the schema's top-level `required`, and §4.2's, §4.3's and §7's resume clauses each open
*"Where the job carries `resume`"* — so a **cold** job is fed exactly the input set it was fed at
0.5.0. The one precision 0.6.0's own summary overstates: §3.4's *"every clause below is inert"* is true
of the four rules below it, and §5.4's bind-at-publication deliberately binds a cold run too. That is
an **output-side publication obligation**, downstream of admission, so gate (i) is unaffected. **KFT is
not promotable**, and the reason was two open counts on that date; it is **three** since 2026-09-12,
when the audio leg below was walked.

**0.7.0 added no third gate on the day it published — it added two rows of unexercised vocabulary,
and the pass that exercised them nine days later did add one.** The paragraph below is the reading of
2026-08-27, left standing because its reasoning is intact and what changed is the world; the
correction is the paragraph after it. The `text-to-audio` and
`audio-to-audio` tokens (§3.1) are additive over the existing `media(audio)` plane: no clause of §4
moves, FT-F's admission mechanism is byte-unchanged, and a cold pre-0.7.0 manifest is admitted and
refused on exactly the inputs it was before — so **both gates above are restated and neither moves**.
What the owner should carry forward instead is that **no pass or leg exercises an audio job**: the
multimodal pass's audio stressor is listed above as *"a media producer's audio LoRA
(`text-to-image`-style…)"*, which is precisely the coinage these rows exist to make unnecessary and
is therefore not evidence for them. Read the two tokens the way §3.3 and §8.1 are read above — new
normative surface no scenario has walked — and note that neither may be cited in a re-ratification
until one does. A scenario leg would be the way to change that; none is opened here, because a token
in a closed vocabulary cannot break a manifest that does not name it. **Still true on 2026-09-03, and
the surrounding facts moved:** the three named consumers were re-checked at named shas
([`../docs/reference/generative-audio-modalities-downstream.md`](../docs/reference/generative-audio-modalities-downstream.md)
§8) and four of that page's six findings are **discharged downstream** — both tokens are mirrored
verbatim in `formant` with its `KFT_VERSION` moved to 0.7.0, and `agora`'s vendored job schema and
provider refuse an audio job **`out-of-envelope`** rather than **`invalid`**, which was the one place
a vocabulary lag produced a wrong answer. The fifth is **open and owned** under a dated downstream
deferral, and the sixth — *no pass walks an audio job* — is **koine's own and unowned**. So the rows
are exercised by *implementations* and still not by a *pass*, and it is the pass a re-ratification
would need.

**That pass now exists, it is dated 2026-09-12, and it was not clean — so 0.7.0's two rows cost a
third condition after all.** [`../scenarios/kft-audio-modalities.md`](../scenarios/kft-audio-modalities.md)
walks one job per row and returns **AU-1…AU-6**, of which **AU-1 is blocking**: §3.1 mints
`audio-to-audio` on the property that its corpus is *paired asset↔asset with no caption side*, and
§4.1's FT-I bullet — the **only** pairing carrier this spec names — types a training-record row as
*"a KMI `asset` id **and its text**"*, while `dataset.media[]` is the corpora *"not the training
samples"*, the schema twin's `dataset` object is `additionalProperties: false`, the header schema
fixes no row layout and §4.1.1 forbids the gate to read a Croissant descriptor. A published row has
no expressible supervision, and two conformant providers train two different models from one
manifest. The other five are **AU-2** (this section's own additivity claim over-reaches by one
clause — §4.1 — and gives `audio-to-audio`'s reason for both rows), **AU-3** (the audio pair is the
**only** duplicate in §3.1's *Data-plane port* column, so §2's *told apart by their ports* and
§8.1's `route_to[]` cannot discriminate them), **AU-4** (§7 prices a paired corpus's 2N members as
2N samples), **AU-5** (§3.3's four pinned targets train no audio model while §3.3.2's `modality` row
asserts a mapping in all four columns), and **AU-6** (§5.3's export matrix has no row for a `full`
finetune's weights — pre-existing, first made the *typical* path here). **Nothing this section
claimed about §4.2, §4.3, §5.4 or §8.1 broke**: all four were attacked on an audio corpus and held,
which is why every delta is additive and **KFT-only** and none is a model break. They are a **third**
condition on promotion — a fold, then that leg again — additional to the two gates above, **neither
of which moves** (no job in that leg carries `resume`, and no corpus in it is a producer's exhaust).
The leg's own artefact objection is stated on the day it landed rather than a week later: it has
**no KCS encoding and no run** (**DR-14**), so **AUD-6 is half-discharged** — exercised by a pass,
not by an encoding — and the encoding is downstream and **unowned**.

**Downstream evidence (2026-08-24) — the gate fired, and the suite is a version behind.** The KCS
encodings of the three end-to-end passes were run over real MCP/A2A links and all three came back
`green`, recorded in each scenario's `## Downstream results`. What that is and is not worth to
re-ratification:

- **Positive, and it is the part of this profile that most needed observing: §4.2 refused.**
  Five of `kcs:finetune`'s fifteen assertions are `refused` over an `expect: reject` step. One
  `local-only` record in a corpus kept the **whole run** off rented compute, so KGP §7.2's
  *"…or training set"* clause is enforced rather than argued; **FT-B**'s aggregation reached the
  **base model's** own license and egress, refusing a job whose corpus was entirely `exportable`;
  **FT-A**'s §5.4 output inheritance held, so local-only-trained weights could not be registered
  across the tier boundary; **FT-D** closed the same hole on the eval path; and **FT-F** refused
  `dpo` × `text-to-image` **at admission**, before compute was provisioned. A gate that has never
  refused anything is a number in a manifest; these five are the record that this one is not.
- **The suite pinned KFT 0.5.0 at the recorded run (DR-5).** *(It pins **0.7.0** today —
  `agora/schemas/src/versions.ts`, checked 2026-09-03 — so DR-5's version is stale while its substance
  below is not.)* Nothing in it asserts over **§3.3**'s conversion mapping —
  whose conformance criterion is the round-trip of §3.3.4 — or over **§8.1**'s six refusal grades
  and `route_to[]`: every refusal above is the ungraded KCS `refused` predicate, with no reason
  class attached. This does **not** open a new gate; it confirms from the downstream side exactly
  what the *0.5.0* paragraph above already says, that §3.3 and §8.1 are normative surface no pass
  has exercised. What changes is that it is no longer a prediction, and neither surface may be
  cited in a re-ratification.
- **The training-provider role has never been live (DR-6).** Across all three passes — 2/3, 1/3 and
  1/3 live slots — the general trainer and the specialist alike answered from a delta-N `standin`
  recording. Every refusal listed above is therefore an **admitting-side** refusal observed against
  a recorded provider. That is still the side the gate lives on, so it is worth having, but it is
  not the claim *a live provider was refused*. This closes by adoption — a cast change, not a
  document change — and blocks nothing here.
- **The second gate's encoding exists — DR-11 is CLOSED (2026-08-26).** This bullet read *"the second
  gate has no encoding at all"* until **2026-09-03**.
  [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) was koine's tenth
  scenario against a downstream set of nine, and it was encoded at `agora` `378fd3c` on **2026-08-26
  12:30:18** as `console/src/kcs/scenarios/resume-checkpoint.ts`, in the same commit that regenerated
  the evidence artifact. It walks this leg's seven steps **against the folded 0.6.0 text** and ran
  **`green`** / `partial-live` (2 of 4 slots live). Verified by **running** the downstream gates at
  `agora` `main` = `c971fc2`, not by reading a status line
  ([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
  §6.4). **The artefact condition of [the ratification gate](README.md#the-ratification-gate) is met
  for both of KFT's counts.** Two things it does not do. It does not promote KFT: both counts were
  walked on 2026-09-03 and neither closed. And its `green` is not a verdict on the leg — the encoding
  asserts only what koine has **folded**, names three properties it leaves unasserted for want of a
  KCS §5 predicate (FT-T's `continues` edge, FT-U's join rule, FT-V's chain arithmetic), and reaches
  neither **FT-X** nor **FT-Y**, both of which are perimeter breaks in KMI §2 and KCB §4.2. That is
  **DR-7**/**DR-8**'s hazard on a third spec.

---

## Changelog

- **Editorial** (2026-09-12) — **The two audio rows are exercised for the first time, and the pass is
  not clean.** §3.1's `text-to-audio` and `audio-to-audio` have been published since 0.7.0 and
  recorded in *Pressure test* as **unexercised vocabulary** ever since — *"neither may be cited in a
  re-ratification until [a pass] does"* — which was also **AUD-6**, the one koine-owned finding of
  [`../docs/reference/generative-audio-modalities-downstream.md`](../docs/reference/generative-audio-modalities-downstream.md).
  The leg now exists: [`../scenarios/kft-audio-modalities.md`](../scenarios/kft-audio-modalities.md),
  one job per row — a caption→audio `lora` over an all-`exportable` corpus, and a **paired**
  voice-conversion `full` finetune whose source side is `personal` / `local-only`.

  **Six findings, AU-1…AU-6, and zero model breaks.** What was attacked hardest **held**: §4.2's
  effective-egress aggregate reaches every carrier an audio job has (both sides of a pair as
  `dataset.media[]` entries, the caption file's header, the base's own class under FT-B), §4.3's
  union license carries a non-commercial audio base into the model, §5.4 binds a `local-only`-
  inheriting voice model and its checkpoints at publication, FT-J refuses an unsatisfiable in-tier
  pin, and §8.1 needed **no new code** (an in-enum modality outside a provider's envelope is
  `out-of-envelope`, re-routable; an unknown token is `invalid`). What broke were **four sentences
  this spec writes about itself** plus two table gaps: **AU-1** (blocking) — §4.1's FT-I bullet, the
  only pairing carrier KFT names, types a row as *"a KMI `asset` id **and its text**"*, so
  `audio-to-audio`'s *paired asset↔asset with no caption side* corpus has **no expressible
  supervision** and two conformant providers train two different models from one manifest; **AU-2** —
  §3.1's *"neither row moves a clause of §4"* is true of §4.2/§4.3/§4.1.1, false of §4.1, and gives
  `audio-to-audio`'s reason for both rows; **AU-3** — the audio pair is the **only** duplicate in
  §3.1's *Data-plane port* column (`registry/enums/modality.tsv`'s `data_planes` agrees), so §2's
  *told apart by their ports* and §8.1's `route_to[]` cannot discriminate them, while KCB §7.1's port
  `shape` is the routing carrier nothing points at for this; **AU-4** — §7 reads cardinality from
  arrays that *"enumerate their members"*, and a paired corpus's N samples are 2N members;
  **AU-5** — §3.3's four pinned targets train no audio model while §3.3.2's `modality` row asserts a
  mapping in all four columns against §3.3.1's mandatory refusal; **AU-6** — §5.3's export matrix and
  [`../registry/media-types.tsv`](../registry/media-types.tsv) have no row for a **`full`**
  finetune's weights, pre-existing across `text-generation`/`text-to-image` and first made the
  *typical* path by the row whose method ordering leads with `full`.

  **A third condition on promotion, and no version or clause moves.** All six are additive and
  **KFT-only** — checked per step: no KMI, KCB, KGP or KINP clause is read differently by the walk —
  and all six are **unowned**; AU-1 and AU-4 are one §4.1/§7 edit, AU-2 a sentence, AU-6 a row. They
  are a **third** condition beside gates (i) and (ii), **neither of which moves**: no job in the leg
  carries `resume` and no corpus in it is a producer's exhaust, so both counts are restated on
  exactly the inputs they had. It is **not a re-run gate** — it is a fold, then that leg again.
  **§1–§11, the schema twin and every `registry/` file are byte-unchanged**; the edit is two
  *Pressure test* paragraphs, a stressor bullet, this entry and the scenario. KFT stays **0.7.1
  Candidate** and is **not promotable**. The leg's own artefact objection is stated on the day it
  landed rather than a week later — it has **no KCS encoding and no run** (**DR-14**), so **AUD-6 is
  half-discharged**: exercised by a *pass*, still not by an *encoding*, and that encoding is
  downstream under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and **unowned**.

- **0.7.1** (2026-09-12) — **The run-activity spelling, corrected everywhere KFT mints or shows one
  (patch).** KINP 0.5.0 resolved **IMP-7** by admitting `activity` to §3.1's `<kind>` enum and
  stating the run-activity spelling normatively as `<namespace>:activity:<local-id>`, recognisable
  by its kind segment alone. This spec carried the **other** of the two non-conformant spellings —
  `orchestrator:activity:ft-run/9f2a`, whose kind segment was right and whose solidus sits outside
  `<local-id>`'s `[a-z0-9][a-z0-9._-]*` charset — in §3's `job`, §3.4's `resume.of_job`, §5.2's
  worked PROV activity and §6's telemetry event, and in the schema twin's `kinpId` example. All
  five now read `orchestrator:activity:ft-run.9f2a` (and `…ft-run.7c3d`), using the separator the
  charset already admits. That is not cosmetic here: §5.2 makes the `job` id the run's PROV
  activity and **FT-C**'s reproducibility anchor, §6's `of_job` is what makes a continuation leg
  attributable, and §3.4's `resume` names a prior leg **by that id** — so the id an implementer
  copies out of these examples is the one every `used[]`, `continues` edge and `spent_units` sum
  is keyed on.

  **Patch, and the schema pattern is deliberately not touched.**
  [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)'s `kinpId` matches
  `^[a-z0-9-]+:[a-z0-9-]+:[^\s]+$`, which **already admits** the corrected form; only the
  `description`'s worked example moved, and the golden fixture
  [`../schemas/fixtures/finetune-job.json`](../schemas/fixtures/finetune-job.json) moved with it
  (`job`, `resume.of_job`, and the `dataset.knowledge` provenance `run`). The pattern is **not**
  tightened to KINP §3.1's `<local-id>` charset, and the reason is recorded rather than left as an
  omission: a KINP id may be world-scoped (`worldsim:world:alderforest:ent:npc-renaud`), so the
  third group must stay permissive or the schema would reject ids §3.1 admits. A schema that
  enforced the full grammar would have to model §3.1's kind enum and world scoping together; that
  is a KINP-side artifact, not a KFT one, and it is **not** opened here.

  **No clause moves.** §3's manifest fields and their requiredness, §3.1's `modality` table, §3.2's
  descriptor rules, §3.3's conversion mapping, §3.4's `resume` trio, §4's admission inputs and
  outcomes, §5's lineage relations, §6's idempotency and join rule, §7's estimate and §8.1's
  refusal grades are all untouched — the change is the *value* shown in four examples and one
  schema description. Nothing that conformed at 0.7.0 stops conforming, because the corrected
  spelling was never conformant under KINP §3.1; a job manifest already carrying the legacy form
  gets KINP §3.1's stated transition (a resolver MAY accept it on **read** and MUST return the
  `activity` form as canonical; a minter MUST NOT emit it). `registry/enums/modality.tsv` and
  `registry/relations.tsv` are byte-unchanged.

  **Both gates are restated and neither moves**, and no third is added: gate (i) is open on
  **FT-W**, gate (ii) on **FT-X** and **FT-Y**, all three additive and KFT-only, all unowned.
  The header's **re-check trigger** has fired again and is again recorded rather than pulled: the
  KINP pin reads `0.2.x` and KINP is now **0.5.0** (the 2026-09-03 walk recorded it at 0.4.0), and
  KGP is now **0.6.0** against a `0.5.x` pin. Re-pinning obliges re-reading every in-body
  cross-plane citation and is a **precondition on this spec's next status transition**, not on this
  patch; doing it silently inside an example correction is exactly the drift the trigger exists to
  surface. **KFT stays Candidate and is not promotable.** One cross-repo consequence, stated here
  rather than left to be found: the downstream KCS encodings replay scenario documents, and
  [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) carries this same
  example id, so an encoding pinning the literal `ft-run/7c3d` needs the one-token update
  (ADR-0001, downstream, **unowned**).

- **Editorial** (2026-09-03, third entry this day) — **the artefact gate is met, and KFT is still not
  promotable.** **DR-11 is closed**: the second gate's leg was encoded downstream at `agora`
  `378fd3c` on 2026-08-26 12:30:18 as `resume-checkpoint.ts` — forty-nine minutes after the koine
  document recording it as missing was last written — and koine did not learn for a week. Re-taken on
  2026-09-03 by **running** the gates at `agora` `main` = `c971fc2`: `coverage.test.ts` 3 passed
  (`KOINE_SCENARIOS.length === 12`, set-equal to `scenarios/*.md`, 0 skipped), `evidence.test.ts` 13
  passed with the artifact current at `sha256-eb8fdc9c…36dd5` (twelve scenarios, 26 of 44 slots live,
  `partial-live`). `kcs:resume-checkpoint` itself came back **`green`** — over a leg the same day's
  hand-walk found **not clean**, which is **DR-7**/**DR-8**'s hazard reaching a third spec and is why
  the *Pressure test* bullet now states what that encoding does **not** assert. Two consequential
  corrections ride with it: the gate (ii) entry below says *"no replay available"* and that was
  **false when written** (the walk's verdict is unaffected — the replay corroborates the three flips
  and could not have produced FT-X or FT-Y); and **DR-5**'s *"the suite pins KFT 0.5.0"* names a
  version that has since moved to **0.7.0**, its substance unchanged. **What blocks KFT is unchanged
  and is entirely koine-side**: gate (i) open on **FT-W**, gate (ii) open on **FT-X** and **FT-Y** —
  three additive KFT-only folds, FT-W and FT-X in one §4.1/§4.2/§4.3 edit and FT-Y in §5.2/§6 —
  followed by two re-runs, plus the reopened dependency-pin precondition on this spec's header. All
  unowned. **No version moves and no clause moves**: §2–§7,
  [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) and
  [`../registry/enums/modality.tsv`](../registry/enums/modality.tsv) are byte-unchanged; the edit is
  two *Pressure test* bullets and this entry.
- **Editorial** (2026-09-03) — **Gate (ii) was walked, and it does not close.** The
  [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) re-run 0.6.0 added
  as this spec's second count was executed the same day as gate (i): the six sections it names —
  §3.4, §4.2, §4.3, §5.4, §6, §7 — read **cold** against `resume`-carrying jobs, by hand, with **no
  replay available** *(corrected the same day: one **was** available and green — see the third entry
  above; the verdict does not move)*, and against the plane text those
  clauses cite today. **FT-R, FT-T and FT-V flip** — the `resume` slot and its schema twin, the
  `continues` registry row with its two disclaimers, the remainder estimate against a
  chain-cumulative ceiling — and **Steps 1 and 7 hold**, including *no new plane, artifact kind,
  media type, or KCB verb* (`continues` being a registry row, which Step 4 anticipated as *"a
  registration decision"*). **The fold's model was never in question; its perimeter was.** Both
  breaks come from folds that landed **later on 2026-08-26**, hours after 0.6.0 at `49e63e6`:
  **FT-S half-flips** → **FT-X** (High) — §4.2/§4.3 read the checkpoint's class off the KMI §2
  envelope and state no rule for a **silent** one, while KMI 0.3.5 (`7ee8da0`) says *absent is not
  `exportable`* and §7.1(e) fails closed where §4.2's nearest stated default is fail-open, so the
  FT-S breach returns through the carrier, in-domain, where KMI §7.1(e) cannot see it; **FT-U
  half-flips** → **FT-Y** (High) — §3.4's REQUIRED `checkpoint`/`at_step` live only on §6's stream,
  §5.2 does not carry them, and KCB §4.2b (`7c82abc`) made that stream sheddable on a losslessness
  argument stated for KGP payloads, leaving §7's MUST-verify without a durable source. One clause was
  **rescued** rather than broken and it is recorded here because nowhere else records it: §5.4's
  *"carries them on its KMI envelope"* named a slot KMI §2 did not have until MA-5 landed hours
  later. Count (ii) changes shape to **fold FT-X and FT-Y (additive, KFT-only), then re-run**; FT-X
  belongs in the same §4.2 edit as **FT-W**. Gate (i) is restated and **does not move** — the cold-job
  path was walked, not inherited: `resume` is absent from the schema's top-level `required` and every
  resume clause opens *"Where the job carries `resume`"*, with §5.4's bind-at-publication the one
  cold-run obligation 0.6.0 added and it is output-side, downstream of admission. **No version moves
  and no clause moves**: §2, §3, §3.3, §3.4, §4, §5, §6, §7,
  [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) and
  [`../registry/relations.tsv`](../registry/relations.tsv) are byte-unchanged; the edit is the
  scenario section, this entry and the gate paragraph above. **KFT stays 0.7.0 Candidate and is not
  promotable** — two open counts, both now a fold plus a re-run.
- **Editorial** (2026-09-03) — **Gate (i) was executed, and it does not close.** The FT-M…FT-Q
  producer-exhaust intake fold — the count open since 0.4.0, restated by 0.5.0, 0.6.0 and 0.7.0 and
  never run — was walked by hand against **0.7.0 as published**, and against the plane text those
  clauses cite *today* rather than the plane text of 2026-08-06. **FT-M, FT-O, FT-P and FT-Q flip** and
  Steps 1/6/7 hold as the regression set, three of them corroborated by the 2026-08-24 run of
  `kcs:producer-exhaust-finetune`; the 0.4.0 fold's additivity claim is confirmed by execution. **FT-N
  half-flips** → new delta **FT-W**: §4.2's *"the **only** descriptor available at admission"* premise
  was made false by **KMI 0.3.5**'s MA-5 fold, which gave the same `dataset.records[]` asset a second
  egress carrier on its §2 envelope, with no clause ranking the two and with **opposite absence
  defaults** (`exportable` here, fail-closed at KMI §7.1(e)). The count changes shape to *fold FT-W in
  §4.1/§4.2, then re-run*; gate (ii) is restated and does not move. The walk also found the header's
  **re-check trigger** fired three times unpulled (KINP, KCB and KCS pins stale since 2026-08-26) —
  a precondition on the status transition, not a third gate. **No version and no clause moves**: §3,
  §4, §5, §7 and the schemas are byte-unchanged, and the edit is the gate paragraphs above plus this
  entry. Record:
  [`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md)
  *Re-run — the FT-M…FT-Q intake fold walked against KFT 0.7.0 (2026-09-03)*.

- **0.7.0 — the generative-audio modalities** (2026-08-26) — **§3.1** gains two `modality` tokens,
  `text-to-audio` and `audio-to-audio`, over the **existing** `media(audio)` plane. Strictly
  additive: no plane, artifact kind, media type, KCB verb or authority role is added, no existing
  token moves (they are immutable once published), and every 0.6.0-era manifest is admitted and
  refused on exactly the inputs it was before. Status stays **Candidate**; the two standing gates
  are restated below and **neither moves**.
  - **The plane was verified, not assumed.** §3.1's own rule is that a new modality "adds a row plus
    a capability variant (§2), **never a new plane**", so the first question was whether the plane
    already carries audio. It does, in four independent places in
    [`media-interchange.md`](media-interchange.md) none of which were added for this: §2's
    `media_type` is an ordinary IANA type, §2's `probe.streams[]` example carries an `audio` stream,
    **§6's own worked media-port example is `"media_types": ["audio/wav"]`**, and §8's role map lists
    an **Audio producer** emitting `audio/*`. Consequently
    [`../registry/media-types.tsv`](../registry/media-types.tsv) does **not** change — it registers
    only the types koine *mints*, and `audio/wav` is IANA's exactly as `video/mp4` is.
  - **`text-to-audio` is the third diffusion row.** `media(audio)` / `lora|full`, identical in every
    axis this table measures to `text-to-image`. TTS rides it rather than getting a sixth row: the
    upstream taxonomies that split speech out split on *pipeline routing*, which is a provider
    concern and not a column §3.1 carries. Splitting later is additive and cheap; unsplitting is
    impossible, which is the asymmetry that decides it.
  - **`audio-to-audio` is a decided row, not a symmetric one.** The case against is that it is a
    filter, and KMI §6 can already type `audio/wav → audio/wav` as a transform without KFT hearing
    about it. It fails three ways: the enum is not generation-only (three of its five existing rows
    are understanding modalities); §6 types an **invocation** where §3.1 types a **training target**,
    and a model that performs a transform is still a model that gets trained; and excluding it does
    not remove the case but corrupts it — with no token a per-speaker voice-conversion job must
    declare `text-to-audio`, which makes **FT-F**'s mandatory `modality × method` admission check
    validate a false declaration, the one outcome a closed vocabulary exists to prevent. It lands on
    **its own axes**: `typical_base` is small task-specific architectures (RVC, so-vits-svc, Demucs)
    rather than foundation models, and that is why `full` leads its `method` ordering.
  - **No clause of §4 moves, and this was checked rather than inferred.** Both sides of an
    `audio-to-audio` pair are KMI assets referenced through `dataset.media[]`, so §4.2's
    effective-egress union over *"every media asset"* and §4.3's license/trust union already cover
    the case where a target stem is `local-only` and its input is not. §5.1's `model` entity takes a
    new `modality` refinement by construction and §5.3's export matrix is architecture-agnostic.
  - **Published ahead of the providers, deliberately.** Both rows are a **forward declaration** with
    named consumers, so a later reader can tell this from an oversight: **formant** (both rows — its
    `KftModality` is required to be a verbatim mirror of this enum and was blocked on their
    existence), **lugh** (`audio-to-audio` especially — a user's own recordings classify `personal`
    and commonly `local-only`, which §4.2's placement rule routes to local/in-tier compute), and
    **agora** (both, as the all-`exportable` case whose FT-F check this is). The adjudication, the
    deliberate non-mints with their re-open triggers, and the provider statement are recorded in
    [`../docs/reference/generative-audio-modalities.md`](../docs/reference/generative-audio-modalities.md).
  - **Minor, not patch.** §3.1's table is normative surface a reader implements against and FT-F
    validates from, so two new admissible tokens widen what a conformant provider must recognise —
    a token it does not know is a refusal. Landed in all four statements of the vocabulary in one
    change: [`../registry/enums/modality.tsv`](../registry/enums/modality.tsv), this table,
    [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)'s
    `properties.modality.enum`, and [`../registry/README.md`](../registry/README.md)'s prose bullet —
    the fourth being the one **no guard checks**.
  - **No third gate; two rows of unexercised vocabulary.** Neither gate below is discharged, widened
    or replaced, and neither row closes one. But no pass or leg exercises an audio job, so the owner
    should read these two tokens the way *Pressure test* already records §3.3 and §8.1 — as
    normative surface no scenario has walked — rather than as re-validated text. This is a
    qualification on §3.1, not a scenario gate: a new token cannot break an existing manifest, and
    the mechanism it is admitted by (FT-F) is byte-unchanged.

- **Editorial** (2026-08-26) — Recorded the **downstream results** of the three end-to-end passes in
  *Pressure test*. Their KCS encodings were run over real MCP/A2A links on 2026-08-24 and all three
  came back `green`; **neither gate moves**. The positive half is the part of this profile that most
  needed observing — **§4.2 refused, five times**, each over an `expect: reject` step: one
  `local-only` record kept a whole run off rented compute (KGP §7.2's training-set clause enforced
  rather than argued), **FT-B**'s aggregation reached the base model's own license and egress,
  **FT-A**'s §5.4 output inheritance held across the tier boundary, **FT-D** closed the same hole on
  the eval path, and **FT-F** refused `dpo` × `text-to-image` at admission. Three qualifications are
  recorded with it: **DR-5** — the suite pins **KFT 0.5.0**, so §3.3's conversion mapping and §8.1's
  refusal grades have no encoded assertion and every refusal above is the ungraded KCS `refused`,
  which confirms from the downstream side what *Pressure test* already said about them being
  unexercised surface; **DR-6** — the **training-provider** role was a delta-N stand-in in all three
  passes, so every refusal is an *admitting-side* refusal against a recorded provider, closing by
  adoption rather than by an edit; and **DR-11** — the second gate's scenario,
  [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md), has **no KCS
  encoding**, so every clause 0.6.0 folded lacks a machine-replayable document citing it and a clean
  re-run of that leg is necessary but not sufficient under
  [the ratification gate](README.md#the-ratification-gate). That encoding is downstream work under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**; it qualifies the
  second gate rather than adding a third, and leaves the first gate untouched. **No clause changes
  and the status does not move** — KFT stays **Candidate** on both gates.

- **0.6.0 — resumption is a first-class, gating input** (2026-08-26) — Folds the focused pressure leg
  [`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md) (FT-R…FT-V), which
  attacked **§11 open question 3** alone and separated its two claims. **§11.3 is resolved in place**
  — the numbering is deliberately not shifted, the way §11.5 already is, so every existing §11.x
  reference still resolves — and §11.1, §11.2, §11.4 and §11.6 stay open, untouched by construction
  (the leg records why for each). Status stays **Candidate**.
  - **Warm start needed no new surface, and got none.** A prior finetuned model is a KINP `model`
    entity, so `base_model` already takes it: §5 lineage, §5.4 inheritance and §5.1.1 publication
    compose transitively across a chain of finetunes. The leg's Step 1 confirms this as written, and
    §3.4 records it as a distinct shape from resumption rather than folding the two together.
  - **Resumption did not carry, and is folded.** New NORMATIVE **§3.4** adds the optional top-level
    **`resume`** object — `{checkpoint, of_job, at_step}` — with four rules: the ref is a **pinned
    input** so §5.2's `used[]` carries it and FT-C's reproducibility anchor keeps determining the run;
    `resume` is the **only** slot, and a checkpoint id smuggled through the permissive `hyperparams`
    is refused `invalid` rather than executed (it is read by no gate, which was the whole defect); a
    checkpoint is **never corpus**, so it gates without being priced as samples; and a continuation
    leg is a **new activity**.
  - **The gate now sees it.** **§4.2** takes the effective egress class over
    `{training data ∪ base model ∪ resume.checkpoint}` and **§4.3** puts the checkpoint's license and
    trust tier in the union — closing the continued-pre-training hole where a leg resuming a
    `local-only` checkpoint over a fresh `exportable` corpus was cloud-placed by a gate computing over
    `{new corpus ∪ base}`.
  - **A mid-run checkpoint is no longer unclassified.** **§5.4** binds inheritance **at publication**
    rather than at completion: §5.2 mints the model when a run *finishes*, so scoping inheritance to
    "the model and every weight/export asset it generates" left every artifact a *running* job emits
    with no egress class or license — on a `subscribe` stream §6 tells consumers to `fetch` from. That
    hole existed independently of resume and is closed independently of it.
  - **Activity identity is decided.** **§5.2** requires a continuation leg to mint a new `job`
    activity (a closed PROV record is never rewritten, and §6's terminal states have no path back to
    `running`) linked to the leg it continues by the new core relation **`continues`**, registered in
    [`../registry/relations.tsv`](../registry/relations.tsv) — distinct from `retrains`
    (re-train **from scratch**) and `supersedes` (**replaces**). "What trained this model?" is answered
    by walking the chain to its root, and the chain MUST stay resolvable.
  - **The stream and the budget follow.** **§6** keeps `job+step` idempotency sound (distinct legs,
    distinct `job` ids), fixes `step` as counted from the root leg so legs overlap deliberately, adds
    the NORMATIVE **join rule** (order by the `continues` chain; the later leg wins on an overlapping
    range) and an optional non-authoritative **`attempt`** ordinal on the event. **§7** requires a
    continuation leg to be estimated on the **remainder**, with `at_step` verified against the prior
    leg's provenance, and checked against the ceiling **net of cumulative `spent_units` across the
    chain** — so one training is neither authorized twice nor refused `over-budget` for work it will
    not do.
  - **Portability, in lockstep.** **§3.3.1**'s gating set gains `resume.checkpoint`; **§3.3.2** gains
    two rows and a **fifth** normative consequence — a resume ref converts to a local **path**, so the
    KINP id, `of_job` and `at_step` go out of band, and a target with no resume surface **MUST** be
    refused rather than silently handed a cold run.
  - **Schema, in lockstep:** [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
    gains the optional `resume` object (required `checkpoint` · `of_job` · `at_step`,
    `additionalProperties: false`, KINP-id slots like every other reference). **Strictly additive**: `resume` is
    absent from the schema's `required` list, so a manifest without it is a cold run, validates
    unchanged, and is admitted and refused on exactly the inputs it was before. The golden fixture
    [`../schemas/fixtures/finetune-job.json`](../schemas/fixtures/finetune-job.json) exercises the new
    object, as 0.5.0's fold did for its two.
  - **No new plane, artifact kind, or media type.** A checkpoint was already a KMI asset under §5.3,
    the `fetch:asset` grant already reached it, and no KCB verb, port, or grant changes — which is why
    every delta is an additive field or an additive clause. **Adopts no new external standard**, so
    [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) is unchanged.
  - **Gates:** the third pass's *Re-validation — KFT 0.4.0* re-run is **restated and unmoved**; 0.6.0
    adds a **second**, narrow gate — a re-run of this leg against the folded text. Unlike 0.5.0, this
    fold *does* move §4's admission inputs for a job that carries `resume` (never for one that does
    not), and *Pressure test* says so rather than claiming re-validated text.
- **0.5.0 — adopt by reference, resemble the precedent, name what is left** (2026-08-13) — Roughly
  half of KFT's manifest surface was already standardized elsewhere and restated here; 0.5.0 replaces
  the restatement with citation, aligns the job's *shape* to the established precedent, and states
  plainly the four things that are left. **Additive throughout** — every 0.4.0 manifest and header
  remains conformant, no field changed type, name, or meaning, and **§4's admission behaviour is
  unchanged**: the same jobs are admitted and refused, for the same reasons, from the same inputs, with
  FT-A…FT-Q untouched. Status stays **Candidate**.
  - **Three adoptions by reference**, each with its seam stated as a three-row table (what the external
    standard covers / what KFT adds on top / what a producer must still supply): **MLCommons Croissant
    v1.1** for dataset description (new §4.1.1, reached from the optional `dataset.descriptor[]` slot),
    **KitOps / ModelPack** for weights packaging (new §5.3.1 — `model.parts[].type` already covers the
    LoRA/adapter case, so KFT mints no layout and *all* KMI lineage obligations stay KFT's), and the
    **Hugging Face `base_model` / `base_model_relation`** convention for published lineage (new §5.1.1,
    a *projection* of §5.1's KINP relations, with the no-Hub-coordinate rule: omit, never invent).
    §1 states the rule behind all three — *where something is already standardized and adopted, KFT
    cites it and holds only the fields it has no place for* — and §3's example is corrected to name the
    base by its KINP entity id rather than a raw `hf:` string (§5.1/FT-G).
  - **One shape borrowed, not adopted:** new **§3.2** records **Kubeflow `TrainJob`**
    (`trainer.kubeflow.org/v1alpha1`, observed 2026-08-13) as the structural precedent for
    dataset-and-model-**by-reference**, with a seven-row field correspondence, a NORMATIVE
    *reference-plus-describing-standard* rule, the optional `base_model_descriptor[]` slot (the model-side
    twin of `dataset.descriptor[]`), and the generalized NORMATIVE clause that **a descriptor is never
    an admission input**. §3.2 also records what TrainJob does *not* have — no license, egress,
    trust-tier or budget field anywhere in its API — so the alignment reads as adopting a **shape, not a
    scope**, and names §4.2/§4.3/§5.4/§7 as the seam that fills it.
  - **The four defensible claims, stated in one place:** new **§1.1** — the `objective × adaptation`
    taxonomy (OpenAI's API models only the objective axis; TrainJob buries adaptation in argv),
    egress-gated placement (§4.2 over KGP §7.2), graded refusal routing, and cross-provider job
    portability — each with the reason nothing else holds it. Its `method` decomposition table is
    informative and exposes an honest gap now recorded as **§11.6** (one enum carrying both axes;
    the fix is an additive optional field, never a change to `method`'s value space or to FT-F).
  - **Portability becomes an artefact:** new NORMATIVE **§3.3** specifies the conversion between a §3
    manifest and the job formats of **Axolotl, LLaMA-Factory, TRL, and the OpenAI fine-tuning API** —
    three dispositions per field (**mapped / carried out of band / refused**), an exhaustive **gating
    set** that must be refused rather than silently dropped, a required **conversion record** on the
    run's PROV activity, and a field-by-field matrix. Four consequences are normative: a `local-only`
    job MUST NOT be converted to a managed cloud target, an unexpressible adaptation axis is a refusal
    rather than a substitution, a KCS `eval[]` binding is never demoted to a validation file, and a
    target's silence is never read as `exportable`. Import is incomplete by construction — an importer
    MUST NOT synthesize a `dataset-jsonl-header` or its axes. **torchtune** appears as an
    **import-only legacy source** with its wind-down recorded (README notice; last release **v0.6.1,
    2025-04-07**) and is explicitly not a live emit target or a recommended backend. Conformance is the
    **round-trip** (§3.3.4), so no schema is minted and the fixtures are a downstream follow-up
    (ADR-0001), added to §9.1 rather than built here.
  - **Refusals are graded and routable:** new NORMATIVE **§8.1** fixes what the reports KFT already
    required actually carry — a six-value `code` vocabulary separating *no provider can take this* from
    *I cannot take this*, and a SHOULD-level `route_to[]` of **resolvable registry addresses** (never
    product names) when another provider could. A route MUST NOT breach the gate it just enforced: a
    §4.2 refusal never names a cross-boundary provider, and an empty route is a truthful answer.
  - **Schema, in lockstep:** [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
    gains the optional `dataset.descriptor[]` and `base_model_descriptor[]` arrays (KINP ids, same slot
    type and optionality as the existing reference slots) and its descriptions name the TrainJob
    correspondence; the golden fixture exercises both. A 0.4.0-era manifest carrying neither still
    validates.
  - **Pins:** the Croissant, KitOps/ModelPack, HF `base_model`, Kubeflow TrainJob and §3.3 trainer-target
    rows of [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) are filled with the
    revisions this work was written against.
  - **Re-ratification is restated, not replaced.** The pending owner re-ratification and its gating
    scenario — the *Re-validation — KFT 0.4.0* section of
    [`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md) —
    are unchanged and unmoved by this fold, since §4 is behaviourally untouched. §3.3 and §8.1 are new
    normative surface no pressure pass has exercised; *Pressure test* records them as such rather than
    inventing a second gate.
- **0.4.0 — dependency re-pin + citation reconciliation** (2026-08-13) — Header hygiene inside the still-open 0.4.0
  re-ratification; **version and status are unchanged (0.4.0, Candidate)** because no normative
  clause moved — only the `Depends on:` pins and how they are to be read. The KCB / KGP / KMI pins
  had read 0.2.0 / 0.4.0 / 0.2.0, which were each plane's **last-ratified** version, not a typo:
  the planes had since published KCB 0.4.0, KGP 0.5.2, and KMI 0.3.1 (all candidate), so the header
  was *silently* disagreeing with the specs it links to. Decision: **track-current**, on the ground
  that this repo publishes exactly one text per spec — a pin to a superseded version names a
  document a reader cannot retrieve, which is a worse failure than a profile citing a candidate
  plane (KFT is itself candidate). The alternative, pin-to-ratified, was rejected for that reason
  and because all three planes are currently candidate, which would have left KFT pinned to text
  no longer published anywhere in the repo. Spelling is now uniform — `MAJOR.MINOR.x` on all five
  pins, matching KINP's existing 0.2.x — with the patch position a wildcard and a **minor/major**
  bump in a pinned plane named as the re-check trigger (see the header note). KCS gains the
  explicit 0.2.x pin it had been missing.
  The same edit reconciled the pins' **in-body consequences**, since a pin cannot be moved without
  re-reading what it points at: §2 now states which manifest shape the KCB pin implies (one named
  A2A AgentCard extension — the standalone manifest KFT's old 0.2.0 pin implied is deprecated and
  removed at KCB 0.5.0 under KCB §7.3) and carries the capability's `(name, version)` /
  `schema_id` fields; §4.2 records that KGP 0.5.x's projection is not a route around the egress
  gate and that the claim-identity surface KFT references is byte-unchanged; §5.3 records that
  KMI 0.3.x's OTIO adoption reaches no model artifact; §7 records that a grant binds to
  `(capability, major)`. Each is a **citation, not a restatement** — no plane clause is
  re-specified here — which is why §§2–8 are normatively untouched and neither the version nor the
  status moves. With the pins and their citations closed, re-ratification is gated on the third
  pass's *Re-validation — KFT 0.4.0* re-run alone (see *Pressure test*).
- **0.4.0 — Candidate** (2026-08-06) — Folded third-pass deltas from
  [`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md),
  which pressure-tests a producing application's **training exhaust** entering the fabric through the
  thin adapter of [`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md):
  **FT-M** (a training-record JSONL is neither a KGP pack nor image/video/audio bytes, so §3/§4.1 gain
  the `dataset.records[]` slot — the file is a KMI asset carrying the newly registered
  `application/vnd.koine.dataset+jsonl` media type), **FT-N** (the `dataset-jsonl-header` gains the
  **`egress`** class, without which §4.2's gate is uncomputable for a record file; a provider MUST NOT
  infer egress from the trust tier — §4.1/§4.2), **FT-O** (`dataset.header` is an array, one per
  `records[]` entry, and the inline copy is verified against the file on fetch — §4.1), **FT-P** (the
  header gains **`recordCount`**, since one asset id can hold any number of rows and FT-E's
  before-you-fetch estimate is otherwise unenforceable — §4.1/§7), **FT-Q** (cleanup: §3/§4.1 cited the
  header by an internal tasklist id instead of its path, though both schemas have long since landed).
  Strictly **additive** — every 0.3.0-conformant job manifest and header remains valid, no clause was
  withdrawn, and the four-plane composition is unchanged. Status returns Ratified → **Candidate** for
  the new surface, pending owner re-ratification; the third pass's own *Re-validation* section walks
  the corrected flow clean.
- **Editorial** (2026-07-31) — Agnostic reframe, part 2: the §3 job manifest, §5 lineage terms, and
  §6 telemetry event use the KINP §3.4 illustrative placeholder namespaces (`orchestrator` /
  `analyzer` / `refkb` / `provider`); §8 provider selection, §9 execution runtime, and the §9.1
  handoff table name **roles** instead of repos, with the concrete repo assignments left to the
  deployment's own adoption program map and to the repo-level
  [`../ECOSYSTEM.md`](../ECOSYSTEM.md) index (both informative; the former is instance data and
  lives outside this repo). No normative change — the job schema, egress gate,
  license inheritance, telemetry shape, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.3.0 — Ratified** (2026-07-23) — Status Candidate → **Ratified** after both pressure passes
  (`scenarios/e2e-finetune.md`, `scenarios/e2e-finetune-multimodal.md`) cleared with no unresolved
  blockers and no redesign. No contract change from the 0.3.0 candidate — ratification is the status
  transition on the same normative surface. Fine-tuning is now a **ratified profile** composing the
  four planes; downstream runtime work (a general `trainer`, specialized providers, and a host-side
  KCB client) is recorded as cross-repo follow-ups (§9), not built in koine.
- **0.3.0** (2026-07-22) — Folded second-pass deltas from `scenarios/e2e-finetune-multimodal.md`:
  **FT-I** (per-sample multimodal pairing rides the `dataset-jsonl-header` training records; the
  `knowledge`/`media` arrays are referenced corpora — §3/§4.1), **FT-J** (an unsatisfiable
  egress-pinned placement is an admission failure with a report — §4.2), **FT-K** (registry provider
  selection — prefer specialized then cheaper, job MAY target a provider, ties surface — §8/§9; also
  reframes a specialist participant as its **own** `finetune` provider, not an adapter inside the
  general trainer),
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
