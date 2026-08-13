# koine/scenarios — the pressure tests that gate ratification

A **conformance scenario** is a hand-written, end-to-end story that pushes concrete data through
several participants at once and, at every step, marks what *held* and what *broke*. A scenario's
method is adversarial on purpose: **prefer finding breaks over asserting correctness**. Each break
becomes a numbered **delta** that must be folded into a spec before that spec is promoted
`draft → candidate → ratified`. These seven documents are the executable-in-prose form of that
gate; the [`conformance-scenario.md`](../specs/conformance-scenario.md) (KCS) format is how a
scenario is later encoded so the downstream console can replay it over real MCP/A2A connections.

## The scenarios

| Scenario | Pressure-tests | What it hunts | Deltas |
|---|---|---|---|
| [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) | KINP ([`../specs/identity.md`](../specs/identity.md)), then KGP ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) | The **identity firewall** — a fiction NPC `based_on` real Napoleon flowing world-producer → knowledge-producer → identity-authority, so fictional facts never contaminate consensus reality. Its *Re-validation* pass then re-runs the claim-minting legs against KGP 0.5.1's retained canonical + RDF projection. | A–E, KGP-1/2 ✅ |
| [`e2e-media-transform.md`](e2e-media-transform.md) | KCB + KMI ([`../specs/capability-bus.md`](../specs/capability-bus.md), [`../specs/media-interchange.md`](../specs/media-interchange.md)) | **Any-to-any across four participants** — discovery + cross-plane path planning (mood→score), cross-participant CAS byte-fetch, spend ceilings, and the media→knowledge bridge. | F–L |
| [`e2e-finetune.md`](e2e-finetune.md) | KFT ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | The seams KFT **adds** on top of the four planes — the KGP egress gate, model-as-entity identity, and weight/export artifact conventions — on two text finetune jobs. | FT-A…H |
| [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md) | KFT, second pass | **Fully-multimodal** finetunes (image-text-to-text, text-to-video) over KMI assets, plus the **multi-provider** topology (a general provider + a specialist provider, routed by the registry). | FT-I…L |
| [`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md) | KFT, third pass | A producing **application's own training exhaust** (accepted edits, generations, preference pairs, QA labels) offered as a training set through the thin adapter of [`../decisions/ADR-0008-fabric-producer-adapter.md`](../decisions/ADR-0008-fabric-producer-adapter.md) — a corpus that is neither KGP claims nor image/video/audio bytes, arriving from a producer rather than an authority. | FT-M…Q |
| [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) | KCB §7 ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | **Evolution without a break** — a provider widens, re-prices, mutates-without-bumping, then ships a capability **v2 beside v1** and retires v1, all while a **live subscriber** keeps running. Hunts the one invariant of [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md): *a subscriber never learns of a break by failing.* | V-1…V-8 |
| [`kcs-format-stress.md`](kcs-format-stress.md) | KCS ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | The **scenario format itself** — by trying to encode the two hand-written scenarios above as KCS documents and finding where the format can't express what they need. | KCS deltas |

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
break-test of its versioning section, still to be written.
