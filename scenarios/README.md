# koine/scenarios — the pressure tests that gate ratification

A **conformance scenario** is a hand-written, end-to-end story that pushes concrete data through
several participants at once and, at every step, marks what *held* and what *broke*. A scenario's
method is adversarial on purpose: **prefer finding breaks over asserting correctness**. Each break
becomes a numbered **delta** that must be folded into a spec before that spec is promoted
`draft → candidate → ratified`. These five documents are the executable-in-prose form of that
gate; the [`conformance-scenario.md`](../specs/conformance-scenario.md) (KCS) format is how a
scenario is later encoded so the downstream console can replay it over real MCP/A2A connections.

## The scenarios

| Scenario | Pressure-tests | What it hunts | Deltas |
|---|---|---|---|
| [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) | KINP ([`../specs/identity.md`](../specs/identity.md)) | The **identity firewall** — a fiction NPC `based_on` real Napoleon flowing world-producer → knowledge-producer → identity-authority, so fictional facts never contaminate consensus reality. | A–E |
| [`e2e-media-transform.md`](e2e-media-transform.md) | KCB + KMI ([`../specs/capability-bus.md`](../specs/capability-bus.md), [`../specs/media-interchange.md`](../specs/media-interchange.md)) | **Any-to-any across four participants** — discovery + cross-plane path planning (mood→score), cross-participant CAS byte-fetch, spend ceilings, and the media→knowledge bridge. | F–L |
| [`e2e-finetune.md`](e2e-finetune.md) | KFT ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | The seams KFT **adds** on top of the four planes — the KGP egress gate, model-as-entity identity, and weight/export artifact conventions — on two text finetune jobs. | FT-A…H |
| [`e2e-finetune-multimodal.md`](e2e-finetune-multimodal.md) | KFT, second pass | **Fully-multimodal** finetunes (image-text-to-text, text-to-video) over KMI assets, plus the **multi-provider** topology (a general provider + a specialist provider, routed by the registry). | FT-I…L |
| [`kcs-format-stress.md`](kcs-format-stress.md) | KCS ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | The **scenario format itself** — by trying to encode the two hand-written scenarios above as KCS documents and finding where the format can't express what they need. | KCS deltas |

## How a scenario reads

Each is a **story** (a plain-language request), a **setup** (the participants and the manifests
they publish, in the KINP §3.4 placeholder namespaces — `worldsim` / `analyzer` / `refkb` /
`mediastore`), then **numbered steps** each tagged ✅ *held* or 🔴/🟡 *broke*, and a **Findings**
table collecting the deltas with a severity and which spec clause they land in. A scenario that has
served its purpose keeps a **Resolution** note recording which spec version folded its deltas, and
stands thereafter as the historical record of what the pressure test found.

Concrete deltas already folded: KINP A–E (→ 0.2.0), KCB/KMI F–L (→ KCB 0.2.0 / KMI 0.2.0), KFT
FT-A…L (→ KFT 0.3.0). KCB 0.3.0 remains **candidate** pending a re-run of
[`e2e-media-transform.md`](e2e-media-transform.md) against its new AgentCard-extension manifest
shape.
