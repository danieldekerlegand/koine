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
- `specs/identity.md` — KINP 0.2.0, **ratified**. Deltas A–E folded; three §11 forks decided
  (Pinakes-as-authority, hybrid merge policy, `@world(W)` argument).
- `specs/grounding-pack.md` — KGP 0.1.0, **candidate**. Knowledge data plane; §3 Normalization
  is normative and satisfies KINP delta B. Open questions in §9.
- Planned: `specs/media-interchange.md`, `specs/capability-bus.md`, `ECOSYSTEM.md`, and a
  `registry/relations.tsv` shared relation vocabulary (referenced by KGP §3.2).
