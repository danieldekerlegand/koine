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
- Each spec in `specs/` carries a version + status header and **that header is the only
  authority** on its version/status. Three tables mirror it for scanning — `README.md`,
  `specs/README.md`, and `ECOSYSTEM.md` §2 — plus the prose under *Current state* below. Change a
  header and you must update all four; on disagreement the header wins and the mirror is the bug.
- Run `node scripts/check-doc-integrity.mjs` after touching any doc: it resolves every relative
  Markdown link (file + `#anchor`) and diffs all three status tables against the spec headers.
  Both failures are otherwise silent. It checks **three of the four mirrors** — the *Current
  state* prose below is **not** checked, so a stale version there passes CI; update that line by
  hand and read it back. `node scripts/check-tasklist-categories.mjs` guards `tasks/chief/`.
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
- `specs/grounding-pack.md` — KGP 0.5.2, **candidate**. Knowledge data plane; normative §3
  normalization (KINP delta B); §9 decisions closed. Per ADR-0006 the bespoke canonical is
  **retained** (TSV canonical, §3 the identity mechanism, §3.3 convergence untouched); §3.4 states
  the requirements RDF-star / PROV / JSON-LD do not meet natively plus the re-open test, and §4.1
  fixes the lossless RDF-star/PROV/JSON-LD **projection** mapping. **Re-validated** against
  `scenarios/e2e-worlds-to-fabric.md` (its *Re-validation — KGP 0.5.0* section): §3.3 claim-id
  convergence is byte-unchanged, the §7 confidence/license/`local-only` filters survive every
  encoding, and all §4 projections round-trip. That pass's two **minor projection findings** are
  **closed in 0.5.1** — KGP-1 by §4's normative *ProbLog — one fact per admitted prov record* rule
  (aggregation is the consumer's policy, never KGP's), KGP-2 by §4.1's normative **annotation
  vocabulary** (a named term per annotation; PROV / OWL-Time / DCMI Terms reused where they exist,
  `kgp:` terms minted where they do not and immutable once ratified). Projection surface only — §3,
  §3.1's hashed set, and §3.3 are untouched, so no claim id changes. 0.5.2 is **rationale and prior art only** — §3.4 gains the two
  engagements ADR-0006 had been missing (nanopublications / **Trusty URIs**, the nearest ancestor:
  a Trusty URI hashes all four graphs and so fingerprints a *publication event*, where §3 hashes
  the **claim alone** so producers converge; and **Frictionless / Data Package**, dismissed because
  it packages files and discharges no clause of §3/§3.3/§7) — with §3, §3.1 and §3.3
  byte-unchanged, so no claim id moves. Stays candidate on the one
  remaining gate: the **still-missing downstream round-trip fixture** (a validator artifact per
  ADR-0001, tracked cross-repo).
