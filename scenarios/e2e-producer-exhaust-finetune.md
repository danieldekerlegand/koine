# Scenario: a producing application's training exhaust becomes a finetune (KFT third pass)

**Purpose:** stress-test [`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT 0.3.0, *Ratified*)
against the path [`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md)
opens — an ordinary application joining the fabric as a **producer** and offering its own **training
exhaust** as a training set through a thin adapter. The two earlier passes
([`e2e-finetune.md`](e2e-finetune.md), [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md))
both start from corpora a *knowledge* or *media* authority curated on purpose. Nobody had yet pushed
the corpus an application already has lying around: the records its runs emitted as a side effect.
ADR-0008 decision 1 asserts that surface is emittable today ("a KFT dataset **by reference** — KGP
pack ids and KMI asset ids plus a `dataset-jsonl-header`"). This pass tries to break that assertion
before a downstream adapter is built against it. Same method as the earlier passes: every step is
marked ✅ *held* or 🔴/🟡 *broke*, and §Findings collects the deltas.

**The story.** A media-production application has three hundred recorded runs. Each run left behind
exactly the material a small model would want:

- **accepted natural-language edits** — an instruction, and the validated operation batch an operator
  accepted for it (plus, on runs that persisted it, the failed attempt and the fix that followed);
- **generations** — prompt / model / backend per shot, the artifact produced, and the QA verdicts a
  critic raised against it;
- **preference pairs** — a rejected take *N* and the accepted take *N+1* for the same shot, with the
  issues that triggered the regeneration;
- **QA labels** — content and conformance findings, per artifact.

The operator wants a small instruction→operation model finetuned on the first stream, with the
preference pairs held for a later DPO run. All of it is operator-authored work product: trust tier
`personal`, license class `PERSONAL` ([`../policy/license-classes.json`](../policy/license-classes.json)),
and **it must not leave the tier** — the exact condition KGP §7.2 exists for.

**Setup.** The application is a **media producer** in the `mediastore` namespace (KINP §3.4). Per
ADR-0008 it builds no bridge: a thin adapter maps its records onto koine shapes, and the generic
admission path lives in the shared runtime commons. The general `finetune` provider
(`provider:org:trainer`, cloud-capable) and a specialist local provider are both registered (KCB §3,
FT-K); the control-plane host `orchestrator` issues the `invoke:finetune` grant with a
`budget_units` ceiling (§7); `refkb` holds the base-model entity with its external anchor (FT-G).

---

## Step 1 — The adapter emits the exhaust (ADR-0008 decision 1; KMI §2)

The adapter serializes each stream as JSONL: a `dataset-jsonl-header` first line, then one row per
training example, rows in a total order over their canonical serialization, **no wall-clock anywhere**
in the output. Two exports of the same runs are therefore byte-identical, and the file is named by the
hash of its own bytes.

✅ **Held — and it lands for free.** A byte-reproducible blob is precisely a **KMI asset** (KINP §2:
*bytes → content-addressed*). The adapter mints `mediastore:asset:blake3-e9d7…` with no new identity
mechanism, no new hashing rule, and no negotiation — the discipline the exporter already had for its
own idempotence is the discipline KMI asked for. The header's `tier` + `license` ride the bytes, so
the labels cannot be separated from the data they describe.

---

## Step 2 — Referencing the exhaust in a job (KFT §3/§4.1)

The adapter now has to *name* that asset in a finetune job manifest. `dataset` offers exactly two
slots: `knowledge[]` — KGP GroundingPack ids — and `media[]` — KMI asset ids "(multimodal data)".

🔴 **BROKE (FT-M, structural).** The exhaust fits **neither**.

- It is not a **GroundingPack**: KGP §2 fixes a pack as `entities` / `assertions` / `links` /
  `provenance`, all content-addressed per §3 over the immutable relation registry. An
  instruction→operation-batch row, a rejected/accepted take pair, or a QA finding is not an assertion
  about entities and has no relation in `registry/relations.tsv` — nor should it acquire one, since a
  relation signature is permanent (`registry/README.md`). Forcing training rows into a pack would
  fabricate claims the producer is not making.
- It is not **media data** in the sense `media[]` means: the `finetune` capability's media port
  advertises `image/*`, `video/*`, `audio/*` (§2), so path search (KCB §3) would not route a JSONL
  there, and §4.1 describes that array as the corpus a multimodal run *fetches samples from*.

Worse, this hole sits underneath a clause the spec already leans on: **FT-I** (0.3.0) resolved
per-sample multimodal alignment by putting the join *in the training records* — "a row references both
a KMI `asset` id *and* its text". But the manifest can only carry `dataset.header`, a **description**
of records whose bytes have no reference slot at all. The join surface FT-I selected is, today,
unnameable. **Delta FT-M.**

---

## Step 3 — Admission: the egress gate reads… what? (KFT §4.2)

The commons admits the job. §4.2 is the load-bearing rule: effective egress = the most restrictive
class across all training data and the base model; a `local-only` run may not touch rented compute.
For a KGP pack the class rides every record (KGP §7.2); for a KMI asset it rides the envelope. For a
record file the only descriptor at admission is its **header** — and the header carries `record`,
`contractVersion`, `datasetKind`, `source`, `tier`, `license`, `generatedAt`, `provenance`.

🔴 **BROKE (FT-N, structural).** There is **no egress class on the header**, so the gate has nothing
to read. The provider's three options are all wrong:

1. **Infer it from `tier: personal`.** This is the trap, and KGP §7.2 names it explicitly: the trust
   tier is *descriptive*, the egress class *enforcing*, and they are orthogonal — "`local-only`
   typically co-occurs with the `personal` trust tier" is a correlation, not a rule. Inference gets
   both directions wrong: a `personal` corpus the operator is happy to publish gets pinned needlessly,
   and — the dangerous one — a `curated` or `synthetic` corpus that must *not* leave (an
   under-licence-embargo dataset; a simulation seeded from private material) gets green-lit for cloud.
2. **Fetch the file and scan the rows.** Egress is a *before-transfer* control. Shipping the bytes to
   the admission step to discover they may not be shipped is the breach itself, and the fetch crosses
   the boundary before any class is known.
3. **Default to `exportable`.** Silent downgrade of the only privacy gate in the spec.

The gate is not weak here — it is **uncomputable**, because the only fact it needs was never made
expressible for this kind of input. **Delta FT-N.**

---

## Step 4 — Four streams, one header slot (KFT §3)

The operator wants the NL-edit stream now and the preference stream in a follow-up DPO run; the QA
labels carry a different license than the operator's own edits (a critic model's output vs. hand
authorship). So a job may reference several record files at once, and they do **not** share axes.

