# Koine Identity & Namespace Protocol (KINP)

**Spec version:** 0.2.0
**Status:** Ratified
**Last updated:** 2026-07-17
**Applies to:** Insimul, Pinakes, Cuneiform, Argos, Formant

> The keystone protocol. Every other Koine contract (grounding-pack, media-interchange,
> capability-bus) references the identifiers, envelopes, and resolution semantics defined
> here. Get identity right and cross-project **intersection** — joining data produced by
> different projects — becomes a query rather than an integration effort.

---

## 0. Design axioms

1. **Different kinds of thing get different identity strategies.** Using one scheme for
   everything is the root mistake. See §2.
2. **Never destructively merge.** Reconciliation is an *equivalence layer* over
   source-local identifiers, and "merge" is a query-time view. See §4.
3. **Sameness has grades.** `same_as` licenses inference across identifiers; `based_on`
   records lineage without licensing it. This is the firewall between real and fictional
   entities. See §4.3.
4. **Truth is world-relative.** Assertions are true *in a world/context*, not globally.
   See §5.
5. **Offline-first minting.** No identifier requires a round-trip to a central authority
   to be created. Reconciliation is eventually-consistent. See §6.
6. **Borrow standards, don't adopt the stack.** IRIs, CURIEs, W3C PROV shape, and the
   OpenRefine/Wikidata Reconciliation API — over Prolog/TSV-native storage. No mandated
   RDF triplestore. See §9.

---

## 1. Scope

KINP defines:
- the **kinds** of identifiable thing (§2),
- the **identifier grammar** — canonical IRI, compact CURIE, and Prolog term forms (§3),
- the **namespace registry** (§3.4),
- **entity resolution**: local IDs, the equivalence layer, `same_as` vs `based_on`,
  reconciliation (§4),
- the **world/context** model (§5),
- **minting** rules, including offline-first (§6),
- the **assertion** and **asset** envelopes, with provenance and bitemporal time (§7),
- the **resolver API** (§8),
- the per-project **adoption map** (§10),
- the **ratified decisions** on the three design forks (§11).

KINP does **not** define storage engines, wire encodings for bulk transfer (that is
grounding-pack / media-interchange), or reasoning semantics.

---

## 2. The three kinds of identifiable thing

The most consequential decision in the whole protocol:

| Kind | Is a… | Identity strategy | Rationale |
|---|---|---|---|
| **Entity** | *thing* (person, place, plugin, NPC, org, agent) | **Stable, minted, resolved.** Identity is independent of the thing's current attributes. | A thing stays the same thing as what we know about it changes. Deriving an entity ID from its properties breaks the instant a property changes. |
| **Assertion** | *claim* about entities | **Content-addressed** (hash of the normalized claim). | Immutable; identical claims dedup/merge automatically. (Argos already does this for predicates.) |
| **Asset** | *bytes* (a file / blob) | **Content-addressed** (hash of the bytes, à la git blob / IPFS CID). | Same file ingested twice = one asset. Perfect dedup. |

**Corollary:** content-addressing is correct for assertions and assets and *wrong* for
entities. Entities need identity that is stable *because* it does not depend on current
knowledge.

---

## 3. Identifier grammar

### 3.1 Canonical form (IRI)

```
https://id.<root>/<kind>/<namespace>/<local-id>
```

- `<root>` — the ecosystem's identity domain. **Placeholder:** `id.koine.example`
  (production root TBD).
- `<kind>` — one of: `ent` | `claim` | `asset` | `world` | `agent` | `src`.
- `<namespace>` — the minting authority (§3.4).
- `<local-id>` — opaque within the namespace; `[a-z0-9][a-z0-9._-]*` (lowercase,
  percent-encode anything else).

Canonical IRIs SHOULD be dereferenceable (§8): dereferencing returns the thing plus its
known equivalences and provenance.

### 3.2 Compact form (CURIE)

For Prolog atoms, TSV cells, and human use:

```
<namespace>:<kind>:<local-id>
```

A prefix registry maps `<namespace>` → IRI root. Example expansions:

