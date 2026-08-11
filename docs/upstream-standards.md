# Upstream standards — what koine pins, and the drift check

**Status:** informative (this file is not normative; the pin of record is each spec's own header).
**Last reviewed:** 2026-08-11.

Koine's design rule is *adopt the interface or shape, not the runtime* — which means every spec
depends on external standards that version independently of us. **Until 2026-08-11 no koine spec
pinned any external standard version**, and a sweep found drift already present in three places.
This document is the missing pin table plus the review cadence that keeps it honest.

## The rule

1. **Every normative reference to an external standard names a version or dated revision.** A bare
   reference ("as in A2A", "per MCP") is a defect, not shorthand.
2. **A pin is a claim about what koine was validated against**, not a claim the upstream is frozen.
   A newer upstream is fine; an *unrecorded* newer upstream is the failure.
3. **Moving a pin is a spec change** — version bump, changelog entry, and (for a normative surface)
   a re-run of the gating scenario, per `specs/README.md`.
4. **Drift is checked on a cadence, not on hope** (see below).

## The pin table

Legend: **✅ pinned** in the spec · **🚧 drift found, correction pending** · **⬜ not yet pinned**.

| Upstream | Pinned version / revision | Used by | State | Notes |
|---|---|---|---|---|
| **A2A** | **v1.0** | KCB §2 (AgentCard extension), §6 | 🚧 | v1.0 replaces the v0.x top-level `"url"` with **`supported_interfaces[]`**, each entry an **`AgentInterface{url, protocol_binding}`**. KCB's example card still shows the v0.x shape. |
| **MCP** | **revision 2026-07-28** | KCB §6 (tool-call mapping), KCS §3 | 🚧 | Two corrections: the method is **`tools/list`**, not `list_tools` (KCB §6); and the 2026-07-28 revision is a **breaking change** — stateless core (no `initialize` handshake, no session id, per-request `_meta`) plus a **mandatory `server/discover`**. Any spec clause assuming a session must say which revision it assumes. |
| **OpenTimelineIO** | **v0.18.1** (pre-1.0) | KMI §4, ADR-0005 | 🚧 | **OTIO is not 1.0.** Its "1.0 Release" milestone was due **2026-04-10** and is ~4 months late with about a third of its issues open. Worse for interchange: `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (OTIO issue **#1985**) — which is the concrete justification for KMI's explicit asset-id envelope, and belongs in ADR-0005. |
| **C2PA** | ⬜ to pin | KMI lineage projection | ⬜ | New projection target — pin the conformance-program spec revision when the projection lands. |
| **MovieLabs OMC** | **v2.8** | KMI lineage projection | ⬜ | Richer derivation vocabulary (Revision / Variant / Derivation / Representation / Alternative); KMI projects onto it rather than restating it. |
| **W3C PROV** (PROV-JSON-LD) | 2024-08-25 submission | KGP §4.1 projection, KINP provenance shape | ⬜ | Already cited in `positioning.md`; not yet pinned in the spec text. |
| **RDF / RDFC** | RDF **1.1** (RDFC-1.0's only defined input) | ADR-0006 | ✅ | Recorded as a *reason*, not a dependency: **RDFC-1.0 has no defined behaviour for RDF 1.2 triple terms**, and revising it is out of the RDF/SPARQL WG charter (runs to **2027**). KGP therefore cannot delegate canonicalization upstream. |
| **SPDX license list** | ⬜ to pin | KGP §7, `policy/` | ⬜ | Pin the list release the license classes were validated against. |
| **W3C Entity Reconciliation API** | ⬜ to pin | KINP `reconcile` | ⬜ | |
| **MLCommons Croissant** | **v1.1** | KFT §3 dataset reference | ⬜ | Adopted **by reference** — KFT cites Croissant for dataset description and does not restate it. |
| **KitOps / ModelPack** | ⬜ to pin | KFT §5 weights | ⬜ | KitOps' `model.parts[].type` already contemplates LoRA. |
| **Hugging Face `base_model`** | Hub-validated convention | KFT §5 lineage | ⬜ | Millions of repos already carry it; KFT reuses rather than mints a lineage field. |
| **Kubeflow TrainJob** | ⬜ to pin | KFT §3 job shape | ⬜ | `initializer.{dataset,model}.storageUri` is the **structural precedent** KFT §3 aligns to. |
| **safetensors / GGUF / ONNX** | format names only | KFT §5 | ✅ | Referenced as formats, not versioned APIs — no pin needed. |

## The drift check

**Cadence:** at every spec ratification or re-ratification, and at minimum **quarterly**.

For each row above:

1. Fetch the upstream's current version / dated revision.
2. If it differs from the pin, open a finding — do **not** silently update the prose.
3. A finding is closed either by (a) re-validating against the new upstream and moving the pin
   under the normal spec-lifecycle rules, or (b) recording in the spec why koine deliberately
   stays on the older pin.
4. Record the review date in this file's header even when nothing moved.

**Why manual, and why here:** koine holds no runtime code (ADR-0001), so it has no CI to automate
this. The automatable half — *does an implementation's pinned spec version match koine's spec
header* — is a downstream gate and lives there (see agora's `schemas/src/versions.ts` drift gate).
This file is the upstream half: *does koine's pinned view of the outside world still match the
outside world*.

## Related

- [`positioning.md`](positioning.md) — what koine adopts, bridges, or dismisses, and why.
- [`../decisions/ADR-0005-otio-canonical-timeline.md`](../decisions/ADR-0005-otio-canonical-timeline.md) — OTIO adoption (the pre-1.0 caveat above belongs in its risks).
- [`../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) — why KGP keeps its own canonical form.
- [`../specs/README.md`](../specs/README.md) — the spec lifecycle a pin move runs through.
