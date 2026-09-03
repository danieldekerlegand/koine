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

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**Run of 2026-08-24** · encoding `kcs:producer-exhaust-finetune` · KCS 0.3.0 · spec set pinned at
**KFT 0.5.0** · evidence `sha256-2d9e6c43…c17bb3`, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

| | |
|---|---|
| Participants, by role | producing application's **adapter** (`mediastore` adapter, live) · training **provider** (**stand-in**) · **specialist** training provider (**stand-in**) |
| Over what links | **1 of 3 live** (33%) |
| Encoded as | 14 steps + **15** assertions, of which **6** are `expect: reject` — the most refusal-heavy encoding in the suite |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**What passed.** Every encoded assertion. The FT-M…FT-Q intake fold is carried end to end:

- **FT-M, the structural one** — without `dataset.records[]` the exhaust fits neither slot the
  manifest offered, and the refusal fires: a training row is not a GroundingPack assertion (forcing
  one in would fabricate a claim) and a JSONL will not route to a media port advertising
  image/video/audio. The folded form is then admitted — three files, three positional headers, one
  computable aggregate (`completes`).
- **FT-N** — the inline `egress` header is a claim made to *skip* the fetch, so it is verified **at**
  the fetch, and an understatement is refused rather than resolved permissively.
- **FT-O** — three files with two headers is refused: a partial aggregate is not a permissive one.
- **FT-P** — a file that grew past the declared `recordCount` the ceiling was granted against is a
  **budget breach**, not a bigger job; refused with a report rather than trained into the overage.
  `cost_within_ceiling` then holds against a resolved estimate for all three corpus kinds.
- **Step 6** — the gate holds hard on a producer-emitted corpus (nothing about the corpus arriving
  from a producer rather than an authority weakened it), the §5.4 inheritance holds on the model and
  its GGUF export, and the last leg still `completes` in the tier it is pinned to.
- **Step 7 / ADR-0008 decision 5** — `based_on_exists` across the boundary and
  `no_sameas_across_worlds`: the `same_as` the adapter did emit stayed inside its own authority. A
  corpus of "records that mention things" is about as adversarial a test of the
  no-`mentions`-relation decision as the vocabulary allows, and it held.

Also held: `asset_attaches_to` on the byte-reproducible export as an ordinary KMI asset, and
`source_world_is` null on a generated records file (KMI delta H).

