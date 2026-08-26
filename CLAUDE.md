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
- The other two machine-readable surfaces have guards of their own, and both are things a
  downstream repo vendors by drift-gated copy: `node scripts/check-schemas.mjs` checks every
  `schemas/*.schema.json` for the draft-2020-12 dialect, keywords that are actually keywords
  (a misspelled one is silently ignored, so the constraint it means is absent) and `$ref`s
  that resolve; `node scripts/check-registry.mjs` checks `registry/`'s column shape, that no
  id is declared twice across the core file and every domain file, and that each cross-file
  pointer resolves. Every guard runs at merge — `.chief/verify.sh` selects them from the
  changed paths, and `.chief/verify-test.sh` asserts that mapping.
- **Every normative reference to an external standard names a version or dated revision** — a bare
  reference is a defect. `docs/reference/upstream-standards.md` is the **table of record** for those pins (the
  reverse of the version/status mirrors above: an upstream version is a shared fact, so it lives in
  one place and the specs cite it). A spec may restate a pin for standalone readability but must
  cite that file, and on disagreement the file wins. Moving a pin is a spec change; a difference
  found on the drift check opens a **finding**, never a silent prose update. Rule stated for authors
  in `specs/README.md` § *External standards — the pin rule*.
- Specs are validated by concrete pressure-test scenarios in `scenarios/` before ratification
  (status: `draft` → `candidate` → `ratified`). Prefer finding breaks over asserting correctness.
- **Adding a file to `scenarios/` is a cross-repo obligation with no local red light.** The
  downstream KCS encoding set is held to **set-equality** with `scenarios/*.md` by a test in the
  implementing repo; no guard in koine checks it, so a new scenario silently breaks that test and
  silently costs its spec the [ratification gate](specs/README.md#the-ratification-gate) (a folded
  clause with no encoding citing it is not promotable). Say so in the scenario's row and in
  `ROADMAP.md` when you add one — do not leave it to be found downstream.
- Identifiers, envelopes, and resolution semantics are defined once in `specs/identity.md`
  (KINP) and referenced — never redefined — by other specs.
- Write clauses against **roles**, never against a named product. Product names may appear only
  as clearly-marked illustrative examples or in informative "known implementations" pointers.

