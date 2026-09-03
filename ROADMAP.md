# koine — Roadmap

> The **contracts source-of-truth** for a neuro-symbolic interchange fabric — six protocol
> specs (KINP · KGP · KMI · KCB · KCS · KFT), a shared relation registry, JSON-Schema twins,
> and the agnostic ADRs. No runtime code: *"koine specifies, agora implements."* North star:
> *any two conformant AI systems interoperate on identity, knowledge, media, and capability
> without a single point-to-point bridge.*

**Status:** Contract layer complete — **1 of 6** specs ratified (**KGP 0.5.2**, promoted 2026-08-28 — the first promotion under the conformance gate) — the other five are Candidate, 3 in candidate re-validation (KMI, KCB, KFT) · maintenance + ratification cadence, with a planned "second act" (Phases F1–F6 below) and an **in-progress prior-art/standards-hygiene pass (Phase F7)**. Ratification is now **conformance-gated** — no spec reaches `ratified` without a machine-replayable KCS scenario ([`specs/README.md`](specs/README.md#the-ratification-gate), Phase F7 · `79`). **Phase F4 delivered that artefact on 2026-08-19** for all nine scenarios of that date, and the three later ones — `kft-resume-checkpoint.md`, `kcb-subscription-firehose.md`, `kcb-cross-owner-posture.md`, all added 2026-08-26 — were encoded downstream the **same day** at `agora` `378fd3c`, which koine recorded as still-missing until **2026-09-03** (findings **DR-11/DR-12/DR-13**, now closed). **The conformance gate blocks none of the six**, and promoted none of them: every count it preconditioned is still open, and the sharper objection — an encoding that *predates* the fold it must assert (**DR-7**, **DR-8**) — is untouched. The count moved to **1 of 6** on 2026-08-28, when KGP's own outstanding pass — the §4.1 round-trip fixture — was delivered downstream and read at a named sha ([`docs/reference/kgp-projection-gate-verification.md`](docs/reference/kgp-projection-gate-verification.md)); the other five are still outstanding (Phase 1) · **Last updated:** 2026-09-03

> **Reconciled against the tree 2026-08-25.** `tasks/chief/completed/` holds **35** records — **25** merged, 10 retired by decision (no `mergedToMain`, which is the deliberate shape). `tasks/chief/` holds **3** active, **2** of them parked.
>
> The phase rows below were last revised **2026-08-13** and have not all been re-marked. A portfolio-wide
> audit on 2026-08-25 found every roadmap here **understating** what shipped and none overstating it,
> so treat an unticked row as unverified rather than as open work. Nothing gates this file — that
> absence is the measured cause, and the drift rate is about a fortnight.

This is the single canonical roadmap for koine. koine has no prior ROADMAP; this file
synthesizes the contract program from the spec headers, the ADRs, the pressure-test scenarios,
and the completed Chief tasklists. The **specs** (`specs/`), **ADRs** (`decisions/`),
**registry** (`registry/`), **schemas** (`schemas/`), and **scenarios** (`scenarios/`) remain
the canonical reference surfaces and are linked, not duplicated, here.

---

## Vision & Scope

koine replaces the *N²* web of bespoke point-to-point integrations between AI systems with one
shared format every participant reads from and writes to. A new participant learns *one* set of
contracts, not one per peer. The intelligence and all the traffic stay at the edges — koine is
*dumb pipes, smart endpoints*: a specification only, layered **above** A2A and MCP (which carry
the message) to add the identity/knowledge/media/capability *meaning* those transports leave
undefined ([`docs/reference/positioning.md`](docs/reference/positioning.md)).

**In scope:** the normative prose contracts (role-scoped: producer / consumer / authority /
host / provider), their machine-readable JSON-Schema twins, the shared agnostic vocabularies
(relations, entity/media kinds, enums), license/trust policy, the replayable pressure-test
scenarios that gate ratification, and the agnostic ADRs recording *why*.

**Out of scope (by design):** application/runtime code (lives in **agora** and each
participant's own repo), instance data — topologies, bridge/predicate mappings, a deployment's
node/edge ontology, adoption programs — which lives in the operator's private integration repo.
koine holds contract **shape**, never a deployment instance.

## Current State

- **Six protocols specified; all four data/control planes validated by at least one concrete
  pressure test.** The contract layer is functionally complete — remaining work is
  re-ratification of three specs whose *model shape* changed after their last pass, not new
  contract authoring.
- **No runtime code in-repo.** koine is Markdown + TSV/JSON. Validators, CI, and the
  conformance console live downstream (ADR-0001).
- **Reference surfaces present and current:** `schemas/` (JSON Schema draft-2020-12 twins, each
  with a golden fixture, updated to the current spec versions), `registry/` (agnostic binary
  relations + entity/media kinds + enums; signatures immutable once published), `policy/`
  (license-class + trust-tier), `scenarios/` (six end-to-end pressure tests + the KCS stress
  test), `decisions/` (eight agnostic ADRs).
- **Chief program:** 4/4 built-program tasklists (`10`–`40`) merged; **13 koine-owned forward
  tasklists authored** (`tasks/chief/*.json`, `passes:false`, unrun) — pending a run, not merged;
  plus **17 parked markers** — proposal-only Phase-F stems and cross-repo runtime built downstream
  per ADR-0001, neither run under koine.
- **Note on drift (internal) — closed.** This note recorded `specs/README.md` and the root
  `README.md` listing KGP and KFT as *ratified* at older versions (KGP 0.4.0, KFT 0.3.0). All three
  status tables are now machine-checked against the spec headers by
  `scripts/check-doc-integrity.mjs` and agree with them: **KGP is `ratified` at 0.5.2** (promoted
  2026-08-28, on its own gates) and **KFT is `candidate` at 0.7.0**. The authoritative status
  remains each spec's own header.
- **Note on drift (external) — new, 2026-08-11:** until now **no koine spec pinned any external
  standard version**, and a prior-art sweep found drift already present in three places (the A2A
  card shape, an MCP method name, and MCP's breaking 2026-07-28 revision). The pin table and the
  drift-check cadence now live in [`docs/reference/upstream-standards.md`](docs/reference/upstream-standards.md); the
  normative corrections are Phase F7. Separately, the **KCB extension URI had been minted under a
  private hostname that was never registered** — hence squattable, verified 2026-08-11; moving it to
  the w3id.org permanent identifier `https://w3id.org/koine/…` is the first row of that phase
  (registration PR and rationale:
  [`decisions/ADR-0007-self-describing-participant.md`](decisions/ADR-0007-self-describing-participant.md)'s
  amendment log).
- **Prior art:** [`docs/reference/positioning.md`](docs/reference/positioning.md) now cites and dismisses the six
  bodies koine had never engaged (nanopublications/Trusty URIs · C2PA · Croissant ·
  Frictionless/Data Package · Pact/consumer-driven contract testing · DIDs/VCs). The sweep's
  verdict was **keep the suite** — but it narrowed KMI to a bridge and moved half of KFT's manifest
  surface to adoption-by-reference (Phase F7).

---

## Milestones

One list, everything: ratified, in-candidate, and planned. The early phases are the executed
**contract-authoring + hardening** program (the four Chief tasklists `10`–`40`, plus the two specs
ratified before Chief); the **candidate re-ratification** phase closes the ratification tail left by
model-shape changes; **Phases F1–F6** are the mined-but-unbuilt "second act"; the **Ongoing** and
**Loose wishlist** blocks cover steady-state and un-phased threads. Status legend: **✅
ratified / merged · 🚧 partial / in-progress / candidate-pending · ⬜ not started**. The Tasklist
column is the Chief tasklist that delivered a row (✅ merged) or the *(proposed)* one that would —
koine's own (`chief/NN-…`) for a spec/ADR/scenario edit, or a **cross-repo** tasklist in a named
sibling (agora / lugh / a consumer) for runtime work that is built downstream, never in koine.
A `—` means the row is a spec-owner gate (re-run an existing scenario) or continuous work with no
discrete tasklist. Existing tasklists occupy band `10`–`40`; every proposed one is numbered `50`+
so it cannot collide. **Every F-phase proposal is now authored as a `tasks/chief/*.json` (`passes:false`, unrun)** — the koine-owned rows as live koine spec/ADR/scenario tasklists, the **cross-repo** rows only as *parked* markers whose runtime work is built downstream (agora / lugh / a consumer) per ADR-0001, moving to the sibling repo when actionable and never running under koine's gates.

> **A spec is promoted only after a concrete pressure test fails to break it**, and since
> 2026-08-13 **`candidate → ratified` additionally requires that test's machine-replayable KCS
> encoding** ([the ratification gate](specs/README.md#the-ratification-gate)); a change to a
> *ratified* model's shape drops it back to **candidate** and re-enters validation, where the
> encoding is what the re-validation replays. The per-row
> status is each spec's own header (authoritative); the three index tables are machine-checked
> against those headers and no longer drift from them.

### Phase 0 — Contract authoring, ratification & hardening — ✅ complete

The four data/control planes are specified and each is validated by at least one concrete pressure
test, and four ADR-driven hardening passes landed via Chief. **All six specs were ratified in this
phase, and all six have since been demoted** by a later normative change of koine's own making —
KCB 0.3.0 (2026-07-22), KMI 0.3.0 and KGP 0.5.0 (2026-08-02), KFT 0.4.0 (2026-08-06), KCS 0.3.0
(2026-08-20), KINP 0.3.0 (2026-08-23). Not one is a spec that never rose. (This paragraph used to
say *two* were ratified here, counting only the two still ratified when the rows below were written;
the rows likewise record ratification for only those two. Corrected 2026-08-26 — the changelogs of
all six carry a `**Ratified.**` entry.) So the rows below are the historical record of Phase 0, not
the current count. That count is **0 of 6**; Phase 1 holds the remaining gate for four of the six,
and the per-spec ranking for all six — rose-and-fell history, the named gate, and what a promotion
costs from here — is [`docs/reference/promotability.md`](docs/reference/promotability.md).

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | **KINP 0.2.1** ratified — identity keystone; deltas A–E folded, three design forks decided (single identity **authority role**, hybrid merge, `@world(W)` arg); the namespace every other spec references (identity.md §11) | gated by `scenarios/e2e-worlds-to-fabric.md` · — (pre-Chief) · **demoted to candidate at 0.3.0** (federation fold) |
| ✅ | **KCS 0.2.0** ratified — declarative, replayable scenarios over participants' real MCP/A2A links; observer, not hub (conformance-scenario.md) | gated by `scenarios/kcs-format-stress.md` · — (pre-Chief) · **demoted to candidate at 0.3.0** (determinism fold) |
| ✅ | **KGP / KMI / KCB / KFT** first-authored, pressure-tested **and ratified** — all four planes covered by an e2e scenario; KGP 0.2.0, KMI 0.2.0, KCB 0.2.0 (all 2026-07-17) and KFT 0.3.0 (2026-07-23) each reached `ratified` here | `scenarios/` · — (pre-Chief) · **all four since demoted** — KCB at 0.3.0, KMI at 0.3.0, KGP at 0.5.0, KFT at 0.4.0 |
| ✅ | Adopt **OTIO** as KMI's canonical timeline; demote bespoke `edl+json` to deprecated; ADR-0005; KMI → 0.3.0 | `chief/10-kmi-adopt-otio` |
| ✅ | **KGP standards alignment** — RDF-star / W3C PROV / JSON-LD as a specified, round-trip-tested projection; bespoke TSV canonical retained; ADR-0006; KGP → 0.5.0 | `chief/20-kgp-standards-alignment` |
| ✅ | **Self-describing participant** — namespace + KCB AgentCard-extension manifest + egress policy + bridge maps published at the edge; ADR-0007; `schemas/participant-self-description.schema.json` + [`docs/explanation/self-describing-participant.md`](docs/explanation/self-describing-participant.md) | `chief/30-self-describing-participant` |
| ✅ | **Fabric-producer adapter** — one thin translate-only adapter; `same_as` grounding + `derived_from` lineage (no `mentions` relation); ADR-0008 | `chief/40-fabric-producer-contracts` |

### Phase 1 — Candidate re-ratification (close the ratification tail) — 🚧 in progress (scale: S)

Four specs sit at **candidate** because their *model shape* changed after their last pass, not
because new contract is needed. These are spec-owner gates — re-run the existing scenario against
the new shape — except the doc-sync (`chief/50`), the two discrete spec edits the tail needs
(`chief/71` KFT dep re-pin, `chief/72` KGP findings closure), and the one missing fixture (which
is Phase F5).

⚠️ **Each of these four now carries a second gate.** Under the
[ratification gate](specs/README.md#the-ratification-gate) a re-run of the prose scenario is
**necessary but no longer sufficient**: `candidate → ratified` also requires that scenario's
machine-replayable **KCS encoding**, and none of the four is grandfathered (only KINP 0.2.1 and
KCS 0.2.0 are). So every row below reads *prose re-run **+** KCS artefact*, the artefact comes from
**Phase F4** (`62` then `63`), and no row here promotes until it lands. Each row's per-spec blocker
is unchanged; what changed is that clearing it no longer finishes the job.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | **Re-ratify KCB 0.4.1** — **two** gates now (KCB pressure-test §): re-run the media-transform scenario against the 0.3.0 AgentCard-extension shape (`capabilities.extensions[]`, `https://w3id.org/koine/kcb/manifest/0.3`), **and** a *clean* §7.5 break-test. The second gate's scenario has landed and run (`scenarios/e2e-live-schema-mutation.md`) and is **not clean** — V-2/V-4/V-5/V-7 blocking — the **0.5.0 fold landed 2026-08-26** (`chief/86`, Phase F2), so re-ratification now waits on a re-run of that pass against the folded text — **and**, like every row here, on the KCS encodings of both scenarios (F4 · `62`/`63`). Two further counts have accrued since: **§3.1** registry federation (KCB 0.4.6), gated by `scenarios/e2e-multi-authority.md`, and **§4.2** subscription backpressure (KCB 0.4.7, 2026-08-26, `chief/70`), gated by a re-run of `scenarios/kcb-subscription-firehose.md` against the folded text — and **§4.3** autonomy posture (KCB 0.4.8, 2026-08-26, `chief/71`), gated by a re-run of `scenarios/kcb-cross-owner-posture.md` against the folded text — **five** in all, each gating only its own section. The fourth and fifth **also fail the conformance gate today**: those legs are the eleventh and twelfth scenarios and have **no KCS encoding**, so §4.2's and §4.3's clauses have no runnable document citing them ([`docs/reference/kcs-encoding-gate-verification.md`](docs/reference/kcs-encoding-gate-verification.md) §6.2–6.3); those encodings are downstream work and **unowned**. §4.3 additionally carries [ADR-0013](decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s retained **second-independent-implementation** condition (**W3**) . **Count (iii) was re-run on 2026-09-03 (`chief/89`) and did not close** — Steps 6/7 flip and MA-6/MA-8/MA-9 all hold, but Step 5 breaks on [ADR-0014](decisions/ADR-0014-federated-merge-merges-attributions.md)'s decided-but-unwritten clause, so that count now reads *write the clause, then re-run Steps 5–7*. The other four are untouched: **none of the five has closed and KCB is not promotable**| re-run `scenarios/e2e-media-transform.md` + `scenarios/e2e-live-schema-mutation.md` + `scenarios/e2e-multi-authority.md` + `scenarios/kcb-subscription-firehose.md` + `scenarios/kcb-cross-owner-posture.md` · — |
| 🚧 | **Re-ratify KMI 0.3.0** — OTIO half already re-validated clean; the prose half is blocked only because the same scenario also gates KCB's manifest change (media-interchange.md pressure-test §), and the promotion additionally needs `kcs:media-transform` (F4). KMI's **other** count — §7.1 CAS federation, gated by `scenarios/e2e-multi-authority.md` — was re-run on 2026-09-03 (`chief/89`) and **did not close** either: Steps 8/9 flip and MA-5 does not reproduce, but Step 10 breaks on new delta **MA-12**, so that count now reads *fold MA-12 (KCB §4 + KMI §7.1(f)), then re-run Steps 8–10*. **Neither of KMI's two counts has closed** | rides with KCB re-run · — |
| ✅ | **Re-ratify KGP 0.5.2 — DONE 2026-08-28, `ratified`.** Projection findings **KGP-1** and **KGP-2** were closed by the normative §4/§4.1 edits of `chief/72` (KGP 0.5.1, 2026-08-13), and 0.5.2 (2026-08-13) is rationale-only. Both ratification counts are now discharged: `kcs:worlds-to-fabric` (F4) **exists and ran live-pass** as of 2026-08-19, and the §4.1 **round-trip fixture** — verified 2026-08-26 as NOT delivered (an emitter with no reader, so rule 2 had never run) — landed downstream and was **re-read at `agora af5b7dd`** on 2026-08-28: reader, rule 2 re-derived from the recovered graph and rejecting, four packs × three encodings, and eight hand-made perturbations all refused ([`docs/reference/kgp-projection-gate-verification.md`](docs/reference/kgp-projection-gate-verification.md)). The verdict was taken by **running and perturbing** the artifact, never from `passes` flags — which is the error of 2026-08-22 this row exists to not repeat. **Promoted.** | `scenarios/e2e-worlds-to-fabric.md` *(Re-validation — KGP 0.5.0)* · `chief/83-promote-kgp` · `chief/87-kgp-projection-reader-and-roundtrip` |
| 🚧 | **Re-ratify KFT 0.7.0** — **two** gates (fine-tuning.md pressure-test §), unchanged by 0.7.0's additive `text-to-audio` / `audio-to-audio` vocabulary fold (`chief/88`, 2026-08-27), which restates both and moves neither; the two new §3.1 tokens are recorded there as **unexercised vocabulary** no pass has walked, not as a third gate. (i) The standing one: owner re-ratification of the strictly-additive FT-M…FT-Q intake fold, which walked clean *as written* and had not been executed — **executed 2026-09-03 (`chief/91`), and it did NOT close.** FT-M/FT-O/FT-P/FT-Q flip and Steps 1/6/7 hold, confirming the fold's additivity by execution; **FT-N half-flips** → new delta **FT-W**, because **KMI 0.3.5's MA-5** gave a `dataset.records[]` asset a second `egress` carrier on its §2 envelope two days after this pass's downstream run, and no clause ranks the two (a permissive envelope replicates out of the domain under KMI §7.1(e) a corpus §4.2 pinned `local-only`; the two absence defaults are opposite). The count changes shape to **fold FT-W in KFT §4.1/§4.2 (additive, one spec), then re-run** — unowned. `kcs:producer-exhaust-finetune` (F4) **exists** as of 2026-08-19, so the conformance gate is met *for this gate*. Its stale-plane-pin precondition was ✅ closed by `chief/71` on 2026-08-13 and has **reopened**: three of five `Depends on:` pins went stale on 2026-08-26 (KINP 0.2.x→0.4.0, KCB 0.4.x→0.5.0, KCS 0.2.x→0.3.0), firing the header's own re-check trigger — a precondition on the status transition, not a third gate. (ii) Added by **0.6.0** (2026-08-26, `chief/69`): a re-run of the new resume-checkpoint leg against the folded text. Unlike 0.5.0, 0.6.0 **does** move §4's admission inputs — where a job carries `resume`, `resume.checkpoint` joins §4.2's aggregate and §4.3's union — so §3.4/§4.2/§4.3/§5.4/§6/§7 are *changed* normative surface, not re-validated text. **Walked 2026-09-03 (`chief/91`), and it did NOT close.** The six sections were read cold, by hand, with no replay available; **FT-R/FT-T/FT-V flip** and Steps 1/7 hold, so the fold's model is sound — but **FT-S and FT-U half-flip**, on two plane folds that landed *later the same day* than KFT 0.6.0 (`49e63e6`). **FT-X**: §4.2/§4.3 read the checkpoint's egress class and license off the **KMI §2 envelope** (MA-5, `7ee8da0`) and state no rule for a **silent** one, while the two planes now state opposite absence defaults — so an unclassified checkpoint of a `local-only` corpus is re-admitted to cross-boundary compute by a provider *inside* the originating domain, where KMI §7.1(e) never sees it. **FT-Y**: §3.4's REQUIRED `checkpoint`/`at_step` live only on §6's telemetry stream — §5.2 does not carry them and `generated[]` is written at completion, which an interrupted leg never reaches — and **KCB §4.2b** (`7c82abc`) then made that stream sheddable on a losslessness argument stated for *KGP payloads*, leaving §7's MUST-verify with no durable source. The count changes shape to **fold FT-X and FT-Y (additive, KFT-only — KMI and KCB need no change), then re-run** — unowned; FT-X belongs in the same §4.2 edit as FT-W. The **cold-job independence of the two gates was walked, not assumed, and holds**, so (i) is unaffected and does not move. **(ii) also fails the conformance gate today** — the tenth scenario has no KCS encoding, so 0.6.0's clauses have no runnable document citing them ([`docs/reference/kcs-encoding-gate-verification.md`](docs/reference/kcs-encoding-gate-verification.md) §6.1); that encoding is downstream work and **unowned** | `scenarios/e2e-producer-exhaust-finetune.md` *(Re-validation — KFT 0.4.0; Re-run — walked against 0.7.0, 2026-09-03)* + `scenarios/kft-resume-checkpoint.md` *(Re-run — walked against 0.7.0, 2026-09-03)* · — |
| ✅ | **Doc-sync the index tables** — bring `specs/README.md` + root `README.md` status columns in line with the spec headers (KGP 0.5.0, KFT 0.4.0, KMI/KCB 0.3.0 all candidate). *Its ECOSYSTEM.md story context is already resolved* — the file exists since `2e228c6` (see Loose wishlist ✅), so `50`'s remaining scope is the index tables + link integrity · S | `chief/50-doc-sync-status-tables` *(proposed, koine)* |
| ✅ | **KFT dependency re-pin** — re-pin or explicitly justify KFT §1/header's plane-version pins (KGP 0.4.0 / KMI 0.2.0 / KCB 0.2.0 — the last-ratified versions — vs current 0.5.0 / 0.3.0 / 0.3.0 candidates) as part of the 0.4.0 re-ratification; reconcile the in-body cross-plane citations (esp. §2's KCB manifest shape) · S | `chief/71-kft-dep-repin` *(proposed, koine)* |
| ✅ | **KGP findings closure** — the normative §4/§4.1 spec edits closing KGP-1 (one ProbLog fact per admitted prov record; aggregation is consumer policy) and KGP-2 (name the annotation predicates: a koine-owned term namespace, reusing external terms where they exist) + the §4.1 reference to the downstream round-trip fixture — the spec-edit work `chief/50` is barred from · S | `chief/72-kgp-findings-closure` *(proposed, koine)* |

**Two of the six specs have no row here.** Phase 1 was scoped to the four candidates of its day;
**KINP** and **KCS** were still ratified then and were demoted later (2026-08-23 and 2026-08-20).
Their gates are real — KINP's MA-1…MA-4 fold landed at 0.4.0 (`85`) and its re-run was walked clean
on 2026-09-03 (`89`), leaving only the **KCS-encoding extension**, unowned and downstream; **KCS's own
re-validation was walked on 2026-09-03 (`90`) and was NOT clean**, so that count did not close — it
changed shape. Deltas M/N/O/P flip (three corroborated by the 2026-08-24 run, with one declared
residual on P: no run has ever exceeded a `timeout_ms`), but the 0.3.0 determinism fold under test
only **half-flips** — `structure_matches` carries a normative *MUST NOT be byte equality* and no
positive statement of what it compares, so two conformant runners may return different verdicts for
one document (new blocking delta **R**). KCS stays **0.3.0 Candidate**, no version and no clause
moved, and the count now reads *fold R — fix the basis in §5 or give §2/§3 a declaration slot — then
re-validate again*, a normal minor revision gated by a pressure test and **unowned**. **DR-10** is
discharged as a *qualification* on that count (a hand-walk did what a replay could not) but is
untouched as a *drift*, and it stays **downstream and unowned** under
[ADR-0001](decisions/ADR-0001-control-plane-topology.md) — koine specifies the §5 vocabulary, the
console implements it. Both specs' gates are carried in
[`docs/reference/promotability.md`](docs/reference/promotability.md), which is the six-row view this
four-row table is the program half of.

*Depended on* **Phase F4** — every row needs the KCS encoding of the scenario it re-runs. That dependency is **discharged**: `agora chief/75` encoded all nine scenarios and `agora chief/76` ran them over live links, both merged 2026-08-19 ([`docs/reference/kcs-encoding-gate-verification.md`](docs/reference/kcs-encoding-gate-verification.md)). It was discharged **for the nine scenarios of that date**, and three later ones re-opened it narrowly — `scenarios/kft-resume-checkpoint.md` (**DR-11**), `scenarios/kcb-subscription-firehose.md` (**DR-12**) and `scenarios/kcb-cross-owner-posture.md` (**DR-13**) — for **forty-nine minutes**: all three were encoded at `agora` `378fd3c` on 2026-08-26 12:30:18, in the commit that also regenerated the evidence artifact to twelve scenarios. koine recorded them as unencoded and unowned until **2026-09-03**, when the downstream gates were **run** at `agora` `main` = `c971fc2` (`coverage.test.ts` 3 passed, `KOINE_SCENARIOS.length === 12`, 0 skipped; `evidence.test.ts` 13 passed, artifact current at `sha256-eb8fdc9c…36dd5`). **All three findings are closed, F4 is discharged for all twelve, and no spec was promoted by it** — KFT's second gate and KCB's fourth and fifth are open on their **own re-runs** alone. Every other row is blocked only by its own outstanding pass. KMI's *prose* half clears the moment KCB's re-run passes. The caveat that used to read the other way is **closed**: a downstream result becomes **citable** evidence only once it is recorded in the scenario it ran (`## Downstream results`), and as of 2026-08-26 all **twelve** scenarios carry a populated one, with the run's own breaks opened as findings **DR-1…DR-13** (`84-record-the-downstream-results`, extended by `chief/71`). Read those before citing the run — two green scenarios sit over blocking deltas (**DR-7**, **DR-8**), and **DR-3** says the fully-live pass does not touch KGP's outstanding fixture gate.

### Phase 2 — Downstream adoption (tracked, built in siblings) — 🚧 rolling

koine specifies; the runtime is adopted by others. These tranches are *tracked* by koine as the
consumers of its contracts — the code lives in each named repo, never here — and their concrete
build programs are Phases F3–F5 below. Real conformance results feed back into the ratification gates.

| Status | Milestone | Tasklist |
|---|---|---|
| 🚧 | **Runtime commons** — provider-router, KCB discovery registry, KINP resolver, translation engine, conformance console (adopts all six specs) | **agora** (its own roadmap) |
| 🚧 | **Fabric producers** — worlds / knowledge / media / audio join as producers (KINP + KGP + KMI + KCB, KFT by reference) | insimul · pinakes · argos · formant |
| 🚧 | **Memory substrate** — joins as a KCB provider (KINP + KCB) | tessera |
| 🚧 | **Fine-tuning providers** — general + specialized (local-only) trainers, registry-routed (KFT) | agora (general) · lugh (specialist) |
| ✅ | **D: conformance-results intake** — **settled 2026-08-13** by `chief/79` (the rule needed it to be operable). **Where results land:** a per-scenario `## Downstream results` section in the relevant `scenarios/*.md`, recording run date, participants **by role**, and pass/fail per assertion with the clause each cites — instance-free and role-scoped, so a deployment's hosts/endpoints stay in the private integration repo ([`scenarios/README.md`](scenarios/README.md)). **Which gate consumes them:** the Phase 1 spec-owner ratification gate — an owner **MAY** cite a recorded pass as evidence alongside the hand-walked re-validation and **MUST** reopen a finding a recorded failure contradicts; a result never promotes a spec by itself. Both halves of the feedback loop are now defined (agora's console emits KCS reports; koine records and consumes them) | `chief/79-conformance-gated-ratification` |

### Phase F1 — Cross-spec federation — 🚧 in progress (scale: L)

Three specs independently deferred the same single-authority → federation question. Resolve the
shared pattern **once** in an ADR, then apply it per-spec and pressure-test a multi-authority
deployment. *Nothing is built until a deployment actually needs more than one authority.* The ADR
([ADR-0012](decisions/ADR-0012-federated-authority-roles.md)) and all three §-edits have landed, and
the break-test has been written and run — it found **every plane's edit locally sound and the
seams between them open** — the fold it demanded (MA-1…MA-11) landed 2026-08-26, and the re-run was
walked by hand on 2026-09-03. **KINP's gate flipped in full; KCB's and KMI's did not.** What remains
is two small additive folds the re-run itself found (**ADR-0014**'s clause for KCB §2/§3, **MA-12**'s
`fetch` carrier for KCB §4 + KMI §7.1(f)) and a re-run of the steps each blocks — plus, for KINP, the
downstream KCS-encoding extension that is not koine's to write.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | A **federation ADR (≥0009)** resolving the shared single-authority-role → federated-peers pattern once, so KINP/KCB/KMI stop deferring it three separate ways; ADR-0012 — *an authority is a **role**, not a hard dependency* · L | `chief/51-federation-adr` → [ADR-0012](decisions/ADR-0012-federated-authority-roles.md) |
| ✅ | Per-spec §-edits applying the ADR — KINP §11.1 (identity-authority role → federated authorities, KINP → 0.3.0), KCB §3.1 (single registry → peering registries, KCB → 0.4.6), KMI §7.1 (single CAS → per-project stores replicating on reference, KMI → 0.3.4); each names the scenario below as a re-ratification count · M | `chief/52-federation-spec-edits` |
| ✅ | A **multi-authority pressure scenario** — two authorities, cross-authority `same_as` reconciliation + registry peering + CAS replication on reference, hunting the break the shared pattern must survive; **run, not clean** — deltas **MA-1…MA-11**, blocking MA-1…MA-6 (see the scenario's *Re-ratification* §) · M | `chief/53-multi-authority-scenario` → [`scenarios/e2e-multi-authority.md`](scenarios/e2e-multi-authority.md) |
| ✅ | **Fold MA-1…MA-11** — landed 2026-08-26 across three specs, each fold held to the extent its break forces and no further ([`docs/reference/federation-fold-dispositions.md`](docs/reference/federation-fold-dispositions.md) reasons every disposition). **KINP → 0.4.0**: §4.1's weakest-link rule for a multi-authority closure (MA-1), §4.5's fourth fail-closed branch (MA-2), §6's domain-scoped convergence rule (MA-3), §4.2's new core relation `world_aligns_with` + §5 (MA-4), §3.4's non-federated-commons statement + collision rule (MA-7). **KMI → 0.3.5** (patch; 0.4.0 spent on the EDL removal): §2's optional `license`/`egress` pair with §7.1(d)'s travels-with-the-bytes carve-out and §7.1(e)'s not-served-onward rule (MA-5), §7.1(f)'s three-valued answer (MA-10). **KCB → 0.4.9** (patch; 0.5.0 spoken for by §2.2's removal): §5's issuer-named grant + optional `auth.accepted_issuers[]` (MA-6), §3's `find` response shape (MA-8), §3.1(b)'s horizon + (d)'s de-dup converse (MA-9). **KGP**: Editorial only, no version moves. **MA-11 closed unfolded** as evidence for KCS §7 q1. Three remainders deferred with a trigger each (DEFER-A/B/C); two alternatives rejected on the record. **All three specs stay Candidate** — a fold does not close its own gate; each count is now a re-run of the break-test against the folded text · M | `chief/85-fold-the-federation-breaks` |
| ✅ | **Re-run `scenarios/e2e-multi-authority.md` against the folded text** — walked **by hand** on 2026-09-03, Steps 1–10 against KINP 0.4.0 / KCB 0.5.0 / KMI 0.3.5, deliberately **not** a replay of `kcs:multi-authority` (**DR-8**: it returned `green` over six blocking deltas). Per-step: 1 holds · 2/3/4/6 flip · 5 🔴 · 7 flips · 8 holds · 9 flips · 10 🔴. **KINP's gate flips in full and its prose leg is discharged** — no MA delta reproduces and no new KINP delta was found (one declared residual, DEFER-A) — but **KINP is not promoted**: the fabric-wide **KCS-encoding** condition binds on top and `kcs:multi-authority` asserts none of the folded clauses, so it must be *extended*, bounded by KCS open question 1 (MA-11), downstream and unowned. **KCB count (iii) does not close** — Step 5 breaks on [ADR-0014](decisions/ADR-0014-federated-merge-merges-attributions.md)'s decided-but-unwritten clause (§7.3's deprecated marking has no carrier; §3.1(d)'s converse merges it away), the count ADR-0014 itself named. **KMI count (i) does not close** — Step 10 breaks on new delta **MA-12** (KMI §7.1(f)'s three answers have no carrier: KCB §4's `fetch` defines no response vocabulary and §4.2f already spends *pending fetch* on a fourth state). **No spec version moves and no clause moves**; **neither KCB nor KMI is promoted**, and neither would have been on a clean pass — five counts and two respectively, of which this clears at most one each ([`docs/reference/promotability.md`](docs/reference/promotability.md) is the ladder of record) · M | `chief/89-the-re-run-three-specs-wait-on` |
| ⬜ | **Write [ADR-0014](decisions/ADR-0014-federated-merge-merges-attributions.md)'s clause** — the blocker the 2026-09-03 re-run left on **KCB count (iii)**, and the one the ADR itself said would *"land with counts (ii) and (iii)"*. Four parts: a **carrier** for §7.3's deprecated marking and removal version in §2's manifest or §3's `find` response; *a registry MUST NOT synthesize a value for a field outside the merge key*; *where the field is a gate, the restriction wins*; and *none of it licenses reconciling two authorities*. Additive. Then **re-run Steps 5–7 again** — count (iii) does not close until that re-run walks clean, and clearing it still leaves KCB's other **four** counts open, so it promotes nothing on its own · M | **unowned** *(koine)* |
| ⬜ | **Fold MA-12** — the blocker the 2026-09-03 re-run left on **KMI count (i)**. KMI §7.1(f) requires a store to answer *not held, and not expected* distinguishably from *not reachable* and *not held, pending*, and no wire carries it: KCB §4's `fetch` is a CAS GET with no response vocabulary, KMI §7 defines *"the payloads, not the pipe"*, KCB cites §7.1(f) nowhere, and KCB §4.2f already calls a rate-limited refusal a *pending fetch*. A **two-spec** fold (KCB §4 + KMI §7.1(f)): give the three answers a carrier on the verb that delivers them, **absent reading *pending*** and never *not expected*, with KCB §4 citing §7.1(f) for their meaning. Additive — no `asset` id moves, no envelope field is added, a single-store deployment is unaffected, and **DEFER-C is unmoved**. Then **re-run Steps 8–10 again**; KMI's other count is KCB's work, so even a clean re-run leaves KMI Candidate · S | **unowned** *(koine)* |

*Depends on:* a real >1-authority deployment target to justify starting; ADR (`51`) gates the §-edits (`52`) and the scenario (`53`). Source: identity.md §11.1, capability-bus.md §3.1 (was §8 open question 1), media-interchange.md §7.1 (was §9 open question 3).

### Phase F2 — Capability versioning & deprecation — 🚧 in progress (scale: M)

How a provider evolves a capability's schema without breaking subscribers — **decided** in
[ADR-0009](decisions/ADR-0009-capability-versioning-deprecation.md) and normative at KCB §7, which
KFT §11.5 now inherits by reference (a finetuned model's pinned `kft_version` is an archival pin,
KCB §7.4). KMI's unfinished deprecation is closed with it: the `edl+json` transition window (§4.4)
names its removal — **KMI 0.4.0** — under the one deprecation policy at KCB §7.3. The break-test has
now been written and run, and it **found the perimeter open**. The fold it demanded landed at
**KCB 0.5.0** on 2026-08-26 — V-1…V-7 folded, V-8 closed where it lands — so what remains is a clean
**re-run**, which needs the KCS encoding *extended* past the fold it predates (DR-7) before it could
assert anything about it.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | A **versioning ADR** — both options were adopted at different layers: semver `(name, version)` carries *compatibility*, a content-addressed `schema_id` makes a silent mutation detectable; ADR-0009 | `chief/54-capability-versioning-adr` |
| ✅ | KCB §7 §-edit encoding the decision (KCB → 0.4.0) + the KMI §4.4 `edl+json` removal version (KMI → 0.3.1, removed at 0.4.0) + the KFT §11.5 inheritance resolved as an informative pointer | `chief/55-kcb-versioning-spec-edit` |
| ✅ | A **mutate-live-schema scenario** — a provider widens, re-prices, mutates without bumping, ships v2 beside v1 and retires v1, all under a live subscriber. Required by KCB §7.5 before KCB can re-ratify; **run, not clean** — deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7 (see the scenario's *Re-ratification* §) | `chief/56-live-schema-mutation-scenario` → `scenarios/e2e-live-schema-mutation.md` |
| ✅ | **KCB 0.5.0 — fold V-1…V-8** — landed 2026-08-26, each fold held to the extent its break forces and no further ([`docs/reference/capability-versioning-fold-dispositions.md`](docs/reference/capability-versioning-fold-dispositions.md) reasons every disposition). **§4.4a–c** a `version` operand on `invoke` + the granted major readable in the token + resolution that **refuses for want of a version** rather than defaulting (V-5); **§2.4** an optional per-entry transport `binding`, so a second major is dialable while §7.1's ban on version-in-the-**name** stands (V-4); **§7.3g** `successor_published` / `deprecated` / `removal` frames on §4.2d's **existing** control channel, each before the fact it announces (V-7); **§2.1** an optional knowledge-port `payload_schema_id` + **§7.1**'s reader rule that a bare `shape` is *no cross-check available* (V-2 — the **shape registry** rejected on the record, as a second non-federated commons against KINP §3.4/ADR-0007); **§7.1 step 5** a canonicalization **rule id** in the digest prefix, absent meaning `kcb1`, so **no published digest moves** (V-3); **§7.3c** the removal floor stated per axis, a retiring capability major waiting for the successor's next major (V-6); **§4.4d** an optional `quoted_cost` and a refusal that names *quote mismatch* (V-1). **V-8 closed unfolded** as evidence for KCS §7 q1. Two remainders deferred with a trigger each (DEFER-D/E). Same minor **discharges §2.2's declared standalone-manifest removal** (KCB §7.3f) — a deadline arriving, not a fold. **KCB stays Candidate** — a fold does not close its own gate; the count is now a re-run of Steps 3, 5, 7, 8, 9, 10 against the folded text, needing the encoding extended to **F1–F13** first (DR-7) · M | `chief/86-fold-the-capability-versioning-breaks` |

*Depends on:* none hard; naturally pairs with F1 (both are "how the fabric evolves"). Source: capability-bus.md §7 (was §7.2), fine-tuning.md §11.5, media-interchange.md §4.4.

### Phase F3 — KFT downstream runtime program — ⬜ planned (scale: L, cross-repo)

KFT §9.1 hands implementers three runtime programs plus two follow-ups; none is built in koine. The
client's live end-to-end run is externally blocked until **≥1 real provider** exists.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | **(a) General `finetune` provider** — the `trainer`/finetune-router leaf capability, engine ladder gated by the §4.2 egress class; cloud-capable; sibling to (never merged with) the provider-router · L | agora `chief/57-general-finetune-provider` *(proposed, cross-repo)* |
| ✅ | **(b) Specialized local-only provider** — a distinct `finetune` capability **on the bus** (not an adapter inside the general trainer), registry-routed, local-only where its data is synthetic/proprietary/personal-tier · L | lugh `chief/58-specialist-finetune-provider` *(proposed, cross-repo)* |
| ✅ | **(c) The `finetune` KCB client** replacing the stub runner — discover → invoke → **subscribe** to the §6 telemetry stream, wiring export (§5.3) + registry (§8) + `invoke:finetune` grants (§7) · L | agora `chief/59-finetune-kcb-client` *(proposed, cross-repo)* |
| ✅ | **`finetune-job.schema.json` validator + conformance CI** — the §3 syntactic gate, landing wherever shared validators live (ADR-0001: downstream) · M | agora `chief/60-finetune-job-validator-ci` *(proposed, cross-repo)* |
| ✅ | **A flagship consumer bridge** — a media/design participant realigning its generic "finetune bridge" onto the real KFT contract · M | consumer `chief/61-flagship-kft-consumer-bridge` *(proposed, cross-repo)* |
| ⬜ | **Pick up KFT 0.7.0's two audio `modality` rows** — a cross-repo obligation created by the 2026-08-27 vocabulary fold (`chief/88`) and **stated rather than left to a failed admission check**: the consumer mirror re-vendors the enum verbatim from `registry/enums/modality.tsv`, the specialist provider recognises both tokens so an unimplemented modality refuses `out-of-envelope` (re-routable) rather than `invalid` (terminal), and the general trainer's validator re-vendors `finetune-job.schema.json` — a validator on the 0.6.0 enum rejects a **conformant** 0.7.0 job. Findings **AUD-1…AUD-6**, with the per-repo actions and the flagged version-pin drift, are [`docs/reference/generative-audio-modalities-downstream.md`](docs/reference/generative-audio-modalities-downstream.md); **AUD-6** notes that no scenario walks an audio job, so the rows are unexercised vocabulary and that scenario + its KCS encoding are **unowned** (the *"like DR-11…DR-13"* comparison it was written with no longer holds — those three closed on 2026-08-26). **Verified at named shas on 2026-09-03** (§8 of that page): **AUD-1/AUD-2/AUD-3 discharged** in `formant` `25c5ab5` (seven tokens in file order, `KFT_VERSION = '0.7.0'`, tasklist `38` completed with the *ratified* wording resolved on formant's side), **AUD-5 discharged** in `agora` `c971fc2` (both tokens in the vendored schema enum, KFT pinned 0.7.0, an audio job refused `out-of-envelope` not `invalid`), **AUD-4 open but owned** in `lugh` `36f6f09` under its dated ADR-0007 deferral at KFT 0.4.0 with the adoption task recorded. **AUD-6 is the only one left that is koine's** · S | AUD-1/2/3/5 **done downstream**; AUD-4 **deferred, lugh-owned**; **AUD-6 unowned, koine-side** |

*Depends on:* the client (`59`) live-run is blocked until `57` **or** `58` ships a real provider. The semantic admission rules the validator (`60`) can't express are Phase F5. Source: fine-tuning.md §9.1.

### Phase F4 — Conformance console (the ratification critical path) — ✅ delivered 2026-08-19 (scale: L, cross-repo)

This phase was the gate every other spec promotion waited behind: under the
[ratification gate](specs/README.md#the-ratification-gate) a hand-walked prose pass no longer
promotes anything to `ratified`, so encoding each scenario as a machine-replayable KCS document and
running it over real MCP/A2A links (KCS §6 names this a downstream conformance-console tasklist) was
the **only** route by which any spec could earn `ratified`.

✅ **It delivered on 2026-08-19, and koine had not noticed.** All **nine** scenarios are encoded at
`agora/console/src/kcs/scenarios/`, the suite ran over live links with **delta-N stand-ins** for the
roles nobody has adopted, and `agora/console/evidence/kcs-live-run.json` is the content-addressed run
record (19 of 32 participant slots live, 0 transport failures, `verdict: partial-live`). Verified
here rather than taken from a `passes` flag:
[`docs/reference/kcs-encoding-gate-verification.md`](docs/reference/kcs-encoding-gate-verification.md).
**No spec's promotion is blocked by this phase any more.**

Two things it did *not* settle, both of which matter more now that the artefact exists:

- **`green` is not a gate verdict.** The two scenarios koine records as *not clean*
  (`e2e-live-schema-mutation.md` V-1…V-8, `e2e-multi-authority.md` MA-1…MA-11) both come back green,
  because the encodings deliberately do not assert a fold koine has not made.
- **Nothing was recorded back into koine** — ✅ **closed 2026-08-26** by
  `84-record-the-downstream-results`. All **twelve** scenarios now carry a populated
  `## Downstream results` section (the three newest record that they were never encoded and never
  run), the run's breaks are opened as findings **DR-1…DR-13** indexed at
  [`scenarios/README.md`](scenarios/README.md#findings-from-the-run-dr-1dr-13), and the same pass
  flipped the stale `planned`-nine **KCS encoding** column in
  [`scenarios/README.md`](scenarios/README.md#the-kcs-encodings-all-twelve-exist-and-none-of-the-six-specs-is-promoted-by-that).
  That column is the **register of record** and this phase only restates it; on disagreement read
  it, not this page, and close the disagreement by re-verifying against the downstream artifacts.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | Encode the nine `scenarios/` as machine-replayable **KCS documents** — `kcs:worlds-to-fabric` (`worlds-to-fabric.ts`), `kcs:media-transform` (`media-transform.ts`), `kcs:kmi-otio-roundtrip` (`kmi-otio-roundtrip.ts`), the three finetune passes (`finetune.ts`, `finetune-multimodal.ts`, `producer-exhaust-finetune.ts`), `kcs:live-schema-mutation` (`live-schema-mutation.ts`), `kcs:multi-authority` (`multi-authority.ts`), `kcs:format-stress` (`format-stress.ts`), all under `agora/console/src/kcs/scenarios/` — **the artefact `candidate → ratified` now requires**; all nine landed, and the `scenarios/README.md` column now says so (`84`, 2026-08-26). **Three** later scenarios were unencoded for one afternoon — `scenarios/kft-resume-checkpoint.md` (**DR-11**, KFT), `scenarios/kcb-subscription-firehose.md` (**DR-12**, KCB §4.2) and `scenarios/kcb-cross-owner-posture.md` (**DR-13**, KCB §4.3), all landed 2026-08-26 and **all three encoded the same day** at `agora` `378fd3c` (`resume-checkpoint.ts`, `subscription-firehose.ts`, `cross-owner-posture.ts`), verified by running the count gate on 2026-09-03 · L | agora `chief/75-encode-scenarios-as-kcs` *(merged `f853240`, 2026-08-19)* |
| ✅ | Run the KCS suite over **real MCP/A2A connections**, using **delta-N `standin`** fixtures for not-yet-adopted providers (the still-*planned* media KCB provider); each run is recorded back into its scenario's `## Downstream results` section (Phase 2 row D), which is what a ratification gate reads — **the run happened 2026-08-24 and was recorded 2026-08-26** (`84`): 19/32 slots live, `partial-live`, findings **DR-1…DR-13**. **Superseded downstream and unnoticed here for a week**: `agora` `378fd3c` regenerated the artifact on 2026-08-26 over **twelve** scenarios — `sha256-eb8fdc9c…36dd5`, 26/44 slots live (59%), `partial-live`, every scenario `green` — so koine's `## Downstream results` sections cited a superseded address until 2026-09-03 · L | agora `chief/76-run-kcs-over-live-links` *(merged `f32508e`, 2026-08-19)* |

*Depended on:* Phase 2 adoption (real participants to drive) and Phase F3 for the finetune legs — neither complete, which is why the run is `partial-live` rather than fully live; KCS's delta-N stand-ins bridged the gap. **Depended on by:** all four Phase 1 re-ratifications and every future promotion to `ratified` — that dependency is now discharged. Source: conformance-scenario.md §6, scenarios/kcs-format-stress.md (delta N), specs/README.md (the ratification gate).

### Phase F5 — Downstream validator obligations (explicit, un-owned) — ⬜ planned (scale: M, cross-repo)

Concrete validator behaviors the specs *require* but koine deliberately does not hold (ADR-0001).
One of them (the KGP round-trip fixture) **was** the whole of Phase 1's KGP re-ratification, and it is
now delivered and read — see its row. **Read this table with the 2026-08-26 lesson in hand:** the KGP
row was once marked closed on a downstream tasklist reading `passes: true`, and checking the artifact
found two of its three stories flipped by a retire commit with `notes: null` and no code. The row is
✅ today because the artifact was **run and perturbed** at a named sha, not because a later tasklist
also read `passes: true`. The other two rows have merged downstream
(`agora chief/78`, `chief/79`) and carry the **same tell** — stories at `passes: true` with `notes: null`.
They are left ⬜ here deliberately: unverified is the honest mark, and understating is the safe direction.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | The **RDF-star / PROV / JSON-LD round-trip fixture** for KGP §4 — proves a projection is lossless back to the canonical pack, and it was KGP's last remaining gate. **Delivered 2026-08-28**: `agora chief/77` had merged an **emitter** only (`85eb207`) and the marker `64` was retired on the strength of it, which was premature; `agora chief/84` added the **reader**, rule-2 enforcement from the recovered graph, a four-pack corpus across three encodings and a mutation test per encoding, read at `af5b7dd3a1201eff70067f45e7824614a81769ac` — [`docs/reference/kgp-projection-gate-verification.md`](docs/reference/kgp-projection-gate-verification.md). KGP 0.5.2 is `ratified` · M | `87-kgp-projection-reader-and-roundtrip` · agora `chief/84` |
| ✅ | **Rejection of a manifest-less pack** — a bare projection arriving without its manifest is not a unit of transfer; the validator must refuse it (schemas/README.md) · S | agora `chief/65-manifestless-pack-rejection` *(proposed, cross-repo)* |
| ✅ | The **finetune-job SEMANTIC admission rules** the schema can't express — `modality × method` compatibility (FT-F), egress/license aggregation over `{data ∪ base}` (FT-B), inline-header checks (FT-N…P); pinned by the finetune scenarios · M | agora/lugh `chief/66-finetune-semantic-admission` *(proposed, cross-repo)* |

*Depends on:* the KGP fixture (`87`) fed Phase 1 (KGP) and was the last thing between KGP 0.5.2 and `ratified` — **discharged 2026-08-28**; the finetune admission rules live with the F3 providers (a)/(b). Source: scenarios/e2e-worlds-to-fabric.md, scenarios/e2e-finetune.md, schemas/README.md, registry/README.md.

### Phase F6 — Per-spec deferred design questions — 🚧 in progress (scale: S–M each, koine)

Each spec's own §"Open questions" — folded **on the next pressure break**, not speculatively (each
note says "unless a pressure test forces it into the contract"). Grouped by spec; each is a koine
§-edit gated by a new scenario leg.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | **KMI §9** — OTIO schema-version pinning, profile-vocabulary granularity, perceptual-hash backend for `media:perceptual_match`, id re-attach after a third-party OTIO round-trip drops `metadata.koine` · M | `chief/67-kmi-open-questions` *(proposed, koine)* |
| ✅ | **KCS §7** — assertion extensibility (fixed vocab vs predicate DSL), determinism strictness (assert structure/invariants, not generated content), observation-log fidelity · S | `chief/68-kcs-open-questions` *(proposed, koine)* |
| ✅ | **KFT §11** — adapter-selection hint, distributed-run metering + checkpoint lineage, resume-checkpoint ref, eval-as-reward KCS profile for `method: dpo` · M — **delivered 2026-08-26**: a new pressure leg ([`scenarios/kft-resume-checkpoint.md`](scenarios/kft-resume-checkpoint.md)) forced question 3 and its FT-R…FT-V folded into **KFT 0.6.0** (§3.4 `resume` ref, read by §4.2/§4.3) | [`chief/69-kft-open-questions`](tasks/chief/completed/69-kft-open-questions.json) *(merged, koine)* |
| ✅ | **KCB §8.1** — subscription firehose backpressure / flow-control for high-volume-world subscriptions · S | `chief/70-kcb-subscription-backpressure` *(proposed, koine)* |

*Depends on:* a new pressure-test leg for each before it folds — these are intentionally reactive. Source: media-interchange.md §9, conformance-scenario.md §7, fine-tuning.md §11, capability-bus.md §8.1 (renumbered from §8.2 in KCB 0.4.6).

### Phase F7 — Prior-art closure, standards pins & governance — 🚧 in progress (scale: M, koine)

The output of the **2026-08 prior-art sweep** (decisions D14 · D15 · D15b · D15c of the operator's
adopt/decide/register log — that log is instance data and lives outside this repo; what it *decided*
is restated below and in `docs/`, so nothing here depends on reading it).
Its headline is that **the suite is KEPT** — four of six specs sit in a real gap and two are
correctly-scoped profiles — but that koine had **zero written engagement** with six prior-art
bodies, **no external-standard version pin anywhere**, and **one squattable identifier**. Nothing
here adds a plane; it closes citations, narrows two claims to what they can defend, and fixes two
verified defects. The informative half is already landed in
[`docs/reference/positioning.md`](docs/reference/positioning.md) (prior art cited and dismissed) and
[`docs/reference/upstream-standards.md`](docs/reference/upstream-standards.md) (the pin table + drift check); the rows
below are the **normative** half.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | ⚠️ **The KCB extension URI had been minted under an UNREGISTERED private hostname** — verified 2026-08-11 (`curl` → could not resolve), so the identifier the fabric names itself by was squattable with no recovery once implementations shipped the literal. **Closed 2026-08-13:** the namespace root is now the w3id.org permanent identifier `https://w3id.org/koine/…` ([`perma-id/w3id.org#6550`](https://github.com/perma-id/w3id.org/pull/6550)); every in-repo occurrence moved; and KCB **0.4.1** §2.3 states the dual-accept window — the URI is a *matching key*, so until **KCB 0.6.0** a consumer MUST accept both roots and a producer MUST emit the w3id form. Downstream migration is the row below · S | `chief/75-w3id-namespace-migration` |
| ✅ | **No spec pins any external standard version**, and drift is already present: KCB's example card uses the A2A **v0.x** top-level `"url"` where **v1.0 uses `supported_interfaces[]`** (`AgentInterface{url, protocol_binding}`); KCB §6 cites `MCP list_tools` where the method is **`tools/list`**; and **MCP's 2026-07-28 revision went stateless** (no `initialize`, no session id, per-request `_meta`) and added a mandatory `server/discover`. Fix all three, make the pin table load-bearing, adopt the drift-check cadence · M | `chief/76-upstream-standards-pins` *(proposed, koine)* |
| ✅ | **KGP prior art + ADR-0006 re-founding** — cite nanopublications/**Trusty URIs** (they hash *all four graphs*, so identical triples mint *different* URIs; **KGP hashes the claim alone**, and that inversion is what makes cross-producer merge work) and Frictionless/Data Package; lead ADR-0006 with the decisive argument — **RDFC-1.0 is RDF-1.1-only with no defined behaviour for RDF 1.2 triple terms, and revising it is explicitly out of the RDF/SPARQL WG charter (to 2027)** · M | `chief/73-kgp-prior-art-and-canonicalization` *(proposed, koine)* |
| ✅ | **KINP + KCS prior art and novelty** — cite DIDs/VCs and Pact/consumer-driven contract testing; record that **no standard does cross-authority MERGE** (ANS v2 *revokes*, MCP Registry *prevents*, `owl:sameAs` is 15 years into documented failure) and that **Web Bot Auth is not a competitor** (zero `draft-ietf-webbotauth-*` documents; scope is bot→website authn "using existing identifiers"); fix the positioning bug that **KCS is the most defensible spec and the least advertised** (Pact is bilateral + mock-based; A2A's own TCK is 45★) · M | `chief/74-kinp-kcs-prior-art-and-novelty` *(proposed, koine)* |
| ✅ | **KMI narrows to a BRIDGE** — **C2PA** already ships a *signed* derivation chain (`c2pa.ingredient` · `parentOf`/`componentOf`/`inputTo`, 159 certified products) and **MovieLabs OMC v2.8** a *richer* vocabulary (Revision/Variant/Derivation/Representation/Alternative), so KMI defines **projections onto both** instead of being a third vocabulary; what stays KMI's is the **analysis→knowledge bridge** + world-scoping. Plus the ADR-0005 caveat: **OTIO is not 1.0** (1.0 milestone due 2026-04-10, ~4 months late) and `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (#1985) · L | `chief/77-kmi-lineage-bridge-projections` *(proposed, koine)* |
| ✅ | **KFT keeps the gate, adopts the rest** — by reference: **Croissant v1.1** (datasets), **ModelPack/KitOps** (weights; `model.parts[].type` already contemplates LoRA), **HF `base_model`** (lineage), **Kubeflow TrainJob** `initializer.{dataset,model}.storageUri` (structural precedent). Defensible and kept: the **objective × adaptation taxonomy**, **egress-gated placement**, **graded refusal routing**, and **cross-provider job portability** — nothing converts between Axolotl/LLaMA-Factory/torchtune/TRL/OpenAI despite 190k+ combined stars, which makes portability arguably KFT's most valuable deliverable · L | `chief/78-kft-adopt-by-reference` *(proposed, koine)* |
| ✅ | **Autonomy posture — the G5 boundary half** — **delivered 2026-08-26** (`chief/71`). A parked portfolio question (*should a declared autonomy posture be a koine clause?*) closed by [ADR-0013](decisions/ADR-0013-autonomy-posture-boundary-clause.md): **yes, the boundary half, and not the console's ladder**, taking up the **G5** carve-out [ADR-0011](decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md) §4 left open. The measured reason: a posture gates spend **and** irreversibility, KCB §5 expresses spend and *nothing in the fabric named irreversibility*, so a cross-owner posture was **inapplicable** rather than weak. Specified the same day as normative **KCB §4.3** (0.4.8, patch) after the pressure leg [`scenarios/kcb-cross-owner-posture.md`](scenarios/kcb-cross-owner-posture.md) returned **AP-1…AP-8** (blocking **AP-5**): a port/capability **`effect`** class, a posture that is a **set of admitted classes** with no rung names and no total order, the **monotone-restrictive intersection** rule (*the restriction always wins* — no arbitration, no trust, ADR-0011's **T3 does not fire**), a chain rule so a delegated leg cannot escape the caller's posture, and a **floor** no posture may skip. Expressible with **no console at all**; **GOV-2** named as the companion and deliberately not folded · M | `chief/71-autonomy-posture-clause` *(koine)* |
| ✅ | **Conformance-gated ratification** — **landed 2026-08-13** ([`specs/README.md` — the ratification gate](specs/README.md#the-ratification-gate)): `candidate → ratified` **MUST NOT** happen without a matching KCS scenario; KINP 0.2.1 + KCS 0.2.0 grandfathered with the debt named and its forcing event stated; Phase F4 named as the mechanism and Phase 2 row D settled. Adopted from MCP's **SEP-2484**: *a spec cannot reach Final without a matching conformance scenario.* Directly fixes the ratification treadmill (four specs are back at candidate on model-shape changes, and all six scenarios are hand-walked prose). Promotes Phase F4 from "the unbuilt KCS payoff" to the **ratification critical path**, and forces the Phase 2 conformance-results-intake decision · M | `chief/79-conformance-gated-ratification` *(proposed, koine)* |

*Depends on:* `76` depends on `75` (the pin corrections rewrite the same example card the namespace
move touches). `77` fills the OTIO/C2PA/OMC rows of the pin table and `78` the KFT rows, so both
share `docs/reference/upstream-standards.md` as a conflict domain with `76`. `78` coordinates with
`chief/71-kft-dep-repin`, which owns the cross-*plane* pins where `78` owns the cross-*standard*
ones. `79` changes the lifecycle every other row lands under, so it is cheapest either first or
last, never mid-flight. **Downstream:** `75` has a cross-repo half — a runtime commons pins the
same extension URI in at least four places including a byte-for-byte conformance corpus
(`agora:72-kcb-extension-uri-migration`), built there per ADR-0001, never here.

### Ongoing — steady-state, not a phase — 🚧 continuous

| Status | Milestone | Tasklist |
|---|---|---|
| 🚧 | **Spec stewardship** — new agnostic ADRs (numbered ≥ 0009 after F1/F2; 0002–0004 permanently reserved to the downstream sequence), registry growth by *new* namespaced relation names (never in-place edits), `schemas/` kept in lockstep with spec versions | — |
| 🚧 | **Track downstream adoption** — as agora and the sibling producers implement the contracts, feed real conformance results back into the ratification gates: each run is recorded in its scenario's `## Downstream results` section (role-scoped, instance-free) and read by the spec-owner gate, which MAY cite a pass and MUST reopen a finding a failure contradicts | — |

### Loose wishlist — ⬜ not yet phased

Smaller open threads noted across the specs/registry, not big enough to anchor a phase:

- ✅ **Reconcile the dangling `ECOSYSTEM.md` references** — resolved 2026-08-11: [`ECOSYSTEM.md`](ECOSYSTEM.md) now exists as the thin, informative, shape-level living topology (planes + status, role map, ADR-0001 topology principles, cross-repo conventions) carrying **no instance data** — the instance topology stays in the private integration repo, per its §7.
- **Reserved-but-unexercised lifecycle relations** — KINP `retracts` / `supersedes` (delta D, identity.md §4.2) and KFT `retrains` / `supersedes` (registry) are registered but never driven by a scenario.
- **Perceptual / near-dup asset matching** — scoped *out* of KINP 0.2.0 (delta E) and still unbacked; the `media:perceptual_match` relation has no chosen backend (ties to KMI §9.4).
- **Registry vocabulary growth** — the `cine:` / `media:` / `soc:` domain families grow by PR (new immutable names), driven by real producer needs.
- **Perceptual-hash provenance recording** — record which pHash/fingerprint/embedding backs a match (the way KGP records `embedding_model`) so scores are comparable (KMI §9.4).

---

## Chief Tasklist Status

- **Chief:** 4/4 built-program tasklists merged (`10`–`40`); **13 koine-owned forward tasklists authored** (`tasks/chief/*.json`, `passes:false`, unrun) — pending a run, not merged; plus **17 parked markers** — proposal-only Phase-F stems and cross-repo runtime built downstream per ADR-0001, neither run under koine. Records in [`tasks/chief/completed/`](tasks/chief/completed/), each carrying a `mergedToMain` commit.
  - `10-kmi-adopt-otio` → ADR-0005 · `20-kgp-standards-alignment` → ADR-0006 · `30-self-describing-participant` → ADR-0007 · `40-fabric-producer-contracts` → ADR-0008.
- **30 proposed tasklists** (`chief/50`–`chief/79`) back Phase 1's doc-sync + ratification-tail edits, the planned Phases F1–F6, and the Phase F7 prior-art/standards pass above — **all now authored** as `tasks/chief/*.json` (`passes:false`, unrun), numbered above the existing `10`–`40` band so they cannot collide. Twenty are koine-owned spec/ADR/scenario stems (including the Phase-1 `71-kft-dep-repin` and `72-kgp-findings-closure` and the seven Phase-F7 stems `73`–`79`); the other ten are **cross-repo** (agora / lugh / a consumer) and sit here only as *parked* markers — runtime work built downstream per ADR-0001, moved to the sibling repo when actionable, never in koine.
- **Phase F7 (`73`–`79`) is decided work, not a proposal shelf.** It comes from the 2026-08 prior-art sweep and includes the two **verified defects** — the KCB extension URI minted under an unregistered hostname (`75`) and the total absence of external-standard pins (`76`) — which are the highest-value rows on this roadmap by cost-to-fix. One row of `75` is cross-repo (`agora:72-kcb-extension-uri-migration`).

The four candidate **re-ratifications** are spec-owner gates driven by re-running existing
scenarios plus, since `79`, that scenario's KCS encoding from Phase F4 — not Chief tasklists; the koine-own contract edits are the F1/F2/F6 spec/ADR/scenario
stems and the Phase-1 stems — the doc-sync (`chief/50`) plus the two ratification-tail spec edits
(`chief/71-kft-dep-repin`, `chief/72-kgp-findings-closure`). Everything F-banded is a
**proposal only**.

---

## Related Docs

**Canonical reference surfaces (kept in place — this roadmap links, never duplicates them):**
- [`specs/`](specs/) — the six protocol contracts ([`identity.md`](specs/identity.md) · [`grounding-pack.md`](specs/grounding-pack.md) · [`media-interchange.md`](specs/media-interchange.md) · [`capability-bus.md`](specs/capability-bus.md) · [`conformance-scenario.md`](specs/conformance-scenario.md) · [`fine-tuning.md`](specs/fine-tuning.md)) and their [`README.md`](specs/README.md).
- [`decisions/`](decisions/) — the agnostic ADRs: [ADR-0001](decisions/ADR-0001-control-plane-topology.md) (control-plane topology) · [ADR-0005](decisions/ADR-0005-otio-canonical-timeline.md) (OTIO) · [ADR-0006](decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) (KGP canonical + projection) · [ADR-0007](decisions/ADR-0007-self-describing-participant.md) (self-describing participant) · [ADR-0008](decisions/ADR-0008-fabric-producer-adapter.md) (fabric-producer adapter) · [ADR-0009](decisions/ADR-0009-capability-versioning-deprecation.md) (capability versioning + deprecation) · [ADR-0010](decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md) (KMI lineage bridge) · [ADR-0011](decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md) (deliberation / voting / dissent are non-goals) · [ADR-0012](decisions/ADR-0012-federated-authority-roles.md) (authority roles may federate) · [ADR-0013](decisions/ADR-0013-autonomy-posture-boundary-clause.md) (autonomy posture is a contract clause, in the boundary half only) · [ADR-0014](decisions/ADR-0014-federated-merge-merges-attributions.md) (a federated merge merges attributions, never contents).
- [`schemas/`](schemas/) · [`registry/`](registry/) · [`policy/`](policy/) — the machine-readable twins, shared vocabularies, and license/trust policy.
- [`scenarios/`](scenarios/) — the end-to-end pressure tests that gate ratification.

**Guides & positioning:**
- [`docs/reference/positioning.md`](docs/reference/positioning.md) — how koine relates to A2A, MCP, and mature domain standards (the semantic gaps it fills — and, since the 2026-08-18 correction, what the Kang & Diponegoro *governance*-gap analysis does and does not corroborate; what it builds on rather than replaces), and the **prior art it cites and dismisses** — nanopublications/Trusty URIs, C2PA, Croissant, Frictionless, Pact, DIDs/VCs.
- [`docs/reference/governance-taxonomy-map.md`](docs/reference/governance-taxonomy-map.md) — the six governance dimensions of Kang & Diponegoro (arXiv:2606.31498) measured against the specs, section by section: which are **partial** and precisely what is missing from each (including the scenario-replay vs decision-replay distinction), which are **absent**, and the three shortfalls filed as findings **GOV-1…GOV-3**. The three absences are decided in [ADR-0011](decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md) as **non-goals**, with the trigger that re-opens the verdict.
- [`docs/reference/promotability.md`](docs/reference/promotability.md) — **one line per spec on what stands between it and `ratified`**: which specs rose and fell (all six did) and when, the named gate each waits on today, who owns it, and the six ranked by what a promotion actually costs. The status view of what Phase 1 above holds as a program.
- [`docs/reference/upstream-standards.md`](docs/reference/upstream-standards.md) — the **pin table**: which version or dated revision of each external standard koine was validated against, and the drift-check cadence that keeps it honest.
- [`docs/explanation/self-describing-participant.md`](docs/explanation/self-describing-participant.md) — the adopter checklist (namespace, capability manifest, egress policy, vocabulary mappings).
- [`docs/guides/walkthrough-capability-bus.md`](docs/guides/walkthrough-capability-bus.md) — a KCB advertise → discover → direct-dial walkthrough with real payloads.
- [`README.md`](README.md) · [`CLAUDE.md`](CLAUDE.md) — the fabric thesis / role vocabulary, and the in-repo working conventions + per-spec current state.
