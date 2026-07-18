# Koine Grounding-Pack Protocol (KGP)

**Spec version:** 0.2.0
**Status:** Ratified
**Last updated:** 2026-07-17
**Applies to:** Pinakes (producer/authority), Argos & Insimul (producer + consumer),
Cuneiform & Formant (consumer)
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.0) — uses its identifiers, envelopes,
worlds, and resolution semantics; **satisfies KINP's normative dependency on claim
normalization (KINP §6, delta B).**

> The **knowledge data plane**. A GroundingPack is the unit in which facts move between
> projects: Pinakes → Argos/Insimul (grounding real-world knowledge), Argos → Pinakes
> (knowledge extracted from user media), Insimul → Pinakes (facts contributed by fictional
> worlds). KINP makes cross-project *identity* possible; KGP makes cross-project *knowledge
> transfer* possible, and its §3 Normalization is what makes content-addressed claim dedup
> (KINP §2/§6) actually work.

This generalizes the pre-existing `GroundingPack` contract already vendored in Argos
(`bridge/grounding_pack.py`, `docs/grounding_pack_spec.md`) and Insimul
(`docs/LINGUASCRAPE_SYNC_PLAN.md`), and Pinakes's existing SWI-Prolog / Soufflé / ProbLog
exporters, into one ratifiable ecosystem contract.

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
- **confidence & provenance filtering** (§7),
- the per-project **producer/consumer mapping** (§8).

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
  "producer": "pinakes",                // KINP namespace
  "worlds":   ["pinakes:world:consensus-reality"],
  "kind":     "snapshot",               // "snapshot" | "delta"  (§6)
  "basis":    null,                     // for delta: the pack_id this delta applies against
  "dialect":  "grounding-only",         // portability tier (§5)
  "entities":  [ /* KINP entity records */ ],
  "assertions":[ /* KINP assertion envelopes (§7.1 of KINP) */ ],
  "links":     [ /* equivalence + lifecycle relations: same_as/based_on/part_of/…/retracts */ ],
  "provenance":[ /* W3C-PROV-shaped activities/agents referenced by assertions */ ],
  "manifest":  { "counts": {…}, "created": "2026-07-17T…", "signing": {…} }
}
```

- **`assertions`** carry the full KINP assertion envelope (world, subject/relation/object,
  confidence, valid_time, prov). Their `id` is the normalized content hash (§3).
- **`links`** are assertions using KINP's reserved relations (`same_as`, `based_on`,
  `part_of`, `instance_of`, `retracts`, `supersedes`).
- **`entities`** are the referenced entity records (id + type + attributes + external
  anchors). Attributes are *assertions*, not inline scalars, so nothing escapes provenance.

### 2.1 Pack identity

`pack_id = sha256(canonical(manifest ⊕ sorted(entities) ⊕ sorted(assertions) ⊕ sorted(links)))`,
where each element is canonicalized per §3 and lists are sorted by element id. A pack is thus
itself content-addressed and byte-reproducible — two producers emitting the same knowledge
emit the same `pack_id` (the same discipline Pinakes already applies to its DVC-pinned,
git-diffable exports).

---

## 3. Normalization (NORMATIVE)

> This section satisfies KINP §6 / delta B. It is load-bearing: cross-producer claim dedup
> works **only** if every project reduces a claim to the identical byte string before
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

The Insimul claim and the Argos-extracted claim from the pressure test converge **iff** their
entity references have been reconciled to the same canonical ids first:

```
world = insimul:world:alderforest
relation = commands   (registry arity 2, order: commander, force)

Before reconciliation (distinct — expected):
  insimul:world:alderforest | commands(insimul:world:alderforest:ent:npc-renaud,
                                        insimul:world:alderforest:ent:army-of-ash)
  insimul:world:alderforest | commands(argos:local:ent:e-8842,
                                        argos:local:ent:e-8842-army)
      → different HASH_INPUT → different claim_id   ✔ (KINP §6: convergence not yet possible)

After the resolver links e-8842 → npc-renaud and re-expresses the Argos claim:
  both →  insimul:world:alderforest | commands(insimul:world:alderforest:ent:npc-renaud,
                                                insimul:world:alderforest:ent:army-of-ash)
      → identical HASH_INPUT → identical claim_id → MERGE, provenance from both retained ✔