```
pinakes:ent:napoleon-i        → https://id.koine.example/ent/pinakes/napoleon-i
argos:claim:sha256-9f3c1a…    → https://id.koine.example/claim/argos/sha256-9f3c1a…
formant:asset:blake3-a1b2…    → https://id.koine.example/asset/formant/blake3-a1b2…
insimul:world:alderforest     → https://id.koine.example/world/insimul/alderforest
cuneiform:agent:dsp-engineer  → https://id.koine.example/agent/cuneiform/dsp-engineer
```

### 3.3 Prolog term form

CURIEs map to a canonical compound term so the native Prolog core (Insimul `libinsimul`)
handles identifiers as first-class terms, not string-matched atoms:

```prolog
% id(Kind, Namespace, LocalId)
id(ent, pinakes, 'napoleon-i')
id(world, insimul, alderforest)

% Convenience readers may be provided, e.g. ent(NS, L) :- ... but id/3 is canonical.
```

A **URN alternative** (`urn:koine:<kind>:<namespace>:<local-id>`) is reserved for
contexts that reject `https` IRIs; IRIs are preferred because resolvability is the point.

### 3.4 Namespace registry

`<namespace>` names the **minting authority**, embedding provenance into the identifier.

| Namespace | Authority | Notes |
|---|---|---|
| `pinakes` | Pinakes | Canonical authority for real-world entities (§6). |
| `insimul` | Insimul | World/context IDs are namespaced further: `insimul:world:<w>`; entities within a world use that world as their namespace — see §5. |
| `argos` | Argos | Run-scoped locals: `argos:run/<runid>`. |
| `formant` | Formant | Plugins, DSP nodes, hardware models. |
| `cuneiform` | Cuneiform | Agents, roles, orgs (control plane). |
| `wikidata`, `musicbrainz`, `geonames`, … | external authorities | For anchoring; not minted by us (§4.4). |
| `<ns>:local` | any project | Provisional, pre-reconciliation locals (§6). |

New namespaces are added by PR to this registry.

---

## 4. Entity identity & resolution

### 4.1 Local IDs, never a hard merge

Every project mints its **own local entity IDs**. The same real-world thing will have
several — a Wikidata-anchored `pinakes:ent:…`, an `argos:ent:…` extracted from a user's
footage, an `insimul:world:…:ent:…` in a fictional world. **These are never merged
destructively.** A separate **equivalence layer** records links between them with
confidence and provenance. "The merged entity" is a *view* computed at query time from the
`same_as` closure — it is never written back over the sources.

This generalizes Pinakes's existing culture-scrape entity-resolution from intra-project to
cross-project.

### 4.2 The equivalence layer

Links are themselves assertions (§7), so they carry confidence, provenance, and time:

```prolog
same_as(id(ent, argos, 'e-8842'), id(ent, pinakes, 'napoleon-i'),
        confidence(0.97), src('argos:run/1a2b')).
```

Relations in the equivalence layer:

| Relation | Meaning | Licenses fact transfer? |
|---|---|---|
| `same_as` | identical referents | **Yes** — facts flow both ways |
| `based_on` | one is modeled on / derived from the other | **No** — lineage only |
| `part_of` | mereological containment | Partial (context-dependent) |
| `instance_of` | type membership | No |

**Lifecycle relations** (reserved; not equivalence links, but they use the same envelope,
§7.1): `retracts` — withdraws a prior claim; `supersedes` — replaces a prior claim with a
newer one. Because claims are immutable and content-addressed (§2), correction is *additive*:
assert a `retracts`/`supersedes` with a later transaction time (§7.1) rather than deleting.

### 4.3 The firewall: `same_as` vs `based_on`

The single distinction that keeps fiction from corrupting real-world knowledge.

- **`same_as`** — the two identifiers denote the same referent; inference flows across.
- **`based_on`** — records that one entity was modeled on another; inference does **not**
  flow across.

Worked case — Insimul's fictional general modeled on the real Napoleon:

```prolog
% Lineage only — NOT same_as:
based_on(id(ent, 'insimul:world:alderforest', 'npc-renaud'),
         id(ent, pinakes, 'napoleon-i'), confidence(0.8)).

% A claim asserted ONLY inside the fictional world (note the @world scoping, §5):
fought(id(ent, 'insimul:world:alderforest', 'npc-renaud'),
       id(ent, 'insimul:world:alderforest', 'dragon-3')) @ world(alderforest).
```

Consequences:
- Query *"facts true of the real Napoleon"* traverses `same_as` (+ world =
  `consensus-reality`) → **never** returns "fought a dragon."
