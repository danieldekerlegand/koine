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

**Delta R is not in the table above, deliberately.** It was returned by the **2026-09-03
re-validation** of the folded text, not by this pass, and this table is the record of what the
original pass found. R is defined once, in *Re-validation — KCS 0.3.0, walked 2026-09-03*, under
*Findings — from the re-validation*.

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

**DR-10 after 2026-09-03 — the qualification is discharged, the drift is not.** The spec recorded
DR-10 as a *qualification* on KCS's pending re-validation rather than a second gate, because a
hand-walk could still do what a replay could not. That walk is the next section, and it happened —
so consequence (1) no longer blocks the re-validation, which returned its own verdict instead
(**delta R**). Consequence (2), the drift itself, is **untouched**: the runner's vocabulary still
omits `structure_matches` and still declares `media_map_complete`. It stays **downstream work under
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and unowned**, and koine does not close
it — this repo specifies the §5 vocabulary and does not hold the console that implements it.

---

## Re-validation — KCS 0.3.0, walked 2026-09-03

**What this section is.** KCS returned to `candidate` when **0.3.0** folded the determinism break
Attempt 3 produced (delta **Q**: the fixed-core `structure_matches(a, b)` predicate and the
normative stable-invariant rule). The single count named in
[`../specs/conformance-scenario.md`](../specs/conformance-scenario.md) *Pressure test* is a
**re-validation of that fold against this document**, and this section is that re-validation:
every attempt above re-walked against **KCS 0.3.0 as published**, with a verdict recorded **per
delta** rather than in aggregate.

**Which half is a replay and which is a hand-walk — stated, because mixing them silently is the
failure DR-7 and DR-8 record one directory over.** A green encoding is evidence for the
assertions it encodes and for nothing else, so the two kinds of evidence are kept apart here and
labelled per delta:

| Evidence | Covers | Why |
|---|---|---|
| **Replay** — the 2026-08-24 run of `kcs:format-stress`, plus the nine documents that parse and replay (`## Downstream results` above) | **M**, **N**, **O**, and the *assertion* half of **P** | These deltas were folded at **0.2.0** and the runner implements them; the run asserts each one by name. They are the **regression set** of this pass, not its subject. |
| **Hand-walk** — this section, against the prose of §2/§2.1/§3/§4/§5 | **Q** in full, the *firing* half of **P**, and a re-read of the clause behind every replayed delta | **DR-10**: the downstream §5 vocabulary omits `structure_matches`, so no encoded document can assert the predicate the fold *is*. The spec says a hand-walk of Attempt 3 still discharges the count, and this is that hand-walk. |

**Method.** Same bias the pressure tests declare — *prefer finding breaks over asserting
correctness*. Attempts 1 and 2 are the regression set; **Attempt 3 is the fold under test.**

### Per-delta verdicts

| Delta | Attempt | Evidence | Verdict |
|---|---|---|---|
| **M** — step `id` + `${id.path}` bindings | 1 | replay + clause re-read | ✅ **Flips.** §2.1 names the exact case (a provisional-local id an `invoke` mints) and the run bound three assertions, one with *both* operands bound. |
| **N** — `standin` participants | 2 | replay + clause re-read | ✅ **Flips.** §2 carries `standin`; the run recorded it on all thirteen stubbed slots. |
| **O** — `expect: ok\|reject` + `refused(step)` | 2 | replay + clause re-read | ✅ **Flips.** §3 and §5 both carry it; the run ran both negative paths as negative paths. |
| **P** — `timeout_ms` | 2 | replay (assertion half) + hand-walk (firing half) | ✅ **Flips in prose**, with a declared residual: the bound exists and §4 says what exceeding it does, but a green run never exceeded one. |
| **Q** — `structure_matches` + the stable-invariant rule | 3 | hand-walk only (DR-10) | 🔴 **Half-flips.** The byte-equality half closes normatively; the catch-a-changed-shape half does not → new delta **R**. |

### Attempt 1, delta M ✅ *flips*

Attempt 1's break was the `???` operand: the `extract` step mints a provisional-local entity id at
run time (KINP §6) and nothing could name it. §2.1 now gives every step an `id` and makes its
output addressable as `${<step-id>.<path>}`, and it enumerates this case first — *"the
provisional-local entity id an `invoke` mints (KINP §6)"*. The broken line is writable as
`based_on_exists(${extract.output.entity}, refkb:ent:napoleon-i)`, and the `resolve` step's
descriptor threads the same way. *Corroborated by replay:* the run asserted `claim_in_world` over a
minted claim id and `based_on_exists` over what the extraction produced — Attempt 1's exact broken
line, run.

