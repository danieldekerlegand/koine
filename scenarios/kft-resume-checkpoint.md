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

> **CORRECTED 2026-09-03.** What follows replaced a statement that this scenario *"has never been
> run downstream, and has no encoding."* That was true when written on 2026-08-26 and was **overtaken
> the same afternoon**; koine did not learn for a week. The old text is not preserved here because
> this is the section a ratification gate reads for evidence, and a superseded artifact address is
> not evidence. The correction itself is written up at
> [`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
> §6.0 and §6.4, where the old reading is left standing.

| | |
|---|---|
| Encoding | **`console/src/kcs/scenarios/resume-checkpoint.ts`**, registered in `index.ts` with `source: 'scenarios/kft-resume-checkpoint.md'` and `gates: 'KFT §3.4 (fourth pass)'`. It encodes this leg's **seven steps against the folded 0.6.0 text**, and names in its own module notes the three properties it leaves **unasserted** for want of a KCS §5 predicate: FT-T's `continues` edge, FT-U's curve-join rule, and FT-V's chain-cumulative ceiling arithmetic |
| Run | `kcs:resume-checkpoint` — **`green: true`**, `live_pass: false`, verdict **`partial-live`**, 2 of 4 participants live (`orchestrator:agent:host`, `refkb:agent:resolver`), the specialist trainer and the store answering from delta-N `standin` fixtures, no transport failures |
| Artifact | `sha256-eb8fdc9ce041162db78ef80df42998e25793dc6a20e7ac8974f77d7615236dd5`, generated **2026-08-26T17:26:10.420Z**, twelve scenarios, 26 of 44 slots live (59%), suite verdict `partial-live`, `kcs_version 0.3.0` |
| Landed | `agora` **`378fd3c`**, 2026-08-26 12:30:18 — the same commit encoded all three of koine's then-unencoded legs **and regenerated the artifact**. Verified by running both gates at `agora` `main` = **`c971fc2`** on 2026-09-03 |

**What this result is worth, and what it is not.** `green` here means *the encoded assertions held*
over a cast that is half live. It does **not** mean this leg's gate is met: the re-run below was
hand-walked on the same day and came back **not clean**, on two deltas (**FT-X**, **FT-Y**) that are
**perimeter** breaks — reachable only by reading KMI §2 and KCB §4.2 beside KFT §4, and so outside
anything this or any KFT-scoped encoding asserts. That is **DR-7**/**DR-8**'s hazard reaching a third
spec, and the rule is unchanged: a green encoding is evidence for what it encodes.

**The obligation still has no red light in this repo, and that is the durable lesson.**
`coverage.test.ts` enforces set-equality between `KOINE_SCENARIOS` and this directory's `*.md`
downstream; koine's own `.chief/verify.sh` checks links, status mirrors, schemas and the registry and
has nothing that could notice — in **either** direction. It did not notice this file arriving without
an encoding, and it did not notice the encoding arriving either. Adding a file to `scenarios/` is a
cross-repo obligation with no local red light; so is being told one was discharged.

### Findings — from the absence of a downstream run

**DR-11 is CLOSED, on 2026-08-26, and koine learned on 2026-09-02.** The row below is left standing
as written because it is the finding of record and its *reasoning* is intact — what changed is the
world, not the argument. Read it as history, and read the closure beside it:
`console/src/kcs/scenarios/resume-checkpoint.ts` landed at `agora` `378fd3c` **forty-nine minutes
after** the koine document that recorded this gap was last written, and was verified by running the
gate at `agora` `main` = `c971fc2` on 2026-09-03
([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.4). **KFT does not lose the artefact gate on this count.** It is also not promoted by that: both
of its counts were walked on 2026-09-03 and neither closed.

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-11 | ~~Blocking~~ → **CLOSED 2026-08-26** (for KFT alone) | The KFT 0.6.0 fold this leg forced — §3.4's `resume {checkpoint, of_job, at_step}`, §4.2's effective egress over `{data ∪ base ∪ resume.checkpoint}`, §4.3's union license/tier, §5.4's bind-at-publication, §5.2's `continues` relation, §6's curve-join rule, §7's remainder net of cumulative `spent_units` — has **no machine-replayable document citing any of it**, and neither does FT-R…FT-V. | [The ratification gate](../specs/README.md#the-ratification-gate) forbids promoting a spec whose scenario has no KCS encoding, so **KFT loses the artefact gate** on this count. This is on top of, not instead of, KFT's two named re-run gates. Four of the other five specs are unaffected — their scenarios are all encoded; the exception is **KCB**, which took the same finding on the same day for [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md#findings-from-the-absence-of-a-downstream-run) (**DR-12**), narrowly and for its §4.2 count alone, and again the same day for
[`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md#findings-from-the-absence-of-a-downstream-run)
(**DR-13**), for its §4.3 count alone. Building the encoding is downstream runtime work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned** as of 2026-08-26. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands); neither applies to a
scenario that was never run.

