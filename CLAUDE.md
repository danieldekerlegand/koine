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
- `specs/capability-bus.md` — KCB 0.1.0, **candidate**. Control plane over MCP/A2A.
- `registry/` — shared vocabularies; `relations.tsv` (core) + `relations/cinematography.tsv`
  (example extension). A relation's signature is immutable once published (changing it changes
  every dependent claim id).
- Planned: `specs/media-interchange.md` (the one remaining plane).
