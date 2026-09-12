# KGP §4.1 round-trip gate — what the downstream artifact actually delivers

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

> **2026-09-12 — this record stands, and KGP no longer does.** KGP 0.6.0 folded INT-3 into §3.2 and
> the model-shape rule returned the spec to `candidate`. That does **not** touch this gate: §4 and
> §4.1 are byte-unchanged at 0.6.0, so the artifact read below still discharges exactly what it
> discharged, and the fold's own count is elsewhere — the gating *scenario* and its encoding, which
> predate the fold. See the KGP changelog and
> [`promotability.md`](promotability.md).

**This document binds no clause.** It is the record of one verification, not a contract. Where it
and [`../../specs/grounding-pack.md`](../../specs/grounding-pack.md) disagree, the spec wins and
this record is the thing to re-check.

It exists because KGP 0.5.2 was believed promotable. Its §4.1 names exactly one gate, that gate was
assigned downstream under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), and the
downstream tasklist closed with every story reading `passes: true`. On the strength of that, koine
retired its own tracking marker on 2026-08-22 as *"the downstream half shipped."* Reading the
artifact on **2026-08-26** found that claim false: the emitter had landed and **no reader existed**,
so rule 2 had never run. That reading is §6 below, kept because it is the reason this document is
read against the code rather than against a flag.

**This is the second reading, taken 2026-08-28 against a new artifact, and its verdict is that all
four obligations are now met.** The reader exists, rule 2 re-derives from the graph and rejects on
disagreement, the corpus is four packs across three encodings, and a perturbed projection is refused
— checked here by perturbing eight of them by hand, not by reading the test names. §2 and §3 are
re-taken; §4 states what it means for the spec; §5 is how to re-run it.

---

## 1. What the gate requires

§4.1's closing paragraph states it in one sentence:

> a fixture that takes a canonical pack, emits the RDF-star / PROV / JSON-LD projection, **reads it
> back**, and shows the **recovered canonical re-derives the same `claim` ids** (rule 2).

Four obligations, and the fixture is the conjunction of all four:

| # | Obligation | Source |
|---|---|---|
| G1 | Emit the RDF-star / PROV / JSON-LD projection of a canonical pack, per §4.1's mapping and annotation vocabulary | §4.1 tables |
| G2 | **Read that projection back** to a canonical pack | §4.1 rule 1 — *MUST round-trip losslessly back to the canonical pack for every claim it projects* |
| G3 | **Re-derive** the `claim` id per §3 from the recovered canonical and **reject** any claim whose `kgp:claimId` annotation disagrees | §4.1 rule 2 |
| G4 | What the projection declines to project appears in a **report** — *complete or reported*, never silently lossy | §4.1 rule 1, and the arity>2 row of the mapping table |

G3 is the load-bearing one. The `claim` id travels as an annotation and is **not** recomputed from
the graph, so a projection that carries the id but cannot be parsed back proves nothing about
losslessness: the id is just a string that rode along. The corollary, which is what makes G3
checkable at all: a rule-2 checker that has only ever seen conformant input is an untripped wire.
The check is whether a **perturbed** projection is refused.

## 2. What was delivered

Read at `agora` **`af5b7dd3a1201eff70067f45e7824614a81769ac`** — the merge of
`chief/84-kgp-projection-reader-and-roundtrip`, 2026-08-28. That repo's `main` is one commit ahead
(`f48f9e0`, the retire commit, which touches only `tasks/chief/84-….json`); `git diff af5b7dd HEAD
-- knowledge/ Makefile` is **empty**, so the tree read below is the tree at `main`.

The merge touches 26 files; 11 of them are the gate. The other 15 are an unrelated KFT 0.7.0 adoption
carried on the same branch (`824e3a7`, `schemas/` · `trainer/` · `registry/`) and bear on nothing here.

| File | Δ | What it is |
|---|---|---|
| `knowledge/src/projection.ts` | +861 −52 → **1032** | `projectPack()` **and `readProjection()`** — the emitter and its inverse, all three encodings |
| `knowledge/src/roundtrip.ts` | **+574** (new) | the corpus (4 packs), `roundTripEncoding()`, and `isGreen()` — what a green round trip is, in code |
| `knowledge/src/evidence.ts` | **+430** (new) | that run written down: `node knowledge/src/evidence.ts [--check]` |
| `knowledge/src/projection.test.ts` | +391 −26 → **420** | 25 cases: per-encoding read-back, rule-2 re-derivation, the mutation cases, the unrecognised-annotation cases |
| `knowledge/src/roundtrip.test.ts` | **+297** (new) | 43 cases: the corpus, §3.3 convergence, the §7 axes, OWL-Time, the arity report |
| `knowledge/src/evidence.test.ts` | **+169** (new) | 12 cases: the artifact exists, is current, is content-addressed, and writes nowhere but its own package |
| `knowledge/src/pack.ts` | +100 −4 | pack construction reached by the corpus |
| `knowledge/src/pack.test.ts` | +45 | |
| `knowledge/src/index.ts` | +17 | re-exports `readProjection`, the reader types, the round-trip and evidence surfaces |
| `knowledge/evidence/kgp-projection-roundtrip.json` | **+1** (new) | the committed result — one canonical, newline-terminated line |
| `Makefile` | +11 | `kgp-roundtrip-evidence` and `check-kgp-roundtrip-evidence` |

