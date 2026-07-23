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
- `specs/fine-tuning.md` — KFT 0.3.0, **ratified** (2026-07-23; two pressure passes: `scenarios/e2e-finetune.md`
  → FT-A…H, `scenarios/e2e-finetune-multimodal.md` → FT-I…L, all folded, both clear of unresolved
  blockers). Fine-tuning is
  **multi-provider** — agora's general trainer + Pinakes's own specialized `finetune` provider, routed
  by the registry. Fine-tuning as a *profile* composing the four
  planes (no fifth plane): the `finetune` KCB capability + job manifest, KGP-egress-gated cloud/local
  placement (§4.2, operationalizes KGP §7.2's "training set" clause), models-as-KINP-entities +
  weights/exports-as-KMI-lineage (§5), training-telemetry metric stream (§6). Machine-readable twin
  `koine/schemas/finetune-job.schema.json` + validators land in agora (ADR-0001), gated on koine:10.
  Downstream runtime work (agora general `trainer`, Pinakes specialized provider, cuneiform KCB
  client) is recorded as cross-repo follow-ups (§9), not built in koine.
- `registry/` — shared vocabularies + contracts; `relations.tsv` (core, **binary** relations only) +
  `relations/cinematography.tsv` (cine:) + `relations/media.tsv` (media:) +
  `relations/social.tsv` (soc:), plus `predicate-mapping.json` (registryVersion 0.4.2) — the
  bridge layer mapping argos's and insimul's own predicates onto that vocabulary — and now
  `canonical-schema.json` (v1.3.0; 21 node types + 21 edge types, the `cs:<type>:<local>` csid
  scheme, typed Neo4j-import column contracts), the entity **ontology** the (agora) translation
  engine maps to/from. A relation's signature is immutable once published (changing it changes
  every dependent claim id); the schema's node/edge name↔:LABEL/:TYPE bindings are immutable the
  same way (a change is a NEW type). The schema was **lifted, not rebuilt** from pinakes
  `shared/canonical-schema.json` — promoted verbatim + additively (only `canonicalHome` + `mirrors`
  blocks added), koine now the sole authoritative copy and pinakes's copy demoted to a generated
  mirror, per `decisions/ADR-0002-reconcile-with-existing-bridges.md` (the same amendment that lifted
  `predicate-mapping.json`) and `decisions/ADR-0001-control-plane-topology.md` (koine = contracts,
  no code; validator/loader stay in agora). Follow-ups (not done here — this tranche touches only
  koine): pinakes `10-pinakes-koine-align` wires regeneration of `shared/canonical-schema.json` from
  the koine copy + its byte-for-byte drift gate; the agora translation engine
  (`20-shared-relation-registry`) loads the schema from koine over the wire.
- **All four planes** validated by a pressure test (`scenarios/`); contract layer complete. Deltas
  F–L from `scenarios/e2e-media-transform.md` were folded into KCB 0.2.0 + KMI 0.2.0 (KMI ratified;
  KCB now **0.3.0 candidate** after the §2 manifest→AgentCard-extension redefinition, deltas intact).
- `schemas/` — the machine-readable twin of the prose specs (JSON Schema draft-2020-12): the layer
  absorbed from the deprecated **rosetta** package (`provenance.schema.json` shared `$defs` +
  grounding-pack / entity-grounding-snapshot / canonical-world-export / argos-canonical-export /
  dataset-jsonl-header), updated to KGP 0.4.0. `policy/` holds the license-class + trust-tier policy.
  Validators/CI + conformance fixtures live in agora (ADR-0001, 40 band), **not** here. See
  `decisions/ADR-0003-deprecate-rosetta.md`.
- `decisions/ADR-0004-adopt-erlang-provider-router.md` — **Accepted** (a record). Adopts Erlang/OTP
  for the provider-router (the always-completes `paid→mlx→local→placeholder` ladder as an OTP
  supervision tree) + KCB §4 `subscribe` fan-out (one BEAM process per subscriber); CPU-bound
  translation stays Rust behind a NIF/port. Supersedes the Python router's *language only* — the
  OpenAI `/v1` surface + `/.well-known/kcb-manifest.json` are preserved byte-for-byte, so agora `50`'s
  parity suite is the port's acceptance contract. Changes no KCB/KGP/KINP contract; impl lands in agora.
