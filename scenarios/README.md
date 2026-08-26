# koine/scenarios — the pressure tests that gate ratification

A **conformance scenario** is a hand-written, end-to-end story that pushes concrete data through
several participants at once and, at every step, marks what *held* and what *broke*. A scenario's
method is adversarial on purpose: **prefer finding breaks over asserting correctness**. Each break
becomes a numbered **delta** that must be folded into a spec before that spec is promoted
`draft → candidate → ratified`. These twelve documents are the executable-in-prose form of that
gate; the [`conformance-scenario.md`](../specs/conformance-scenario.md) (KCS) format is how a
scenario is later encoded so the downstream console can replay it over real MCP/A2A connections.

**Prose is no longer enough for the second promotion.** Under [the ratification gate](../specs/README.md#the-ratification-gate)
a hand-walked pass is what earns `draft → candidate`, but `candidate → ratified` now requires the
**machine-replayable KCS encoding** of that pass — a document a conformant participant can actually
run. Every document below is therefore two things at once: the pressure test it already was, and the
source text for an encoding. **Nine of the twelve now have one**, built and run downstream; the
three newest do not. The **KCS encoding** column says, per scenario, exactly where that stands, and
what the 2026-08-24 run of it did.

## The scenarios

| Scenario | Pressure-tests | What it hunts | Deltas | KCS encoding |
|---|---|---|---|---|
| [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) | KINP ([`../specs/identity.md`](../specs/identity.md)), then KGP ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) | The **identity firewall** — a fiction NPC `based_on` real Napoleon flowing world-producer → knowledge-producer → identity-authority, so fictional facts never contaminate consensus reality. Its *Re-validation* pass then re-runs the claim-minting legs against KGP 0.5.1's retained canonical + RDF projection. | A–E, KGP-1/2 ✅ | ✅ **exists** — `kcs:worlds-to-fabric` · agora `console/src/kcs/scenarios/worlds-to-fabric.ts`. **Ran 2026-08-24, the one fully-live scenario (3/3)** → [results](e2e-worlds-to-fabric.md#downstream-results) |
| [`e2e-media-transform.md`](e2e-media-transform.md) | KCB + KMI ([`../specs/capability-bus.md`](../specs/capability-bus.md), [`../specs/media-interchange.md`](../specs/media-interchange.md)) | **Any-to-any across four participants** — discovery + cross-plane path planning (mood→score), cross-participant CAS byte-fetch, spend ceilings, and the media→knowledge bridge. | F–L | ✅ **exists** — `kcs:media-transform` · agora `console/src/kcs/scenarios/media-transform.ts`. Ran 2026-08-24, green, composer stood in → [results](e2e-media-transform.md#downstream-results) |
| [`kmi-otio-roundtrip.md`](kmi-otio-roundtrip.md) | KMI §4.2a / §9.5 | **Additive metadata survival** — a third-party OTIO round-trip drops the KINP asset-id carrier and leaves only stale or local paths, forcing an answer on safe id re-attachment. | M-1 | ⚠️ **exists, but** (*focused pressure leg* — follow-up to `e2e-media-transform`) — `kcs:kmi-otio-roundtrip` · agora `console/src/kcs/scenarios/kmi-otio-roundtrip.ts`, which is `kcs:media-transform` re-titled over the same fixture, so **M-1 is unexercised** ([DR-4](kmi-otio-roundtrip.md#findings-from-the-downstream-run)) → [results](kmi-otio-roundtrip.md#downstream-results) |
| [`e2e-finetune.md`](e2e-finetune.md) | KFT ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | The seams KFT **adds** on top of the four planes — the KGP egress gate, model-as-entity identity, and weight/export artifact conventions — on two text finetune jobs. | FT-A…H | ✅ **exists** — `kcs:finetune` · agora `console/src/kcs/scenarios/finetune.ts`. Ran 2026-08-24, green; suite pins **KFT 0.5.0** ([DR-5](e2e-finetune.md#findings-from-the-downstream-run)) → [results](e2e-finetune.md#downstream-results) |
| [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md) | KFT, second pass | **Fully-multimodal** finetunes (image-text-to-text, text-to-video) over KMI assets, plus the **multi-provider** topology (a general provider + a specialist provider, routed by the registry). | FT-I…L | ✅ **exists** — `kcs:finetune-multimodal` · agora `console/src/kcs/scenarios/finetune-multimodal.ts`. Ran 2026-08-24, green; both trainer slots stood in ([DR-6](e2e-finetune.md#findings-from-the-downstream-run)) → [results](e2e-finetune-multimodal.md#downstream-results) |
| [`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md) | KFT, third pass | A producing **application's own training exhaust** (accepted edits, generations, preference pairs, QA labels) offered as a training set through the thin adapter of [`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md) — a corpus that is neither KGP claims nor image/video/audio bytes, arriving from a producer rather than an authority. | FT-M…Q | ✅ **exists** — `kcs:producer-exhaust-finetune` · agora `console/src/kcs/scenarios/producer-exhaust-finetune.ts`. Ran 2026-08-24, green → [results](e2e-producer-exhaust-finetune.md#downstream-results) |
| [`kft-resume-checkpoint.md`](kft-resume-checkpoint.md) | KFT §11.3 ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | **Resuming an interrupted run** — §6 calls a checkpoint *resumable* and §3 has no slot that can name one, so the FT-C reproducibility anchor stops determining the run and the only slot that accepts the ref is the one no gate reads. Confirms the warm-start half of §11.3 first, then breaks the resume half. | FT-R…V | ⬜ **absent** (*focused pressure leg* — follow-up to `e2e-producer-exhaust-finetune`; **folded into KFT 0.6.0**, and a re-run against the folded text is one of KFT's two gates) — the tenth scenario, landed after the nine were built; **no encoding, no run, no owner** ([DR-11](kft-resume-checkpoint.md#findings-from-the-absence-of-a-downstream-run)), so that gate is unrunnable and KFT fails the conformance gate on that count. It is one of the **two** rows `agora`'s set-equality coverage gate goes red on → [results](kft-resume-checkpoint.md#downstream-results) |
| [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) | KCB §7 ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | **Evolution without a break** — a provider widens, re-prices, mutates-without-bumping, then ships a capability **v2 beside v1** and retires v1, all while a **live subscriber** keeps running. Hunts the one invariant of [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md): *a subscriber never learns of a break by failing.* | V-1…V-8 | ✅ **exists, and must be extended** — `kcs:live-schema-mutation` · agora `console/src/kcs/scenarios/live-schema-mutation.ts`. Ran 2026-08-24 and came back **green over four blocking deltas** ([DR-7](e2e-live-schema-mutation.md#findings-from-the-downstream-run)). Those deltas were **folded at KCB 0.5.0** on 2026-08-26, so the encoding now asserts a subset that predates the fold: the extended set it needs is [**F1–F13**](e2e-live-schema-mutation.md#conformance-case-the-assertions-the-folded-text-requires-kcb-050), ten of thirteen needing declared console extensions (V-8). **Unowned.** → [results](e2e-live-schema-mutation.md#downstream-results) |
| [`e2e-multi-authority.md`](e2e-multi-authority.md) | KINP §11.1 + KCB §3.1 + KMI §7.1 ([`../specs/identity.md`](../specs/identity.md), [`../specs/capability-bus.md`](../specs/capability-bus.md), [`../specs/media-interchange.md`](../specs/media-interchange.md)) | **Federation without a privileged holder** — two independently built authority domains compose into one fabric: cross-authority `same_as` reconciliation, peering registries, and per-project CAS replication on reference. Hunts the three hazards [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) names — a firewall bypassed, a peered record that cannot be attributed, a replicated copy that loses identity, provenance or availability. | MA-1…MA-11 | ✅ **exists** — `kcs:multi-authority` · agora `console/src/kcs/scenarios/multi-authority.ts`. Ran 2026-08-24 and came back **green over six blocking deltas**, with every live slot in domain A ([DR-8](e2e-multi-authority.md#findings-from-the-downstream-run), [DR-9](e2e-multi-authority.md#findings-from-the-downstream-run)) → [results](e2e-multi-authority.md#downstream-results) |
| [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md) | KCB §8.1 ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | **A firehose world drowns its subscriber** — the last open question KCB has. Hunts whether `cost` + spend ceilings (§2.1/§5) reach a *stream* at all, what a saturated subscriber may do other than disconnect, and whether the host §8.1 parks flow control on is even on the path that ADR-0001 routes peer-to-peer. | BP-1…BP-6 | ⬜ **absent** (*focused pressure leg* — follow-up to `e2e-live-schema-mutation`; **folded into KCB 0.4.7**, and a re-run against the folded text is the fourth of KCB's gates) — the **eleventh** scenario, landed 2026-08-26, after the nine were built and two days after they ran; **no encoding, no run, no owner** ([DR-12](kcb-subscription-firehose.md#findings-from-the-absence-of-a-downstream-run)), so §4.2 has no runnable document citing it and KCB is not promotable on that count. It is the **second** row `agora`'s set-equality coverage gate goes red on → [results](kcb-subscription-firehose.md#downstream-results) |
| [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md) | KCB §4.3 ([`../specs/capability-bus.md`](../specs/capability-bus.md)) + [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md) | **A caller's autonomy posture crosses an ownership boundary** — the two cross-owner edges of [`../ECOSYSTEM.md`](../ECOSYSTEM.md) §3, walked with a caller whose rule is *nothing a person cannot undo tomorrow runs unattended*. Hunts whether the fabric can state that rule at all, which posture wins when caller and callee disagree, and whether a posture survives a delegated leg to a third owner the caller never sees. | AP-1…AP-8 | ⬜ **absent** (*focused pressure leg* — follow-up to `kcb-subscription-firehose`; **folded into KCB 0.4.8**, and a re-run against the folded text is the fifth of KCB's gates) — the **twelfth** scenario, landed 2026-08-26, after the nine were built and two days after they ran; **no encoding, no run, no owner** ([DR-13](kcb-cross-owner-posture.md#findings-from-the-absence-of-a-downstream-run)), so §4.3 has no runnable document citing it and KCB is not promotable on that count. It is the **third** row `agora`'s set-equality coverage gate goes red on → [results](kcb-cross-owner-posture.md#downstream-results) |
| [`kcs-format-stress.md`](kcs-format-stress.md) | KCS ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | The **scenario format itself** — by trying to encode the other hand-written scenarios above as KCS documents and finding where the format can't express what they need. | KCS deltas | ✅ **exists** — `kcs:format-stress` · agora `console/src/kcs/scenarios/format-stress.ts`. Ran 2026-08-24, green — but KCS's artefact is the *attempt* at the nine above, not this run (see below), and that attempt drifted from §5 ([DR-10](kcs-format-stress.md#findings-from-the-downstream-run)) → [results](kcs-format-stress.md#downstream-results) |

## How a scenario reads

Each is a **story** (a plain-language request), a **setup** (the participants and the manifests
they publish, in the KINP §3.4 placeholder namespaces — `worldsim` / `analyzer` / `refkb` /
`mediastore`), then **numbered steps** each tagged ✅ *held* or 🔴/🟡 *broke*, and a **Findings**
table collecting the deltas with a severity and which spec clause they land in. A scenario that has
served its purpose keeps a **Resolution** note recording which spec version folded its deltas, and
stands thereafter as the historical record of what the pressure test found.

Concrete deltas already folded: KINP A–E (→ 0.2.0), KCB/KMI F–L (→ KCB 0.2.0 / KMI 0.2.0), KFT
FT-A…L (→ KFT 0.3.0) and **FT-M…Q** (→ KFT 0.4.0, from the third pass; additive intake fields, so KFT
returns Ratified → **candidate** pending owner re-ratification — see that scenario's *Re-validation —
KFT 0.4.0* section). **KGP 0.5.0**'s standards decision
([`../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md))
has been re-validated against [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) (see its
*Re-validation* section — claim-id convergence, the §7 filters, and every projection's round-trip all
hold). Its two minor projection findings, **KGP-1/KGP-2**, are **closed** in **KGP 0.5.1** (§4's
ProbLog rule and §4.1's annotation vocabulary); KGP nonetheless stays **candidate** on the one
remaining gate — the downstream RDF-star / PROV / JSON-LD **round-trip fixture**, a validator
artifact per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md).
**KMI**'s OTIO adoption has been re-validated against
[`e2e-media-transform.md`](e2e-media-transform.md) (see its *Re-validation* section — the additive
layer holds, no delta reopened). Both **KCB 0.4.0** and **KMI 0.3.1** nonetheless remain
**candidate** pending a re-run of the same scenario against KCB's AgentCard-extension manifest
shape, which its discovery steps exercise; KCB carries a **second** gate on top of it — the §7.5
break-test of its versioning section, which has now **landed and been run**
([`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md)) and did **not** pass clean: deltas
**V-1…V-8**, blocking **V-2/V-4/V-5/V-7**, all additively foldable into a KCB **0.5.0** minor.
**V-1…V-7 were folded on 2026-08-26** (`chief/86`) at exactly that version — **KCB 0.5.0**, which
also discharges §2.2's long-declared standalone-manifest removal — with V-8 closed unfolded as
evidence for KCS §7 open question 1, two remainders deferred with triggers and the shape-registry
alternative rejected on the record. **KCB nevertheless stays candidate**: a fold does not close its
own gate, so that count now reads as a **re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded
text**, and it has not happened. That scenario's *Fold status* section re-reads each finding against
the folded spec; its *Re-ratification — what this pass gates* section states what a clean re-run
would license; and its new *Conformance case* section is the assertion set (**F1–F13**) the KCS
encoding must grow before a re-run can assert the fold at all (**DR-7**).

**KCB's autonomy-posture clause** — the boundary half of **G5**, authorized by
[ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md) and specified as **§4.3** in KCB
0.4.8 — is gated by [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md), which did **not** pass
clean either: deltas **AP-1…AP-8**, blocking **AP-5** (a truthfully-declared read-only capability
re-dispatches to a third owner and makes the caller's data permanent, because the effective posture is
computed pairwise and evaporates at the second hop while spend propagates by grant). Every one is
additive. That is a **fifth** count against the same KCB candidate, gating §4.3 alone.

**KCB's §8.1 backpressure question** — its last open one — has now been pressure-tested by
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md), which also did **not** pass clean:
deltas **BP-1…BP-6**, blocking **BP-3/BP-5**, every one additive. Its sharpest finding is not that
the host's cost advisor is inadequate but that §3's route-by-lookup-not-proxy rule keeps it **off the
stream path**, so the parking assignment cannot be discharged downstream by anyone. That is a
**fourth** count against the same KCB candidate; its *Re-ratification — what this pass gates* section
carries the per-spec table and the dated **Resolution**.

The **three federation §-edits** — [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md)
applied to KINP §11 decision 1, KCB §3.1 and KMI §7.1 — are gated the same way, by
[`e2e-multi-authority.md`](e2e-multi-authority.md), which has now landed and been run and also did
**not** pass clean: deltas **MA-1…MA-11**, blocking **MA-1…MA-6**, every one additive. **MA-1…MA-10
were folded on 2026-08-26** (`chief/85`) — **KINP 0.4.0**, **KMI 0.3.5**, **KCB 0.4.9**, with KGP
taking an Editorial entry and no version move, and MA-11 closed unfolded as evidence for KCS §7 open
question 1. **All three specs nevertheless stay candidate**: a fold does not close its own gate, so
each count now reads as a **re-run of that pass against the folded text**, and that re-run has not
happened. That pass is still the whole of KINP's gate, one of KCB's four counts, and one of KMI's
two. Its *Fold status* section re-reads each finding against the folded specs, and
*Re-ratification — what this pass gates* carries the per-spec table, what a clean re-run would
license, and the dated **Resolution**.

## The KCS encodings — nine of twelve exist, and the other three are the ratification tail

> **Corrected 2026-08-26 by `84-record-the-downstream-results`.** From 2026-08-19 to this date this
> section and the column above said `planned` nine times while all nine encodings existed. They were
> built downstream at `agora/console/src/kcs/scenarios/` (`agora chief/75`, merged `f853240`) and the
> suite was run over live MCP/A2A links (`agora chief/76`, merged `f32508e`); the column was
> deliberately left stale until the run could be recorded alongside it, because a column reading
> `exists` above ten empty `## Downstream results` sections would have traded one wrong reading for
> another. Both halves land together here: the sections are populated and the column is flipped.
> Verified against the artifacts rather than a `passes` flag —
> [`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

Read the **KCS encoding** column honestly: it says `exists` **nine** times — one of them
(`kcs:kmi-otio-roundtrip`) marked ⚠️ because a finding records it does not exercise the row it sits
in, and four more carrying a finding of the kind that qualifies what the run proved — and `absent`
**three times**. A cell with no finding on it is the only cell that reads clean. Nine of the twelve
pressure tests in this directory are now documents a participant can be handed as well as prose a
person walked. The other three — [`kft-resume-checkpoint.md`](kft-resume-checkpoint.md),
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md) and
[`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md) — are the whole of what remains of
the ratification tail, and since [the ratification gate](../specs/README.md#the-ratification-gate)
that tail is load-bearing rather than aspirational — no spec reaches `ratified` until its scenario
is on the other side of it, which today costs **KFT** and **KCB §4.2 / §4.3** and no one else.

The column's three states mean:

- **exists** — a machine-replayable KCS document is checked in, and a conformant participant can run
  it over its real MCP/A2A connections. Only this state satisfies the gate. A ⚠️ on it means the
  document exists and ran, but a named finding records that it does not exercise what its row
  claims — the count is met, the content is not.
- **planned** — the encoding is owned by a named tasklist and not yet built. **No row reads this
  today**; the state is kept because the next scenario added to this directory starts here.
- **absent** — no encoding and no owner. A spec whose scenario reads `absent` cannot be ratified and
  has nothing scheduled that would change that; the honest move is to schedule it, not to promote
  the spec.

**Why the three `absent` rows are not `planned`.**
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md) landed with `chief/69`,
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md) with `chief/70` and
[`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md) with `chief/71`, all on 2026-08-26,
after the nine encodings were built, and nothing owns encoding any of them. The consequence is
downstream and deliberate: `agora`'s `console/src/kcs/scenarios/coverage.test.ts` asserts
set-equality between its `KOINE_SCENARIOS` list and this directory's `*.md`, so it goes **red**
against a koine checkout at this commit and the failure names **all three** prose documents that
have no encoding (its `KOINE_SCENARIOS.length === 9` assertion is three short of twelve) — which is
exactly what that gate is for, and is the standing cross-repo obligation of adding a file here.

**These two registers must agree, and this one is the register of record.** The **KCS encoding**
column above is restated in [`../ROADMAP.md`](../ROADMAP.md) **Phase F4**; when the two disagree,
this column is the one to read and the ROADMAP restatement is the bug — the same rule the spec
version/status tables follow. Neither, however, is the *source*: both are derived from artifacts that
live downstream — the encodings at `agora/console/src/kcs/scenarios/` and the run record at
`agora/console/evidence/kcs-live-run.json` — so a disagreement with those is closed by
**re-verifying against them** ([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)),
never by editing this prose to match a memory. koine holds no link to that repo in any spec, schema,
registry, or policy file, and this pointer stays README-level for that reason.

**A second gap survived the console.** An attempt to encode a producer-conformance
exercise as a KCS document — [`../docs/reference/interop-trial.md`](../docs/reference/interop-trial.md),
finding **INT-11** — found that KCS §3's step vocabulary and §5's assertions range over *interactions
between live participants*, and that no step means *"here is an artefact; is it conformant?"*. That
is the first verdict a third-party implementer needs and the one they cannot currently obtain, since
they have nobody to run against. Recorded against a **ratified** spec, so it is a re-open candidate
for KCS's owner rather than anything scheduled here.

**Who built them.** Encoding and running are downstream runtime work, not contract work
([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)): koine specifies the format (KCS) and
holds the prose; the console that replays a KCS document lives in a runtime commons. Both halves are
tracked in [`../ROADMAP.md`](../ROADMAP.md) **Phase F4**, and both are **delivered** —
`agora chief/75-encode-scenarios-as-kcs` (merged `f853240`) encoded nine of the documents above and
`agora chief/76-run-kcs-over-live-links` (merged `f32508e`) ran the suite over real connections,
using **delta-N `standin`** fixtures for the thirteen participant slots nobody has adopted yet
(**DR-1**). Those two tasklists were the only path by which a spec could earn the artefact its
ratification now requires, which is why Phase F4 sat on the critical path rather than beside it; what
is left of that path is the three unencoded scenarios.

**`kcs-format-stress.md` is the exception, and deliberately so.** Its subject is the format itself,
so the artefact that exercises KCS's clauses is not a run *of* it — it is the attempt to encode the
other scenarios *in* it, and every place the format could not say what a scenario needed. That is
what produced its deltas, and it is why KCS is the one spec whose conformance artefact is earned by
**use** rather than by a run (the full argument, and why it is not circular, is in
[`../specs/README.md`](../specs/README.md#the-ratification-gate)). Practically: `agora chief/75`
discharged KCS's debt as a by-product of discharging everyone else's — and, being an attempt rather
than a run, it is also where the attempt's own drift from §5 shows up, recorded as **DR-10**.

## Downstream results — where a real run's result lands

A KCS document that has been run produces a result, and that result has to land somewhere a
ratification gate can read. It lands **here**, in the scenario it ran: each scenario gains a
**`## Downstream results`** section, appended once a run has actually happened, recording per run —

- the **run date**;
- the **participants by role** (producer / consumer / authority / host / provider) — roles, never
  product names or endpoints, per this repo's standing rule;
- **pass / fail per assertion**, each assertion carrying the spec clause it cites; and
- for a failure, the finding it opens or the existing delta it reopens.

The section stays **instance-free and role-scoped**: a real deployment's hosts, endpoints, and
topology are instance data and stay in the operator's private integration repo. What koine records is
that *some* conformant participant in a given role passed or failed a clause-cited assertion — which
is all a gate needs and all a contracts repo may hold.

**Which gate consumes it.** The spec-owner ratification gate does, on both promotions it governs: a
re-ratification (ROADMAP Phase 1) **MAY** cite a recorded downstream pass as evidence alongside the
hand-walked re-validation, and **MUST** reopen a finding that a recorded downstream failure
contradicts. A recorded result never promotes a spec on its own — promotion stays the owner's
deliberate act — but an owner may no longer promote *past* a recorded failure without answering it.

### The run of record — 2026-08-24

One downstream run has happened and it is recorded, per scenario, in the scenario it ran. The
suite-level facts, so no scenario has to restate them:

| | |
|---|---|
| Evidence | `sha256-2d9e6c43b36f4aac9c4caafa8baa17cb58dc05be8612dd15b2d24bb6f0c17bb3`, generated **2026-08-24T22:00:37Z**, held downstream at `console/evidence/kcs-live-run.json` and regenerable by one committed command |
| Verified by | [`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md) — read off the artifacts, not off a status line |
| KCS version | 0.3.0 (as declared by every document — but see **DR-10**) |
| Scope | **nine** scenarios, **32** participant slots, **19 live** / 13 delta-N stand-in (**59%**) |
| Suite verdict | `green: true` · `live_pass: false` · **`partial-live`** · `transport_failures: []` |
| Fully live | **one** — `kcs:worlds-to-fabric` (3/3). Every other scenario stood in for at least one participant. |

**What `green` means and does not mean.** Per the runner, a scenario is `green` when every step and
every assertion it encodes passed with no transport failure. It does **not** mean the pressure test
came out clean: two of the nine replay scenarios koine records as *not* clean
([`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md), V-1…V-8 · four blocking, folded at KCB
0.5.0 **after** this run;
[`e2e-multi-authority.md`](e2e-multi-authority.md), MA-1…MA-11 · six blocking) and both come back
green, because the encodings deliberately do not assert an unfolded delta. Reading `green` as "the
spec holds" is a larger version of the mistake this repo already made once with `passes: true`.

### Findings from the run — DR-1…DR-13

Each is defined **once**, in the document it bites, in that document's `## Downstream results`
section. This table is the index, not a second copy.

| # | Severity | Where it is defined | In one line |
|---|---|---|---|
| DR-1 | Minor | *here* | 13 of 32 participant slots were stand-ins; only one scenario ran fully live |
| DR-2 | Minor | *here* | The evidence artifact records a per-scenario aggregate, not pass/fail per assertion with its cited clause |
| DR-3 | High | [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md#findings-from-the-downstream-run) | The KGP **R3** projection round-trip is not encoded, so the fully-live pass does not touch KGP's outstanding fixture gate |
| DR-4 | High | [`kmi-otio-roundtrip.md`](kmi-otio-roundtrip.md#findings-from-the-downstream-run) | Its encoding is `kcs:media-transform` re-titled; **M-1** and the KMI 0.3.3 fold are unexercised |
| DR-5 | High | [`e2e-finetune.md`](e2e-finetune.md#findings-from-the-downstream-run) | The suite pins KFT 0.5.0 and asserts nothing over §3.3's conversion round-trip or §8.1's graded refusals |
| DR-6 | Minor | [`e2e-finetune.md`](e2e-finetune.md#findings-from-the-downstream-run) | The **training-provider** role is a stand-in in all three KFT passes; no live participant has held it |
| DR-7 | High | [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md#findings-from-the-downstream-run) | `green` over a pass with four blocking deltas open; V-2/V-7 are replayed but deliberately unasserted |
| DR-8 | High | [`e2e-multi-authority.md`](e2e-multi-authority.md#findings-from-the-downstream-run) | `green` over a pass with six blocking deltas open; MA-1…MA-5 and MA-8/MA-9 are replayed but unasserted |
| DR-9 | Minor | [`e2e-multi-authority.md`](e2e-multi-authority.md#findings-from-the-downstream-run) | Every live slot sits in domain **A** — the federation was tested against a recorded far side |
| DR-10 | High | [`kcs-format-stress.md`](kcs-format-stress.md#findings-from-the-downstream-run) | The downstream §5 vocabulary drifted from KCS §5 both ways: no `structure_matches`, plus a `media_map_complete` koine does not name |
| DR-11 | **Blocking** (KFT) | [`kft-resume-checkpoint.md`](kft-resume-checkpoint.md#findings-from-the-absence-of-a-downstream-run) | The tenth scenario has no encoding and no run, so KFT loses the artefact gate |
| DR-12 | **Blocking** (KCB §4.2) | [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md#findings-from-the-absence-of-a-downstream-run) | The eleventh scenario has no encoding and no run, so KCB loses the artefact gate on its §4.2 count alone |
| DR-13 | **Blocking** (KCB §4.3) | [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md#findings-from-the-absence-of-a-downstream-run) | The twelfth scenario has no encoding and no run, so KCB loses the artefact gate on its §4.3 count alone |

#### DR-1 — 59% live, and the stand-ins are not randomly placed

Nineteen of thirty-two participant slots were live over real MCP/A2A links; the other thirteen were
delta-N `standin` recordings for roles nobody has adopted. Promotion of a slot from stand-in to live
is a **cast change, not a document change**, so this closes by adoption and never by an edit.

What matters more than the percentage is *which* slots. In every scenario but one, the stand-in is
the participant the scenario is about on the far side — the composer in the media passes, the
trainer in all three KFT passes (**DR-6**), the provider that mutates in the KCB §7 break-test, the
entire second domain in the federation break-test (**DR-9**). A recorded counterparty answers the
way the fixture author expected, which is the one thing an adversarial pressure test is trying not
to rely on.

#### DR-2 — the artifact records aggregates, not clause-cited assertions

The shape this section asks for is *pass/fail per assertion, each assertion carrying the spec clause
it cites*. What the committed artifact carries is per **scenario**: `green`, live/stand-in coverage,
the cast, and `transport_failures`. Per-assertion results exist in the run's own conformance report
but are not what koine can cite, and there is no `clause` field on an assertion — **KCS does not
define one**; traceability today is by step title and by the §5 predicate's own citation.

Consequence: a recorded result can tell an owner *this scenario's encoded assertions held*, and
cannot tell them *this clause was exercised and passed*. Every `## Downstream results` section in
this directory therefore names the clauses by hand, read off the encoding — which is honest but is
prose, and will drift. Closing it properly is a **KCS** question (a per-assertion `clause` field, or
a report shape that carries one), which makes it a re-open input for KCS's owner alongside `INT-11`
and the V-8/MA-11 extension evidence — not a defect in the run.
