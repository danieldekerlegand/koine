# ADR-0006 — KGP's relationship to RDF-star, W3C PROV, and JSON-LD

**Status:** Accepted (2026-08-02)
**Deciders:** ecosystem owner
**Refines:** [`../specs/grounding-pack.md`](../specs/grounding-pack.md) (KGP) §3, §4; informs
[`../specs/identity.md`](../specs/identity.md) (KINP) §9
**Applies to:** knowledge authorities (producer/authority), knowledge producers and consumers, and
control-plane hosts that broker packs on behalf of agents.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

A KGP claim is a provenance-stamped, world-scoped, named-graph triple. That is, structurally, the
same object three mature standards already model:

- **RDF 1.2 / RDF-star** — a graph model with *statement-level annotation*: a triple may be quoted
  and then annotated (`<< :a :b :c >> :confidence 0.9`), which is exactly the "metadata *about* a
  claim, not part of the claim" split KGP §3.1 draws.
- **W3C PROV** — the activity/agent/entity provenance shape KGP already borrows (KINP §9 lists it
  as *shape only*), with a JSON-LD serialization.
- **JSON-LD** — a triple wire form that is ordinary JSON to any consumer that ignores the context,
  and RDF to any consumer that does not.

Yet KGP defines a **bespoke canonical**: TSV as the tabular source of truth (§4), plus a
content-addressed `claim` id computed by a normative byte-canonicalization (§3). Two of the three
standards above were considered once, at the identity layer, and set aside in a single line
(KINP §9: *"a full RDF triplestore + SPARQL commitment would fight a Prolog-cored world producer
and a TSV-first knowledge authority for little gain"*). That line decided a **storage** question.
It never decided the **serialization and identity** question, which is what this record decides.

The question is live because the two designs are genuinely close. RDF-star's annotation semantics
produce the *same* merge property KGP §3.1 is built around: two producers annotating the same
quoted triple with different confidence and different provenance converge on one statement with
both annotations retained. That is KGP §3.3's worked example, arrived at from the other direction.
So the choice is not "standard vs. not-invented-here"; it is which layer owns claim identity, and
what a conformant producer must carry to compute it.

Precedent cuts both ways. [ADR-0005](ADR-0005-otio-canonical-timeline.md) adopted an external
standard as canonical the moment that standard *covered the concern* — koine's bespoke timeline was
reinvention, and what remained after adoption (identity, lineage, the knowledge bridge) was
precisely what the standard had no model for. The same test is applied here, to a different
concern, and must be allowed to come out either way.

---

## Options considered

### Option (a) — Align the canonical with RDF-star + PROV + JSON-LD

JSON-LD becomes the (or a co-) canonical wire form; RDF-star is the statement-annotation model;
provenance is expressed in PROV terms rather than merely PROV-*shaped*. The parts the standards do
not serve are kept as annotations/extensions on top: the content-addressed `claim` id, the
confidence / license / egress gating (§7), and the Datalog / ProbLog / Prolog projections (§4).

**For.**
- The interop surface is enormous and free: any triplestore, any SPARQL endpoint, any JSON-LD
  consumer reads a pack without implementing a koine-specific format.
- RDF-star's quoted-triple annotation is a native, standardized expression of KGP's
  identity-vs-metadata split, rather than a rule stated in prose.
- Worlds map cleanly onto named graphs; KINP §3 already defines a canonical **IRI** form for every
  identifier, so the graph is mechanically derivable today.
- PROV is already the borrowed shape — adopting the vocabulary outright removes a translation step
  and an opportunity for drift.

**Against.**
- **It does not actually retire §3.** RDF distinguishes lexical form from value: `"1.0"^^xsd:decimal`
  and `"1.00"^^xsd:decimal` are the same value and different bytes, and RDF mandates no Unicode
  normalization for literals. A content-addressed id over RDF therefore still requires a normative
  byte-canonicalization — §3 by another name. Alignment buys interop, not the deletion of the
  mechanism it was proposed to replace.
- **Dataset canonicalization is the wrong granularity.** W3C RDF Dataset Canonicalization
  canonicalizes a *dataset*, and its expensive machinery is blank-node labelling — which KGP has no
  use for, since every claim argument is a CURIE or a typed literal. Worse, hashing a graph that
  contains a triple *and its annotations* would fold confidence and provenance into the identity,
  which is exactly what §3.1 excludes and what makes cross-producer merge work. Getting the KGP
  property back out of it means defining a per-statement sub-profile — bespoke again.
- **It raises the conformance floor for the default tier.** `grounding-only` (§5) is explicitly the
  lowest common denominator and the default for cross-participant transfer. Under (a), minting a
  conformant claim id requires a JSON-LD processor and context resolution in every producer,
  including tabular and Prolog-cored ones whose entire pipeline is otherwise rows and terms.
- **Context resolution is a live dependency on a mutable document.** If term expansion changes, every
  dependent claim id changes silently — the same hazard the registry's immutable-signature rule
  (§9.1) exists to prevent, reintroduced at the serialization layer. It also fights KINP's
  offline-first minting principle: no identifier should require a round-trip to be created.
- **The bespoke encodings are not decoration.** TSV is row-per-claim, git-diffable, and pinnable;
  JSON-LD is none of those, and a canonical that cannot be reviewed as a diff loses a real property
  the current one has.
- **Non-binary relations.** Core relations are binary, but registry extensions may fix higher arity
  (§3.1's `arg1, arg2, …`). RDF reaches those only through reification, which multiplies statements
  and re-opens the identity question for the reified node.

### Option (b) — Retain the bespoke canonical, and justify it explicitly

TSV stays the canonical serialization and §3's byte-canonicalization stays the identity mechanism.
The three standards are addressed head-on rather than by omission: the relationship is stated, and
the mapping onto them is made a specified, lossless projection.

**For.** The four requirements below are met natively, and none of the three standards meets them
without a koine-specific profile layered on anyway (see *Decision*, point 2).

**Against.**
- koine owns a canonicalization algorithm and its conformance burden forever.
- "We have our own format" is the default failure mode of every interchange project, and the burden
  of proof is on retention, not on adoption.
- Interop with the RDF ecosystem is a real, forgone benefit unless the mapping is actually
  specified — which, until this record, it was not.

---

## Decision

**Option (b), with the interop debt paid: KGP retains its bespoke canonical, and the mapping onto
RDF-star / PROV / JSON-LD is promoted from unstated to a specified, lossless, first-class
projection.**

Retention is not a preference for the incumbent. It is the conclusion that all three standards sit
*above* the layer where KGP's problem lives: they are graph and annotation models, and KGP's
canonical is a **byte** discipline that a graph model does not supply. Adopting them as canonical
would leave §3 in place, add a processor and a mutable context to every producer's critical path,
and buy an interop that a specified projection buys for free.

**1. TSV remains canonical; §3 remains the identity mechanism.** No change to what is hashed, to the
canonicalization rules, or to the §3.3 convergence result.

**2. The concrete requirements the three standards do not meet natively** — the justification the
retention rests on, and the test to re-apply if any of them changes:

| Requirement | Why the standards do not serve it |
|---|---|
| **Statement-level content-addressed identity that *excludes* its own annotations** | RDF-star can *express* the split; it does not *canonicalize* it. Dataset canonicalization hashes graphs, not statements, and a graph containing a claim's annotations hashes them in — destroying the cross-producer merge of §3.1/§3.3. A per-statement byte profile is required either way. |
| **Byte-reproducibility across independent producers** | RDF's lexical/value distinction and its lack of a mandated Unicode normalization mean equal values need not be equal bytes. Reproducibility needs the §3 literal, IRI, and symmetric-operand rules regardless of syntax. |
| **Probabilistic reasoning over confidence** | SPARQL has no probabilistic semantics. Confidence-as-probability is served by the ProbLog projection, which the canonical feeds directly; under (a) that projection is unchanged, so alignment adds nothing here. |
| **Egress gating (`local-only`, §7.2) enforced at pack construction** | RDF has no notion of a statement that must not leave a boundary. Gating is a property of the *bundle-building step*, which a graph model does not have — the pack manifest does. |
| **Minting without a resolvable context** | JSON-LD term expansion depends on a context document; content-addressed ids must not depend on a document that can change. §3 depends only on the immutable relation registry. |
| **A canonical reviewable as a line diff** | Structural for TSV; not a property any of the three standards offers. |

**3. RDF-star / PROV / JSON-LD become a specified projection, ranked with the others (§4).** It is
one-directional from the canonical pack, like every projection: a consumer never treats it as
authoritative. The mapping is fixed, not left to implementers:

| KGP construct | Projection |
|---|---|
| claim's `world` (§3.1) | the named graph, identified by the world's KINP canonical IRI (KINP §3) |
| binary relation + its two arguments | the triple, predicate and identifier arguments as KINP canonical IRIs; literals as typed RDF literals per §3.2's types |
| `confidence`, `valid_time`, `embedding_model` | annotations on the quoted triple (RDF-star) |
| `prov` | PROV terms — the shape KGP §2 already carries, named in the vocabulary it was shaped after |
| `claim` id (§3) | an annotation on the quoted triple, so an RDF consumer can round-trip back to the canonical and verify it |
| `license` (§7.1), egress class (§7.2), dialect tier (§5) | record-level annotations; the egress *filter* is still applied at pack construction and is never delegated to the projection |
| relation of arity > 2 | not projected as a bare triple; the projection is defined only for the binary core, and a higher-arity relation is emitted through the same reification the consuming ecosystem uses, or omitted with a report |

**4. Because it is a projection, alignment is testable rather than asserted.** The projection MUST
round-trip losslessly back to the canonical, on the same terms as the Neo4j / Datalog / ProbLog
projections, and is exercised by the same pressure test.

**5. KINP §9's "not adopting: full PROV ontology / RDF" is narrowed, not reversed.** What is still
not adopted is the RDF **stack** as *storage and identity* — a mandated triplestore, SPARQL as the
query contract, or dataset canonicalization as the id mechanism. What is now adopted is RDF-star +
PROV + JSON-LD as a **specified egress form**. This keeps koine's stated design rule intact: adopt
the interface or the shape, not the runtime.

**6. Per koine's `draft → candidate → ratified` convention this is a normative change to KGP**, so
KGP's version is bumped and its status drops to **candidate** pending re-validation against the
pressure test.

**Re-open this record if** RDF gains a standardized *per-statement* canonicalization whose hash
excludes the statement's own annotations, or if the ecosystem KGP exchanges with makes a JSON-LD
processor a floor a producer already meets. Either would collapse the table in point 2, and the
decision would then favor (a).

---

## Invariant regardless of which option had been decided

These are load-bearing under both (a) and (b), and neither option was permitted to weaken them.
They are the reason the choice was about *syntax and layering*, not about semantics:

1. **The content-addressed `claim` id and its normative normalization (KGP §3).** Claim identity is
   the hash of the claim's identity-bearing content only, with `confidence`, `embedding`,
   `valid_time`, and all of `prov` excluded — so the same fact from two producers mints one id and
   **merges**, with both provenance records retained (§3.3). Under (a) this survives as a
   koine-specific byte profile and an annotation on the quoted triple; under (b) it is the canonical
   itself. It never becomes derivable from a graph canonicalization.
2. **Confidence, provenance, license, egress, and trust as first-class filters (KGP §7, §7.1,
   §7.2).** A consumer slices a pack without changing what any claim *is*, precisely because none of
   these axes enters the hash. `local-only` stays enforced at pack construction — producer filters,
   consumer rejects and reports — under any serialization.
3. **Lossless projection to Datalog / ProbLog / Prolog / Neo4j (KGP §4).** These serve deductive,
   probabilistic, and graph-query consumers that no RDF alignment would have served, so they are
   unaffected by the choice. Projection stays one-directional from the canonical pack; no projection
   is ever authoritative.
4. **The relation registry as the shared vocabulary, with immutable published signatures (§3.2,
   §9.1).** Argument order and arity are fixed by the registry, not by the producer, and a signature
   change means a new relation name — because it would otherwise silently change every dependent
   claim id.
5. **Worlds scope truth (KINP §5).** Every claim is asserted *in* a world, and the world is part of
   the hash input. Whether the world is a prefix in a byte string or a named graph IRI is a
   serialization detail.

---

## Consequences

**Positive**
- The relationship to the three standards is now *stated and testable* instead of implied by an
  omission — the specified projection is the interop that alignment was wanted for.
- The conformance floor stays where §5 puts it: a tabular or logic-cored producer needs a hash
  function and the registry, not a JSON-LD processor, to mint a conformant claim.
- Content-addressed ids keep depending only on immutable inputs; no live context document sits in
  the identity path.
- The retention now carries an explicit expiry test (point 2's table, and the re-open condition)
  rather than resting on precedent.

**Negative / costs**
- koine continues to own a canonicalization algorithm, its conformance burden, and its edge cases.
- A specified projection is work, and an unexercised projection rots — hence point 4's round-trip
  obligation and its place in the pressure test.
- RDF-native consumers still perform a conversion koine does not perform for them; the projection
  makes it deterministic, not free.
- Higher-arity relations remain a rough edge in the RDF direction, handled by report rather than by
  a model.

**Neutral**
- No change to the pack bundle (§2), the dialect tiers (§5), directionality (§6), or the role
  mapping (§8).
- KINP is untouched other than the §9 narrowing in decision 5; identifiers were already
  IRI-compatible, which is what makes the projection mechanical.

---

## Alternatives considered

- **Adopt JSON-LD as canonical, keeping TSV as a derived encoding.** Rejected: it inverts which
  form must be byte-exact, putting context resolution in the identity path, and it still requires
  §3's literal and IRI normalization to make ids reproducible.
- **Dual-canonical — TSV and JSON-LD both authoritative.** Rejected for the same reason
  [ADR-0005](ADR-0005-otio-canonical-timeline.md) rejected it: two sources of truth is no source of
  truth, and the mapping's lossy edges become silent divergence instead of a specified projection.
- **Adopt W3C PROV's vocabulary outright while leaving the claim model bespoke.** Rejected as a
  partial move: it would put PROV terms in the canonical without buying RDF consumption, since the
  surrounding claim is still not RDF. PROV terms belong in the projection, where they are consumed
  as PROV.
- **Reify each claim as its own RDF resource carrying its annotations, avoiding RDF-star.** Rejected:
  it multiplies statements, and the reified node needs an identity — which lands back on §3, having
  paid the RDF cost without the RDF-star benefit.
- **Say nothing and let KINP §9's line stand.** Rejected: that line decided storage, and readers were
  entitled to take it as deciding serialization too. Leaving the strongest argument for alignment
  (RDF-star's annotation semantics) unaddressed is how an unexamined incumbent survives.

---

## Relationship to the specs

- **KGP** §3 and §4 gain the retention rationale and the RDF-star / PROV / JSON-LD projection row +
  mapping; cross-references in §2, §5, and §7 are kept consistent. KGP's version is bumped and its
  status drops to **candidate** (decision 6).
- **The machine-readable twin** in [`../schemas/`](../schemas/) is kept consistent with the edited
  §3/§4 — role-scoped, illustrative CURIEs in the KINP §3.4 placeholder namespaces.
- **[`../scenarios/`](../scenarios/)** — the KGP-exercising pressure test validates that the decided
  canonical still mints an identical claim id on reconciliation (§3.3), preserves the §7 gating, and
  round-trips losslessly to the projections, the RDF-star/PROV/JSON-LD one included. Re-ratification
  of KGP depends on it.
- **KINP** §9's "not adopting" row is narrowed per decision 5; identifiers, envelopes, and resolution
  semantics are unchanged.
- **KMI**, **KCB**, **KCS**, and **KFT** are untouched.
- Which triplestore, SPARQL endpoint, or ingestion pipeline a particular deployment points the
  projection at is a deployment fact, recorded in that deployment's own integration repo — not here.