```

---

## 4. Serializations

One logical pack, several byte encodings. **TSV is canonical** (Pinakes's source-of-truth
discipline); the others are derived and MUST round-trip losslessly back to it.

| Encoding | Role | Notes |
|---|---|---|
| **TSV** | Canonical, git-diffable, DVC-pinnable | `entities.tsv`, `assertions.tsv`, `links.tsv`, `provenance.tsv` + `manifest.json`. The wire default between projects. |
| **JSON** | Ergonomic API transfer (§2 shape) | Lossless twin of TSV. |
| **Prolog facts** | For Insimul `libinsimul` / SWI ingest | `id/3` terms, `@world(W)` context arg (KINP §5). Tier-gated (§5). |
| **Datalog (Soufflé `.dl`)** | Bulk deductive queries | grounding-only tier; Pinakes already emits this. |
| **ProbLog** | Probabilistic reasoning | confidence → fact probability; Pinakes already emits this. |
| **Neo4j property graph** | Visualization / graph queries | entities→nodes, assertions→edges, provenance→edge props. Pinakes already round-trips this. |

Projection is **one-directional from the canonical pack**; consumers never treat a Neo4j or
ProbLog projection as authoritative. The relation registry (§3.2) is the shared vocabulary all
projections agree on.

---

## 5. Dialect & portability tiers

Not every consumer can safely reason over every producer's logic. KGP adopts Insimul's
dialect-portability registry as three tiers, declared per pack (`"dialect"`, §2) and per
relation in the registry:

| Tier | Contains | Safe for |
|---|---|---|
| **`grounding-only`** | ground facts + confidence; **no rules** | everyone (Argos, Formant, viz). The lowest common denominator and the **default** for cross-project transfer. |
| **`horn-safe`** | ground facts + **Horn/Datalog-safe rules** (no negation-as-failure, stratified, terminating) | Datalog/Soufflé, ProbLog, most reasoners. |
| **`full-prolog`** | arbitrary Prolog (cut, NAF, non-termination risk) | Insimul `libinsimul` / SWI only. Never shipped to a consumer that cannot sandbox it. |

Rule: **a producer must ship the lowest tier that carries the needed content; a consumer must
reject a pack whose tier exceeds what it can safely evaluate.** Pinakes → Argos defaults to
`grounding-only`; Insimul internal transfer may use `full-prolog`.

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

## 7. Confidence & provenance as first-class filters

Because provenance and confidence ride on every assertion (KINP §7.1) and are *excluded from
claim identity* (§3.1), a consumer can slice a pack without changing what any claim *is*:

```
accept assertions where prov.agent ∈ trusted ∧ confidence ≥ 0.9 ∧ world = consensus-reality
```

Merges preserve **all** provenance for a shared `claim` id (multiple `prov` records per
claim), so "who told us this, and how sure were they" is always answerable — the basis for the
hybrid review queue (KINP §11, decision 2) and for Pinakes's convergence-QA gate.

---

## 8. Producer / consumer mapping

| Project | Role | Emits / accepts |
|---|---|---|
| **Pinakes** | **Producer + authority** | Emits `grounding-only`/`horn-safe` snapshots + deltas of consensus reality; hosts the canonical TSV; runs resolver `resolve`/`reconcile` (KINP §8). |
| **Argos** | Producer + consumer | Consumes grounding packs to ground ingestion; emits `grounding-only` deltas of knowledge extracted from user media (with `source_world` from the asset, KINP §7.2). |
| **Insimul** | Producer + consumer | Consumes packs to ground world-gen; emits world facts to Pinakes (may be `full-prolog` internally, downshifted to `grounding-only` for export). |
| **Formant** | Consumer | Consumes DSP/music-theory/gear knowledge to ground plugin design. |
| **Cuneiform** | Consumer + host | Agents query packs; provisions the resolver/producer as an org. |

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
   attributable. Token issuance/rotation lives in Cuneiform infra, not here.

## Changelog

- **0.2.0** (2026-07-17) — **Ratified.** Closed §9 (relation-registry governance → shared
  core + namespaced extensions; embedding portability → `embedding_model`; signing shape) and
  seeded `registry/relations.tsv`.
- **0.1.0** (2026-07-17) — Initial candidate draft. Satisfies KINP delta B (normative §3).