- `specs/capability-bus.md` — KCB 0.4.2, **candidate**. Control plane over MCP/A2A; cross-plane
  ports (§2.1), `fetch` verb + grant, `world_pattern` on media ports, capability `cost` + grant
  spend ceilings, dangling-ref tolerance. §2 manifest redefined as a named A2A **AgentCard
  extension** (`capabilities.extensions[]`) — collapses the two well-known files into one served
  card. 0.4.0 folds ADR-0009 into a normative **§7** (the old open question 2): a capability is
  `(name, semver version)`, every port carries a content-addressed `schema_id` with a fixed
  canonicalization (§7.1), the subscriber-compatibility table + ignore-unknown-fields +
  digest-without-a-bump-is-a-defect are normative (§7.2), the deprecation policy is stated once for
  every retiring surface (§7.3 — hence §2.2's standalone manifest is removed at **KCB 0.5.0**), an
  archival pin ≠ a live binding (§7.4), grants bind to `(capability, major)` and a `cost` change
  fails closed (§5). Additive; old open questions renumbered to §8. Two re-ratification gates now:
  re-validation vs `scenarios/e2e-media-transform.md` **and** a *clean* §7.5 mutate-live-schema
  break-test. That break-test has **landed and been run** —
  `scenarios/e2e-live-schema-mutation.md` — and is **not clean**: §7's model held under attack, its
  perimeter did not, giving deltas **V-1…V-8** (blocking V-2 digest blind on knowledge ports, V-4 no
  address for a second major, V-5 no version operand at invoke time, V-7 no signal reaches a live
  `subscribe`). All folds are additive → KCB **0.5.0**, the same minor that removes §2.2's standalone
  manifest. The scenario's *Re-ratification — what this pass gates* section is the note of record.
  0.4.1 (patch) moves the §2 extension URI's namespace **root** to a w3id.org permanent identifier
  (`https://w3id.org/koine/kcb/manifest/0.3`) — the old private hostname was verified unregistered
  and therefore squattable — and adds **§2.3**, the dual-accept window: until **KCB 0.6.0** a
  consumer MUST accept both roots, a producer MUST emit the w3id form. Path/version segment,
  payload shape and every other clause unchanged; both re-ratification gates restated, neither
  moved. Provenance in ADR-0007's amendment log; implementations pinning the old literal migrate
  downstream (ADR-0001). 0.4.2 (patch) corrects two **upstream** references that had drifted and pins
  both in a new **§1.1**: the §2 example AgentCard now shows the **A2A v1.0** shape
  (`supported_interfaces[]` of `AgentInterface{url, protocol_binding}`, replacing v0.x's top-level
  `"url"`) along with the prose and §2.2 row that read the endpoint off it, and §4's MCP methods are
  `tools/list` / `tools/call`. The **KCB manifest shape is byte-unchanged** — extension entry, `uri`
  and every `params` field — so only the host card and the method names move; both gates restated,
  neither moved.
- `specs/media-interchange.md` — KMI 0.3.2, **candidate**. Media data plane; asset envelope +
  probe, asset-lineage graph (KINP delta E), analysis→KGP bridge, transforms typed by KCB ports;
  `source_world` conditional-on-ingest and per-asset. §4 **adopts OpenTimelineIO** as the
  canonical timeline model (ADR-0005) — koine adds only identity (asset id on the clip's media
  reference, via OTIO's namespaced `metadata`), lineage, and the knowledge bridge; NLE
  interchange goes through OTIO's own adapters (media map, delta I, retained). The bespoke
  `application/vnd.koine.edl+json` EDL is deprecated (§4.4) and, as of 0.3.1, names its removal —
  **KMI 0.4.0** — under the one fabric-wide deprecation policy at KCB §7.3 (ADR-0009); patch, not
  minor, because §7.3c forbids declaring and removing in the same publication. Machine-readable twin
  `schemas/media-timeline.schema.json` — a *profile over* an OTIO document, not a timeline model:
  OTIO's structure stays open, the schema checks only the additive layer. The OTIO side is
  **re-validated clean** vs `scenarios/e2e-media-transform.md` (its *Re-validation* section);
  still candidate because the same scenario also gates KCB 0.4.0's manifest change.
  0.3.2 narrows the **lineage claim from a vocabulary to a BRIDGE** (ADR-0010) with §3's relation
  set unchanged: §3.1 engages the prior art KMI had never named — **C2PA**'s *signed* derivation
  chain (`c2pa.ingredient` · `parentOf`/`componentOf`/`inputTo` + hash hard bindings, 159 certified
  products observed 2026-08-13) and **MovieLabs OMC v2.8**'s *richer* vocabulary (Revision /
  Variant / Derivation / Representation / Alternative) — so the lineage graph is no longer claimed
  as unoccupied ground; what KMI claims is the **analysis→knowledge bridge** (§5) + world-scoping.
  §3.2/§3.3 specify the projections onto each with their lossy edges named (`perceptual_match` never
  projected; KMI `prov` ≠ the C2PA signer; a KINP asset id ≠ a hard binding; OMC's Revision has no
  KMI source), and §3.4 fixes conformance as *complete or reported*, not lossless — the round-trip
  **is** the criterion, so no `schemas/` document shape and the fixture is a downstream follow-up
  (ADR-0001), **not** a new gate. Same version pins OTIO in §4.1 at **v0.18.1 — not 1.0** (1.0
  milestone due 2026-04-10, ~4 months overdue) with `target_url` under-specified enough that
  **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (OTIO **#1985**);
  recorded as a *risk* in ADR-0005's dated amendment log with the adoption **reaffirmed**, since
  #1985 is the citable case for the asset-id envelope. Patch, not minor: nothing that conformed at
  0.3.1 stops conforming, and §4.4 has already spent **0.4.0** on the EDL removal.
- `specs/conformance-scenario.md` — KCS 0.2.0, **ratified**. Declarative, replayable scenarios
  driving participants over their real MCP/A2A connections; cross-plane assertion vocabulary.
- `specs/fine-tuning.md` — KFT 0.5.0, **candidate** (ratified 2026-07-23 on two pressure passes:
  `scenarios/e2e-finetune.md` → FT-A…H, `scenarios/e2e-finetune-multimodal.md` → FT-I…L; a **third**
  pass, `scenarios/e2e-producer-exhaust-finetune.md`, then pressure-tested a *producing application's*
  training exhaust arriving via ADR-0008 and found the §4 **intake** incomplete — FT-M `dataset.records[]`
  for a training-record JSONL as a KMI asset (`application/vnd.koine.dataset+jsonl`), FT-N `egress` on
  the `dataset-jsonl-header` (the gate MUST NOT infer it from the trust tier), FT-O one header per
  record file, FT-P `recordCount` so FT-E's before-you-fetch estimate survives, FT-Q doc cleanup. The
  0.4.0 fold is strictly **additive** — 0.3.0 manifests/headers stay valid and the gate's behavior is
  unchanged — but it touches a ratified normative surface, so status returns to candidate pending
  owner re-ratification; that scenario's *Re-validation — KFT 0.4.0* walks it clean.) Fine-tuning is
  **multi-provider** — a general
  trainer plus specialized providers, routed by the registry — and is a *profile* composing the
  four planes (no fifth plane): the `finetune` KCB capability + job manifest, KGP-egress-gated
  cloud/local placement (§4.2, operationalizes KGP §7.2's "training set" clause),
  models-as-KINP-entities + weights/exports-as-KMI-lineage (§5), training-telemetry metric
  stream (§6). Machine-readable twin `schemas/finetune-job.schema.json` lives here; validators
  live downstream (ADR-0001). Runtime work (trainers, provider adapters, bus clients) is
  recorded as downstream follow-ups (§9), not built in koine. §11.5's capability-versioning
  inheritance is **resolved** by ADR-0009 / KCB §7 and is now an informative pointer — a finetuned
  model's pinned `kft_version` is an *archival pin* (KCB §7.4), so no KFT clause changed and the
  version does not move.
  0.5.0 **stops restating what is already standardized** and says louder what is left, additively and
  with **§4's admission behavior byte-unchanged** (FT-A…FT-Q untouched, 0.4.0 manifests still
  conformant). Three adoptions **by reference**, each with a three-row seam table: **MLCommons
  Croissant v1.1** for dataset description (§4.1.1, reached by the optional `dataset.descriptor[]`),
  **KitOps / ModelPack** for weights packaging (§5.3.1 — `model.parts[].type` already covers LoRA, so
  KFT mints no layout and every KMI lineage obligation stays KFT's), and the Hugging Face
  **`base_model` / `base_model_relation`** convention for published lineage (§5.1.1 — a *projection*
  of §5.1's KINP relations, with *omit, never invent* when the base has no Hub coordinate). A fourth
  standard is **resembled, not adopted**: §3.2 records **Kubeflow `TrainJob`**
  (`trainer.kubeflow.org/v1alpha1`) as the dataset-and-model-by-reference precedent with a field-by-field
  correspondence, plus the optional `base_model_descriptor[]` and the NORMATIVE *a descriptor is never
  an admission input* rule — a **shape, not a scope**, since TrainJob has no license, egress,
  trust-tier or budget field anywhere. §1.1 collects the **four defensible claims** (objective ×
  adaptation taxonomy, egress-gated placement, graded refusal routing, cross-provider portability),
  each with the reason nothing else holds it; its `method` decomposition exposes one enum carrying both
  axes, recorded as §11.6 (fix is an additive optional field, never a change to `method` or FT-F).
  The fourth claim becomes an **artefact**: NORMATIVE **§3.3** maps a job onto **Axolotl,
  LLaMA-Factory, TRL and the OpenAI FT API** — three dispositions per field (mapped / carried out of
  band / **refused**), an exhaustive gating set that MUST be refused rather than silently dropped, a
  required conversion record on the PROV activity, and four normative consequences (no `local-only`
  job to a managed cloud target; an unexpressible adaptation axis is a refusal, not a substitution; a
  KCS `eval[]` is never demoted to a validation file; a target's silence is never `exportable`).
  **torchtune** is import-only legacy (wound down, v0.6.1 2025-04-07) — never an emit target or an
  engine-ladder backend. **§8.1** grades refusals (`invalid`/`incompatible`/`out-of-envelope`/
  `unsatisfiable-here`/`refused-policy`/`over-budget`) with a SHOULD-level `route_to[]` of resolvable
  addresses that MUST NOT breach the gate just enforced. Conversion conformance is the **round-trip**
  (§3.3.4) so no schema is minted; fixtures are a §9.1 downstream follow-up (ADR-0001). The four
  KFT rows of `docs/upstream-standards.md` plus five §3.3 target rows are pinned. Status stays
  candidate on the same restated gate — the owner's re-run of `e2e-producer-exhaust-finetune.md`'s
  *Re-validation — KFT 0.4.0* — with §3.3/§8.1 recorded as new normative surface no pass has
  exercised, not as a second gate.
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
  manifest→AgentCard-extension redefinition, KMI's §4 OTIO adoption. KMI's half has been re-run
  (scenario *Re-validation — KMI 0.3.0*: additive layer holds, no delta reopened); KCB's is
  outstanding, and both stay candidate until it lands.
- `schemas/` — the machine-readable twin of the prose specs (JSON Schema draft-2020-12):
  `provenance.schema.json` shared `$defs` + grounding-pack / entity-grounding-snapshot /
  canonical-world-export / canonical-graph-export / dataset-jsonl-header, updated to KGP 0.5.x
  (grounding-pack = the §4 **JSON** encoding, not a JSON-LD document; no schema models a §4
  projection — a projection's conformance is the round-trip, not a document shape);
  `media-timeline` (KMI §4) + `finetune-job` (KFT §3), each with one golden-positive fixture.
  Every schema is role-scoped: no title, `$id`, or description names a product, and illustrative
  CURIEs use the KINP §3.4 placeholder namespaces. `canonical-graph-export` is the neutral name the
  downstream runtime mirror uses too — keep the two identical.
  `policy/` holds the license-class + trust-tier policy. Validators/CI + conformance fixtures live
  downstream (ADR-0001), **not** here.
- `decisions/` — the **agnostic** ADRs only: ADR-0001 (control-plane stance — direct-dial peers,
  thin shared commons; koine specifies, `agora` implements), ADR-0005 (adopt OpenTimelineIO as
  KMI's canonical timeline model — **amended 2026-08-13**: risks now record that OTIO is pre-1.0
  and that `target_url` breaks between shipping NLEs (#1985); adoption reaffirmed unchanged), and ADR-0006 (KGP keeps its bespoke TSV + content-addressed-claim
  canonical; RDF-star / W3C PROV / JSON-LD become a specified, round-trip-tested **projection**, and
  KINP §9's "not adopting RDF" narrows to *storage and identity*), ADR-0007 (a participant is
  self-describing — namespace, KCB manifest, egress policy and bridge mappings are published by
  that participant, and the registry returns an **address** to a self-description, never the
  self-description), ADR-0008 (an application joins as a producer through a thin **adapter**
  that only translates; every generic data-plane bridge is built once in the runtime commons),
  ADR-0009 (semver states intent, a content digest establishes identity — capability versioning
  plus the one fabric-wide deprecation policy), and ADR-0010 (KMI is a **bridge** between C2PA and
  MovieLabs OMC, not a third lineage vocabulary — §3's relations are retained as the fabric-internal
  form and projected onto both, explicitly *not* losslessly).
  `decisions/README.md` carries the full table — keep this list and that table in step. The deployment-history ADRs (ADR-0002/0003/0004 — bridge
  reconciliation, contract-layer consolidation, the Erlang provider-router) moved to the private
  integration repo, which continues koine's ADR numbering, so **0002–0004 are permanently
  reserved**: new agnostic ADRs start at 0005 and go up.
- `ECOSYSTEM.md` — the root-level **living topology**, informative and shape-level: the ADR-0001
  topology principles, the six planes with their version + status (a mirror of the spec headers —
  the header always wins), an informative "known implementations" role map, and the cross-repo
  conventions. It binds no clause, and no spec, schema, registry, or policy file depends on it.
  Keep it *shape only*: the instance topology — real hosts/endpoints, bridge/predicate mappings, a
  deployment's node/edge ontology, the adoption program map — stays in the private integration
  repo (its §7). A pointer to that repo may appear here or in a README-level doc, never in a spec,
  schema, registry, or policy file.