Seven commits behind the merge, of which four are story work
(`9b558ea` US-1 the reader · `8c73813` US-2 rule 2 · `e888e9f` US-3 the corpus and artifact ·
`824e3a7` the unrelated KFT adoption) and three are bookkeeping. The 2026-08-22 failure mode — a
story flipped to `passes: true` by a retire commit with `notes: null` and no code behind it — is
absent here. **That is context, not evidence.** Nothing below is derived from a `passes` flag; the
`passes` flag is the thing this document exists to distrust.

### 2.1 What was run

From a clean checkout at that sha, in `~/Development/agora`:

| Command | Result |
|---|---|
| `make check-knowledge` (eslint · `tsc` · `vitest run`) | **green** — 8 files, **152 passed, 0 failed** |
| `node knowledge/src/evidence.ts --check` | **exit 0** — *"is current (`sha256-27fd7839…b4edb`)"* |
| eight hand-written mutations of my own (§3, G3) | **eight refusals**, `claim-id-mismatch`, controls clean |

`--check` is the regenerate command's non-writing half: it re-runs the whole corpus and compares the
result's content address against the committed one, so exit 0 means the artifact describes a run
taken **now**, not a run taken once. Only `--check` was used — regenerating writes into `agora`, and
no file in that repo is edited by this record (ADR-0001; the artifact's own
`evidence.test.ts` asserts it refuses to write outside its package, sibling checkouts included).

## 3. Verdict, obligation by obligation

| # | Verdict | Evidence |
|---|---|---|
| G1 | **Met** | `projectPack()` emits all three views from one mapping core and uses §4.1's terms. The narrow gap the 2026-08-26 reading recorded — `valid_time` → OWL-Time present in the vocabulary table but **absent from the code and the test** — is closed: each of the three encodings of the `binary-core` pack carries **2 `time:ProperInterval` nodes, 2 `time:hasTime` edges and 3 `time:inXSDDateTimeStamp` literals**, counted directly off the emitted graph. Exercised by **four** packs / **39 claims**, not one inline single-claim pack; every corpus pack is built by the bridge (`buildPack`) and validates against koine's own `grounding-pack` schema. |
| G2 | **Met** | `readProjection()` exists, is exported from `knowledge/src/index.ts`, and takes any of the three views back to a `GroundingPack`. Losslessness is asserted as **bytes**: `JSON.stringify(recovered) === JSON.stringify(expected)`, key order included, no normalisation on either side, where `expected` is the projected subset of the original (rule 1 binds *"every claim it projects"*, so an omitted claim is correctly outside the comparison). `byte_identical: true` in **12 of 12** round trips. |
| G3 | **Met, and it bites** | The reader derives the canonical from the world / relation / arguments **read back out of the graph** under the registry-published signature, and compares — it does not re-hash the carried `hash_input`, which is why perturbing the `hash_input` alone is also caught. Checked by perturbing the artifact myself rather than by reading test names: on `binary-core`, six independent mutations of the RDF-star view — object literal `3`→`4`, subject entity id, predicate `cine:reads`→`cine:shows`, the named graph (world), the object datatype, and a `kgp:claimId` rewritten to a well-formed hash — each raised `ProjectionError` / `claim-id-mismatch`, and one further mutation of the PROV view and one of the JSON-LD view did the same. The untouched control read clean in all three. The suite's own per-encoding mutation cases perturb a *different* field per encoding (RDF-star subject · PROV named graph · JSON-LD object) and demand the throw; two further cases pin the two ways a weaker checker would pass — a rewritten `kgp:claimId`, and a rewritten `hash_input` *"which no id-only check would notice"*. `ids_rederived === claims_projected` in 12 of 12. |
| G4 | **Met** | An arity-3 claim is **omitted with a report** and the rest of the pack still crosses: the `arity-3` pack's report names the claim by id with `code: unsupported-arity` and a reason citing §4.1, and the read-back recovers **1 of 2** claims — never the omitted one. The whole-pack `ProjectionError` abort the 2026-08-26 reading recorded is gone. The obligation holds in the other direction too: an annotation the reader does not recognise is returned in `report.unrecognised` with its claim, term and value rather than dropped — verified by injecting one. |

The three further gaps the 2026-08-26 reading recorded, all closed:

- **§3.3 claim-id convergence across the projection** — the `convergence` pack: two producers, one
  id, **both** `prov` records retained (3 records against 2 claims), round-tripping byte-identically
  in all three encodings, beside the same extraction *before* reconciliation, which mints its own id
  and does not merge.
- **The §7 filters across the projection** — the `filters` pack exercises the confidence,
  license-class and `local-only` axes, each with something that crosses and something the gate
  refuses (`license-refused` · `local-only` · `license-missing`, refused **before** any encoding).
  §7.2's containment property is asserted as an absence and confirmed here: the string `local-only`
  does not occur anywhere in any of the three encodings, and a projection **forged** to read back as
  `local-only` is refused.
