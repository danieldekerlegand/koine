# Koine Conformance-Scenario format (KCS)

**Spec version:** 0.2.0
**Status:** Ratified
**Last updated:** 2026-07-18
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
  "kcs_version": "0.2.0",
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
2. **Determinism** — model outputs vary; scenarios must assert *structure/invariants* (firewall,
   cost, world-scoping), not exact generated content. How strictly to enforce this in the format.
3. **Recording fidelity** — how much stream payload the observation log retains vs. references by
   id (ties to KMI byte transport).

## 8. Prior art considered (rationale, INFORMATIVE)

This section records the contract-testing prior art KCS was measured against and why the format
looks the way it does. It is **informative**: it binds no clause, and the scenario document (§2),
the step vocabulary (§3), the execution and observation model (§4), and the cross-plane assertion
vocabulary (§5) are unchanged by it. Dated data points come from a prior-art sweep of **2026-08**
and are stated with their dates so the claim ages visibly. The narrative version lives in
[`../docs/positioning.md`](../docs/positioning.md) *Prior art considered*; where the two disagree,
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
both hand-written scenarios as KCS). Deltas folded in 0.2.0: **M** (step `id` + `${id.path}`
bindings, §2.1/§3), **O** (`expect: ok|reject` + `refused`, §3/§5), **N** (`standin`
participants, §2), **P** (`timeout_ms`, §2/§3/§4). Ratified.

## Changelog

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
  **0.2.0 Ratified**. The narrative version is [`../docs/positioning.md`](../docs/positioning.md)
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