🔴 **BROKE (FT-O).** `dataset.header` is a **single object**. Even once FT-M gives the files a
reference slot, a corpus of *N* files has one place to describe them — so the manifest either
describes one file and leaves the rest opaque to the gate, or flattens *N* headers into one and
silently loses which class belongs to which file. That is the same conflation §4.1 warns against at
row level, one layer up. The header must be positional, one per referenced file, and the aggregate
(most-restrictive egress, union license) computed *across* them — which is what §4.2/§4.3 already say
for records, applied to files. **Delta FT-O.**

---

## Step 5 — Spend gating over a reference (KFT §7, reopening FT-E)

The grant carries a `budget_units` ceiling. FT-E (0.2.0) fixed the static-estimate problem by making
the provider compute a **per-job estimate at admission, after resolving dataset cardinality**.

🔴 **BROKE (FT-P).** FT-E's fix quietly assumed the manifest *enumerates* the corpus: for
`knowledge[]` and `media[]` the array length is the cardinality, resolvable from the manifest alone.
A record file breaks that assumption — one asset id may hold ten rows or ten million, and nothing in
the reference says which. The provider must either transfer the whole file to count lines (the same
before-you-fetch violation Step 3 found, now on the cost axis, and for a large exhaust the transfer
is itself the expensive part) or admit a job it cannot price. The cardinality has to ride the header,
where the other file-level facts already are. **Delta FT-P.**

---

## Step 6 — The gate, once it is fed (KFT §4.2/§5.4/§6.1)

Hand-patching an egress class onto the header to get past Step 3, the rest of the run is walked to
see whether anything *downstream* of admission also breaks.

✅ **Held — and it holds hard.** Effective egress resolves to `local-only`; the provider rejects the
requested `single-gpu-a100-80gb` class with a report rather than silently re-pinning (§4.2), and the
registry routes to the specialist local provider (FT-K). The finetuned model and its GGUF export
inherit `local-only` + the union license (§5.4), so the registry refuses a cross-boundary registration
(§8) and eval runs in-tier (FT-D). Nothing about the exhaust being *producer-emitted rather than
authority-curated* weakens the gate — the deltas above are all about **getting the facts to it**, not
about what it does with them. That distinction is the useful result of this pass.

---

## Step 7 — Rows that point at entities (ADR-0008 decision 5; KINP §4)

The generation rows name shots, artifacts and characters. The adapter has to say that its local
`mediastore:shot:…` refers to a canonical entity, and that a row's artifact is a fabric asset.

