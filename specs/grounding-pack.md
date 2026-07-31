# Koine Grounding-Pack Protocol (KGP)

**Spec version:** 0.4.0
**Status:** Ratified
**Last updated:** 2026-07-18
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
  (§3),
- **serializations**: TSV (canonical), JSON, Prolog facts, and projections to
  Neo4j / Datalog / ProbLog (§4),
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
| **ProbLog** | Probabilistic reasoning | confidence → fact probability. |
| **Neo4j property graph** | Visualization / graph queries | entities→nodes, assertions→edges, provenance→edge props; round-trips losslessly. |

Projection is **one-directional from the canonical pack**; consumers never treat a Neo4j or
ProbLog projection as authoritative. The relation registry (§3.2) is the shared vocabulary all
projections agree on.

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

### 7.1 License-class policy (adopted from the existing bridges)

Every entity/assertion record carries an SPDX `license`; the pack manifest carries a
`license_policy` — a class-based admission allowlist. Licenses classify into `public-domain` /
`permissive` / `attribution` / `share-alike` / `non-commercial` / `proprietary`; a consumer
admits **per record** and **rejects with a report** anything outside its allowlist (default:
`public-domain` + `permissive` + `attribution`). This is a first-class filter alongside
confidence and provenance, not an afterthought — it was already built and proven in existing
producer-side license classifiers, and is lifted into the contract per
[ADR-0002](../decisions/ADR-0002-reconcile-with-existing-bridges.md) (reverse flow). License is
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
