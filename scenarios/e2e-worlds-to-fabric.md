# Scenario: Worlds → Fabric (end-to-end pressure test)

**Purpose:** stress-test [`../specs/identity.md`](../specs/identity.md) (KINP 0.1.0) against
concrete data flowing through **three** participants, deliberately hunting for places it breaks.
Each step names what *held* and what *broke*; §Findings collects the required spec deltas.

**The story:** a designer using a **world producer** (`worldsim`) builds a fiction
(`alderforest`) containing an NPC *Général Renaud*, modeled on the real Napoleon. A player
records a playthrough; the footage is uploaded to a **knowledge producer** (`analyzer`), which
extracts knowledge from it. The **identity authority** (`refkb`) reconciles the extracted
entities against consensus reality. The user then runs cross-participant queries.

---

## Step 1 — the world producer authors the world

```prolog
% World + entity (world-scoped namespace, §3.4/§5)
world(id(world, worldsim, alderforest), inherits(id(world, refkb, 'consensus-reality'))).
entity(id(ent, 'worldsim:world:alderforest', 'npc-renaud'), type(person)).

% Lineage to the real figure — based_on, NOT same_as (§4.3 firewall)
based_on(id(ent, 'worldsim:world:alderforest', 'npc-renaud'),
         id(ent, refkb, 'napoleon-i'), confidence(0.8)).

% An in-fiction claim, world-scoped
commands(id(ent,'worldsim:world:alderforest','npc-renaud'),
         id(ent,'worldsim:world:alderforest','army-of-ash')) @ world(alderforest).
```

✅ **Held.** Provisional/authored entity minted offline (§6); firewall link present; claim
scoped to its world.

---

## Step 2 — player records; footage uploaded to the knowledge producer

The asset is bytes; it attaches to entities. **Critical:** the asset must carry the
*source world*, or the knowledge producer has no way to know the footage is fiction.

```jsonc
{ "id": "analyzer:asset:blake3-a1b2…", "media_type": "video/mp4",
  "attaches_to": ["worldsim:world:alderforest"],          // source world travels WITH the asset
  "prov": { "activity": "analyzer:run/1a2b", "asserted": "2026-07-17T…" } }
```

