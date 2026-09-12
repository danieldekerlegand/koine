# The `eval` relation domain — the proposal as received, and the verdict

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

An **evaluation producer role** has asked the shared relation registry for two relations. Until
this page, koine had never received that ask in writing: `grep -rn 'evaluated_by\|verdict_of'`
over this repository returned **no spec, no registry table, no schema and no document** — only the
[`ROADMAP.md`](../../ROADMAP.md) row recording that an ask existed. So the first thing owed is the
**record**, and the second is a **verdict**. This page is both.

**What this page is not.** It binds no clause and moves no version. Every spec header remains the
sole authority on its own version and status; nothing here is a status mirror. It is a decision
about **vocabulary**, taken axis by axis *before* a row is written — the discipline
[`generative-audio-modalities.md`](generative-audio-modalities.md) used for KFT's two audio rows,
and the reason this is a reference record rather than an [ADR](../../decisions/README.md): it
decides what the registry admits, not how the fabric is shaped. The rows themselves land in
`registry/relations/eval.tsv` — the file is the record that they did, and §9 lists every surface
that moves with them.

**Verdict, up front.** **ACCEPT — both relations, as a namespaced domain extension, at
`grounding-only`, typed `id|id` at every position.** And the narrow half of the same verdict:
**no `eval:score`-shaped relation is added**, for the reason the asking producer gave itself.

---

## 1. The proposal as received

Recorded here for the first time, as asked rather than as paraphrased:

| | `eval:evaluated_by` | `eval:verdict_of` |
|---|---|---|
| `arity` | 2 | 2 |
| `arg_roles` | `artifact\|evaluator` | `verdict\|artifact` |
| Requested tier | `grounding-only` | `grounding-only` |
| Both arguments | entity-to-entity | entity-to-entity |
| `symmetric` | no | no |

**What the asking producer does today instead.** Its evaluation verdicts project their **lineage
and none of their reading**. `derived_from` ([`registry/relations.tsv`](../../registry/relations.tsv),
*General derivation lineage*) crosses the boundary, so a consumer learns that a verdict came from
an artifact; every measurement and every finding is then reported under `manifest.unprojected`.

**That is correct behaviour, not a defect, and the distinction is the whole reason this row
exists.** [KGP §3.2](../../specs/grounding-pack.md) rule 1 requires a relation name to be *"drawn
from the shared relation registry"*, and
[ADR-0008](../../decisions/ADR-0008-fabric-producer-adapter.md) decision 1 says of the
adapter that *"it coins no relation"*. A producer with a fact and no row has exactly two
conformant options — report it `unprojected`, or ask for the row. It has done both. What makes an
unanswered proposal costly is that an honest `unprojected` report is indistinguishable, from the
consumer's side, from an adapter that is losing data.

**Nothing is blocked.** The producer works today. What it lacks is vocabulary, and what a consumer
lacks is any reading of the evaluation at all.

---

## 2. The governance this verdict is measured against

Three rules, all of them already ratified, and none of them written for this case:

- **Shared core plus namespaced domain extensions** ([`registry/README.md`](../../registry/README.md),
  ratified 2026-07-17, closing KGP §9 Q1). `relations.tsv` is the core every project loads;
  `relations/<domain>.tsv` is a domain a project loads **only if it speaks it**.
- **New relations are added by PR** (same file). There is no second bar — no scenario leg, no
  spec version, no ratification gate. A relation registry addition is a data change, gated by
  [`scripts/check-registry.mjs`](../../scripts/check-registry.mjs).
- **A signature is immutable once published** (same file; [KGP §9](../../specs/grounding-pack.md)
  decision 1). Arity, argument order, symmetry **and argument type** are fixed at mint time,
  because changing any of them changes every dependent `claim` id. Since KGP 0.6.0 the signature
  includes `arg_types`, and the standing ordering rule is explicit that **a new relation is typed
  when it is minted, never after**.

**The precedent is in the registry already.** `soc:` is described in
[`registry/README.md`](../../registry/README.md) as *"person-level kinship, employment and
residence, **added for a world producer's social vocabulary**"* — a domain that landed because a
producer role asked for it. This ask has the same shape, from a different role.

---

## 3. Is the vocabulary already there? The redundancy test

The registry's own strongest objection to a new relation is that an existing one covers it —
[ADR-0008](../../decisions/ADR-0008-fabric-producer-adapter.md) decision 5 is that objection
sustained (*"Grounding a mention reuses `same_as`; koine adds no `mentions` relation"*). So the
29 published relations were read against both requests before either was accepted.

**For `eval:verdict_of` — the aboutness question.** Four candidates, all declined:

