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
- `specs/capability-bus.md` — KCB 0.3.0, **candidate**. Control plane over MCP/A2A; cross-plane
  ports (§2.1), `fetch` verb + grant, `world_pattern` on media ports, capability `cost` + grant
  spend ceilings, dangling-ref tolerance. §2 manifest redefined as a named A2A **AgentCard
  extension** (`capabilities.extensions[]`) — collapses the two well-known files into one served
  card; back to candidate pending re-validation vs `scenarios/e2e-media-transform.md`.
- `specs/media-interchange.md` — KMI 0.2.0, **ratified**. Media data plane; asset envelope +
  probe, asset-lineage graph (KINP delta E), canonical JSON EDL + NLE projections (with media
  map), analysis→KGP bridge, transforms typed by KCB ports; `source_world` conditional-on-ingest
  and per-asset.
- `specs/fine-tuning.md` — KFT 0.3.0, **candidate** (two pressure passes: `scenarios/e2e-finetune.md`
  → FT-A…H, `scenarios/e2e-finetune-multimodal.md` → FT-I…L, all folded). Fine-tuning is
  **multi-provider** — agora's general trainer + Pinakes's own specialized `finetune` provider, routed
  by the registry. Fine-tuning as a *profile* composing the four
  planes (no fifth plane): the `finetune` KCB capability + job manifest, KGP-egress-gated cloud/local
  placement (§4.2, operationalizes KGP §7.2's "training set" clause), models-as-KINP-entities +
  weights/exports-as-KMI-lineage (§5), training-exhaust metric stream (§6). Machine-readable twin
  `koine/schemas/finetune-job.schema.json` + validators land in agora (ADR-0001), gated on koine:10.
  Pressure test `scenarios/e2e-finetune.md` pending before Candidate.
- `registry/` — shared vocabularies; `relations.tsv` (core, **binary** relations only) +
  `relations/cinematography.tsv` (cine:) + `relations/media.tsv` (media:) +
  `relations/social.tsv` (soc:), plus `predicate-mapping.json` (registryVersion 0.4.0) — the
  bridge layer mapping argos's and insimul's own predicates onto that vocabulary. A relation's
  signature is immutable once published (changing it changes every dependent claim id).
- **All four planes** validated by a pressure test (`scenarios/`); contract layer complete. Deltas
  F–L from `scenarios/e2e-media-transform.md` were folded into KCB 0.2.0 + KMI 0.2.0 (KMI ratified;
  KCB now **0.3.0 candidate** after the §2 manifest→AgentCard-extension redefinition, deltas intact).
- `decisions/ADR-0004-adopt-erlang-provider-router.md` — **Accepted** (a record). Adopts Erlang/OTP
  for the provider-router (the always-completes `paid→mlx→local→placeholder` ladder as an OTP
  supervision tree) + KCB §4 `subscribe` fan-out (one BEAM process per subscriber); CPU-bound
  translation stays Rust behind a NIF/port. Supersedes the Python router's *language only* — the
  OpenAI `/v1` surface + `/.well-known/kcb-manifest.json` are preserved byte-for-byte, so agora `50`'s
  parity suite is the port's acceptance contract. Changes no KCB/KGP/KINP contract; impl lands in agora.
