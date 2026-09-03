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
- **A status change reaches further than the four mirrors.** The guard passes on a table row that
  merely contains the version and the status *word*; it says nothing about the prose all over the
  repo that **counts** statuses ("six of six remain candidate", "0 of 6 specs ratified", "four sit
  there now") or **ranks** what is closest to promotion. Before flipping a spec's status, grep for
  `candidate` and `ratified` across `*.md` and read every hit that carries a count, a ranking or an
  owner — `ROADMAP.md`'s status line, `docs/reference/promotability.md`, `specs/README.md` § *The
  ratification gate*, and `scenarios/README.md` are the dense ones. And when a change is meant to
  move no clause, **prove it**: slice the old and new file on section headers
  (`git show HEAD:specs/<x>.md`) and compare, rather than eyeballing `git diff --stat`.
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
- `specs/identity.md` — KINP 0.4.0, **candidate**. ADR-0012 makes the canonical
  identity-authority role federable: a single designated holder remains conformant, while
  multiple independently operated holders reconcile through KINP's existing namespace,
  provenance, and §4 safeguards; local offline-first minting remains unchanged. Candidate pending
  `chief/53-multi-authority-scenario`, which has **run and was not clean** — deltas MA-1…MA-11.
  0.4.0 is **the federation fold**, KINP's five: **§4.1** a `same_as` closure spanning two
  authorities MUST be cut at the boundary or have each imported link re-evaluated against the
  consumer's own threshold, and a multi-authority path carries its **weakest issuer and lowest
  confidence** into the view — the operand is §4.2's existing `src`, so no envelope field is added
  (MA-1); **§4.5** a **fourth, fail-closed branch** — *operand unresolvable* → `based_on` or nothing
  and queue, **never `same_as`** — distinct from the third branch, which is about confidence (MA-2);
  **§6** claim-id convergence is **domain-scoped**, the re-expression target is the participant's
  **own** authority's canonical entity, and the cross-domain instrument is the §4 equivalence view,
  not a shared hash — **no existing claim id moves** (MA-3); **§4.2** one **new core relation**
  `world_aligns_with` over two world ids (never `same_as` widened in place — a signature is
  immutable), with §4.3's firewall preserved, plus **§5**'s statement that each authority's
  `…:world:consensus-reality` is its own and cross-domain sameness is asserted, never assumed
  (MA-4); **§3.4** the prefix registry is the one deliberately **non-federated commons**, with
  prefix-disjointness and collision-is-a-reportable-defect (MA-7). Minor because four of the five are
  normative surface a reader implements against, though behaviour is additive. Two alternatives are
  **rejected on the record** — a namespace-free canonical world token (it re-hashes every real-world
  claim) and an authority-scoped prefix form (it changes every identifier's shape) — and two
  remainders deferred with triggers (DEFER-A the control-plane route for world metadata, DEFER-B a
  federation-scoped canonical over §4.4's anchor); see
  `docs/reference/federation-fold-dispositions.md`. **Stays candidate**: a fold does not close its
  own gate, so the single count became a re-run of that pass against the folded text — and **that
  re-run has now been walked, by hand, on 2026-09-03, and its prose leg is clean**: Step 1 holds and
  Steps 2/3/4/6 all flip, no MA delta reproduces against 0.4.0 and no new KINP delta was found, with
  one declared residual on the fail-closed side (DEFER-A). Deliberately **not** a replay of
  `kcs:multi-authority`, which returned `green` over the original not-clean pass (DR-8). KINP is
  **still not promoted, and no version moves** — the walk changed no clause (§0–§10 and §11 decisions
  2/3 byte-unchanged, no claim id moves; the edit is §11 decision 1's gate paragraph plus a
  changelog entry). What blocks it now is the fabric-wide **KCS-encoding** condition of
  `specs/README.md` § *The ratification gate*: `kcs:multi-authority` predates the fold and asserts
  none of §4.1's weakest-link rule, §4.2's `world_aligns_with`, §4.5's fourth branch, §6's
  domain-scoping or §3.4's non-federated commons, so it must be **extended**, not re-run — the DR-7
  shape, bounded by MA-11 / KCS open question 1, downstream under ADR-0001 and **unowned**. The walk
  also left one blocker on **KCB** (Step 5 — ADR-0014's decided-but-unwritten clause) and one on
  **KMI** (Step 10 — new delta **MA-12**); it clears at most one of KCB's five counts and one of
  KMI's two, and **promotes neither**.
  Deltas A–E folded; three forks decided
  (single identity **authority role** for real-world entities, hybrid merge policy, `@world(W)`
  argument); `embedding_model` added.
- `specs/grounding-pack.md` — KGP 0.5.2, **ratified** (2026-08-28). Knowledge data plane; normative §3
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
  byte-unchanged, so no claim id moves. **Promoted 2026-08-28** on the last gate it had — the
  downstream §4.1 **round-trip fixture** (a validator artifact per ADR-0001, cross-repo), verified
  2026-08-26 as *not delivered* (emitter, no reader, so rule 2 had never run) and delivered since:
  reader, rule 2 re-derived from the recovered graph and rejecting, four packs × three encodings and
  a mutation test per encoding, read at `agora af5b7dd3a1201eff70067f45e7824614a81769ac` by
  **running and perturbing** it (152/0 green; eight hand-made perturbations inside §3.1's hashed set,
  all refused) — never from a `passes` flag, which is the 2026-08-22 error the record exists to not
  repeat. Its other count, the KCS encoding, was met 2026-08-19 (`kcs:worlds-to-fabric`,
  `live-pass`); the two stay **separate evidence for separate things** (**DR-3**: the encoding never
  attempts the round-trip). Ratification does **not** freeze the evidence — the artifact is current
  only while `check-kgp-roundtrip-evidence` is green downstream — and a model-shape change returns
  KGP to candidate the ordinary way. Record:
  `docs/reference/kgp-projection-gate-verification.md`; §4.1 now names **no owner for an open
  remainder**, because it has none. The status change moved **no clause**: §2–§9 outside §4.1's gate
  paragraph are byte-unchanged and no claim id moves. The federation fold (2026-08-26) touches KGP **not at all**: an
  **Editorial** entry records its reading of MA-3/MA-4/MA-5 — the scenario names KGP a *consequence
  surface, not a gated spec* — and all three are answered in KINP §6/§4.2/§5 and KMI §2 by the
  define-once rule. §3.3's convergence is correct and intact (Step 4 records byte-identical canonical
  forms), §7's `world = consensus-reality` filter reads over KINP's new `world_aligns_with` closure
  without §7 moving, and KMI **reuses** §7.1/§7.2's classes on the asset envelope while KGP's own
  enforcement point (pack construction, for records) is unchanged. **No clause, no version, no second
  gate** — deliberately, on the spec closest to promotion.
- `specs/capability-bus.md` — KCB 0.5.0, **candidate**. Control plane over MCP/A2A; cross-plane
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
  `chief/53-multi-authority-scenario`, the same one KINP §11 decision 1 names — gating §3.1 alone;
  the two existing gates are restated, neither moved. 0.4.7 (patch) resolves that **last open question** —
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
  §4.3's ratification alongside it. 0.4.9 (patch — 0.5.0
  **stays** spoken for by §2.2's removal, the same minor V-1…V-8 occupy, so this fold takes nothing
  `86` needs) is **the federation fold's control-plane half**, folding the three deltas the
  cross-authority break test left against §3.1: **MA-6** (blocking) — discovery federated and
  authorization did not, so **§5** now requires a grant to name its **issuing host** by KINP id and a
  provider to state which issuers it honours via an optional **`auth.accepted_issuers[]`** in §2, a
  federation being a **stated** set of accepted issuers and an unrecognized issuer **failing closed**,
  while a `budget_units` ceiling crossing a boundary states its unit or the `invoke` is refused for
  want of one; KMI §7.1(b)(e)'s `fetch:asset` leg inherits all of it by citing §5, needing no clause
  of its own. **MA-8** — three of §3.1's six clauses were asserted with no carrier, so **§3**'s `find`
  response gains a shape: per-entry `served_by` (the serving registry's KINP id, the peer's for a
  peered entry) with a resolvable address and `observed_at`, plus a result-level `incomplete[]`
  naming unreachable peers; mechanization of clauses already normative, deliberately **not** a
  ranking or trust weighting, which §3.1(d) refuses. **MA-9** — **§3.1(b)** gains a horizon (query id
  + remaining hop count, drop a query already seen) and **§3.1(d)** gains its **converse**: entries
  resolving to the same provider KINP id, `(name, version)` **and** `schema_id` are **one**
  capability with multiple attributions, never two. Patch: the one manifest field is optional on read
  and write, the response shape is emitted only by a federating deployment, and §7.1's digest and
  §7.2's compatibility table are undisturbed. Bounded on purpose: no token format/issuance/rotation
  or issuer-discovery protocol (§5's own boundary), and §3.1(b) bounds a **query**, not a topology.
  **Stays candidate**; the §3.1 count became a re-run of Steps 5–7 against the folded text, and that
  re-run was **walked by hand on 2026-09-03 and did not close it**: Steps 6/7 flip and MA-6/MA-8/MA-9
  all hold under re-attack, but **Step 5 breaks on ADR-0014's decided-but-unwritten clause** — §7.3's
  deprecated marking has no carrier in §2/§3 and §3.1(d)'s converse merges a stale and a fresh
  attribution into one entry whose marking is undefined, exactly the count ADR-0014 said it would land
  with. Count (iii) now reads *write ADR-0014's four-part clause, then re-run Steps 5–7*; the other
  four counts are restated, none moved, and **KCB is not promoted** — clearing one of five is not a
  promotion. The walk moved **no version and no clause**: a gate paragraph and an Editorial changelog
  entry only. 0.5.0 (**minor** — the one KCB had left, and the same
  one §2.2's removal was declared against) is **the capability-versioning fold**, folding the deltas
  of count (ii), the §7.5 break-test `scenarios/e2e-live-schema-mutation.md` (V-1…V-8, blocking
  V-2/V-4/V-5/V-7). §7's *model* was never in question; its **perimeter** was. Seven fold and one
  closes: **V-2** — **§2.1** gains an optional knowledge-port **`payload_schema_id`** and **§7.1**
  the rule that matters more, that a bare `shape` establishes **routing** identity and *not* payload
  identity, so a consumer MUST read it as §7.1's own *no cross-check available* (a silent break
  becomes a **declared absence**); the **shape registry** alternative is **rejected on the record**,
  because it would mint a commons two authority domains must agree on before exchanging a knowledge
  port, against KINP §3.4's one non-federated commons and ADR-0007. **V-4** — new **§2.4**, an
  optional per-entry transport **`binding`**, so §7.2's mandated dual-serving window is operable on a
  flat, name-keyed MCP tool namespace: **two namespaces, only one governed** — the capability *name*
  stays version-free because the registry matches it (§7.1 untouched), the transport id is local and
  nobody discovers by it, and it is read from the manifest, **never guessed**. **V-5** — new
  **§4.4a–c** with **§5**: an optional `version` operand on `invoke`, the granted major made
  **readable inside the token** (the grant's `invoke:<capability>` *name* unchanged, so §5's
  anti-fragmentation argument stands), and a resolution rule stated exhaustively — operand, else
  grant, else **refuse for want of a version**, never a default, with *highest published* forbidden
  **by name** because it inverts fail-closed into fail-open. Deliberately the shape 0.4.9 gave
  `budget_units` at MA-6: under ADR-0001 there is no hub to arbitrate which major was meant. **V-7** —
  new **§7.3g**, three named frames (`successor_published`, `deprecated` with its removal version,
  `removal`), each emitted **before** the fact it announces, on **§4.2d's existing** control channel,
  which already forbade minting a second; the binding forms it cannot reach (a cached discovery
  binding, a grant, which does not expire) are **stated**, not implied closed (DEFER-D). **V-3** —
  **§7.1 step 5**, a canonicalization **rule id** in the digest prefix, **absent meaning `kcb1`** and
  this version stating `kcb2`, with a port declaring no `payload_schema_id` canonicalizing
  byte-identically under both, so **no published digest moves**; an unknown rule id reads
  *incomparable*, never *mutated*. Not optional given V-2, which grows the very vocabulary V-3 says
  fires it. **V-6** — **§7.3c**'s floor split by axis: a retiring **capability major** waits for the
  successor's next major, while a **koine-spec** axis keeps one full minor, so §2.3's and KMI §4.4's
  removal versions do not move (`deprecated_at` is DEFER-E). **V-1** — **§4.4d**'s optional
  `quoted_cost` and a refusal that names *quote mismatch*; not a price lock. **V-8** — **closed**, not
  folded: KCS §7 open question 1 already cites it by name, and no KCS version moves. Minor rather than
  patch because seven folds are normative surface a reader implements against and §7.2's own table
  gains a reader's obligation. Publishing 0.5.0 also **discharges §2.2's declared removal** of the
  standalone `/.well-known/kcb-manifest.json` (§7.3f) — a deadline arriving, not a fold; §2.3's window
  is untouched and still runs to **0.6.0**. **No schema twin and no registry file moves.** **Stays
  candidate**: count (ii) is now a re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text — and
  per **DR-7** that re-run needs the KCS encoding **extended** to the scenario's new **F1–F13** set
  first, since the existing one deliberately asserts no unfolded delta — and the other four counts are
  restated, none moved.
- `specs/media-interchange.md` — KMI 0.3.5, **candidate**. Media data plane; asset envelope +
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
  `chief/53-multi-authority-scenario`, the same one KINP §11 decision 1 and KCB §3.1 name, gating
  §7.1 alone; the outstanding KCB re-run is restated and does not move. 0.3.5 (patch — 0.4.0 stays
  spent on the EDL removal) is **the federation fold's media half**, after that break test ran and
  left two deltas here: **MA-5** (blocking) — the §2 envelope gains optional **`license`** and
  **`egress`**, valued from KGP §7.1/§7.2 and **excluded from the id** so no `asset` id moves; §7.1(d)
  gains the one narrow carve-out its own reasoning implied (the governing policy is the single thing
  accompanying replicated bytes, and it travels because it is *carried*, never synthesized); §7.1(e)
  gains the consequence that makes the gate decidable at a second holder — the asset's own policy is
  evaluated **in addition to** the serving domain's, `local-only` never crosses an authority-domain
  boundary, and a copy whose policy did **not** travel MUST NOT be served onward, which closes the
  laundering-by-retention hole at the retainer. **MA-10** — §7.1(f) gains a three-valued answer, *not
  held, and not expected* distinguishable from *not reachable*, so a consumer polling the reachable
  set can conclude; (f)'s substance is untouched and still invalidates nothing. **No KGP clause
  changes and no enforcement point moves** — KGP §7.2 still filters `local-only` **records** at pack
  construction, while these fields govern **bytes** at `fetch` time — and **no schema twin changes**,
  since none models the §2 envelope. Deliberately unwritten: no minimum replica count, no retention
  obligation, no durability guarantee, and no designated durable holder (DEFER-C). **Stays
  candidate**; the §7.1 count became a re-run of Steps 8–10 against the folded text, and that re-run
  was **walked by hand on 2026-09-03 and did not close it**: Steps 8/9 flip and **MA-5 does not
  reproduce** — §2's `license`/`egress` give §7.1(e)'s gate its operand and (d)/(e) close
  laundering-by-retention at the retainer — but **Step 10 breaks on new delta MA-12**: §7.1(f)'s three
  answers have no carrier on the wire, since KCB §4's `fetch` defines no response vocabulary, §7 here
  defines *the payloads, not the pipe*, KCB cites §7.1(f) nowhere, and KCB §4.2f already spends
  *pending fetch* on a fourth state (held-but-rate-limited). Count (i) now reads *fold MA-12 (a
  two-spec carrier fold, KCB §4 + KMI §7.1(f), additive; no `asset` id moves and **DEFER-C is
  unmoved**), then re-run Steps 8–10*; count (ii) is KCB's work, untouched, so **KMI is not promoted**
  and would not have been on a clean pass. The walk moved **no version and no clause**: a gate
  paragraph and an Editorial changelog entry only.
- `specs/conformance-scenario.md` — KCS 0.3.0, **candidate**. Declarative, replayable scenarios
  driving participants over their real MCP/A2A connections; cross-plane assertion vocabulary.
  The 0.3.0 determinism fold adds `structure_matches(a, b)` and requires generated-output
  scenarios to assert stable structure/invariants rather than exact bytes/content; §7.1 and §7.3
  remain open. Its single count — a re-validation of that fold against
  `scenarios/kcs-format-stress.md` — was **walked by hand on 2026-09-03 and did NOT close**. The walk
  states per delta which evidence carried it, deliberately: **M/N/O** and the assertion half of **P**
  lean on the 2026-08-24 run of `kcs:format-stress`, while **Q** in full, the firing half of **P** and
  every replayed delta's clause were **hand-read** — Q by necessity, since **DR-10** leaves the runner
  without the predicate. The regression set flips (**P** with one declared residual: no run has ever
  exceeded a `timeout_ms`, so §4's fails-liveness path is unexercised — a suite-coverage gap, not a
  delta). **Q half-flips**: byte equality is forbidden normatively, but `structure_matches` entered
  the fixed core with *only* that negative constraint and its **comparison basis is fixed nowhere** —
  no slot in §2/§3 where a scenario declares which invariants must match (the signature is fixed at
  two operands), no plane clause behind the *Determinism/invariants* group where every other §5
  predicate delegates to one, and two operands that are `asset` ids, i.e. hashes of
  deliberately-differing bytes. Two conformant runners may return different verdicts for one document
  and §4's content-addressed report hides the divergence → new blocking delta **R**. **KCS stays
  0.3.0 candidate; no version and no clause moved** (§2/§2.1/§3/§4/§5 byte-unchanged — a
  read-and-confirm pass, not a fold; the edit is a *Pressure test* record, a §7.2 evidence note and a
  changelog entry). The count **changed shape**: from *re-validate the fold* to **fold R — fix the
  basis in §5 by delegating it to named clauses one plane over, or give §2/§3 a declaration slot —
  then re-validate again**, a normal minor revision gated by a pressure test, and **unowned**. It is
  deliberately *not* §7.1 (that escape hatch is for predicates §5 cannot express; R is one it *does*
  express with an open basis) and §7.2 is **not reopened** — the fold is incomplete, its clause
  stands. **DR-10 is now two things**: as a *qualification* on this count it is **discharged** (a
  hand-walk did what a replay could not, and R is what was under it — a replay could not have found R
  even with the predicate implemented, one runner being internally consistent); as a *drift* it is
  untouched and stays **downstream and unowned** under ADR-0001, and must not be closed by editing the
  console's vocabulary from this repo. When KCS does promote it is under the **ordinary,
  conformance-gated** rule, not 0.2.0's grandfathering — that clause does not survive a demotion, and
  the artefact debt it covered was paid 2026-08-19.
- `specs/fine-tuning.md` — KFT 0.7.0, **candidate** (ratified 2026-07-23 on two pressure passes:
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
  0.7.0 (**minor**) adds **two `modality` tokens** to §3.1 — `text-to-audio` and `audio-to-audio` —
  over the **existing** `media(audio)` plane, verified in four independent places in KMI (§2's IANA
  `media_type`, §2's `probe` audio stream, **§6's own worked port example `media_types:
  ["audio/wav"]`**, §8's Audio-producer role) rather than asserted. `text-to-audio` is the third
  `text-to-image`/`text-to-video` diffusion row (`lora|full`; TTS rides it, deliberately not a sixth
  row — splitting later is cheap, unsplitting impossible). `audio-to-audio` is a **decided**, not a
  symmetric, row: the case against it (it is a filter, and KMI §6 already types `audio/wav →
  audio/wav`) fails because the enum is not generation-only, because §6 types an **invocation** where
  §3.1 types a **training target**, and because with no token a voice-conversion job must declare
  `text-to-audio` — making **FT-F**'s admission check validate a false declaration. It lands on **its
  own axes** (`typical_base` is small task-specific architectures — RVC, so-vits-svc, Demucs — not
  foundation models, so `full` leads its method ordering; corpus is paired asset↔asset with **no
  caption side**). **No clause of §4 moves** — checked, not inferred: both sides of a pair are
  `dataset.media[]` entries already inside §4.2's most-restrictive union and §4.3's — and **no plane,
  artifact kind, media type, KCB verb, or `registry/media-types.tsv` row** is added (`audio/wav` is
  IANA's, as `video/mp4` is; the commissioning framing that KMI "lists `audio/*` in its media types"
  is corrected on the record). Minor because §3.1's table is surface a reader implements against and
  two new admissible tokens widen what a conformant provider must recognise. A **forward
  declaration** with named consumers — formant (both rows; its `KftModality` must mirror this enum
  verbatim), lugh (`audio-to-audio` especially — `personal`/`local-only` recordings route to local
  compute by §4.2), agora (both, the all-`exportable` FT-F case). **No third gate**: both gates are
  restated and neither moves, but no pass walks an audio job, so the two tokens are recorded as
  **unexercised vocabulary** the way §3.3/§8.1 already are. Landed in all **four** statements of the
  vocabulary — `registry/enums/modality.tsv`, §3.1's table, `schemas/finetune-job.schema.json`'s
  `properties.modality.enum`, and `registry/README.md`'s prose bullet, the fourth being the one **no
  guard checks**. Record: `docs/reference/generative-audio-modalities.md`.
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
  `sha256-2d9e6c43…c17bb3`, 19/32 slots live, verdict `partial-live`. Thirteen findings **DR-1…DR-13**
  are indexed in `scenarios/README.md`, each defined once in the document it bites. Three rules a
  reader needs: (1) **`green` is not a gate verdict** — it means every encoded step and assertion
  passed, and two scenarios came back green over four and six open blocking deltas (DR-7, DR-8),
  because an encoding deliberately does not assert an unfolded delta; (2) a green encoding is
  evidence only for what it **encodes**, and three clauses no assertion reaches are recorded (DR-3
  KGP §4.1 round-trip, DR-4 KMI M-1, DR-5 KFT §3.3/§8.1); (3) the artefact gate is met for **four**
  of six — KFT's second gate and KCB's §4.2 and §4.3 counts sit on scenarios written after the
  encoding set was frozen and have none (DR-11, DR-12, DR-13), all unowned. `scenarios/README.md`'s **KCS encoding**
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
  spec version moves), and ADR-0014 (**a federated merge merges attributions, never contents** — the
  one finding of reading the federation fold (KCB 0.4.9) against the capability-versioning fold
  (KCB 0.5.0), two folds that landed in one spec on one day from two tasklists; ten of eleven seams
  agree, and the eleventh is a **gap at the seam** rather than a contradiction, which is why it is a
  record and not a patch to whichever fold merged second. §7.3's *deprecated marking* and its removal
  version have **no carrier** in §2 or §3 — MA-8's class, unreached by that fold — and §3.1(d)'s
  de-duplication converse keys on `(provider KINP id, (name, version), schema_id)`, none of which a
  marking moves, so a stale attribution and a fresh one come back as **one** entry whose marking is
  undefined and §3.1(e) cannot fire; V-7 is what makes it bite, having just established that for a
  discovery binding the pull side is the *whole* contract. It generalizes: §3.1(d)'s key is the digest
  key plus `version`, so every operand deliberately kept **outside** the digest — `cost`, `binding`,
  `volume`, `effect`, the marking — is outside the merge key too, and only the two with a declared
  §7.2 bump are rescued. Decides: the marking gets a **carrier** extending MA-8's response shape; a
  registry **MUST NOT synthesize** a value for a field outside the key; where the field is a **gate**
  the **restriction wins** (ADR-0013's monotone-restrictive discipline reused); and none of it licenses
  reconciling two **authorities**. **No spec version moves** — the clause spans both folds' sections and
  lands with KCB counts (ii) and (iii). The read of record is
  `docs/reference/fold-coordination-federation-versioning.md`, which also carries the six **agora**
  findings AG-1…AG-6 and the plain answer that KCB is **not** promotable).
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
