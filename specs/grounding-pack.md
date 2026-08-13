# Koine Grounding-Pack Protocol (KGP)

**Spec version:** 0.5.1
**Status:** Candidate
**Last updated:** 2026-08-13
**Applies to:** knowledge authorities (producer/authority), knowledge producers and consumers,
and control-plane hosts that broker packs on behalf of agents.
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.0) — uses its identifiers, envelopes,
worlds, and resolution semantics; **satisfies KINP's normative dependency on claim
normalization (KINP §6, delta B).**

> The **knowledge data plane**. A GroundingPack is the unit in which facts move between
> participants: authority → consumer (grounding real-world knowledge), media producer →
> authority (knowledge extracted from ingested media), world producer → authority (facts
> contributed by fictional worlds). KINP makes cross-participant *identity* possible; KGP makes
> cross-participant *knowledge transfer* possible, and its §3 Normalization is what makes
> content-addressed claim dedup (KINP §2/§6) actually work.

KGP generalizes the shape that grounding bundles converge on independently — a manifest plus
claims plus provenance, exported to Prolog / Datalog / probabilistic backends — into one
ratifiable contract, so that a producer's export is any consumer's import.

---

## 1. Scope

KGP defines:
- the **GroundingPack** bundle: manifest + contents + content-addressed pack id (§2),
- **claim normalization** — the normative byte-canonicalization that produces a `claim` id
  (§3), and why that canonical is a byte discipline rather than a graph model (§3.4),
- **serializations**: TSV (canonical), JSON, Prolog facts, and projections to
  Neo4j / Datalog / ProbLog and to RDF-star / W3C PROV / JSON-LD (§4, §4.1),
- **dialect & portability tiers** governing what a consumer may safely ingest (§5),
- **directionality**: snapshot vs. delta/subscription (§6),
- **confidence, provenance, license & egress filtering** (§7),
- the per-role **producer/consumer mapping** (§8).

KGP does **not** define media/asset transfer (that is `media-interchange.md`), reasoning
semantics, or storage engines.

---

## 2. The GroundingPack bundle

A GroundingPack is a content-addressed, self-describing bundle of knowledge, all scoped to
one or more **worlds** (KINP §5). Logical shape:

```jsonc
{
  "kgp_version": "0.1.0",
  "pack_id": "sha256-7b1e…",            // hash of the canonical manifest+contents (§2.1)
  "producer": "refkb",                  // KINP namespace
  "worlds":   ["refkb:world:consensus-reality"],
  "kind":     "snapshot",               // "snapshot" | "delta"  (§6)
  "basis":    null,                     // for delta: the pack_id this delta applies against
  "dialect":  "grounding-only",         // portability tier (§5)
  "entities":  [ /* KINP entity records */ ],
  "assertions":[ /* KINP assertion envelopes (§7.1 of KINP) */ ],
  "links":     [ /* equivalence + lifecycle relations: same_as/based_on/part_of/…/retracts */ ],
  "provenance":[ /* W3C-PROV-shaped activities/agents referenced by assertions */ ],
  "manifest":  { "counts": {…}, "created": "2026-07-18T…", "signing": {…}, "license_policy": {…} }
}
```

- **`assertions`** carry the full KINP assertion envelope (world, subject/relation/object,
  confidence, valid_time, prov). Their `id` is the normalized content hash (§3).
- **`links`** are assertions using KINP's reserved relations (`same_as`, `based_on`,
  `part_of`, `instance_of`, `retracts`, `supersedes`).
- **`entities`** are the referenced entity records (id + type + attributes + external
  anchors). Attributes are *assertions*, not inline scalars, so nothing escapes provenance.
- **License** rides on records: every entity/assertion record carries an SPDX `license`, and
  the manifest carries a `license_policy` (the admission allowlist). See §7.1.
- **`provenance`** is PROV-*shaped* in the bundle and is named in W3C PROV's own vocabulary
  only in the RDF projection (§4.1); the bundle itself carries no RDF dependency.

### 2.1 Pack identity

`pack_id = sha256(canonical(manifest ⊕ sorted(entities) ⊕ sorted(assertions) ⊕ sorted(links)))`,
where each element is canonicalized per §3 and lists are sorted by element id. A pack is thus
itself content-addressed and byte-reproducible — two producers emitting the same knowledge
emit the same `pack_id` (the same discipline an authority applies to DVC-pinned, git-diffable
exports).

---

## 3. Normalization (NORMATIVE)