- Query *"which real figures inspired characters in my game?"* traverses `based_on` →
  returns Napoleon immediately.

One graph, both queries, zero contamination.

### 4.4 Anchoring to external authorities

Do not reinvent identity for things the world already identifies. A `pinakes:ent:…` entity
carries `same_as` / `exact_match` links to external authority IDs:

```prolog
same_as(id(ent, pinakes, 'napoleon-i'), id(ent, wikidata, 'Q517'), confidence(1.0)).
```

Wikidata is the primary real-world anchor (Pinakes already uses QIDs). MusicBrainz anchors
Formant audio/artist/gear entities; GeoNames anchors places; etc.

### 4.5 Reconciliation

Fuzzy matching a descriptor (name, type, attributes, embedding) to candidate entities is
**probabilistic**, never assumed correct. KINP adopts the **OpenRefine / Wikidata
Reconciliation API** shape for the `reconcile` operation (§8): a published standard that
Pinakes's Wikidata backbone can answer directly, giving Argos and Insimul fuzzy matching
against a standard interface for free. Reconciliation *proposes* links; per the ratified
merge policy (§11, decision 2) they are auto-applied above a confidence threshold and
otherwise queued for review.

**Choosing `same_as` vs `based_on` (normative — delta C).** When the resolver links a
candidate, it MUST pick the relation by world and ontological status:

- **different worlds, and the candidate's world does *not* inherit-as-identity** → emit
  `based_on` (lineage only; no fact transfer). This is what stops knowledge extracted from a
  fictional world from contaminating the real entity it was modeled on.
- **same world, or an identity-inheriting world** → emit `same_as`.
- **ambiguous / below threshold** → emit nothing; queue for review (§11, decision 2).

A candidate reached only via an existing `based_on` chain (e.g. fiction → real figure) is
never promoted to `same_as` by transitivity.

---

## 5. Worlds / contexts

Truth in this ecosystem is not global — it is **true-in-a-world**. The same
world/context axis already exists independently in three projects; KINP unifies it:

- Insimul: **editor canon** vs. **per-playthrough save-file state**.
- Argos: predicate **provenance**.
- Pinakes: **source provenance**.

Every assertion is stamped with a **world** (a named graph). Worlds form an inheritance
chain; reasoning is always relative to a world and inherits from its parents unless
overridden.

```
consensus-reality                         (fab:world:pinakes/consensus-reality — default real world)
└── insimul:world:alderforest             (a fiction; inherits real-world facts unless overridden)
    └── insimul:world:alderforest#save-7f (a playthrough; forks the world's canon)
```

- Default world for real-world knowledge: `pinakes:world:consensus-reality`.
- A fictional world MAY inherit consensus reality (so "Paris is in France" holds in-fiction
  unless the fiction overrides it) — inheritance policy is per-world metadata.

**Prolog representation:** an explicit context argument `@world(W)` (ratified over modules,
§11 decision 3) so worlds round-trip cleanly to TSV and the grounding-pack.
Assertions without an explicit world default to the producer's declared world.

---

## 6. Minting rules (offline-first)

| Kind | How minted | Authority round-trip? |
|---|---|---|
| **Assertion** | `claim` id = hash of the normalized claim (predicate + args in canonical order + world). | **Never.** |
| **Asset** | `asset` id = hash of the bytes (algorithm-prefixed: `blake3-…`, `sha256-…`). | **Never.** |
| **Entity** | Mint a **provisional local** id immediately: `<ns>:ent:<uuid-or-hash>` (or `<ns>:local:…`). | **Never at creation.** |

The **resolver** (§8) later reconciles provisional locals against canonical entities and
emits `same_as` links — eventually-consistent, never blocking. This preserves:
- Argos's zero-spend / local-first operation,
- Insimul-native's embedded (no-network) execution,
- Pinakes bulk imports.

**Canonical authority:** Pinakes is the single canonical authority for *real-world* entities
(it anchors to Wikidata) — ratified, §11 decision 1. Other projects mint locals and defer
canonicalization to the resolver.

