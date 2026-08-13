# Upstream standards — what koine pins, and the drift check

**Status:** informative (this file is not normative; the pin of record is each spec's own header).
**Last reviewed:** 2026-08-13.

Koine's design rule is *adopt the interface or shape, not the runtime* — which means every spec
depends on external standards that version independently of us. **Until 2026-08-11 no koine spec
pinned any external standard version**, and a sweep found drift already present in three places.
This document is the missing pin table plus the review cadence that keeps it honest.

## The rule

1. **Every normative reference to an external standard names a version or dated revision.** A bare
   reference ("as in A2A", "per MCP") is a defect, not shorthand.
2. **A pin is a claim about what koine was validated against**, not a claim the upstream is frozen.
   A newer upstream is fine; an *unrecorded* newer upstream is the failure.
3. **Moving a pin is a spec change** — version bump, changelog entry, and (for a normative surface)
   a re-run of the gating scenario, per `specs/README.md`.
4. **Drift is checked on a cadence, not on hope** (see below).

## The pin table

Legend: **✅ pinned** in the spec · **🚧 drift found, correction pending** · **⬜ not yet pinned**.

| Upstream | Pinned version / revision | Used by | State | Notes |
|---|---|---|---|---|
| **A2A** | **v1.0** | KCB **§1.1**, §2 (AgentCard extension), §6 | ✅ | v1.0 replaces the v0.x top-level `"url"` with **`supported_interfaces[]`**, each entry an **`AgentInterface{url, protocol_binding}`**. KCB's example card showed the v0.x shape until **KCB 0.4.2** (2026-08-13), which realigned the §2 example, the endpoint-reading prose, and §2.2's migration row on the v1.0 shape and pinned the version in KCB §1.1. The **KCB extension entry itself is version-neutral** — the same `capabilities.extensions[]` entry, `uri` and `params` under either card version — so this pin governs the host document, not the manifest. |
| **MCP** | **revision 2026-07-28** | KCB §6 (tool-call mapping), KCS §3 | 🚧 | Two corrections: the method is **`tools/list`**, not `list_tools` (KCB §6); and the 2026-07-28 revision is a **breaking change** — stateless core (no `initialize` handshake, no session id, per-request `_meta`) plus a **mandatory `server/discover`**. Any spec clause assuming a session must say which revision it assumes. |
| **OpenTimelineIO** | **v0.18.1** (pre-1.0) | KMI §4.1, ADR-0005 | ✅ | **OTIO is not 1.0.** As observed **2026-08-13**: v0.18.1 is tagged a *prerelease*, the "1.0 Release" milestone was due **2026-04-10** and is ~4 months late with about a third of its issues open. Worse for interchange: `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (OTIO issue **#1985**) — the concrete justification for KMI's explicit asset-id envelope. **Recorded 2026-08-13** in ADR-0005's [amendment log](../decisions/ADR-0005-otio-canonical-timeline.md#amendment-log) (risks only — the adoption is reaffirmed) and pinned in KMI §4.1. Residual: *which* OTIO core schema versions a conformant timeline may declare is still open (KMI §9.1), so this pins the revision KMI was written against, not a conformance range. |
| **C2PA** | **Specification 2.1** — ingredient assertion **`c2pa.ingredient.v3`** | KMI §3.2, ADR-0010 | ✅ | The projection target's `relationship` value space (`parentOf` / `componentOf` / `inputTo`) is what KMI §3.2 maps onto, so the pin is the assertion label, not just the document revision. Adoption evidence behind the choice — a conformance program with **159 certified products** (Google ~35 entries, OpenAI, Amazon Bedrock, Getty, Qualcomm silicon, Sony) — is recorded **as observed 2026-08-13** in KMI §3.1; that figure is a moving count and ages, the pin does not. |
| **MovieLabs OMC** | **v2.8** | KMI §3.3, ADR-0010 | ✅ | Richer derivation vocabulary (Revision / Variant / Derivation / Representation / Alternative); KMI projects onto it rather than restating it. **Revision has no KMI source** — §3 does not model versioning of a work — so the projection is lossy in that direction by construction, not by omission (KMI §3.3). |
| **W3C PROV** (PROV-JSON-LD) | 2024-08-25 submission | KGP §4.1 projection, KINP provenance shape | ⬜ | Already cited in `positioning.md`; not yet pinned in the spec text. |
| **RDF / RDFC** | RDF **1.1** (RDFC-1.0's only defined input) | ADR-0006 | ✅ | Recorded as a *reason*, not a dependency: **RDFC-1.0 has no defined behaviour for RDF 1.2 triple terms**, and revising it is out of the RDF/SPARQL WG charter (runs to **2027**). KGP therefore cannot delegate canonicalization upstream. |
| **SPDX license list** | ⬜ to pin | KGP §7, `policy/` | ⬜ | Pin the list release the license classes were validated against. |
| **W3C Entity Reconciliation API** | ⬜ to pin | KINP `reconcile` | ⬜ | |
| **MLCommons Croissant** | **v1.1** | KFT §3, **§4.1.1** (dataset description) | ✅ | Adopted **by reference** — KFT cites Croissant for dataset description and does not restate it. Pinned in KFT §4.1.1 with a three-row seam table and a NORMATIVE *the gate does not read Croissant* clause: a `dataset.descriptor[]` document is descriptive only and **never an admission input**, so the adoption adds a document an implementer may read, not a rule the gate must run. Croissant has **no egress class and no trust tier**, and its `license` is a descriptive string rather than koine's enforcing class — which is exactly what the `dataset-jsonl-header` keeps holding beside it. Re-open test stated in §4.1.1: if Croissant later specifies an *enforcing* redistribution class and a trust tier, KFT should carry those axes as a Croissant extension rather than beside it. |
| **KitOps / ModelPack** | **Kitfile `manifestVersion: 1.0.0`** (as observed **2026-08-13**) | KFT **§5.3.1** (weights packaging) | ✅ | Adopted **by reference** — KFT mints **no** weights layout. KitOps' `model.parts[].type` already contemplates the LoRA/adapter case, which is precisely KFT's adaptation output, and ModelPack is the packaging spec KitOps implements. What does **not** transfer: **all** KMI lineage obligations remain KFT's (§5.3/§5.3.1), as does the §5.4 egress + union-license inheritance that decides whether an artifact may be published at all. Residual: ModelPack's own version track is younger than the Kitfile's and is the field to re-check first — this row pins the Kitfile manifest version KFT was written against, not a conformance range. |
| **Hugging Face `base_model`** | Hub model-card metadata convention, **as observed 2026-08-13** — `base_model` + `base_model_relation` (`adapter` / `quantized` / `finetune` / `merge`) | KFT **§5.1.1** (published lineage) | ✅ | Adopted **by reference** — millions of repos carry it and the Hub **validates and back-links** it, so minting a parallel koine lineage key would compete with a working convention and lose. **This row has no version track**: the pin is a dated observation of the key and its value space, and the drift check below is the only thing that ages it. KFT §5.1.1 fixes `base_model` as a **projection** of §5.1's KINP `based_on`/`derived_from` relations, not their canonical form, plus the method→`base_model_relation` table and the no-Hub-coordinate rule (**omit, never invent** — a dangling coordinate misattributes lineage to whatever repo it names). |
| **Kubeflow TrainJob** | API group **`trainer.kubeflow.org/v1alpha1`** (Kubeflow Trainer v2), as observed **2026-08-13** | KFT **§3.2** (job shape) | ✅ | **Not adopted — resembled.** `initializer.{dataset,model}.storageUri` is the structural precedent KFT §3 aligns to (dataset-and-model-**by-reference**); §3.2 states the correspondence field by field. **No KFT clause delegates to TrainJob and no KFT field is defined by it**, so the `v1alpha1` alpha status — which may break — costs KFT nothing beyond this citation. What TrainJob does **not** have is the seam KFT fills: no license, egress/redistribution, trust-tier, or budget field anywhere in its API, because its admission control is RBAC/quota over **cluster** resources, not over the **data's** policy. The one deliberate divergence: TrainJob passes the adaptation method through `spec.trainer.{command,args}` (argv), KFT makes it a typed field validated at admission. |
| **safetensors / GGUF / ONNX** | format names only | KFT §5 | ✅ | Referenced as formats, not versioned APIs — no pin needed. |
| **Axolotl** (job format) | YAML config surface **as observed 2026-08-13** | KFT §3.3 portability matrix | ✅ | A **conversion target**, not a dependency: KFT §3.3 maps `base_model` / `datasets[].path` / `adapter` / `lora_*` / `num_epochs` / `sequence_len` / `rl:`. Separates the two taxonomy axes (`rl:` objective, `adapter:` adaptation) — which is why §11.6 flags KFT's single `method` enum. No license, egress, trust-tier, or budget field. |
| **LLaMA-Factory** (job format) | YAML / CLI arg surface **as observed 2026-08-13** | KFT §3.3 portability matrix | ✅ | Conversion target: `model_name_or_path`, `dataset` (registered in `dataset_info.json`), `stage:` (objective), `finetuning_type:` + `quantization_bit` (adaptation), `lora_rank`/`lora_alpha`/`lora_dropout`/`lora_target`, `cutoff_len`. No license, egress, trust-tier, or budget field. |
| **TRL** (config objects) | `SFTConfig` / `DPOConfig` + `peft.LoraConfig` surface **as observed 2026-08-13** | KFT §3.3 portability matrix | ✅ | The one target with **no declarative job document** — its "format" is config-object construction, so an emitting converter produces code or an argument vector and §3.3.4's round-trip is evaluated against constructed objects. No license, egress, trust-tier, or budget field. |
| **OpenAI fine-tuning API** | `POST /v1/fine_tuning/jobs` — `model`, `training_file`, `seed`, `metadata`, `method.{type,supervised,dpo,reinforcement}` — **as observed 2026-08-13** | KFT §3.3 portability matrix | ✅ | Conversion target with **two normative refusals** (§3.3.2): it models only the **objective** axis (`method.type`), so a job pinning `lora`/`qlora`/`full` MUST be refused rather than mapped to a bare `supervised`; and it executes on the provider's infrastructure by construction, so converting a `local-only` run **is** the boundary crossing §4.2 forbids. No license, egress, trust-tier, or per-job budget ceiling. |
| **torchtune** | **v0.6.1** (2025-04-07) — **wound down**, per the project README notice, as observed **2026-08-13** | KFT §3.3.3 — **legacy import source only** | ✅ | Pinned **so it can be excluded**, which is the useful half of a pin. §3.3.3 admits torchtune recipe YAML as an *import* source and forbids it as an emit target or a §9 engine-ladder backend. Its adaptation axis lives in the **recipe name** (`lora_finetune_single_device` and siblings), not a field, so an importer recovers `method` from the recipe id and leaves it **unset** where it cannot — failing admission under FT-F, as intended. Drift check for this row is "has it been archived", not "has it released". |

## The drift check

**Cadence:** at every spec ratification or re-ratification, and at minimum **quarterly**.

For each row above:

1. Fetch the upstream's current version / dated revision.
2. If it differs from the pin, open a finding — do **not** silently update the prose.
3. A finding is closed either by (a) re-validating against the new upstream and moving the pin
   under the normal spec-lifecycle rules, or (b) recording in the spec why koine deliberately
   stays on the older pin.
4. Record the review date in this file's header even when nothing moved.

**Why manual, and why here:** koine holds no runtime code (ADR-0001), so it has no CI to automate
this. The automatable half — *does an implementation's pinned spec version match koine's spec
header* — is a downstream gate and lives there (see agora's `schemas/src/versions.ts` drift gate).
This file is the upstream half: *does koine's pinned view of the outside world still match the
outside world*.

## Related

- [`positioning.md`](positioning.md) — what koine adopts, bridges, or dismisses, and why.
- [`../decisions/ADR-0005-otio-canonical-timeline.md`](../decisions/ADR-0005-otio-canonical-timeline.md) — OTIO adoption; the pre-1.0 caveat above is recorded in its [amendment log](../decisions/ADR-0005-otio-canonical-timeline.md#amendment-log) (2026-08-13), adoption reaffirmed.
- [`../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md`](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md) — why the C2PA and OMC rows exist: KMI bridges both rather than being a third lineage vocabulary.
- [`../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) — why KGP keeps its own canonical form.
- [`../specs/README.md`](../specs/README.md) — the spec lifecycle a pin move runs through.
