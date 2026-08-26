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

---

## Attempt 3 — `kcs:generated-output-invariants`

Encoding a replay of a transform with the same input and two valid, independently generated
outputs. The generated bytes are intentionally allowed to differ; the scenario must still
prove that each output is a media asset attached to the requested entity and remains in the
requested world.

```jsonc
"steps": [
  { "id": "first", "step": "invoke", "capability": "transform:cap:render",
    "inputs": [{ "plane": "media", "asset": "${setup.source_asset}" }] },
  { "id": "second", "step": "invoke", "capability": "transform:cap:render",
    "inputs": [{ "plane": "media", "asset": "${setup.source_asset}" }] },
  { "id": "first_attachment", "step": "assert",
    "that": "asset_attaches_to(${first.output.asset}, ${setup.subject})" },
  { "id": "second_attachment", "step": "assert",
    "that": "asset_attaches_to(${second.output.asset}, ${setup.subject})" },
  { "id": "first_world", "step": "assert",
    "that": "source_world_is(${first.output.asset}, ${setup.world})" },
  { "id": "second_world", "step": "assert",
    "that": "source_world_is(${second.output.asset}, ${setup.world})" },
  { "id": "same_shape", "step": "assert",
    "that": "structure_matches(${first.output.asset}, ${second.output.asset})" }
]
```

🔴 **BROKE (§7.2, determinism).** `asset_attaches_to` can check each output's invariant, but the
fixed §5 vocabulary has no assertion for the required relationship that both generated assets
share the same structure while their generated content may differ. Asserting byte equality would
incorrectly reject a valid replay; omitting the relationship leaves the scenario unable to catch
a renderer that changes the output shape. The pressure break is therefore the determinism rule:
KCS needs a specified way to express and enforce structure/invariant assertions without requiring
exact generated content.

✅ **Held:** the observation model records both invocations and their responses, and the existing
media assertions can name each runtime-bound asset. Only the determinism question is carried
forward; assertion extensibility and recording fidelity remain open.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**Run of 2026-08-24** · encoding `kcs:format-stress` · KCS 0.3.0 · evidence
`sha256-2d9e6c43…c17bb3`, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

| | |
|---|---|
| Participants, by role | knowledge **producer** (`analyzer`, live) · media **provider** (`mediastore` composer, **stand-in**) |
| Over what links | **1 of 2 live** (50%) |
| Encoded as | 8 steps + **11** assertions, of which **2** are `expect: reject` |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**The run is the smaller half of the evidence here, and deliberately so.** This document's subject
is the format, so KCS's conformance artefact is earned by **use** — the attempt to encode the other
scenarios *in* it — not by a run of this one. The load-bearing downstream fact is therefore not the
green line below but the thing that made every other section in this directory possible: **nine
documents were written in KCS 0.3.0 and all nine parse, replay and produce a content-addressed
report.** That is positive evidence for the format at a scale no single scenario supplies.

**What passed.** Every encoded assertion, each one carrying a delta this document produced:

- **Delta M** (bind a step's output and assert over it) — three assertions name values that did not
  exist when the document was written: `claim_in_world` over a minted claim id, `based_on_exists`
  over what the extraction produced (Attempt 1's exact broken line, now writable), and
  `asset_attaches_to` with **both** operands bound at once.
- **Delta O** (`expect: reject` + `refused(step)`) — both negative paths ran as negative paths
  rather than aborting the run: a refused `fetch` on the media plane and an over-ceiling `invoke` on
  the control plane. Without delta O neither KCB security property was testable at all.
- **Delta P** (a timing bound) — `completes` on a step and `always_completes` on the scenario, which
  is what makes the liveness assertion about liveness rather than about patience.
- Held from Attempt 2 unchanged: `capability_path_exists` (cross-plane path planning is expressible
  as the format stands — which is what let the media-transform encoding exist), `cost_within_ceiling`
  and `source_world_is` over a bound asset id, and a concurrent branch running beside its sibling.

**What the run does not say.** Attempt 3 — the generated-output determinism leg that produced delta
**Q** and KCS **0.3.0**'s `structure_matches(a, b)` — has no encoded counterpart, because the
predicate does not exist downstream. See **DR-10**; it is a vocabulary-drift finding, not a failure
of this pass.

**Corroboration from two neighbours.** KCS §7 open question 1 (*a fixed core plus an escape hatch*)
now has two independent pieces of evidence produced by construction rather than by argument:
`e2e-live-schema-mutation.md`'s **V-8** needed five predicates §5 cannot express, and
`e2e-multi-authority.md`'s **MA-11** needed four more, and both sets were built as **declared console
extensions** and reported as such rather than smuggled into §5. The escape hatch was used exactly
as the open question imagines it, twice, by different authors of different scenarios. That is a
re-open input for KCS's owner against a **ratified** spec, alongside `INT-11`.

### Findings — from the downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-10 | **High** | The downstream §5 vocabulary has drifted from KCS §5 **in both directions**. It omits `structure_matches(a, b)` — the fixed-core predicate KCS **0.3.0** added as delta **Q**, from Attempt 3 above — and it declares `media_map_complete`, a name KCS §5 does not contain and koine holds nowhere. Every encoded document nonetheless declares `kcs_version: 0.3.0`. The check that was supposed to catch this is a **hardcoded count of 18**, not a comparison against koine's text, and 18 is coincidentally what both lists happen to hold. | Two consequences. (1) KCS 0.3.0's determinism fold is **unexercised**: no document can assert `structure_matches`, so the normative rule that generated-output scenarios test stable structure rather than exact bytes has no machine-replayable evidence, and Attempt 3 is unclosed downstream. (2) A document declaring `kcs_version: 0.3.0` is being replayed by a **0.2.0-shaped** vocabulary, which is precisely the silent-version-drift hazard KCB §7.2 names one plane over. Fixing the count gate into a drift gate against koine's §5 is downstream work ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)); unowned today. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).
