# Koine Conformance-Scenario format (KCS)

**Spec version:** 0.4.0
**Status:** Candidate
**Last updated:** 2026-09-12
**Applies to:** the conformance console (executor) and every participant it drives
**Depends on:** [`identity.md`](identity.md) (KINP), [`grounding-pack.md`](grounding-pack.md)
(KGP), [`capability-bus.md`](capability-bus.md) (KCB), [`media-interchange.md`](media-interchange.md)
(KMI); governed by [`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md).

> A **conformance scenario** is a declarative, replayable script that drives *any combination*
> of participants — in any order — over their **real** MCP/A2A connections, and asserts what was
> observed. It is the executable form of the hand-written pressure tests (`../scenarios/*.md`).
> Why the *format* belongs in koine and not in an executor: a scenario step is typed against all
> four planes (a KCB `invoke`, a KGP claim, a KINP id, a KMI asset), so it is a cross-cutting
> contract; only a console's UI/runtime is implementation-local.

Per ADR-0001 decision 7, the console is an **observer on real connections, not a hub**: it
opens the same direct links production uses and records traffic, so a green scenario proves the
actual protocols, not a mock.

---

## 1. Scope

KCS defines the **scenario document** (§2), the **step vocabulary** (§3), the **execution &
observation model** (§4), the **cross-plane assertion vocabulary** (§5) — including §5.1's
normative **evidence-precedence** rule, which fixes *which* evidence decides an assertion — and the
**exchange record** (§9), the optional emitted-telemetry shape an observer may rely on. It does not
define the console UI, transport internals (that's MCP/A2A + KCB), or payload formats
(KGP/KMI/KINP); §9 fixes what an emitted record *says*, never that a participant must emit one, and
§5.1 fixes what it is *worth* when the runner also saw the exchange itself.

## 2. Scenario document

```jsonc
{
  "kcs_version": "0.4.0",
  "id":    "kcs:worlds-to-fabric",
  "title": "Fiction stays uncontaminated across the media→knowledge bridge",
  "timeout_ms": 120000,                     // scenario-level liveness bound (delta P)
  "participants": [                         // capability providers, by KINP identity (KCB §2)
    { "identity": "refkb:agent:resolver",      "planes": ["knowledge"] },
    { "identity": "analyzer:agent:pipeline",   "planes": ["media", "knowledge"] },
    { "identity": "mediastore:agent:composer", "planes": ["media"],
      "standin": { "fixtures": "fixtures/mediastore-composer.json" } }  // not-yet-adopted (delta N)
  ],
  "setup":  [ /* steps run before the body (seed worlds/entities/assets) */ ],
  "steps":  [ /* the scenario body, §3 — every step has an `id` */ ],
  "teardown": [ /* optional cleanup */ ]
}
```

Participants are resolved to live endpoints via the registry (KCB §3) at run time; a scenario
never hard-codes an address. A participant a scenario needs **before it has adopted the bus** MAY
declare a **`standin`** (a fixture source); the console uses it in place of a live endpoint and
records that the participant was stubbed (delta N).

### 2.1 Bindings (delta M)

Every step (§3) carries an **`id`**. A step's output is addressable as `${<step-id>.<path>}`, so
a later step or assertion can reference a value produced — or **minted** — at run time: the
provisional-local entity id an `invoke` mints (KINP §6), a `resolve` result, a `pack_id`, a
`fetch`ed asset id. Setup-seeded ids bind the same way. Without bindings a multi-step scenario
cannot thread runtime values; with them the firewall/dedup scenarios become expressible.

## 3. Step vocabulary

Each step is one typed action. Payloads reference things by **KINP id** (entities, worlds,
assets) and carry **plane-typed** ports (KCB §2.1) — never inline blobs.

| Step | Meaning | Refs |
|---|---|---|
| `invoke` | call a capability (KCB `invoke`) with plane-typed inputs → capture outputs | capability id, input ports |
| `fetch` | retrieve asset bytes (KCB `fetch`, KMI §7) | `asset` id |
| `subscribe` | register for a world/capability; collect the delta stream (KCB §4, KGP §6) | world / capability |
| `resolve` | look up an entity / equivalence closure (KINP §8) | KINP id or descriptor |
| `emit` | write a GroundingPack / assertion into the fabric (KGP) | pack / claim |
| `assert` | evaluate a predicate over the observation log (§5) | see §5 |

Every step carries an **`id`** (§2.1) and MAY reference prior outputs via `${id.path}`. A step
MAY declare **`expect: "ok" | "reject"`** (default `ok`): with `reject` the step *passes* when
the call is refused as intended (an unauthorized `fetch`, an over-ceiling `invoke`) and fails if
it unexpectedly succeeds — so negative-path (security) scenarios don't abort (delta O). Steps run
in declared order by default; a step may declare `after: [stepId…]` for explicit concurrency
(mirrors the real interleavings the pressure tests exercised), and an optional `timeout_ms`
bounds its liveness (delta P).

## 4. Execution & observation model

1. **Discover** participants via the registry; **open direct** MCP/A2A links (no proxy).
2. **Run** steps (honoring `after` / `timeout_ms`), recording every request, response, and
   stream frame into an **observation log** (each entry stamped with participant, plane, KINP ids
   touched, transaction time); a step exceeding its `timeout_ms` fails liveness rather than
   hanging the run.
3. **Evaluate** `assert` steps against the log.
4. **Report** a conformance result: per-assertion pass/fail + the supporting log slice, plus
   overall green/red. The report is itself content-addressable and archivable.

The console is a *participant/observer*: it may inject requests and read streams, but inter-
service traffic still flows peer-to-peer (ADR-0001). Idempotent replay is free — content-
addressed claim/asset ids make redelivery safe (KGP §6, KCB §4).

> **Record which MCP revision each participant speaks (INFORMATIVE).** Step 1 above opens the *same
> direct MCP/A2A links production uses*, and MCP's wire is not one wire: the revision KCB pins made the core
> stateless, and a client speaking it is not a client speaking its predecessor — see
> [`capability-bus.md`](capability-bus.md) §1.1 and §4.1 for the pin and the per-verb consequences,
> and [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) for the version of record.
> The consequence for a scenario is evidentiary: a green run proves the protocols **as spoken on the
> run**, so a report that does not say which revision each participant spoke cannot be read as
> evidence for the other. A console is therefore the right place to stamp each participant's observed
> MCP revision into the step 2 observation log alongside the other per-entry facts, and to surface it
> in the step 4 report. Being informative, that is a recommendation to an executor, not an RFC-2119 obligation on
> anything; this note **adds no requirement to the scenario document**: no `participants[]` field, no
> step, and no assertion in §5 is introduced or changed by it — the revision is a property of the
> connection the console already opens, and recording it is reporting fidelity (§7 open question 3),
> not conformance. It is called out here because the alternative is a report that silently averages
> two incompatible wires.

## 5. Cross-plane assertion vocabulary

Assertions are what make a scenario a *conformance test* rather than a demo. Drawn from all
four planes:

- **Identity/firewall (KINP):** `no_sameas_across_worlds(a, b)`, `based_on_exists(a, b)`,
  `resolves_to(local, canonical)`, `firewall_holds(query, world)` — e.g. "facts-about-real-X
  never return fiction-world claims."
- **Knowledge (KGP):** `claim_in_world(claim, world)`, `claims_converge(a, b)` (dedup after
  reconciliation), `provenance_present(claim)`.
- **Media (KMI):** `asset_attaches_to(asset, entity)`, `source_world_is(asset, world|null)`,
  `analysis_attributed_to_constituent(composite)`.
- **Control (KCB):** `capability_path_exists(from, to)`, `cost_within_ceiling(invoke, budget)`,
  `tier_resolved(invoke, tier)`, `dangling_ref_tolerated(ref)`, `refused(step)` (a step with
  `expect: reject` was correctly refused — e.g. an unauthorized `fetch` or over-ceiling `invoke`).
- **Liveness/timing:** `completes(step)`, `always_completes(scenario)` (the zero-spend property).
- **Determinism/invariants:** `structure_matches(a, b)` (the outputs may differ in generated
  bytes/content, but their declared structural or cross-plane invariants match — for example,
  the same attachment target, source world, or constituent topology). This predicate MUST NOT
  be interpreted as byte equality.

When a scenario exercises generated or otherwise nondeterministic output, its assertions MUST
test the stable structure/invariants that the contract promises, rather than exact generated
content. Exact-content assertions remain valid only where exact content is itself the contract.

### 5.1 Evidence precedence — which evidence decides a predicate (NORMATIVE)

Three of the predicates above can be decided off **two different kinds of evidence about one
exchange**: an outcome the runner **observed itself** on a connection it opened (§4 steps 1–2), and
an **exchange record** a participant emitted (§9). They are `tier_resolved(invoke, tier)`,
`cost_within_ceiling(invoke, budget)` and `refused(step)` — the three §9 names as already being
asserted, downstream, over frames carrying that shape. Until this section nothing said which of the
two decides, or what a runner does when they disagree.

That is not a matter of taste. Two conformant runners resolving one disagreement differently produce
**different conformance reports from one run**, which is delta **R**'s defect — an open basis under a
predicate — moved from the *comparison* axis onto the *evidence* axis. **The property this rule
exists to guarantee, stated so that a later revision can be measured against it: two conformant
runners evaluating one run MUST reach the same verdict for each of these three predicates.**
Everything below is written to make that true, and nothing below may be read in a way that makes it
false.

**a. Two kinds of evidence, and the ordering between them.**

- A **direct observation** is an entry the runner recorded in §4 step 2's observation log from a
  connection it opened itself — a request it sent, a response it received, a stream frame it read.
  It is the runner's own account of the exchange.
- An **attributed record** is a §9 exchange record. It is its emitter's assertion and nobody else's
  (§9g): a runner never composes one, never completes a field its emitter left absent, and never
  rewrites one.
- **A direct observation outranks an attributed record, always. The reverse ordering is
  forbidden.** The reason is fixed by §9(a) and is not a preference: emission is OPTIONAL and this
  class of data is **droppable by construction**, so an absent record asserts nothing and a present
  one is a *declaration* rather than a *measurement*. A rule letting a record override what the
  runner saw would let a participant decide, by choosing what to emit, what the run concluded about
  it — and conformance evidence a subject can author is not evidence.

**b. A record is bound to a step before anything is compared.** A runner **MUST** bind a record to a
step on the facts the record states — §9(b)'s `verb`, `capability`, `caller`/`callee`, and the
`trace` / `refs` correlation — and **MUST NOT** bind on timing proximity, log adjacency, or ordering
in the log. A record the runner cannot so bind is **not evidence for that step**, MUST be ignored
for it, and MAY be reported as unbound. This clause comes first because two runners that bound
different records to one step would diverge *before* the ordering rule was ever reached.

**c. The four cases (NORMATIVE).** A runner evaluating one of the three predicates for a step
**MUST** decide it exactly as follows, and **MUST NOT** apply any other rule:

| The runner's own observation | Bound record(s) (b) | Verdict |
|---|---|---|
| present | none | decided by the **observation** |
| present | present, agreeing (e) | decided by the **observation**; a record that agrees corroborates and adds no weight |
| present | present, disagreeing (e) | the assertion **FAILS** — see (d) |
| none | one, or several that agree | decided by the **record**, and reported as an **attributed assertion, not as an observation** (d) |
| none | several that disagree | the assertion **FAILS** — see (d) |
| none | none | the assertion **FAILS**: an assertion with no evidence does not pass |

The last row is where this rule **changes how an existing predicate evaluates**, and it is stated
plainly rather than left to be discovered: before this section, a `cost_within_ceiling` for which
the runner held neither an observed accounting nor a record could be read as passing on the ground
that nothing refused the `invoke`. It cannot now. That reading is the fail-open inversion this
fabric refuses by name everywhere else — KCB §4.4c forbids *highest published* as a default for
exactly this reason, and KMI §7.1 makes an unreachable store a pending fetch and never a conclusion.
It is also why this publication is a **minor** and not a patch.

**d. A disagreement is reported, never resolved.**

- A runner **MUST NOT** silently prefer either reading, **MUST** fail the assertion, and **MUST**
  carry **both** readings in §4 step 4's report slice, each named by the kind of evidence it came
  from and — for a record — by its emitter's KINP id.
- Why the assertion fails rather than being settled by (a)'s ordering: the ordering fixes which
  account a runner may report **as its own finding**; it does not make a contradiction disappear.
  Two accounts of one exchange that contradict each other mean either that a participant
  misdeclared — which KCB §4.3i makes a breach of a term this format can assert against — or that
  the runner mis-observed. In neither case did the run *establish* the property asserted, and a
  conformance format that reported a pass over a contradiction would be reporting the tie-break
  rather than the run.
- Reporting is the whole of the fix, and the reason is §4's own report shape: the report is
  **content-addressed**, so a divergence resolved silently is not merely invisible, it is
  *reproducibly* invisible — the same hash over two runs that disagreed. That is exactly how delta
  **R**'s divergence hides, one axis over.
- Where the verdict is decided by a record (the fourth row of (c)), the report **MUST** mark it as
  attributed and name the emitter. A verdict standing on a participant's own account of itself is
  still a verdict; what it may not do is read, in the report, as though the runner had seen it.
- This mints **no new report verdict**. A disagreement is a **fail**, and §4 step 4's per-assertion
  pass/fail shape is unchanged.

**e. What counts as a disagreement — and what does not.**

- Comparison is on the **predicate's own fact**, never on the record as a whole. Two records
  differing in `trace`, `refs`, timings, or any field the predicate does not read are **not** in
  disagreement.
  - `refused(step)` reads whether a **gate refused**. §9(d)'s `refused` against an observed refusal
    agrees; `failed` is *not* `refused` in §9(d)'s closed enum, so a record reading `failed` against
    an observed refusal (or the reverse) **is** a disagreement, and so is `ok` against one.
  - `cost_within_ceiling(invoke, budget)` reads the spend measured against the ceiling **in the
    ceiling's stated unit** (§9c). Nothing is converted, by the emitter or by the runner.
  - `tier_resolved(invoke, tier)` reads the **provenance trust tier** §9(e) fixes that field on. A
    record carrying one of the fabric's other two *tier* axes in it is not a disagreement about the
    tier — it is a **non-conformant record**, and the runner reports it as one rather than comparing
    it.
- **An absence is not a disagreement.** A field that reads *unstated* under §9 — an absent `tier`,
  an absent `ceiling` or `spend`, an amount carrying no unit (§9c), an absent `world` which §9(b)
  forbids reading as `null` — supplies nothing to compare, so it can neither agree nor disagree with
  an observation. A runner **MUST NOT** substitute a default in order to obtain a comparison, and in
  particular **MUST NOT** read an un-denominated amount as *within* or as zero. Such a record is
  simply not evidence for that predicate, and the row of (c) that applies is the one for a record
  that is absent.
- **Several records are attributions, and are never merged.** Where both parties to an exchange
  emit, a runner holds **two attributed records** and **MUST NOT** compose a single one from them.
  They agree, or they disagree and (d) applies. That is
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s *a merge merges
  attributions, never contents*, read on this plane — the same discipline §9(g) applies to a single
  record.

**f. What this binds, and the part of §7 question 1 it makes larger rather than smaller.**

- This rule is part of the **fixed core**. A runner implementing §5's vocabulary implements this
  evaluation; one that implements the three predicate *names* under a different evidence rule is not
  implementing §5, however the names line up.
- And it lands squarely on §7 question 1's second half — *a fixed core is only fixed if something
  checks it* — which is recorded there on the evidence of **DR-10**: the downstream §5 vocabulary
  omits `structure_matches`, the predicate the 0.3.0 fold *is*, and declares a `media_map_complete`
  this spec names nowhere, while every document it replays declares `kcs_version: 0.3.0`, and the
  check meant to catch that drift is a hardcoded count of names rather than a comparison against §5.
  **This rule makes that question larger.** A name check would not catch a divergence here at all:
  two runners can agree on every predicate name, reject the same unknown ones, and still return
  different reports, because the evidence rule those names are evaluated under **is not visible in a
  scenario document**. Whether the fixed core needs a conformance obligation on the *runner* —
  declare the vocabulary version **and** the evidence rule you implement — is the question, it is
  recorded in §7 question 1, and it is **not closed here**.
- A **declared console extension** (§7 question 1's escape hatch, used as designed by **V-8** and
  **MA-11**) that decides its predicate off an exchange record is bound by (a)'s ordering — a record
  never outranks the runner's own observation, whatever predicate reads it — and its author declares
  the evidence rule beside the predicate, as the extension itself is declared.
- §5's fixed core is otherwise **unchanged**: no predicate is added, removed or re-signatured, and
  `structure_matches`'s open comparison basis — blocking delta **R** — is **untouched**. R is a
  *comparison* basis and this is an *evidence* basis; supplying one does not supply the other, and a
  runner given this rule tomorrow would still have to invent R's.

**g. What this rule does not do.** It adds no predicate, no step (§3), no field or participant entry
(§2), no binding (§2.1) and no report verdict (§4). It adds no obligation to emit — §9(a) stands
unchanged, and a scenario runs identically against participants that emit nothing, since a run in
which no record exists is decided entirely by the first and last rows of (c). It does **not** close
delta **R**, does **not** discharge **DR-10** — which is downstream work under
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and stays unowned — and does **not**
promote KCS.

## 6. Relationship to the written scenarios

The two hand-authored pressure tests are the first KCS instances to encode, making them
executable and repeatable:

- [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) → `kcs:worlds-to-fabric`
  (identity firewall across the media→knowledge bridge).
- [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) → `kcs:media-transform`
  (4-participant transform chain; cross-plane ports, fetch, source_world, cost ceilings).

Encoding them is a downstream conformance-console tasklist (see `../tasks/chief/`).

## 7. Open questions

1. **Assertion extensibility** — a fixed vocabulary (§5) vs. a small predicate DSL over the
   observation log. Leaning: fixed core + an escape hatch.
   *Evidence from downstream use, 2026-08-24.* The escape hatch was used exactly as this question
   imagines it, twice, by different authors of different scenarios:
   [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)'s **V-8**
   needed five predicates §5 cannot express and
   [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md)'s **MA-11** needed
   four more, and **both sets were built as declared console extensions and reported as such**
   rather than smuggled into §5. That is the leaning working, produced by construction rather than
   by argument. But the same run found the fixed core **drifting**: finding **DR-10** records that
   the downstream §5 vocabulary omits `structure_matches` (question 2's own predicate) *and*
   declares a `media_map_complete` this spec names nowhere, while every encoded document declares
   `kcs_version: 0.3.0`. A fixed core is only fixed if something checks it, and the check
   downstream is a hardcoded count of eighteen names, not a comparison against §5. **So this
   question now carries a second half:** whether a fixed core needs a normative conformance
   obligation on the *runner* — declare the vocabulary version you implement, and reject a document
   declaring one you do not — rather than only on the document. Taking it up is a normal minor
   revision gated by a pressure test.
   *And 0.4.0's **§5.1** makes that second half larger rather than smaller, which is recorded here
   because it is the opposite of what a fold usually does to an open question.* The evidence-
   precedence rule is fixed-core surface a runner implements, and **a name check cannot see it**:
   two runners may agree on every predicate name, reject the same unknown ones, and still return
   different reports for one run, because the evidence rule those names are evaluated under appears
   **nowhere in a scenario document** — §2 declares a `kcs_version` and no evidence profile, and §5.1
   deliberately adds no field to change that (§5.1g). So the runner-side declaration this question
   contemplates would have to cover the vocabulary version **and** the evidence rule, and the drift
   DR-10 records — a name missing, a name invented — is now the *detectable* half of the problem.
   §5.1 states the property it exists to guarantee (two conformant runners, one run, one verdict per
   predicate) precisely so that a later revision can measure a proposed check against it. **Not
   closed by 0.4.0.**
2. **Determinism** — **folded in 0.3.0:** model outputs vary; scenarios MUST assert
   *structure/invariants* (firewall, cost, world-scoping), not exact generated content, unless
   exact content is itself the contract. `structure_matches(a, b)` is the fixed-core predicate
   for comparing generated outputs without requiring byte equality.
   *Unexercised downstream as of 2026-08-24* — per **DR-10**, no encoded document can assert
   `structure_matches` because the predicate does not exist in the runner, so the fold has no
   machine-replayable evidence and Attempt 3 is unclosed downstream. That is a drift finding, not a
   reopening: the clause is unchanged and this spec's *Pressure test* records what it costs the
   pending re-validation.
   *Re-validated by hand 2026-09-03 — the fold is **incomplete**, not reopened.* The walk found that
   `structure_matches` is admitted to the fixed core with only a **negative** constraint: its
   comparison basis is fixed nowhere, there is no slot in which a scenario declares which invariants
   must match, this group is the one §5 group with no plane clause behind it, and both operands are
   content hashes of deliberately-differing bytes. Two conformant runners may return different
   verdicts for one document — new blocking delta **R**
   ([`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md#findings-from-the-re-validation)).
   The clause added at 0.3.0 stands as written and is **not** withdrawn; what is missing is its
   positive content, and supplying it — by delegating the basis to named clauses one plane over, or
   by giving §2/§3 a declaration slot — is a normal minor revision gated by a pressure test. It is
   **unowned**, and it is what the single re-validation count now reads as.
