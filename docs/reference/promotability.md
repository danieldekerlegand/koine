# Promotability — what stands between each spec and `ratified`

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine · **Informative**

Six specs. **One — KGP 0.5.2 — is `ratified` again as of 2026-08-28**; the other five are
`candidate` and none of them is promotable today. That much is already visible from any of the three
status tables. What none of them says is **why** — which spec is one downstream artifact away from
`ratified` and which needs an eleven-delta fold first, or which specs fell from `ratified` as opposed
to never having reached it. KGP is the worked answer to that question: it was the spec one downstream
artifact away, the artifact arrived, and the promotion happened only after the artifact was **read
and perturbed at a named sha**.

This page answers that, one line per spec. It exists because the answer for KGP turned out to be
discoverable only by audit: its record named a single gate, that gate was believed satisfied by a
merged downstream tasklist, and it took reading the merge commit to establish that it was not
([`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md)). A reader should not
have to run that audit six times.

**What this page is not.** It binds no clause, and it is **not** a status mirror. Each spec's own
header is the authority on its current version and status
([`../../specs/README.md`](../../specs/README.md)); the three tables that mirror those headers are
machine-checked against them by `scripts/check-doc-integrity.mjs`, and nothing here is. So this
table deliberately carries **no current-version column** — a fourth, unchecked mirror is how the
`Current state` prose in `CLAUDE.md` goes stale, and one of those is enough. The versions that do
appear below are *historical* (the release that ratified a spec, the release that demoted it), and
those are immutable facts that cannot rot.

## The thing the table makes obvious

**All six specs were ratified once, and all six were demoted.** Not one of them is a spec that never
rose. Five fell within five weeks of being promoted, and every demotion was caused by koine's own
next normative edit — not by an implementer finding a defect, and not by an upstream break. **One has
since returned**: KGP, on 2026-08-28, and it is the first promotion in this repo's history with a
runnable artefact behind both of its counts.

That is the pattern `specs/README.md` describes as *the ratification treadmill*, seen from the other
end: promotion on a prose pass is cheap, so it happened six times; a prose pass leaves nothing a
re-run can execute, so each demotion cost a fresh hand-walk. The conformance gate added on
2026-08-13 is the intervention, Phase F4's delivery on 2026-08-19 supplied the artefact, and KGP's
2026-08-28 promotion is the first one to have gone through it.

## The table

| Spec | Was ratified | Demoted by | What blocks promotion today — the named gate | Owner |
|---|---|---|---|---|
| [KINP](../../specs/identity.md) | 2026-07-17 (0.2.0), held through 0.2.1 | **0.3.0**, 2026-08-23 — the §11 decision 1 federation fold ([ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md)) | Its **only** count, and **the fold is now done — the gate is not.** The cross-authority break test [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran **not clean**; **MA-1, MA-2, MA-3, MA-4** (blocking) and **MA-7** were all folded at **KINP 0.4.0** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), reasoned in [`federation-fold-dispositions.md`](federation-fold-dispositions.md)). **A fold does not close its own gate**, so the count did not close — it *changed shape*, from *fold the deltas* to **a re-run of that pass against the folded text**: Steps 2/3/4/6 must flip and Step 1 is the regression set. **That re-run has now happened — hand-walked on 2026-09-03, and its prose leg is clean** (`chief/89`): Step 1 holds, Steps 2/3/4/6 all flip, no delta of the original pass reproduces against 0.4.0 and no new KINP delta was found, with one declared residual on the fail-closed side (DEFER-A). It was walked against the prose, **not** replayed — **DR-8** is the standing reason. **The prose half of KINP's promotion is therefore discharged, and KINP is still not promotable**, because the **KCS-encoding** condition binds on top of it: `kcs:multi-authority` predates the fold and asserts none of §4.1's weakest-link rule, §4.2's `world_aligns_with`, §4.5's fourth branch, §6's domain-scoping or §3.4's non-federated commons (**DR-8**), so it must be **extended** rather than re-run — the same shape as **DR-7** for KCB count (ii) — and that extension is itself bounded by KCS open question 1 (MA-11). It is downstream work under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) and **unowned**. *Positive evidence, from the 2026-08-24 run:* `kcs:worlds-to-fabric` is the suite's **only fully live** scenario (3/3 roles, verdict `live-pass`) and machine-observed the §4 firewall — `firewall_holds`, two `no_sameas_across_worlds` probes including the full four-hop path, and `based_on_exists` across a non-identity-inheriting world. That is KINP's core property held by a run rather than a reading; it does not touch the MA deltas, which are federation surface the encoding predates. | the fold is **done** ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)) and the re-run is **done** (`chief/89`); the **encoding extension** is **unowned**, downstream |
| [KGP](../../specs/grounding-pack.md) | 2026-07-17 (0.2.0), held through 0.4.0 · **and again 2026-08-28 (0.5.2)** | **0.5.0**, 2026-08-02 — retaining the bespoke canonical and specifying the RDF-star / PROV / JSON-LD projection ([ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)) | **Nothing. Both counts are discharged and KGP is `ratified` again as of 2026-08-28.** Its one open item was the §4.1 round-trip fixture — downstream, not a koine edit — verified 2026-08-26 as **not delivered** (the merged work was an emitter with no reader, so rule 2 had never run). The reader, rule-2 enforcement from the recovered graph, a four-pack corpus across three encodings and a mutation test per encoding landed at `agora` **`af5b7dd3a1201eff70067f45e7824614a81769ac`**, and the verdict was re-taken there by **running and perturbing** it — `make check-knowledge` green (152/0), the evidence artifact current under `--check`, and eight hand-made perturbations inside §3.1's hashed set all refused ([`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md)). Its other count — `kcs:worlds-to-fabric` — was already met, and its 2026-08-24 run is recorded and citable: §3.3 claim-id convergence (`claims_converge`, R1) and the §7 license/`local-only` egress filters (R2, both legs `expect: reject`) held on a fully live cast. The two stay **separate evidence for separate things** — **DR-3** records that R3, the §4.1 round-trip, has no encoded counterpart, so the encoding never discharged the fixture and the fixture does not discharge the encoding. *What ratification does not do:* freeze the evidence. The artifact is current only while `check-kgp-roundtrip-evidence` stays green downstream, and a model-shape change returns KGP to `candidate` the ordinary way. | **none** — closed by [`87-kgp-projection-reader-and-roundtrip`](../../tasks/chief/completed/87-kgp-projection-reader-and-roundtrip.json) *(koine)* + `agora chief/84` |
| [KMI](../../specs/media-interchange.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-08-02 — adopting OTIO as the canonical timeline model ([ADR-0005](../../decisions/ADR-0005-otio-canonical-timeline.md)) | **Two** counts, neither closed, and **the fold cleared neither.** (i) §7.1 CAS replication: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran and left **MA-5** blocking (+ MA-10) — four of §7.1's own clauses held under direct attack, but the egress gate had no operand. Both were folded at **KMI 0.3.5** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)): §2 gained optional `license`/`egress`, §7.1(d)(e) made the policy travel with the bytes and barred serving a copy whose policy did not, and §7.1(f) became three-valued. As with KINP the count **changed shape rather than closing** — it became a **re-run of Steps 8–10 against the folded text**. **That re-run has now been walked, by hand on 2026-09-03 (`chief/89`), and the count did NOT close.** Steps 8 and 9 flip — the regression set holds and **MA-5 does not reproduce**, §2's `license`/`egress` giving §7.1(e)'s gate its operand and (d)/(e) closing laundering-by-retention at the retainer — but **Step 10 does not flip**, on a **new delta MA-12** (Med, carrier): §7.1(f) requires a store to answer *not held, and not expected* distinguishably, and **nothing defines a wire for it** — KCB §4's `fetch` is a CAS GET with no response vocabulary, KMI §7 defines *"the payloads, not the pipe"*, KCB cites §7.1(f) nowhere so the inherit-by-citation half of this two-spec delta was never written, and KCB §4.2f already calls a rate-limited refusal a *pending fetch*, so a fourth state shares (f)'s default word on the same verb. MA-8's class of break, one plane over. So the count changed shape a second time: from *re-run* to **fold MA-12** (additive; no `asset` id moves, DEFER-C unmoved), and it is **unowned**. (ii) The [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) re-run, which is **KCB's** to do — KMI's OTIO half is already re-validated clean. *One caveat the 2026-08-24 run added:* **DR-4** — the encoding of [`kmi-otio-roundtrip.md`](../../scenarios/kmi-otio-roundtrip.md) is `kcs:media-transform` re-titled over the same fixture and asserts nothing OTIO-specific, so **M-1 and the §4.2a fold are unexercised**. KMI's artefact gate is met **by count, not by content** on that document. It opens no new count, because M-1 is not one of KMI's two — but an owner citing that encoding as evidence for §4.2a would be citing a run that never touched it. | (i) folded by [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), re-run **done** (`chief/89`) and **not clean**; the **MA-12 fold** is **unowned** · (ii) rides with KCB — **unowned** |
| [KCB](../../specs/capability-bus.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-07-22 — the §2 manifest redefined as an A2A AgentCard extension | **Five** counts as of **0.5.0** (2026-08-26), none closed. (i) Re-run [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) against the extension shape — outstanding since 2026-07-22 and **unowned**. (ii) §7.5 break-test: [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) ran **not clean**, deltas **V-1…V-8** with V-2/V-4/V-5/V-7 blocking; **V-1…V-7 folded at 0.5.0** on 2026-08-26 ([`86`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json)), V-8 closed where it lands — so this count too is now a **re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text**, and **unowned**. It **also fails the conformance gate**, in a way the other four do not share: the encoding *exists* but predates the fold (**DR-7**), so it must be **extended** to the scenario's new **F1–F13** set before a re-run could assert anything — ten of those thirteen need declared console extensions (V-8), and that work is unowned too. Publishing 0.5.0 additionally discharged §2.2's declared standalone-manifest removal, which closes no count. (iii) §3.1 registry peering: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) left **MA-6** blocking (+ MA-8/MA-9), all three folded at **0.4.9** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)) — so this count too became a **re-run of Steps 5–7 against the folded text**. **That re-run has now been walked, by hand on 2026-09-03 (`chief/89`), and the count did NOT close.** Steps 6 and 7 flip, and inside Step 5 **all three folded deltas hold** under re-attack — MA-9's horizon terminates both re-forward topologies, MA-9's de-duplication converse returns one entry with both `served_by` attributions, and MA-8's three carriers exist. **Step 5 breaks on [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)** — the clause this repo decided on 2026-08-26 and deliberately left unwritten, which the ADR itself says *"lands with counts (ii) and (iii)"*, count (iii) being this walk: §7.3's deprecated marking has no carrier in §2 or §3, §3.1(d)'s converse merges a stale and a fresh attribution into one entry whose marking is undefined, and §3.1(e) cannot fire because the converse removed the visible disagreement. So this count changed shape a second time: from *re-run* to **write ADR-0014's four-part clause**, and it is **unowned**. It consumed no minor: 0.5.0 was reserved for §2.2's removal, and count (ii)'s fold landed there on 2026-08-26 alongside it. (iv) New at 0.4.7: a re-run of [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) against the folded §4.2 — and **this count also fails the conformance gate** (**DR-12**, above): that scenario has no KCS encoding and none is owned, so a clean re-run would be necessary but not sufficient. (v) New at 0.4.8: a re-run of [`kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md) against the folded §4.3, which **fails the conformance gate the same way** (**DR-13**) and additionally carries [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s second-independent-implementation condition (**W3**). *And the reading hazard is sharpest here:* `kcs:live-schema-mutation` came back **`green` over the four blocking V-deltas** of count (ii), because the encoding deliberately does not assert an unfolded delta (**DR-7**). Nothing in the run discharges any of the five. | (ii) [`86-fold-the-capability-versioning-breaks`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json) · (iii) folded by [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), re-run **done** (`chief/89`) and **not clean**; **ADR-0014's clause** is **unowned** · (i) (iv) (v) **unowned** |
| [KCS](../../specs/conformance-scenario.md) | 2026-07-18 (0.2.0) — under the **previous** rule, grandfathered | **0.3.0**, 2026-08-20 — the determinism fold (delta Q: `structure_matches`, the stable-invariant rule) | A re-validation of that fold against [`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md). The fold is additive and backward-compatible, and the grandfathered debt the previous rule left it was **paid 2026-08-19** — the nine encodings exist, `kcs:format-stress` among them. §7.1 (assertion extensibility) and §7.3 (recording fidelity) are open **questions**, not gates — and the 2026-08-24 run supplied a re-open input for each: **DR-10** (the downstream §5 vocabulary omits `structure_matches`, the very predicate the 0.3.0 fold added, and declares a `media_map_complete` koine names nowhere, while every document declares `kcs_version: 0.3.0`) and **DR-2** (the evidence artifact records a per-scenario aggregate, not pass/fail per assertion with its cited clause, which is what §7.3 asks about and what [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) assumes a recorded result contains). **DR-10 bore on the re-validation directly** — the determinism fold cannot be exercised by a suite whose vocabulary lacks its predicate — and it was recorded as a *qualification* on that count, not a second gate, because a hand-walk could still discharge what a replay could not. **That hand-walk happened on 2026-09-03 (`chief/90`) and the count did NOT close.** The regression set flips (**M**, **N**, **O**, and the assertion half of **P** — three of them corroborated by the run rather than by the reading alone; **P** carries one declared residual, since no run has ever exceeded a `timeout_ms`, so §4's fails-liveness path is unexercised). **The fold under test half-flips**: byte equality is forbidden normatively, but `structure_matches` is admitted to the fixed core with only that **negative** constraint and its **comparison basis is fixed nowhere** — no slot in §2/§3 where a scenario declares which invariants must match (the signature is fixed at two operands), no plane clause behind the *Determinism/invariants* group where every other §5 predicate delegates to one, and two operands that are content hashes of deliberately-differing bytes. Two conformant runners may return different verdicts for one document and §4's content-addressed report hides the divergence: new blocking delta **R** ([`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md#findings-from-the-re-validation)). So the count **changed shape** rather than closing — from *re-validate the fold* to **fold R (fix the basis in §5, or give §2/§3 a declaration slot), then re-validate again**, a normal minor revision gated by a pressure test. No version and no clause moved on the walk. **DR-10 itself is discharged as a qualification without being fixed, and stays DOWNSTREAM work** under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) — koine specifies the §5 vocabulary and the console implements it, so it MUST NOT be closed by editing the runner from this repo — and it is **unowned**. Worth recording: a replay could not have found R even with the predicate implemented, because one runner is internally consistent and an open basis is invisible from inside it. *Positive evidence, at a scale no single scenario supplies:* nine documents were written in KCS 0.3.0 and all nine parse, replay and produce a content-addressed report; deltas **M**, **O** and **P** all ran as specified; and the §7.1 escape hatch was used as designed, twice, by different authors (**V-8**, **MA-11**). | **unowned** — both the R fold (koine) and DR-10 (downstream) |
| [KFT](../../specs/fine-tuning.md) | 2026-07-23 (0.3.0), on two clean pressure passes | **0.4.0**, 2026-08-06 — the additive FT-M…FT-Q producer-exhaust intake fold | **Two** counts as of **0.6.0** (2026-08-26). (i) The owner's re-run of the *Re-validation — KFT 0.4.0* section of [`e2e-producer-exhaust-finetune.md`](../../scenarios/e2e-producer-exhaust-finetune.md) — which walked clean **as written** and had never been executed. **It has now been executed — hand-walked on 2026-09-03 (`chief/91`) — and the count did NOT close.** Four of five deltas flip and the regression set holds: FT-M's `records[]` slot, FT-O's positional headers, FT-P's `recordCount` and FT-Q's schema citations are all in the prose, the schemas and the registry, and the 0.4.0 fold's additivity claim is confirmed by execution rather than by reading (a 0.3.0-shaped manifest still validates and gates identically). **FT-N half-flips** → new delta **FT-W** (High, gate integrity): §4.2's normative half is intact and stays intact — the gate reads the header, never the `tier` — but the sentence carrying it asserts the header is *the only descriptor available at admission*, and **KMI 0.3.5's MA-5 fold made that false two days after this pass's own downstream run**. A `dataset.records[]` file is a KMI asset, its §2 envelope may now carry its own `egress`, and no clause in either spec ranks the two carriers: a permissive envelope lets KMI §7.1(e) replicate across an authority-domain boundary a corpus §4.2 correctly pinned `local-only`, and the two **absence** defaults are opposite (`exportable` at KFT §4.2, fail-closed at KMI §7.1(e)), so a job declaring `egress` nowhere is admitted here and fails at the fetch, after placement and around FT-J. So the count **changed shape** rather than closing — from *re-run the fold* to **fold FT-W in KFT §4.1/§4.2** (additive, one spec; KMI needs no change, MA-5 being what finally gave §4.2's *"every media asset"* clause the operand it had always assumed) **then re-run that section again** — the same shape KMI count (i) and KCB count (iii) took on the same day, and it is **unowned**. The walk moved no version and no clause. **And its dependency-pin precondition has reopened:** it was **closed** on 2026-08-13 ([`chief/71-kft-dep-repin`](../../tasks/chief/completed/71-kft-dep-repin.json)) for the planes as they stood that day, and the header's own **track-current** rule now fails on three of five pins — KINP reads 0.2.x and is 0.4.0, KCB reads 0.4.x and is 0.5.0, KCS reads 0.2.x and is 0.3.0, all three minor bumps landed 2026-08-26, all three firing the header's re-check trigger. That is a precondition on the **status transition**, not a third gate, and not a finding against the fold. (ii) New at 0.6.0: a re-run of [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md), whose FT-R…FT-V the fold answers — its Steps 2–6 must now walk clean and its Steps 1/7 stay held. Caveat, and it grew: §3.3 and §8.1 were already normative surface **no pass has exercised**, and 0.6.0 is the first fold since the demotion to move §4's admission inputs (a `resume` ref joins §4.2's aggregate and §4.3's union), so §3.4/§4.2/§4.3/§5.4/§6/§7 are **changed** surface too. A cold job — every 0.4.0- and 0.5.0-era manifest — admits on exactly the inputs it did before, which is why (i) does not move. And the conformance gate is **not** met here: the tenth scenario has no KCS encoding yet (**DR-11**). The 2026-08-24 run adds a third qualification and one piece of good news. Qualification: the suite pins **KFT 0.5.0**, so §3.3's conversion round-trip and §8.1's graded refusals have no encoded assertion at all — every refusal is the ungraded §5 `refused` (**DR-5**) — and the **training-provider** role was a delta-N stand-in in all three KFT passes, so every refusal observed is an admitting-side refusal against a recorded provider (**DR-6**). Good news: the gate itself fired, five times over `expect: reject` steps — one `local-only` record kept a whole run off rented compute, **FT-B** reached the base model's own egress, **FT-A** held §5.4's output inheritance, **FT-D** closed the eval path, and **FT-F** refused `dpo` × `text-to-image` at admission. | **unowned** |

## Cheapest first

Ranked by what a promotion actually costs from here. This ordering is the point of the page.

1. **KGP — done, 2026-08-28. It is off this list.** It ranked first because every koine-side gate
   was already discharged and what remained was one downstream deliverable, built in agora under
   [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md). That deliverable arrived
   (`agora chief/84`), [`87`](../../tasks/chief/completed/87-kgp-projection-reader-and-roundtrip.json) re-took the
   verdict against it obligation by obligation, and the owner promoted. **The ranking's premise held:
   the cheapest promotion on the page was the one that happened, and it still cost an artifact plus an
   audit of that artifact — not a status edit.** The rows below inherit the same bar.
2. **KCS — the read-and-confirm pass was done, and it read *not clean*.** This row used to say the
   cheapest thing on the page: a re-validation, no fold, additive and backward-compatible against a
   scenario that exists and whose encoding runs. **The pass was walked by hand on 2026-09-03
   (`chief/90`) and cost KCS a fold.** M/N/O/P flip; **delta Q half-flips**, because `structure_matches`
   — the predicate the 0.3.0 fold *is* — was admitted to the fixed core with only a **negative**
   constraint, and where its comparison basis comes from is fixed nowhere, so two conformant runners
   may return different verdicts for one document (new blocking delta **R**). The count therefore
   **changed shape rather than closing**: *fold R, then re-validate again* — a normal minor revision
   gated by a pressure test, and unowned. **That is a read-and-confirm confirming nothing, which is a
   legitimate outcome and the reason this page exists**: the cheapest-looking gate on the ladder was
   the one that grew, and it grew from a reading no replay could have produced.
   **DR-10 is now two things and they must not be conflated.** As a *qualification on this count* it
   is **discharged** — it said a replay could not exercise the folded clause but a hand-walk could,
   and the hand-walk happened. As a *drift* it is untouched and stays **DOWNSTREAM**: the runner's §5
   vocabulary still omits `structure_matches` and still declares a `media_map_complete` koine names
   nowhere, while every document it replays declares `kcs_version: 0.3.0`. Fixing it is work in the
   console under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) and **unowned** — it
   is deliberately **not** closed from koine, which specifies the vocabulary and does not hold its
   implementation. R is a separate thing again: DR-10 is a **name** missing downstream, R is a
   **meaning** missing here, and a runner that added the name tomorrow would still have to invent the
   basis.
   **The ordering below is unchanged, and that is a claim worth checking rather than assuming.** KCS's
   cost went up — from a reading to a fold plus a re-reading — so it no longer outranks the rows below
   on volume of work. It keeps its place on the dependency argument item 4 already makes: KINP's last
   blocker is bounded by **KCS open question 1**, which this walk does not touch (R is question 2's
   clause, and explicitly not the §7.1 escape hatch), so KCS still sits upstream of KINP. KFT below is
   two re-runs plus a missing artefact and six sections read cold, which is more, not less.
3. **KFT — two re-runs, one missing artefact, and more cold reading than it looks.** One re-run is
   the KCS shape (re-run a section that already walks clean); the other is the new resume-checkpoint
   leg 0.6.0 folded on 2026-08-26. The asterisk grew with it: §3.3 and §8.1 were already
   unexercised, and 0.6.0 changed §4's admission inputs for `resume`-carrying jobs, so the owner
   reads six sections cold rather than re-reading walked ones. It also **lost its place in this
   ranking's premise** — the tenth scenario has no KCS encoding, so unlike KCS above, KFT cannot be
   promoted even on a clean re-run until that document is built downstream. Still unowned, now on
   two fronts.
   **The first re-run has now happened — 2026-09-03, `chief/91` — and it was not clean, so KFT's cost
   went up rather than down.** Four of the five deltas flip and the regression set holds; **FT-N
   half-flips** on a carrier that did not exist when the fold was written, giving new delta **FT-W**
   (KMI 0.3.5's MA-5 put a second `egress` on the same `dataset.records[]` object, and nothing ranks
   the two). So count (i) is now **a fold plus a re-run**, not a re-run — the third row on this page to
   take that shape on the same day, after KMI count (i) and KCB count (iii). The walk also reopened the
   **dependency-pin precondition** this row had recorded as closed: three of five pins went stale on
   2026-08-26 and the header's own re-check trigger fired unpulled. Neither the FT-W fold nor the pin
   re-read is owned.
   **The re-rank this implies is deliberately deferred.** On cost alone KFT no longer clearly outranks
   KINP below, which has *no* koine-side work left at all. Gate (ii) — the resume-checkpoint re-run —
   has not been walked yet and may move the number again, so re-ordering twice in one pass would be
   churn rather than information. The verdicts are recorded here in the row; the ordering is revisited
   once (ii) is in.
4. **KINP — no koine-side work is left, and this walk is why it now outranks KMI.** The four
   blocking deltas plus MA-7 landed at **0.4.0** on 2026-08-26: §6's convergence target is
   domain-scoped, §4.5 has its fail-closed fourth branch, §4.2 has `world_aligns_with`, §4.1 carries
   the weakest issuer, and §3.4 says plainly that the prefix registry is the one **non-federated**
   commons. None required redesign and every one is additive, exactly as the scenario predicted.
   **The re-run has now been walked, on 2026-09-03, and it is clean** — Step 1 holds and Steps
   2/3/4/6 flip, by hand against the prose rather than by replaying `kcs:multi-authority` (**DR-8**).
   **KINP's koine-side work is finished, and it is the only row on this page of which that is true.**
   That is the ordering change this walk forced: KINP was 5th behind KMI when both were waiting on the
   same re-run; the re-run cleared KINP's prose leg and left KMI a **new fold** (MA-12) plus another
   re-run, so KINP is now strictly the cheaper of the two.
   What remains is the correction of this paragraph's own earlier claim: *"a single re-run and nothing
   else"* was wrong, and the KINP row above always said so — the **KCS-encoding** condition binds on
   top of the prose leg, and `kcs:multi-authority` asserts none of the folded clauses, so it must be
   **extended** (DR-8, the DR-7 shape). **It does not overtake KCS or KFT**, and the reason is a
   dependency rather than a volume of work: that extension is bounded by **MA-11 / KCS open question
   1**, so KCS's own unresolved question sits upstream of KINP's last blocker. KINP's remaining work
   is **downstream, under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), and
   unowned** — the same place as KFT's and KCB's.
5. **KMI — the re-run happened, it was not clean, and the count grew a fold.** MA-5's two optional §2
   fields and MA-10's answerable absence went in at **0.3.5** on 2026-08-26, additively, with 0.4.0
   still spent on the EDL removal. The **re-run of Steps 8–10 was walked on 2026-09-03** and count (i)
   **did not close**: Steps 8 and 9 flip and **MA-5 does not reproduce**, but Step 10 broke on a new
   delta **MA-12** — §7.1(f)'s three answers have no carrier on the verb that must deliver them, KCB
   §4's `fetch` defining no response vocabulary and KCB §4.2f already spending the word *pending fetch*
   on a fourth state. So KMI's cost went **up**, not down: it is now a fold (small and additive, but
   spanning **two** specs, KCB §4 and KMI §7.1(f)), then a re-run of Steps 8–10 again, and only then
   the wait on **KCB's** count (ii), which is not KMI's work. That is what dropped it below KINP in
   this ranking. Both the fold and the re-run are **unowned**.
6. **KCB — the most work, and the most implemented.** **Five** independent counts as of 0.5.0. It had
   **no fold outstanding** — V-1…V-7 landed at 0.5.0 on 2026-08-26, as MA-6/MA-8/MA-9 did at 0.4.9 —
   and **the 2026-09-03 walk gave it one back**: count (iii)'s re-run of Steps 5–7 happened and **did
   not close**. MA-6/MA-8/MA-9 all hold under re-attack, but Step 5 breaks on
   [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)'s decided-but-unwritten
   clause, which is exactly where the ADR said it would land. So the shape of the pile is now: **one
   clause to write** (ADR-0014, four parts), **four re-runs of folded text** — one of them count
   (iii)'s, again — a re-run outstanding since 2026-07-22, and
   the two newest counts — §4.2 backpressure and §4.3 autonomy posture — which, alone among the
   five, lack a KCS encoding entirely (**DR-12**, **DR-13**), while count (ii)'s encoding exists but
   must be **extended** past the fold it predates (**DR-7**); §4.3 additionally carries
   [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s retained
   second-independent-implementation condition (**W3**). Real routing code downstream is already built against the pre-finding contract.
   KCB is the spec where reading `green` as a verdict does the most damage: `kcs:live-schema-mutation`
   and `kcs:multi-authority` both came back green over passes with four and six blocking deltas open
   (**DR-7**, **DR-8**). One clause change is **queued against two of the five** and is
   not a fold: [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md), the single
   finding of the [cross-read](fold-coordination-federation-versioning.md) of the two 2026-08-26 folds —
   §7.3's deprecated marking has no carrier, and §3.1(d)'s de-duplication converse merges it away — lands
   with counts (ii) and (iii) rather than in either version, so it moves neither and closes neither.
   *And the reference implementation was read against the folded text* (§5 of that page): nothing
   contradicts a folded clause, but the standalone manifest 0.5.0 removed is still its only crawl path
   (**AG-1**), and its manifest type carries neither `version` nor `schema_id` (**AG-2**) — so §7 as a
   whole is unexercised outside this tree.

## Two facts that apply to every row

- **The conformance-gate is met for four of the six — KFT and KCB are the exceptions, both as of
  2026-08-26.** Nine [`../../scenarios/`](../../scenarios/) pressure tests have machine-replayable
  KCS encodings, built downstream and run over live MCP/A2A links on 2026-08-19
  ([`kcs-encoding-gate-verification.md`](kcs-encoding-gate-verification.md)). Three scenarios written
  *after* that set was frozen have none, and each costs its spec the gate on one count:
  [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md) (**DR-11**), so KFT 0.6.0's
  §3.4 `resume` and the §4.2/§4.3 clauses reading it have no runnable document citing them;
  [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) (**DR-12**), so
  KCB 0.4.7's §4.2 has none either; and
  [`kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md) (**DR-13**), so
  KCB 0.4.8's §4.3 has none either. That is precisely what
  [the gate](../../specs/README.md#the-ratification-gate) forbids promoting on. KCB's other three
  counts are unaffected — the scenarios they re-run are all encoded — and for the four unaffected
  specs every gate named above is the spec's **own** outstanding pass. The gap is visible downstream
  rather than assumed: `agora`'s `console/src/kcs/scenarios/coverage.test.ts` asserts set-equality
  against this repo's `scenarios/*.md` and goes red naming **all three** unencoded documents.
  Building the encodings is downstream work under
  [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) and **none is owned**.
- **The downstream run is now citable — with two conditions.** Under
  [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) a result becomes evidence a
  gate may read only once recorded in the scenario it ran, as a `## Downstream results` section. As
  of 2026-08-26 every scenario carries one
  ([`84-record-the-downstream-results`](../../tasks/chief/completed/84-record-the-downstream-results.json)),
  so an owner **may** cite the 2026-08-24 run alongside a hand-walked pass. The conditions come from
  the run's own findings, indexed at
  [`../../scenarios/README.md`](../../scenarios/README.md#findings-from-the-run-dr-1dr-13): `green`
  means *the encoded assertions held*, not *the spec holds* — two scenarios came back green over
  four and six open blocking deltas (**DR-7**, **DR-8**) — and a green encoding is evidence only for
  what it encodes, which for three specs is less than their row above implies (**DR-3**, **DR-4**,
  **DR-5**). Neither condition changes a single row's verdict below; both change what a citation of
  the run is worth.

**On tasklist `53` — resolved 2026-08-26, and the answer is not the one this paragraph predicted.**
KINP, KCB §3.1 and KMI §7.1 each named
[`chief/53-multi-authority-scenario`](../../tasks/chief/completed/53-multi-authority-scenario.json)
as a live gate while it sat in `completed/`. That was not a bookkeeping error: `53`'s scope was to
**write and run** the break test, and it did — [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md)
exists and ran. What the three specs were waiting on was the **fold**, which
[`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json) landed on 2026-08-26.

This paragraph used to say *the three status notes should be repointed at `85` when that fold lands*.
**Don't** — that pointer would have been stale the day it was written. `85` is now finished too, and
so is `chief/89`, the re-run of the scenario
against the folded text that all three counts read as until 2026-09-03. The three specs are therefore
correct to keep citing the **scenario**, not a tasklist: the scenario is the artefact a re-run
executes and it does not move, whereas every tasklist that has ever owned a leg of this work is now
in `completed/`. The general rule, and it is the one KGP's six-day stale gate teaches: **point a gate
at the artefact that discharges it, and name the owner separately** — because owners retire and
artefacts do not.

**The one re-run, and what it left behind.** As of 2026-09-03 the three counts no longer share a
blocker, because the walk split them. KINP's prose leg is **discharged** and its remainder is the
downstream KCS-encoding extension. KMI count (i) and KCB count (iii) are **still open**, and each now
waits on a *koine* edit that did not exist before the walk — **MA-12**'s two-spec carrier fold for
KMI, **ADR-0014**'s four-part clause for KCB — followed by another re-run of the same steps. All
three remainders are **unowned by any tasklist in any repo**, and an unowned gate is the honest state,
recorded as such here rather than parked against a tasklist that would make it look scheduled.

**And neither KCB nor KMI moved a step closer to `ratified` on this walk, even in the counterfactual
where it had been clean.** KCB has **five** counts and KMI **two**; Steps 5–7 clear at most one of
KCB's and Steps 8–10 at most one of KMI's, and KMI's other count is KCB's work to discharge. This is
the failure the whole page exists to prevent — reading a single satisfied gate as a promotion — and it
is stated here because this walk is the first event that could have invited it.

## Keeping this honest

The failure mode for a page like this is the one it was written to expose: a line that says *blocked
on X* after X has shipped, or *satisfied* on the strength of a `passes: true` nobody read the diff
for. Two rules, both learned the hard way here:

- **A gate is discharged by an artifact, never by a flag.** Read the commits — `git log --oneline`
  and `git show --stat` on the merge — before moving a line to *met*. A retire step can flip stories
  it never ran, and the tell is `notes: null` on a `passes: true` story.
- **Check a blocking claim with the same suspicion as a completion claim.** The correction on
  2026-08-26 that made this page possible found koine gating all six specs on an artefact it had
  already been given. Under-claiming is the safer direction, not a free one.

Revisit whenever a spec's status moves, a fold lands, or a scenario is re-run.