> This section satisfies KINP §6 / delta B. It is load-bearing: cross-producer claim dedup
> works **only** if every producer reduces a claim to the identical byte string before
> hashing. A claim hashed under any other rule is non-conformant.

### 3.1 What is hashed

The `claim` id is a hash of **only the claim's identity-bearing content**:

```
HASH_INPUT :=  world_curie · "|" · relation · "(" · arg1 · "," · arg2 · … · ")"
claim_id   :=  "sha256-" · lowerhex( SHA-256( UTF8( HASH_INPUT ) ) )
```

**Excluded from the hash** (metadata *about* the claim, not the claim's identity):
`confidence`, `embedding`, `valid_time`, and all of `prov`. Consequence — and this is the
point: the *same* fact asserted by two producers with different confidence/provenance mints
the *same* `claim` id and therefore **merges**, while their provenance records both survive
(§7).

### 3.2 Canonicalization rules

1. **Relation** — a `snake_case` name drawn from the shared **relation registry**
   (`registry/relations.tsv`, added to by PR). Arity and the semantic order of arguments are
   fixed by the registry, so argument order is **not** producer-dependent.
2. **Symmetric relations** (`same_as`, `co_occurs`, …; flagged in the registry) — the two
   operands are sorted ascending by their canonical CURIE string before emission, so
   `same_as(a,b)` and `same_as(b,a)` hash identically.
3. **Identifier arguments** — emitted as the **canonical CURIE** (KINP §3.2), never the IRI:
   lowercase namespace and kind, Unicode NFC, no percent-encoding beyond what the grammar
   requires. A provisional-local id is emitted as-is (it will re-normalize post-reconciliation
   — KINP §6).
4. **World** — the claim's world as a canonical CURIE, prepended as shown. A claim with no
   explicit world uses the producer's declared default world (KINP §5).
5. **Literal arguments** — typed and canonicalized:
   - *string*: NFC, wrapped in `"`, inner `"` and `\` backslash-escaped; no other escapes.
   - *integer*: base-10, no leading zeros, no leading `+`, `-0` → `0`.
   - *decimal*: shortest round-tripping base-10, no trailing zeros, no exponent unless
     |exp| ≥ 16, lowercase `e`.
   - *boolean*: `true` / `false`.
   - *date/time*: ISO-8601 in **UTC**, `Z` suffix, millisecond precision fixed.
   - *typed literal*: `value^^type-curie` (e.g. `"42"^^xsd:integer`) when a bare literal is
     ambiguous.
6. **No insignificant whitespace** anywhere in `HASH_INPUT`; the separators above are the
   only permitted spacing.
7. **Hash** — SHA-256, lowercase hex, `sha256-` prefix. (Assets may use `blake3-` for large
   bytes per KINP §6; claims are small — SHA-256 is mandated for interoperability.)

### 3.3 Worked example

The world producer's claim and the knowledge producer's extracted claim from the pressure test
converge **iff** their entity references have been reconciled to the same canonical ids first:

```
world = worldsim:world:alderforest
relation = commands   (registry arity 2, order: commander, force)

Before reconciliation (distinct — expected):
  worldsim:world:alderforest | commands(worldsim:world:alderforest:ent:npc-renaud,
                                         worldsim:world:alderforest:ent:army-of-ash)
  worldsim:world:alderforest | commands(analyzer:local:ent:e-8842,
                                         analyzer:local:ent:e-8842-army)
      → different HASH_INPUT → different claim_id   ✔ (KINP §6: convergence not yet possible)

After the resolver links e-8842 → npc-renaud and the extracted claim is re-expressed:
  both →  worldsim:world:alderforest | commands(worldsim:world:alderforest:ent:npc-renaud,
                                                 worldsim:world:alderforest:ent:army-of-ash)
      → identical HASH_INPUT → identical claim_id → MERGE, provenance from both retained ✔
```

### 3.4 Why the canonical is a byte discipline (rationale, INFORMATIVE)

A claim is structurally a provenance-stamped, world-scoped, named-graph triple — the same object
RDF 1.2 / RDF-star, W3C PROV, and JSON-LD already model. That KGP nonetheless canonicalizes to
bytes of its own is a decision, not an omission:
[ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) weighed adopting those
standards as the canonical against retaining this one, and retained it **because all three sit
above the layer where claim identity lives** — they are graph and annotation models, and §3 is a
byte discipline a graph model does not supply. The concrete requirements they do not meet
natively, which is also the test to re-apply if any of them changes:

| Requirement | Why the standards do not serve it natively |
|---|---|
| **Statement-level content-addressed identity that *excludes* its own annotations** (§3.1) | RDF-star can *express* the identity-vs-metadata split; it does not *canonicalize* it. W3C RDF Dataset Canonicalization hashes a *dataset*, and a graph carrying a claim's annotations hashes `confidence` and `prov` **into** the id — destroying the §3.3 cross-producer merge. A per-statement byte profile is required either way. |
| **Byte-reproducibility across independent producers** (§3.2) | RDF distinguishes lexical form from value and mandates no Unicode normalization for literals, so equal values need not be equal bytes. The literal, IRI, and symmetric-operand rules of §3.2 are needed under any syntax. |
| **Probabilistic reasoning over `confidence`** | SPARQL has no probabilistic semantics; confidence-as-probability is served by the ProbLog projection (§4), which the canonical feeds directly. |
| **Egress gating enforced at pack construction** (§7.2) | RDF has no notion of a statement that must not cross a boundary. Gating is a property of the *bundle-building step* — which a graph model does not have and the pack manifest (§2) does. |
| **Minting without a resolvable context** | JSON-LD term expansion depends on a context document; a content-addressed id must not depend on a document that can change. §3 depends only on the immutable relation registry (§3.2, §9 decision 1). |
| **A canonical reviewable as a line diff** | Structural for TSV (§4); not a property any of the three standards offers. |

Two consequences follow, and both are normative elsewhere in this spec rather than here:

- The conformance floor stays where §5 puts it — minting a conformant claim id requires a hash
  function and the relation registry, **not** a JSON-LD processor or context resolution. A
  tabular or logic-cored producer is conformant at `grounding-only` with neither.
- The interop those standards offer is not forgone: it is paid as a **specified, lossless,
  round-trip-tested projection** (§4.1), on the same terms as every other projection.

---

## 4. Serializations

One logical pack, several byte encodings. **TSV is canonical** (the tabular source-of-truth
discipline); the others are derived and MUST round-trip losslessly back to it.

| Encoding | Role | Notes |
|---|---|---|
| **TSV** | Canonical, git-diffable, DVC-pinnable | `entities.tsv`, `assertions.tsv`, `links.tsv`, `provenance.tsv` + `manifest.json`. The wire default between participants. |
| **JSON** | Ergonomic API transfer (§2 shape) | Lossless twin of TSV. |
| **Prolog facts** | For a consumer with a native Prolog / SWI core | `id/3` terms, `@world(W)` context arg (KINP §5). Tier-gated (§5). |
| **Datalog (Soufflé `.dl`)** | Bulk deductive queries | grounding-only tier. |
| **ProbLog** | Probabilistic reasoning | A record's confidence → that fact's probability; **one fact per admitted `prov` record** — see the ProbLog rule below. |
| **Neo4j property graph** | Visualization / graph queries | entities→nodes, assertions→edges, provenance→edge props; round-trips losslessly. |
| **RDF-star / W3C PROV / JSON-LD** | Consumers on the RDF stack (triplestores, SPARQL endpoints, JSON-LD readers) | Worlds→named graphs, claims→quoted triples, claim metadata→statement annotations, `prov`→PROV terms. Mapping fixed in §4.1; round-trips losslessly over the binary core, with anything it declines to project reported rather than dropped. |

Projection is **one-directional from the canonical pack**; consumers never treat a Neo4j,
ProbLog, or RDF projection as authoritative. The relation registry (§3.2) is the shared
vocabulary all projections agree on.

**ProbLog — one fact per admitted prov record (NORMATIVE).** A claim's provenance is not
single-valued: a merge preserves **all** `prov` records for a shared `claim` id (§7), each
carrying its own `confidence`, while a ProbLog fact carries exactly one probability. The
projection therefore MUST emit **one fact per admitted `prov` record**, where *admitted* means the
records that survive the §7 slice — provenance agent, `confidence` threshold, licence class
(§7.1), egress class (§7.2) — applied at pack construction, before any encoding is emitted. A
claim admitted with two records projects to two facts; a claim all of whose records the slice
rejects projects to none.

- A producer MUST NOT fold several records into a single probability. Choosing an aggregation —
  noisy-or, max, a trust-weighted mixture, or refusing to combine at all — is the **consumer's**
  reasoning policy, made against its own trust model; KGP does not make it, because fixing one
  aggregation here would bake a single probabilistic semantics into an interchange contract that
  has to serve every reasoner.
- Per-record emission is what keeps this projection **lossless per record**, on the same terms as
  the Neo4j / Datalog / RDF-star projections: nothing is averaged away, and the round-trip back to
  the canonical recovers the original multi-record claim. So that the recombination is
  mechanical, each emitted fact's `claim` id and originating `prov` record MUST be recoverable
  from the record channel that already carries confidence, licence, and egress class alongside the
  term — never as extra arguments of the term itself, whose arity is the relation's (§3.2).
- Which records are admitted, and hence how many facts a claim projects to, is a **§7 filtering**
  question, not an identity one: `confidence` and `prov` are excluded from the claim hash (§3.1),
  so no admission outcome changes a `claim` id and the §3.3 convergence result is byte-unchanged
  under every slice.

### 4.1 RDF-star / PROV / JSON-LD projection

Per [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md), the mapping onto the
RDF stack is **specified here rather than left to implementers**, so that alignment is testable
instead of asserted. RDF-star supplies statement-level annotation, W3C PROV supplies the
provenance vocabulary this spec's `prov` shape (§2) was already shaped after, and JSON-LD is the
wire form; none of the three is canonical, and none is authoritative on ingest.

| KGP construct | Projection |
|---|---|
| a claim's `world` (§3.1) | the **named graph**, identified by the world's KINP canonical IRI (KINP §3) |
| a **binary** relation and its two arguments (§3.2) | the **triple** — predicate and identifier arguments as KINP canonical IRIs; literal arguments as typed RDF literals per §3.2's types |
| `confidence`, `valid_time`, `embedding_model` | **annotations on the quoted triple** (RDF-star), under the terms named in the annotation vocabulary below |
| `prov` (§2, §7) | **PROV-O terms** — the shape §2 already carries, named in the vocabulary it was shaped after (below) |
| the `claim` id (§3) | an **annotation on the quoted triple** (`kgp:claimId`, below), so an RDF consumer can round-trip back to the canonical and verify the hash |
| `license` (§7.1), egress class (§7.2), dialect tier (§5) | record-level annotations, carried for filtering by the consumer, under the terms named below |
| a relation of arity > 2 (registry extension, §3.2) | **not projected as a bare triple.** The projection is defined only for the binary core; a higher-arity relation is emitted through whatever reification the consuming ecosystem uses, or omitted **with a report** — never silently dropped. |

**Annotation vocabulary (NORMATIVE).** The table above fixes which KGP construct becomes an
annotation; it is not interop until the annotations are *named*. Two producers that both follow the
structure but mint their own predicates emit structurally identical, mutually unreadable graphs.
The terms below are therefore **normative**: a producer that emits this projection MUST use them,
and a consumer MUST read them.

```
kgp:      https://koine.ecosystem/ns/kgp#      koine-minted, defined by this section
prov:     http://www.w3.org/ns/prov#           W3C PROV-O
time:     http://www.w3.org/2006/time#         W3C OWL-Time
dcterms:  http://purl.org/dc/terms/            DCMI Metadata Terms
xsd:      http://www.w3.org/2001/XMLSchema#
```

| Annotation | Term | Value | Reused or minted |
|---|---|---|---|
| `claim` id (§3) | `kgp:claimId` | `xsd:string` — the algorithm-prefixed hash exactly as §3 emits it | **Minted.** No external term carries the obligation that makes this one work — that the id is *re-derivable* from the recovered canonical and MUST be checked against it (rule 2 below). `dcterms:identifier` names any identifier and would not distinguish a content address from an accession number. |
| `confidence` | `kgp:confidence` | `xsd:decimal`, §3.2's shortest round-tripping form | **Minted.** Neither PROV nor any W3C vocabulary defines a statement-level confidence; the candidates in the wild are ad-hoc, which is precisely the interop gap this row closes. |
| `valid_time` | `time:hasTime` → a `time:ProperInterval` bearing `time:hasBeginning` / `time:hasEnd`, each an instant with `time:inXSDDateTimeStamp` | `xsd:dateTimeStamp`, §3.2's fixed-precision UTC form | **Reused** — W3C OWL-Time. An open-ended interval omits the missing bound rather than encoding a sentinel. |
| `embedding_model` | `kgp:embeddingModel` | the KINP canonical IRI of the model entity (KINP §3) | **Minted.** The value is an identity-plane reference, so no external metadata term fits; naming the model as an entity keeps it resolvable rather than a bare string. |
| `license` (§7.1) | `dcterms:license` for the SPDX identifier, **and** `kgp:licenseClass` for its §7.1 class | `xsd:string` (SPDX id) / `xsd:string` (one of §7.1's six classes) | **Reused + minted.** The SPDX identifier goes under the established term; the *class* is koine's own admission enum and has no external equivalent. Both travel, because the class is what §7.1 filters on and the identifier is what a consumer re-classifies from. |
| egress class (§7.2) | `kgp:egressClass` | `xsd:string` — `exportable` \| `local-only` | **Minted.** No external vocabulary models a boundary-crossing prohibition of this kind; carried for re-checking only (§7.2 — the filter itself ran at pack construction). |
| dialect tier (§5) | `kgp:dialect` | `xsd:string` — `grounding-only` \| `horn-safe` \| `full-prolog` | **Minted.** A koine portability tier with no external counterpart. |
| `prov` (§2, §7) | PROV-O as it stands — `prov:wasGeneratedBy` (the activity), `prov:wasAttributedTo` (the agent), `prov:generatedAtTime` | per PROV-O | **Reused** — W3C PROV. §2's `prov` shape was shaped after this vocabulary, so the projection names it rather than restating it. |

- These terms are **immutable once ratified**, on the same discipline as a published relation
  (§3.2): a change of meaning or value space is a **new term**, never an edit in place, because a
  consumer reading an old graph has no way to tell which reading it was written under.
- The `kgp:` namespace is reserved to this spec and holds annotation terms only. It is not a
  domain vocabulary and never names relations — those live in the registry (§3.2) and reach the
  projection as predicate IRIs, not as annotations.
- An annotation a consumer does not recognise MUST be carried through the round-trip or reported,
  never silently dropped — the same *complete or reported* obligation the projection carries for
  everything else.

Illustrative (KINP §3.4 placeholder namespaces; a claim `C` with one admitted `prov` record):

```turtle
GRAPH <https://id.koine.example/world/worldsim/alderforest> {
  ex:npc-renaud reg:commands ex:army-of-ash .

  << ex:npc-renaud reg:commands ex:army-of-ash >>
      kgp:claimId       "sha256-4e91c7…" ;
      kgp:confidence    "0.55"^^xsd:decimal ;
      prov:wasGeneratedBy <https://id.koine.example/agent/analyzer/run-1a2b> ;
      dcterms:license   "CC-BY-4.0" ;
      kgp:licenseClass  "attribution" ;
      kgp:egressClass   "exportable" ;
      kgp:dialect       "grounding-only" .
}
```

Rules:

- The projection MUST **round-trip losslessly** back to the canonical pack for every claim it
  projects, on the same terms as the Neo4j / Datalog / ProbLog projections, and is exercised by
  the same pressure test. What it declines to project MUST appear in the report, so the result is
  *complete or reported* — never silently lossy.
- Because the `claim` id is carried as an annotation and is **not** recomputed from the graph, a
  consumer round-tripping the projection MUST re-derive the id per §3 from the recovered
  canonical and reject any claim whose annotation disagrees.
- The egress **filter** (§7.2) is applied at pack construction and is **never delegated to the
  projection**: `local-only` content is absent from the pack before any projection is emitted.
  The egress class travels as an annotation only so a consumer can re-check it.
- Emitting this projection is **optional** for a conformant producer; a producer that emits it
  MUST emit it per this mapping.

Exercised by [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md)
(*Re-validation — KGP 0.5.0*): under this mapping the round-trip holds, the §3.3 convergence result
is byte-unchanged, and the §7 filters survive every encoding. That pass raised two **minor
projection findings** against this section and §4, and **both are now closed**. **KGP-1** — which
`confidence` a claim carrying several `prov` records projects to ProbLog — is closed by §4's
ProbLog rule above: one fact per admitted `prov` record, aggregation left to the consumer.
**KGP-2** — the annotations were fixed in *structure* but named only where PROV supplied the
terms, so two conformant producers could emit structurally identical, mutually unreadable
projections — is closed by the annotation vocabulary above, which names a term for every
annotation this section carries.

With both closed, the one gate remaining before KGP 0.5.x returns to **ratified** is a
**machine-checked round-trip fixture** for this projection: a fixture that takes a canonical pack,
emits the RDF-star / PROV / JSON-LD projection, reads it back, and shows the recovered canonical
re-derives the same `claim` ids (rule 2). The round-trip is desk-verified in prose in that scenario
and made a standing obligation by ADR-0006, but the fixture itself is a **downstream validator**
artifact per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) — conformance fixtures and
validators live with the implementing runtime, not in koine — and is tracked cross-repo as
`64-kgp-projection-roundtrip-fixture` (see `../tasks/chief/`). Until it lands, this spec stays
**candidate**.

---

## 5. Dialect & portability tiers

Not every consumer can safely reason over every producer's logic. KGP declares three tiers, per
pack (`"dialect"`, §2) and per relation in the registry:

| Tier | Contains | Safe for |
|---|---|---|
| **`grounding-only`** | ground facts + confidence; **no rules** | every consumer (extraction pipelines, media producers, viz). The lowest common denominator and the **default** for cross-participant transfer. |
| **`horn-safe`** | ground facts + **Horn/Datalog-safe rules** (no negation-as-failure, stratified, terminating) | Datalog/Soufflé, ProbLog, most reasoners. |
| **`full-prolog`** | arbitrary Prolog (cut, NAF, non-termination risk) | a consumer with a full Prolog / SWI core only. Never shipped to a consumer that cannot sandbox it. |

Rule: **a producer must ship the lowest tier that carries the needed content; a consumer must
reject a pack whose tier exceeds what it can safely evaluate.** Authority → knowledge-producer
transfer defaults to `grounding-only`; transfer internal to one participant may use
`full-prolog`.

The floor is deliberately cheap: producing a conformant `grounding-only` pack needs a SHA-256
implementation, the relation registry (§3.2), and a TSV writer — no graph store, no JSON-LD
processor, and no context resolution (§3.4). The RDF projection (§4.1) is optional and sits
strictly above this floor.

**`local-only` is NOT a dialect tier.** A producer's predicate-mapping registry may group a
fourth class, `local-only`, under a `portabilityClasses` key — but its meaning is *"never
leaves the personal tier; hard-gated out
of open-data releases, packaged corpora, and any non-personal export or training set."* That is
an **egress/privacy** constraint, not a statement about what logic a consumer can evaluate.
Keeping it in the dialect enum would conflate two orthogonal axes. KGP models it separately as
an **egress class** — see §7.2. A relation therefore carries *both* a dialect tier (§5) and an
egress class (§7.2).

**Dialect tiers ≠ trust tiers.** These portability tiers were adopted from a pre-existing
dialect-portability registry (which is why the names predate this spec). They are **orthogonal**
to the *provenance trust tiers* that knowledge stores commonly ship —
`curated`/`auto-admitted`/`quarantine`, `synthetic`/`personal` (see `policy/trust-tiers.json`).
A **trust tier** says *how much to believe a source*; a **dialect tier** says *what logic a
consumer may safely evaluate*. Keep them separate: `dialect` (§2) is the portability axis;
provenance trust is carried per §7 and drives the merge-review queue (KINP §11 decision 2).
(Both words are in common use — do not conflate them.)

---

## 6. Directionality

- **Snapshot** (`kind: "snapshot"`) — a complete pack for the declared worlds at a point in
  (transaction) time.
- **Delta** (`kind: "delta"`, `basis: <pack_id>`) — only assertions/links added or retracted
  since `basis`. Retraction uses the `retracts`/`supersedes` lifecycle relations (KINP §4.2),
  never deletion — deltas stay append-only and content-addressed.
- **Subscription** — a consumer registers for a world; the producer streams deltas. Transport
  is the capability bus (MCP/A2A, `capability-bus.md`); KGP defines the payload, not the pipe.

Pull (consumer requests a snapshot/range) and push (producer emits deltas) are both valid;
the resolver's eventual consistency (KINP §6) means order-of-arrival must not affect the final
merged state — guaranteed because claim ids are content-addressed and links are commutative.

---

## 7. Confidence, provenance & license as first-class filters

Because provenance and confidence ride on every assertion (KINP §7.1) and are *excluded from
claim identity* (§3.1), a consumer can slice a pack without changing what any claim *is*:

```
accept records where prov.agent ∈ trusted ∧ confidence ≥ 0.9 ∧ world = consensus-reality
            ∧ license.class ∈ {public-domain, permissive, attribution}
