# Interop trial — a spec-only producer, and what the receiving side does with it

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

> **2026-09-12 — one of the eleven is closed: INT-3.** The measurement below is unchanged and
> stands as the record of the 2026-08-18 trial. What changed is the tree it measured: the relation
> registry now publishes an [`arg_types`](../../registry/README.md) column and
> [KGP 0.6.0](../../specs/grounding-pack.md) §3.2 rule 1 reads it, so C3's fork is decided and two
> of its three renderings are **non-conformant** rather than defensible. See
> [§ C3](#c3-is-an-argument-a-curie-or-a-literal-int-3-new-blocking) for what landed, and §8 for
> what that does and does not do to the other ten. **The remaining ten are open.**

**This document binds no clause.** It is the record of one trial, not a contract: where a finding
and a spec disagree the spec wins and the finding is the thing to re-check. Nothing here adds a
normative reference — RFC 3986 and the Unicode collation defaults appear below as *evidence that a
second implementer would resolve an ambiguity differently*, never as something koine delegates to,
so neither is a pin and neither belongs in
[`upstream-standards.md`](upstream-standards.md).

It exists because the
[implementability audit](implementability-audit.md) answered its hard question on paper — *a
conformant KGP producer cannot be built from the specs alone* — and a paper answer is exactly the
kind of claim this line of work is supposed to stop making. So the pack was built.

---

## 0. The honest re-scope, first

The task this trial was commissioned to perform was: **have an implementation outside this tree
exchange a pack with one inside it, and record the result.** That was not possible, and the reason
is the whole problem:

> **There is no implementation of KINP, KGP, KCB, KMI or KFT outside this tree.** Every one is the
> work of one operator. A contract exercised only by its author is a format.

So the trial was re-scoped. The scope it was re-scoped *to* is weaker, and this section states how
much weaker before anything else is claimed. Three grades of evidence are available in principle:

| Grade | What it is | Status |
|---|---|---|
| **E1** | An outside implementation and an inside one exchange a pack over a live link, and a conformance console reports the result | **unavailable** — no outside implementation exists, and no console exists either ([IMP-16](implementability-audit.md)) |
| **E2** | A clean-room implementation built from the receivable set by an engineer with no access to this tree's source | **not conducted** — no such engineer was available, and the party that ran this trial had already read the tree in order to audit it |
| **E3** | A **derivation trial**: a pack emitted from the receivable set under a discipline that makes every byte traceable, and every undetermined byte recorded with *both* of its branches computed | **this document** |

**What E3 cannot establish.** It cannot show that an independent engineer would pick the branches
recorded below, because the party running it is not independent. Any claim of the form *"an outside
implementer would have done X"* is outside what this trial can support, and none is made.

**What E3 does establish, and why it is not vacuous.** Every divergence recorded below is a
property of the **text**, not of the reader: at each fork, two readings are shown, each is traced
to the clause or artefact that supports it, and *both* resulting hashes are printed. A hash pair is
not an opinion. Anyone holding the receivable set can re-run the command beside it and get the same
two values, and the fact that they are two values rather than one is what the trial measures. The
compensating discipline for the missing independence is therefore **reproducibility**: this
document contains no assertion about implementability that is not either a computed value or a
quotation.

**What would upgrade it** is stated in §8, and the shortest item on that list is not a spec change.

---

## 1. Method

**The receivable set only** — `specs/`, `schemas/`, `registry/`, `policy/`, `scenarios/`,
`decisions/`, `docs/` — the same boundary the [audit](implementability-audit.md) §1 draws.
`ROADMAP.md`, `CLAUDE.md`, `tasks/` and `.chief/` are working state; nothing in them was allowed to
resolve a fork. Neither was any in-tree runtime, since there is no runtime in this repo to consult.

**The exchange, in two legs.**

- **Leg 1 — production.** A knowledge producer in the `analyzer` namespace (KINP §3.4's placeholder)
  emits one GroundingPack of five claims scoped to `worldsim:world:alderforest`, building **only**
  from spec text. Each emitted byte is traced to the clause that fixes it. Where no clause fixes it,
  the fork is recorded, both branches are computed, and the branch actually emitted is stated.
- **Leg 2 — consumption.** The pack is then handed to the receiving side that the receivable set
  actually supplies — `schemas/grounding-pack.schema.json` + `schemas/provenance.schema.json` for
  record admission, `registry/*.tsv` for relation resolution, `policy/license-classes.json` for
  licence admission — and each constraint is evaluated as a pass/fail assertion citing its clause.

**Every number below is reproducible.** The hash of any `HASH_INPUT` printed in this document is:

```
node -e 'const c=require("crypto");process.stdout.write("sha256-"+c.createHash("sha256").update(Buffer.from(process.argv[1],"utf8")).digest("hex")+"\n")' 'HASH_INPUT'
```

The payload was chosen to exercise the normalization surface, not to be interesting: one
domain-qualified relation, one symmetric relation, one relation with a non-entity argument, one
claim with no ambiguity in it at all, and one cross-world lineage link.

---

## 2. Leg 1 — the pack a spec-only producer emits

This is what came out. Inline comments mark every field whose *shape* was guessed rather than read.

```jsonc
{
  "kgp_version": "0.5.2",
  "pack_id": "<undefined>",                        // INT-6, INT-7: not derivable — see §4 for the computation
  "producer": "analyzer",
  "worlds":   ["worldsim:world:alderforest"],
  "kind":     "snapshot",
  "basis":    null,
  "dialect":  "grounding-only",                    // INT-10: the pack has no rules, but `located_in` is a horn-safe
                                                   //   relation. Two computations of the tier, no combining rule
  "entities": [
    { "id": "worldsim:world:alderforest:ent:npc-renaud",   // INT-5: the entity record shape is defined nowhere
      "type": "character",                                 //   KGP §2 says "id + type + attributes + external anchors";
      "attributes": [],                                    //   KINP §7 defines an assertion envelope and an asset
      "anchors": [],                                       //   envelope, and no entity envelope. Four key names, invented.
      "license": "CC-BY-4.0" },
    { "id": "worldsim:world:alderforest:ent:alder-keep", "type": "place", "attributes": [], "anchors": [], "license": "CC-BY-4.0" },
    { "id": "worldsim:world:alderforest:ent:army-of-ash", "type": "organization", "attributes": [], "anchors": [], "license": "CC-BY-4.0" }
  ],
  "assertions": [
    { "id": "sha256-7ab683a6ad765f9addf7fe195901eea1f2c0b5bc7936aa7ac18b165460ac0228", // bare, per KGP §3.1 — see §3 C6 / IMP-5
      "world":    "worldsim:world:alderforest",
      "subject":  "worldsim:world:alderforest:ent:npc-renaud",
      "relation": "located_in",
      "object":   "worldsim:world:alderforest:ent:alder-keep",
      "confidence": 0.62,
      "valid_time": { "start": "2026-01-01T00:00:00.000Z", "end": null },
      "prov": { "agent": "analyzer:agent:pipeline",   // KINP §7.1's envelope, verbatim
                "activity": "analyzer:run/1a2b",      // IMP-7: no minting rule for an activity id
                "asserted": "2026-08-18T00:00:00.000Z",
                "method": "trial@1" },
      "license": "CC-BY-4.0" }                        // INT-9: KINP §7.1 has no license field; KGP §7.1 requires one
    /* … four more, listed in §3 … */
  ],
  "links": [ /* the based_on lineage claim, §3 C5 */ ],
  "provenance": [ { "activity": "analyzer:run/1a2b", "agent": "analyzer:agent:pipeline" } ], // shape guessed: "PROV-shaped"
  "manifest": {
    "counts": { "entities": 3, "assertions": 4, "links": 1 },
    "created": "2026-08-18T09:00:00.000Z",            // INT-6: inside the pack_id, so the pack_id is a clock reading
    "license_policy": { "CC-BY-4.0": 8 }
  }
}
```

Note what is *not* here: a canonical TSV rendering. The pack could not be emitted in the encoding
KGP §4 calls canonical and the wire default, because that encoding has no column specification
anywhere in the receivable set (**IMP-1**). What is shown is the §4 JSON encoding, which is the only
one that is actually specified.

---

## 3. The forks — where the text stopped deciding

Six. Each row is two readings of the same clause set, each traced to what supports it, and each
with its computed `claim_id`. All are **claim-identity-bearing**: the divergence is not cosmetic,
it is a different content address for the same fact.

### C1 · the relation name — INT-1 (new, blocking)

KGP §3.2 rule 1 fixes the relation as "a `snake_case` name drawn from the shared **relation
registry**". The registry's own README fixes the form: domain relations are **qualified**
(`cine:shows`, `soc:parent_of`). But the only worked normalization example in the entire
specification — KGP §3.3 — hashes the relation **unqualified**:

```
world = worldsim:world:alderforest
relation = commands   (registry arity 2, order: commander, force)
```

and `registry/relations/cinematography.tsv` holds that relation as **`cine:commands`**. There is no
`commands` in any registry file. So the spec's worked example demonstrates the mechanism using a
relation name the mechanism would reject.

```
R1  copy the §3.3 example      worldsim:world:alderforest|commands(…:ent:npc-renaud,…:ent:army-of-ash)
    → sha256-b0b7f4492064de7c545ea79cca6587b82793b7680b46e2d9a7d3b9d5603d8e88
R2  resolve the registry       worldsim:world:alderforest|cine:commands(…:ent:npc-renaud,…:ent:army-of-ash)
    → sha256-f9993df20972ff4437b3189561ece6d2dbf2e52832bcf40b6684df0189412154
```

**B emitted R1** — the example is the only demonstration of the mechanism in the specification, and
an implementer follows a worked example over a README's naming convention. R1's value is the same
hash the audit computed independently for **IMP-3**, which is a useful
cross-check that both passes are hashing the same bytes.

The same defect appears in the keystone: KINP §7.1's assertion-envelope example carries
`"relation": "fought"`, and `fought` is in no registry file either. An implementer who learns the
envelope from the example learns it with an unregistered relation in it.

*Remedy:* correct both examples to registry names, or state that examples are illustrative and
non-normative on the relation. The first is one word in two places.

### C2 · symmetric-operand collation — INT-2 (sharpens IMP-4, blocking)

§3.2 rule 2 sorts the operands of a symmetric relation "ascending by their canonical CURIE string".
By what order is not said. The audit recorded this; the trial makes it concrete, because the
divergence appears on **ASCII data inside KINP §3.1's `[a-z0-9][a-z0-9._-]*` local-id charset** —
i.e. not on an exotic input, on a numbered one:

```
operands: worldsim:world:alderforest:ent:banner-9   and   …:ent:banner-100

R1  code-point order         (banner-100, banner-9)
    → sha256-0ff0bd9ca0dd5b8a90f566ac263d0f4f674b51b1a6d451a3a2bc976163c36d66
R2  numeric-aware collation  (banner-9, banner-100)   [Intl.Collator(numeric:true) — a default in
    → sha256-7050327f08bae96dd3b1a9c55b2b90c602e352f86c54b46b854abcbe2d49f407    many runtimes and databases]
```

**B emitted R1** (code-point), because it is the order a plain `sort()` gives; R2 is the order a
locale-aware comparator gives, and both are "ascending". The point IMP-4 made in principle — "the ASCII examples agree, real data does not" — turns out to
need no non-ASCII at all. Any entity family numbered past 9 diverges.

*Remedy:* KCB §7.1 rule 2's exact wording, "lexicographically by Unicode code point", copied into
§3.2 rule 2 and §2.1.

### C3 · is an argument a CURIE or a literal? — INT-3 (new, blocking)

`registry/relations/cinematography.tsv` declares `cine:says` with `arg_roles = speaker|utterance`.
§3.2 rule 3 canonicalizes **identifier** arguments and rule 5 canonicalizes **literal** arguments —
two different byte disciplines — and **the registry has no column that says which an argument
position is**. `utterance` reads naturally as either. Three renderings are defensible from the
text, one per rule:

```
R1  literal string (rule 5)   …|cine:says(…:ent:npc-renaud,"Hold the line")
    → sha256-cb0607927dda283cd3185f20caafbfa7bd135a379a862f5da10182d08fbd4272
R2  minted entity (rule 3)    …|cine:says(…:ent:npc-renaud,…:ent:utt-0001)
    → sha256-93f46a4e9dda84954e2040362ee86a9bf373e42d0c7dfd498e77292f6e3c0c90
R3  typed literal (rule 5)    …|cine:says(…:ent:npc-renaud,"Hold the line"^^xsd:string)
    → sha256-ef2bb03f67bebde0aa9bcbaeeca68e30b02087502767f4b21d25d28c21778749
```

**B emitted R1.** R2 is worse than a divergent hash: it also mints an entity, so the two producers disagree about how
many *things* exist as well as about the claim's identity. And rule 5's own trigger for R3 —
a typed literal is used "when a bare literal is ambiguous" — is a judgement, not a rule, so even two
implementers who both choose *literal* can split again.

This is a **registry** defect, not only a spec one, and it is the cheapest of the six to close: the
registry already fixes arity, order, symmetry and tier per relation, and argument *type* is the
same kind of fact.

*Remedy:* an `arg_types` column (`id|literal`, positional, parallel to `arg_roles`). Note the
ordering cost — a relation's signature is immutable once published, so adding the column is an
addition to existing rows' meaning and needs to happen before more relations land, not after.

#### CLOSED — 2026-09-12

**What landed, in two halves that are one mechanism.** The registry half:
[`registry/relations.tsv`](../../registry/relations.tsv) and all three domain files publish an
**`arg_types`** column, positional and parallel to `arg_roles`, and **all 29 published relations are
typed at every position with none left blank** — 27 rows `id|id`, and `cine:says` and `cine:reads`
`id|string`, which are exactly the two positions this section found. `scripts/check-registry.mjs`
moved with the data: the column is required, its tokens are checked against a closed vocabulary and
counted against `arity`, and a `symmetric` relation that mixes types is rejected. The spec half:
**KGP 0.6.0** §3.2 **rule 1** now fixes an argument's canonical *type* by the registry beside its
arity and order — `id` selects rule 3, and a literal token selects that branch of rule 5 — with a
MUST NOT on inferring a type from the value's syntax or from a grammar's whitespace rule. Rules 3
and 5 each name the positions they are the rule *for*, and §3.3 carries the settled worked case with
all three renderings and their hashes. The fold narrows conformance in the section every `claim` id
depends on, so it cost KGP the `ratified` status it had held since 2026-08-28 — the ordinary
model-shape rule, recorded in that spec's changelog.

**The two splits, both closed.** The first is the one measured above: R1 against R2, literal against
identifier. The registry decides it, and for `cine:says` the answer is **R1** — so R2 and R3 are now
**non-conformant renderings, not defensible ones**, and a producer that emits either has a defect
rather than a reading. The second split is the one this section noted and did not measure: rule 5's
trigger for the typed-literal form, *"when a bare literal is ambiguous"*, is a judgement, so R1 and
R3 could still diverge between two producers who **both** chose *literal*. That is why the landed
vocabulary is **wider than the `id|literal` proposed above** — `id | string | integer | decimal |
boolean | datetime`, one token per branch of rule 5 — and why §3.2 closes rule 5's `^^` form off for
a claim argument outright: once the registry names the branch, the trigger cannot arise. The width
was not free to defer. `arg_types` is part of a relation's signature, so refining a published
`literal` to `string` later would re-mint every dependent claim id, which is the same immutability
cost this finding's *Remedy* stated.

**The silence is answered too.** A producer reading a registry copy that predates the column — or a
private extension whose row is untyped — no longer meets a gap it must fill by instinct. §3.2 states
the rule: a position the registry does not type is **not canonicalizable**, so the producer
**refuses**, with no default and no fallback, and a consumer never re-derives or merges such an id.
Fail-closed is the only answer that does not re-create this finding at the next stale copy.

**The independent reproduction, recorded as corroboration.** After this trial, a **producer role**
implementing these contracts against a real export reproduced the same defect from the outside, on a
relation this trial never touched and without being pointed at this finding: its adapter, finding nothing in the registry that typed the position, fell
back to the [`csid`](implementability-audit.md) grammar's no-whitespace rule and emitted
`cine:reads(frame-9, "EXIT")` with an **entity CURIE** in argument 2, where a peer typing the same
role as a literal emitted a **string** — so two identical observations **did not merge**, and
neither side had a signal, which is the silent failure mode §6 describes. It reported the
divergence as a proposed koine change rather than forking the contract, the behaviour
[ADR-0008](../../decisions/ADR-0008-fabric-producer-adapter.md) asks for. Two properties of that
report are worth keeping. It **concentrates on single-token spans** — OCR text, sign text, short
utterances — because that is where a no-whitespace fallback fires, and that is also where this
vocabulary is densest, so the defect is worst exactly where the traffic is. And it is what raises
INT-3 from a **reading to a measurement**: §0 is explicit that this trial cannot claim *"an outside
implementer would have done X"*, and here one did. The producer is named by **role** and not by
repository or product — the rule this tree holds to everywhere, and the reason this paragraph
records a behaviour rather than a name.

**What this closure does not do.** It closes one of the six forks of §6 and one of the eleven
findings of §8. It moves no other finding, it does not re-run the trial, and it does not change the
measurement below — **1 of 5 at the hash, 0 of 5 as identifiers** remains the reading of
2026-08-18, and re-taking that number is a new trial, not an annotation.

### C4 · the claim with nothing wrong with it

```
worldsim:world:alderforest|located_in(worldsim:world:alderforest:ent:npc-renaud,worldsim:world:alderforest:ent:alder-keep)
→ sha256-7ab683a6ad765f9addf7fe195901eea1f2c0b5bc7936aa7ac18b165460ac0228
```

A core registry relation, both arguments entity CURIEs, no symmetry, no literal, no percent-encoding.
Two independent readings produce the **same** `HASH_INPUT` and the same hash. This is the control,
and it matters: the normalization mechanism is not broken, its *perimeter* is. §3 works exactly as
advertised on the case where nothing is under-specified.

It does not survive the next step, though — see C6.

### C5 · percent-triplet case — INT-4 (new, gap)

KINP §3.1 gives `<local-id>` as `[a-z0-9][a-z0-9._-]*`, "lowercase, percent-encode anything else",
and KGP §3.2 rule 3 adds "no percent-encoding beyond what the grammar requires". Neither fixes the
**case of the hex digits in a triplet**. A world producer's NPC named *Élodie* is therefore two ids:

```
R1  lowercase triplets   …|based_on(…:ent:npc-%c3%a9lodie,refkb:ent:napoleon-i)
    → sha256-fc71339644d6775b8e9071c18f3c8aa03439c6b690e8e2a1d726d637bf6eb5aa
R2  uppercase triplets   …|based_on(…:ent:npc-%C3%A9lodie,refkb:ent:napoleon-i)
    → sha256-5dfba1fa818d9339a6e34e7c4e6ddf673290c62990d92ee4f918182508700fa5
```

**B emitted R1**, which follows the "lowercase" instruction literally. R2 is what a URI normalizer produces: RFC 3986
§6.2.2.1 normalizes percent-encodings to **uppercase** hex, and treats the two as equivalent — which
is exactly the trap, because a byte discipline cannot inherit an equivalence relation from a
standard it does not cite. Any pipeline that passes an id through a URI normalizer on the way to the
hash silently switches branches.

*Remedy:* one clause in §3.2 rule 3 fixing the case. Note this interacts with **IMP-6** (no
namespace charset, no parse rule for the multi-segment world-scoped form): the same clause should
say whether percent-encoding applies to the namespace segments too.

### C6 · bare or namespaced — IMP-5, re-confirmed at the point it bites

C4 converged. Then both producers had to write the id into the envelope, and the receivable set
gives two forms — KGP §3.1's bare `sha256-…`, KINP §7.1's and the schema's `<ns>:claim:sha256-…`:

```
bare        sha256-7ab683a6ad765f9addf7fe195901eea1f2c0b5bc7936aa7ac18b165460ac0228
namespaced  analyzer:claim:sha256-7ab683a6ad765f9addf7fe195901eea1f2c0b5bc7936aa7ac18b165460ac0228
provenance.schema.json#/$defs/claimId accepts the bare form?  false   (executed)
```

Under the namespaced reading two producers that computed the identical hash still mint different
identifiers, because the namespace is theirs. The one claim in the payload that survived
normalization does not survive serialization.

---

## 4. Leg 1 — three more defects that only appear when you assemble the pack

None is about a claim. One is about the pack's first required array and two are about §2.1, and all
three were invisible to a read-through.

### INT-5 (new, blocking) · the entity record shape is defined nowhere

`entities` is a **required** array of `grounding-pack.schema.json`, and KGP §2 defines its element
by deferring: "KINP entity records (id + type + attributes + external anchors)". KINP §7 defines an
**assertion** envelope (§7.1) and an **asset** envelope (§7.2). There is no entity envelope, in §7
or anywhere else — KINP §2 establishes that an entity's identity is *minted rather than
content-addressed* and says nothing about the record that carries it.

So the four key names in the pack above — `id`, `type`, `attributes`, `anchors` — are the parenthesis
of §2 turned into JSON by the implementer, and the twin uses four different ones: `csid`,
`entityType`, `fields`, plus a required `provenance` and `license` that the parenthesis does not
mention. Neither set is derivable from the other, and §2's one substantive statement about the
record — "attributes are *assertions*, not inline scalars, so nothing escapes provenance" — is
contradicted by the twin, whose `fields` is an open object of scalars.

An implementer must therefore invent the shape of the first required array of the fabric's flagship
data structure, and every one of them will invent it differently. This is upstream of **IMP-8**
(`csid`'s `cs:` prefix): even with the id pattern fixed, there is no record for the id to sit in.

*Remedy:* a KINP §7.3 entity envelope, worked like §7.1 and §7.2 — the two that exist are the
strongest surfaces in the spec and the template is already there.

### INT-6 (new, blocking) · `pack_id` is a clock reading

§2.1 states the property outright — "two producers emitting the same knowledge emit the same
`pack_id`" — and its own formula is
`sha256(canonical(manifest ⊕ sorted(entities) ⊕ sorted(assertions) ⊕ sorted(links)))`. The manifest
is inside the hash, and §2 gives the manifest a `created` timestamp. So:

Computed over a reduced two-claim stand-in for the pack body — the specific value is not the point
and could not be, since INT-7 leaves it underdetermined; the **invariance** is, and it fails:

```
producer A, created 2026-08-18T09:00:00.000Z → sha256-fc7447329f11cab9dc9582f5d58bde1398f61d4d60438dd8db2926ee9994597c
producer B, created 2026-08-18T17:31:04.000Z → sha256-0fb2001e52081debdc9329f375f48d3ae8624ef2e9cd63beabf6566d6e62e465
identical knowledge → identical pack_id?  false   (executed)
```

The section's stated guarantee is refuted by the section's own formula, on identical inputs, with
no ambiguity involved. This one is not a fork — both readings are the same reading.

*Remedy:* exclude the manifest's non-content fields from the pack hash (or hash `counts` and
`license_policy` only), the same surgery §3.1 already performs on a claim when it excludes
`confidence` and `prov`. The instinct is already in the spec one section earlier.

### INT-7 (new, blocking) · `⊕` is undefined, and there is no §3 canonical for a non-claim

§2.1 says "each element is canonicalized per §3". §3 canonicalizes **a claim**, into
`HASH_INPUT`. It offers no canonical byte form for a manifest, an entity record, or a provenance
record — and the pack is mostly those. Nor is `⊕` defined: concatenation with what delimiter,
if any.

```
direct concatenation      → sha256-fc7447329f11cab9dc9582f5d58bde1398f61d4d60438dd8db2926ee9994597c
newline-delimited         → sha256-8e52bed1e375837f8709b9330eb8bd8003c28cedd992b9a7c9b4e99c4792bf37
```

A third defect rides along, and it is the cheapest to see: **the envelope is outside the hash**.
`kgp_version`, `producer`, `worlds`, `kind`, `basis`, `dialect` and `provenance[]` appear in no term
of the §2.1 formula. So a `snapshot` and a `delta` carrying identical records share a `pack_id`
(verified: `true`), and two deltas against *different* bases do too — which makes `basis`
unauthenticated by the very id that is supposed to make a pack tamper-evident.

*Remedy:* KCB §7.1 again — it fixes serialization, key order, escaping and trailing newline for its
own content-addressed digest, and states which keys are hashed and which are dropped **and why**.
§2.1 needs the same three sentences, plus the envelope inside the hash.

---

## 5. Leg 2 — what the receiving side did with the pack

The receiving side is what the receivable set supplies: the schemas, the registry, the policy
files. Assertions are named in KCS §5's vocabulary where one applies, and each cites the clause it
tests. **Executed, not narrated** — the regex and set operations below were run.

| # | Assertion | Clause | Result | Evidence |
|---|---|---|---|---|
| A1 | `claims_converge(C4·R1, C4·R2)` at `HASH_INPUT` | KGP §3.1–§3.3 | ✅ **pass** | identical bytes, identical hash |
| A2 | `claims_converge` at the **identifier** | KINP §7.1 / KGP §3.1 | 🔴 **fail** | bare vs namespaced (C6, IMP-5) |
| A3 | `claim_in_world(claim, world)` for all 5 | KINP §5, KGP §3.1 r4 | ✅ **pass** | world CURIE is prepended by construction; no fork found |
| A4 | `provenance_present(claim)` as the twin defines it | KGP §2, schema `$defs/provenance` | 🔴 **fail** | B emits KINP §7.1 `{agent, activity, asserted, method}`; the schema requires `{source, confidence}`. Key intersection: **0** |
| A5 | entity records admitted | schema `$defs/csid` | 🔴 **fail** | **0 of 3** entity ids match `^cs:[a-z0-9-]+:[^\s]+$` (IMP-8) |
| A6 | relations resolve in the registry | KGP §3.2 r1 | 🟡 **partial** | 4 of 5 resolve; `commands` does not exist (INT-1) |
| A7 | dialect tier correctly declared | KGP §5, `registry/README.md` | 🟡 **partial** | the pack carries **no rules**, and one of its five relations (`located_in`) is registered `horn-safe`. Two answers, no combining rule (INT-10) |
| A8 | licence admission decidable | KGP §7.1 / `policy/license-classes.json` | ⬜ **indeterminate** | the classes contradict (INT-8) |
| A9 | egress gate enforceable at construction | KGP §7.2 | ⬜ **indeterminate** | no relation-level egress class is obtainable (IMP-15); B defaulted all five to `exportable` and is conformant-by-vacuum |
| A10 | `pack_id` byte-reproducible | KGP §2.1 | 🔴 **fail** | INT-6, INT-7 |
| A11 | firewall: cross-world lineage uses `based_on`, not `same_as` | KINP §4.3, §4.5 | ✅ **pass** | §4.5's rule is a decision procedure; it decided |
| A12 | `confidence` / `prov` / `valid_time` excluded from claim identity | KGP §3.1 | ✅ **pass** | same claim at conf 0.62/agent `analyzer` and conf 0.99/agent `refkb` → identical id (executed) |

**4 pass · 4 fail · 2 partial · 2 indeterminate.**

### INT-8 (new, blocking) · the licence classes in the spec and in the policy file are different sets

A8 is indeterminate because the two artefacts an implementer would use together disagree, three
ways. Executed against `policy/license-classes.json`:

```
KGP §7.1 classes  : public-domain permissive attribution share-alike non-commercial proprietary
policy classes    : public-domain attribution share-alike proprietary personal
in §7.1, absent from the policy file : permissive, non-commercial
in the policy file, absent from §7.1 : personal
§7.1 default allowlist   : public-domain + permissive + attribution
policy default allowlist : public-domain + attribution
```

`permissive` is not a corner: it is where MIT and Apache-2.0 live in every other licence taxonomy,
and `policy/license-classes.json` files them under **`attribution`**. So a consumer implementing
§7.1's stated default admits a class the policy file does not define, and a consumer implementing
the policy file's default **rejects** Apache-2.0 records that §7.1 says to admit — including koine's
own licence. §7.1 additionally writes the filter as `license.class ∈ {…}`, a nested object, while
the record field the schema defines is a flat SPDX string; the class is a *derived* property and
the clause reads as though it rides on the record.

*Remedy:* one of the two files gives. This is a decision for the spec owner, not for an audit —
either §7.1 restates the five classes the policy file defines, or the policy file grows `permissive`
and `non-commercial` and drops or explains `personal`. Whichever way, the default allowlist must be
written once.

### INT-9 (new, gap) · the ratified envelope has no `license`, and the pack requires one

KINP §7.1's assertion envelope — ratified, and the shape every other spec points at — has no
`license` field. KGP §7.1 says "every entity/assertion record carries an SPDX `license`", and
`grounding-pack.schema.json` makes it **required**. An implementer who builds the envelope from the
keystone spec, as KINP §1 tells them to, emits assertions that the knowledge plane rejects. The
same class of drift as **IMP-17** (`source_world`), on a different field.

### INT-10 (new, gap) · the pack tier and the relation tier are computed from different things

A7 is partial because §5 defines the **pack** `dialect` by what logic a consumer must evaluate —
`grounding-only` is "ground facts + confidence; **no rules**" — while `registry/README.md` defines a
**relation's** tier as "the *lowest* tier that can carry it" and states that the tiers nest upward
only: "a `grounding-only` relation is safe in a `horn-safe` pack", and therefore not the reverse.

The trial's pack contains five ground facts and no rules whatsoever. Four of its relations are
registered `grounding-only`; `located_in` — a **core** relation, on the reading that its transitive
closure is the Horn rule it implies — is registered `horn-safe`. So:

- read as a property of the **content**, the pack is `grounding-only`: there are no rules in it;
- read as the **max over its relations**, the pack is `horn-safe`, and must be, or a consumer that
  can only evaluate the floor receives a relation the registry says is above it.

§5 states the producer's obligation ("ship the lowest tier that carries the needed content") and the
consumer's ("reject a pack whose tier exceeds what it can safely evaluate") without saying which of
the two computations produces the number. The consequence is not academic: `grounding-only` is §5's
declared **default for cross-participant transfer** and its deliberately cheap floor, and under the
second reading a single core relation lifts an ordinary factual pack off that floor.

*Remedy:* one sentence in §5 — the pack tier is the maximum over the tiers of the relations it
carries **and** the logic it contains — or an explicit statement that a rule-free pack is
`grounding-only` whatever its relations, in which case the registry's `tier` column governs rule
admission only and should say so.

---

## 6. The measurement

Five claims. One pack. The number the trial exists to produce:

| Claim | Fork in play | Converges at `HASH_INPUT`? | Converges as an **identifier**? |
|---|---|---|---|
| C1 `cine:commands(renaud, army-of-ash)` | INT-1 relation name (and IMP-3 spacing) | no | no |
| C2 `co_occurs(banner-9, banner-100)` | INT-2 collation | no | no |
| C3 `cine:says(renaud, "Hold the line")` | INT-3 argument type — **closed 2026-09-12** | no | no |
| C4 `located_in(renaud, alder-keep)` | none | **yes** | no — C6 |
| C5 `based_on(npc-Élodie, napoleon-i)` | INT-4 percent case | no | no |

> **Claim-id convergence between two spec-conformant producers: 1 of 5 at the hash, 0 of 5 as
> identifiers.**

**That number is the reading of 2026-08-18 and is not re-taken here.** One of its five forks has
since been closed — C3 / INT-3, by the registry `arg_types` column and KGP 0.6.0 §3.2 — so a trial
re-run against today's tree would converge C3 at the hash. It is left standing rather than edited,
for the reason §0 gives: a computed measurement is evidence for the tree it was taken on, and
quietly advancing it would be asserting a result nobody ran. The other four forks are open.

The one that converged did so because nothing in it was under-specified, and then lost convergence
at the identifier. That is the finding in one line: **§3's mechanism is sound and its perimeter is
not** — the same verdict [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md)
returned about KCB §7, arrived at independently on a different plane.

Six binary forks stand between two producers and a merge, and the text decides none of them. It is
tempting to write that as 1/64, and it would be false precision — the branches are not equally
likely, and a second implementer might share the author's instincts on several. What can be said
without a model is the direction: **nothing in the receivable set moves that number toward 1**, and
every fork is closed by one clause or one column.

**A silent failure, not a loud one.** Both producers emit well-formed packs. Both pass a syntactic
check. The claims that should have merged simply do not, and the deduplication that KGP §3 exists to
deliver quietly does not happen. Neither side has a signal. That is the failure mode the audit
predicted, observed.

---

## 7. The verdict, and what it is not

**Conformance verdict: NON-CONFORMANT.** A pack built faithfully from the specs is rejected by
koine's own machine-readable twin on the entity id (0 of 3 admitted) and on the provenance object
(key intersection 0), and cannot be certified on licence or egress at all.

**This is not a `Downstream results` entry**, in the sense
[`scenarios/README.md`](../../scenarios/README.md) defines — that requires a KCS document run over
real MCP/A2A connections, and this trial had no connection, no console and no second participant. It
must not be read as satisfying a ratification gate, and no spec version or status moves on it.

### INT-11 (new, gap) · KCS cannot express a static artefact check

The attempt to encode this trial as a KCS document failed, and the reason is a real gap rather than
a missing console. KCS §3's step vocabulary — `invoke` / `fetch` / `subscribe` / `resolve` / `emit`
/ `assert` — is a vocabulary of **interactions between live participants**, and §4 step 1 opens
those links before anything runs. There is no step that means *"here is an artefact; is it
conformant?"*, and no assertion in §5 ranges over a pack's own bytes: the closest,
`claims_converge`, compares two things that were *observed*, not two things that were *handed over*.

That matters beyond this trial, because it is the first check a third-party implementer needs and
the last one they can currently get. An implementer's first question is never "did my run
interoperate" — they have nobody to run against. It is **"is what I produced conformant?"**, and
KCS as ratified cannot ask it.

*Remedy:* a static-artefact step (`validate`, over a supplied pack/manifest/job against the spec
that defines it) plus the assertions that range over one — `normalizes_to(claim, hash)` is the
one this trial would have used, and it is also the missing **test vector** of IMP-2 in executable
form. Recorded against KCS, which is **ratified**, so this is a re-open candidate for its owner and
nothing more.

---

## 8. Findings

Eleven new. Grades as the [audit](implementability-audit.md) §3 defines them: **blocking** = two
implementations diverge without either detecting it; **gap** = the implementer is stopped or misled,
visibly.

| # | Grade | Where | What |
|---|---|---|---|
| **INT-1** | blocking | KGP §3.3, KINP §7.1, `registry/relations/cinematography.tsv` | The only worked normalization example hashes `commands`; the registry holds `cine:commands`. KINP's envelope example uses `fought`, registered nowhere. Two hashes computed |
| **INT-2** | blocking | KGP §3.2 r2, §2.1 | Symmetric-operand collation diverges on plain ASCII inside KINP's local-id charset (`banner-9` vs `banner-100`). Sharpens IMP-4 with a computed pair |
| **INT-3** ✅ | blocking — **CLOSED 2026-09-12** | `registry/*.tsv`, KGP §3.2 r3/r5 | No `arg_types` column: an implementer cannot tell whether an argument position takes a CURIE or a literal. Three defensible renderings of one claim, three ids. **Closed** by the `arg_types` column on all four relation files (29 relations typed, no position blank) and KGP 0.6.0 §3.2 rule 1 reading it — two of the three renderings are now non-conformant. Reproduced independently by a producer role before it closed; see [§ C3](#c3-is-an-argument-a-curie-or-a-literal-int-3-new-blocking) |
| **INT-4** | gap | KINP §3.1, KGP §3.2 r3 | Percent-triplet hex case unspecified and claim-identity-bearing; RFC 3986 normalizes the opposite way to §3.1's "lowercase" |
| **INT-5** | blocking | KGP §2, KINP §7, `grounding-pack.schema.json` | The entity record shape is defined nowhere: KGP §2 defers to a KINP entity envelope that does not exist, and prose and twin give four different key names each. The pack's first required array is unimplementable without invention |
| **INT-6** | blocking | KGP §2.1, §2 | `manifest.created` is inside the pack hash, so §2.1's stated reproducibility guarantee is refuted by §2.1's own formula. No ambiguity required |
| **INT-7** | blocking | KGP §2.1 | `⊕` undefined; §3 supplies no canonical for a manifest, entity or provenance record; and the whole envelope (`kind`, `basis`, `worlds`, `dialect`, `producer`) is outside the hash, so a snapshot and a delta collide |
| **INT-8** | blocking | KGP §7.1 vs `policy/license-classes.json` | Three contradictions: `permissive`/`non-commercial` absent from the policy file, `personal` absent from the spec, and two different default allowlists. Apache-2.0 admission differs by artefact |
| **INT-9** | gap | KINP §7.1 vs KGP §7.1 + `grounding-pack.schema.json` | The ratified assertion envelope has no `license`; the pack requires one on every record |
| **INT-10** | gap | KGP §5 vs `registry/README.md` | The pack `dialect` is defined by the logic a pack contains and a relation's tier by what the relation needs; no rule says how to combine them. A rule-free pack using one `horn-safe` core relation has two defensible tiers |
| **INT-11** | gap | KCS §3, §5 | No step and no assertion expresses a static artefact conformance check — the first verdict a third-party implementer needs |

**Audit findings this trial re-executed**, with what was observed:

| Audit finding | Observed here |
|---|---|
| **IMP-1** (canonical TSV undefined) | confirmed — the pack could not be emitted in the canonical encoding at all; §2 is the JSON encoding |
| **IMP-3** (`HASH_INPUT` spacing) | confirmed, and the audit's hash reproduced independently (`sha256-b0b7f449…`) |
| **IMP-4** (no collation named) | confirmed and sharpened → INT-2 |
| **IMP-5** (bare vs namespaced claim id) | confirmed at the point it bites: it is what cost C4 its convergence |
| **IMP-7** (no activity-id minting rule) — **closed 2026-09-12** by KINP 0.5.0 §3.1 | confirmed — `analyzer:run/1a2b` was copied from an example because there is no rule |
| **IMP-8** (`csid`'s literal `cs:`) | confirmed — 0 of 3 spec-faithful entity ids admitted |
| **IMP-9** (two provenance envelopes) | confirmed — key intersection 0 |
| **IMP-11** (no knowledge-plane fixture) | confirmed, and this trial did not close it: the pack above **cannot** be checked in under `schemas/fixtures/` because it fails `grounding-pack.schema.json`, which is IMP-8 and IMP-9 restated as a build error |
| **IMP-15** (egress class has no registry column) | confirmed — A9 is conformant-by-vacuum |
| **IMP-16** (no runnable conformance suite) | confirmed, and extended: the gap is not only the console. See INT-11 |

**Nothing here was scheduled, and nothing here was fixed *by this trial*.** Every one of the eleven
is normative — each moves a spec version, a registry column, or a policy file — and this document
does not decide questions that belong to the spec owner. That is the same discipline the audit held
to, and for the same reason: a trial that quietly edits the thing it is measuring has measured its
own edit.

**One has since been fixed elsewhere, which is the discipline working rather than an exception to
it.** INT-3 was closed on 2026-09-12 by the spec and registry owner, in the registry and in KGP
§3.2, and this document records the closure *after* the fact instead of performing it — the row
above is annotated, the C3 measurement is untouched, and §6's number is left as taken. **Ten remain
open**, and none of them is scheduled here either.

---

## 9. What would upgrade this evidence

In order of how much they buy, cheapest first:

1. **A test vector in KGP §3.3** (IMP-2). Two or three claims with expected hex. It converts every
   fork above from an argument into a check an outside implementer runs in five minutes, and it is a
   table.
2. **The six forks closed** — one clause each, and four of the six are already written down
   elsewhere in the fabric (KCB §7.1's collation and serialization discipline; the registry's own
   qualification rule). **One is done: C3 / INT-3**, closed 2026-09-12 by one registry column and
   one clause, which is the size this item predicted. **Five remain.**
3. **A static-artefact check in KCS** (INT-11), which is what turns "here is my pack" into a verdict
   without requiring a second party to exist.
4. **A clean-room build (E2)** by an engineer with no access to this tree — which becomes worth
   commissioning once 1–3 land, because before then it would only rediscover this list.
5. **E1**, the real thing.

The trial's own conclusion about its scope: **E3 was worth running, and it is not a substitute for
E1.** It found eleven defects that a read-through did not, every one of them by assembling an artefact rather
than by reading about one, and two of them (INT-6, INT-7) contradict a guarantee the spec states in
plain text. But it cannot tell anyone whether the specs are *adoptable*, because adoption is a fact
about other people, and this trial contains none.

---

## Changelog

- **2026-09-12** — **INT-3 closed**, and nothing else about this trial changed. The relation
  registry gained an `arg_types` column — positional, parallel to `arg_roles`, all 29 published
  relations typed at every position — and **KGP 0.6.0** §3.2 rule 1 now reads it, so which of rule 3
  and rule 5 applies to a claim argument is a registry fact rather than a producer's choice; rule
  5's `^^` form is closed off for a claim argument, and a position the registry does not type is not
  canonicalizable (refuse; no default, no fallback). The landed vocabulary is **wider** than the
  `id|literal` this document proposed — `id | string | integer | decimal | boolean | datetime` —
  because the narrow form leaves C3's *second* split open and a signature cannot be refined in
  place. § C3 gains a `CLOSED` subsection with the independent outside reproduction recorded as
  corroboration (a producer role, by role only); §6's C3 row and §8's findings row are annotated.
  **The measurement is not re-taken**: 1 of 5 at the hash and 0 of 5 as identifiers stands as the
  reading of 2026-08-18. Ten findings remain open.

- **2026-08-18** — First trial. Re-scoped from E1 to E3 with the loss of evidential value stated in
  §0. Eleven new findings INT-1…INT-11, ten audit findings re-executed. Measurement: claim-id
  convergence **1 of 5** at the hash, **0 of 5** as identifiers. Verdict **NON-CONFORMANT**, and
  explicitly not a `Downstream results` entry. No spec, schema, registry or policy file changed.
