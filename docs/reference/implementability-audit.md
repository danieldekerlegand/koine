# Implementability audit — what a third party receives, and what they cannot build from it

> **Status:** Current · **Updated:** 2026-08-18 · **Owner:** koine · **Informative**

**This document binds no clause.** It is a record of an audit, not a contract: every finding below
is a statement about the *receivable artefacts*, and where a finding and a spec disagree the spec
wins and the finding is the thing to re-check. It exists because the specs have only ever been
implemented inside the tree that authored them, and a contract exercised only by its author is a
format rather than a standard. The question the audit asks is therefore narrow and mechanical:
**hand the artefacts to a competent engineer who has never seen this tree — what can they build,
and where must they guess?**

Guessing is the failure mode that matters. A gap that stops an implementer is cheap: they ask.
A gap that lets two implementers each make a reasonable, *different* choice is what produces two
conformant-looking implementations that do not interoperate — and every finding graded **blocking**
below is of that second kind.

---

## 1. The receivable set

An implementer receives this repository and nothing else. That set is:

| Artefact | What it is | Count |
|---|---|---|
| [`../../specs/`](../../specs/) | the six normative prose contracts — KINP, KGP, KCB, KMI, KCS, KFT | 6 specs + a README |
| [`../../schemas/`](../../schemas/) | the machine-readable twin (JSON Schema draft-2020-12) | 9 schemas, 3 fixtures |
| [`../../registry/`](../../registry/) | the shared vocabularies — relations (core + 3 domains), entity types, media types, enums | 7 TSV files |
| [`../../policy/`](../../policy/) | licence-class and trust-tier policy data | 2 JSON files |
| [`../../scenarios/`](../../scenarios/) | the pressure tests — **prose walkthroughs, not runnable documents** | 7 Markdown files |
| [`../../decisions/`](../../decisions/) | the agnostic ADRs (0001, 0005–0011) | 8 ADRs |
| [`../../docs/`](../README.md) | guides, reference (including the upstream pin table), explanation | this map |

**What is named in the receivable set but is not in it.** Each of these is a pointer a third party
cannot follow. None is a broken *link* — the repo is careful never to link out — but each is a claim
whose support is unavailable:

- **ADR-0002 / 0003 / 0004** — cited as text in [`../../specs/grounding-pack.md`](../../specs/grounding-pack.md)
  §7.1, §7.2 and its changelog as the provenance of the licence-class policy and the `local-only`
  egress class. Deliberately held in the operator's private integration repo
  ([`../../decisions/README.md`](../../decisions/README.md)).
- **A producer-side `predicate-mapping.json`** — named in KGP §5 and §7.2 as the origin of the
  egress class and as where a relation's egress class is *actually declared*. See **IMP-15**.
- **The operator's node/edge ontology and bridge mappings** — named in
  [`../../registry/README.md`](../../registry/README.md) as the home of instance data.
