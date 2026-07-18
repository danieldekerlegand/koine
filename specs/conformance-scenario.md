# Koine Conformance-Scenario format (KCS)

**Spec version:** 0.2.0
**Status:** Ratified
**Last updated:** 2026-07-18
**Applies to:** the `agora` conformance console (executor) and every project (participant)
**Depends on:** [`identity.md`](identity.md) (KINP), [`grounding-pack.md`](grounding-pack.md)
(KGP), [`capability-bus.md`](capability-bus.md) (KCB), [`media-interchange.md`](media-interchange.md)
(KMI); governed by [`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md).

> A **conformance scenario** is a declarative, replayable script that drives *any combination*
> of the five platforms — in any order — over their **real** MCP/A2A connections, and asserts
> what was observed. It is the executable form of the hand-written pressure tests
> (`../scenarios/*.md`). Why this belongs in koine and not just in `agora`: a scenario step is
> typed against all four planes (a KCB `invoke`, a KGP claim, a KINP id, a KMI asset), so the
> *format* is a cross-cutting contract; only the console's UI/runtime lives in `agora`.

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
    { "identity": "pinakes:agent:resolver", "planes": ["knowledge"] },
    { "identity": "argos:agent:pipeline",   "planes": ["media", "knowledge"] },
    { "identity": "formant:agent:composer", "planes": ["media"],
      "standin": { "fixtures": "fixtures/formant-composer.json" } }  // not-yet-adopted (delta N)
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
  (4-project transform chain; cross-plane ports, fetch, source_world, cost ceilings).

Encoding them is the `agora-console-scenarios` tasklist (see `../tasks/chief/`).

## 7. Open questions

1. **Assertion extensibility** — a fixed vocabulary (§5) vs. a small predicate DSL over the
   observation log. Leaning: fixed core + an escape hatch.
2. **Determinism** — model outputs vary; scenarios must assert *structure/invariants* (firewall,
   cost, world-scoping), not exact generated content. How strictly to enforce this in the format.
3. **Recording fidelity** — how much stream payload the observation log retains vs. references by
   id (ties to KMI byte transport).

## Pressure test

Exercised by [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) (encoding
both hand-written scenarios as KCS). Deltas folded in 0.2.0: **M** (step `id` + `${id.path}`
bindings, §2.1/§3), **O** (`expect: ok|reject` + `refused`, §3/§5), **N** (`standin`
participants, §2), **P** (`timeout_ms`, §2/§3/§4). Ratified.

## Changelog

- **0.2.0** (2026-07-18) — **Ratified.** Folded format-stress deltas: step bindings (M),
  expected-rejection steps + `refused` (O), stand-in participants (N), timeouts (P).
- **0.1.0** (2026-07-18) — Initial candidate draft.