### Attempt 2, deltas N and O ✅ *flip*

**N.** §2 admits `"standin": { "fixtures": … }` on a participant and requires the console to record
that the participant was stubbed, which is what makes a scenario runnable before the media provider
adopts the bus. *Corroborated by replay:* thirteen stubbed slots, each recorded in the report.

**O.** §3 gives a step `expect: "ok" | "reject"` (default `ok`) and states the inversion — with
`reject` the step *passes* when the call is refused and fails if it unexpectedly succeeds — and §5
carries `refused(step)`. *Corroborated by replay:* a refused `fetch` on the media plane and an
over-ceiling `invoke` on the control plane both ran as negative paths instead of aborting the run.
Neither KCB security property was testable at all before this delta, which is why O was blocking.

### Attempt 2, delta P ✅ *flips in prose* — 🟡 *one declared residual*

The break was that `completes` / `always_completes` presuppose a bound KCS did not declare, so a
hung provider hangs the scenario instead of failing the liveness assertion. Both halves are now
present: §2 carries a scenario-level `timeout_ms` and §3 a per-step one, and §4 step 2 states the
consequence — *"a step exceeding its `timeout_ms` fails liveness rather than hanging the run."*

🟡 **Residual, declared.** The replay corroborates that the liveness assertions exist and pass; it
does **not** corroborate the firing path, because a green run never exceeded a timeout. What is
unexercised is the transition from *exceeded* to *fails liveness*, and no encoded document forces
it. That is a coverage gap in the suite, not a gap in the clause — §4 states the behaviour
completely — so it is recorded rather than opened as a delta. A scenario that deliberately hangs a
stand-in would close it, and writing one is downstream work.

### Attempt 3, delta Q 🔴 *half-flips* → new delta **R**

Attempt 3's sketch was re-encoded line by line against 0.3.0 and **every line is writable**: the
`${setup.*}` operands bind under §2.1 (*"Setup-seeded ids bind the same way"*), the two `invoke`
steps run in declared order under §3, the four KMI assertions name runtime-bound assets under delta
M, and `structure_matches(${first.output.asset}, ${second.output.asset})` is now in §5's fixed
core. So the *expressibility* break is gone.

The break Attempt 3 recorded had two halves, and only one of them closes.

**Closed — the byte-equality half.** Attempt 3: *"Asserting byte equality would incorrectly reject
a valid replay."* §5 answers that normatively and by name: *"This predicate MUST NOT be interpreted
as byte equality,"* backed by the rule that a scenario over generated output MUST assert stable
structure/invariants rather than exact generated content, with the carve-out for where exact
content **is** the contract. That is a clean fold and it is not in question below.

**Not closed — the catch-a-changed-shape half.** Attempt 3's other clause: *"omitting the
relationship leaves the scenario unable to catch a renderer that changes the output shape."* The
relationship is no longer omitted, but §5 fixes only what the predicate is **not**. Its positive
content is *"their declared structural or cross-plane invariants match — for example, the same
attachment target, source world, or constituent topology"*, and three things were tried against
that and held up as gaps:

- **There is no declaration site.** *Declared* names a slot the format does not have. §2's document
  shape has none, §3's step vocabulary has none, an `assert` step carries only `that`, and §5 fixes
  the signature at **two** operands. A scenario therefore cannot say *which* invariants it requires
  to match. A three-operand form naming them would not be §5's predicate — it would be a declared
  console extension under §7.1, which puts the **fixed core's own** determinism predicate on the
  escape hatch, an odd place for this fold to land.
- **There is no plane anchor.** Every other §5 predicate delegates its meaning to a named clause
  one plane over — `asset_attaches_to` and `source_world_is` to KINP §7.2 / KMI §2,
  `cost_within_ceiling` to KCB §5, `claim_in_world` to KGP, `refused(step)` to §3's own `expect`.
  The *Determinism/invariants* group has no plane behind it, and no clause of KINP, KGP, KMI or KCB
  defines the structural invariants of a **generated** output. The nearest specified vocabulary is
  one reach away and unreached: KMI §3's `media:derived_from` / `media:variant_of` /
  `media:perceptual_match`, the last of which carries confidence and provenance and is *explicitly
  never identity* — the same discipline `structure_matches` needs, stated from the other side.
