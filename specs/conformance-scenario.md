# Koine Conformance-Scenario format (KCS)

**Spec version:** 0.3.0
**Status:** Candidate
**Last updated:** 2026-09-03
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
observation model** (§4), and the **cross-plane assertion vocabulary** (§5). It does not define
the console UI, transport internals (that's MCP/A2A + KCB), or payload formats (KGP/KMI/KINP).

## 2. Scenario document

```jsonc
{
  "kcs_version": "0.3.0",
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

**Which rule a promotion would be under, when one comes.** KCS 0.2.0 was ratified under the
**previous** rule and grandfathered past the conformance artefact; the debt was named and was paid on
2026-08-19 ([`README.md`](README.md#the-ratification-gate)). The grandfather clause does not survive
a demotion, so 0.3.0 re-enters at the **ordinary, conformance-gated** rule: a future promotion needs
a clean re-validation **and** the machine-replayable artefact, which for this spec is the attempt at
the nine documents and is the part already paid.

## Changelog

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
