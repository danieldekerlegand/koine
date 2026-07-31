# CLAUDE.md — working in Koine

Koine is the **meta-repo** for an agnostic **neuro-symbolic interchange fabric** — the shared
contracts by which any conformant producer, consumer, authority, host, or provider exchanges
identity, knowledge, media, and capability. See `README.md` for the fabric thesis and the role
vocabulary.

## What belongs here
- Abstract interconnection models, shared contracts, and protocol specs that are **role-scoped**
  (producer / consumer / authority / host / provider) and useful to **any** conformant
  participant: identity, knowledge/media interchange, capability bus, conformance, fine-tuning.

## What does NOT belong here
- Application/runtime code. Koine is contracts only ("dumb pipes, smart endpoints"). Each
  participant implements Koine specs in its own repo.
- Anything specific to one participant or one deployment — that lives in that participant's repo.
  Concrete deployment facts are informative only (`ECOSYSTEM.md`) and bind no spec clause.

## Conventions
- Each spec in `specs/` carries a version + status header and its own changelog.
- Specs are validated by concrete pressure-test scenarios in `scenarios/` before ratification
  (status: `draft` → `candidate` → `ratified`). Prefer finding breaks over asserting correctness.
- Identifiers, envelopes, and resolution semantics are defined once in `specs/identity.md`
  (KINP) and referenced — never redefined — by other specs.
- Write clauses against **roles**, never against a named product. Product names may appear only
  as clearly-marked illustrative examples or in informative "known implementations" pointers.

## Current state
- `ECOSYSTEM.md` — a concrete deployment topology (known implementations); **informative**.
- `specs/identity.md` — KINP 0.2.1, **ratified**. Deltas A–E folded; three forks decided
  (single identity **authority role** for real-world entities, hybrid merge policy, `@world(W)`
  argument); `embedding_model` added.
- `specs/grounding-pack.md` — KGP 0.4.0, **ratified**. Knowledge data plane; normative §3
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
- `specs/conformance-scenario.md` — KCS 0.2.0, **ratified**. Declarative, replayable scenarios
  driving participants over their real MCP/A2A connections; cross-plane assertion vocabulary.
- `specs/fine-tuning.md` — KFT 0.3.0, **ratified** (2026-07-23; two pressure passes:
  `scenarios/e2e-finetune.md` → FT-A…H, `scenarios/e2e-finetune-multimodal.md` → FT-I…L, all
  folded, both clear of unresolved blockers). Fine-tuning is **multi-provider** — a general
  trainer plus specialized providers, routed by the registry — and is a *profile* composing the
  four planes (no fifth plane): the `finetune` KCB capability + job manifest, KGP-egress-gated
  cloud/local placement (§4.2, operationalizes KGP §7.2's "training set" clause),
  models-as-KINP-entities + weights/exports-as-KMI-lineage (§5), training-telemetry metric
  stream (§6). Machine-readable twin `schemas/finetune-job.schema.json` lives here; validators
  live downstream (ADR-0001). Runtime work (trainers, provider adapters, bus clients) is
  recorded as downstream follow-ups (§9), not built in koine.
- `registry/` — shared vocabularies + contracts; `relations.tsv` (core, **binary** relations only) +
  `relations/cinematography.tsv` (cine:) + `relations/media.tsv` (media:) +
  `relations/social.tsv` (soc:), plus `predicate-mapping.json` (registryVersion 0.4.2) — the
  bridge layer mapping producer-local predicates onto that vocabulary (deployment-specific) — and
  `canonical-schema.json` (v1.3.0; 21 node types + 21 edge types, the `cs:<type>:<local>` csid
  scheme, typed Neo4j-import column contracts), the entity **ontology** downstream translation
  engines map to/from. A relation's signature is immutable once published (changing it changes
  every dependent claim id); the schema's node/edge name↔:LABEL/:TYPE bindings are immutable the
  same way (a change is a NEW type). The schema was **lifted, not rebuilt** from a pre-existing
  producer copy — promoted verbatim + additively (only `canonicalHome` + `mirrors` blocks added),
  koine now the sole authoritative copy and the producer's copy demoted to a generated mirror, per
  `decisions/ADR-0002-reconcile-with-existing-bridges.md` (the same amendment that lifted
  `predicate-mapping.json`) and `decisions/ADR-0001-control-plane-topology.md` (koine = contracts,
  no code; validators/loaders stay downstream).
- **All four planes** validated by a pressure test (`scenarios/`); contract layer complete. Deltas
  F–L from `scenarios/e2e-media-transform.md` were folded into KCB 0.2.0 + KMI 0.2.0 (KMI ratified;
  KCB now **0.3.0 candidate** after the §2 manifest→AgentCard-extension redefinition, deltas intact).
- `schemas/` — the machine-readable twin of the prose specs (JSON Schema draft-2020-12):
  `provenance.schema.json` shared `$defs` + grounding-pack / entity-grounding-snapshot /
  canonical-world-export / canonical-graph-export / dataset-jsonl-header, updated to KGP 0.4.0.
  Every schema is role-scoped: no title, `$id`, or description names a product, and illustrative
  CURIEs use the KINP §3.4 placeholder namespaces. `canonical-graph-export` is the neutral name the
  downstream runtime mirror uses too — keep the two identical.
  `policy/` holds the license-class + trust-tier policy. Validators/CI + conformance fixtures live
  downstream (ADR-0001), **not** here. See `decisions/ADR-0003-deprecate-rosetta.md`.
- `decisions/ADR-0004-adopt-erlang-provider-router.md` — **Accepted** (an implementation record,
  binding no contract). Adopts Erlang/OTP for a provider-router (the always-completes
  `paid→mlx→local→placeholder` ladder as an OTP supervision tree) + KCB §4 `subscribe` fan-out
  (one BEAM process per subscriber); CPU-bound translation stays Rust behind a NIF/port. The
  OpenAI `/v1` surface + the served capability manifest are preserved byte-for-byte. Changes no
  KCB/KGP/KINP contract; implementation lands downstream.
