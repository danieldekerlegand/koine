# ADR-0002 — Reconcile Koine with the existing LinguaScrape bridge program

**Status:** Accepted (ratified 2026-07-18)
**Deciders:** ecosystem owner
**Date:** 2026-07-18
**Refines:** the grounding tranche in [`../tasks/chief/`](../tasks/chief/) and the KINP/KGP specs.
**Basis:** read-only surveys of pinakes, argos, and the Insimul workspace (2026-07-18).

---

## Context — the discovery

The grounding tranche (`grounding-pinakes`, `grounding-argos`, `identity-adoption`) was scoped
as if grounding were greenfield. It is not. There is already a **mature three-way bridge
program**, formalized in three mirror documents dated 2026-07-11:

- `pinakes/ARGOS_SYNC_PLAN.md`, `pinakes/INSIMUL_SYNC_PLAN.md`
- `argos/docs/LINGUASCRAPE_SYNC_PLAN.md`, `insimul(workspace)/docs/LINGUASCRAPE_SYNC_PLAN.md`

**Koine is the ratified, centralized successor to these pairwise plans.** Much of what the
grounding tranche proposed is already **built** (merged code with tests) or already **scoped**
under LinguaScrape naming. Two naming facts are load-bearing:

- **"LinguaScrape" = Pinakes** (the rename is complete in identity but the sync plans + code
  still say LinguaScrape). The abstract "canonical producer / resolver authority" in the plans
  is what KINP calls the Pinakes authority. (Pinakes literally appears **0 times** in the
  Insimul workspace — the bridge there targets "LinguaScrape".)
- **`csid` (`cs:<type>:<local>`) ≈ KINP entity CURIE.** The existing canonical id scheme is,
  structurally, KINP's *entity* id kind (QID-anchored, deterministic minting) — same shape as a
  KINP CURIE.

## The reconciliation map — overlap vs. net-new

Legend: **BUILT** (merged code) · **PLANNED** (scoped, unbuilt) · **≈** (satisfies Koine
intent under other naming) · **NET-NEW** (Koine adds this; nobody built it).

| Capability | Pinakes | Argos | Insimul | Koine | Verdict |
|---|---|---|---|---|---|
| **Entity id scheme** | `csid` QID-anchored **BUILT** ≈KINP CURIE | `cs:` refs **BUILT** | raw Mongo `_id` atoms | KINP §2–3 | pinakes/argos ≈ satisfied; **Insimul net-new** (`id/3`, CURIE) |
| **assertion (content-hash) id + claim-normalization** | absent (facts=TSV rows) | `sha256(s,r,o,t)` fact ids **BUILT** (not KGP-normalized) | content-hash-aware | KGP §3 | **NET-NEW** (KGP SHA-256 normalization); Argos closest |
| **asset (byte-hash) id** | PLANNED (`asset` node) | `sha256(bytes)` **BUILT** | n/a | KINP §2 / KMI | Argos ≈ satisfied; pinakes net-new |
| **resolve / reconcile authority** | Wikidata OpenRefine **BUILT** | consumes snapshot | csid mapping | KINP §8 | **≈ SATISFIED (pinakes)**; only the KCB-manifest wrapper is net-new |
| **same_as / based_on firewall** | approx via trust-tier + reconcile-collapse | single `refers_to` + `derived_from` | import "conflict, never overwrite" | KINP §4.3 | **NET-NEW everywhere** (nobody has the first-class lineage-vs-identity firewall) |
| **world/context model + inheritance** | absent (single real-world corpus) | absent | canon/save storage firewall + `worldId` arg | KINP §5 | **NET-NEW**; Insimul must reconcile with its save-file firewall |
| **GroundingPack export/import** | PLANNED (US-002) | consumer + reverse export **BUILT** | consumer + producer **BUILT** | KGP §2 | **mostly BUILT**; align envelopes to KGP (add world-scoping + normalization) |
| **shared relation/predicate registry + dialect flags** | internal `lexicon-mapping` only | Appendix-A v0 doc | Appendix-A v0 doc | KGP §5 + `registry/` | **NET-NEW shared artifact — the biggest dedup win** |
| **dialect tiers** grounding-only/horn-safe/full-prolog | doc | doc | doc — **names already match KGP** (KGP adopted them from here) | KGP §5 | aligned; needs to become **code in the registry** |
| **Neo4j / Datalog / ProbLog / GraphRAG / ML** | all **BUILT** | grounding-only (no engine) | tau/Trealla + conformance corpus **BUILT** | KGP projections | **SATISFIED — do not touch** |
| **trust tiers** (provenance) curated/synthetic/personal | **BUILT** | personal tier | synthetic tier | — | net-new-to-Koine, but Koine doesn't need it (see collision below) |
| **SPDX license-class policy** | in plans | **BUILT** (`LicensePolicy`) | **BUILT** (`classifyLicense`) | — | **reverse flow: KGP should ADOPT this** |

## Terminology collisions to fix

- **"trust tiers" ≠ "dialect tiers".** Pinakes/Argos/Insimul "trust tiers" are *provenance
  trust* (curated / synthetic / personal / quarantine). KGP "dialect tiers" are *portability*
  (grounding-only / horn-safe / full-prolog). Both words live in these repos; they are
  orthogonal. Keep them separate; KGP means the portability axis.
- **"LinguaScrape" → "Pinakes"**, **"csid" → KINP entity CURIE**, **"GroundingPack (LinguaScrape
  contract)" → KGP envelope.** These are the same things under old names.