## Current state
- `specs/identity.md` — KINP 0.3.0, **candidate**. ADR-0012 makes the canonical
  identity-authority role federable: a single designated holder remains conformant, while
  multiple independently operated holders reconcile through KINP's existing namespace,
  provenance, and §4 safeguards; local offline-first minting remains unchanged. Candidate pending
  `chief/53-multi-authority-scenario`. Deltas A–E folded; three forks decided
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
- `specs/capability-bus.md` — KCB 0.4.7, **candidate**. Control plane over MCP/A2A; cross-plane
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
  neither moved. 0.4.3 (patch) adds the **MCP** row to §1.1 — **revision 2026-07-28**, a *breaking*
  change with a **stateless core** (no `initialize` handshake, no session id, per-request `_meta`)
  plus a mandatory `server/discover` — and a new **§4.1** auditing which wire each verb assumes.
  Result: **no KCB clause requires the handshake or a session id** (`params.mcp` is an address; the
  §3 crawl and §4 `describe`/`invoke` are request/response; `fetch` is not an MCP call); the one
  session-shaped clause is §4 **`subscribe`**, whose stream rides **A2A streaming** under the pinned
  revision, with "MCP notifications" named as the *pre-2026-07-28* wire — free, because KGP §6 deltas
  are ordering-independent and content-addressed. No field added or removed, no participant required
  to declare its revision; patch, and 0.5.0 is anyway spoken for by §2.2's removal. `KCS 0.2.0` stayed
  **ratified** through that patch-only change and gained only an INFORMATIVE §4 note that a run must record which MCP revision each
  participant speaks. Both gates restated, neither moved. 0.4.4 (patch) adds an INFORMATIVE **§1.2**
  recording the layer claim — *a convention over MCP/A2A, not a new runtime* — and its first external
  corroboration: **Kang & Diponegoro, arXiv:2606.31498, 30 June 2026**, whose gap analysis of five
  protocols against six **governance** dimensions (membership, deliberation, voting, dissent
  preservation, human escalation, audit/replay) concludes that governance is *"a missing architectural
  layer above current interoperability standards, not a missing feature within them."* §1.2 states the
  **non-overlap in both directions** — the paper's axis is collective decision-making, koine's is
  license/egress/tier/budget/grant, so it is validation and **prior art over nothing**, and equally
  koine is **not** an answer to it (no KCB clause implements deliberation, voting or dissent). Cited by
  **arXiv id + date**, deliberately **not** a row in `docs/reference/upstream-standards.md`: a taxonomy
  is not a specification, no clause delegates to it, and a prior-art citation is not a pin. No field,
  no clause, no manifest byte moves; both gates restated, neither moved. 0.4.5 (patch) points §1.2's
  closing bullet — *no KCB clause implements deliberation, voting or dissent preservation* — at
  **ADR-0011**, which decides all three as fabric **non-goals**: 0.4.4 left that as a bare fact, and
  "koine does not do X" reads as an omission until something says it is a choice. The ADR carries the
  evidence (every gate the specs define is **unilateral** and refusal is always available; a sweep
  dated 2026-08-18 found no standards-body specification of the three to profile), the **re-open
  trigger**, and the carve-out that G1/G5/G6 stay *Partial* with findings GOV-1…GOV-3 open. A
  cross-reference in an informative section: no field, no clause, no manifest byte moves; both gates
  restated, neither moved. 0.4.6 (patch) resolves **§8 open question 1** — registry federation — into
  a normative **§3.1** applying **ADR-0012**: one registry per authority domain stays conformant
  unchanged, and where a deployment needs more than one they **peer**. Peering forwards a *query* and
  merges entries, so what comes back is still an **address** and ADR-0001's route-by-lookup-not-proxy
  rule is preserved (a registry never carries `invoke`/`subscribe`/`fetch` for a peer); every peered
  entry is attributable to the peer that served it by KINP id + resolvable address; §3's
  version/deprecation ranking applies to the merged set and two authorities naming the same capability
  are **both** returned, never silently reconciled; an unreachable peer narrows discovery but
  invalidates no manifest, grant, pin, or live subscription. Patch, not minor: additive (no manifest
  field, no verb changes) and **0.5.0 is already spent** on §2.2's removal. New normative text, so it
  adds a **third** candidate count — the cross-authority break test
  `chief/53-multi-authority-scenario`, the same one KINP 0.3.0 names — gating §3.1 alone; the two
  existing gates are restated, neither moved. 0.4.7 (patch) resolves that **last open question** —
  subscription backpressure — into a normative **§4.2**, after the focused pressure leg
  `scenarios/kcb-subscription-firehose.md` returned six deltas **BP-1…BP-6** (blocking BP-5, BP-3).
  BP-5 is why the fold could not wait: §8.1 parked flow control on *"the host's cost advisor"*, but
  §3/ADR-0001 keep the host **off the stream path** and §3.1 federation leaves no host with
  jurisdiction over both ends, so the assignment was **void, not deferred** — nothing downstream
  could ever discharge it. §4.2 puts the mechanism where the topology admits it, **between the two
  peers on the binding's own axis**: an optional port **`volume`** envelope outside the `schema_id`
  digest (as `cost` is) so a firehose is distinguishable from a trickle *before* binding, absent
  reading *unknown* and never *low* (BP-1); optional `subscribe` `max_rate`/`max_in_flight`/`window`/
  `on_overflow` operands under the normative rule that the contract governs **whether an adaptation
  is lossless**, not how fast — coalesce/defer are lossless for KGP payloads by construction, `drop`
  is lossy and must be named, and **a retraction is never shed** (BP-3); an optional
  content-addressed **`resume`** operand (an operand, **not** a sixth verb) a producer MUST answer
  resumed / `gap-unavailable` / `resume-unsupported` and never with silence, plus a
  never-silently-merge-past-an-unseen-`basis` rule, so a gap is **detectable** where content-addressed
  merge left no trace of one (BP-3); a metered subscription — `volume.cost` is the operand §5's
  *"at invoke"* ceiling never had, delivery is the evaluation point, and an exhausted ceiling MUST NOT
  be the **first** signal, which turns a cliff into a brake (BP-2); a `volume.references` operand plus
  the rule that the `fetch` fan-out is the **subscriber's** traffic, bounded by its own declared rate
  and refusable by the CAS holder onto delta L's existing pending-fetch tolerance, holding unchanged
  under KMI §7.1 and §3.1 (BP-4); and **one** in-band control channel in **both** directions — the
  same push channel **V-7** asked for, which V-7's fold MUST ride rather than mint a second. §4.2g
  fixes the boundary: shape, never a QoS contract. BP-6 is evidence for a KCS open question; no KCS
  version moves. Patch, not minor: every field optional on read and write, a subscription declaring
  nothing behaves exactly as at 0.4.6, no verb/plane/port kind added, §7.2's table undisturbed so no
  live subscriber breaks, and **0.5.0 stays spoken for** by §2.2's removal. §8 is resolved **in place**
  (numbering deliberately unshifted, like KFT §11.3 and KMI §9 q3) and **now holds no open questions**.
  New normative text, so a **fourth** candidate count: a re-run of that leg against the folded text,
  gating §4.2 alone; the three existing counts are restated and none moves. 0.4.8 (patch) adds
  normative **§4.3**, the autonomy-posture clause applying **ADR-0013**, after the pressure leg
  `scenarios/kcb-cross-owner-posture.md` returned **AP-1…AP-8** (blocking **AP-5**). The measured
  reason it could not stay downstream: a posture gates **spend and irreversibility**; §5 expresses
  spend exactly and *no field on any capability or port in any of the six specs* said what an
  invocation does that its caller cannot undo — so a cross-owner posture was **inapplicable**, not
  weak (AP-1). §4.3 mints one operand — an optional capability/port **`effect`** class
  (`reversibility` × `visibility`), outside the `schema_id` digest as `cost` and `volume` are, absent
  reading *unknown* and never *harmless*, with `fetch` deliberately getting none because KMI §7.1
  already gates it fail-closed in the right domain — plus a **posture** operand on the existing verbs
  that is a **set of admitted classes**, never a rung name (**koine adopts no rung names and defines
  no total order**; a product ladder is a projection with lossy edges named, ADR-0010's discipline),
  the **monotone-restrictive intersection** rule that answers *which posture wins* with **the
  restriction, always** — no arbitration, no trust, no host on the path (the BP-5 fact) and every gate
  still unilateral, so ADR-0011's **T3 does not fire** — a **floor** no posture may skip (KGP §7, §5,
  KFT §4/§8.1 fire identically at every posture; an unadmitted effect is a refusal, never a silent
  proceed *or substitution*; an undeclared class is not admitted), a **chain rule** (a declared class
  covers the **leg**, not the callee's own code, and a re-dispatch may narrow but never widen the
  posture it was invoked under — modelled on §5's spend ceiling, and the fix for blocking AP-5), KCB's
  **own** minimum refusal shape (AP-6 — KFT §8.1's grades are cited as the profile's richer form, not
  discharged onto), and a plain statement of **what a declaration is worth across a boundary** (AP-7 —
  silence costs the declarant, a misdeclaration breaches a signed and KCS-assertable term, and the
  grant binds where the posture is read). §4.3g is a NORMATIVE conformance requirement: the section
  names **no person and requires no console**, and a refused dispatch is not parked or resumable — a
  widened re-dispatch is a new invocation. Patch, not minor: every field optional on read and write,
  a dispatch declaring no posture behaves exactly as at 0.4.7, no verb/plane/port kind/authority role
  added, §7.2 undisturbed, and **0.5.0 still spoken for** by §2.2's removal. §8 still holds no open
  questions — this fold answers an ADR, not a parked question. New normative text, so a **fifth**
  candidate count: a re-run of that leg, gating §4.3 alone (the four existing counts are restated and
  none moves), with ADR-0013's retained **second-independent-implementation** condition (W3) gating
  §4.3's ratification alongside it.
- `specs/media-interchange.md` — KMI 0.3.4, **candidate**. Media data plane; asset envelope +
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
  0.3.4 resolves **§9 open question 3** — the CAS operational model — into a normative **§7.1**
  applying **ADR-0012**: one shared store per authority domain stays conformant unchanged, and
  where a deployment runs more than one the stores **replicate on reference**. The `asset` id is
  the hash of the bytes, so it is **byte-stable across stores** — a store may never mint, rewrite,
  scope, or namespace an id for a copy, and a replicated copy is the *same asset*, not a §3
  lineage edge. *Which* store holds it is a control-plane lookup (KCB §3.1) after which the holder
  is dialed **directly**, so ADR-0001's route-by-lookup-not-proxy rule is preserved; a receiver
  MUST verify bytes against the id and reject on mismatch; provenance/lineage never replicate
  implicitly (no synthesized envelope or `prov`); replication is a `fetch`, so the **serving**
  participant evaluates license/egress/trust-tier in its own authority domain and fails closed, and
  an asset barred from leaving a domain is not replicated across it; an unreachable store is a
  **pending fetch**, never a broken identifier. Patch, not minor: additive and **0.4.0 is already
  spent** on the EDL removal. §9's numbering is deliberately *not* shifted — question 3 is marked
  resolved in place the way §9.5 already is — so every existing §9.x reference still resolves. New
  normative text, so it adds a **second** candidate count: the cross-authority break test
  `chief/53-multi-authority-scenario`, the same one KINP 0.3.0 and KCB 0.4.6/0.4.7 name, gating §7.1
  alone; the outstanding KCB re-run is restated and does not move.
- `specs/conformance-scenario.md` — KCS 0.3.0, **candidate**. Declarative, replayable scenarios
  driving participants over their real MCP/A2A connections; cross-plane assertion vocabulary.
  The 0.3.0 determinism fold adds `structure_matches(a, b)` and requires generated-output
  scenarios to assert stable structure/invariants rather than exact bytes/content; §7.1 and §7.3
  remain open.
- `specs/fine-tuning.md` — KFT 0.6.0, **candidate** (ratified 2026-07-23 on two pressure passes:
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
  KFT rows of `docs/reference/upstream-standards.md` plus five §3.3 target rows are pinned. Status stays
  candidate on the same restated gate — the owner's re-run of `e2e-producer-exhaust-finetune.md`'s
  *Re-validation — KFT 0.4.0* — with §3.3/§8.1 recorded as new normative surface no pass has
  exercised, not as a second gate.
  0.6.0 folds the **focused** pressure leg `scenarios/kft-resume-checkpoint.md` (FT-R…FT-V), which
  attacked **§11 open question 3 alone** and split its two claims. **Warm start needed no new
  surface**: a prior finetuned model is a KINP `model` entity, so `base_model` already takes it and
  §5 lineage / §5.4 inheritance / §5.1.1 publication compose transitively. **Resumption did not
  carry** and is folded: NORMATIVE **§3.4** adds the optional top-level `resume`
  `{checkpoint, of_job, at_step}` — a pinned input (it enters §5.2's `used[]`, so FT-C's anchor keeps
  determining the run), the **only** slot for a resume ref (one carried in the permissive
  `hyperparams`, which no gate reads, is refused `invalid`), and **never corpus** (it gates without
  being priced). **§4.2** takes the effective egress over `{data ∪ base ∪ resume.checkpoint}` and
  **§4.3** puts it in the union license/tier, closing the continued-pre-training hole; **§5.4** binds
  a checkpoint's class **at publication** rather than at completion (that hole existed independently
  of resume, on the §6 `subscribe` stream); **§5.2** makes a continuation leg a **new** activity
  linked by the new core relation **`continues`** in `registry/relations.tsv` (distinct from
  `retrains` = re-train-from-scratch and `supersedes` = replaces); **§6** keeps `job+step` idempotency
  sound, counts `step` from the root leg so legs overlap deliberately, adds the NORMATIVE curve-**join
  rule** (order by the chain, later leg wins on an overlap) and an optional non-authoritative
  `attempt`; **§7** estimates the **remainder** with `at_step` verified against the prior leg's
  provenance, checked against the ceiling **net of cumulative `spent_units` across the chain**.
  §3.3.1's gating set and §3.3.2 (two rows + a fifth normative consequence) follow. §11.3 is marked
  **resolved in place** — numbering deliberately unshifted, like §11.5 — and §11.1/§11.2/§11.4/§11.6
  stay open. Strictly additive (a cold job with no `resume` is admitted and refused on exactly the
  inputs it was before, and `resume` is not `required`), adopts no new external standard, and adds no
  plane, artifact kind, media type, or KCB verb. It **does** add a **second** gate: a re-run of that
  leg against the folded text, alongside the restated-and-unmoved *Re-validation — KFT 0.4.0* re-run.
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
- **The downstream run is recorded and citable, and reading it wrong is the live hazard.** Every
  `scenarios/*.md` carries a populated `## Downstream results` section (2026-08-26), written off
  `agora/console/evidence/kcs-live-run.json` — the 2026-08-24 run of the nine KCS encodings,
  `sha256-2d9e6c43…c17bb3`, 19/32 slots live, verdict `partial-live`. Twelve findings **DR-1…DR-12**
  are indexed in `scenarios/README.md`, each defined once in the document it bites. Three rules a
  reader needs: (1) **`green` is not a gate verdict** — it means every encoded step and assertion
  passed, and two scenarios came back green over four and six open blocking deltas (DR-7, DR-8),
  because an encoding deliberately does not assert an unfolded delta; (2) a green encoding is
  evidence only for what it **encodes**, and three clauses no assertion reaches are recorded (DR-3
  KGP §4.1 round-trip, DR-4 KMI M-1, DR-5 KFT §3.3/§8.1); (3) the artefact gate is met for **four**
  of six — KFT's second gate and KCB's §4.2 count sit on scenarios written after the encoding set
  was frozen and have none (DR-11, DR-12), both unowned. `scenarios/README.md`'s **KCS encoding**
  column is the register of record; `ROADMAP.md` Phase F4 and `docs/reference/promotability.md`
  restate it and are the bug on disagreement. No version moved for any of this — the follow-through
  is recorded as a dated **Editorial** changelog entry in each of the six specs.
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
  plus the one fabric-wide deprecation policy), ADR-0010 (KMI is a **bridge** between C2PA and
  MovieLabs OMC, not a third lineage vocabulary — §3's relations are retained as the fabric-internal
  form and projected onto both, explicitly *not* losslessly), and ADR-0011 (deliberation, voting and
  dissent preservation are **non-goals** — koine specifies what crosses an organizational boundary,
  not how one organization decides; every gate it defines is unilateral, nothing exists to profile as
  of 2026-08-18, and the record states the trigger that re-opens the verdict, while leaving G1/G5/G6
  measured *Partial* with findings GOV-1…GOV-3 open), ADR-0012 (authority roles may **federate**
  without becoming dependencies — one holder stays conformant, several peer; applied by KINP §11
  decision 1, KCB §3.1 and KMI §7.1), and ADR-0013 (**autonomy posture is a contract clause, in the
  boundary half only** — decided against the two cross-owner edges in `ECOSYSTEM.md` §3, it takes up
  the **G5** carve-out ADR-0011 §4 left open: a posture governing a cross-owner dispatch is
  interchange, but the console **ladder is not adopted** — postures are named by the classes of
  effect they permit unattended, and a product's rungs are a *projection* onto them. The measured
  reason is that a posture gates spend **and** irreversibility, and while KCB §5 expresses spend,
  **nothing in the fabric names irreversibility**, so a cross-owner posture is not weak but
  *inapplicable*; and since only the callee's unilateral gates plus the caller's narrowed grant bind
  across the line, an advisory mode flag buys nothing. Mints one operand — a port **effect class**,
  absent reading *unknown*, never *harmless* — plus a posture operand on existing verbs, and one rule:
  posture is **monotone-restrictive**, so the effective posture is the **intersection** and the
  restriction always wins, which is also why ADR-0011's trigger T3 does **not** fire. The **floor**:
  no posture relaxes KGP §7, KCB §5 or KFT §4/§8.1; an unadmitted effect is a refusal, never a silent
  proceed or substitution. No new plane, verb or authority role, and it MUST be expressible with **no
  console at all**. The second-independent-implementation condition is kept as a **ratification** gate
  beside the pressure-test scenario — both now recorded in KCB §4.3, which is where the clause landed
  the same day (0.4.8), so the ADR's "no spec version moves" applies to the record and not to the day; withdrawal triggers W1–W3 are stated; the approval mechanism, the
  human authority, intra-org supervision and GOV-2's decision record are explicitly out of scope. No
  spec version moves).
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