🔴 **BROKE (found gap #1).** KINP §7.2 defines `attaches_to` as *entities*, and asset
envelopes have no dedicated **source-world** field. Without it, Step 4's reconciler defaults
extracted claims to `consensus-reality` and the firewall never engages — fiction leaks into
the real graph. **Delta A required.**

---

## Step 3 — the knowledge producer extracts knowledge from the footage

Vision/ASR yields a new *local* entity and a claim. The producer does **not** yet know this
equals Renaud or Napoleon.

```prolog
entity(id(ent, 'analyzer:local', 'e-8842'), type(person)).
% Extracted claim — lands in the SOURCE world (once Delta A lands), high-uncertainty
commands(id(ent,'analyzer:local','e-8842'),
         id(ent,'analyzer:local','e-8842-army')) @ world(alderforest) :- confidence(0.55).
```

✅ **Held** (given Delta A): entity content-addressing avoided — a stable provisional local
is minted (§2/§6), so learning more attributes later won't orphan these claims.

🔴 **BROKE (found gap #2).** The extracted claim `commands(e-8842, e-8842-army)` and
the world producer's `commands(npc-renaud, army-of-ash)` are *the same fact about the same referents*,
but they mint **different** `claim` hashes because (a) the entity IDs differ pre-reconciliation
and (b) normalization is unspecified. Content-addressed dedup (§2) silently fails across
producers. This is the dependency KINP §6 flags on `grounding-pack.md`, but the scenario
shows it is **load-bearing, not optional**. **Delta B required.**

---

## Step 4 — the identity authority reconciles

The resolver matches `analyzer:local:e-8842` against consensus reality via `reconcile` (§4.5).
Two candidates score high: the real Napoleon, and (via Step 1's `based_on`) the fictional
Renaud.

```prolog
% Cross-world, differing ontological status → based_on, NOT same_as (§4.3)
based_on(id(ent,'analyzer:local','e-8842'),
         id(ent, refkb, 'napoleon-i'), confidence(0.83), src('analyzer:run/1a2b')).
% Same world, same ontological status → same_as
same_as(id(ent,'analyzer:local','e-8842'),
        id(ent,'worldsim:world:alderforest','npc-renaud'), confidence(0.9)).
```

🔴 **BROKE (found gap #3).** KINP §4.5 says reconciliation *proposes* links but never states
**how the resolver chooses `same_as` vs `based_on`.** The correct rule emerges only here:
*when a candidate lives in a different world AND that world does not inherit-as-identity, emit
`based_on`; when same world (or identity-inheriting), emit `same_as`.* That rule must be
written into the spec. **Delta C required.**

✅ **Held:** because Renaud→Napoleon is `based_on` (Step 1) and e-8842→Napoleon is `based_on`
(here), no `same_as` path connects the fictional footage entity to the real Napoleon. Firewall
intact through two hops.

---

## Step 5 — cross-participant queries

**Q1: "Which real historical figures inspired characters in my footage?"**
Traverse `attaches_to` → entities in `alderforest` → `based_on` → `same_as`(wikidata).
Returns **Napoleon (Q517)**. ✅ Held.

**Q2: "List facts true of the real Napoleon."**
Query `world = consensus-reality`, traverse `same_as` only.
Returns his real biography; **excludes** `commands(_, army-of-ash)` and any Renaud/e-8842
claim (they're in `alderforest` and linked by `based_on`, not `same_as`). ✅ **Held — the
core anti-contamination property.**

**Q3 (in-playthrough): "Is Paris intact?"** where the fiction overrides a real fact.

```prolog
destroyed(id(ent, refkb, 'paris')) @ world('worldsim:world:alderforest#save-7f').
```

Query at `save-7f` sees the override; the same query at `consensus-reality` does not. ✅ Held
— world inheritance + override precedence (§5) behaves.

---

## Step 6 — A wrong belief, later corrected

The `commands(e-8842,…)` extraction (confidence 0.55) turns out wrong. Claims are immutable
and content-addressed (§2) — you cannot delete one. You assert a retraction with a later
**transaction time** (§7.1 bitemporal split):

```prolog
retracts(id(claim,analyzer,'sha256-…'), reason(misdetection)) @ world(alderforest)
    :- prov(asserted('2026-07-20T…')).
```

✅ **Held:** bitemporality lets "what we believe now" diverge from "what we asserted then"
without mutating immutable claims. But 🔴 **minor gap #4:** KINP lists relation kinds for the
*equivalence* layer (§4.2) but never reserves `retracts` / `supersedes`. **Delta D (minor).**

---

## Step 7 — The dedup limit (honest boundary)

The media producer renders `kick.wav`; the knowledge producer re-encodes it during editing.
Byte hashes differ →
**two** `asset` IDs though the audio is "the same." Content addressing is byte-exact; it does
not capture perceptual identity.

⚠️ **Not a break — a documented boundary.** Resolution: link them with a `derived_from`
*asset-level* relation (media-interchange concern), and let entity-level `attaches_to` carry
the shared meaning. KINP should explicitly scope perceptual/near-dup matching **out**. **Delta E (doc-only).**

---

## Findings — required spec deltas

| # | Severity | Gap | Delta |
|---|---|---|---|
| A | **High** | Asset envelope can't carry the source world → firewall never engages on ingested media. | Add `source_world` to the asset envelope (§7.2); ingestion MUST populate it. |
| B | **High** | Cross-producer claim dedup fails without shared normalization. | Elevate claim-normalization from a `grounding-pack.md` footnote to a **normative, load-bearing** KINP requirement (§6); specify canonical arg order, ID normalization (CURIE↔IRI), literals. |
| C | **High** | Resolver has no stated rule for choosing `same_as` vs `based_on`. | Add the world/ontological-status rule to §4.5: different non-identity-inheriting world ⇒ `based_on`; else `same_as`. |
| D | Minor | No reserved relations for retraction/supersession. | Reserve `retracts`, `supersedes` alongside the equivalence relations (§4.2). |
| E | Doc | Byte-exact asset hashing ≠ perceptual identity; unstated. | Scope perceptual/near-dup matching out of KINP; introduce asset-level `derived_from` in media-interchange. |

## Verdict

The **core thesis survives the stress test**: the `same_as`/`based_on` firewall (§4.3) plus
world scoping (§5) delivers the decisive property — real-world knowledge stays uncontaminated
by fiction *and* the two remain queryable together (Q1/Q2). The breaks are all at the
**seams** (media↔knowledge boundary, cross-producer dedup, resolver decision rule), not in the
model's spine. Deltas A–C should land before KINP is ratified past `candidate`; D–E are
cleanups. None require redesign.

> **Resolution (2026-07-17):** deltas A–E were folded into **KINP 0.2.0** (A `source_world` on the
> asset envelope, B normative claim normalization → [`../specs/grounding-pack.md`](../specs/grounding-pack.md)
> §3, C the `same_as`/`based_on` resolver rule, D reserved `retracts`/`supersedes`, E perceptual
> matching scoped out). KINP is **ratified**; this document stands as the historical record of what
> the pressure test found.

---

## Re-validation — KGP 0.5.0 (bespoke canonical retained; RDF projection specified)

**KGP 0.5.0** ([ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)) decides what
this scenario's **delta B** was fixed *with*. Delta B installed a mechanism — a normative byte
canonicalization minting a content-addressed claim id (KGP §3) — without ever asking whether three
mature standards that model the same object should have supplied it instead. ADR-0006 asks, and
**retains** the bespoke canonical: TSV stays canonical, §3 stays the identity mechanism, and
RDF-star / W3C PROV / JSON-LD become a specified, lossless **projection** (KGP §4.1) rather than the
canonical. Because that is a normative change to the mechanism this scenario forced into existence,
KGP dropped back to **candidate** (ADR-0006 decision 6), and the legs that mint or move claims —
**3** (extraction), **4** (reconciliation), plus a new pack-construction and export leg the original
pass never ran — were re-run against 0.5.0.

The question is narrow and adversarial: *now that the standards have been considered and declined,
does the retained canonical still deliver the three properties the decision was staked on?* Each
probe below states what would have counted as a break.

### R1 — the §3.3 convergence result still holds

> **Break condition:** any change to `HASH_INPUT` for Step 3/4's claims, or a claim id that differs
> between KGP 0.4.0 and 0.5.0. Either would mean the decision silently re-minted the graph.

Step 4's post-reconciliation state, re-run under 0.5.0's §3 (§3.1–§3.3 are byte-unchanged from
0.4.0 — 0.5.0 adds §3.4, which is *informative rationale* sitting beneath them, and §4.1, which
sits outside the identity path entirely):

```
world producer (Step 1)
  worldsim:world:alderforest | commands(worldsim:world:alderforest:ent:npc-renaud,
                                        worldsim:world:alderforest:ent:army-of-ash)

knowledge producer (Step 3), re-expressed via the resolver's same_as (Step 4)
  → the identical byte string

  ⇒ one claim id   C := "sha256-" · lowerhex(SHA-256(UTF8(HASH_INPUT)))
  ⇒ MERGE — prov(worldsim, conf 1.0) and prov(analyzer:run/1a2b, conf 0.55) both retained
```

✅ **Held, byte for byte.** The merge of Step 4 is unchanged, and because the hash input is
unchanged, **no already-minted claim id moved**: 0.5.0 is additive over 0.4.0 for every producer
that already had a conformant pack.

**Counter-probe — the option (a) that was declined.** The same two records, projected to RDF
*first* and hashed there: the world producer's graph carries `<<…>>` annotated with its confidence
and PROV agent, the knowledge producer's carries `0.55`, a different agent, and a `valid_time`.
W3C RDF Dataset Canonicalization hashes the **dataset**, so those annotations land *inside* the
digest → **two ids, no merge** — precisely the break delta B was raised to fix, reintroduced by the
alignment that was supposed to subsume it. Recovering KGP's property under (a) means hashing a
per-statement sub-graph with the claim's own annotations stripped, which is §3 re-derived in RDF
syntax. ✅ **Confirms ADR-0006 decision 2, row 1 on this scenario's data** rather than in the
abstract — and it is the row to re-test if RDF ever standardizes a per-statement canonicalization
(the ADR's re-open condition).

### R2 — the §7 filters survive the decision

> **Break condition:** any of confidence / license / egress becoming unavailable, becoming part of
> claim identity, or becoming enforceable only in some encodings.

New leg. The knowledge producer builds a boundary-crossing snapshot for the identity authority
(`analyzer` → `refkb`, `dialect: grounding-only`, KGP §2), from the claims this scenario produced
plus one the original pass never modeled: the player's footage is *personal* media, so extraction
over it yields records that must never leave the personal tier.

| Record | conf | license | egress | tier | At pack construction |
|---|---|---|---|---|---|
| `commands(npc-renaud, army-of-ash)` — the merged claim of R1 | 1.0 / 0.55 (one per prov record) | `CC-BY-4.0` (attribution) | `exportable` | synthetic / acquired (one per prov record) | **admitted** |
| `based_on(npc-renaud, refkb:napoleon-i)` (Step 1) | 0.8 | `CC-BY-4.0` | `exportable` | synthetic | **admitted** |
| `same_as(e-8842, npc-renaud)` (Step 4) — the resolver's supporting evidence came from a share-alike corpus, so the link inherits it | 0.9 | `CC-BY-SA-4.0` (share-alike) | `exportable` | acquired | **admitted** — the consumer decides |
| `cine:shows(analyzer:local:ent:shot-114, analyzer:local:ent:p-owner)` — the same extraction pass, on a shot that depicts the *player*, not the fiction | 0.9 | `PERSONAL` | **`local-only`** | personal | **filtered out** (§7.2), counted in the construction report, never encoded |

- **Egress.** ✅ **Held.** The `local-only` record is gone *before* any encoding exists, so it cannot
  appear in the TSV, the JSON twin, the Neo4j projection, or the new RDF projection — §4.1's rule
  that enforcement is never delegated to a projection is not an extra check, it is a statement about
  ordering. The consumer's reciprocal duty (reject-and-report a pack containing `local-only`) is
  unchanged by the decision because it reads the pack, not a graph.
- **License.** ✅ **Held.** The share-alike `same_as` is admitted into the pack and **rejected per
  record with a report** by a consumer running the §7.1 default allowlist. Decisively: its claim id
  is unchanged by the rejection, so the same record re-admitted later under a share-alike-labeled
  partition **merges** rather than duplicating.
- **Confidence.** ✅ **Held.** Slicing at `confidence ≥ 0.9` drops the `analyzer` prov record of the
  merged claim and keeps the `worldsim` one — the *claim* is untouched and keeps id `C`, because
  confidence never entered the hash (§3.1). This is the §7 property that made the standards question
  a question about *syntax*, not semantics: it survives whichever way the ADR had gone.
- **Axis separation.** ✅ **Held.** The four axes stay independent on the same records: the merged
  claim carries two trust tiers (one per prov record) and one license; the filtered record is
  `personal` *and* `local-only` — and it is the **egress class** that removed it, the tier being
  descriptive (§7.2). The pack's `grounding-only` dialect (§5) constrained none of the above.

🟡 **New exposure (not a delta).** The gate is a property of the **pack-construction step**, and the
RDF projection is the encoding most likely to be produced *not* by that step — a consumer's own
triplestore mirror can emit RDF-star straight from a store, with no manifest and no gate in front of
it. KGP §7.2 and §4.1 already forbid treating that as a transfer ("never delegated to a serialization
or projection"), but nothing *in the encoding itself* carries evidence that the gate ran; the pack
manifest (§2) is where that evidence lives. The conformance consequence is worth stating plainly:
**the unit of transfer is the pack, never a bare projection** — a validator must refuse a projection
that arrives without its manifest. That is a downstream validator obligation
([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)), not a missing clause.

### R3 — every §4 encoding still round-trips, the new one included

> **Break condition:** an encoding from which the canonical cannot be recovered, or a recovered
> claim whose re-derived id differs from `C`.

| Encoding | Round-trip of R1's merged claim + its §7 axes | Result |
|---|---|---|
| **TSV** | source of truth — nothing to round-trip | ✔ canonical |
| **JSON** | field-for-field twin of the rows | ✔ lossless |
| **Prolog facts** | `commands(…,…) @world(alderforest)`; confidence/prov/license/egress ride the record, not the term | ✔ lossless, tier-gated (§5) |
| **Datalog (`.dl`)** | ground facts only; the pack is `grounding-only`, so nothing is dropped | ✔ lossless |
| **ProbLog** | `0.55::commands(…)` — the *record's* confidence becomes the fact probability | ✔ lossless per record — see 🟡 **KGP-1** |
| **Neo4j** | entities→nodes, the claim→edge, prov/license/egress→edge props | ✔ lossless |
| **RDF-star / PROV / JSON-LD** | worked below | ✔ lossless over the binary core — see 🟡 **KGP-2** |

**Worked round-trip of the new projection.** Per §4.1 the world becomes the named graph (by its KINP
canonical IRI), the binary relation becomes the triple, and everything §3.1 excludes from identity
becomes an annotation on the quoted triple:

```
GRAPH <world IRI of worldsim:world:alderforest> {
  <npc-renaud IRI>  <commands IRI>  <army-of-ash IRI> .

  << <npc-renaud IRI> <commands IRI> <army-of-ash IRI> >>
      claim-id     "C" ;                       # annotation — NOT recomputed from the graph
      confidence   0.55 ;                      # per prov record; 1.0 for the worldsim record
      prov         <PROV activity analyzer:run/1a2b> ;   # W3C PROV terms
      license      "CC-BY-4.0" ;
      egress       "exportable" ;
      dialect      "grounding-only" .
}
```

Back the other way: the named graph yields the world, the triple yields relation + arguments, and
§3.2 is applied to those recovered values to **re-derive** the id — which is then compared against
the `claim-id` annotation and must agree (§4.1 rule 2). ✅ **Held**, and the re-derivation is what
makes the round-trip *verifiable* rather than merely asserted.

**Probe — lexical vs. value round-trip.** A conforming triplestore may re-serialize
`"1.00"^^xsd:decimal` as `"1.0"^^xsd:decimal`, and a byte-level reading of "round-trips losslessly"
would fail on that immediately. ✅ **Held anyway**, and for the right reason: §4.1 rule 2 re-derives
the id from the *recovered canonical*, and §3.2's literal rules (shortest round-tripping decimal,
NFC strings, fixed-precision UTC datetimes) re-normalize the value before it is hashed. The
obligation is therefore lossless at the level of **canonical values**; a projection's lexical form is
free to differ, which is exactly why §3 could not have been retired by adopting RDF.

**Probe — symmetric operands.** `same_as(e-8842, npc-renaud)` is symmetric, so §3.2 rule 2 sorts the
operands before hashing while RDF forces a subject/object direction. ✅ **Held** — the projection
emits the sorted order, and the round-trip re-sorts, so the authored direction is not identity-
bearing in either form.

**Probe — arity > 2.** Every relation in [`../registry/`](../registry/) is binary today, so this
probe is run against a *prospective* domain extension (a ternary `cine:` relation fixing shot,
subject and frame-range). §4.1 declines to project it as a bare triple and requires it in the
**report** instead. ✅ **Held as specified** — the result is *complete or reported*, never silently
lossy — and the ProbLog/Datalog/Neo4j projections are unaffected, since only the RDF direction has
the arity constraint.

### Findings — new, minor, neither reopens A–E

| # | Severity | Gap | Direction |
|---|---|---|---|
| **KGP-1** | Minor | **Which confidence a merged claim projects to ProbLog is unstated.** A claim carrying two prov records (R1) has two confidences; a ProbLog fact has one probability. Round-trip and claim identity are unaffected — the ambiguity is *which records to project*, not whether the projection is lossless. Pre-existing — the §4 ProbLog row predates this decision — and surfaced only because R2 made a multi-prov merged claim explicit. | State in §4 that the projection emits one fact **per admitted prov record** after the §7 slice, and that folding several into one probability is the consumer's aggregation policy, not KGP's. |
| **KGP-2** | Minor | **The projection's annotation vocabulary is unnamed.** §4.1 fixes the *structure* (which KGP construct becomes an annotation on the quoted triple) but names actual terms only for `prov`, where PROV supplies them. Two conformant producers can therefore emit structurally identical, mutually unreadable projections — an interop gap inside the feature whose whole purpose is interop. | Name the annotation predicates in §4.1 — a koine-owned term namespace for `claim-id` / `confidence` / `valid_time` / `embedding_model` / `license` / `egress` / `dialect`, reusing an external term wherever one already exists. |

Both are **projection-surface** findings. Neither touches §3, the §3.3 convergence result, or any
already-minted claim id, and neither reopens deltas A–E — which is the load-bearing outcome of this
pass: the decision was made *around* the mechanism this scenario forced into the spec, not *through*
it.

### Verdict

The three properties ADR-0006 staked the retention on all hold on this scenario's data: **claim-id
convergence is byte-unchanged** (R1), **confidence / license / egress remain first-class filters
outside claim identity and outside every encoding** (R2), and **every §4 projection round-trips,
the new RDF-star / PROV / JSON-LD one included** (R3) — with the counter-probe in R1 showing the
declined option would have broken the merge this scenario exists to protect.

> **Resolution (2026-08-02):** this pass is recorded against **KGP 0.5.0** (§3.4 retention rationale,
> §4.1 projection mapping) and its machine-readable twin
> [`../schemas/grounding-pack.schema.json`](../schemas/grounding-pack.schema.json) +
> [`../schemas/provenance.schema.json`](../schemas/provenance.schema.json). Promotion back to
> **ratified** is *not* claimed here: **KGP-1** and **KGP-2** are open against §4/§4.1, and the
> projection's round-trip is desk-verified in prose here while ADR-0006 makes it a standing
> obligation — a machine-checked round-trip fixture belongs to a downstream validator
> ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)) and does not exist yet. KGP stays
> **candidate** until both land.
