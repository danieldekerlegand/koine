# Scenario: encoding the pressure tests in KCS (format stress test)

**Purpose:** pressure-test the [Koine Conformance-Scenario format](../specs/conformance-scenario.md)
(KCS 0.1.0) by actually trying to encode the two hand-written pressure tests
(`e2e-worlds-to-fabric`, `e2e-media-transform`) as KCS documents. The test is the format
itself: where can't it express what the scenarios need? Same method as the other pressure
tests — findings feed deltas that must land before ratifying KCS.

---

## Attempt 1 — `kcs:worlds-to-fabric`

Encoding the identity-firewall scenario: seed a world-producer world + a fiction entity
`based_on` a real entity, have a knowledge producer ingest footage of it and extract a claim,
the identity authority reconciles, then assert the firewall.

```jsonc
"steps": [
  { "step": "invoke", "capability": "analyzer:cap:extract",
    "inputs": [{ "plane": "media", "asset": "…" }] },      // → mints a provisional local entity
  { "step": "resolve", "descriptor": { "name": "…", "world": "worldsim:world:alderforest" } },
  { "step": "assert", "that": "based_on_exists( ??? , refkb:ent:napoleon-i )" }
]
```

🔴 **BROKE (M, structural).** The `extract` step **mints a provisional-local entity id at run
time** (KINP §6) — but there is no way to **name a step's output** and reference it later. The
`assert` needs "the entity `extract` produced," and `resolve` needs "the descriptor `extract`
found," but KCS §2/§3 give steps no `id` and no reference syntax. Every multi-step scenario
that threads a runtime value (a minted id, a reconcile result, a pack_id) is inexpressible.
**Delta M: step `id` + a binding/reference mechanism.**

✅ **Held:** the assertion vocabulary (§5 `based_on_exists`, `firewall_holds`, `claim_in_world`)
covers the firewall properties once M lets assertions name their operands.

---

## Attempt 2 — `kcs:media-transform`

Encoding the 4-participant trailer chain: a world producer + a knowledge producer + a media
producer + an identity authority + the host-provisioned registry; a transform path; a `fetch`;
cost ceilings.

```jsonc
"participants": [
  { "identity": "analyzer:agent:pipeline",   "planes": ["media","knowledge"] },
  { "identity": "mediastore:agent:composer", "planes": ["media"] },   // not adopted KCB yet
  ...
]
```

🔴 **BROKE (N).** The media producer is a *planned* KCB provider (capability-bus §6: "consumer
now, provider later"). A scenario that needs it today can't run — and KCS has no way to declare
a **stand-in** for a not-yet-adopted participant. The downstream conformance-console tasklist
already anticipates "documented stand-ins," but the format doesn't express them. **Delta N: participants may declare
a stand-in/fixture source.**

🔴 **BROKE (O, structural).** The scenario asserts **negative paths**: an *unauthorized* `fetch`
must be **rejected** (KCB `fetch:asset` grant), and an *over-ceiling* `invoke` must **refuse the
paid tier**. But a KCS step has no notion of an *expected* outcome — a rejected `fetch` looks
like a scenario failure and aborts the run. There is no `refused(step)` assertion either.
**Delta O: steps carry `expect: ok | reject` (default `ok`); add `refused(step)` to §5.**

🟡 **BROKE (P, minor).** `always_completes` / `completes(step)` (§5) presuppose a bound on how
long a step may run, but KCS declares no **timeout**. A hung provider would hang the scenario
rather than fail the liveness assertion. **Delta P: optional `timeout_ms` per step/scenario.**

✅ **Held:** cross-plane path + cost + source_world assertions (§5 `capability_path_exists`,
`cost_within_ceiling`, `source_world_is`) express the positive-path invariants; `after: […]`
(§3) expresses the interleavings.

---

## Findings

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| M | **High** | No way to name a step's output / a runtime-minted id and reference it later. | Every step gets an `id`; a `${stepId.path}` reference resolves prior outputs (and setup-seeded ids). | §2, §3 |
| O | **High** | Steps can't declare an expected **rejection**, so negative-path scenarios abort. | `expect: ok\|reject` per step (default `ok`); add `refused(step)` to the assertion vocab. | §3, §5 |
| N | Med | No stand-in for a not-yet-adopted participant. | Participants may declare `standin` + a fixture source, so scenarios run before full adoption. | §2 |
| P | Minor | No timeout backs the liveness assertions. | Optional `timeout_ms` per step/scenario. | §2, §4 |

## Verdict

The **assertion vocabulary and execution model hold** — the format can *express the invariants*
the scenarios check. The breaks are all in **data-threading and negative paths**: without step
bindings (M) a multi-step scenario can't reference what earlier steps produced, and without
expected-outcome (O) it can't test refusals — and refusals (unauthorized fetch, over-budget) are
exactly the KCB security properties we most want to verify. M and O are blocking; N and P are
should-fix. None require reshaping the model.
