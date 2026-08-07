# ADR-0008 — An application joins the fabric as a producer through a thin adapter

**Status:** Accepted (2026-08-06)
**Deciders:** ecosystem owner
**Extends:** [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) (koine
specifies, the runtime commons implements),
[`ADR-0007-self-describing-participant.md`](ADR-0007-self-describing-participant.md) (a participant
publishes its own four facets)
**Draws on:** [`ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](ADR-0006-kgp-rdf-prov-jsonld-relationship.md);
[`../specs/identity.md`](../specs/identity.md) (KINP) §4.1–§4.5;
[`../specs/grounding-pack.md`](../specs/grounding-pack.md) (KGP) §3, §5, §7;
[`../specs/media-interchange.md`](../specs/media-interchange.md) (KMI) §3, §4.3;
[`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT) §4;
[`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB) §2
**Applies to:** any participant claiming the **producer** role, and to the shared runtime commons.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

The four planes are specified and the contracts are complete. What was never recorded is the
question every adopting application actually asks first: **what do I have to build to become part of
the fabric?**

The default answer has, in practice, been *a bridge* — a module inside the application that reads
its native store, reconciles its own entities, filters by license, and writes out one export format
per consumer it knows about. Applications that adopted early built exactly this: an entity-grounding
pass, a canonical-graph exporter, a training-dataset exporter, and a family of read-time projections
that rendered internal records into whatever shape a downstream tool wanted. Each was written once
per application, and each re-derived, privately, decisions this repository had already ratified —
which relation a grounding link uses, how a claim normalizes and hashes, what a license class admits,
what may leave a tier at all.

That shape has three costs. It is **N² by another name**: a projection family per application per
consumer is the point-to-point web koine exists to remove (README, *"The problem it solves"*). It
**forks the contract**: a private grounding pass that picks its own relation name, or a private
exporter that hashes claims its own way, is a second source of truth for something `registry/` and
KGP §3 already fix — and it drifts silently, because nothing checks it. And it **duplicates work the
data planes already did**: the specs have since withdrawn or generalized the very mechanisms those
modules hand-rolled. KMI §4.3 withdrew the bespoke one-directional `skill_export_*` projection family
in favor of OTIO's own bidirectional adapters (ADR-0005). KINP §4.1 made "the merged entity" a view
computed at **query time** from the `same_as` closure, never a merge written back over the sources —
so an application that materializes a merged export is producing a stale snapshot of a view its
consumers can compute themselves, correctly, at read time.

Two questions therefore need answers a downstream repository can cite:

1. **What is the minimum an application builds** in order to be a fabric producer, and what does it
   *not* build because the shared layer already provides it?
2. **How does it say that one of its records refers to a canonical entity** — the single operation
   every one of those hand-rolled bridges implemented, under a different name each time?

The second question had a tempting wrong answer waiting: coin a `mentions` relation. It reads
naturally ("this document mentions Napoleon"), it is what the extraction step feels like it produces,
and more than one bridge shipped a private predicate to that effect before the identity firewall
(KINP §4.3) existed.

## Decision

**An application becomes a fabric producer by emitting koine contracts through a thin adapter. No
new protocol, no new plane, and no per-application bridge.**

**1. The adapter emits the contracts; it does not extend them.**
For the roles it claims, a producing application publishes exactly these four surfaces, all of which
are already specified:

| Surface | What the adapter emits | Contract |
|---|---|---|
| **Knowledge** | KGP claims over **registry** relations, normalized and content-addressed by §3, in the §4 canonical encoding | KGP §3, §4; [`../registry/`](../registry/); ADR-0006 |
| **Media** | KMI asset **references** (content-addressed ids + envelope) and lineage edges, never re-specified timeline models | KMI §2, §3, §4 |
| **Training exhaust** | a KFT dataset **by reference** — KGP pack ids and KMI asset ids plus a `dataset-jsonl-header`, never inlined training payloads | KFT §4.1, §4.2 |
| **Capability** | a KCB capability manifest, served as the named AgentCard extension | KCB §2; ADR-0007 decision 2 |

The adapter's whole job is **translation at the edge**: map local records onto these shapes, stamp
provenance/confidence/license (KINP §7.1, KGP §7), and apply the producer-side egress filter at pack
construction (KGP §7.2, ADR-0007 decision 5). It coins no relation (`registry/README.md`), mints no
identifier scheme beyond its own registered prefix (KINP §3.4), and defines no encoding.

**2. Generic data-plane bridging is built once, in the runtime commons — not per application.**
Admission and license-policy filtering, claim normalization and merge, the query-time `same_as`
view, the §4.1 RDF-star / PROV / JSON-LD projections, KFT dataset admission under the egress gate,
and OTIO adapter round-tripping are **generic**: they read only contract shape, never an
application's internals. Per ADR-0001 decision 6 they belong in the shared runtime commons, written
once against these specs, and every producer gets them by conforming rather than by implementing.
This is the same split as ADR-0001's data plane — *dumb pipes, smart endpoints* — applied to
integration code: the endpoint stays thin because the commons is generic, not because the contract
is thin.

**3. Per-application bridge and projection modules are superseded.**
An application-resident module that grounds entities, exports a canonical graph, exports a training
dataset, or renders read-time projections of internal records into consumer-specific shapes is
**superseded by decisions 1 and 2** and SHOULD be retired to an adapter as the application next
touches it. This is not a new stance; it is the one already taken piecewise by the specs —
KMI §4.3 withdrawing `skill_export_*`, KINP §4.1 making entity merge a query-time view, KGP §3
fixing one normalization for all producers — stated once, at the level of the pattern. Retirement is
a downstream migration, sequenced by each participant; koine states what the target is, not when a
given adopter arrives at it.

**4. How the adapter is produced is a deployment choice.**
An adapter MAY be hand-written (the ordinary case for an application that already speaks A2A or MCP)
or generated from a declarative description of the application's records by a downstream
code-generation tool. Both are conformant and neither is privileged: conformance is judged on the
bytes emitted, against these specs and [`../scenarios/`](../scenarios/), never on how the emitting
code was authored. koine specifies no adapter framework, ships no adapter code, and takes no
dependency on any generator.

**5. Grounding a mention reuses `same_as`; koine adds no `mentions` relation.**
When an adapter asserts that one of its local records refers to a canonical entity, it emits a
**`same_as` link from its own source-local id to the canonical id**, carrying confidence and
provenance like any other assertion (KINP §4.2), and subject to the §4.5 rule: `same_as` within a
world or an identity-inheriting world, **`based_on`** across a world boundary that does not inherit
identity (the fiction→real firewall, §4.3), and **nothing at all** when the match is ambiguous or
below threshold — queued for review rather than asserted weakly. Consumers see the grounded result
through the **query-time merge view** over the `same_as` closure (§4.1); nothing is written back over
either side.

The rationale, because this was a live fork:

- **The mention already has an identifier.** KINP §4.1 has every participant mint its own local ids
  and never hard-merge them. A "mention" *is* a source-local id. The assertion "this mention refers
  to that entity" is therefore, exactly and without loss, a `same_as` between two ids — which is what
  the equivalence layer is for.
- **`mentions` would sit outside the firewall.** §4.3's whole discipline is that a link either
  licenses fact transfer (`same_as`) or does not (`based_on`). A third grounding predicate that
  licenses *neither* answers no query the pair does not already answer, but every consumer would
  have to learn it and decide what it implies — and the first consumer to treat it as weak identity
  reopens the contamination §4.3 closed.
- **Confidence already carries the hedge.** The reason a bridge reaches for `mentions` is uncertainty
  ("we saw the string, we are not sure"). That is `confidence` on a `same_as` (§4.2), filterable per
  KGP §7 — or, below threshold, the review queue (§4.5, KINP §11 decision 2). Encoding uncertainty
  in the *relation name* makes it unfilterable and immutable.
- **A relation signature is permanent.** `registry/README.md`: a published signature can never be
  edited, because changing it changes every dependent claim id. A relation coined to name a step in
  one pipeline is a permanent public cost for a private convenience.

If a producer genuinely needs to record *co-occurrence* — two entities seen together, with no
identity or lineage claim — the core vocabulary already has `co_occurs`, and general derivation
lineage is `derived_from`. Both are `grounding-only` and neither licenses fact transfer.

**6. koine holds the shape; the adapter never comes here.**
An adapter is code, and code is out of scope (CLAUDE.md, *"What does NOT belong here"*). Its record
mappings are a deployment's instance data and live in that participant's own repository per ADR-0007.
What this repository provides is the target: the specs, the registry, [`../schemas/`](../schemas/),
and the scenarios an adapter proves itself against.

## Consequences

**Positive**
- The build cost of joining the fabric collapses to *translate my records into four already-specified
  shapes*. Nothing about grounding, normalization, hashing, license classes, or egress has to be
  re-decided by an adopter.
- One implementation of each generic bridge, in the commons, fixed once for everyone — instead of one
  per application, each drifting from the spec privately.
- The contract stays the single source of truth for identity and normalization, which is what makes
  claim ids converge across producers (KGP §3.3).
- Grounding gains no new vocabulary, so every existing consumer, projection (ADR-0006 §4.1) and
  filter (KGP §7) keeps working unchanged: grounding links are ordinary claims.

**Negative / costs**
- Existing per-application bridge modules are now legacy. Retiring them is real downstream work, and
  until it lands, two paths (private bridge, adapter) coexist in those deployments.
- "Thin" is a judgment call at the boundary. An adapter that starts doing admission, merge, or
  policy has drifted back into being a bridge; the test is decision 2's — *does this step read only
  contract shape?* If yes, it belongs in the commons.
- Grounding through `same_as` requires the producer to have decided the world question (§4.5) at
  emit time. That is strictly more thought than emitting an undifferentiated mention edge — which is
  the point, but it is a cost.
- Query-time merge moves work to read time. Consumers that want a materialized merged view must
  build and refresh it themselves, as a cache over the closure, never as a write-back (§4.1).

**Neutral**
- Whether a deployment's adapter is generated or hand-written, and when each of its applications
  migrates, is deployment history — recorded in that deployment's own integration repo, not here.
- Nothing here changes any spec's normative text; this record names a pattern the specs already
  imply and closes the grounding-relation question against them.

## Alternatives considered

- **Coin a `mentions` relation for grounding.** Rejected (decision 5): a mention is a source-local
  id, so the link is already `same_as`; a third predicate sits outside the §4.3 firewall, duplicates
  what `confidence` expresses, and permanently fixes a signature for a private pipeline step.
- **Port each application's bridge/projection code into koine as reference implementations.**
  Rejected: koine is contracts only (ADR-0001, CLAUDE.md). Reference code belongs in the runtime
  commons, where it is one generic implementation rather than N application-shaped ones.
- **Keep per-application bridges and let each own its exports.** Rejected: this is the N²
  point-to-point web, plus a silent fork of normalization and grounding per application — the two
  failure modes the shared vocabulary and KGP §3 exist to prevent.
- **A central bridging service every application pipes through.** Rejected: route-by-proxy for the
  data plane, refused by ADR-0001 decision 2 and, for configuration and egress, by ADR-0007
  decision 5. Producers filter their own egress; a central bridge would hold rules for data it does
  not own.
- **A fifth "producer" plane specifying the adapter itself.** Rejected: the four planes plus the KFT
  profile already carry every surface an adapter emits, and KFT (§1) already established that a
  cross-cutting concern composes the planes rather than adding one. A fifth spec would restate
  contracts and immediately drift.
- **Let applications emit an application-specific format and translate downstream.** Rejected: it
  relocates the bespoke bridge rather than removing it, and puts translation on the side that has
  the least knowledge of the source's provenance, licensing, and world.

---

## Relationship to the specs

- **KINP** §4.1's query-time merge view, §4.2's equivalence layer, §4.3's `same_as`/`based_on`
  firewall and §4.5's normative relation choice are what decision 5 selects; the spec is
  **unchanged**, and no relation is added to [`../registry/relations.tsv`](../registry/relations.tsv).
- **KGP** §3 normalization, §5 dialect tiers and §7 confidence/license/egress filters are the
  adapter's knowledge-side target. ADR-0006 keeps the bespoke canonical and makes RDF-star / PROV /
  JSON-LD a **projection**, which is one of the generic bridges decision 2 assigns to the commons —
  not something an adapter renders. Unchanged.
- **KMI** §2–§3 (asset envelope, lineage) are the media-side target, and §4.3's withdrawal of the
  `skill_export_*` family is decision 3 in its earliest, spec-local form. Unchanged.
- **KFT** §4.1's *references, not payloads* rule and §4.2's egress gate are what make "training
  exhaust" emittable at all: an adapter publishes pack/asset **references** plus a
  `dataset-jsonl-header`, and admission happens in the commons under the gate.
  **Amended (2026-08-06):** pressure-testing that path
  ([`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md))
  found the §4 *intake* incomplete for a producer-emitted corpus — no reference slot for a
  training-record file, and no egress class or cardinality on its header — so KFT **0.4.0** folded
  FT-M…FT-Q (`dataset.records[]`; `egress` + `recordCount` on the header; one header per file). The
  decision above is unaffected: the adapter still emits the same four surfaces, by reference, and the
  gate's behavior is unchanged — 0.4.0 supplies the fields the gate needs to *read*.
- **KCB** §2's AgentCard extension is the adapter's control-plane surface; ADR-0007 already fixes
  where it is served. Unchanged.
- **[`../registry/`](../registry/)** keeps holding shared vocabulary only — `same_as`, `based_on`,
  `derived_from` and `co_occurs` are already present with the semantics decision 5 relies on.
- **[`../schemas/`](../schemas/)** is what an adapter validates its output against; no schema is
  added by this record.
