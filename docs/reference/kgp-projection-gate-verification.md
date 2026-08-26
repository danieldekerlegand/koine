# KGP §4.1 round-trip gate — what the downstream artifact actually delivers

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

**This document binds no clause.** It is the record of one verification, not a contract. Where it
and [`../../specs/grounding-pack.md`](../../specs/grounding-pack.md) disagree, the spec wins and
this record is the thing to re-check.

It exists because KGP 0.5.2 was believed promotable. Its §4.1 names exactly one gate, that gate was
assigned downstream under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), and the
downstream tasklist closed with every story reading `passes: true`. On the strength of that, koine
retired its own tracking marker on 2026-08-22 as *"the downstream half shipped."*

**The verdict below is that the gate is not satisfied.** The forward half of the round trip landed;
the half the gate is actually about — reading the projection back — was never written. `passes: true`
was a claim, and this is what checking it found.

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
losslessness: the id is just a string that rode along.

## 2. What was delivered

Read at `agora` `85eb2077cf47d0db1a0506a920eea2d942bbc635` (merge of
`chief/77-kgp-projection-and-roundtrip-fixture`, 2026-08-20) and re-read at that repo's `main`
(`9fe2ee5`) to confirm nothing was added since.

The merge is four files:

| File | Lines | What it is |
|---|---|---|
| `knowledge/src/projection.ts` | 223 | `projectPack()` — pack → RDF-star / PROV / JSON-LD |
| `knowledge/src/projection.test.ts` | 55 | two `it()` cases over one hand-written single-claim pack |
| `knowledge/src/index.ts` | +13 | re-exports `projectPack`, `ProjectionError`, `KGP_VOCABULARY`, the projection types |
| `tasks/chief/77-….json` | +2 −1 | the US-1 `passes` flip and its notes |

The branch carries **two commits**: `635fbd1 feat: [US-1] …` and `ecbb705 tasks: [US-1] - mark story
done`. There is no US-2 commit and no US-3 commit. US-2 (*"It round-trips back byte-lossless"*) and
US-3 (*"The clean result is the re-ratification evidence"*) were flipped to `passes: true` with
`notes: null` by the retire commit `a73b967`, after the merge, as bookkeeping — not by any work.

## 3. Verdict, obligation by obligation

| # | Verdict | Evidence |
|---|---|---|
| G1 | **Met, narrowly** | `projectPack()` emits all three views from one mapping core and uses §4.1's terms — `kgp:claimId`, `kgp:confidence`, `kgp:licenseClass`, `kgp:egressClass`, `kgp:dialect`, `dcterms:license`, `prov:wasAttributedTo`. Exercised by **one** inline pack of **one** binary claim, not by a fixture corpus. `valid_time` → OWL-Time (`time:hasTime` / `ProperInterval`) is in the vocabulary table but **not** in the code or the test. |
| G2 | **Not met** | No inverse exists. The module's only entry point is `projectPack`; `knowledge/src/index.ts` exports no reader, and a search of the repository for a parse-back, `unproject`, or reconstruct function returns nothing. Nothing anywhere converts RDF-star, PROV or JSON-LD back to a `GroundingPack`. |
| G3 | **Not met** | Vacuous without G2. Rule 2's *re-derive and reject on disagreement* obligation is neither implemented nor tested; `claimId()` from `claim.ts` is never called on a recovered pack, because there is no recovered pack. |
| G4 | **Not met as specified** | An arity>2 claim throws `ProjectionError('unsupported-arity')`, which aborts the **whole pack**. §4.1 permits either reification or *omitted with a report*; failing the entire projection is neither. Not silent — so not the worst failure mode — but not *complete or reported* either. |

Three further gaps in what the tasklist's own criteria asserted, recorded because they bear on how
much the delivered artifact can be cited for:

- **§3.3 claim-id convergence is untested across the projection.** The test pack holds one claim
  from one producer. The convergence property — two producers, one id, both `prov` records
  surviving — is not exercised in any encoding.
- **The §7 filters are untested across the projection.** No `local-only` claim, no license-class
  rejection and no confidence filter appears in the test. The §7.2 containment property that
  US-2's criteria called out by name is unasserted.
- **No mutation test.** Nothing perturbs a projected field and demands the check fail, so there is
  no evidence the (absent) round-trip check would bite.

## 4. What this means for the spec

KGP stays **candidate**. The gate is unchanged in substance and narrower in what is left: G1 is
done, so the remaining work is a **reader** plus rule 2's re-derivation check plus the corpus and
mutation tests that make the result mean something. §4.1 states this and names the owner; it no
longer points at the retired marker `64-kgp-projection-roundtrip-fixture`.

**No normative text moved to produce this record.** §3, §3.1's hashed set, §3.3, §4/§4.1's mapping
and annotation-vocabulary tables and §7 are byte-unchanged, and **no claim id moves**.

## 5. How to re-run this check

From a checkout of the implementing repo, at the sha under test:

```
git show --stat 85eb207                      # the four files the merge actually contains
git log --oneline 955fd6c..ecbb705           # the commits behind it — one story, not three
grep -rn 'projectPack\|unproject\|ProjectionError' knowledge/src/
```

The check is passed when a function exists that takes a §4.1 projection and returns a canonical
pack, its result re-derives every `claim` id per §3, and a perturbed projection makes that check
fail. Until then this record stands.