✅ **Held, with no new vocabulary.** The artifact reference is a KMI asset id — the same id the row
already carries for the FT-I join. The record→entity link is a `same_as` from the source-local id to
the canonical one, carrying confidence and provenance, with `based_on` across a world boundary and
*nothing* below threshold (ADR-0008 decision 5, KINP §4.5). No `mentions` relation was needed at any
point in the walk, on a corpus whose entire nature is "records that mention things" — which is about
as adversarial a test of that decision as the vocabulary is likely to get.

---

## Step 8 — Following the spec's own pointers (docs)

An implementer reading §3/§4.1 to build the adapter is told the header is "the machine-readable header
koine:10 ports into `koine/schemas/`".

🟡 **BROKE (FT-Q, cleanup).** `koine:10` is an internal tasklist id, not a resolvable path, and the
port it refers to **has long since landed** — both
[`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) and
[`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) are in the repository,
with a golden fixture. Three sites in §3/§4.1 plus one in [`../schemas/README.md`](../schemas/README.md)
("once koine:10 has landed them") tell a reader to go looking for work that is done. **Delta FT-Q.**

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **FT-M** | **High (structural)** | A training-record JSONL is neither a KGP pack (§2: entities/assertions/links) nor image/video/audio bytes, so `dataset` has no slot for it — and FT-I's per-sample join surface is therefore unnameable. | Add `dataset.records[]`: the file is a **KMI asset** carrying a registered `application/vnd.koine.dataset+jsonl` media type, fetched with the same verb + grant. | KFT §3/§4.1, [`../registry/media-types.tsv`](../registry/media-types.tsv) |
| **FT-N** | **High (structural)** | The `dataset-jsonl-header` carries tier + license but **no egress class**, so §4.2's gate is uncomputable for a record file; the only alternatives are inferring from the (descriptive) trust tier, fetching before the gate, or defaulting open. | Header carries **`egress`** (file-level, most restrictive over its rows); a provider MUST NOT infer egress from `tier`. | KFT §4.1/§4.2, [`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) |
| **FT-O** | Med | `dataset.header` is singular while a corpus is several files with different kinds, licenses and classes — one description for *N* files loses the mapping. | `dataset.header` is an **array**, positionally one per `records[]` entry; the gate aggregates across them; the inline copy is verified against the file on fetch. | KFT §3/§4.1 |
| **FT-P** | Med | FT-E's admission-time estimate assumed the manifest enumerates the corpus; one record-file id can hold any number of rows, so cardinality is unresolvable without transferring the file. | Header carries **`recordCount`**; provider re-checks on fetch and fails the run if the file exceeds the estimate the ceiling was granted against. | KFT §4.1/§7 |
| **FT-Q** | Cleanup | §3/§4.1 (and `schemas/README.md`) cite the header + job schema by an internal tasklist id, "ported by koine:10" / "once koine:10 has landed them" — unresolvable, and describing landed work as pending. | Cite the schema paths. | KFT §3/§4.1, [`../schemas/README.md`](../schemas/README.md) |

**Not a delta.** Three things this pass deliberately tried to break and could not: the exhaust needed
no new identity mechanism (Step 1), no new grounding relation (Step 7), and no change to the gate's
*behavior* (Step 6). Every finding above is about making a fact **expressible at admission** — none
required redesign, and none touches the four-plane composition.

---

## Schema conformance — what the (downstream) validator must enforce

The additive surface is structural and cheap to check:
[`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) gains `dataset.records[]`
(KINP-id array, joining the `anyOf` that requires at least one corpus slot) and a `header` that is an
object **or** an array of headers;
[`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) gains
`egress` (`$ref`ing the shared `provenance.schema.json#/$defs/egress`) and `recordCount`. The golden
fixture [`../schemas/fixtures/finetune-job.json`](../schemas/fixtures/finetune-job.json) exercises all
four. Per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) the validators and the
conformance suite are **downstream**, not here.

As with the first pass, the interesting rules are **semantic** and belong to the provider's admission
path. Three negative cases the schema alone will pass:

1. **Header/file disagreement.** The inline `dataset.header[i]` claims `egress: exportable` while the
   fetched file's first record says `local-only`. MUST reject with a report (§4.1) — the inline copy is
   a claim made to skip the fetch, so it must be checked *at* the fetch, in the safe direction.
2. **Positional mismatch.** `records[]` has three entries and `header` has two. The manifest is
   structurally satisfiable but one file is undescribed, so the aggregate in §4.2/§4.3 is incomplete —
   admission MUST reject rather than gate on a partial corpus.
3. **Count overrun.** The header declares `recordCount: 5000`, the ceiling was granted against that
   estimate, and the fetched file holds 5,000,000 rows. MUST fail the run with a report (§7) rather
   than train past the budget the grant authorized.

