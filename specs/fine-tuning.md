# Koine Fine-Tuning Protocol (KFT)

**Spec version:** 0.4.0
**Status:** Candidate
**Last updated:** 2026-08-13
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
[`../docs/upstream-standards.md`](../docs/upstream-standards.md).

A fourth external standard is engaged **differently**, and the difference matters: KFT does not adopt
**Kubeflow `TrainJob`** by reference, it *resembles* it. TrainJob already ships the
dataset-and-model-**by-reference** job shape, so §3's manifest follows that structure rather than
diverging from it (§3.2). Nothing in KFT delegates to TrainJob, no KFT field is defined by it, and a
producer never fetches it — what is borrowed is a **shape, not a scope**. TrainJob carries no
license, egress, trust-tier, or budget field anywhere in its API, which is exactly the seam §4 fills.

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
states the correspondence field by field.

```jsonc
{
  "kft_version": "0.1.0",
  "job":        "orchestrator:activity:ft-run/9f2a",       // KINP activity id — this run (PROV, §5)
  "base_model": "refkb:model:qwen2.5-3b-instruct",         // intake 1 — KINP model-entity ref, externally anchored (§5.1)
  "base_model_descriptor": ["refkb:asset:blake3-mk1f…"],   // the base's published card / ModelKit, by reference (§3.2)
  "modality":   "text-generation",                         // §3.1
  "method":     "qlora",                                   // sft | lora | qlora | full | dpo
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

The vocabulary is additive; a new modality adds a row plus a capability variant (§2), never a new
plane. A **media authority** holds the image/video/audio training assets these modalities
consume, so multimodal fine-tuning inherits an existing, ratified data plane rather than a new one.

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
a dependency. The pin of record is [`../docs/upstream-standards.md`](../docs/upstream-standards.md).

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
{ "activity": "orchestrator:activity:ft-run/9f2a",
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
  { "job": "orchestrator:activity:ft-run/9f2a", "step": 120,
    "metrics": { "train_loss": 0.83, "eval_loss": 1.02, "lr": 1.7e-4, "grad_norm": 0.4 },
    "checkpoint": "orchestrator:asset:blake3-ck12…", // optional KMI asset (resumable)
    "samples":    ["analyzer:asset:blake3-pv3…"],     // optional preview assets — grids/clips (FT-L)
    "ts": "2026-07-22T18:04:11.000Z" }
  ```

  Events are idempotent under redelivery (content-addressed job+step), so the stream needs no
  exactly-once guarantee (KCB §4). A `checkpoint` reference MAY arrive before its bytes propagate;
  consumers tolerate the dangling ref and `fetch` lazily (KCB delta L).
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
3. **Resumption & warm-start** — a run `based_on` a prior finetuned model (continued pre-training,
   sequential LoRA) is expressible via §5 lineage; confirm the job manifest carries a resume
   checkpoint ref cleanly.
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

---

## Pressure test

**Exercised by three passes** — [`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) (text,
found FT-A…FT-H → folded into 0.2.0),
[`../scenarios/e2e-finetune-multimodal.md`](../scenarios/e2e-finetune-multimodal.md) (fully-multimodal
+ multi-provider, found FT-I…FT-L → folded into 0.3.0), and
[`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md)
(a producing application's **training exhaust** entering the fabric under
[`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md),
found FT-M…FT-Q → folded into 0.4.0).

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
- **A producer's own exhaust (§4.1, third pass):** an application's run records — accepted NL edits,
  generations, preference pairs, QA labels — offered as a training set through a thin adapter
  (ADR-0008), verifying that a corpus which is neither KGP claims nor image/video/audio bytes has a
  reference slot, an admission-time egress class, and a resolvable cardinality *before* any transfer.

**What re-ratification is still waiting on.** One item: a re-run of the third pass's
*Re-validation — KFT 0.4.0* section by the spec owner, which walks the corrected §3/§4.1 flow clean
as written but has not been re-executed since. The **dependency pins are no longer part of that
gate** — the `Depends on:` header tracks each plane's current published version under one stated
rule, and every in-body cross-plane citation (§2 → KCB §2/§2.1 and §7.1, §4.2 → KGP §7/§7.2,
§5.3 → KMI §2/§3/§7, §7 → KCB §5) has been re-read against those pins and annotated where the
plane text moved, so the stale-pin loose end is closed rather than unstated. What survives is the
standing obligation in the header's **re-check trigger**: a minor or major bump in a pinned plane
obliges re-reading those same sections before KFT's next status transition.

---

## Changelog

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