---

## Re-run — the FT-R…FT-V resumption fold walked against KFT 0.7.0 (2026-09-03)

**What this section is.** KFT's second gate, added by 0.6.0:
*"a re-run of [this leg] against the folded text: the leg was written against 0.5.0 and each of its
five findings is now answered by normative clauses, so what it walked as breaks (its Steps 2–6) it
must walk clean, and its Step 1 and Step 7 what held sections must stay held"*
([`../specs/fine-tuning.md`](../specs/fine-tuning.md) *Pressure test*). This section is that re-run.
It is **six sections read cold**, not a re-read of walked text, and the gate says why: unlike
0.5.0's fold, 0.6.0 **moves §4's admission inputs** for a `resume`-carrying job, so §3.4, §4.2,
§4.3, §5.4, §6 and §7 are *changed* normative surface. Each gets its own verdict below.

**Which half is a replay and which is a hand-walk.** Stated per delta, the
[`kcs-format-stress.md`](kcs-format-stress.md) / [`e2e-multi-authority.md`](e2e-multi-authority.md)
discipline, because mixing them silently is **DR-7**/**DR-8**'s failure:

| Evidence | Covers | Why |
|---|---|---|
| **Replay** | **nothing asserted below rests on it** | *Corrected 2026-09-03 (same day, later): this row originally read "**nothing** — this leg has no KCS encoding (**DR-11**)", and that was **false when written**. `kcs:resume-checkpoint` exists, replays Steps 1–7 against the folded text, and came back **`green`** in the 2026-08-26 artifact (`## Downstream results` above). The verdict below does not move: the encoding asserts what koine **folded**, and both breaks this walk found are **perimeter** breaks in KMI §2 and KCB §4.2 that no KFT-scoped encoding reaches — plus it leaves FT-T's `continues` edge, FT-U's join rule and FT-V's chain arithmetic explicitly unasserted, which is three of the five deltas. So the replay corroborates the three flips and could not have produced FT-X or FT-Y. **DR-7/DR-8's rule, a third time: a green encoding is evidence for what it encodes.*** |
| **Hand-walk** — this section, against §2/§3/§3.3/§3.4/§4.2/§4.3/§5.2/§5.4/§6/§7 of KFT 0.7.0, the schema, `registry/relations.tsv`, and the **plane text those clauses cite today** | **FT-R…FT-V** in full, Steps 1 and 7 as the regression set | The fold is a composition point. Walking it against KFT alone would re-read the fold's own words back at itself, which is the failure the gate was left open to avoid. |

**The second axis, and it is where this pass found everything it found.** KFT 0.6.0 landed at
`49e63e6` on 2026-08-26. **Two plane folds landed later the same day**: KCB §4.2 subscription flow
control at `7c82abc`, and KMI 0.3.5's MA-5 — the `license`/`egress` pair on the §2 asset envelope —
at `7ee8da0`. Both reach clauses this fold wrote. One rescues a clause that was written against a
carrier that did not yet exist; the other opens a hole under one that did. Neither is visible from
inside KFT.

**Method.** The declared bias — *prefer finding breaks over asserting correctness*. Steps 1 and 7
are the regression set; Steps 2, 3, 4, 5 and 6 are the fold under test.

### Per-delta verdicts

| Delta | Step | §§ read | Verdict |
|---|---|---|---|
| **FT-R** — no slot names a checkpoint | 2 | **§3.4** + the schema | ✅ **Flips.** The slot exists, is typed, is required-trio, is `additionalProperties: false`, and closes the six-row table of Step 2 row by row. FT-C's anchor is restored by `used[]`. |
| **FT-S** — the permissive slot no gate reads; the unclassified mid-run checkpoint | 3 | **§4.2**, **§4.3**, **§5.4** | 🔴 **Half-flips.** The bypass is closed *twice over* and the continued-pre-training front door is shut. But §4.2/§4.3 read the checkpoint's class off a carrier that may be **silent**, and state no rule for that → new delta **FT-X**. |
| **FT-T** — activity identity | 4 | **§5.2** + `registry/relations.tsv` | ✅ **Flips.** `continues` is registered as a core binary relation with the right signature and the right disclaimers; both of Step 4's answers are now forbidden and a third is mandated. |
| **FT-U** — the stream collides with itself | 5 | **§6** | 🔴 **Half-flips.** The collision is gone and the join rule is the right rule. But the stream carrying §3.4's REQUIRED operands became **sheddable** hours after this fold, and no clause makes them durable → new delta **FT-Y**. |
| **FT-V** — the estimate prices work that will not be done | 6 | **§7** | ✅ **Flips** on substance — remainder, plus a ceiling net of the chain's cumulative `spent_units`. One caveat, not a second delta: §7's own MUST-verify names a source that does not carry the operand (**FT-Y**). |

### Section-by-section verdicts

The gate asks for these six by name. They are given here as sections rather than only as deltas,
because two of the six are read by more than one delta and one is read by none.

| § | What 0.6.0 put there | Verdict |
|---|---|---|
| **§3.4** | the `resume` object; four rules | ✅ **Clean.** |
| **§4.2** | `resume.checkpoint` joins the effective-egress aggregate | 🔴 **Open — FT-X.** Right operand, no absence rule, and the plane it reads from now states the **opposite** default. |
| **§4.3** | the checkpoint's license joins the union | 🔴 **Open — FT-X**, same cause, licence half. |
| **§5.4** | checkpoints inherit **at publication** | ✅ **Clean — and its carrier is real, which it was not when it was written.** |
| **§6** | new-`job`-per-leg, `step` from the root, the join rule, `attempt` | 🔴 **Open — FT-Y.** The rule is sound; the stream it rides is not durable. |
| **§7** | remainder estimate, chain-cumulative ceiling | ✅ **Clean on substance**, with FT-Y's caveat on its MUST-verify and one stale label. |

### Step 1 — warm start from a completed finetuned model ✅ *holds (regression)*

Unchanged and deliberately so. §3.4's own table separates the two cases and puts warm start on
`base_model` with the note that it *"needs no new surface and none is added"* — which is what Step 1
concluded. `base_model` stays REQUIRED in both shapes, so a resumed warm start simply carries both
fields and neither displaces the other.

The three compositions Step 1 checked are byte-unchanged: §5.1's `model`-entity typing, §5.4's
transitive most-restrictive inheritance over `{training data ∪ base model}`, and §5.1.1's
*omit, never invent* publication rule. Nothing in the 0.6.0 or 0.7.0 folds edits them. **§11.3's
first clause stays confirmed.**

### Step 2 — the slot ✅ *flips*

Step 2's table tried six slots and every one failed. Walked against 0.7.0 as published, every row is
now answered by name rather than by analogy:

| Step 2's failing slot | What §3.4 does with it |
|---|---|
| `base_model` (type error) | §3.4's table keeps `base_model` for a *released* model and gives the *mid-run* checkpoint its own field. The fabricate-a-model-entity-per-checkpoint failure mode is not merely avoided, it is forbidden — §5.2 still mints a model only at completion. |
| `dataset.media[]` (admitted as corpus) | *"A checkpoint is never corpus"* — `resume.checkpoint` **MUST NOT** appear in `dataset.{knowledge,media,records}[]`, with the distinction stated exactly as Step 2 stated it: it **gates** (§4.2 reads it) without being **counted** (§7 does not price it as samples). |
| `dataset.records[]` (fabricated header) | Same rule; the FT-N fabrication trap is not reachable from here. |
| `export[]` (wrong direction) | Untouched; `resume` is an input reference, sitting beside the two §3 intakes as §3's preamble now says. |
| a new top-level field (not schema-valid) | It is schema-valid now. [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) carries `properties.resume` with `checkpoint` · `of_job` · `at_step` all REQUIRED, `additionalProperties: false` inside the object, KINP-id `$ref`s on the two ids, and `at_step` an `integer, minimum 0`. **`resume` is not in the top-level `required` array** — verified: `["kft_version","job","base_model","modality","method","dataset","compute"]` — so a cold manifest still validates. |
| `hyperparams.resume_from` (accepted, unread) | Now the one route that is **explicitly refused**: a resume ref carried anywhere else in the manifest is *not* a resume ref, and the provider **MUST refuse the job** `invalid` (§8.1) rather than execute it. |

**FT-C's anchor is restored, and by the mechanism Step 2 said was missing.** §3.4's first rule puts
`resume.checkpoint` in §5.2's `used[]` and restates the anchor as *"the `job` activity with its
pinned input ids — the resume ref among them — `seed`, and `config_hash`."* Two legs agreeing on
manifest shape, `seed` and `config_hash` but resuming different checkpoints now differ in `used[]`,
so they are different runs by the anchor's own definition. Step 2's break does not reproduce.

### Step 3 — the gate 🔴 *half-flips* → new delta **FT-X**

**The bypass is closed twice, which is more than the delta asked for.** Step 3's failure was that
the only slot accepting the ref was read by no clause. That is now false in both directions: §3.4
forbids the slot, and §4.2/§4.3/§5.2/§7 all read the field that replaced it. The continued
pre-training front door — leg 2 over a fresh `exportable` corpus requesting cloud compute — is shut
by §4.2's aggregate over `{training data ∪ base model ∪ resume.checkpoint}`, and §4.2 spells out the
exact case Step 3 built. §4.3 closes the licence twin: *"a continuation leg that lists only a
permissively-licensed new corpus does not launder the restriction the leg it continues acquired."*

**And Step 3's second edge — the unclassified mid-run checkpoint — is closed properly.** §5.4's
bind-at-publication bullet answers it without needing a resume at all, which is what Step 3 said the
right fix would look like: *"There is no window during which a checkpoint of a `local-only` run is
unclassified, and the rule holds whether or not the run is ever resumed."* The `subscribe`-stream
half is closed too — publishing the id is not widening the class, the reference is an **address**,
and the envelope governs the `fetch`.

**§5.4's carrier did not exist when §5.4 was written, and now it does.** §5.4 requires a checkpoint
to carry its class *"on its KMI envelope."* At `49e63e6` the KMI §2 envelope had **no** `license`
and **no** `egress` field — that pair is MA-5, and it landed later the same day at `7ee8da0`. Read
against the KMI text of the hour §5.4 was published, the clause named a slot that was not there;
read against KMI 0.3.5 it is operable, and KMI §7.1(d)'s narrow carve-out (*the governing policy is
the single thing permitted to accompany replicated bytes, because it is carried and never
synthesized*) plus §7.1(e)'s `local-only`-never-crosses rule compose with §5.4's replication ban
exactly. **Recorded as a fact, not a delta** — the near-miss landed on the right side, and this is
the only place either spec says so.

🔴 **BROKE (FT-X, high — gate integrity).** The carrier exists; the rule for its **silence** does
not. §4.2 says *"a checkpoint carries the class §5.4 bound to it when it was published"* — an
assertion of fact, not a rule the gate can execute when the fact is absent. Three ordinary ways it
is absent, none exotic:

1. **The migration case, and it is the sharp one.** KFT's own additivity promise is that *"every
   0.5.0 manifest stays conformant."* A run started under 0.5.0 published checkpoints under a spec
   with no bind-at-publication rule; §5.4 is days old. Resuming that run under 0.6.0 — precisely the
   interruption §3.4 exists for — hands the gate a checkpoint with no class.
2. **The replication case.** KMI §7.1(d) lets a store hold bytes it received **without** the
   envelope, and forbids it to synthesize one. §7.1(e) then bars serving those bytes onward *across
   an authority-domain boundary* — but explicitly permits serving them **inside** the domain. So a
   resuming provider in the same domain can lawfully hold a checkpoint with no policy.
3. A publisher that is foreign, older, or simply non-conformant.

**And the two planes now state opposite defaults inside one computation.** §4.2's only stated
absence rule is the record-file one — *"a record file whose header omits `egress` takes KGP §7.2's
`exportable` default"* — which is **fail-open**, and it sits three bullets from the resume bullet as
the nearest available reading. KMI §2 says, of the same pair on the same envelope, *"Both are
optional, and **absent is not `exportable`**"*, and §7.1(e) **fails closed** on it. §4.2 does not say
which governs the resume operand.

Concretely: leg 1 trains `local-only` in domain **D** and publishes `ck40`. Provider **B**, also in
**D**, holds a replicated copy of the bytes without the envelope (§7.1(d)). Leg 2 goes to B with
`resume.checkpoint: ck40`, a fresh all-`exportable` corpus, and `compute.class:
single-gpu-a100-80gb`. B computes §4.2's aggregate; corpus and base are `exportable`; the checkpoint
has no class; the nearest stated default admits it. **The cross-boundary placement of weights that
memorized a `local-only` corpus is re-admitted — the exact breach FT-S was folded to close, reached
through the carrier instead of through the slot.** KMI cannot catch it: §7.1(e) governs whether
bytes cross a *domain* boundary, and B is inside the domain; what crosses here is the *compute
placement*, which is KFT §4.2's gate and nobody else's. §4.3 has the same hole on the licence side,
where a silent envelope makes the union unresolvable rather than permissive.

**FT-X is FT-W's shape, and it is not FT-W.** [`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md)'s
re-run found the same plane fold under `dataset.records[]`, but that is a **two-carrier ranking**
problem (header vs envelope, which may disagree). This is a **one-carrier absence** problem, and
FT-W's proposed fix — rank the carriers, most restrictive wins — does not reach it, because
`resume.checkpoint` has no second carrier to rank against. They land in the same clause and should
be folded in one edit; they are not the same delta.

### Step 4 — activity identity ✅ *flips*

Both of Step 4's answers are now forbidden and the third is mandated. §5.2: a resumed run **MUST**
mint a new `job` activity and **MUST NOT** reuse or amend the record of the leg it continues — so
(a)'s rewrite of a closed PROV record is out, with §5.2 restating Step 4's own reason (one
occurrence, one `agent`, one `used[]`, one `budget_units`/`spent_units` pair, and no §6 transition
back into `running`). (b)'s *two unlinked activities* is out because the link now exists.

**`continues` is registered, and the registry row is right.** Verified in
[`../registry/relations.tsv`](../registry/relations.tsv):

```
continues	2	newer|older	false	grounding-only	core		Lifecycle: a resumed training leg continues the interrupted leg it picks up from (KFT §3.4/§5.2); never a re-train from scratch (retrains) and never a replacement (supersedes)
```

Binary, core, `newer|older` — the same signature shape as the `supersedes` and `retrains` rows it
sits beside, so `registry/README.md`'s immutability rule is satisfied by a **new name** rather than
by an edit in place, which is what Step 4 said the constraint required. The description carries the
two disclaimers by name.

Step 4's closing complaint — *"what trained this model?" returns leg 2 alone* — is answered
explicitly: the question is answered **over the chain, not over one leg**, the root is the leg with
no outgoing `continues`, each leg keeps its own `used[]`/`seed`/`config_hash`/`spent_units`, and a
model whose run resumed **MUST** leave that chain resolvable (an unresolvable `continues` target is
a broken lineage, the same defect as an unresolvable `used[]`). The bonus clause is the honest one:
resumption on a different provider, tier, or grant is **visible as such**.

### Step 5 — the telemetry stream 🔴 *half-flips* → new delta **FT-Y**

**Both of Step 5's failure modes are closed.** Answer (a)'s `job+step` collision cannot arise, because
§5.2 forbids reusing the id and §6 states the consequence: distinct legs carry distinct `job` ids, so
the key stays sound and the idempotency guarantee is *"unchanged and unweakened."* Answer (b)'s
*two streams, no join rule* is closed by a NORMATIVE join rule that does exactly what Step 5 asked
for — order legs by the `continues` chain, later leg authoritative on an overlapping range, with the
overlap **deliberate** because `step` counts from the root leg. `attempt` is present and correctly
graded: optional, 1-based, explicitly **not authoritative**, chain wins on disagreement, and a
consumer that never sees one loses nothing. Step 5's release-gate example is answered — a reader of
`eval_loss` at step 9,000 reaches steps 1–4,000 by walking the chain.

🔴 **BROKE (FT-Y, high — operand durability).** §3.4 makes `checkpoint`, `of_job` and `at_step` all
REQUIRED, and §7 makes verifying `at_step` a **MUST**. Walk backwards from that and ask where those
values live:

- **`of_job`** — known to the operator; fine.
- **`checkpoint` and `at_step`** — published on §6's telemetry event and **nowhere else**. §5.2's
  activity record carries `used[]`, `generated[]`, `seed`, `config_hash` and the budget pair;
  `generated[]` is written at completion (§5.2 mints the model when the run *completes*), and an
  **interrupted** leg never completes. No clause requires a leg to record the checkpoints it
  published. KMI §3 lineage reaches the checkpoint *asset* but carries no `step` and no leg.

So the operands of the fold live only on the stream — and **hours after this fold, KCB made that
stream sheddable.** KCB §4.2b (landed `7c82abc`, 2026-08-26) gives a subscriber `on_overflow: drop`
(lossy, must be named) and lets a producer apply `coalesce`/`defer` **unasked**, on the stated
ground that they are *"lossless for KGP payloads by construction — KGP §6 deltas are
ordering-independent and KGP §3 claim ids are content-addressed."* **A KFT telemetry event is not a
KGP payload.** It is a bespoke `{job, step, attempt, metrics, checkpoint, samples, ts}` shape whose
events are *not* interchangeable: coalescing a window merges distinct `step`s with distinct metrics,
and nothing fixes whether a merged frame keeps the `checkpoint` field of the events it absorbed.
KCB §4.2b's one non-sheddable class is a KGP `retracts`/`supersedes` delivery — **no KFT clause
names a checkpoint-bearing event as non-sheddable**, and none names a floor on how far back a resume
ref survives.

Three consequences, and the third is the one that makes this structural rather than operational:

1. A saturated subscriber under `drop`, or a producer coalescing on its own initiative, loses the
   step-4,000 checkpoint event. The operator resumes from step 3,200 instead: 800 steps of granted
   compute silently redone. §7 prices that **correctly** (the remainder nets from `at_step`), so no
   gate fires — it is a loss with no signal.
2. It is **unrecoverable from the stream**, because KCB §4.2c's resume operand is typed
   `resume: { after: "<KGP pack id>" }` — a content-addressed point in a KGP delta chain. A KFT
   telemetry stream has no KGP pack id, so §4.2c's operand has **no admissible value** here and the
   one mechanism KCB built for exactly this recovery does not reach KFT's stream. Nor could a
   subscriber have seen it coming: KFT §2's `finetune` manifest declares **no port for the telemetry
   stream at all** — only the model entity and the weights — so there is nothing to hang KCB §4.2a's
   `volume` or `resume_horizon` on, and §4.2a's *absent reads as unknown, never as low* is the most
   a consumer can learn.
3. **§7's MUST has no durable source.** §7 requires a provider to *"verify `at_step` against the
   prior leg's provenance (§5.2) and telemetry (§6) rather than trusting the manifest."* §5.2 does
   not carry it; §6 is ephemeral and now expressly sheddable. A normative MUST whose two named
   sources are *absent* and *lossy* is not verifiable, and the failure is silent — a provider that
   cannot verify has no stated refusal to fall back to.

**What the fold is.** Additive, one spec, no KCB change required: **§5.2** — a leg's provenance
record MUST carry the id and `step` of the last checkpoint it published, including for a leg that
terminates `failed`, which gives §3.4's operands a durable home and §7's MUST-verify something that
is actually there; and **§6** — a checkpoint-bearing telemetry event is not sheddable under KCB
§4.2b's `on_overflow: drop`, and a coalescing window MUST NOT drop a `checkpoint` field, because the
KGP-payload losslessness argument does not transfer to a telemetry event. Declaring the stream as a
§2 port so it can carry a `volume` is an **available** third piece, not a required one; the fold
should say which it takes rather than leave it read out of KCB.

**One name collision, recorded and not a delta.** `resume` now names two different things a single
training run uses at once: KFT §3.4's manifest object (which checkpoint to train from) and KCB
§4.2c's `subscribe` operand (where to pick the stream up). Different planes, different carriers,
neither redefining the other, so koine's define-once rule is not breached — but an implementer holds
both on one run, and no document says they are unrelated. Worth one sentence wherever FT-Y lands.

### Step 6 — the budget ✅ *flips*

Step 6's estimate defect is fixed and both of its wrong outcomes are named and excluded. §7: a
continuation leg **MUST** be estimated on the **remaining** work — the resolved total less the work
completed at `resume.at_step` — and its estimate is checked against the ceiling **net of the
cumulative `spent_units` of every leg in its §5.2 `continues` chain.**

- Against Step 6's *fresh full ceiling*: §7 states the failure in Step 6's own terms — one training
  authorized twice, every preemption re-authorizing it — and forbids it.
- Against Step 6's *remaining ceiling with a whole-run estimate*: also stated and forbidden, with
  Step 6's own observation about the truthfully empty `route_to[]` preserved.
- The residual case is handled honestly rather than optimized away: a leg whose **remainder**
  genuinely exceeds the remaining ceiling is still refused `over-budget`, *"unchanged; that refusal
  is now about the work left, which is what the ceiling was granted against."*

Step 6's *what is not broken* holds: §8.1's vocabulary is untouched, exactly as Step 6 said it
should be.

Two things checked and clear, recorded so the fold stays narrow. **§7 does not double-count the
telemetry subscription.** KCB §4.2e lets a port's `volume.cost` decrement a grant's `budget_units`
**on delivery**, which would be alarming if a training run's telemetry ate its training ceiling —
but §7's ceiling rides the `invoke:finetune` grant, a `subscribe` binds under its own grant and
scope, and KFT §2 declares no telemetry port to carry a `volume.cost` in the first place. No
interaction. **And FT-Y does not become a budget break**: the remainder is priced from `at_step`,
whatever `at_step` turns out to be, so a stale resume point costs redone work rather than an
unbounded spend.

**One stale label, already on the record.** §7's grant paragraph is headed *"What the grant is
scoped to (KCB 0.4.x)"* and KCB is **0.5.0**, whose **V-5** added an `invoke` `version` operand under
an exhaustive operand-else-grant-else-**refuse** rule. The paragraph's substance survives — the
grant name is unchanged and `(capability, major)` binding is unchanged — so this changes no verdict
here. It is the dependency-pin precondition the FT-M…FT-Q re-run already recorded against the
`Depends on:` header, restated rather than re-found.

### Step 7 — what held ✅ *stays held*

All three of Step 7's *held* items survive the fold, which is the constraint 0.6.0 accepted:

- **The gate's behaviour.** Still true, and it is the sentence this whole re-run turns on: every
  finding here is about making a fact **expressible**, not about what the gate does with it. FT-X is
  the fact *going missing*, not the gate misreading it.
- **Artifact typing and lineage.** §3.4 states it directly — a checkpoint is a KMI asset under §5.3,
  *"no new artifact kind, media type, or plane is introduced here."* Verified against
  [`../registry/media-types.tsv`](../registry/media-types.tsv): no row was added for 0.6.0.
- **The KCB surface.** No new verb, port, or grant change. §3.4 uses `fetch:asset`, and §7's grant is
  the same `invoke:finetune`. **One qualification found by this walk**: `continues` *is* a new
  `registry/relations.tsv` row. That is a registry vocabulary addition, not a plane/verb/kind
  addition, and Step 4 anticipated it as *"a registration decision" —* so Step 7 holds as written,
  and the fold's own claim of *no new plane, artifact kind, media type, or KCB verb* is exact rather
  than approximate.

🟡 **Step 7's cleanup ✅ flips.** §3.3.1's gating set now names *"the **resume ref**
`resume.checkpoint` (§3.4 — §4.2 reads it, and it fixes what the run continues from)"* by name, and
§3.3.2 carries the two rows Step 7 said would make the problem disappear: `resume.checkpoint` maps to
a local checkpoint path on each target that can resume and is **REFUSE — gating** on OpenAI FT
(whose `model` is warm start, not resumption), and `resume.{of_job,at_step}` is **out of band** on
every target. The fifth normative consequence is there too: a target with **no** resume surface MUST
be refused, never handed a cold run. `hyperparams.resume_from` is no longer an unclassified field,
because §3.4 makes it not a resume ref at all.

### The cold-job path — confirmed unchanged where it matters, and stated precisely where it is not

This is the claim that keeps gate (i) independent of gate (ii), so it is walked rather than
inherited.

**§4 admission is byte-unchanged for a cold job.** Verified clause by clause, not by reading §3.4's
summary: §3.4's `resume` object is optional and absent from the schema's top-level `required`;
§4.2's resume bullet opens *"Where the job carries `resume`"*; §4.3's opens the same way; §7's
remainder bullet opens the same way. A manifest with no `resume` is therefore fed exactly the input
set it was fed at 0.5.0 — corpus plus base — and refused on exactly the same grounds. **US-1's
premise holds**: gate (i)'s FT-M…FT-Q walk is over §4's admission path, and nothing 0.6.0 did
reaches it.

**Two 0.6.0 clauses do bind a cold run, and §3.4 slightly overstates when it says otherwise.**
§3.4 reads *"Absent ⇒ the job is a cold run and every clause below is inert"* — true of the four
rules *below it in §3.4*, and not true of the whole fold:

- **§5.4's bind-at-publication** binds a cold run, and says so on purpose: *"the rule holds whether
  or not the run is ever resumed."* That was the right call — it closes the `subscribe`-stream half
  of FT-S, which needed no resume to reach.
- **§6's join rule and `attempt`** are inert for a single-leg run in effect, but a cold run's
  producer must now emit a `job` id it will not reuse if it is later continued.

Both are **output-side**, downstream of admission, and both are additive. So the honest statement is
narrower than §3.4's and stronger where it counts: **0.6.0 changed no admission input for a cold
job; it added one publication obligation.** Gate (i) is unaffected either way.

### Findings — from the re-run

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **FT-X** | **High (gate integrity)** | §4.2 reads the checkpoint's egress class and §4.3 its license off the KMI §2 envelope, but states **no rule for a silent one** — reachable three ordinary ways, of which the sharpest is resuming a run started under 0.5.0, before §5.4's bind-at-publication existed. The two planes now state **opposite** absence defaults for the same field on the same envelope (§4.2's nearest stated default is KGP §7.2's `exportable`, fail-open; KMI §2 says *absent is not `exportable`* and §7.1(e) fails closed), so the FT-S breach returns through the carrier: an unclassified checkpoint of a `local-only` corpus is admitted to cross-boundary compute by a provider inside the originating domain, where KMI §7.1(e) cannot see it. | State the absence rule in §4.2/§4.3: a `resume.checkpoint` whose envelope carries no `egress` reads **`local-only`** and no `license` reads as **unresolvable, therefore refused** — because §5.4 requires a conformant publisher to carry both, so silence means the class **did not travel**, never that it is permissive. Fold with **FT-W** in one §4.2 edit; FT-W's own fix does not reach this, there being no second carrier to rank. Additive, one spec — KMI needs no change. | KFT §4.2/§4.3 (KMI §2/§7.1 unchanged) |
| **FT-Y** | **High (operand durability)** | §3.4 makes `checkpoint` and `at_step` REQUIRED and §7 makes verifying `at_step` a MUST, but both live **only** on §6's telemetry stream: §5.2's activity record does not carry them and `generated[]` is written at completion, which an interrupted leg never reaches. **KCB §4.2b then made that stream sheddable** hours after this fold — `on_overflow: drop`, plus `coalesce`/`defer` a producer may apply unasked on a losslessness argument stated for **KGP payloads**, which a KFT telemetry event is not. KCB §4.2c's recovery operand is typed to a KGP pack id and has no admissible value here, and KFT §2 declares no telemetry port to carry a `volume` or `resume_horizon`. So the fold's own operands can be lost with no signal and §7's MUST-verify has no durable source. | **§5.2**: a leg's provenance record MUST carry the id and `step` of the last checkpoint it published, including a leg that terminates `failed`. **§6**: a checkpoint-bearing event is not sheddable under KCB §4.2b's `drop`, and a coalescing window MUST NOT drop a `checkpoint` field. Declaring the stream as a §2 port is available, not required — the fold should say which it takes. Additive, one spec; no KCB change. | KFT §5.2/§6 (+§7's verify clause; KCB §4.2 unchanged) |

**Not a delta — one clause rescued by a later fold.** §5.4 requires a checkpoint to carry its class
*on its KMI envelope*, and the KMI §2 envelope had no such field when §5.4 was published
(`49e63e6`); MA-5 added it hours later (`7ee8da0`). Recorded because nothing else in either spec
does, and because it is the counter-example to this pass's own headline — the second axis moved
*toward* a clause as often as it moved out from under one.

**Not a delta — one name collision.** KFT §3.4's `resume` and KCB §4.2c's `subscribe` `resume`
operand are both in play on one training run and neither document mentions the other.

**Not a delta — one stale label**, already recorded against the `Depends on:` header by the
FT-M…FT-Q re-run: §7's grant paragraph is labelled *"(KCB 0.4.x)"* against KCB 0.5.0.

### Verdict — not clean; gate (ii) does not close

**Every delta this leg forced is answered, and three of five flip outright.** FT-R has its slot in
the prose and in the schema; FT-T has its relation registered with the right signature and the right
disclaimers; FT-V has its remainder estimate and its chain-cumulative ceiling. Steps 1 and 7 hold,
including the constraint that mattered most — no new plane, artifact kind, media type, or KCB verb.
**The fold's model was never in question on this pass; its perimeter was**, and both breaks came
from the same place: two plane folds that landed *later on the same day* and that no reading of KFT
alone can see.

**FT-S and FT-U half-flip.** Each closed the hole it was written for and each left a new one at the
edge of a neighbouring spec — FT-X where §4.2 reads a carrier that may be silent and the planes
disagree about what silence means, FT-Y where the fold's REQUIRED operands ride a stream another
spec has since licensed producers to shed.

**The gate is therefore not discharged, and its count changes shape** — from *re-run the leg* to
**fold FT-X and FT-Y, then re-run this section again**. Both folds are additive, both are
KFT-only, and FT-X should land in the same §4.2 edit as **FT-W**. That is the **fourth** count in
this repo to take that shape in two days, after KMI count (i)/MA-12, KCB count (iii)/ADR-0014 and
KFT count (i)/FT-W — and the pattern is now explicit enough to name: **2026-08-26 landed folds in
five specs, several within hours of each other, and every re-run walked since has broken on a
neighbour rather than on itself.**

**No KFT version and no KFT clause moves on this walk.** §2, §3, §3.3, §3.4, §4, §5, §6 and §7 are
byte-unchanged, [`../schemas/finetune-job.schema.json`](../schemas/finetune-job.schema.json) is
byte-unchanged, and [`../registry/relations.tsv`](../registry/relations.tsv) is byte-unchanged; the
edit is this section plus a gate paragraph and a changelog entry in
[`../specs/fine-tuning.md`](../specs/fine-tuning.md). **KFT stays 0.7.0 Candidate.**

**What this re-run does not touch.** Gate **(i)** — the re-run of
[`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md)'s *Re-validation — KFT 0.4.0*
— is unaffected and unmoved, and the cold-job walk above is why: 0.6.0 changed no admission input
for a job carrying no `resume`. That gate is separately open on **FT-W**. **DR-11** is unchanged by
anything here: this leg's KCS-encoding status is a downstream question, not a prose one, and it is
re-checked on its own terms rather than inherited. *That re-check has since happened — 2026-09-03,
by running the downstream gates at `agora` `c971fc2` — and **DR-11 is closed**, having been closed
downstream on 2026-08-26. The sentence below was written expecting the opposite answer and is
**right either way**, which is the point of separating the two questions.* **KFT is not promotable**,
and the reason is two open counts — not, on this walk's evidence or on the artefact gate's, a missing
document.
