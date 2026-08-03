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
- **Instance data, as opposed to contract shape.** A schema's keys/patterns/enums are shape and
  belong here; a topology, a bridge/predicate mapping, a deployment's node/edge ontology, an
  implementation-record ADR, or a cross-repo adoption program is instance data and does not.
  Those live in the operator's **private integration repo** (out of scope for these contracts).
  Koine must not grow a dependency on it — no spec, schema, registry, or policy file may link there.

## Conventions
- Each spec in `specs/` carries a version + status header and its own changelog.
- Specs are validated by concrete pressure-test scenarios in `scenarios/` before ratification
  (status: `draft` → `candidate` → `ratified`). Prefer finding breaks over asserting correctness.
- Identifiers, envelopes, and resolution semantics are defined once in `specs/identity.md`
  (KINP) and referenced — never redefined — by other specs.
- Write clauses against **roles**, never against a named product. Product names may appear only
  as clearly-marked illustrative examples or in informative "known implementations" pointers.

## Current state
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
- `specs/media-interchange.md` — KMI 0.3.0, **candidate**. Media data plane; asset envelope +
  probe, asset-lineage graph (KINP delta E), analysis→KGP bridge, transforms typed by KCB ports;
  `source_world` conditional-on-ingest and per-asset. §4 **adopts OpenTimelineIO** as the
  canonical timeline model (ADR-0005) — koine adds only identity (asset id on the clip's media
  reference, via OTIO's namespaced `metadata`), lineage, and the knowledge bridge; NLE
  interchange goes through OTIO's own adapters (media map, delta I, retained). The bespoke
  `application/vnd.koine.edl+json` EDL is deprecated (§4.4). Back to candidate pending
  re-validation vs `scenarios/e2e-media-transform.md`.
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
- `registry/` — shared **agnostic** vocabularies only: `relations.tsv` (core, **binary** relations
  only) + `relations/cinematography.tsv` (cine:) + `relations/media.tsv` (media:) +
  `relations/social.tsv` (soc:), plus `entity-types.tsv`, `media-types.tsv`, and `enums/`.
  A relation's signature is immutable once published (changing it changes every dependent claim
  id), so a change means a NEW relation name, never an edit in place. Bridge/predicate mappings
  and a deployment's own canonical node/edge ontology are **instance data** and were moved to the
  private integration repo — do not reintroduce them here.
- **All four planes** validated by a pressure test (`scenarios/`); contract layer complete. Deltas
  F–L from `scenarios/e2e-media-transform.md` were folded into KCB 0.2.0 + KMI 0.2.0 and are intact.
  Both are now **0.3.0 candidate** on model-shape changes made after that fold — KCB's §2
  manifest→AgentCard-extension redefinition, KMI's §4 OTIO adoption — each pending re-validation.
- `schemas/` — the machine-readable twin of the prose specs (JSON Schema draft-2020-12):
  `provenance.schema.json` shared `$defs` + grounding-pack / entity-grounding-snapshot /
  canonical-world-export / canonical-graph-export / dataset-jsonl-header, updated to KGP 0.4.0.
  Every schema is role-scoped: no title, `$id`, or description names a product, and illustrative
  CURIEs use the KINP §3.4 placeholder namespaces. `canonical-graph-export` is the neutral name the
  downstream runtime mirror uses too — keep the two identical.
  `policy/` holds the license-class + trust-tier policy. Validators/CI + conformance fixtures live
  downstream (ADR-0001), **not** here.
- `decisions/` — the **agnostic** ADRs only: ADR-0001 (control-plane stance — direct-dial peers,
  thin shared commons; koine specifies, `agora` implements) and ADR-0005 (adopt OpenTimelineIO as
  KMI's canonical timeline model). The deployment-history ADRs (ADR-0002/0003/0004 — bridge
  reconciliation, contract-layer consolidation, the Erlang provider-router) moved to the private
  integration repo, which continues koine's ADR numbering, so **0002–0004 are permanently
  reserved**: new agnostic ADRs start at 0005 and go up.