**Claim normalization is normative and load-bearing — not optional (delta B).**
Content-addressed claim dedup across producers *only* works if every project canonicalizes a
claim to the exact same byte string before hashing. Producers MUST apply the shared
normalization — canonical argument order, CURIE↔IRI normalization, world stamping, and
literal/number/whitespace formatting — defined in
[`grounding-pack.md`](grounding-pack.md) §Normalization. A claim hashed under any other rule
is non-conformant.

Note that *pre*-reconciliation, two producers describing the same fact still mint different
`claim` ids because their entity references differ (provisional locals, §4). The claims
converge only after the resolver links those entities and the claims are re-expressed against
the canonical entity. Normalization guarantees convergence is *possible*; reconciliation makes
it *happen*.

---

## 7. Envelopes

### 7.1 Assertion envelope

Every assertion carries provenance, confidence, and **bitemporal** time. Argos's predicate
shape (subject/relation/object + confidence + embedding + provenance + `[t_start,t_end]`)
is the seed; KINP promotes it to the ecosystem envelope and splits the two times.

```jsonc
{
  "id":        "argos:claim:sha256-9f3c…",   // content hash (§6)
  "world":     "insimul:world:alderforest",  // §5
  "subject":   "insimul:world:alderforest:ent:npc-renaud",
  "relation":  "fought",
  "object":    "insimul:world:alderforest:ent:dragon-3",
  "confidence": 0.62,
  "embedding":  [/* optional vector */],
  "valid_time": { "start": "…", "end": null },   // when true IN ITS WORLD
  "prov": {                                        // W3C PROV shape
    "agent":    "cuneiform:agent:continuity-critic",
    "activity": "argos:run/1a2b",
    "asserted": "2026-07-17T12:00:00Z",            // transaction time
    "method":   "vision-analysis@2.3"
  }
}
```

- **Valid time** — when the claim is true within its world.
- **Transaction time** (`prov.asserted`) — when it entered the fabric.
  Together these answer both "what was true in 1799?" and "what did we believe last month?"
- Equivalence links (`same_as`, `based_on`, …) are ordinary assertions using these
  reserved relations, so they inherit confidence/provenance/time.

### 7.2 Asset envelope

```jsonc
{
  "id":       "formant:asset:blake3-a1b2…",   // hash of bytes
  "media_type": "audio/wav",
  "bytes":     480000,
  "source_world": "insimul:world:alderforest", // REQUIRED at ingest — the world the bytes
                                                //   depict; claims extracted from this asset
                                                //   default to this world (delta A)
  "attaches_to": ["pinakes:ent:tr-808"],       // entities this asset depicts/realizes
  "produced_by": "formant:run/…",
  "prov": { /* as above */ }
}
```

Assets **attach to entities by identifier** — media is not a node type in the knowledge
graph; it hangs off entities in the fabric. `source_world` is **required at ingest** (delta
A): it is how the firewall (§4.3) engages on ingested media — knowledge extracted from an
asset lands in the asset's `source_world`, never silently in consensus reality.

**Out of scope (delta E):** `asset` ids are byte-exact hashes and do *not* capture perceptual
identity — a re-encode of the same audio/video mints a different `asset` id. Near-duplicate /
perceptual matching, and the asset-level `derived_from` relation that records re-encode
lineage, belong to `media-interchange.md`. Shared *meaning* across re-encodes is carried at
the entity level via `attaches_to`. Full asset/EDL interchange is likewise
`media-interchange.md`; KINP fixes only the `asset` identifier, `source_world`, and
`attaches_to`.

---

## 8. Resolver API

Deliberately small. Maps onto existing standards where noted.

```
resolve(id [, world])
    → { entity, same_as_closure[], based_on[], provenance[], attached_assets[] }
    Dereference an identifier. Merged view is computed here, not stored.

reconcile(descriptor)                          ← OpenRefine/Wikidata Reconciliation API
    → ranked [ { candidate_id, score, why } ]
    Fuzzy-match a descriptor to candidate entities.

mint(kind, payload)
    → id
    Deterministic for claim/asset (returns the content hash); allocates a provisional
    local for entity.

link(a, b, relation, confidence, prov)
    → claim_id
    Assert an equivalence-layer relation (same_as | based_on | part_of | instance_of).

query(pattern, world)
    → assertions[]
    Read the fabric relative to a world (with inheritance, §5).
```