```

Merges preserve **all** provenance for a shared `claim` id (multiple `prov` records per
claim), so "who told us this, and how sure were they" is always answerable — the basis for the
hybrid review queue (KINP §11, decision 2) and for the authority's convergence-QA gate.

These axes survive every serialization: in TSV and JSON they are record columns/fields, and in
the RDF projection they are statement or record annotations (§4.1) — never part of the claim
itself, in any encoding.

### 7.1 License-class policy (adopted from the existing bridges)

Every entity/assertion record carries an SPDX `license`; the pack manifest carries a
`license_policy` — a class-based admission allowlist. Licenses classify into `public-domain` /
`permissive` / `attribution` / `share-alike` / `non-commercial` / `proprietary`; a consumer
admits **per record** and **rejects with a report** anything outside its allowlist (default:
`public-domain` + `permissive` + `attribution`). This is a first-class filter alongside
confidence and provenance, not an afterthought — it was already built and proven in existing
producer-side license classifiers, and is lifted into the contract per ADR-0002 (reverse flow —
a deployment-history ADR, held in that deployment's own integration repo). License is
carried on records (not in the claim hash), so it never affects claim identity.

---

### 7.2 Egress control — `local-only` (NORMATIVE)

Some knowledge must **never cross a project boundary at all**, independent of licence,
confidence, or dialect. KGP models this as an **egress class** carried on relations (via the
shared registry) and on records:

| Egress class | Meaning |
|---|---|
| `exportable` (default) | May cross a project boundary, subject to the licence policy (§7.1) and dialect tier (§5). |
| **`local-only`** | **Never leaves its originating tier.** Hard-gated out of cross-project packs, open-data releases, packaged corpora, and any export or **training set**. |

Rules:

- A **producer MUST NOT** emit a `local-only` relation or record into any pack that crosses a
  project boundary — the filter is applied at pack construction, not left to the consumer.
- A **consumer MUST reject** a pack that contains `local-only` content (it indicates a producer
  bug or a tampered pack), and report it rather than silently dropping.
- Egress class is **orthogonal** to the dialect tier (§5), the licence class (§7.1), and the
  provenance trust tier — a record carries all of them independently. `local-only` typically
  co-occurs with the `personal` trust tier, but the trust tier is descriptive while the egress
  class is *enforcing*.
- Because it is enforced at pack construction, egress class does **not** enter the claim hash
  (§3.1); it never affects claim identity.
- Enforcement is **never delegated to a serialization or projection**. `local-only` content is
  filtered out before any encoding is emitted, so a Neo4j, ProbLog, or RDF projection (§4, §4.1)
  of a boundary-crossing pack cannot contain it; the egress class travels in a projection only
  so a consumer can re-check it.

Adopted from an existing producer-side `predicate-mapping.json`, which introduced this as the
privacy invariant of a personal-media bridge (ADR-0002 reverse flow). That registry groups it
under `portabilityClasses` alongside the dialect tiers; KGP deliberately separates the two axes
(§5) — see `20-shared-relation-registry` US-SRR2 for the reconciliation.

## 8. Producer / consumer mapping (by role)

| Role | KGP participation | Emits / accepts |
|---|---|---|
| **Knowledge authority** | **Producer + authority** | Emits `grounding-only`/`horn-safe` snapshots + deltas of consensus reality; hosts the canonical store; runs resolver `resolve`/`reconcile` (KINP §8). |
| **Media producer** | Producer + consumer | Consumes grounding packs to ground ingestion; emits `grounding-only` deltas of knowledge extracted from ingested media (with `source_world` from the asset, KINP §7.2). |
| **World producer** | Producer + consumer | Consumes packs to ground world generation; emits world facts back to the authority (may be `full-prolog` internally, downshifted to `grounding-only` for export). |
| **Domain consumer** | Consumer | Consumes domain knowledge to ground its own generation or design work; ingests only what its declared portability tier admits (§5). |
| **Control-plane host** | Consumer + host | Agents query packs; provisions the authority/producer as an org. |

---

## 9. Resolved decisions

Ratified 2026-07-17.

1. **Relation-registry governance → shared core + namespaced domain extensions.**
   `registry/relations.tsv` holds the unqualified **core** vocabulary every project loads;
   `registry/relations/<domain>.tsv` holds **domain-qualified** extensions (`cine:shows`,
   `ling:cognate_of`, `dsp:modulates`). A relation's signature is **immutable once published** —
   changing it would silently change every dependent `claim` id (§3), so a change means a new
   name. See [`../registry/`](../registry/).
2. **Embedding portability → record the model; re-embed on mismatch.** The assertion envelope
   carries `embedding_model` (added in KINP 0.2.1, §7.1). A consumer whose model differs MUST
   re-embed rather than compare vectors across models. Both `embedding` and `embedding_model`
   are excluded from the `claim` hash (§3.1), so this never affects claim identity.
3. **Signing/trust → shared signing shape; inter-project packs SHOULD be signed.**
   `manifest.signing = {key_id, alg}` is shared with the capability-bus manifest
   ([`capability-bus.md`](capability-bus.md) §5), making `prov.agent` cryptographically
   attributable. Token issuance/rotation lives in the control-plane host's infra, not here.

## Changelog

- **0.5.1** (2026-08-13) — **Candidate** (normative change to a candidate spec; status unchanged).
  Closes the two minor projection findings the *Re-validation — KGP 0.5.0* pass of
  [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) left open.
  **KGP-1**: §4 gains the normative **ProbLog rule** — the projection emits **one fact per
  admitted `prov` record**, *admitted* being the records that survive the §7 slice applied at pack
  construction; a producer MUST NOT fold several records into one probability, and choosing an
  aggregation (noisy-or, max, trust-weighted) is the **consumer's** policy, not KGP's. **KGP-2**:
  §4.1 gains the normative **annotation vocabulary** — a named term for every annotation the
  projection carries, reusing an established vocabulary where one exists (W3C PROV for `prov`,
  OWL-Time for `valid_time`, DCMI Terms for the SPDX licence id) and minting a `kgp:` term only
  where none does (`claimId`, `confidence`, `embeddingModel`, `licenseClass`, `egressClass`,
  `dialect`), with those terms **immutable once ratified** on the same discipline as a published
  relation (§3.2). §4.1's exercised-by note now names the remaining re-ratification gate: the
  downstream round-trip fixture (ADR-0001). Projection-surface only — §3 normalization, §3.1's
  hashed set, and the §3.3 convergence result are untouched, so **no existing `claim` id changes**
  and no `schemas/` document shape moves (a projection's conformance is the round-trip, not a
  document shape).
- **0.5.0** (2026-08-02) — **Candidate** (re-enters validation per `draft → candidate →
  ratified`). Decided KGP's relationship to RDF 1.2 / RDF-star, W3C PROV, and JSON-LD per
  [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md): the **bespoke canonical
  is retained** — TSV stays canonical and §3 stays the identity mechanism, unchanged in what is
  hashed and in the §3.3 convergence result — and the interop debt is paid by promoting the
  mapping onto those standards from unstated to a **specified, lossless, round-trip-tested
  projection**. New §3.4 records the requirements the three standards do not meet natively
  (statement-level content-addressed identity excluding its own annotations, byte-reproducibility,
  probabilistic reasoning, pack-construction egress gating, minting without a resolvable context,
  a line-diffable canonical) plus the re-open test. New §4.1 fixes the projection mapping
  (world→named graph, binary relation→triple, `confidence`/`valid_time`/`embedding_model`→RDF-star
  annotations, `prov`→PROV terms, `claim` id→annotation for verifiable round-trip, arity > 2→not
  projected as a bare triple, reported). §2, §5, and §7/§7.2 gained the matching cross-references:
  the bundle stays RDF-free, the `grounding-only` floor needs no JSON-LD processor, and egress
  enforcement is never delegated to a projection. Additive — no existing claim id changes.
- **Editorial** (2026-07-31) — Agnostic reframe, part 2: worked examples and CURIEs now use the
  illustrative placeholder namespaces registered in KINP §3.4 (`refkb` / `worldsim` / `analyzer`
  / `mediastore` / `orchestrator`); the serialization, dialect-tier, and provenance notes name
  **roles** and capabilities instead of products. No normative change — §3 normalization, §7.2
  egress rules, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.4.0** (2026-07-18) — Added the **egress class** `local-only` (§7.2, normative): knowledge
  that must never cross a project boundary — producers filter at pack construction, consumers
  reject. Adopted from an existing producer-side predicate-mapping registry (ADR-0002 reverse flow), but
  modelled as an axis **separate from** the dialect tiers (§5) rather than a fourth tier, since
  it constrains *egress*, not *evaluable logic*. Non-breaking, additive.
- **0.3.0** (2026-07-18) — Added the SPDX **license-class policy** as a first-class filter
  (§2 records + manifest `license_policy`, §7.1), lifted from the existing producer-side
  bridges per ADR-0002 (reverse flow). Clarified that dialect (portability) tiers are distinct
  from provenance **trust tiers** (§5). Non-breaking, additive.
- **0.2.0** (2026-07-17) — **Ratified.** Closed §9 (relation-registry governance → shared
  core + namespaced extensions; embedding portability → `embedding_model`; signing shape) and
  seeded `registry/relations.tsv`.
- **0.1.0** (2026-07-17) — Initial candidate draft. Satisfies KINP delta B (normative §3).