| Candidate | Why it is not this |
|---|---|
| `derived_from` | Lineage. It says the verdict *came from* the artifact. It is what crosses today, and losing the reading is the complaint. |
| `based_on` | Lineage explicitly **without** fact transfer (KINP §4.3's firewall). Narrower than `derived_from`, not different in kind. |
| `part_of` | Mereology. A verdict is not a constituent of the thing it assesses. |
| `media:mentions` | An asset's text/transcript *referring* to an entity — reference, and on the media plane. A verdict is not a mention of its subject. |

Nothing in the registry expresses **"X is an assessment about Y"**. Lineage and aboutness are
different edges, and the producer's `unprojected` report is the measurement of that gap.

**For `eval:evaluated_by` — the provenance question, which is the sharper one.** A reader may
reasonably object that this is provenance, not a claim: [KINP §7.1](../../specs/identity.md)'s
assertion envelope already carries `prov`, and a `prov` record names an activity. The objection
fails on what `prov` *is about*. A claim's `prov` records who asserted **the claim**; the request
here is for a fact **about the artifact** — that it was evaluated, and by whom — which is a
first-class edge in the graph, answerable by a query (*which artifacts has this evaluator
assessed?*) rather than by reading the metadata of whichever assertion happened to arrive.

---

## 4. Why the two rows are not redundant with **each other**

Accepting both needs its own argument, because one plausibly derives the other: given
`eval:verdict_of(verdict, artifact)` and the verdict's own provenance, is `eval:evaluated_by`
recoverable? **No, and for three independent reasons.**

1. **The derivation is not expressible in any KGP dialect tier.** All of `prov` is excluded from
   [KGP §3.1](../../specs/grounding-pack.md)'s hashed set and is an *annotation*, never a relation
   argument. A Horn rule over `prov` cannot be written at `horn-safe` or at `full-prolog`, because
   there is no predicate to write it over. This is not a question of which tier is expensive; the
   rule has no form.
2. **The asserter is not the evaluator.** `prov` on the claim that a verdict exists names whoever
   asserted it — a relay, an aggregator, a pack builder. Reading the evaluator off it is a guess,
   and the guess is wrong in exactly the federated case [KINP §4.1](../../specs/identity.md)
   exists to bound.
3. **The two facts have different sensitivity, and [KGP §7](../../specs/grounding-pack.md) acts on
   the difference.** A verdict's *reading* may be `local-only` or below a consumer's confidence
   threshold while the *fact that an evaluation happened* is `exportable`. §7's filters drop
   records, so a pack can legitimately carry `eval:evaluated_by` and no verdict at all. One row
   would make that pack unsayable.

Both land.

---

## 5. Why a domain, and not the core

The ask was for a domain and the ask is honoured, but the reasoning is recorded because the core
was the live alternative — evaluation is not a niche concern, and both KCS and KFT read evaluation
results today.

- The core file is what **every** project loads. Adding to it obliges every participant to carry
  vocabulary most of them will never assert. A domain file is loaded only by a project that speaks
  it, which is the entire point of the 2026-07-17 governance.
- The core is also the harder commitment to reverse. Both directions are constrained by
  immutability, but a domain is the smaller published surface, and nothing about these two rows
  needs core reach: neither is referenced by a spec clause, a schema, or
  [`registry/media-types.tsv`](../../registry/media-types.tsv)'s `lineage_relation` column.

**`eval` is free as a domain prefix.** The registry holds `cine:`, `media:` and `soc:`; the README
names `ling:` and `dsp:` as illustrations only. A relation-domain prefix is also a different space
from [KINP §3.4](../../specs/identity.md)'s namespace prefix registry — `eval:verdict_of` is a
relation name and `analyzer:ent:x` is an identifier, and they are disambiguated by position in
`HASH_INPUT`, exactly as the three existing domains already are.

---

## 6. The signature, settled before the rows land

The immutability rule means every column is decided now or the rows do not land at all.

| Column | `eval:evaluated_by` | `eval:verdict_of` | Why |
|---|---|---|---|
| `arity` | 2 | 2 | Binary, like every published relation. ADR-0006 permits a registry extension to fix higher arity, and neither of these needs it — see §7. |
| `arg_roles` | `artifact\|evaluator` | `verdict\|artifact` | **As asked.** Order is the signature; it is not re-opened for style. |
| `arg_types` | `id\|id` | `id\|id` | Both relations are entity-to-entity, so all four positions are identifiers under [KGP §3.2](../../specs/grounding-pack.md) rule 3. Typed at mint, which is the standing ordering rule met rather than cited. |
| `symmetric` | `false` | `false` | **As asked.** Neither is reversible: an evaluator is not evaluated by its subject, and an artifact is not a verdict about its verdict. |
| `tier` | `grounding-only` | `grounding-only` | **As asked**, and correct: neither carries a closure or an inference rule, which is what puts `part_of`, `instance_of` and the `soc:` rows at `horn-safe`. Tiers nest, so both are usable in a `horn-safe` pack. |
| `domain` | `eval` | `eval` | §5. |
| `inverse` | *(empty)* | *(empty)* | §8. |

**On the `artifact` position specifically.** An evaluated artifact may be a
[KINP §3.1](../../specs/identity.md) `ent`, an `asset`, or a `model` entity
([`registry/entity-types.tsv`](../../registry/entity-types.tsv)). The registry types the
*rendering* of a position, not the entity kind of what fills it, so `id` covers all three and no
kind enum is widened. A `verdict` is likewise an ordinary minted entity, and an `evaluator` an
`agent` — both kinds already in §3.1's enum. **No identifier grammar moves for these rows.**

---

## 7. The no-score boundary, upheld — and why

**No `eval:score`-shaped relation is added.** The objection is the **asking producer's own**: it
raised it rather than asking for the row, and the reason it gave is correct.

A row such as `eval:score(artifact, "7")` would put the value inside `HASH_INPUT`, and
[KGP §3.1](../../specs/grounding-pack.md) then does exactly what it is designed to do — *"the same
fact asserted by two producers with different confidence/provenance mints the same `claim` id and
therefore **merges**, while their provenance records both survive"*. Two evaluators scoring the
same artifact `7` on two **unrelated** scales would converge on one claim id carrying two
provenance records. A consumer reads corroboration. That is **regression presented as agreement**,
and it is worse than the `unprojected` report it would replace, because `unprojected` is legible
as a gap and a false merge is not.

The repair is not a better literal type. A score is only meaningful qualified by its metric and its
scale, which is a relation of **arity > 2** — and
[ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) with
[KGP §4.1](../../specs/grounding-pack.md) are clear about the cost: the projection is defined for
the binary core, so a higher-arity relation is *"not projected as a bare triple"* and must be
reified by the consuming ecosystem or omitted with a report. The reification is a **verdict
entity** — which is precisely what `eval:verdict_of` reaches. A score belongs in the verdict's own
payload, addressed by the row this page accepts.

**And a boundary statement, because it is the one way this verdict could be quietly widened.**
Accepting the two rows and then adding a third would be **accepting a different proposal**. The
ask is two relations. Two is what lands.

**The trigger that reconsiders a score row.** Not a request, and not a second producer asking. A
proposal that makes two producers' values **non-mergeable by construction** — the metric and the
scale carried in the signature, whether as a higher-arity relation (with its §4.1 projection cost
accepted on the record) or as one relation name per registered metric — and arriving with
`arg_types` at full width, per the standing ordering rule. Absent that, the answer stays no, and
a producer with a score has a conformant place to put it.

---

## 8. What is deliberately not minted

Each of these was available and each is declined, so that a later reader does not read an omission
as an oversight:

- **No `eval:score`, and no other outcome-bearing relation** — §7.
- **No inverse names.** `soc:` declares inverses (`soc:child_of`, `soc:employs`, `soc:houses`) that
  the registry has not minted, which is permitted and deliberate there. Here the `inverse` column
  is **empty for both rows**, because naming `eval:evaluates` or `eval:has_verdict` would be
  publishing vocabulary nobody asked for, under a rule that makes it permanent. An inverse is an
  ordinary future PR.
- **No entity type, no refinement enum, no media type.** A verdict needs no
  [`registry/entity-types.tsv`](../../registry/entity-types.tsv) row (that file registers only
  types carrying a refinement) and no `registry/media-types.tsv` row (koine registers only the
  media types it **mints**).
- **No new tier, plane, artifact kind, KCB verb or authority role.**
- **No spec clause moves, and no spec version moves.** Every relation this domain adds is reached
  by KGP §3.2 rule 1 reading the registry — which is the mechanism working, not a mechanism
  changing. `claim` ids already minted are untouched: no published signature is edited, and a new
  relation name mints no id that previously existed.

---

## 9. Where it lands

| Surface | Change |
|---|---|
| `registry/relations/eval.tsv` | **New** — the fourth domain file. Two rows, the columns every relation file carries, typed at every position. |
| [`registry/README.md`](../../registry/README.md) | `eval:` named alongside `cine:`, `media:` and `soc:`, with the same one-line framing, so a project can tell which domains it may load. |
| [KGP §3.2](../../specs/grounding-pack.md) | The count in its *"a position the registry does not type"* paragraph, which reads the registry's width. Value only — no clause, and **not** a version move. |
| [`ROADMAP.md`](../../ROADMAP.md) | The row that recorded the ask now records the answer. |

The count of published relation names moves from **29 to 31**, across the core file and **four**
domain files, with none blank and no position untyped.