- **`agora` tasklists** — `agora chief/75`, `chief/76` (the ids `chief/62` / `chief/63` named before
  koine's markers were superseded), `agora:72-kcb-extension-uri-migration`,
  cited in [`../../specs/README.md`](../../specs/README.md) and
  [`../../specs/capability-bus.md`](../../specs/capability-bus.md) as where obligations are
  discharged. A third party can read the obligation and cannot observe its discharge.

That boundary is a deliberate and correct one — instance data does not belong here. It is recorded
because it bounds what an outside implementer can verify, and two findings below (**IMP-14**,
**IMP-15**) are cases where a *normative* obligation resolves across it.

---

## 2. Method

Three passes, in this order:

1. **Read the keystone and the data plane as an implementer** — KINP §3/§4/§6/§7/§8 and KGP
   §2/§3/§4/§5/§7 read straight through, writing down every point at which a decision had to be
   made that the text did not make. The other four specs were then read for the same failure class
   rather than end to end.
2. **Cross-check the twin against the prose** — every `$defs` pattern in
   [`../../schemas/provenance.schema.json`](../../schemas/provenance.schema.json) evaluated against
   the identifiers the specs' own worked examples use, and every required key of
   [`../../schemas/grounding-pack.schema.json`](../../schemas/grounding-pack.schema.json) checked
   against the envelope KINP §7.1 and KGP §2 define.
3. **Mechanically verify each candidate** before recording it. Regex claims were executed, not
   eyeballed; the two hash values under **IMP-3** were computed. A finding that could not be
   demonstrated from the receivable set alone was dropped.

The audit was run against the artefacts, **not** against the repo as a whole: `ROADMAP.md`,
`CLAUDE.md`, `tasks/`, and `.chief/` are working state, and nothing in them was allowed to close a
gap. Where they explain a gap, that is noted — an explanation is not a discharge.

---

## 3. Findings

Nineteen findings, graded. **Blocking** = an outside implementation will diverge from an inside one
without either side detecting it. **Gap** = the implementer is stopped or misled, but the failure is
visible. **Fixed** = closed in this pass.

### 3.1 The canonical encoding does not exist (blocking)

**IMP-1 · blocking · KGP §4.** KGP declares **TSV canonical** — "the wire default between
participants" — and requires that every other encoding "MUST round-trip losslessly back to it". The
whole of the specification of that encoding is one table cell naming five filenames: `entities.tsv`,
`assertions.tsv`, `links.tsv`, `provenance.tsv`, `manifest.json`. There is **no column set, no
column order, no header rule, no escaping rule for tabs/newlines/empty cells, and no example** —
that string is the only occurrence of any of those four filenames anywhere in the receivable set,
and `schemas/fixtures/` contains no pack.

An implementer therefore cannot emit or read the canonical form at all, which also makes the
round-trip obligation on the JSON, Prolog, Datalog, ProbLog, Neo4j and RDF-star encodings
unverifiable — they must round-trip to something undefined. The JSON encoding is fully specified
(§2 plus the schema), so the practical effect is that **the canonical and the specified encodings
are different encodings**.

*Remedy:* a §4.2 column specification for the four TSVs plus one golden pack under
`schemas/fixtures/`. Until then, treat the JSON encoding of §2 as the interchange form and say so.

### 3.2 Claim identity is not byte-reproducible from the text (blocking)

§3 is the load-bearing clause of the entire fabric: cross-producer dedup works *only* if two
independent producers reduce a claim to the identical byte string. Four defects stand between the
text and that property.

**IMP-2 · blocking · KGP §3.3.** **There is no test vector.** Nowhere in the receivable set is there
a single pair of (claim, expected `claim_id`). §3.3 walks the convergence argument and prints no
hash. An implementer has nothing to check their implementation against, and — this is the point —
neither does a *second* implementer, so the two discover their disagreement only when a merge that
should have happened silently does not. A content-addressing spec without a test vector is not
falsifiable by the party who most needs to falsify it.

**IMP-3 · blocking · KGP §3.1, §3.2 rule 6.** The exact bytes of `HASH_INPUT` are under-specified
for the multi-argument case. §3.1 gives the grammar as
`world · "|" · relation · "(" · arg1 · "," · arg2 · … · ")"`, and rule 6 defines the whitespace
discipline by reference — "the separators above are the only permitted spacing" — but the one worked
example (§3.3) is **line-wrapped with continuation indentation**, so the only rendering of a real
`HASH_INPUT` a reader ever sees contains whitespace the rule forbids. The cost of guessing wrong is
total: for the §3.3 claim,

```
no space after the comma  → sha256-b0b7f4492064de7c545ea79cca6587b82793b7680b46e2d9a7d3b9d5603d8e88
one space after the comma → sha256-1440e38671eb9bdebb237255ad52358663b8cd45f6dc5e50fb5f7f01a1ace79d
```

Two producers, both conformant on a plain reading, never merge a single claim.

**IMP-4 · blocking · KGP §3.2 rule 2, §2.1.** **No collation is named.** Symmetric operands are
"sorted ascending by their canonical CURIE string" (§3.2 rule 2) and a pack's element lists are
"sorted by element id" (§2.1) — neither says by what. Codepoint order, UTF-8 byte order and any
locale-aware order agree on the ASCII examples in the spec and disagree on real data, and §2.1's
claim that "two producers emitting the same knowledge emit the same `pack_id`" is exactly what the
disagreement breaks. The fabric already contains the correct wording: KCB §7.1 rule 2 sorts
"lexicographically by Unicode code point" and rule 3 fixes serialization, key order, escaping and
trailing newline. KGP §3 predates it and never received it.

**IMP-5 · blocking · KGP §3.1 vs KINP §3.2/§7.1 vs the schema.** **Is a `claim` id bare or
namespaced?** Three receivable artefacts give two answers:

| Artefact | Form |
|---|---|
| KGP §3.1 | `claim_id := "sha256-" · lowerhex(…)` — **bare** |
| KINP §3.2, §7.1 (`"id": "analyzer:claim:sha256-9f3c…"`) | `<ns>:claim:sha256-<hex>` — **namespaced** |
| `provenance.schema.json#/$defs/claimId` | `^[a-z][a-z0-9-]*:claim:sha256-[0-9a-f]{64}$` — **namespaced**, and it *rejects* the bare form (verified) |
| KCB §7.1 | reads "the KINP §3 form" as `sha256-<lowercase hex>` — **bare** |

This is not cosmetic. Under the namespaced reading, two producers that correctly compute the
identical hash still mint **different identifiers** for the same claim, because the namespace they
prefix is their own — which defeats §3.3's convergence result, the property §3 exists to deliver.
Under the bare reading, a claim id is the one KINP identifier with no minting authority in it, which
KINP §3.4 says is the point of the namespace segment. One of the two has to give, and the specs do
not say which.

### 3.3 The identifier grammar does not cover the identifiers in use (gap)

**IMP-6 · gap, claim-identity-bearing · KINP §3.1–§3.4.** The CURIE is defined as
`<namespace>:<kind>:<local-id>` with a charset for `<local-id>` and **none for `<namespace>`**.
World-scoped ids are multi-segment — `worldsim:world:alderforest:ent:npc-renaud`, used throughout
KINP §4.3, KGP §3.3 and KMI §2 — because §3.4 says "entities within a world use that world as their
namespace". So a namespace may itself contain `:`, and nothing states how to parse the result. A
rule is *derivable* (kinds are a closed set and `<local-id>` excludes `:`, so scan from the right),
but derivable is not specified, and the IRI expansion of a namespace containing `:` — into a path
segment of `https://id.<root>/<kind>/<namespace>/<local-id>` — is not stated at all. This is
claim-identity-bearing: §3.2 rule 3 requires the canonical CURIE inside `HASH_INPUT`.

**IMP-7 · gap · KINP §3.1 vs KINP §7.1, KMI §2, KFT §3/§5/§6, the schema.** Three identifier forms
in active use fall outside §3.1's closed kind enum (`ent | claim | asset | world | agent | src`):

- `analyzer:run/1a2b` — KINP §7.1 `prov.activity` and KMI §2 `produced_by`. No kind segment; `/` is
  not in the `<local-id>` charset. §3.4 mentions the form once in a table note.
- `orchestrator:activity:ft-run/9f2a` — KFT §3.1, §5, §6. Kind `activity` is not in the enum.
- `cs:language:Q1860` — `provenance.schema.json#/$defs/csid`. Kind `language` is not in the enum
  (see **IMP-8**).

Meanwhile `src` **is** in the enum and is never used as a kind anywhere in the receivable set. An
implementer has no stated rule for minting the activity id that every `prov` record requires.

### 3.4 The machine-readable twin contradicts the prose (blocking)

**IMP-8 · blocking · `provenance.schema.json#/$defs/csid`.** The entity-id `$def` is
`^cs:[a-z0-9-]+:[^\s]+$` — a **literal `cs:` prefix**, described as "structurally the KINP entity
CURIE". It is not: `cs` is a namespace registered nowhere in KINP §3.4, and the second segment in
its own example (`cs:language:Q1860`) is not a KINP kind. Verified against the specs' own examples:

```
refkb:ent:napoleon-i                        csid: false
worldsim:world:alderforest:ent:npc-renaud   csid: false
analyzer:local:ent:e-8842                   csid: false
cs:language:Q1860                           csid: true
```

Because `grounding-pack.schema.json` requires `csid` on every entity record, **no KINP-conformant
GroundingPack validates against koine's own pack schema.** This is the clearest single instance of
the thing this audit was commissioned to find: one deployment's internal id scheme, hard-coded into
a role-scoped artefact that downstream repos vendor by drift-gated copy.

**IMP-9 · blocking · `provenance.schema.json#/$defs/provenance`.** The shared provenance `$def` is
`{source, source_url, retrieved_at, confidence}`, carrying the instruction "Field names are
contractual … Do not rename." KINP §7.1's `prov` — the envelope every spec references — is
`{agent, activity, asserted, method}`. They share no field. `grounding-pack.schema.json` **requires**
the key `provenance` on every entity and assertion record, so a producer that faithfully implements
KINP §7.1 emits `prov` and fails validation, and a producer that satisfies the schema has discarded
the PROV shape §2 says the bundle carries. Two different provenance envelopes ship inside one
bundle definition.

**IMP-10 · gap · `provenance.schema.json#/$defs/assetId`.** `^sha256:[0-9a-f]{64}$` — colon
separator, SHA-256 only — against KINP §6/§7.2 and KMI §2, which mint
`<ns>:asset:blake3-<hex>` and explicitly permit `blake3-` for large bytes. Neither of the specs'
asset-id examples validates (verified).

**IMP-11 · gap · `schemas/fixtures/`.** Three golden-positive fixtures exist — finetune-job,
media-timeline, participant-self-description — and **none for the knowledge plane**: no
GroundingPack, no assertion envelope, no entity record. `check-schemas.mjs` additionally does not
validate fixtures against their schemas by design (that is a validator's job, downstream per
[ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)), so the three that exist are unchecked
within the receivable set. An outside implementer has no worked instance of the fabric's flagship
data structure.

**IMP-12 · fixed · `participant-self-description.schema.json`.** The `identity.kinds` description
listed "entity, asset, activity, world, agent, model" as KINP kinds; four of the six are not
(`entity` vs `ent`, `activity` and `model` are not kinds at all — `model` is a registered *entity
type*). Corrected to §3.1's enum. Description-only; no validation behaviour changes.

### 3.5 Normative term IRIs on a domain that cannot exist (gap)

**IMP-13 · gap · KGP §4.1, all nine schemas.** The §4.1 annotation vocabulary is **normative** — "a
producer … MUST use them, and a consumer MUST read them" — and mints its terms under
`kgp: https://koine.ecosystem/ns/kgp#`. `.ecosystem` is not a delegated TLD, so those IRIs cannot
resolve, no `@context` can ever be published at them for the JSON-LD wire form §4.1 names, and the
namespace is not under an authority that could grant it. The same base is the `$id` of all nine
schemas and is hard-coded in `scripts/check-schemas.mjs`.

The fabric has already decided this exact question the other way and did not carry the decision
across: KCB 0.4.1 moved its extension URI to `https://w3id.org/koine/kcb/manifest/0.3` **because**
the private hostname was verified unregistered and therefore squattable
([`../../specs/capability-bus.md`](../../specs/capability-bus.md) §2.3), and gave itself a
dual-accept window to do it. `koine.ecosystem` is strictly worse than the hostname that move
retired — that one could at least be registered.

*Remedy:* the same migration, with the same dual-accept discipline. Note the ordering cost: §4.1's
terms are declared "immutable once ratified", so moving them is cheap **now** and expensive after
KGP ratifies.

### 3.6 A normative obligation that resolves outside the receivable set (blocking)

**IMP-14 · partly fixed · KGP §7.1, §7.2.** The licence-class policy and the `local-only` egress
class are attributed to **ADR-0002** and to a producer-side `predicate-mapping.json`, neither of
which a third party receives. These are rationale rather than clauses, and the repo cites them as
text by design; recorded because an implementer cannot check the provenance of two normative
sections. §7.2 additionally pointed at `20-shared-relation-registry` US-SRR2 — a tasklist id that
exists nowhere in this tree, in any form. **Fixed:** that pointer now names
[`../../registry/README.md`](../../registry/README.md), where the reconciliation of the two axes is
actually recorded. The ADR-0002 citations stand as a known gap.

**IMP-15 · blocking · KGP §7.2 vs `registry/README.md`.** KGP §7.2 is normative and states that the
egress class is "carried on relations (via the shared registry)". The shared registry has no such
column, and its README says so explicitly — "There is no `egress` column … it is declared per entry
on that deployment's own bridge mapping". So the mechanism by which an implementer learns that a
relation is `local-only` is (a) named by a MUST-bearing clause, (b) absent from the artefact that
clause points at, and (c) resolved by an artefact the implementer will never receive. The result is
that the fabric's one hard boundary gate — "MUST NOT emit into any pack that crosses a project
boundary" — is unenforceable by an outside producer, which will treat every relation as the
`exportable` default and be conformant-by-vacuum.

*Remedy:* either add the `egress` column to the shared registry, or restate §7.2 so the class is
carried on **records** only (which is what `provenance.schema.json#/$defs/egress` already does) and
delete the registry half of the clause.

### 3.7 The conformance suite is not yet an artefact (gap)

**IMP-16 · gap · `scenarios/`, KCS.** What a third party receives as "the conformance suite" is one
ratified *format* spec (KCS 0.2.0) and seven **prose** pressure tests. There is no runnable KCS
document in the tree — `scenarios/` is Markdown only — and no `fixtures/` directory for the
`standin` sources KCS §2 provides for. [`../../specs/README.md`](../../specs/README.md) states this
plainly and makes it the ratification gate, so this is a known and owned condition rather than a
discovery. It is recorded here for one reason: **an outside implementer today cannot obtain a
conformance verdict on their implementation by any means the receivable set provides.** Every
statement about their conformance would be a hand-walk by the spec author — which is the evidential
position this whole line of work exists to leave.

### 3.8 Cross-spec drift a single-spec reader gets wrong (gap)

**IMP-17 · gap · KINP §7.2 vs KMI §2.** KINP — *ratified*, and the keystone every other spec tells
you to read first — says `source_world` is "**REQUIRED at ingest**" with no carve-out. KMI §2
(delta H) narrows it: required only for ingested assets that *depict* a world, `null` for generated
ones. An implementer building the identity plane before the media plane implements the ratified
rule and rejects every generated asset.

**IMP-18 · gap · KINP §7.1 vs KGP §4.1.** `embedding_model` is REQUIRED-when-`embedding`-is-present
(KINP §7.1) and its value is shown as `"…"`. The only place its value space is fixed is the
**optional** RDF projection table (KGP §4.1: "the KINP canonical IRI of the model entity"). A
producer that never emits the projection — the expected case, since §4.1 is optional and the
`grounding-only` floor is deliberately below it — has no stated value space for a required field,
and will emit a bare model name.

**IMP-19 · fixed · KGP §2.** The worked envelope declared `"kgp_version": "0.1.0"` against a 0.5.2
spec. Corrected.

---

## 4. The hard question

> **Could a competent engineer implement KINP resolution and a KGP GroundingPack producer from the
> specs alone?**

### 4.1 A KGP GroundingPack producer — **no**

They can build something pack-shaped in a day. They cannot build a **conformant** one, and the
distinction is the entire value of the contract. Three independent blockers, any one of which is
sufficient:

1. **The canonical encoding is undefined** (IMP-1). They cannot write the file format the spec calls
   canonical and the wire default. Whatever they emit, the round-trip obligation on every other
   encoding is untestable.
2. **Claim ids will not converge** (IMP-2 → IMP-5). The one property KGP exists to deliver requires
   four decisions the text does not make — exact separator bytes, collation, whether the id is
   namespaced, and what to check the result against. They will make all four, reasonably, and a
   producer inside this tree will have made at least one of them differently. **The failure is
   silent**: both sides emit well-formed packs, and claims that should merge simply do not.
3. **Their output fails koine's own schema** (IMP-8, IMP-9). A spec-faithful pack is rejected by
   `grounding-pack.schema.json`, on the entity id and on the provenance object. Their only ways
   forward are to disbelieve the schema or to disbelieve the spec, and nothing in the receivable set
   tells them which.

**What is missing, precisely** — the shortest path to yes:

| # | Missing | Cost |
|---|---|---|
| 1 | A column specification for the four canonical TSVs | one subsection |
| 2 | Two or three claim-id **test vectors** with expected hex — a world-scoped claim, a symmetric relation, a typed literal | a table in §3.3 |
| 3 | The `HASH_INPUT` byte string shown **unwrapped**, once | one line |
| 4 | A named collation, and the §2.1 sort defined — KCB §7.1's wording, reused verbatim | two clauses |
| 5 | A decision on IMP-5, bare or namespaced, restated in all three artefacts | one decision |
| 6 | One golden pack fixture | one file |
| 7 | `csid` and the provenance `$def` reconciled with KINP §7.1 | a schema change, breaking downstream |

Items 1–6 are small and mechanical. Item 7 is a real break in an artefact that downstream repos
vendor, and is the reason the schema half of this cannot be a drive-by fix.

### 4.2 KINP resolution — **partially**

The conceptual core is genuinely implementable and is the strongest prose in the tree. §4.1's
never-merge-destructively rule, §4.2's equivalence layer, §4.3's `same_as`/`based_on` firewall,
§4.5's normative relation-choice rule and §6's offline-first minting are unambiguous, and an
engineer will build them correctly from the text. What they cannot do:

- **Parse or mint identifiers unambiguously** (IMP-6, IMP-7). No namespace grammar, no parse rule for
  the multi-segment world-scoped form, no IRI expansion for it, and no form at all for the activity
  ids every `prov` record carries.
- **Interoperate on the resolver API** (§8). The five operations are five signatures in a code fence:
  no wire binding, no request/response shapes, no error model, no pagination on
  `same_as_closure[]` or `query`, and no statement of which are required of which role. KCS §3's
  `resolve` step and KCB assume the surface is callable, so an implementer must invent a binding —
  and any two will invent different ones. §8 says "deliberately small", which is a virtue for the
  *operation set* and does not extend to leaving the operations unbound.
- **Resolve world inheritance** (§5). Worlds "inherit from parents unless overridden" and inheritance
  policy is "per-world metadata" — with no metadata field defined, no override-resolution rule (what
  beats what when a child and a parent disagree), and no statement of how a child *retracts* an
  inherited fact given that claims are immutable and retraction is additive (§4.2). Two
  implementations will compute different answers to the same query against the same data, which is
  the §5 analogue of the §3 convergence failure.

**Verdict:** an implementer will produce a correct *model* of KINP and an idiosyncratic
*implementation* of it. That is enough to build a participant; it is not enough for two participants
built independently to talk.

**This answer was subsequently tested by building the pack.** The
[interop trial](interop-trial.md) emitted a five-claim GroundingPack from the receivable set alone
and handed it to the schemas, the registry and the policy files. It confirms ten of the findings
above and adds eleven that only appear when an artefact is assembled — including two cases (INT-6,
INT-7) where KGP §2.1 refutes its own stated reproducibility guarantee with no ambiguity involved.
Measured claim-id convergence between two spec-conformant producers: **1 of 5** at the hash, **0 of
5** as identifiers.

---

## 5. What is not a gap

Stated so the audit is not read as a verdict on the whole:

- **KCB §7.1 is the model the rest of the fabric should follow.** It fixes a content-addressed
  digest with the exact discipline KGP §3 lacks — which keys are hashed, which are dropped and why,
  code-point collation, key ordering, whitespace, escaping, algorithm prefix — and then states what
  the digest *proves* versus what the version *claims*. An implementer can produce a byte-identical
  `schema_id` from that text alone. Findings IMP-3 and IMP-4 are literally "apply §7.1's wording to
  §3", and the fact that the fabric already contains the fix is the reason those two are cheap.
- **KFT §3.3 is the strongest implementable surface in the tree.** A field-by-field mapping onto four
  named external targets with three dispositions per field, an exhaustive set that MUST be refused
  rather than silently dropped, and a round-trip as the conformance criterion. It tells an outside
  implementer exactly what to build and exactly when to refuse.
- **The role-scoping holds.** No spec, schema title, `$id` or description names a product; the
  placeholder namespaces are consistent across all six specs and the schemas. The one leak found in
  the whole receivable set is `csid`'s `cs:` prefix (IMP-8) — a real one, but an isolated one.
- **§7's filter axes are crisply separated.** Dialect, egress, trust and licence are four axes with
  four homes, stated repeatedly and never conflated, and `provenance.schema.json` carries all four
  correctly. An implementer will get the filtering model right.

---

## 6. Changed in this pass

Three findings were closed; the other sixteen are recorded above as known gaps and are **not
scheduled** — nothing here creates work, and the audit deliberately does not decide questions
(IMP-5's bare-or-namespaced, IMP-15's registry-or-record) that belong to the spec owner and would
move a version.

| Finding | Change |
|---|---|
| IMP-14 (partial) | KGP §7.2's pointer to a non-existent tasklist id now names `registry/README.md` |
| IMP-19 | KGP §2's worked envelope declares a `kgp_version` that exists |
| IMP-12 | `participant-self-description.schema.json`'s `identity.kinds` example names KINP kinds |

All three are editorial or description-only: no clause, no field, no pattern and no `claim` id moves,
and no spec version or status changes.

---

## Changelog

- **2026-08-18** — Cross-referenced the [interop trial](interop-trial.md), which tested §4's answer
  by emitting a pack. No finding above changed: the trial confirms ten of them and opens nine of its
  own under its own INT-n series.
- **2026-08-18** — First audit. Nineteen findings against the receivable set; three closed, sixteen
  recorded. The hard question answered explicitly in §4: **no** for a conformant KGP producer,
  **partially** for KINP resolution, with the missing pieces enumerated.