**What the run does not say.** The **producer** side — the adapter of
[ADR-0008](../decisions/ADR-0008-fabric-producer-adapter.md), which is the participant this pass
exists to admit — was the one live slot, which is the right half to have live. Both training
providers were stand-ins, so every refusal above is an *admitting-side* refusal against a recorded
provider (**DR-6**, in [`e2e-finetune.md`](e2e-finetune.md#findings-from-the-downstream-run)).

**Bearing on this scenario's own gate.** KFT's restated gate is the owner's re-run of the
*Re-validation — KFT 0.4.0* section above. This run is **not** that re-run: it is a machine replay of
the encoded assertions at KFT 0.5.0, over a two-thirds-recorded cast, and it asserts nothing about
§3.3 or §8.1 (**DR-5**). It may be cited as supporting evidence that the FT-M…FT-Q intake behaves as
folded; it does not discharge the gate.

### Findings — from the downstream run

None local to this scenario: every encoded assertion held and the run opened no new break. Its
limits are **DR-5** / **DR-6** in [`e2e-finetune.md`](e2e-finetune.md#findings-from-the-downstream-run)
and **DR-1** / **DR-2** in [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).

---

## Re-run — the FT-M…FT-Q intake fold walked against KFT 0.7.0 (2026-09-03)

**What this section is.** The gate KFT has carried since 0.4.0 is *"a re-run of the third pass's
**Re-validation — KFT 0.4.0** section … which walks clean **as written** but has not been
re-executed"* ([`../specs/fine-tuning.md`](../specs/fine-tuning.md) *Pressure test*). This section is
that execution. The distinction the gate turns on is the whole reason it stayed open: the
*Re-validation* section above was written **at the same time as the fold it validates**, against
0.4.0, and every KFT version since has restated the gate rather than discharged it. What is walked
here is the same five deltas against **KFT 0.7.0 as published**, and — because the fold is a
composition point, not a self-contained one — against the **plane text those clauses cite today**,
which is not the plane text of 2026-08-06.

**Which half is a replay and which is a hand-walk.** Stated per delta, the discipline
[`kcs-format-stress.md`](kcs-format-stress.md#re-validation-kcs-030-walked-2026-09-03) and
[`e2e-multi-authority.md`](e2e-multi-authority.md#re-run-steps-110-walked-by-hand-against-the-folded-text-2026-09-03)
both use, because mixing them silently is **DR-7**/**DR-8**'s failure:

| Evidence | Covers | Why |
|---|---|---|
| **Replay** — the 2026-08-24 run of `kcs:producer-exhaust-finetune` (`## Downstream results` above) | **FT-M**, **FT-N**, **FT-O**, **FT-P** *as folded at 0.4.0* | The encoding asserts all four by name over six `expect: reject` steps, and it came back `green`. This is the **regression set** of this pass. |
| **Hand-walk** — this section, against §3/§4.1/§4.1.1/§4.2/§4.3/§7 of KFT 0.7.0 and §2/§7.1 of KMI 0.3.5 | **FT-Q** in full, the **carrier** question under FT-N, and a re-read of the clause behind every replayed delta | The run pins **KFT 0.5.0** (**DR-5**) and predates **KMI 0.3.5** by two days. It is therefore evidence for the fold *as it stood on 2026-08-24* and for nothing the planes did afterwards — which is exactly where this pass found its break. |

**Method.** The declared bias — *prefer finding breaks over asserting correctness*. Steps 1, 6 and 7
are the regression set; Steps 2, 3, 4, 5 and 8 are the fold under test.

### Per-delta verdicts

| Delta | Step | Evidence | Verdict |
|---|---|---|---|
| **FT-M** — `dataset.records[]` as a KMI asset | 2 | replay + clause re-read | ✅ **Flips.** The slot, the media-type row and the schema all exist, and nothing in the 0.5.0–0.7.0 folds touched them. |
| **FT-N** — `egress` on the header; never inferred from `tier` | 3 | replay (the tier half) + hand-walk (the carrier half) | 🔴 **Half-flips.** The inference trap is closed normatively and stays closed. But **KMI 0.3.5 gave the same object a second egress carrier** and no clause ranks the two → new delta **FT-W**. |
| **FT-O** — one header per record file, positionally | 4 | replay + clause re-read | ✅ **Flips**, with one declared residual: the positional coupling is prose-only. |
| **FT-P** — `recordCount` on the header | 5 | replay + clause re-read | ✅ **Flips.** §7 carries the MUST-re-check, and 0.6.0's remainder rule composes with it rather than replacing it. |
| **FT-Q** — cite the schemas by path | 8 | hand-walk | ✅ **Flips** in the sites the delta named, with one residual outside them. |

### Step 1 — the adapter emits the exhaust ✅ *holds (regression)* — and this is where the second carrier appears

A byte-reproducible JSONL is still a KMI asset under KMI §2, minted with no new identity mechanism.
Unchanged, and the `asset_attaches_to` assertion in the 2026-08-24 run is the regression evidence.

What **has** changed since the fold is what an envelope may now say about those bytes. **KMI 0.3.5**
(2026-08-26) folded **MA-5**: the §2 envelope gained optional **`license`** and **`egress`** fields,
excluded from the id, *"so that the gate at an authority boundary has an operand to decide with
(§7.1(e))"*. That is a plane change no KFT clause anticipated, and it lands squarely on the object
this pass exists to admit. Recorded here; walked at Step 3, where the gate reads.

### Step 2 — referencing the exhaust ✅ *flips*

`dataset.records[]` is present in §3's manifest and specified in §4.1 as *"the JSONL files holding
the training **rows** themselves"*, referenced as a KMI asset carrying
`application/vnd.koine.dataset+jsonl` — a real row in
[`../registry/media-types.tsv`](../registry/media-types.tsv), not a promise of one — fetched with the
same `fetch:asset` verb and grant as any other asset, so by-reference discipline is intact and the
rows never enter the manifest. [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
carries `dataset.records[]` in the `anyOf` that requires at least one corpus slot. FT-I's join is
nameable: §4.1's *Paired multimodal samples* bullet puts the per-sample pairing on those rows by name.

Re-read against the planes as they stand rather than as they stood: **KCB 0.5.0**'s
capability-versioning fold adds a `version` operand to **`invoke`** and a per-entry transport
`binding`, and touches `fetch` not at all; **KMI 0.3.5** adds §7.1's replicate-on-reference model,
under which an unreachable store is a pending fetch rather than a broken id. Neither moves the
reference mechanism this step depends on. ✅

### Step 3 — admission: what the gate reads 🔴 *half-flips* → new delta **FT-W**

**The half that flips, and flips hard.** §4.2's third bullet is unambiguous and is exactly FT-N's
fix: *"For a record file the only descriptor available at admission is its `dataset-jsonl-header`, so
that header MUST carry the class explicitly. A provider **MUST NOT** infer egress from the `tier`."*
The trap Step 3 originally fell into is closed normatively, in both directions, with the reason
stated. The 2026-08-24 run asserted the inline header is verified **at** the fetch and that an
understatement is refused. Nothing in 0.5.0, 0.6.0 or 0.7.0 weakens it.

**The half that does not.** That bullet's premise — *"the **only** descriptor available at
admission"* — was true when it was written and is **no longer true**. A `dataset.records[]` entry is
a KMI asset, and since KMI 0.3.5 a KMI asset's §2 envelope may carry its **own** `egress` (and
`license`). One file, two carriers, and **no clause in either spec ranks them**:

- **They can disagree, and the dangerous direction is unguarded.** Envelope `exportable`, header
  `local-only`. KFT §4.2 reads the header, pins the run local, refuses the cloud class — correct.
  But KMI §7.1(e) governs the **bytes**, and it reads the **envelope**: a participant serving a copy
  *"MUST evaluate the asset's **own** `license` and `egress`"*, and `local-only` is what forbids
  replication across an authority-domain boundary. So the training plane refuses the placement while
  the media plane replicates the file out of the domain — and the rows in it are the ones KGP §7.2
  hard-gates out of *"any export **or training set**."* §4.2 protects where the run executes; nothing
  protects the corpus that reaches it.
- **The absence defaults are opposite, and both documents are conformant while it happens.** `egress`
  is optional on [`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json)
  (`required` is `record`/`contractVersion`/`datasetKind`/`source`/`tier`/`license`) and optional on
  the KMI §2 envelope. KFT §4.2: a header omitting `egress` *"takes KGP §7.2's `exportable`
  default."* KMI §2: *"**Both are optional, and absent is not `exportable`** … §7.1(e) … **fails
  closed** on it."* A job whose record files declare `egress` nowhere is therefore **admitted** for a
  cross-boundary burst on the permissive default and then **fails at the fetch** on the fail-closed
  one — breaking §4.2's own *before placement* promise and routing around **FT-J**'s
  *an-impossible-to-place-job-is-a-rejected-job* rule by failing late instead of at admission.
- **This is FT-N's shape, one layer out.** FT-N's finding was never *the header lacks a field*; it
  was *the gate has no unambiguous operand and the alternatives are all wrong*. A second, unranked
  operand on the same object is that finding again, and §4.1 already states the discipline the fix
  needs in its own idiom — *"the inline copy is a claim, the file is the truth"* — for the one pair
  of carriers it knew about.

🔴 **BROKE — new delta FT-W.** Additive and one-spec: KMI needs no change (§7.1(e) is correct as a
**bytes** rule and MA-5 is what finally gave §4.2's *"every media asset"* clause the operand it had
always assumed), so the fix belongs in KFT §4.1/§4.2 — rank the carriers **most-restrictive-wins**,
forbid a producer from emitting a record asset whose envelope is more permissive than its header,
require the provider to check the pair at fetch the way it already checks the header against the
file's first record, and say which of the two absence defaults governs which question.

### Step 4 — four streams, four header slots ✅ *flips*, one declared residual

§4.1: *"`dataset.header` is that first line, copied inline — an **array**, positionally one per
`dataset.records[]` entry (a single header object is the degenerate one-file form)"*, with the axes
fixed as file-level aggregates (most-restrictive `egress`, union `license`) and the §4.2/§4.3
aggregates computed across files. The schema's `oneOf` carries object-or-array, so the 0.3.0-shaped
manifest still validates. The mixed-license case Step 4 was built from — two `PERSONAL`/`local-only`
files and one `CC-BY-4.0`/`exportable` file — resolves to `local-only` with the union license, and
the per-file mapping survives into §5.4's inheritance. ✅

**Declared residual.** The positional coupling is **prose-only**. JSON Schema cannot express
*`len(header) == len(records)`*, so [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json)
admits three `records[]` against two `header`s, and §4.1 states the coupling without a matching
*MUST reject*. The refusal is derivable — a manifest violating a *"one per entry"* clause is
`invalid` under §8.1 — and the 2026-08-24 run exercised it (*"three files with two headers is
refused: a partial aggregate is not a permissive one"*). Recorded as a residual, not a delta: the
rule exists and a conformant implementation refuses; what is missing is only the explicit sentence.

### Step 5 — spend gating over a reference ✅ *flips*

§7's *Cardinality of a record file comes from its header (FT-P)* bullet carries `recordCount`, the
before-you-fetch estimate, the MUST-re-check on fetch and the fail-with-a-report on overrun.
`recordCount` is on the header schema as a non-negative integer. FT-E's guarantee holds for all
three corpus kinds. ✅

Re-read against 0.6.0, which is the version that most plausibly disturbed this clause and does not:
§7's continuation-leg rules estimate the **remainder** and net the ceiling across the `continues`
chain, but they are additional to cardinality resolution — *"resolving cardinality is not enough"* —
so a **cold** job (no `resume`) prices exactly as it did at 0.4.0. ✅

### Step 6 — the gate once it is fed ✅ *holds (regression)*

Effective egress resolves `local-only`; §4.2 rejects the cloud class with a report rather than
re-pinning; FT-K routes to the specialist; §5.4 propagates the class and union license to the model
and every export **and**, since 0.6.0, to every checkpoint **from the moment it is published**; §8
refuses the cross-boundary registration. 0.6.0 *widened* this step's protection rather than moving
it, and 0.7.0's two `modality` tokens do not reach §4 at all. ✅ The step's original result stands:
nothing about the corpus being producer-emitted rather than authority-curated weakens what the gate
does with the facts — which is why FT-W above is, once again, a finding about **getting the facts to
it**.

### Step 7 — rows that point at entities ✅ *holds (regression)*

No new vocabulary; `same_as` inside the authority, `based_on` across a world boundary, nothing below
threshold. **KINP 0.4.0**'s federation fold is the one plane change that could have reached this
step, and it reinforces it: §4.5's new **fourth, fail-closed branch** (operand unresolvable →
`based_on` or nothing, **never `same_as`**) is the same direction ADR-0008 decision 5 already chose.
✅ Still no `mentions` relation on a corpus of records that mention things.

### Step 8 — following the spec's own pointers ✅ *flips*

§3 and §4.1 cite [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) and
[`../schemas/dataset-jsonl-header.schema.json`](../schemas/dataset-jsonl-header.schema.json) by
resolvable path, and [`../schemas/README.md`](../schemas/README.md) links both rather than describing
them as pending. `koine:10` appears **nowhere** in `specs/`, `schemas/` or `registry/`. ✅

**Declared residual, outside the delta's scope.** Two `koine:10` citations survive in
[`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md) (its Step and its FT-I finding row). FT-Q
named *"three sites in §3/§4.1 plus one in `schemas/README.md`"* and all four are fixed; a pressure
test's own record of what it found in 2026-07 is history rather than a live pointer, and rewriting it
would be editing the record into looking right. Noted so the next reader does not re-find it.

### Findings — from the re-run

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **FT-W** | **High (gate integrity)** | A `dataset.records[]` file now has **two** egress carriers — its `dataset-jsonl-header` (KFT §4.1/§4.2) and its KMI §2 asset envelope (added by MA-5 at KMI 0.3.5) — and no clause ranks them. They may disagree, and the permissive-envelope case lets the media plane replicate across an authority-domain boundary (KMI §7.1(e)) a corpus the training plane correctly pinned `local-only`. Their **absence** defaults are opposite — KFT §4.2 reads an omitted header `egress` as `exportable`, KMI §2/§7.1(e) fails closed — so a job declaring `egress` nowhere is admitted at §4.2 and fails at the fetch, after placement. | Rank the carriers **most restrictive wins** for admission; a producer **MUST NOT** emit a record asset whose envelope is more permissive than its header; the provider verifies the pair at fetch exactly as §4.1 already verifies the inline header against the file's first record; and state which absence default governs the **admission** question and which the **bytes** question. Additive, one spec. | KFT §4.1/§4.2 (KMI §2/§7.1 unchanged) |

**Not a delta — two residuals**, both recorded above: the positional `header`↔`records[]` coupling is
prose-only (Step 4), and two `koine:10` citations survive in a sibling scenario's historical record
(Step 8).

**Not a delta — one precondition that reopened.** KFT's `Depends on:` header states a **track-current**
pin rule (*"names the plane's **current published** version"*) and a **re-check trigger** (*"a **minor
or major** bump in any pinned plane obliges a re-read of the sections KFT cites … before KFT's next
status transition"*). Three of the five pins are stale as of this walk — the header reads KINP 0.2.x
(now **0.4.0**), KCB 0.4.x (now **0.5.0**) and KCS 0.2.x (now **0.3.0**), all three minor bumps landed
2026-08-26; KGP 0.5.x and KMI 0.3.x are patch-current and correct. The trigger has therefore fired
three times unpulled, and at least one cited clause did move: §7's grant paragraph is labelled *"(KCB
0.4.x)"* and KCB 0.5.0's **V-5** added an `invoke` `version` operand with an exhaustive
operand-else-grant-else-**refuse** resolution rule. This is **not** a finding against the FT-M…FT-Q
fold — it is on §7's grant surface, not §4's admission path, and it does not change any verdict above
— but it is a precondition on the **status transition**, which is what a discharged gate leads to.
Recorded here so it is not re-inherited as closed: [`../ROADMAP.md`](../ROADMAP.md) still marks it
*"✅ closed by `chief/71`"*, and it was, on 2026-08-13, for the planes as they stood that day.

### Verdict — not clean; gate (i) does not close

**Four of five deltas flip and the regression set holds.** FT-M, FT-O, FT-P and FT-Q are folded,
present in the prose, present in the schemas and the registry where they need to be, and three of
them are corroborated by a green encoded run. Steps 1, 6 and 7 hold, and the two plane folds that
could have reached them — KINP 0.4.0 at Step 7, KCB 0.5.0 at Step 2 — reinforce or miss them. The
0.4.0 fold's own claim is confirmed by execution rather than by reading: **a 0.3.0-shaped manifest
still validates and still gates identically**, every added field being optional.

**FT-N half-flips, and that is enough to keep the gate open.** Its normative half — *the gate reads
the header, never the tier* — is intact. Its structural half is not, because the sentence carrying it
asserts the header is *the only descriptor available at admission*, and a plane fold two days after
this pass's downstream run made that false. **FT-W** is the delta.

**The gate is therefore not discharged, and its count changes shape** — from *re-run the fold* to
**fold FT-W in KFT §4.1/§4.2, then re-run this section again**. That is a normal, additive, one-spec
patch gated by a re-walk, the same shape KMI count (i) and KCB count (iii) took on the same day. **No
KFT version and no KFT clause moves on this walk**: §3, §4, §5, §7 and the schemas are byte-unchanged,
and the edit is this section plus a gate paragraph and a changelog entry in
[`../specs/fine-tuning.md`](../specs/fine-tuning.md). **KFT stays 0.7.0 Candidate.**

**What this re-run does not touch.** KFT's **second** gate — the re-run of
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md) against 0.6.0's folded text — is a separate
count and is not walked here. The premise that keeps the two independent held under attack at Steps 3
and 5: a **cold** job carries no `resume`, so §4.2's aggregate and §4.3's union are computed over the
same field set they were at 0.4.0, and §7 prices the whole run rather than a remainder. FT-W is a
cold-path finding and does not depend on `resume`; the second gate inherits it as an input, not as a
verdict.