- **The operands cannot be compared to each other.** Both are KINP `asset` ids, and an `asset` id is
  the **hash of the bytes** (KMI §2, §7.1). Attempt 3's premise is that the bytes differ by design,
  so the two operands are *guaranteed* unequal and the predicate must dereference them to something
  before it can be true of anything. §5 does not say to what.

**Consequence, in both directions.** A runner picking a permissive basis (both operands resolve to
media assets) returns true for a renderer that changed the output shape — the exact harm Attempt 3
named. A runner picking a maximal basis (every envelope field, or the ids themselves) returns false
for a valid replay — the harm §5 forbids by name, arriving through the front door instead of
through "byte equality," which the clause does not reach because comparing two content-addressed
ids is id equality and only *amounts* to byte equality. Both runners are conformant to §5 as
written, so **one document has two truth values**, and §4's report is content-addressable, which
means the divergence is invisible in the artefact rather than flagged by it.

**What R is not.** Not §7.1: the escape hatch is for predicates §5 **cannot express**, and it was
used exactly so, twice (V-8, MA-11); R is about a predicate §5 **does** express with an open basis,
and §7.1's recorded second half is about a runner declaring which vocabulary *version* it
implements. Not **DR-10** either: DR-10 is a **name** missing downstream, R is a **meaning**
missing here, and a runner that added the name tomorrow would still have to invent the basis.

#### A correction to Attempt 3's own sketch — recorded, not applied

The sketch asserts `source_world_is(${first.output.asset}, ${setup.world})` on the output of
`transform:cap:render`. KMI §2 delta H says generated/synthesized assets — *"a TTS narration, a
composed score, a **render**"* — depict no world and take `source_world: null`. So both `*_world`
lines as sketched assert a value KMI forbids on that asset, and the Attempt's prose premise
(*"remains in the requested world"*) is not a property a generated asset has. §5's signature is
`source_world_is(asset, world|null)`, so the format expresses the correct assertion —
`source_world_is(${first.output.asset}, null)` — with no delta: **this is a defect in the sketch,
not in KCS.** It is recorded here rather than edited into Attempt 3, which is the record of the
2026-08-20 pass and stays as written.

It does not touch delta Q, which was produced by the byte-differ problem and is untouched by it. It
**sharpens R**: with the world assertions corrected, one of the three invariants §5 offers by
example — source world — is `null` on both sides for *every* generated output and so distinguishes
nothing, and attachment target is already asserted individually by the two lines above it. What is
left as `structure_matches`'s marginal content is *"constituent topology"* and whatever else the
runner decides to look at.

### Findings — from the re-validation

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **R** | **High — blocking** | `structure_matches(a, b)` is admitted to the fixed core with only a **negative** constraint (MUST NOT be byte equality). Its comparison basis is fixed nowhere: the format has no slot in which a scenario declares which invariants must match, no plane spec defines the structural invariants of a generated output, and both operands are content hashes of deliberately-differing bytes, so the predicate must dereference them to something §5 does not name. Two conformant runners may return different verdicts for one document, and the content-addressed report makes the divergence invisible. | Fix the basis in §5 by delegating it to named clauses (KINP §7.2 `attaches_to`, KMI §2 `source_world`, KMI §3's lineage relations), **or** give §2/§3 a declaration slot so a scenario names the invariants it requires to match. Either is a normal minor revision gated by a pressure test — **not** folded here, which is a read-and-confirm pass. | §5, §7.2; and §2/§3 under the second option |

### Verdict — not clean; KCS stays **0.3.0 Candidate**

The **regression set flips**: M, N, O and P are all closed by 0.3.0's inherited text, and three of
the four are corroborated by a run rather than by this reading alone. The **fold under test
half-flips**: byte equality is forbidden normatively, and the harm on the other side — a renderer
that changes the output shape — is still uncatchable, because the predicate that was supposed to
catch it does not say what it compares. **Delta R is blocking, and it is the only thing blocking**;
KCS's status does not move.

**DR-10's qualification is discharged by this walk, and R is what was under it.** The spec recorded
DR-10 as *a qualification on the existing re-validation, not a second gate*, on the grounds that a
hand-walk of Attempt 3 could still discharge what a machine replay could not. That is what
happened. Worth recording plainly: a replay could not have found **R** even with the predicate
implemented downstream, because a single runner is internally consistent — an open comparison basis
is invisible from inside one implementation of it and shows up only in a read of the clause. That
is an argument *for* the hand-walk requirement, not a complaint about it.
