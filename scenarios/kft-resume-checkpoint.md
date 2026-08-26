# Scenario: an interrupted run resumes from its checkpoint (KFT pressure leg)

**Purpose:** pressure-test [`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT 0.5.0,
*Candidate*) §11.3 — *"a run `based_on` a prior finetuned model … is expressible via §5 lineage;
**confirm the job manifest carries a resume checkpoint ref cleanly**."* §11.3 is two claims in one
sentence, and this leg separates them: the **warm-start** half is exercised first and holds, so the
leg is not a search for a break it already knew it would find; the **resume** half is then attacked
until it produces one.

The attack surface is a promise KFT already makes. §6's telemetry event carries
`"checkpoint": "orchestrator:asset:blake3-ck12…"` and annotates it **"optional KMI asset
(resumable)"** — the word *resumable* is a contract claim about what a consumer may do with that
id. This leg takes the claim at face value and tries to actually resume, using nothing but §3's
manifest and its machine-readable twin
[`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json).

Focused follow-up to [`e2e-finetune.md`](e2e-finetune.md) (which fixed the reproducibility anchor
as the *run*, FT-C) and [`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md)
(which fixed the rule that *the descriptor must answer the question before the bytes move*). Same
method as every pass in this directory: each step is marked ✅ *held* or 🔴/🟡 *broke*, and
§Findings collects the deltas. **Only the question this leg forces is carried into a fold.**

## Setup

The **media producer** `mediastore` holds the training-record corpus, the **control-plane host**
`orchestrator` issues the `invoke:finetune` grant and hosts the registry, the **identity authority**
`refkb` holds the base-model entity with its `ext:hf:…` external anchor (FT-G), and two capability
**providers** are registered (KCB §3, FT-K): the cloud-capable general trainer
`provider:org:trainer` and an in-tier specialist `provider:org:local-trainer`. These are the KINP
§3.4 placeholder namespaces, not deployment names or endpoints.

The job is deliberately the *least* exotic one KFT admits — nothing here depends on multimodality,
multi-provider routing, or a producer-emitted corpus, all of which earlier passes have already
walked:

```jsonc
{ "kft_version": "0.5.0",
  "job":        "orchestrator:activity:ft-run/7c3d",
  "base_model": "refkb:model:base-slm-3b-instruct",
  "modality":   "text-generation",
  "method":     "qlora",
  "dataset": { "records": ["mediastore:asset:blake3-e9d7…"],
               "header":  [ { "egress": "local-only", "license": "PERSONAL",
                              "tier": "personal", "recordCount": 182400 } ] },
  "hyperparams": { "epochs": 3, "lr": 2e-4, "max_seq_len": 2048,
                   "lora": { "r": 16, "alpha": 32 } },
  "compute": { "class": "local-mps", "egress": "derived" },
  "seed": 42, "config_hash": "sha256-cfg7c3d…" }
```

Effective egress resolves to `local-only` (§4.2), so `provider:org:local-trainer` takes it and the
run is pinned in-tier. The grant's ceiling is **1,800,000** `gpu-seconds` (§7), and the resolved
admission-time estimate (FT-E) is 1,760,000 over 9,000 steps.

---

## Step 1 — Warm start from a completed finetuned model (§11.3, first half)

Before breaking anything, the leg exercises the case §11.3 asserts *is* expressible. A prior job
completed and minted `orchestrator:model:slm-3b-worldsim`. The operator now wants a **sequential
LoRA** — a second adaptation on top of the first, over a new corpus.

✅ **Held, and it needed no new surface.** `base_model` is typed as a KINP `model` **entity** (§5.1),
and a finetuned model *is* one — the same type, the same registry row, distinguished from an external
base only by whether it carries an `ext:hf:…` anchor. So the second job names
`"base_model": "orchestrator:model:slm-3b-worldsim"` with no dispensation:

- **Lineage composes.** `based_on` / `derived_from` chain from the new model through the intermediate
  to the external base (§5.1); the chain is walkable in both directions and no leg of it is implied.
- **Inheritance composes.** §5.4 takes the most restrictive egress and the union license over
  `{training data ∪ base model}`, and the intermediate model already carries the first corpus's
  class — so the second run inherits the first run's restrictions **transitively**, without §5.4
  re-deriving the original corpus.
- **Publication composes.** §5.1.1's *omit, never invent* rule fires correctly: the intermediate has
  no Hub coordinate, so `base_model` is omitted from the published card and the KINP id is recorded
  in the card body, exactly as written.

§11.3's first clause is **confirmed as written**. Everything below is about its second clause.

---

## Step 2 — The run dies at step 4,180. Where does the checkpoint go?

The in-tier host is preempted. The stream's last event was:

```jsonc
{ "job": "orchestrator:activity:ft-run/7c3d", "step": 4000,
  "metrics": { "train_loss": 0.91, "lr": 1.9e-4 },
  "checkpoint": "orchestrator:asset:blake3-ck40…" }
```

1,012,000 of the 1,800,000 granted units are spent. The operator wants to resume from
`blake3-ck40…`. Every slot §3 offers is tried:

| Slot attempted | Result |
|---|---|
| `base_model` | **Type error.** §5.1 fixes it as a KINP `model` **entity**; a checkpoint is a KMI **asset** (§5.3/§6) — a different plane and a different id kind. Minting a model entity per checkpoint is worse: §5.2 mints a model from a run's `generated` output at completion, so this fabricates a released model, and a `based_on` / `derived_from` edge, for an artifact that was never released — one entity per 200 steps, all of them dead ends in the lineage graph. |
| `dataset.media[]` | **Right id kind, wrong meaning.** §2's media port advertises `image/*` · `video/*` · `audio/*`, so path search (KCB §3) will not route a `application/vnd.koine.model+safetensors` asset there. Worse, it is *admitted as corpus*: §4.2 folds it into the effective egress aggregate and §4.3 into the union license, and §7 prices it as training samples. A checkpoint is not data the run learns from. |
| `dataset.records[]` | Requires `application/vnd.koine.dataset+jsonl` plus a `dataset-jsonl-header` per file (§4.1, FT-M/FT-O). A weight blob has neither, and inventing a header for it is the fabrication FT-N's rule exists to forbid. |
| `export[]` | An *output* variant slot (§5.3). Wrong direction. |
| A new top-level `resume` field | **Not schema-valid.** [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) is `"additionalProperties": false` at the top level *and* inside `dataset`. There is no extension slot and no vendor escape hatch — by design (§3: *a proposal to add a field that duplicates one of theirs is a defect*), which is exactly why the absence of a **non**-duplicating field is a hole rather than an oversight. |
| `hyperparams.resume_from` | The **only** slot that accepts the string: `hyperparams` is `"additionalProperties": true`. Step 3 is what that costs. |

🔴 **BROKE (FT-R, high — structural).** §6 tells a consumer a checkpoint is *resumable* and §3 gives
it no way to say so. The failure is not cosmetic, because it lands on the one anchor KFT declared
load-bearing: **§5.2 fixes the reproducibility anchor as the run — "the `job` activity with its
pinned input ids, `seed`, and `config_hash"` (FT-C).** A resumed run has an input — the checkpoint —
that no field pins, so two runs with identical `job` manifest, identical `seed` and identical
`config_hash` produce **different models**. FT-C's anchor stops determining the run at precisely the
point resumption enters, and the manifest is no longer a description of what happened.

---

## Step 3 — The one slot that accepts it is the one nothing reads

The provider takes the only route available and puts
`hyperparams: { "resume_from": "orchestrator:asset:blake3-ck40…" }` in the manifest. It validates.

🔴 **BROKE (FT-S, high — the gate).** `hyperparams` is the field §3.2 and §9 hand to **engine
adapters**, and every normative reader in KFT is specified over the fields it is *not* in:

- **§4.2 does not read it.** The effective egress class is computed over "every knowledge record,
  every media asset, and every `dataset.records[]` file … **and the base-model entity's own egress
  class**." A checkpoint is none of the four. So the gate does not see it.
- **§4.3 does not read it.** The union license and trust tier are taken over the corpus and the
  base. Same omission.
- **§7 does not read it.** The admission-time estimate resolves dataset cardinality (FT-E/FT-P).
- **§5.2 does not record it.** `used[]` pins the corpus, the assets, and the base entity.

Then the front door opens. Consider the ordinary **continued pre-training** case: leg 2 resumes
`blake3-ck40…` but over a *new, `exportable`* corpus, and requests
`"compute": { "class": "single-gpu-a100-80gb" }`. §4.2 computes the effective class over
`{new corpus ∪ base_model}` — all `exportable` — and **admits the cloud placement**. The bytes
shipped to the rented GPU are a checkpoint of a `local-only` corpus: weights that memorized exactly
what §4.2 was protecting.

That is not a hypothetical reading of a permissive field. §5.4 opens with the reason it exists —
*"a model trained on `local-only` data can memorize it, and a published model would exfiltrate
exactly what §4.2 protected"* — and then scopes its inheritance to "**the finetuned model entity and
every weight/export asset it generates**." A mid-run checkpoint is generated by a run that has no
finetuned model yet (§5.2 mints one at completion), so **no clause assigns a checkpoint an egress
class or a license at all**. The same silence has a second edge that needs no resume to reach it:
§6's checkpoint id rides a **`subscribe` stream** (KCB §4) that any granted consumer may hold, and
§6's own tolerance rule — *"a `checkpoint` reference MAY arrive before its bytes propagate; consumers
tolerate the dangling ref and `fetch` lazily"* — is an instruction to `fetch` an artifact whose class
nothing states.

The hole §5.4 closes for the finished model is open for the whole duration of the run.

---

## Step 4 — Which activity is this? (§5.2)

Leg 2 has to be a PROV activity. Both available answers break something.

**(a) Reuse `orchestrator:activity:ft-run/7c3d`.** A KINP PROV activity is one occurrence with one
`agent`, one `used[]`, one `budget_units` / `spent_units` pair (§5.2). Leg 2 has a different
`used[]` (it gains the checkpoint), different spend, and — after a §4.2 re-check — possibly a
different placement. Reusing the id means **rewriting a closed provenance record**, and §6's
lifecycle is explicit that `failed` is terminal: `pending → running → succeeded | failed |
canceled`. There is no transition back into `running`, and KCB §4 has no verb that reopens a
completed A2A task.

**(b) Mint `orchestrator:activity:ft-run/7c3d-r1`.** Now one logical training is two activities, and
nothing links them. The lifecycle relations §5.2 names are `retrains` and `supersedes`, and
[`../registry/relations.tsv`](../registry/relations.tsv) defines `retrains` as *"a re-train over the
same pinned inputs mints a NEW model entity that retrains an earlier one"* — a **re-train from
scratch**, which is the opposite of what happened. `supersedes` replaces a prior claim; leg 2
replaces nothing, it **continues**. There is no `continues` / `resumes` relation in the registry, and
`registry/README.md`'s immutability rule means one cannot be improvised: a relation's signature is
permanent once published, so this is a registration decision, not an implementation detail.

🔴 **BROKE (FT-T, high).** Either the provenance record is mutated or the training is split into two
unlinked activities. Both defeat the question §5.2 exists to answer: *"what trained this model?"*
returns leg 2 alone — a 4,820-step run over a checkpoint of unstated origin — while the corpus,
seed, and 56% of the compute that actually produced the weights sit in a record with no edge
pointing at it.

---

## Step 5 — The telemetry stream collides with itself (§6)

Leg 2 restarts from the step-4,000 checkpoint, so steps **4,001–4,180 are re-executed** — the work
between the last checkpoint and the crash is always redone, and the redone steps produce *different*
metric values (different data order, different optimizer state trajectory).

§6's guarantee is one sentence: *"Events are idempotent under redelivery (content-addressed
job+step), so the stream needs no exactly-once guarantee (KCB §4)."*

🔴 **BROKE (FT-U, high).** Under Step 4's answer (a), leg 2 emits `(job 7c3d, step 4100,
train_loss 0.88)` where `(job 7c3d, step 4100, train_loss 0.93)` was already delivered. The key is
identical and the payload is not, so a consumer deduplicating on `job+step` — which is what §6 told
it to do — either **drops** the new event and keeps a metric from a leg that was discarded, or
**accepts** it and violates the idempotency it was promised. It cannot tell which is authoritative:
`ts` is wall-clock and orders the *events*, not the *legs*, and no field distinguishes an attempt.
The content-addressing that made exactly-once unnecessary is precisely what fails here.

Under answer (b) the collision disappears and a worse one replaces it: two streams for one training
curve, `1…4,180` and `4,001…9,000`, overlapping by 180 steps, with nothing in the contract saying
they are the same curve or how to join them. A release gate reading "final `eval_loss` at step
9,000" cannot know that steps 1–4,000 of that model's history are on another stream.

---

## Step 6 — The budget prices work that will not be done (§7)

Leg 2 goes to admission. FT-E's rule: the provider computes a per-job estimate **after resolving
dataset cardinality** and checks *that* against the ceiling.

🔴 **BROKE (FT-V, med).** Cardinality is unchanged — 182,400 records — and `epochs` is unchanged, so
the resolved estimate is **1,760,000** again: the full 9,000 steps. There is no field for *work
already done*, so the estimate cannot net out the 4,000 completed steps, and the two available
outcomes are both wrong:

- **Against the remaining ceiling** (788,000 units), the job is refused. Under §8.1 the grade is
  `over-budget` and the guidance is to carry `route_to[]` — but no provider can do it cheaper,
  because the excess is not a property of any provider. It is the manifest's inability to say
  *resume*. An empty `route_to[]` is the truthful answer (§8.1 permits it), which makes this a
  correct-by-the-letter refusal that makes resumption **impossible under any ceiling fitted to the
  job**. The tighter the grant, the more certainly it forbids finishing the work it authorized.
- **Against a freshly re-issued full ceiling**, one training is authorized twice — 3,560,000 units
  granted for 1,760,000 units of work — and §7's "hard admission gate" no longer bounds the total
  spend of a run. Every preemption re-authorizes the whole job.

Note what is *not* broken: §8.1's vocabulary has the right code and the right honesty about
`route_to[]`. The refusal is well-formed. The estimate feeding it is the defect.

---

## Step 7 — What held

Three things this leg tried to break and could not, worth recording so the fold stays narrow:

✅ **The gate's behaviour.** Everywhere §4.2 is actually *fed* the facts, it does the right thing —
Step 1's transitive inheritance, and the leg's own opening placement. As in the third pass, every
finding here is about making a fact **expressible**, not about what the gate does with it.

✅ **Artifact typing and lineage.** A checkpoint is unambiguously a KMI asset under §5.3 — large
bytes, byte-hash id, `application/vnd.koine.model+safetensors`, `media:derived_from` the base
weights. The `media:` relations already registered carry it. **No new artifact kind, no new media
type, and no new plane is needed** — which is why FT-R is a missing *reference*, not a missing model.

✅ **The KCB surface.** Nothing here needs a new verb, a new port, or a grant change. Leg 2 is an
ordinary `invoke` under the same `invoke:finetune` grant against the same capability version; the
`fetch:asset` grant already reaches the checkpoint bytes.

🟡 **One cleanup falls out of Step 3.** §3.3.1 requires a converter to classify **every** §3 field
with one of three dispositions and *"MUST NOT leave a field unclassified"*, and §3.3.2's matrix rows
cover `hyperparams.{epochs,lr,max_seq_len}` and `hyperparams.lora.*` only. A `hyperparams.resume_from`
has no row and therefore no disposition — while §3.3's own gating test (*"or if changing it changes
what the run is"*) is met by it beyond argument. A converter is required to classify a field the
spec never classified, and the safe reading (refuse) and the convenient reading (drop, silently
restarting a half-finished training) are both defensible from the text. Recorded against FT-R rather
than as its own delta: a resume ref with a real home in §3 gets a real row in §3.3.2, and this
disappears.

---

## Findings — required spec deltas

| # | Severity | Gap | Forced question | Spec |
|---|---|---|---|---|
| **FT-R** | **High (structural)** | §6 calls a checkpoint *resumable* and §3 has no slot that can name one: `base_model` is an entity not an asset, `dataset.*` admits it as corpus, and the schema is `additionalProperties: false`. FT-C's reproducibility anchor therefore stops determining the run — same `job`+`seed`+`config_hash`, different model. | Does the job manifest carry a **resume checkpoint ref**, and as what? | KFT §3 (+ §3.3.2 row), [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) |
| **FT-S** | **High (gate)** | The only slot that accepts the ref today (`hyperparams`, permissive) is read by no normative clause — §4.2, §4.3, §7 and §5.2 are all specified over fields it is not in. And §5.4's inheritance is scoped to the *finetuned model and its generated assets*, so a **mid-run checkpoint carries no egress class or license at all**, on a `subscribe` stream §6 instructs consumers to `fetch` from. | Is a resume ref an **admission input** — does the checkpoint's inherited class join §4.2's aggregate, and does §5.4 bind mid-run checkpoints? | KFT §4.2/§4.3/§5.4/§6 |
| **FT-T** | **High** | A resumed leg can neither reuse the first activity's id (mutating a closed PROV record; `failed` is terminal in §6's lifecycle) nor mint a fresh one (no `continues` / `resumes` relation exists, and `retrains` means re-train-from-scratch). "What trained this model?" becomes unanswerable. | Is a resumed run the **same activity or a new one**, and what relation links the legs? | KFT §5.2/§6, [`../registry/relations.tsv`](../registry/relations.tsv) |
| **FT-U** | **High** | Re-executed steps between the last checkpoint and the crash re-emit the same `job+step` key with different metrics, breaking §6's stated idempotency; minting a new `job` instead yields two overlapping streams for one curve with no join rule. | How does the telemetry stream **identify an attempt**? | KFT §6 |
| **FT-V** | Med | FT-E's estimate resolves cardinality and prices the full run, with no field for work already done: either the resume is refused `over-budget` for work it will not do (with a truthfully empty `route_to[]`), or a re-issued ceiling authorizes one training twice. | Does the admission estimate **net out completed steps**, and against which ceiling? | KFT §7 (§8.1 unchanged) |

**Blocking: FT-R, FT-S.** Without FT-R, §6's *resumable* is a promise no clause backs and the FT-C
anchor is conditional on a run never being interrupted; without FT-S, the workaround that makes
resumption possible today is a §4.2 breach reachable through the front door. **Should-fix: FT-T,
FT-U** — both are lineage/observability correctness on a surface that already exists. **FT-V** is a
correctness fix to an estimate, not a new gate.

**None requires redesign.** Every delta is an additive field or an additive clause on a shape that
is already there, and Step 7 records why: the artifact is already a KMI asset, the transport and
grants already reach it, and the gate already behaves correctly on the facts it is given.

---

## Only §11.3 is forced

This leg exercised a **single-accelerator**, single-provider, text-generation `qlora` run on purpose,
so that what it forces is unambiguous. It says nothing about the other open questions, and none of
them is carried into a fold:

- **§11.1 — adapter-selection hint.** The leg never chose an engine or expressed a preference about
  one; `provider:org:local-trainer` picked its own backend from `modality` + `method` throughout,
  exactly as §9 intends. Untouched.
- **§11.2 — multi-node / distributed runs.** The run is single-accelerator by construction. It
  produced **one** checkpoint asset per step, not a sharded set, and `cost` was metered in
  `gpu-seconds` against one device. The sharded-checkpoint and cross-GPU metering questions are
  neither asked nor answered here. Untouched.
- **§11.4 — eval-as-reward coupling.** `eval[]` is absent from both legs; no KCS scenario was run as
  a reward signal or as a release gate. Untouched.
- **§11.6 — one enum, two axes.** `method: qlora` pins both axes coherently and the leg never
  converts the job to a target that separates them. Untouched.
- **§11.5 — capability versioning.** Already **resolved** (2026-08-13) by
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) / KCB §7; both legs run
  against one capability version, so nothing here reopens it.

**What a fold must answer.** FT-R…FT-V are five faces of one contract question: *§6 asserts a
checkpoint is resumable, and §3 cannot say so.* The answer has to name the ref (FT-R), decide
whether the gate reads it (FT-S), decide whether resuming is one activity or two (FT-T), let the
stream distinguish an attempt (FT-U), and let the estimate price the remainder (FT-V). It must stay
**additive** on KFT's own precedent — every 0.4.0 and 0.5.0 manifest stays conformant, `method` and
`modality` do not move, and §4's admission behaviour changes only where FT-S deliberately widens the
aggregate. Anything larger is out of scope for what this leg found.

---

## Fold — KFT 0.6.0

All five findings were folded on **2026-08-26**, additively, into
[`../specs/fine-tuning.md`](../specs/fine-tuning.md) **0.6.0** (still *Candidate*). §11.3 is marked
**resolved in place** — the numbering is not shifted, so every existing §11.x reference still
resolves — and §11.1, §11.2, §11.4 and §11.6 stay open exactly as the section above left them.

| Finding | Answered by |
|---|---|
| **FT-R** — no slot names a checkpoint | New NORMATIVE **§3.4**: the optional top-level `resume` object `{checkpoint, of_job, at_step}`, plus the rule that `used[]` carries the ref so FT-C's anchor keeps determining the run. Schema in lockstep — `resume` is `additionalProperties: false`, and a manifest without it is a cold run that validates unchanged. |
| **FT-S** — the permissive slot no gate reads, and the unclassified mid-run checkpoint | **§3.4** refuses a resume ref carried in `hyperparams` (`invalid`, §8.1) instead of executing it; **§4.2** takes the effective egress class over `{data ∪ base ∪ resume.checkpoint}` and **§4.3** puts it in the union license/tier; **§5.4** binds a checkpoint's class **at publication** rather than at completion, which closes the `subscribe`-stream half that needed no resume to reach. |
| **FT-T** — activity identity | **§5.2**: a continuation leg MUST mint a new activity (a closed PROV record is never rewritten) linked by the new core relation **`continues`** in [`../registry/relations.tsv`](../registry/relations.tsv), distinct from `retrains` and `supersedes`. "What trained this model?" is answered by walking the chain to its root, which MUST stay resolvable. |
| **FT-U** — the stream collides with itself | **§6**: distinct legs carry distinct `job` ids so `job+step` idempotency is sound and unweakened; `step` counts from the root leg, so legs overlap deliberately; the NORMATIVE **join rule** orders legs by the `continues` chain and takes the later leg as authoritative on an overlapping range; an optional non-authoritative `attempt` ordinal rides the event. |
| **FT-V** — the estimate prices work that will not be done | **§7**: a continuation leg is estimated on the **remainder**, with `at_step` verified against the prior leg's provenance rather than trusted, and checked against the ceiling **net of cumulative `spent_units` across the `continues` chain** — so one training is neither authorized twice nor refused `over-budget` for work it will not do. §8.1's vocabulary is unchanged, as Step 6 said it should be. |

Portability followed in lockstep: `resume.checkpoint` joins §3.3.1's gating set, and §3.3.2 gains two
rows plus a fifth normative consequence — a resume ref converts to a local **path**, so the KINP id,
`of_job` and `at_step` go out of band, and a target with no resume surface is **refused** rather than
silently handed a cold run. Step 7's *what held* is intact: no new plane, no new artifact kind, no new
media type, no KCB verb/port/grant change.

**This leg is now a gate.** Because it was written against 0.5.0, a re-run against the folded text is
what closes it: Steps 2–6 must walk clean where they broke, and Steps 1 and 7 must stay held. That
gate is **additional to** the outstanding re-run of
[`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md)'s *Re-validation — KFT 0.4.0*,
which 0.6.0 restates and does not move — a **cold** job (no `resume`) is admitted and refused on
exactly the inputs it was before.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**This scenario has never been run downstream, and has no encoding.** Recorded as a statement
rather than left blank, because a blank section is indistinguishable from an unread one.

| | |
|---|---|
| Encoding | **none.** `agora/console/src/kcs/scenarios/` holds nine `KOINE_SCENARIOS` entries and none has `source: 'scenarios/kft-resume-checkpoint.md'` |
| Runs | **none.** The committed evidence artifact (`sha256-2d9e6c43…c17bb3`, generated 2026-08-24) contains nine scenarios and this is not one of them |
| Why | This document landed with `chief/69` on **2026-08-26**, a week after the nine encodings were built (`agora chief/75`, merged 2026-08-19) |

**The gap has a red light, and it is downstream.** `coverage.test.ts` asserts set-equality between
`KOINE_SCENARIOS` and this directory's `*.md`, so against a koine checkout at this commit that gate
goes **red** and the failure names this file. That is the gate working as designed — a partial
encoding cannot go green quietly — and it is the only place the obligation is enforced: koine's own
`.chief/verify.sh` checks links, status mirrors, schemas and the registry, and has nothing that
could notice. Adding a file to `scenarios/` is a cross-repo obligation with no local red light.

The full verification, with the merges and the artifacts it was read off, is
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.1; it is not restated here.

### Findings — from the absence of a downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-11 | **Blocking** (for KFT alone) | The KFT 0.6.0 fold this leg forced — §3.4's `resume {checkpoint, of_job, at_step}`, §4.2's effective egress over `{data ∪ base ∪ resume.checkpoint}`, §4.3's union license/tier, §5.4's bind-at-publication, §5.2's `continues` relation, §6's curve-join rule, §7's remainder net of cumulative `spent_units` — has **no machine-replayable document citing any of it**, and neither does FT-R…FT-V. | [The ratification gate](../specs/README.md#the-ratification-gate) forbids promoting a spec whose scenario has no KCS encoding, so **KFT loses the artefact gate** on this count. This is on top of, not instead of, KFT's two named re-run gates. Four of the other five specs are unaffected — their scenarios are all encoded; the exception is **KCB**, which took the same finding on the same day for [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md#findings-from-the-absence-of-a-downstream-run) (**DR-12**), narrowly and for its §4.2 count alone. Building the encoding is downstream runtime work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned** as of 2026-08-26. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands); neither applies to a
scenario that was never run.
