# Upstream standards — what koine pins, and the drift check

**Status:** informative (this file is not normative), but it is the **table of record** for every
external version koine pins — see [Which document a pin lives in](#which-document-a-pin-lives-in).
**Last reviewed:** 2026-08-13 · **Next review due:** 2026-11-13 (quarterly floor — see
[The drift check](#the-drift-check)).

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
   a re-run of the gating scenario, per [`../specs/README.md`](../specs/README.md).
4. **Drift is checked on a cadence, not on hope** (see [The drift check](#the-drift-check)).
5. **A difference opens a finding, never a silent prose update.** The finding is the unit of work;
   the register is [Open findings](#open-findings) below.

The rule is stated for spec authors, normatively and in one paragraph, in
[`../specs/README.md`](../specs/README.md) § *External standards — the pin rule*. This file is the
table it points at.

### Which document a pin lives in

A spec's **own version and status** live in that spec's header, and the mirror tables elsewhere in
the repo are the bug when they disagree. An **upstream** pin runs the other way, and deliberately:

- **This file is the table of record.** An upstream version is a shared fact about the world — the
  pinned MCP revision is the *same* fact for KCB and for KCS — so it is recorded once, here, where
  the drift check can sweep it in one pass. A drift check that had to reconcile six specs would be
  a check nobody runs.
- **A spec MAY restate a pin it depends on**, so that the spec reads standalone; KCB §1.1 and
  KMI §4.1 both do. When it does, it **MUST** cite this file, and a restatement that disagrees with
  this table is the defect — fix the spec, not the table.
- **A spec that does not restate a pin MUST point here** rather than name a bare standard. That is
  what makes rule 1 satisfiable without duplicating a version into six places.

### Row provenance — who fills which row

Rows are filled by the tasklist that does the spec work behind them, not by a separate documentation
pass; a row and the clause it pins land together. For the record, and so a later reader does not
re-open settled ground: the **OTIO**, **C2PA** and **MovieLabs OMC** rows were filled by
`chief/77` (the KMI lineage-bridge and OTIO pre-1.0 work, ADR-0005 / ADR-0010); the **Croissant**,
**KitOps / ModelPack**, **Hugging Face `base_model`**, **Kubeflow TrainJob**, **safetensors /
GGUF / ONNX**, **Axolotl**, **LLaMA-Factory**, **TRL**, **OpenAI fine-tuning API** and
**torchtune** rows by `chief/78` (KFT 0.5.0's adopt-by-reference work). `chief/76` — this
tasklist — owns the **A2A**, **MCP**, **W3C PROV**, **W3C OWL-Time**, **DCMI Terms**, **JSON-LD**,
**SPDX license list** and **Reconciliation Service API** rows, the rule above, and the cadence
below. Every row, whoever filled it, is reviewed on the one cadence.

## The pin table

Legend: **✅ pinned** in the spec · **🚧 drift found, correction pending** · **⬜ not yet pinned**.

| Upstream | Pinned version / revision | Used by | State | Notes |
|---|---|---|---|---|
| **A2A** | **v1.0** | KCB **§1.1**, §2 (AgentCard extension), §6 | ✅ | v1.0 replaces the v0.x top-level `"url"` with **`supported_interfaces[]`**, each entry an **`AgentInterface{url, protocol_binding}`**. KCB's example card showed the v0.x shape until **KCB 0.4.2** (2026-08-13), which realigned the §2 example, the endpoint-reading prose, and §2.2's migration row on the v1.0 shape and pinned the version in KCB §1.1. The **KCB extension entry itself is version-neutral** — the same `capabilities.extensions[]` entry, `uri` and `params` under either card version — so this pin governs the host document, not the manifest. |
| **MCP** | **revision 2026-07-28** | KCB **§1.1**, §4 (verbs) + **§4.1** (per-verb wire audit), §6; KCS §4 (informative) | ✅ | Pinned in KCB §1.1 at **KCB 0.4.3** (2026-08-13). The revision is a **breaking change** against its predecessor: **stateless core** — no `initialize` handshake, no session id, per-request `_meta` — plus a **mandatory `server/discover`**, so the two wires are **not interchangeable**. KCB §4.1 audits every clause that touches MCP and finds that **no KCB clause requires the handshake or a session id**: `params.mcp` is an address, the §3 crawl and §4 `describe`/`invoke` are request/response, `fetch` is not an MCP call. The one session-shaped clause is §4 **`subscribe`** — a stateless core has no channel a server can push to, so a subscription stream rides **A2A streaming**, and "MCP notifications" is marked as the **pre-2026-07-28** wire. Separately, **KCB 0.4.2** corrected the method names to **`tools/list`** / **`tools/call`**. KCS 0.2.0 stays **Ratified**: its §4 note that a run must record which revision each participant speaks is informative and mints no scenario field. |
| **OpenTimelineIO** | **v0.18.1** (pre-1.0) | KMI §4.1, ADR-0005 | ✅ | **OTIO is not 1.0.** As observed **2026-08-13**: v0.18.1 is tagged a *prerelease*, the "1.0 Release" milestone was due **2026-04-10** and is ~4 months late with about a third of its issues open. Worse for interchange: `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (OTIO issue **#1985**) — the concrete justification for KMI's explicit asset-id envelope. **Recorded 2026-08-13** in ADR-0005's [amendment log](../decisions/ADR-0005-otio-canonical-timeline.md#amendment-log) (risks only — the adoption is reaffirmed) and pinned in KMI §4.1. Residual: *which* OTIO core schema versions a conformant timeline may declare is still open (KMI §9.1), so this pins the revision KMI was written against, not a conformance range. |
| **C2PA** | **Specification 2.1** — ingredient assertion **`c2pa.ingredient.v3`** | KMI §3.2, ADR-0010 | ✅ | The projection target's `relationship` value space (`parentOf` / `componentOf` / `inputTo`) is what KMI §3.2 maps onto, so the pin is the assertion label, not just the document revision. Adoption evidence behind the choice — a conformance program with **159 certified products** (Google ~35 entries, OpenAI, Amazon Bedrock, Getty, Qualcomm silicon, Sony) — is recorded **as observed 2026-08-13** in KMI §3.1; that figure is a moving count and ages, the pin does not. |
| **MovieLabs OMC** | **v2.8** | KMI §3.3, ADR-0010 | ✅ | Richer derivation vocabulary (Revision / Variant / Derivation / Representation / Alternative); KMI projects onto it rather than restating it. **Revision has no KMI source** — §3 does not model versioning of a work — so the projection is lossy in that direction by construction, not by omission (KMI §3.3). |
| **W3C PROV** | **PROV-O — W3C Recommendation 2013-04-30**; namespace `http://www.w3.org/ns/prov#` | KGP §4.1 (annotation vocabulary), KGP §2/§7 `prov` shape; KINP §7, §9 | ✅ | The pin is the **ontology**, because the ontology is what KGP §4.1 normatively names — `prov:wasGeneratedBy`, `prov:wasAttributedTo`, `prov:generatedAtTime`, under the 2013 namespace above. PROV-O has had **no successor Recommendation** since **2013-04-30** and a published W3C namespace does not change under a term, so this is the rare row unlikely ever to move; its drift check is *has a PROV 2 shipped*, not *has a dot release landed*. **Do not read the serialization into it:** *The PROV-JSONLD Serialization* (**2024-08-25**) is a **W3C Member Submission** — explicitly not on the Recommendation track and not endorsed by W3C — and no KGP or KINP clause delegates to it. KGP's JSON-LD projection is defined by §4.1 itself, term by term. [`positioning.md`](positioning.md) links the submission as prior art; **a prior-art link is not a pin**. |
| **RDF / RDFC** | RDF **1.1** (RDFC-1.0's only defined input) | ADR-0006 | ✅ | Recorded as a *reason*, not a dependency: **RDFC-1.0 has no defined behaviour for RDF 1.2 triple terms**, and revising it is out of the RDF/SPARQL WG charter (runs to **2027**). KGP therefore cannot delegate canonicalization upstream. |
| **W3C OWL-Time** | **W3C Recommendation 2017-10-19**; namespace `http://www.w3.org/2006/time#` | KGP **§4.1** annotation vocabulary (`valid_time`) | ✅ | KGP §4.1 is NORMATIVE about the terms a projection MUST emit, so the vocabularies it names need pins as much as the protocols do. The 2017 Recommendation defines all four terms §4.1 uses — `time:hasTime`, `time:ProperInterval`, `time:hasBeginning` / `time:hasEnd`, `time:inXSDDateTimeStamp`. **Live drift, deliberately not taken:** `https://www.w3.org/TR/owl-time/` currently serves a **Candidate Recommendation Draft of 2022-11-15**, not the Recommendation. koine stays on the **Recommendation** — a CR Draft is by its own boilerplate revisable at any time, and §4.1's terms are unchanged between the two, so moving the pin would buy nothing and stake a normative clause on a document that may still move. Re-check when the CR Draft reaches Recommendation. |
| **DCMI Metadata Terms** | **DCMI Recommendation 2020-01-20**; namespace `http://purl.org/dc/terms/` | KGP **§4.1** annotation vocabulary (`license`) | ✅ | `dcterms:license` — *“a legal document giving official permission to do something with the resource”* — is the established term §4.1 reuses to carry the **SPDX identifier**, beside koine's minted `kgp:licenseClass` for the §7.1 class. Note what the pin is *for*: DCMI's own policy is that a published term URI is never redefined, so the risk this row guards is not a term changing meaning but koine citing a namespace it never dated. |
| **JSON-LD** | **1.1 — W3C Recommendation 2020-07-16** | KGP §4, **§4.1** (the projection's wire form) | ✅ | Pinned because §4.1 names it, not because §4.1 depends on a processor: KGP §3.4 and §4.1 are explicit that claim identity **must not** depend on a resolvable context document, so a JSON-LD context is a serialization convenience on egress and never an input to the canonical (§3). A JSON-LD 1.2 would therefore be a *serialization* question for this row and could not reach §3's ids. |
| **SPDX license list** | **release 3.28.0** (**2026-02-20**) | KGP §7.1, §4.1 (`dcterms:license` carries the SPDX id); [`../policy/license-classes.json`](../policy/license-classes.json) | ✅ | Pins the list release every identifier in `policy/license-classes.json` was **checked against**, not merely written against — the class → SPDX-id mapping was re-derived from 3.28.0's `licenses.json` (727 identifiers) at the 2026-08-13 review. What koine depends on is **the identifier namespace**, not the list's *contents*: §7.1's six classes are koine's own admission enum and no SPDX release can change them, so a new release moves this row only when an id koine names is **added, renamed, or deprecated**. That is exactly what the first sweep found — see **[F-1](#f-1-pdm-10-is-not-an-spdx-identifier-closed)**, which is why this row is worth having. Drift check for this row is mechanical: re-resolve each id in `license-classes.json` against the current release and diff. |
| **Reconciliation Service API** | **v0.2** — **Final Community Group Report, 2023-04-10**, W3C Entity Reconciliation Community Group | KINP §4.5, §8 (`reconcile`), §9 | ✅ | **Name it correctly, because the correction is the pin.** The group is a W3C **Community Group**; the document is a CG Report and states that it is *“not a W3C Standard nor is it on the W3C Standards Track”*. KINP's prose calls it the *OpenRefine / Wikidata Reconciliation API*, which is accurate about who implements it; “W3C Entity Reconciliation **API**” is not, since W3C publishes no such API — it hosts the group. What KINP §4.5 borrows is the **shape** of the reconcile query/candidate/score exchange, not a transport binding, and that is what fixes the blast radius of a version move: a **v1.0 draft is in progress** whose stated purpose is *“make the API conform to REST principles”* — an HTTP-binding change, which costs KINP nothing. A change to the **candidate or scoring shape** would cost KINP §4.5, and is what this row watches for. |
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

**Cadence — two triggers, whichever comes first:**

- **Every ratification or re-ratification.** A promotion to `candidate` or `ratified` is a claim
  that a spec was validated; validating against an upstream nobody re-checked is validating against
  a guess. The spec owner sweeps this table's rows for that spec **before** proposing the promotion,
  and an open finding against one of those rows blocks it until the finding is closed either way.
- **Quarterly, as a floor**, for every row — including rows belonging to specs that nothing is
  currently trying to promote. This is the trigger that catches the standard that moved while koine
  was busy elsewhere, which is the failure mode this file exists for.

For each row above:

1. Fetch the upstream's current version / dated revision.
2. If it differs from the pin, **open a finding** in [Open findings](#open-findings) — do **not**
   silently update the prose. A silent update destroys the only thing a pin is worth: the record of
   what koine was actually validated against on a given date.
3. A finding is closed in exactly one of three ways, and the closure is recorded in the finding:
   (a) **move the pin** — re-validate against the new upstream and move it under the normal
   spec-lifecycle rules (version bump + changelog + gating-scenario re-run for a normative surface);
   (b) **hold the pin** — record in the spec, or in the row's Notes, *why* koine deliberately stays
   on the older version, so the gap is a decision rather than a lag (the OWL-Time row is a worked
   example); or (c) **fix koine** — where the difference turns out to be koine's own error rather
   than upstream movement (F-1 below).
4. **Record the review date in this file's header even when nothing moved**, and add a line to the
   review log. A review that finds nothing is the most common outcome and the easiest to fail to
   perform; an unchanged header is indistinguishable from a review that never happened.

### Review log

One line per sweep. "Rows" is what was actually fetched, not what was skimmed.

| Reviewed | Rows | Findings opened | By |
|---|---|---|---|
| **2026-08-13** | all 22 — the A2A and MCP rows re-fetched during `chief/76`; OTIO, C2PA and OMC during `chief/77`; the KFT rows during `chief/78`; W3C PROV, OWL-Time, DCMI Terms, JSON-LD, SPDX and the Reconciliation Service API fetched fresh for this sweep | **F-1** (closed same day) | `chief/76-upstream-standards-pins` |

### Open findings

*None.* Closed findings are kept below rather than deleted — a closed finding is the evidence that
the check ran, and the shape of the next one.

#### F-1 — `PDM-1.0` is not an SPDX identifier (closed)

**Opened** 2026-08-13, first SPDX sweep · **Closed** 2026-08-13 by route (c), *fix koine*.

[`../policy/license-classes.json`](../policy/license-classes.json) classed the Public Domain Mark
under `public-domain` as **`PDM-1.0`**. That identifier is **not on the SPDX license list** — not in
3.28.0, and not in 3.26.0, 3.24.0 or 3.20 either, so it was never valid and this is koine's own
error rather than upstream movement. The SPDX identifier for the Public Domain Mark is
**`CC-PDM-1.0`**, which was added to the list between **3.24.0 and 3.26.0** — meaning that when the
policy file was written there was *no* SPDX id for that licence at all, which is the likely origin
of the invented one.

**Why it mattered enough to fix rather than note.** `license-classes.json` is admission policy: KGP
§7.1 rejects a record whose licence is unknown, and producers must resolve rather than default. An
identifier no SPDX release defines can never be resolved by a conformant producer, so the entry
could only ever have produced a rejection — it granted nothing and cost a producer the time to find
out why.

**Closure:** `PDM-1.0` → `CC-PDM-1.0` in `policy/license-classes.json`, `policyVersion`
**0.1.0 → 0.1.1**. No class was added or removed and no other id changed, so no schema, spec clause
or consumer allowlist moves; a record that was conformant before is conformant after.

**What it demonstrates about the check.** The finding did not come from reading koine's prose — it
came from resolving koine's identifiers against the pinned artifact. That is the difference between
a pin and a citation, and it is the argument for the mechanical drift check named in the SPDX row.

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
