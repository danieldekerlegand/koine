# koine/scenarios — the pressure tests that gate ratification

A **conformance scenario** is a hand-written, end-to-end story that pushes concrete data through
several participants at once and, at every step, marks what *held* and what *broke*. A scenario's
method is adversarial on purpose: **prefer finding breaks over asserting correctness**. Each break
becomes a numbered **delta** that must be folded into a spec before that spec is promoted
`draft → candidate → ratified`. These seven documents are the executable-in-prose form of that
gate; the [`conformance-scenario.md`](../specs/conformance-scenario.md) (KCS) format is how a
scenario is later encoded so the downstream console can replay it over real MCP/A2A connections.

**Prose is no longer enough for the second promotion.** Under [the ratification gate](../specs/README.md#the-ratification-gate)
a hand-walked pass is what earns `draft → candidate`, but `candidate → ratified` now requires the
**machine-replayable KCS encoding** of that pass — a document a conformant participant can actually
run. Every document below is therefore two things at once: the pressure test it already was, and the
source text for an encoding that does not exist yet. The **KCS encoding** column says, per scenario,
exactly where that stands.

## The scenarios

| Scenario | Pressure-tests | What it hunts | Deltas | KCS encoding |
|---|---|---|---|---|
| [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) | KINP ([`../specs/identity.md`](../specs/identity.md)), then KGP ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) | The **identity firewall** — a fiction NPC `based_on` real Napoleon flowing world-producer → knowledge-producer → identity-authority, so fictional facts never contaminate consensus reality. Its *Re-validation* pass then re-runs the claim-minting legs against KGP 0.5.1's retained canonical + RDF projection. | A–E, KGP-1/2 ✅ | ⬜ **planned** — `kcs:worlds-to-fabric` (F4 · `62`) |
| [`e2e-media-transform.md`](e2e-media-transform.md) | KCB + KMI ([`../specs/capability-bus.md`](../specs/capability-bus.md), [`../specs/media-interchange.md`](../specs/media-interchange.md)) | **Any-to-any across four participants** — discovery + cross-plane path planning (mood→score), cross-participant CAS byte-fetch, spend ceilings, and the media→knowledge bridge. | F–L | ⬜ **planned** — `kcs:media-transform` (F4 · `62`) |
| [`e2e-finetune.md`](e2e-finetune.md) | KFT ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | The seams KFT **adds** on top of the four planes — the KGP egress gate, model-as-entity identity, and weight/export artifact conventions — on two text finetune jobs. | FT-A…H | ⬜ **planned** — `kcs:finetune` (F4 · `62`) |
| [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md) | KFT, second pass | **Fully-multimodal** finetunes (image-text-to-text, text-to-video) over KMI assets, plus the **multi-provider** topology (a general provider + a specialist provider, routed by the registry). | FT-I…L | ⬜ **planned** — `kcs:finetune-multimodal` (F4 · `62`) |
| [`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md) | KFT, third pass | A producing **application's own training exhaust** (accepted edits, generations, preference pairs, QA labels) offered as a training set through the thin adapter of [`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md) — a corpus that is neither KGP claims nor image/video/audio bytes, arriving from a producer rather than an authority. | FT-M…Q | ⬜ **planned** — `kcs:producer-exhaust-finetune` (F4 · `62`) |
| [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) | KCB §7 ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | **Evolution without a break** — a provider widens, re-prices, mutates-without-bumping, then ships a capability **v2 beside v1** and retires v1, all while a **live subscriber** keeps running. Hunts the one invariant of [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md): *a subscriber never learns of a break by failing.* | V-1…V-8 | ⬜ **planned** — `kcs:live-schema-mutation` (F4 · `62`) |
| [`kcs-format-stress.md`](kcs-format-stress.md) | KCS ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | The **scenario format itself** — by trying to encode the two hand-written scenarios above as KCS documents and finding where the format can't express what they need. | KCS deltas | ⬜ **planned** — is the *attempt* at the six above; earned by use, not by a run (see below) |

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
**V-1…V-8**, blocking **V-2/V-4/V-5/V-7**, all additively foldable into a KCB **0.5.0** minor. See
that scenario's *Re-ratification — what this pass gates* section for exactly what a clean re-run
would license.

## The KCS encodings — none exists yet, and that is the ratification tail

Read the **KCS encoding** column honestly: it says `planned` seven times and `exists` zero times.
Every pressure test in this directory is prose that a person walked; not one of them is a document a
participant can be handed. That gap *is* the ratification tail, and since
[the ratification gate](../specs/README.md#the-ratification-gate) it is load-bearing rather than
aspirational — no spec reaches `ratified` until its scenario is on the other side of it.

The column's three states mean:

- **exists** — a machine-replayable KCS document is checked in, and a conformant participant can run
  it over its real MCP/A2A connections. Only this state satisfies the gate.
- **planned** — the encoding is owned by a named tasklist and not yet built.
- **absent** — no encoding and no owner. A spec whose scenario reads `absent` cannot be ratified and
  has nothing scheduled that would change that; the honest move is to schedule it, not to promote
  the spec.

**Who builds them.** Encoding and running are downstream runtime work, not contract work
([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)): koine specifies the format (KCS) and
holds the prose; the console that replays a KCS document lives in a runtime commons. Both halves are
tracked in [`../ROADMAP.md`](../ROADMAP.md) **Phase F4** — `agora chief/62-encode-scenarios-as-kcs`
encodes the seven documents below, `agora chief/63-run-kcs-over-live-links` runs the suite over real
connections using **delta-N `standin`** fixtures for participants that have not adopted yet. Those
two tasklists are the only path by which a spec earns the artefact its ratification now requires,
which is why Phase F4 sits on the critical path rather than beside it.

**`kcs-format-stress.md` is the exception, and deliberately so.** Its subject is the format itself,
so the artefact that exercises KCS's clauses is not a run *of* it — it is the attempt to encode the
six other scenarios *in* it, and every place the format could not say what a scenario needed. That is
what produced its deltas, and it is why KCS is the one spec whose conformance artefact is earned by
**use** rather than by a run (the full argument, and why it is not circular, is in
[`../specs/README.md`](../specs/README.md#the-ratification-gate)). Practically: `62` discharges KCS's
debt as a by-product of discharging everyone else's.

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