**Deployment:** the resolver is a *thin* service over the fabric — a registry + reconciler
+ forwarder, **not** a transform gateway. It holds no project business logic. Per the
ecosystem thesis, it can itself be a Cuneiform-generated org. Pinakes provides the
`resolve` / `reconcile` authority for real-world entities; each project can run a local
resolver cache for offline use that syncs `same_as` links opportunistically.

---

## 9. Standards borrowed (and deliberately not adopted)

| Borrowed | Used for | Not adopting |
|---|---|---|
| IRIs / CURIEs (W3C) | identifier form (§3) | — |
| W3C PROV (shape only) | provenance envelope (§7) | full PROV ontology / RDF |
| OpenRefine/Wikidata Reconciliation API | `reconcile` (§4.5, §8) | — |
| Content addressing (git/IPFS-style) | claim + asset IDs (§2, §6) | IPFS network itself |
| `owl:sameAs` semantics (concept only) | `same_as` licensing (§4.3) | OWL reasoning stack |

Storage stays **Prolog / TSV / grounding-pack native.** A full RDF triplestore + SPARQL
commitment would fight Insimul's Prolog core and Pinakes's TSV-first discipline for little
gain. KINP stays IRI-*compatible* so an RDF export remains possible later.

---

## 10. Per-project adoption map

Nobody rewrites their core. Most of this is promoting private conventions to the shared
namespace and adding the equivalence layer.

| Project | Already has | Change needed |
|---|---|---|
| **Pinakes** | canonical entities, Wikidata anchoring, entity-resolution, TSV SoT | Become the **resolver/authority**; expose `resolve` + `reconcile`; emit KINP IRIs/CURIEs on the canonical schema. |
| **Argos** | content-addressed predicates + assets, provenance, valid-time | Mostly **relabeling**: predicate → assertion (keep), subject/object → entity refs (resolve), asset id → `asset` kind; emit `same_as` to Pinakes; add transaction-time split. |
| **Insimul** | Prolog facts, `predicate-schema.ts`, canon/save-file split | Add **world-scoped** entity IDs + `based_on` links to Pinakes; formalize canon/playthrough as worlds; represent ids as `id/3` terms with a prefix registry. |
| **Formant** | plugin/node/hardware registries | Give plugins/gear **entity** IDs; anchor to MusicBrainz/real gear; audio outputs = `asset` kind with `attaches_to`. |
| **Cuneiform** | agent roles, org model, `agent.pl` KBs | Agents/orgs get **entity/agent** IDs in the shared namespace; provision the resolver as an org. |

---

## 11. Ratified decisions

The three design forks were ratified on 2026-07-17. The choices below are now normative;
rejected alternatives are recorded for provenance.

1. **Resolver authority → Pinakes is the single canonical authority** for real-world
   entities (anchored to Wikidata). *Rejected:* fully federated with no privileged node.
   *Rationale:* canonical quality and dedup outweigh federation purity, and offline-first is
   preserved regardless because minting is local and reconciliation is eventually-consistent
   (§6). Authority is a **role**, not a hard dependency — federation stays a future option.
2. **Merge aggressiveness → hybrid.** Auto-apply `same_as`/`based_on` above a confidence
   threshold; route high-impact or below-threshold links to a **review queue**, reusing
   Pinakes's convergence-QA gate. *Rejected:* always-auto (contamination risk) and
   always-review (does not scale). The threshold is configurable per world.
3. **World model in Prolog → explicit `@world(W)` context argument.** *Rejected:* one module
   per world. *Rationale:* the context argument round-trips cleanly to TSV and the
   grounding-pack; modules would trap world scoping inside the Prolog runtime and complicate
   export. Ergonomic sugar over the argument MAY be provided.

See [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) for the
end-to-end pressure test that drove deltas A–E, all folded into this 0.2.0 revision.

---

## Changelog

- **0.2.0** (2026-07-17) — **Ratified.** Folded pressure-test deltas A–E: asset
  `source_world` (A, §7.2); claim normalization promoted to normative (B, §6); resolver
  `same_as`-vs-`based_on` rule (C, §4.5); reserved `retracts`/`supersedes` lifecycle relations
  (D, §4.2); perceptual/near-dup asset matching scoped out (E, §7.2). Ratified the three design
  forks (§11): Pinakes-as-authority, hybrid merge policy, `@world(W)` argument.
- **0.1.0** (2026-07-17) — Initial candidate draft.
