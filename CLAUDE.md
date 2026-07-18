# CLAUDE.md — working in Koine

Koine is the **meta-repo** for cross-project protocols between the five `~/Development`
projects (Insimul, Pinakes, Cuneiform, Argos, Formant). See `README.md` for the fabric thesis.

## What belongs here
- Abstract interconnection models, shared contracts, and protocol specs that span **two or
  more** of the five projects (identity, knowledge/media interchange, capability bus, topology).

## What does NOT belong here
- Application/runtime code. Koine is contracts only ("dumb pipes, smart endpoints"). Each
  project implements Koine specs in its own repo.
- Anything specific to a single project — that lives in that project's repo.

## Conventions
- Each spec in `specs/` carries a version + status header and its own changelog.
- Specs are validated by concrete pressure-test scenarios in `scenarios/` before ratification
  (status: `draft` → `candidate` → `ratified`). Prefer finding breaks over asserting correctness.
- Identifiers, envelopes, and resolution semantics are defined once in `specs/identity.md`
  (KINP) and referenced — never redefined — by other specs.

## Current state
- `ECOSYSTEM.md` — umbrella topology (supersedes the partial docs in Pinakes/Argos/Insimul).
- `specs/identity.md` — KINP 0.2.1, **ratified**. Deltas A–E folded; three forks decided
  (Pinakes-as-authority, hybrid merge policy, `@world(W)` argument); `embedding_model` added.
- `specs/grounding-pack.md` — KGP 0.2.0, **ratified**. Knowledge data plane; normative §3
  normalization (KINP delta B); §9 decisions closed.
- `specs/capability-bus.md` — KCB 0.2.0, **ratified**. Control plane over MCP/A2A; cross-plane
  ports (§2.1), `fetch` verb + grant, `world_pattern` on media ports, capability `cost` + grant
  spend ceilings, dangling-ref tolerance.
- `specs/media-interchange.md` — KMI 0.2.0, **ratified**. Media data plane; asset envelope +
  probe, asset-lineage graph (KINP delta E), canonical JSON EDL + NLE projections (with media
  map), analysis→KGP bridge, transforms typed by KCB ports; `source_world` conditional-on-ingest
  and per-asset.
- `registry/` — shared vocabularies; `relations.tsv` (core, **binary** relations only) +
  `relations/cinematography.tsv` (cine:) + `relations/media.tsv` (media:). A relation's
  signature is immutable once published (changing it changes every dependent claim id).
- **All four planes RATIFIED**, each validated by a pressure test (`scenarios/`). Contract layer
  complete. Deltas F–L from `scenarios/e2e-media-transform.md` folded into KCB 0.2.0 + KMI 0.2.0.