---

## Verdict

**The gate is sound; the intake was incomplete.** Everything KFT does *after* it knows the facts —
aggregate, pin, refuse cloud, propagate to the output model, evaluate in-tier — held under a corpus
that no earlier pass had used (Step 6), and so did identity (Step 1) and grounding (Step 7). What
broke is upstream of all of that: a producer-emitted corpus had **no reference slot** (FT-M), **no way
to declare the one fact the gate needs** (FT-N), **no way to describe more than one file** (FT-O), and
**no way to be priced without transferring it** (FT-P).

The common shape is worth naming, because it is the thing ADR-0008 changes about who emits data.
Every earlier pass fed the gate a corpus a knowledge or media *authority* had curated, and authorities
put per-record classes on everything by construction (KGP §7.2). An **application's** exhaust arrives
as a file, from a producer whose thin adapter is not supposed to know admission rules — so the file
itself has to be self-describing enough for the commons to gate it sight-unseen. FT-N and FT-P are the
same requirement twice: *the descriptor must answer the question before the bytes move.*

**Blocking: FT-M, FT-N** — without them ADR-0008's "training exhaust" surface is not emittable at all,
and the ADR names it as one of the four an adapter publishes. Should-fix: FT-O, FT-P. Cleanup: FT-Q.
None requires redesign; all four are additive fields on existing shapes.

> **Resolution (2026-08-06):** deltas FT-M…FT-Q folded into **KFT 0.4.0** (§3 manifest + capability
> port, §4.1 the `records[]` slot / header-per-file / file-level aggregates, §4.2 the header-not-tier
> rule, §7 header cardinality), plus `egress` + `recordCount` on
> [`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json),
> `dataset.records[]` + array `header` on
> [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json), and the
> `application/vnd.koine.dataset+jsonl` row in
> [`../registry/media-types.tsv`](../registry/media-types.tsv). The fold is strictly additive — every
> 0.3.0-conformant manifest and header stays valid — but it changes a ratified normative surface, so
> KFT returns **Ratified → Candidate** pending owner re-ratification. This document is the record of
> what the pressure test found.

---

## Re-validation — KFT 0.4.0

The same walk, re-run against the folded contract. Only the steps that broke are re-checked.

**Step 2 (FT-M).** The adapter names the exhaust as
`"records": ["mediastore:asset:blake3-e9d7…"]` — a KMI asset with media type
`application/vnd.koine.dataset+jsonl`, resolved and fetched by the `fetch:asset` verb and grant it
would use for any other asset (KMI §7). ✅ No new transport, no new identifier kind; the rows stay out
of the manifest, so §4.1's *references, not payloads* rule is intact. FT-I's join is now nameable: the
rows carrying the asset↔text pairing live in a file the manifest points at.

**Step 3 (FT-N).** The header declares `"egress": "local-only"` beside `tier` and `license`. The
commons computes the effective class from `{records ∪ knowledge ∪ media ∪ base}` **before any
transfer**, pins local, and rejects the cloud class with a report. ✅ The inference trap is closed
normatively (§4.2: MUST NOT derive egress from the trust tier), and the header-omitted case takes KGP
§7.2's `exportable` default, so understatement is a producer bug the commons can name rather than an
ambiguity.

**Step 4 (FT-O).** Three record files, three positional headers; the NL-edit and preference files are
`PERSONAL`/`local-only`, the QA-label file `CC-BY-4.0`/`exportable`. The aggregate is `local-only`
with the union license, and the per-file mapping survives into the model's provenance (§5.4). ✅ The
degenerate single-object form still validates, so a 0.3.0-shaped manifest is unaffected.

**Step 5 (FT-P).** `recordCount: 18240` on the header lets the provider price the job at admission
against the `budget_units` ceiling; on fetch it re-counts and, on a file that has grown past the
estimate, fails with a report instead of training into the overage. ✅ FT-E's guarantee — *the ceiling
is checked against a resolved estimate* — now holds for all three corpus kinds rather than two.

**Step 8 (FT-Q).** §3/§4.1 cite [`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json)
and [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) by path. ✅

**Steps 1, 6, 7** are untouched by the fold and were already clean.

**No delta reopened, and no new delta found.** Backward compatibility was checked in the direction
that matters for a ratified spec: a 0.3.0 manifest (no `records[]`, single-object `header`, no
`egress`/`recordCount`) still validates and still gates identically, because every added field is
optional and the added defaults are KGP's own. What remains before re-ratification is the owner's
call, not another break: this pass's own corrected walk is the evidence.