- **A mutation test** — present per encoding, and independently reproduced above.

Two things a reader of the artifact should not over-read. Neither is an unmet obligation:

- The artifact's `ids_rederived` counter re-hashes `hash_input`; the **strong** derivation-from-the-graph
  check lives in `readProjection`, which throws before returning. The counter corroborates a check
  that has already passed — it is not itself the rule-2 check.
- Every corpus pack has `entities: 0`, so the §2 entity-snapshot section round-trips in
  `projection.test.ts`'s fixture (which carries one) but not in the committed artifact. G1–G4 are
  obligations about **claims**, so this does not narrow the verdict; it does mean *"39 claims"* is
  not a statement about full §2 coverage.

## 4. What this means for the spec

**The gate is met.** G1–G4 all hold against the artifact at `af5b7dd`, checked by running it and by
perturbing it, and KGP's other ratification count — the KCS encoding
[`../../specs/README.md`](../../specs/README.md#the-ratification-gate) requires — has been met since
2026-08-19 (`kcs:worlds-to-fabric`, `live-pass`). With both counts discharged, §4.1's gate paragraph
records the close and KGP 0.5.2 moves to **ratified**, resting on that sha. **Done the same day:** the
header reads `ratified`, §4.1's gate paragraph is rewritten and names no owner for an open remainder
(there is none), and the promotion is recorded as a dated changelog entry citing `af5b7dd`.

Two limits on what this record licenses. It closes §4.1's fixture gate and **nothing else**: finding
**DR-3** still stands — the KCS encoding covers R1 and R2 of the *Re-validation — KGP 0.5.0* pass but
not R3, because KCS §5 has no round-trip predicate, so the fixture and the encoding remain separate
evidence for separate things. And a ratified spec does not freeze its evidence: the artifact is
current only while `check-kgp-roundtrip-evidence` is green downstream, which is why §5 exists.

**No normative text moved to produce this record.** §3, §3.1's hashed set, §3.3, §4/§4.1's mapping
and annotation-vocabulary tables and §7 are byte-unchanged, and **no claim id moves**.

## 5. How to re-run this check

From a checkout of the implementing repo, at the sha under test:

```
git diff --stat af5b7dd HEAD -- knowledge/ Makefile   # the gate tree, unchanged or not
make check-knowledge                                  # lint · typecheck · the 152 cases
node knowledge/src/evidence.ts --check                # the committed result still describes a run taken now
```

Then do not stop there — the tests are the implementer's own account of the implementer's work. Take
the corpus, project a pack, perturb one field **inside §3.1's hashed set** (the world, the relation,
an argument, a literal's datatype), read it back, and require the refusal:

```js
import { ROUNDTRIP_CORPUS, ROUNDTRIP_RELATIONS } from './knowledge/src/roundtrip.ts';
import { projectPack, readProjection } from './knowledge/src/projection.ts';
const pack = ROUNDTRIP_CORPUS.find((p) => p.name === 'binary-core').pack;
const view = structuredClone(projectPack(pack).rdfStar);
view.records[0].statement.object.value = '4';                 // was '3'
readProjection(view, { relations: ROUNDTRIP_RELATIONS });     // MUST throw claim-id-mismatch
```

The check is passed when that throws, the untouched view does not, and both hold for the PROV and
JSON-LD views as well. A green suite over conformant input alone does not pass it.

## 6. The 2026-08-26 reading, superseded

Kept because the verdict above is only worth what the method is, and the method is this one applied
to a previous artifact, where it found the opposite.

Read at `agora` `85eb2077cf47d0db1a0506a920eea2d942bbc635` (merge of
`chief/77-kgp-projection-and-roundtrip-fixture`, 2026-08-20). Four files: `projection.ts` (223
lines, emitter only), `projection.test.ts` (55 lines, two cases over one hand-written single-claim
pack), `index.ts` (+13 re-exports), and the tasklist's own `passes` flip. Two commits, **both**
US-1. US-2 (*"It round-trips back byte-lossless"*) and US-3 (*"The clean result is the
re-ratification evidence"*) were flipped to `passes: true` with `notes: null` by the retire commit
`a73b967`, **after** the merge, as bookkeeping — not by any work.

| # | Verdict then | Why |
|---|---|---|
| G1 | Met, narrowly | The emitter used §4.1's terms, but over one binary claim, and `valid_time` → OWL-Time was in the vocabulary table and in neither the code nor the test |
| G2 | **Not met** | No inverse existed anywhere in the repository |
| G3 | **Not met** | Vacuous without G2 — `claimId()` was never called on a recovered pack, because there was no recovered pack |
| G4 | **Not met as specified** | An arity>2 claim threw `unsupported-arity` and aborted the **whole** pack — neither reification nor *omitted with a report* |

Also then unexercised: §3.3 convergence across the projection, the §7 filters across the projection,
and any mutation test. All three are closed above.

The lesson that survives its own finding: `passes: true` is a claim, `green` is the assertions that
were written holding, and neither is a gate verdict. Read the artifact.