3. **Recording fidelity** — how much stream payload the observation log retains vs. references by
   id (ties to KMI byte transport).
   *Evidence from downstream use, 2026-08-24.* Finding **DR-2** records that the committed run
   artifact carries a **per-scenario aggregate** — id, verdict, live/stand-in slot counts — and not
   pass/fail per assertion with the clause that assertion cites. Nothing in this spec requires
   otherwise: §2 has no per-assertion spec-section field (§8 *Traceability* says so), so a
   conformant runner may report exactly this much. The consequence is that
   [`README.md`](README.md#the-ratification-gate)'s consuming gate — which asks a recorded result
   for *pass/fail per assertion with the clause each assertion cites* — cannot be satisfied from the
   report alone, and every clause koine attributed to that run was read off the encoding by hand.
   This question is where the fix belongs, and it is now a **report-shape** question as much as a
   payload-retention one.

## 8. Prior art considered (rationale, INFORMATIVE)

This section records the contract-testing prior art KCS was measured against and why the format
looks the way it does. It is **informative**: it binds no clause, and the scenario document (§2),
the step vocabulary (§3), the execution and observation model (§4), and the cross-plane assertion
vocabulary (§5) are unchanged by it. Dated data points come from a prior-art sweep of **2026-08**
and are stated with their dates so the claim ages visibly. The narrative version lives in
[`../docs/reference/positioning.md`](../docs/reference/positioning.md) *Prior art considered*; where the two disagree,
this spec wins.

**Pact and consumer-driven contract testing.** Pact is the mature name in contract testing — a
real ecosystem, a broker, and years of production use — and the comparison is the strongest
argument *for* KCS rather than against it, because the two differ on both of the axes that decide
what a test can observe.

| Axis | Pact | KCS |
|---|---|---|
| **Parties** | **Bilateral** — one consumer, one provider, one pact. A three-party interaction is expressed as several pacts, each blind to the others. | **N-ary** — one scenario names *any combination* of participants (§2) and steps may interleave across them (`after`, §3). The interaction between participants B and C is inside the unit under test, not outside it. |
| **Counterpart** | **Mock-based** — the consumer's expectations are replayed against a **stub**, and the provider is later verified against a **recorded pact**, never against the live counterpart. Consumer and provider are never on the wire at the same time. | **Real** — §4.1 resolves participants through the registry and opens the **same direct MCP/A2A links production uses**; the console is an observer on those connections, not a hub (ADR-0001 decision 7). A green scenario proves the actual protocols. A participant that has not yet adopted the bus is the *exception*, and §2's `standin` requires the report to record that it was stubbed. |

**What no pact can express.** A pact's assertions are scoped to a single request/response pair,
because that is the only thing a bilateral mock has in view. KCS's assertions (§5) are **cross-
plane**: `firewall_holds(query, world)` is a KINP property observed over knowledge traffic,
`claims_converge(a, b)` is a KGP property that only appears *after* two producers have both emitted,
`cost_within_ceiling(invoke, budget)` is a KCB property accumulated across a chain of invocations,
and `always_completes(scenario)` is a liveness property of the whole run. Each spans planes and
participants rather than one exchange, so none of them is expressible as a pact — not for want of
syntax, but because the observation each needs is not in a bilateral mock's field of view. What
makes them checkable is §4's observation log: one record of every request, response, and stream
frame across every participant, which is the artifact a pact deliberately does not have.

**Traceability.** KCS's step and assertion vocabularies are cited to named clauses of the four
plane specs — §3's `Refs` column, and §5's per-plane grouping — so a failing assertion names the
clause it violates and a scenario states which contract it exercises (§6). That traceability is by
construction of the vocabulary today; a machine-readable per-assertion spec-section field is not
part of §2's document shape, and adding one would be a normal lifecycle change, not something this
section makes.

**The nearest agent-protocol equivalent, stated with its date.** A2A publishes its own test kit;
as of the **2026-08** sweep it is a **45★** project, and it is declarative only in its participant
matrix — the behaviours themselves are coded, not data. That is a data point about the state of the
field in 2026-08, not a permanent claim; it is recorded here dated precisely so a later reader can
check whether it still holds.

KCS therefore claims something **narrow**: not a better test for one request/response pair — Pact
is the better tool there, and KCS neither replaces nor competes with it — but a declarative,
replayable scenario over **N real participants** whose assertions are **cross-plane**, which is the
only shape in which the four planes' interaction can be observed at all.

### 8.1 Designs worth borrowing later (forward note — NOT adopted)

The same 2026-08 sweep read five running conformance programs whose *machinery* is ahead of §2–§5,
even though none of them answers KCS's question. They are recorded here so the option is not lost.
**None of this is adopted.** Nothing below changes §2's document shape, §3's step vocabulary, §4's
execution model, or §5's assertions; each is a candidate for a **future KCS revision under the
normal lifecycle** (`draft` → `candidate` → `ratified`, gated by a pressure-test scenario), and a
candidate becomes a clause only by going through it.

| Design | Where it comes from | What it would touch, if taken up |
|---|---|---|
| A participant's declared capability config **selects which cases run**, plus **known-failure baselines** so an expected red is not a new red | connectrpc's conformance runner | §2 — scenario selection against a participant's KCB manifest (§4.1 already resolves it); the baseline half also bears on §7.2's determinism question |
| **Frozen per-revision requirement sets**, and an explicit **reason a requirement was not scored** | MCP's conformance work | §6 and the report — a scenario would pin the spec revision it was written against, and a skipped assertion would say why rather than vanish |
| Composition primitives — **Condition / Sequence / TestModule / Plan** — so scenarios are assembled from reusable parts | the OpenID conformance suite | §3 — today a scenario is a flat step list with `after`; reuse across scenarios has no vocabulary |
| **YAML rubrics with JMESPath expressions** over the observed artifact, each carrying a `specSection` | C2PA's conformance program | §5 and §7.1 — this is the concrete shape the "small predicate DSL over the observation log" escape hatch could take, and the machine-readable form of the traceability §8 says the format does not have today |
| An **executor abstraction** — one interface, many protocol executors | Venom | §4 — MCP and A2A are the only transports §4.1 names; a third would otherwise be a spec change rather than a plug-in |

Two of the five map onto open questions already on the record (§7.1 assertion extensibility, §7.2
determinism); the other three are new surface. Taking any of them up is a normal minor revision of
this spec, not an editorial one.

## 9. The exchange record (emitted telemetry)

A participant may emit a record of an exchange it took part in — what was called, by whom, under
what ceiling, and how it ended. Participants in the console role do, and koine's own conformance
evidence is in part computed off records of that shape: §5's `cost_within_ceiling(invoke, budget)`,
`tier_resolved(invoke, tier)` and `refused(step)` are asserted in the cited downstream live run over
frames carrying it. Until this section the shape was specified **nowhere** — so a predicate this
format defines was being decided off a document this format did not describe. This section
describes it.

The prior-art sweep that gates it is
[`../docs/reference/kcs-telemetry-prior-art.md`](../docs/reference/kcs-telemetry-prior-art.md),
read **2026-09-12** and dated as a first reading, under the profile-by-reference-or-mint-and-record
discipline of [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) /
[ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md). Of the eleven facts a record
carries, standardised work covers **three** — correlation, timings, and the *shape* of a status
field — and does not cover the eight that make a record evidentiary for a KCS assertion rather than
diagnostic for an operator. Correlation is therefore **profiled by reference** (W3C Trace Context,
pinned in [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md)) and
the rest is **minted here**, with the reading recorded there rather than asserted here.

**a. Emission is OPTIONAL; what this section fixes is OBSERVATION (NORMATIVE).**

- **A participant that emits no exchange record is fully conformant.** Nothing in this
  specification requires instrumentation, a console, a collector, an exporter, or any sampling
  rate. This is [`capability-bus.md`](capability-bus.md) §4.3g's rule read on this plane: koine
  fixes what a thing **means** when it crosses a boundary, never that a participant must produce it.
- The reason is measured rather than a courtesy to the un-instrumented. The mature standardised
  work in this space **declines to require emission**: OpenTelemetry's trace SDK defines a sampler
  whose `DROP` decision is conformant and whose exporters receive only sampled spans, so a
  deployment sampling at zero exports nothing and remains conformant. A koine clause requiring
  emission would require what the entire field declines to require.
- It follows that **an absent record asserts nothing**. Absence is not evidence that the exchange
  did not happen, that it was refused, or that it stayed within a ceiling. That is the reading
  koine has already written on four other planes — [`capability-bus.md`](capability-bus.md)
  §4.5(c)'s absent `fetch` outcome reads *pending*, §4.2b's unanswered adjustment reads *not in
  force*, [`media-interchange.md`](media-interchange.md) §2's absent `egress` is *not*
  `exportable`, and that spec's §7.1 unreachable store is a pending fetch and never a conclusion.
- What is fixed here is **observation**: where a record *is* emitted, what it says and what an
  observer may rely on it for. Nothing below is an obligation to instrument.

**b. The record (NORMATIVE).** A record is a single object carrying the fields below. Every field
is named here, and an observer reads a fact from the field that names it and from no other.

| Field | Presence | Value | Absent reads |
|---|---|---|---|
| `kind` | REQUIRED | exactly `"exchange"` — the discriminator by which an observer recognises a record of this shape rather than inferring it from the fields present | not a record of this shape |
| `verb` | REQUIRED | one of [`capability-bus.md`](capability-bus.md) §4's five verbs — `discover` · `describe` · `invoke` · `subscribe` · `fetch`. A closed set **by reference**: KCB owns it, and a token outside it is unrecognised, never mapped onto a neighbour | — |
| `capability` | REQUIRED where the verb names one (`invoke`, `subscribe`, `describe`) | KCB §7.1's identity pair `{ name, version }` — **never the name alone**, which is what §7.1 says in terms; §7.1's **`0.0.0`-unknown** where the entry the exchange resolved carried no version — a *value* and not an omission, the reading KCB §3 already names a plan leg under | unstated; never *any version* |
| `caller` / `callee` | REQUIRED | the two parties as KINP ids ([`identity.md`](identity.md) §3.1) — the participant that dialed and the participant dialed | — |
| `world` | OPTIONAL | a KINP `world` id ([`identity.md`](identity.md) §5), or explicit `null` for an exchange that is not world-scoped | unstated. An observer **MUST NOT** read an absent `world` as `null` — the distinction is the one §5's `source_world_is(asset, world\|null)` already draws |
| `tier` | OPTIONAL | the **provenance trust tier** the deciding participant resolved, a token of [`../policy/trust-tiers.json`](../policy/trust-tiers.json). One of three axes this fabric calls *tier* — see (e) | unresolved; never a default |
| `status` | REQUIRED | one of exactly four tokens — see (d) | `unknown`. A record omitting it is non-conformant, and an observer still reads it rather than guessing: a defect in the emitter never licenses an inference in the reader |
| `ceiling` | OPTIONAL | `{ budget_units, unit }`, optionally `issuer` — the spend ceiling the enforcing party read, **and the unit it denominates in** (KCB §5; see (c)) | no ceiling was stated; never *unbounded* |
| `spend` | OPTIONAL | `{ budget_units, unit }` — what the exchange actually spent, denominated in the ceiling's unit (c) | unstated; never zero, never *within* |
| `started_at` / `ended_at` | OPTIONAL, and together | transaction-time instants in [`grounding-pack.md`](grounding-pack.md) §3.2's fixed form — ISO-8601, UTC, `Z` suffix, millisecond precision. Reused, not minted | unstated |
| `refs` | OPTIONAL | the KINP ids the exchange touched, each typed by its own kind segment ([`identity.md`](identity.md) §3.1's `ent` · `claim` · `asset` · `world` · `agent` · `activity` · `src`) | unstated — never *the exchange touched nothing* |
| `trace` | OPTIONAL | `{ trace_id, parent_id }` — **W3C Trace Context** Level 1 values **as propagated**, never minted afresh for the record where a `traceparent` was present (e) | uncorrelated |

A record MAY carry further fields. An observer **MUST** ignore a field it does not recognise and
**MUST NOT** read one as though it were a field above — KCB §7.2's ignore-unknown-fields rule,
reused rather than restated differently.

```jsonc
{
  "kind":   "exchange",                                  // the discriminator (b)
  "verb":   "invoke",                                    // one of KCB §4's five
  "capability": { "name": "compose", "version": "1.4.0" },   // KCB §7.1's pair, never the name alone
  "caller": "orchestrator:agent:planner",                // KINP §3.1
  "callee": "mediastore:agent:composer",
  "world":  "worldsim:world:alderforest",                // or null where the exchange is not world-scoped
  "tier":   "synthetic",                                 // provenance trust tier (e) — never a price tier
  "status": "ok",                                        // closed enum (d)
  "ceiling": { "budget_units": 5000, "unit": "orchestrator:credit",
               "issuer": "orchestrator:agent:host" },    // KCB §5 — the unit is not optional (c)
  "spend":   { "budget_units": 1200, "unit": "orchestrator:credit" },
  "started_at": "2026-09-12T14:03:11.482Z",              // KGP §3.2's fixed form
  "ended_at":   "2026-09-12T14:03:14.006Z",
  "refs":  [ "mediastore:asset:sha256-9f2a1c7d",         // typed by their own kind segment
             "analyzer:activity:1a2b" ],
  "trace": { "trace_id":  "4bf92f3577b34da6a3ce929d0e0e4736",   // W3C Trace Context Level 1
             "parent_id": "00f067aa0ba902b7" }
}
```

**c. Spend denominates its unit, or it is not evidence (NORMATIVE).**

- `ceiling` and `spend` each state their unit. Where both are present the unit **MUST** be the
  same, and neither the emitter nor an observer may **convert** one into the other.
- An amount carrying no unit is **not evidence** for `cost_within_ceiling`: it reads *unstated* —
  never *within*, never zero, never the observer's own unit.
- This is a **precedent applied, not a novelty**. KCB §5 already refuses an `invoke` whose
  `budget_units` ceiling crosses an authority-domain boundary without stating its unit, and refuses
  **for want of one** rather than assuming its own, because `budget_units` is a quantity in the
  *issuing host's* governance and two governance domains have no reason to mean the same thing by
  it. A record reporting spend against such a ceiling in no unit cannot be compared to it, so the
  rule reaches the record unchanged. The nearest standardised neighbour demonstrates the failure
  rather than the fix: the GenAI conventions' token **counts** are counts and not amounts, and
  carry no unit at all.
- koine fixes that the unit is **stated**, not what units exist — KCB §5 leaves the quantity in the
  issuing host's governance and this section does not take it back. The namespaced token in (b) is
  illustrative. Where the exchange crossed an authority-domain boundary the record SHOULD carry
  `ceiling.issuer`, the issuing host by KINP id that KCB §5 already requires a grant to name: a
  unit with no attributable issuer is comparable only inside one domain.

**d. `status` is a CLOSED enum (NORMATIVE).** Exactly four tokens, and a record carries one of them:

| Token | Meaning |
|---|---|
| `ok` | the exchange completed as asked |
| `refused` | a gate refused it. This is the token §5's `refused(step)` reads; a refusal is **not** a failure and MUST NOT be recorded as one — the whole point of `expect: reject` (§3) is that a correct refusal is a pass |
| `failed` | it did not complete, and not because a gate refused it |
| `unknown` | the emitter did not determine the outcome |

- An absent `status`, and an unrecognised token, both read **`unknown`**. An observer **MUST NOT**
  map an unrecognised token onto one of the four, and SHOULD report it as unrecognised.
- A free-form `status_detail` MAY accompany `refused` and `failed`, and **MUST NOT** accompany
  `ok` — OpenTelemetry's `Status` rule (a description is permitted only with `Error`), which is
  where the closed shape comes from and why closing it is a **correction rather than an invention**.
- Where the refusal was graded by the gate that made it (KCB §4.3h's minimum, KFT §8.1's table),
  the record MAY carry the grade **as that gate stated it**, and MUST NOT synthesize one (g).
- Why this cannot be left free-form: a field **documented** free-form and **consumed** as closed is
  two conformant readers with two readings of one document. That is delta **R**'s class of defect
  — an open basis under a predicate — four sections up, and the reason it is worth fixing before
  the record is relied on rather than after.

**e. What the record borrows, and the three axes called *tier*.**

Nothing here re-defines what a sibling spec already fixes: the verbs are KCB §4's, the capability
pair is KCB §7.1's, the parties and the `refs` are KINP §3.1 ids, the world is KINP §5's, the
ceiling and spend are KCB §5's `budget_units` with a stated unit, and the timestamps are KGP
§3.2's fixed form. **Correlation is profiled by reference**: where a record carries a correlation
identifier it is a **W3C Trace Context** `trace-id` — pinned at **Level 1, the Recommendation of
2021-11-23**, in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) — and never a
koine-minted one. koine reads `trace-id` and `parent-id`, claims nothing of `tracestate`, and adds
no propagation rule: the convention already rides the HTTP that carries MCP and A2A, so a parallel
koine trace identifier would compete with a working convention and lose. What this section mints is
the field names of (b) and the closed `status` of (d), and nothing else.

**Three axes in this fabric are called *tier*, and `tier` carries exactly one of them.** It is the
**provenance trust tier** — [`../policy/trust-tiers.json`](../policy/trust-tiers.json)'s `curated` ·
`acquired` · `synthetic` · `personal`, the axis [`grounding-pack.md`](grounding-pack.md) §7 and
[`fine-tuning.md`](fine-tuning.md) §4.3 gate on. It is **not** KGP §5's **dialect** tier
(`grounding-only` · `horn-safe` · `full-prolog`), which is a property of a pack and not of an
exchange, and it is **not** KCB's `cost.tier` (`free` · `paid`), which is a **price** and rides
inside the published cost, never in this field. §5's `tier_resolved(invoke, tier)` names no axis of
its own; where it is decided off a record, this field is the axis, and a record **MUST NOT** put
another axis's token in it. §5's grouping of that predicate is unchanged by this section.

**f. Where a record lives, and what this format deliberately does not carry it on (NORMATIVE).**

- **The carrier is this format's own.** A record an observer holds is an entry in §4 step 2's
  **observation log**, stamped like every other entry with participant, plane, KINP ids touched and
  transaction time; §5's predicates are evaluated against that log (§4 step 3), so a record is read
  exactly where every other observation is read. The `kind` discriminator (b) is what makes it
  recognisable there rather than guessed at from the fields present.
- **How a record reaches an observer is transport, and §1 excludes transport.** Where a deployment
  delivers one in band on a KCB binding, KCB §4.2d mints the **one** in-band control channel with a
  MUST against a second, and KCB §7.3g is the one place that channel's frame vocabulary is named.
  So **this section names no frame**: a record delivered that way rides a frame KCB mints, and
  minting one here would put a normative token in a slot another spec reserves.
- Stated rather than left implicit, because the alternative has a name in this repository: *a rule
  with a declared normative consequence and nothing that carries it* has been filed **eight** times
  across these specs. §9 is not the ninth, and the reason is checkable — every normative
  consequence above is discharged at a carrier KCS owns (a named field of (b), read from §4's
  observation log), and the one carrier KCS does **not** own is stated as *not specified here*
  rather than asserted into existence.

**g. A record is its emitter's assertion, and nobody else's (NORMATIVE).**

- An observer **MUST NOT** compose a record for a participant that emitted none, **MUST NOT** fill
  a field the emitter left absent, and **MUST NOT** rewrite a field it emitted.
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s never-synthesize
  rule, read on this plane: an observation may be *attributed*, never *manufactured*.
- What a declaration is worth across a boundary is KCB §4.3i's answer and is not restated
  differently here: silence costs the declarant, and a misdeclaration is a breach of a term this
  format can assert against — which is what makes a record usable as evidence at all, and what
  keeps it from being usable as proof.
- An observer's **own** observation of the same exchange is evidence of a different kind, made by a
  different party. Which of the two decides a §5 predicate when they disagree is (h).

**h. What a record is worth as evidence is §5.1, and it is NORMATIVE.** This section fixes what a
record **says**; what it is *worth* against an outcome the runner observed itself is **§5.1**, the
other half of this same **0.4.0** publication. Read there and not here: a direct observation
**outranks** an attributed record and never the reverse (§5.1a, on this section's own optionality
argument — a droppable document is a declaration, not a measurement); a record is bound to a step
on the facts (b) states and never on timing (§5.1b); and a disagreement between the two **fails the
assertion and is reported with both readings**, never silently resolved (§5.1d). It could not be
left informative: two conformant runners resolving one disagreement differently produce **different
conformance reports from one run**, which is delta **R**'s defect moved from the comparison axis
onto the evidence axis. Two consequences land back on this section rather than staying in §5 — the
*unstated* readings of (b), (c) and (d) are **absences and never disagreements**, so a runner may
not default them into a comparison; and where both parties to one exchange emit, a runner holds
**two attributions** and may not merge them into one.

**i. What this section does not do.**

- It adds **no obligation to instrument**, no sampling rule, no retention or redaction policy (how
  much the log retains is §7 question 3), no collector, no exporter and no transport.
- It adds **no schema twin**. [`../schemas/`](../schemas/) models interchange documents a producer
  must hit; KCS has no twin for §2's scenario document either, and minting one for §9 alone would
  put a machine-checkable floor under one section and none under the document that carries it. If a
  twin is ever added it is added for §2 and §9 together.
- It adds **no step** (§3), **no participant field** (§2) and **no binding** (§2.1). A record is
  *observed*, not declared: nothing in a scenario document changes because a participant emits one,
  and a scenario runs identically against participants that emit nothing.
- It does not close delta **R**, does not discharge **DR-10**, and does not promote KCS.


## Pressure test

Exercised by [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) (encoding
both hand-written scenarios as KCS). Deltas folded in 0.3.0: **Q** (`structure_matches` and the
stable-invariant rule, §5/§7.2) in response to Attempt 3's generated-output break. Earlier deltas
remain in force: **M** (step `id` + `${id.path}` bindings, §2.1/§3), **O** (`expect: ok|reject` +
`refused`, §3/§5), **N** (`standin` participants, §2), **P** (`timeout_ms`, §2/§3/§4). **Candidate**:
that re-validation has now been walked, and it did **not** clear it — see *The re-validation, walked
2026-09-03* below. §7.1 assertion extensibility and §7.3 recording fidelity remain open.

**Downstream evidence (2026-08-24), and the one thing it costs the pending re-validation.** KCS is
the one spec whose conformance artefact is earned by **use** rather than by a run
([`README.md`](README.md#the-ratification-gate)), and the use happened: **nine** scenario documents
were written in KCS 0.3.0 downstream and all nine parse, replay over real MCP/A2A links, and produce
a content-addressed report. That is positive evidence for the format at a scale no single scenario
supplies, and the deltas it exercises are the ones this spec folded — **M** (three assertions naming
values bound from a step's output, including one with *both* operands bound), **O** (both negative
paths ran as negative paths instead of aborting the run — a refused `fetch` and an over-ceiling
`invoke`, neither testable before delta O), **N** (`standin` recorded in the report on all thirteen
stubbed slots), and **P** (`completes` on a step, `always_completes` on the scenario).

**What it costs: delta Q is unexercised, and the vocabulary has drifted (DR-10).** The runner's §5
vocabulary omits `structure_matches` — the predicate 0.3.0 *is* — and declares a
`media_map_complete` this spec names nowhere, while every document it replays declares
`kcs_version: 0.3.0`. So the pending re-validation cannot be discharged by a machine replay of the
folded clause; a hand-walk of
[`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) Attempt 3 still can, which
is why this is a **qualification on the existing re-validation and not a second gate**. Two riders:
a document declaring 0.3.0 while being replayed by a 0.2.0-shaped vocabulary is the silent-version-
drift hazard [`capability-bus.md`](capability-bus.md) §7.2 names one plane over, and the check meant
to catch it is a hardcoded count rather than a comparison against §5 — recorded as the second half
of §7.1. Fixing the runner is downstream work under
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**.

**The re-validation, walked 2026-09-03 — not clean, and the count does not close.** The single count
above was taken by hand against
[`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) (§ *Re-validation — KCS
0.3.0, walked 2026-09-03*), and the record there states **per delta** which evidence carried it,
because mixing a replay and a reading silently is the error **DR-7** and **DR-8** record against
[`capability-bus.md`](capability-bus.md) one plane over. *Replay-corroborated:* deltas **M**, **N**,
**O** and the assertion half of **P** lean on the 2026-08-24 run of `kcs:format-stress` recorded
above. *Hand-walked:* delta **Q** in full, the firing half of **P**, and the clause re-read behind
every replayed delta — Q by necessity, since DR-10 leaves the runner without the predicate.

**The regression set flips; the fold under test half-flips.** M, N and O close. P closes in prose
with one **declared residual**: §4 states that an exceeded `timeout_ms` fails liveness, but no run
has exceeded one, so the firing path is unexercised — a suite-coverage gap, recorded in the walk and
deliberately not opened as a delta. **Q half-flips.** Byte equality is forbidden normatively and
that half is clean; the other half is not. §5 constrains `structure_matches` only **negatively** and
fixes its comparison basis nowhere: the format has no slot in which a scenario declares *which*
invariants must match (§2 and §3 have none, and §5 fixes the signature at two operands); the
*Determinism/invariants* group is the one §5 group with **no plane clause behind it**, where every
other predicate delegates its meaning to a named clause of KINP, KGP, KMI or KCB; and both operands
are `asset` ids, i.e. hashes of deliberately-differing bytes, so the predicate must dereference them
to something §5 does not name. Two conformant runners may therefore return different verdicts for
one document, and §4's content-addressed report makes that divergence invisible rather than flagging
it. That is new blocking delta **R**.

**What it costs, and what it does not.** **KCS stays 0.3.0 Candidate.** No version moves and **no
normative clause moves** — §2, §2.1, §3, §4 and §5 are byte-unchanged by this walk, which is a
read-and-confirm pass and not a fold. The single count **changes shape** rather than closing: from
*re-validate the 0.3.0 fold* to **fix `structure_matches`'s basis, then re-validate again** — either
by delegating the basis to named clauses one plane over (KINP §7.2's attachment, KMI §2's
`source_world`, KMI §3's lineage relations) or by giving §2/§3 a slot in which a scenario declares
the invariants it requires to match. That is a normal minor revision gated by a pressure test, and
it is **unowned**. It is deliberately **not** §7.1 — the escape hatch is for predicates §5 *cannot
express*, and R is about one §5 *does* express with an open basis — and §7.2 is **not reopened**: the
clause 0.3.0 added stands as written, and what is missing is its positive content.

**DR-10 is discharged as a qualification without being fixed.** This spec recorded DR-10 as a
qualification on the re-validation rather than a second gate, on the grounds that a hand-walk could
still do what a machine replay could not. That is what happened, and **R is what was under it**.
Worth recording plainly: a replay could not have found R even with the predicate implemented
downstream, because a single runner is internally consistent and an open comparison basis is
invisible from inside one implementation of it. The drift itself is untouched by this pass and stays
**downstream work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), unowned** —
koine specifies the vocabulary and the console implements it, so closing DR-10 from this repo is not
available.

**§9 and §5.1 are new normative surface, and no pass exercises either (2026-09-12).** The exchange
record and the evidence-precedence rule added at 0.4.0 are recorded here the way
[`fine-tuning.md`](fine-tuning.md) records an unexercised modality row: **published, not
exercised**. No document in [`../scenarios/`](../scenarios/) emits an exchange record, and the
downstream evidence that motivated both halves **predates** them — a run green over frames of the
pre-0.4.0 shape asserts nothing about §9's clauses, which is **DR-7**'s shape read on this spec's
own fold rather than on another's. What that costs is stated rather than smoothed over: (a)'s
optionality, (c)'s denomination rule, (d)'s closed enum and (f)'s carrier are readable and are
unrefuted, not validated. **§5.1 is the sharper case of the two**, and the reason is worth writing
down: it is a rule about **divergence between two runners**, and the fabric has exactly one runner.
A green run from that one runner is internally consistent by construction and therefore cannot
falsify it — which is the property this spec already recorded when it noted that a replay could not
have found delta **R** even with the predicate implemented. What would exercise §5.1 is a leg that
puts an emitted record and a directly observed outcome **in disagreement on purpose** and reads the
report, and that leg does not exist in [`../scenarios/`](../scenarios/) today. The single count
above is **restated and does not move** — it is still *fold R, then re-validate* — and neither §9
nor §5.1 closes it or touches `structure_matches`: R is a **comparison** basis and §5.1 fixes an
**evidence** basis. Rewriting the emitting implementation against this text is downstream work under
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**.

**Which rule a promotion would be under, when one comes.** KCS 0.2.0 was ratified under the
**previous** rule and grandfathered past the conformance artefact; the debt was named and was paid on
2026-08-19 ([`README.md`](README.md#the-ratification-gate)). The grandfather clause does not survive
a demotion, so 0.3.0 re-enters at the **ordinary, conformance-gated** rule: a future promotion needs
a clean re-validation **and** the machine-replayable artefact, which for this spec is the attempt at
the nine documents and is the part already paid.

## Changelog

- **0.4.0** (2026-09-12) — **Candidate.** Added **§9, the exchange record**, and **§5.1, the
  evidence-precedence rule** — two halves of one fold, published together because the first is
  unsafe without the second. §9 is the emitted-telemetry
  shape a participant in the console role has been shipping and this format had never specified.
  It was not academic: §5's `cost_within_ceiling`, `tier_resolved` and `refused` are asserted in the
  cited downstream live run **over frames carrying that shape**, so a predicate this format defines
  was being decided off a document this format did not describe. **Emission stays OPTIONAL and the
  section says so in a NORMATIVE clause** — a participant that emits nothing is fully conformant,
  [`capability-bus.md`](capability-bus.md) §4.3g's rule on this plane — and the reason is measured
  rather than polite: OpenTelemetry's trace SDK makes a `DROP` sampling decision conformant, so a
  clause requiring emission would require what the whole standardised field declines to require.
  It follows that **an absent record asserts nothing**, the reading koine already writes at KCB
  §4.5(c), KCB §4.2b, KMI §2 and KMI §7.1. What §9 fixes is **observation**: where a record *is*
  emitted, what it says and what an observer may rely on it for.
  **The fold is gated by a dated prior-art sweep**
  ([`../docs/reference/kcs-telemetry-prior-art.md`](../docs/reference/kcs-telemetry-prior-art.md),
  read 2026-09-12 and dated as a **first** reading — no koine spec had ever cited this prior art in
  writing), under [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) /
  [ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md)'s
  profile-by-reference-or-mint-and-record discipline. The verdict is a **split**: standardised work
  covers **three** of the record's eleven facts and not the eight that make it evidentiary rather
  than diagnostic, so **correlation is profiled by reference** — a **W3C Trace Context** `trace-id`,
  pinned at **Level 1 (Recommendation 2021-11-23)** in
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md), whose row
  moves to ✅ with this citation — and the rest is **minted here**. **OpenTelemetry is resembled,
  not adopted**, and therefore takes no pin: no §9 clause delegates to it and no §9 field is defined
  by it.
  **The two substantive reconciliations are answered in the text rather than inherited from the
  implementation.** *Spend denominates its unit* (§9c) — an amount with no unit is **not evidence**
  for `cost_within_ceiling` and reads *unstated*, never *within* and never zero; KCB §5 already
  refuses an `invoke` **for want of** a stated unit when a ceiling crosses an authority-domain
  boundary, and a record reporting spend against that ceiling in no unit cannot be compared to it.
  *`status` is a CLOSED enum* (§9d) — `ok` · `refused` · `failed` · `unknown`, with a free-form
  detail permitted only beside `refused`/`failed` (OpenTelemetry's own `Status` rule), because a
  field documented free-form and consumed as closed is two conformant readers with two readings of
  one document — delta **R**'s class of defect, on a field rather than a predicate.
  **The carrier is named rather than assumed** (§9f): a record is an entry in §4's **observation
  log**, discriminated by `kind: "exchange"` and read where every other observation is read, and
  the one carrier KCS does **not** own is stated as *not specified here* — KCB §4.2d mints the one
  in-band control channel and §7.3g is the one place its frame vocabulary is named, so §9 names no
  frame. That is deliberate: *a rule with a declared normative consequence and nothing that carries
  it* is a defect filed **eight** times across these specs, and §9 declines to be the ninth.
  **§9 mints nothing a sibling already defines** — verbs from KCB §4, the `(name, version)` pair
  from KCB §7.1, parties and `refs` as KINP §3.1 ids, world from KINP §5, ceiling and spend as KCB
  §5's `budget_units` **with** a unit, timestamps in KGP §3.2's fixed UTC form — and it disambiguates
  the **three axes this fabric calls *tier***, fixing `tier` as the **provenance trust tier**
  ([`../policy/trust-tiers.json`](../policy/trust-tiers.json)) and never KGP §5's dialect tier or
  KCB's `free`/`paid` price tier.
  **The other half of the same publication is §5.1, the evidence-precedence rule, and it could not
  stay informative.** §9 fixes what a record *says*; §5.1 fixes what it is *worth* when a step
  carries **both** an emitted record and an outcome the runner observed itself. Three predicates are
  decidable off either — `tier_resolved`, `cost_within_ceiling` and `refused`, the three already
  being asserted downstream over frames of that shape — and nothing said which decided, so two
  conformant runners resolving one disagreement differently would have produced **different
  conformance reports from one run**: delta **R**'s defect moved from the *comparison* axis onto the
  *evidence* axis. §5.1 states the property it exists to guarantee **first**, in the text, so that a
  later revision can be measured against it: *two conformant runners evaluating one run MUST reach
  the same verdict for each of these three predicates.* Four clauses make it true. **(a) A direct
  observation outranks an attributed record, always, and the reverse ordering is forbidden** — not a
  preference but §9(a)'s own argument followed through: this class of data is droppable by
  construction, so a record is a *declaration* and never a *measurement*, and conformance evidence a
  subject can author by choosing what to emit is not evidence. **(b) Binding comes before
  comparison** — a record binds to a step on the facts §9(b) states and **never** on timing
  proximity or log adjacency, because two runners that bound different records would diverge before
  the ordering rule was ever reached. **(c) Four cases, exhaustively**, in a table a runner
  implements directly. **(d) A disagreement is reported, never resolved** — the assertion **fails**
  and the report carries **both** readings, each named by the evidence kind and, for a record, by
  its emitter's KINP id; the ordering of (a) fixes which account a runner may report as its own
  finding and does not make a contradiction disappear, and §4's report being **content-addressed**
  means a silently resolved divergence is not merely invisible but *reproducibly* invisible, which
  is precisely how R's divergence hides. It mints **no new report verdict** — a disagreement is a
  fail — and (e) fixes what a disagreement *is*: comparison on the predicate's own fact and never on
  the record as a whole; an **absence is never a disagreement**, so an unstated `tier`, an absent
  ceiling or an un-denominated amount (§9c) may not be defaulted into a comparison; and where both
  parties emit, a runner holds **two attributions and merges nothing** —
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) read on this plane.
  **Minor, and the reasoning is stated rather than assumed.** §9 and §5.1 are both new normative
  surface a reader implements against, which alone is a minor; but the decisive fact is that **§5.1
  changes how three existing §5 predicates evaluate**, so this is **not a patch**. The change is in
  the last row of §5.1(c): a predicate for which the runner holds **neither** an observation nor a
  bound record now **fails**, where before this section a `cost_within_ceiling` could be read as
  passing on the ground that nothing refused the `invoke`. That reading is the fail-open inversion
  this fabric refuses by name elsewhere ([`capability-bus.md`](capability-bus.md) §4.4c's forbidden
  *highest published* default, [`media-interchange.md`](media-interchange.md) §7.1's unreachable
  store that is a pending fetch and never a conclusion), and closing it is a narrowing of how a
  conformant runner may evaluate — which is what makes the bump a minor on the nose rather than by
  courtesy. Everything else is **additive**: §2's document shape, §2.1's bindings, §3's step
  vocabulary and §4's execution and observation model are unchanged; **no predicate is added,
  removed or re-signatured**; no step, field, participant entry, binding or report verdict is
  minted; **no schema twin is added** (KCS has none for §2 either, and one section is the wrong
  unit); and a 0.3.0 scenario runs identically against participants that emit nothing, a run with no
  records being decided entirely by the first and last rows of (c). The three status mirrors
  ([`../README.md`](../README.md), [`README.md`](README.md),
  [`../ECOSYSTEM.md`](../ECOSYSTEM.md)) move with the header, as
  `scripts/check-doc-integrity.mjs` enforces.
  **What it does to §7 question 1 is the opposite of what a fold usually does — it makes it
  larger.** That question's second half is *a fixed core is only fixed if something checks it*,
  recorded on **DR-10**'s evidence (the downstream §5 vocabulary omits `structure_matches`, the
  predicate the 0.3.0 fold *is*, and declares a `media_map_complete` this spec names nowhere, while
  every document it replays declares `kcs_version: 0.3.0`, and the check meant to catch it is a
  hardcoded count of names). §5.1 is fixed-core surface **a name check cannot see**: two runners may
  agree on every predicate name and still return different reports, because the evidence rule those
  names are evaluated under appears nowhere in a scenario document — §2 declares a `kcs_version` and
  no evidence profile, and §5.1 deliberately adds no field to change that. The runner-side
  declaration the question contemplates would therefore have to cover the vocabulary version **and**
  the evidence rule. Recorded in §7 question 1; **not closed here**.
  **KCS stays Candidate, and this fold closes nothing.** The single count is *fold R, then
  re-validate*, and it is **restated and unmoved**: delta **R** — `structure_matches`'s open
  **comparison** basis — is untouched and still **unowned**, and §5.1 fixing an **evidence** basis
  does not supply it, since a runner given this rule tomorrow would still have to invent R's.
  **DR-10** is still downstream work under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and unowned. Both new sections are
  recorded in *Pressure test* as **published, not exercised**, and §5.1 is the sharper of the two:
  it is a rule about **divergence between two runners** and the fabric has exactly one, so a green
  run from that runner is internally consistent by construction and cannot falsify it — the same
  property this spec already recorded when it noted that a replay could not have found R. Rewriting
  the emitting implementation against the folded text is the implementer's work, not koine's.

- **Editorial** (2026-09-03) — Recorded the **re-validation of the 0.3.0 determinism fold**, walked
  by hand on 2026-09-03 against
  [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) (§ *Re-validation — KCS
  0.3.0, walked 2026-09-03*), in *Pressure test* and against §7.2. **It is not clean, and the single
  count does not close.** The regression set flips — **M**, **N**, **O** and the assertion half of
  **P**, three of them corroborated by the 2026-08-24 run rather than by the reading alone — and **P**
  carries one declared residual (no run has exceeded a `timeout_ms`, so §4's fails-liveness path is
  unexercised; a suite-coverage gap, not a delta). **Delta Q half-flips.** Byte equality is forbidden
  normatively and that half is clean; the other half — catching a renderer that changed the output
  shape — does not close, because §5 constrains `structure_matches` only **negatively** and fixes its
  comparison basis nowhere: no declaration slot in §2/§3 (and the signature is fixed at two operands),
  no plane clause behind the *Determinism/invariants* group where every other §5 predicate has one,
  and two operands that are hashes of deliberately-differing bytes and so must be dereferenced to
  something §5 never names. Two conformant runners, two verdicts, one document, and a
  content-addressed report that hides the divergence: new blocking delta **R**. Which evidence carried
  which delta is stated per delta in the walk, deliberately — reading a replay as a full verdict is
  the error **DR-7**/**DR-8** record against [`capability-bus.md`](capability-bus.md) — and **Q was
  hand-walked by necessity**, since **DR-10** leaves the runner without the predicate. DR-10 is
  thereby **discharged as a qualification** exactly as the 2026-08-26 entry framed it (a hand-walk
  could do what a replay could not), and R is what was under it; a replay could not have found R even
  with the predicate implemented, because one runner is internally consistent. The drift stays
  **downstream and unowned** under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) — koine
  specifies the vocabulary, the console implements it — and is not closed from this repo. §7.2 is
  **not reopened**: the fold is *incomplete*, and its clause stands. **Editorial, and deliberately
  so:** every normative surface is byte-unchanged — §2's document shape, §2.1's bindings, §3's step
  vocabulary, §4's execution and observation model, §5's assertion vocabulary — no MUST/SHOULD is
  added or altered, and what moved is a *Pressure test* record, a §7.2 evidence note and this entry.
  **KCS stays 0.3.0 Candidate**, on the same single count, which changed shape from *re-validate the
  fold* to **fold R, then re-validate again** — a normal minor revision gated by a pressure test, and
  unowned. When a promotion does come it is under the **ordinary, conformance-gated** rule, not the
  grandfathering KCS 0.2.0 had: that clause does not survive a demotion, and the artefact debt it
  covered was paid on 2026-08-19.

- **Editorial** (2026-08-26) — Recorded what **downstream use** of this format produced, in
  *Pressure test* and against §7's open questions. KCS is the one spec whose conformance artefact is
  earned by use rather than by a run, and the use happened: **nine** scenario documents were written
  in KCS 0.3.0 downstream and all nine parse, replay over real MCP/A2A links, and produce a
  content-addressed report — positive evidence for the format at a scale no single scenario supplies,
  exercising deltas **M**, **O**, **N** and **P**. Three findings from that run are recorded where
  they bear. **DR-10** — the runner's §5 vocabulary omits `structure_matches`, the predicate the
  0.3.0 fold *is*, and declares a `media_map_complete` this spec names nowhere, while every document
  it replays declares `kcs_version: 0.3.0`: so delta **Q** is unexercised downstream and the pending
  re-validation cannot be discharged by a machine replay of the folded clause, though a hand-walk of
  Attempt 3 still can. That is a **qualification on the existing re-validation, not a second gate**.
  §7.1 gains a recorded second half from it — whether a fixed core needs a conformance obligation on
  the *runner* (declare the vocabulary version you implement; reject a document declaring one you do
  not), since the check that was meant to catch the drift is a hardcoded count of eighteen names
  rather than a comparison against §5 — and §7.1 also gains the positive counterpart: the escape
  hatch this question leans toward was used exactly as imagined, twice, by different authors
  (**V-8**, **MA-11**), both times as *declared* console extensions. **DR-2** is recorded against
  §7.3: the run artifact carries a per-scenario aggregate rather than pass/fail per assertion with
  its cited clause, which a conformant runner may do — §2 has no per-assertion spec-section field
  (§8 *Traceability*) — but it means [`README.md`](README.md#the-ratification-gate)'s consuming gate
  cannot be satisfied from the report alone, making §7.3 a **report-shape** question as much as a
  payload-retention one. **Editorial, and deliberately so:** every normative surface is
  byte-unchanged — §2's document shape, §2.1's bindings, §3's step vocabulary, §4's execution and
  observation model, §5's assertion vocabulary — no MUST/SHOULD is added or altered, and what moved
  is recorded evidence under two already-open §7 questions plus a *Pressure test* note. KCS stays
  **0.3.0 Candidate** on the same single re-validation.

- **0.3.0** (2026-08-20) — **Candidate.** Folded the determinism question forced by Attempt 3
  (`kcs:generated-output-invariants`) in [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md):
  added the fixed-core `structure_matches(a, b)` predicate and the normative rule that generated
  output scenarios assert stable structure/invariants rather than exact bytes/content. Existing
  §5 assertions and the §3 step vocabulary are unchanged and backward-compatible. The normative
  change returns KCS to candidate for re-validation; §7.1 assertion extensibility and §7.3
  recording fidelity remain open.

- **Editorial** (2026-08-13) — Added an **informative note to §4** that a scenario driving MCP
  participants must record **which MCP revision each participant speaks**, because MCP's 2026-07-28
  revision made the core stateless and the two wires are **not interchangeable** — a green run on one
  is not evidence for the other. The version facts live in one place and are not restated here: the
  pin and its per-verb consequences are [`capability-bus.md`](capability-bus.md) §1.1/§4.1, and the
  fabric-wide table is [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md). The note is
  addressed to the **console**, as a recommendation on what the observation log and report carry —
  reporting fidelity, the subject of §7 open question 3, and not an RFC-2119 obligation — and
  deliberately mints nothing in the scenario document: no `participants[]` field, no step, no binding. **No normative change:** §2's document
  shape, §2.1's bindings, §3's step vocabulary, §4's four-stage execution model, §5's assertion
  vocabulary and §7's open questions are unchanged, no MUST/SHOULD over a *scenario* is added or
  altered, and KCS stays **0.2.0 Ratified**.

- **Editorial** (2026-08-13) — Added **§8.1**, a forward note recording five conformance-program
  designs the 2026-08 sweep found worth borrowing — capability-config-selected cases plus
  known-failure baselines (connectrpc), frozen per-revision requirement sets plus explicit
  not-scored reasons (MCP), Condition/Sequence/TestModule/Plan composition (the OpenID conformance
  suite), YAML rubrics with JMESPath expressions carrying a `specSection` (C2PA), and an executor
  abstraction (Venom) — each named with the section it would touch. **None is adopted**, and the
  note says so: taking any of them up is a normal minor revision gated by a pressure test, not an
  editorial change. **Rationale and prior art only — no normative change:** §2's document shape,
  §3's step vocabulary, §4's execution/observation model, §5's assertions and §7's open questions
  are unchanged, and KCS stays **0.2.0 Ratified**. The index descriptions in
  [`../README.md`](../README.md), [`../specs/README.md`](../specs/README.md) and
  [`../ECOSYSTEM.md`](../ECOSYSTEM.md) were restated in the same pass to say what KCS is; they are
  mirrors of this spec and carry no clause.
- **Editorial** (2026-08-13) — Added **§8**, an informative prior-art section recording the
  contract-testing prior art KCS had never engaged in writing: **Pact / consumer-driven contract
  testing** is cited and distinguished on both axes — Pact is **bilateral** (one consumer, one
  provider, one pact) and **mock-based** (consumer expectations replayed against a stub, provider
  verified against a recorded pact, never against the live counterpart), where a KCS scenario drives
  **N real participants over their actual MCP/A2A connections** (§2, §4) — plus the capability no
  pact can express, the **cross-plane assertion vocabulary** (`firewall_holds`, `claims_converge`,
  `cost_within_ceiling`, `always_completes`, §5), which spans planes and participants rather than a
  single request/response pair, and the traceability §3/§5 already carry by citing named clauses of
  the four plane specs. The nearest agent-protocol equivalent (A2A's own test kit — **45★** as of
  the **2026-08** sweep, declarative only in its participant matrix) is recorded **dated**, so the
  claim ages visibly. **Rationale and prior art only — no normative change:** the scenario document
  shape (§2), step vocabulary (§3), execution/observation model (§4), and assertion vocabulary (§5)
  are unchanged, no MUST/SHOULD clause is added, removed, or altered in meaning, and KCS stays
  **0.2.0 Ratified**. The narrative version is [`../docs/reference/positioning.md`](../docs/reference/positioning.md)
  *Prior art considered*; where the two differ, this spec wins.
- **Editorial** (2026-07-31) — Agnostic reframe, part 2: the §2 `participants` example uses the
  KINP §3.4 illustrative placeholder namespaces, and the §6 pointer names a downstream
  conformance console rather than a specific repo. No normative change — the scenario document
  shape, step vocabulary, assertion vocabulary, and every MUST/SHOULD clause are unchanged.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.2.0** (2026-07-18) — **Ratified.** Folded format-stress deltas: step bindings (M),
  expected-rejection steps + `refused` (O), stand-in participants (N), timeouts (P).
- **0.1.0** (2026-07-18) — Initial candidate draft.