## Decision (recommended — FOLD, don't stack)

1. **Koine's contracts supersede the sync-plan contracts; the built work is preserved, not
   rebuilt.** The three `*_SYNC_PLAN.md` docs are marked *superseded by Koine* and cross-linked;
   their built code (ids, reconcile, projections, GroundingPack, trust tiers, ML) stays as the
   authoritative implementation.
2. **Retarget the *planned* bridge tasklists to the Koine contracts** instead of writing
   parallel Koine tasklists. Specifically the still-unbuilt US-001/US-002 of `insimul-bridge` /
   `argos-bridge` (the shared registry + the grounding-pack exporter) should build the **Koine
   registry** and emit the **KGP envelope**, not a bespoke format.
3. **Trim the Koine grounding tranche to the genuine net-new deltas** (below), and retire the
   duplicative scope.
4. **Bidirectional:** Koine also *absorbs* two things the bridges got right — the **SPDX
   license-class policy** (into KGP §7) and the awareness that **provenance trust tiers** are a
   real, separate axis KGP should reference (not redefine).

## The merged tasklist set

| Old (staged) | Becomes | Scope after reconciliation |
|---|---|---|
| `grounding-pinakes` | **retire → thin `pinakes-koine-align`** | Only net-new: publish reconcile/resolve/export as a **KCB manifest**; confirm `csid`↔KINP CURIE surface. Registry + grounding-pack export are done via retargeted `insimul-bridge`/`argos-bridge` US-001/US-002. |
| `grounding-argos` | **retire → thin `argos-koine-deltas`** | Only net-new: **same_as/based_on firewall** (replacing single `refers_to`), **world/source_world scoping** (absent today), Pinakes-authority swap + CURIE forms, optional KGP claim-normalization. Envelope alignment + GroundingPack consumption already merged (`predicate-layer`, `linguascrape-bridge`). |
| `identity-adoption` | **keep, add constraints** | Real net-new (`id/3`, CURIE/IRI, first-class `based_on`/`same_as`, KINP worlds) BUT must reconcile with (i) the `_id`-atom convention across ~72 predicates + the conformance corpus, and (ii) the strict canon-vs-save firewall (**KINP worlds must not violate "playthrough data never leaves the save file"**). The GroundingPack-consumer portion is ~90% built → cut to a rename-to-KGP task. |
| — | **new: `shared-relation-registry`** (koine → all) | Build the one machine-readable shared relation/predicate registry with dialect flags that all three Appendix-A v0 drafts defer. `koine/registry/` is its seed. This is the highest-leverage dedup: one artifact replaces three divergent drafts. |
| `agora-console-scenarios` resolver story | unchanged | still dials the (already-built) Pinakes reconciler. |

## The genuinely net-new work (the real adoption cost)

1. **The `same_as` / `based_on` firewall** as a first-class identity concept — approximated
   three different ways, formalized nowhere.
2. **The world/context model with inheritance** — absent in pinakes/argos; a storage firewall
   (not KINP worlds) in Insimul.
3. **The one shared relation registry with dialect flags** — deferred by all three.
4. **KGP claim-normalization (SHA-256 claim id)** — Argos has content-hash facts but not the
   normalized cross-producer claim id.
5. **Canonical CURIE/IRI/`id/3` surface** in Insimul (net-new) and a thin KINP-surface
   confirmation in pinakes/argos (mostly cosmetic — `csid` already ≈ CURIE).

## Already satisfied — do NOT rebuild

Entity id + minting (pinakes `ids.py`), Wikidata OpenRefine reconcile (`reconcile.py`),
Neo4j/Datalog/ProbLog/GraphRAG/ML (pinakes), Argos's content/byte-hash ids + GroundingPack
consumer + canonical export (`predicate-layer`, `linguascrape-bridge` — merged), Insimul's
GroundingPack producer/consumer + license gate + golden conformance corpus.

## Consequences

- **Positive:** avoids re-implementing a large body of merged work; the anti-overlap goal is
  served concretely; the shared registry becomes one artifact instead of three drafts; Koine
  gains the license policy the bridges proved out.
- **Cost:** the three `*_SYNC_PLAN.md` docs and the planned bridge tasklists must be edited to
  reference Koine (a reconciliation pass in each repo — *not yet done; requires touching the
  projects*, which is deferred per the current instruction).
- **Risk:** terminology drift (trust vs dialect tiers; LinguaScrape vs Pinakes) if the rename
  isn't done consistently.

## Ratified decisions (2026-07-18)

1. **Fold** (as recommended) — supersede the sync-plan contracts, preserve the built work,
   retarget the planned bridge tasklists, trim the grounding tranche.
2. **Standalone `shared-relation-registry` tasklist** — a dedicated tasklist (target `agora`,
   data in `koine/registry`), not folded into a retargeted `insimul-bridge` US-001.
3. **Rename now, as a gate** — LinguaScrape→Pinakes and csid→CURIE are the **mandatory first
   story (RENAME GATE)** of each retargeted tasklist (`pinakes-koine-align` US-PKA1,
   `argos-koine-deltas` US-AKD1, `identity-adoption` US-IA1), so the rename happens upfront when
   execution begins rather than piecemeal. Staged now; executed when the tasklists run (projects
   remain untouched until then).

The trimmed/retargeted tasklist set is staged in [`../tasks/chief/`](../tasks/chief/): retired
`grounding-pinakes`/`grounding-argos`; added `shared-relation-registry`, `pinakes-koine-align`,
`argos-koine-deltas`; reconciled `identity-adoption`.
