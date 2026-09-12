# Promotability — what stands between each spec and `ratified`

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

Six specs. **None is `ratified` today.** KGP was — it came back on 2026-08-28 at 0.5.2 — and its
**0.6.0** argument-type fold (2026-09-12) demoted it again, so the count is back to **0 of 6** and
none of the six is promotable today. That much is already visible from any of the three
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
runnable artefact behind both of its counts — **and it has since fallen again**, at 0.6.0 on
2026-09-12, making it the only spec on this page to have risen and fallen twice. The cause is the
same as every other demotion here: koine's own next normative edit. What is *not* the same is that
this one closed a **blocking interoperability finding an outside producer had independently
reproduced** (INT-3), which is the first demotion on this page caused by something implementers were
hitting rather than by an internal tidy.

That is the pattern `specs/README.md` describes as *the ratification treadmill*, seen from the other
end: promotion on a prose pass is cheap, so it happened six times; a prose pass leaves nothing a
re-run can execute, so each demotion cost a fresh hand-walk. The conformance gate added on
2026-08-13 is the intervention, Phase F4's delivery on 2026-08-19 supplied the artefact, and KGP's
2026-08-28 promotion is the first one to have gone through it.

## The table

| Spec | Was ratified | Demoted by | What blocks promotion today — the named gate | Owner |
|---|---|---|---|---|
| [KINP](../../specs/identity.md) | 2026-07-17 (0.2.0), held through 0.2.1 | **0.3.0**, 2026-08-23 — the §11 decision 1 federation fold ([ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md)) | Its **only** count, and **the fold is now done — the gate is not.** The cross-authority break test [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran **not clean**; **MA-1, MA-2, MA-3, MA-4** (blocking) and **MA-7** were all folded at **KINP 0.4.0** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), reasoned in [`federation-fold-dispositions.md`](federation-fold-dispositions.md)). **A fold does not close its own gate**, so the count did not close — it *changed shape*, from *fold the deltas* to **a re-run of that pass against the folded text**: Steps 2/3/4/6 must flip and Step 1 is the regression set. **That re-run has now happened — hand-walked on 2026-09-03, and its prose leg is clean** (`chief/89`): Step 1 holds, Steps 2/3/4/6 all flip, no delta of the original pass reproduces against 0.4.0 and no new KINP delta was found, with one declared residual on the fail-closed side (DEFER-A). It was walked against the prose, **not** replayed — **DR-8** is the standing reason. **The prose half of KINP's promotion is therefore discharged, and KINP is still not promotable**, because the **KCS-encoding** condition binds on top of it: `kcs:multi-authority` predates the fold and asserts none of §4.1's weakest-link rule, §4.2's `world_aligns_with`, §4.5's fourth branch, §6's domain-scoping or §3.4's non-federated commons (**DR-8**), so it must be **extended** rather than re-run — the same shape as **DR-7** for KCB count (ii) — and that extension is itself bounded by KCS open question 1 (MA-11). It is downstream work under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) and **unowned**. *Positive evidence, from the 2026-08-24 run:* `kcs:worlds-to-fabric` is the suite's **only fully live** scenario (3/3 roles, verdict `live-pass`) and machine-observed the §4 firewall — `firewall_holds`, two `no_sameas_across_worlds` probes including the full four-hop path, and `based_on_exists` across a non-identity-inheriting world. That is KINP's core property held by a run rather than a reading; it does not touch the MA deltas, which are federation surface the encoding predates. | the fold is **done** ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)) and the re-run is **done** (`chief/89`); the **encoding extension** is **unowned**, downstream |
| [KGP](../../specs/grounding-pack.md) | 2026-07-17 (0.2.0), held through 0.4.0 · **and again 2026-08-28 (0.5.2)** | **0.6.0**, 2026-09-12 — the `arg_types` fold: which canonicalization rule a claim argument is emitted under becomes a registry fact (§3.2 rule 1, INT-3). *Previously* **0.5.0**, 2026-08-02 — retaining the bespoke canonical and specifying the RDF-star / PROV / JSON-LD projection ([ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)) | **One count, created by its own 0.6.0 fold (2026-09-12) — `kcs:worlds-to-fabric` must be EXTENDED, not replayed, and it is unowned.** The fold makes an argument's canonicalization type a registry fact (§3.2 rule 1 reads `arg_types`), closing INT-3; it narrows conformance in the section every `claim` id depends on, so the model-shape rule demoted the spec. The §4.1 fixture's evidence is **untouched** (§4 and §4.1 are byte-unchanged), so that count stays discharged — but the encoding **predates the fold** and every claim in the gating scenario stands on an `id\|id` position, so a replay returns `green` while asserting nothing about it (**DR-7**'s shape on a third spec). What it needs: one claim over a literal-typed position (two producers, one observation, one id) and one refusal over a position the registry does not type — a scenario section here, an encoding downstream. *Everything below was true on 2026-08-28 and stayed true:* its one open item was the §4.1 round-trip fixture — downstream, not a koine edit — verified 2026-08-26 as **not delivered** (the merged work was an emitter with no reader, so rule 2 had never run). The reader, rule-2 enforcement from the recovered graph, a four-pack corpus across three encodings and a mutation test per encoding landed at `agora` **`af5b7dd3a1201eff70067f45e7824614a81769ac`**, and the verdict was re-taken there by **running and perturbing** it — `make check-knowledge` green (152/0), the evidence artifact current under `--check`, and eight hand-made perturbations inside §3.1's hashed set all refused ([`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md)). Its other count — `kcs:worlds-to-fabric` — was already met, and its 2026-08-24 run is recorded and citable: §3.3 claim-id convergence (`claims_converge`, R1) and the §7 license/`local-only` egress filters (R2, both legs `expect: reject`) held on a fully live cast. The two stay **separate evidence for separate things** — **DR-3** records that R3, the §4.1 round-trip, has no encoded counterpart, so the encoding never discharged the fixture and the fixture does not discharge the encoding. *What ratification does not do:* freeze the evidence. The artifact is current only while `check-kgp-roundtrip-evidence` stays green downstream, and a model-shape change returns KGP to `candidate` the ordinary way. | **none** — closed by [`87-kgp-projection-reader-and-roundtrip`](../../tasks/chief/completed/87-kgp-projection-reader-and-roundtrip.json) *(koine)* + `agora chief/84` |
| [KMI](../../specs/media-interchange.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-08-02 — adopting OTIO as the canonical timeline model ([ADR-0005](../../decisions/ADR-0005-otio-canonical-timeline.md)) | **Two** counts, neither closed, and **the fold cleared neither.** (i) §7.1 CAS replication: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran and left **MA-5** blocking (+ MA-10) — four of §7.1's own clauses held under direct attack, but the egress gate had no operand. Both were folded at **KMI 0.3.5** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)): §2 gained optional `license`/`egress`, §7.1(d)(e) made the policy travel with the bytes and barred serving a copy whose policy did not, and §7.1(f) became three-valued. As with KINP the count **changed shape rather than closing** — it became a **re-run of Steps 8–10 against the folded text**. **That re-run has now been walked, by hand on 2026-09-03 (`chief/89`), and the count did NOT close.** Steps 8 and 9 flip — the regression set holds and **MA-5 does not reproduce**, §2's `license`/`egress` giving §7.1(e)'s gate its operand and (d)/(e) closing laundering-by-retention at the retainer — but **Step 10 does not flip**, on a **new delta MA-12** (Med, carrier): §7.1(f) requires a store to answer *not held, and not expected* distinguishably, and **nothing defines a wire for it** — KCB §4's `fetch` is a CAS GET with no response vocabulary, KMI §7 defines *"the payloads, not the pipe"*, KCB cites §7.1(f) nowhere so the inherit-by-citation half of this two-spec delta was never written, and KCB §4.2f already calls a rate-limited refusal a *pending fetch*, so a fourth state shares (f)'s default word on the same verb. MA-8's class of break, one plane over. So the count changed shape a second time: from *re-run* to **fold MA-12** (additive; no `asset` id moves, DEFER-C unmoved), and it is **unowned**. **Then it changed a third time.** Steps 8–10 were **re-attacked on 2026-09-03 (`chief/92`)** after KCB's four counts were walked, because four of those walks' seven findings sit on **one axis** — an operand kept outside a content digest with a declared consequence and nothing carrying it, the axis [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) named — and §2's `license`/`egress` pair is outside the `asset` id by that same design. Step 8 **holds** and Step 10 **re-confirms MA-12** (constraining its fold: a named response vocabulary **on KCB §4's verb**, owed **per request**, never synthesized), but **Step 9 reverses** on new delta **MA-13** (High, structural): §7.1(e) bullet 2 is a MUST over *"an asset's `egress`"*, while §2 makes the pair a **per-asserter** envelope field and the `asset` id binds **bytes** — so two participants holding the same bytes may each assert a conformant envelope with a **different** pair, (d) sources the travelling pair from *"the envelope the requesting participant already holds"*, and a holder with only the permissive one satisfies bullet 1, breaches bullet 2, and **cannot discover** the pair that would have stopped it (no verb returns another envelope for an id, and (d) rightly forbids synthesizing one). **No misbehaviour at any hop**, which is why §2's attribution answer — sufficient for the *downgrade* case — does not reach it. The fold is **KMI-only, additive and mints no field**: (d) names the **serving** participant's evaluated pair as the one that travels, (e) states that the **most restrictive** of the pairs a holder has governs, and bullet 2's MUST is scoped to what a holder can know, with the fail-closed default for **absence** unchanged. Count (i) now reads *fold MA-12 **and** MA-13, then re-run Steps 8–10 again* — **unowned**. (ii) The [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) re-run, which is **KCB's** to do — KMI's OTIO half is already re-validated clean. **It was walked on 2026-09-03 (`chief/92`) and is NOT clean** → **MT-1** (High, a break in KCB §3's path planning). No KMI clause is read differently by that walk, so this count stays open on **KCB's** edit and no KMI work moves it. *One caveat the 2026-08-24 run added:* **DR-4** — the encoding of [`kmi-otio-roundtrip.md`](../../scenarios/kmi-otio-roundtrip.md) is `kcs:media-transform` re-titled over the same fixture and asserts nothing OTIO-specific, so **M-1 and the §4.2a fold are unexercised**. KMI's artefact gate is met **by count, not by content** on that document. It opens no new count, because M-1 is not one of KMI's two — but an owner citing that encoding as evidence for §4.2a would be citing a run that never touched it. **MA-12 was folded on 2026-09-12 (`chief/920`) and the count changed shape a fourth and then a fifth time.** The fold is two-spec, as the second pass said it would have to be: **KCB 0.5.2**'s new **§4.5** names four outcomes on the `fetch` response (`held` / `not-held-pending` / `not-held-not-expected` / `refused`), owed **per request**, never **synthesized**, with absence reading *pending* and §4.2f's *pending fetch* reconciled as the consumer's **handling**; **KMI 0.3.7**'s §7.1(f) names §4.5 as the carrier and mints nothing, because §7 defines *the payloads, not the pipe*. **Then Steps 8–10 were re-run by hand the same day, and count (i) did NOT close.** **MA-12 does not reproduce** — every clause of §4.5 was attacked and none yielded, §7.1(f)'s conclusion rule is preserved word for word, and the *set it can see* premise turns out to be carried already (§7.1(b) routes store discovery through the registry, KCB §3.1's `incomplete[]` reports an incomplete one). **Step 8 holds a third time** (the digest axis separates the same way: an operand outside a digest is a hazard for decisions taken over it, never for the identity the digest establishes). **Step 9 does not flip — MA-13 stands, unfolded**, and §4.5 correctly gives it no route to the missing operand. **Step 10 does not flip**, on two new deltas that are **KCB's** work, not KMI's: **MA-17** (High, carrier) — §4.5(a) forbids a consumer to *infer* an outcome and then fixes **no field, key, header or response envelope** for it, on the one verb §4 types by no protocol, §4.1 audits as *not an MCP call at all* and §4.5 states is not typed by a port, so the implementation-private status string §7.1(f) forbids returns **as the slot** rather than the value, and because absence reads *pending* a store saying *not expected* into an unread slot is **heard to say *pending*** — reproducing with **one store and one authority** — and **MA-18** (Med, mis-route) — (a)'s closing SHOULD routes a `fetch` refusal's *why* to §4.3h, whose two MUSTs name §4.3 as the refusing gate and a posture **class**, both excluded for `fetch` by §4.3a/§4.3f. Both are **one additive KCB-only §4.5(a) edit**. Count (i) now reads *fold **MA-13** (KMI §7.1(d)(e)) and **MA-17 + MA-18** (KCB §4.5(a)), then re-run Steps 8–10 again* — and the half-KMI reading has now held twice: as a **count** it is KMI's and gates §7.1 alone, as **work** it keeps landing on KCB's verb. **MA-13 was folded the same day (`chief/930`) as KMI 0.3.8**: §7.1(d) names the **serving** participant's evaluated pair as the one that travels, §7.1(e) states that the **most restrictive** of the pairs a holder holds or has received governs and that a holder MUST NOT prefer its own ([ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive discipline, reused as ADR-0014 and [KFT](../../specs/fine-tuning.md) §4.2 use it), and (e) bullet 2's MUST is scoped to the pairs a holder holds or has received, with the fail-closed default for **absence** unchanged. KMI-only, additive, minting **no field**; no `asset` id moves, no KGP clause or enforcement point moves, no schema twin is touched, **DEFER-C is unmoved**. It **closes nothing** — a fold does not close its own gate — so count (i) becomes *re-run Steps 8–10 against text carrying **both** folds*. **That re-run was walked by hand the same day, and count (i) does NOT close — for a sixth shape.** **MA-13 does not reproduce**: (d) sources the travelling pair from the one party that must have evaluated it before serving at all, the restriction is **monotone along a chain**, a holder may prefer neither its own pair nor the permissive one, bullet 2 is **meetable**, and bullet 3's fail-closed absence default is byte-unchanged. **Step 8 holds a fourth time**; **Step 10 is unchanged** (MA-17/MA-18 unfolded and **KCB's**); **Step 9 half-flips** on the perimeter of the fold's own sentence, and both new findings are **KMI's own**: **MA-20** (High, carrier) — §7.1(d) permits the pair to accompany a replicated copy and fixes **no shape, field, envelope or attribution** for it in transit, while §2 defines the pair's meaning by its carrier, so what arrives is a §2 field **outside a §2 envelope**: unreadable between two conformant stores (**MA-17's failure on the KMI plane**), unattributable at the receiver, and **silent**, because bullet 3 reads an unread pair as **no pair**; reproduces with **two stores, one authority, one pair** — and **MA-19** (Med-High, collision) — (e)'s **per-axis** reading composes a pair **no participant asserted** and (d) then carries it, against its own MUST NOT synthesize and its own *"passing on an assertion, not making one"* justification; fail-safe, but it **ratchets** and leaves no asserter to appeal to. **One additive KMI-only §7.1(d) edit** for both, the answer being [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)'s — a merge merges **attributions, never contents** — whose first half 0.3.8 did not reuse. So the observation made hours earlier that **KMI had no koine-side item of its own is withdrawn**, and count (i) reads *fold MA-19 + MA-20 (KMI §7.1(d)) and MA-17 + MA-18 (KCB §4.5(a)), then re-run Steps 8–10 again* — all four **unowned**. | (i) folded by [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json) and [`920`](../../tasks/chief/completed/920-fold-ma-12-fetch-answer-carrier.json), re-run **done four times** (`chief/89`, `chief/92`, `chief/920`, `chief/930`) and **not clean** any time; **MA-13** folded 2026-09-12 by [`930`](../../tasks/chief/completed/930-fold-ma-13-most-restrictive-pair.json) as KMI 0.3.8, whose re-run returned **MA-19 + MA-20** (KMI's own, one §7.1(d) edit) — **unowned**; the **MA-17** and **MA-18** folds are **KCB's** and **unowned** · (ii) rides with KCB, walked (`chief/92`) and **not clean** — **unowned** · (iii) the conformance gate fails on two documents (**DR-4**, **DR-8**/**DR-7**) — **unowned**, downstream |
| [KCB](../../specs/capability-bus.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-07-22 — the §2 manifest redefined as an A2A AgentCard extension | **Five** counts as of **0.5.0** (2026-08-26). **All five have now been re-run by hand — (iii) on 2026-09-03 (`chief/89`), (i) (ii) (iv) (v) the same day (`chief/92`) — and NONE of them closes.** (i) Re-run [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) against the extension shape — outstanding since 2026-07-22. **Walked by hand on 2026-09-03 (`chief/92`), and it did NOT close.** The question the count exists to ask is answered *yes* and answered by execution: **F, G, J, K and L all hold** against the card extension, and the three folds that landed on its steps after the count opened (§4.2, §4.3, §4.4) are confirmed additive by running them rather than by citing their own additivity claims. It breaks on new delta **MT-1** (High, structural): §3's path plan names no `(name, version)` per leg and §4.4c(2) resolves a version-free `invoke` to the **granted** major, so a caller that planned over the top-ranked successor and holds a predecessor grant is served the predecessor **silently**, no gate having been breached — the symmetric case to the *highest published* default §4.4c forbids **by name**, and it disagrees not with the grant but with §3's own plan. Fold: §3 names the version a leg was matched over and §4.4c refuses a resolved major that differs from a presented plan leg — additive, KCB-only, and **unowned**. (ii) §7.5 break-test: [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) ran **not clean**, deltas **V-1…V-8** with V-2/V-4/V-5/V-7 blocking; **V-1…V-7 folded at 0.5.0** on 2026-08-26 ([`86`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json)), V-8 closed where it lands — so this count too is now a **re-run of Steps 3, 5, 6, 7, 8, 9 and 10 against the folded text** — the published list mis-filed **Step 6** exactly as *Fold status* had mis-filed Step 3, corrected on the walk. **That re-run was walked by hand on 2026-09-03 (`chief/92`) and did NOT close.** Five flips are clean — V-1, V-4, V-5, the stream half of V-7 and the *declared absence* half of V-2, each **individually** re-checked against the fold — and the regression set holds, so **§7's model was never in question; its perimeter was.** Three new perimeter deltas: **V-9** (High) — `payload_schema_id` is not consumer-verifiable, no verb retrieving the declaration it digests and §7.1 stating a canonicalization for `schema_id` and none for it, so failure mode 2 stays open on the branch that *declares* one; **V-11** (Med-High) — §7.1 step 5's rule id is `MAY`, with a MUST NOT on the branch that does not need it and no MUST on the branch that does, so a `kcb2` digest published under the absent prefix restores V-3's non-recoverable verdict; **V-10** (Med) — §7.2's `binding` row and §2.4 route a MUST to §4.2d's channel *"(§7.3g)"* and §7.3g names no such frame. **And ADR-0014 reproduces here with a single registry and no peering**, so its clause is a precondition of this count too, exactly as the ADR said. All **unowned**. It **also fails the conformance gate**, in a way the other four do not share: the encoding *exists* but predates the fold (**DR-7**), so it must be **extended** to the scenario's new **F1–F13** set before a re-run could assert anything — ten of those thirteen need declared console extensions (V-8), and that work is unowned too. Publishing 0.5.0 additionally discharged §2.2's declared standalone-manifest removal, which closes no count. (iii) §3.1 registry peering: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) left **MA-6** blocking (+ MA-8/MA-9), all three folded at **0.4.9** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)) — so this count too became a **re-run of Steps 5–7 against the folded text**. **That re-run has now been walked, by hand on 2026-09-03 (`chief/89`), and the count did NOT close.** Steps 6 and 7 flip, and inside Step 5 **all three folded deltas hold** under re-attack — MA-9's horizon terminates both re-forward topologies, MA-9's de-duplication converse returns one entry with both `served_by` attributions, and MA-8's three carriers exist. **Step 5 breaks on [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)** — the clause this repo decided on 2026-08-26 and deliberately left unwritten, which the ADR itself says *"lands with counts (ii) and (iii)"*, count (iii) being this walk: §7.3's deprecated marking has no carrier in §2 or §3, §3.1(d)'s converse merges a stale and a fresh attribution into one entry whose marking is undefined, and §3.1(e) cannot fire because the converse removed the visible disagreement. So this count changed shape a second time: from *re-run* to **write ADR-0014's four-part clause**, and it is **unowned**. It consumed no minor: 0.5.0 was reserved for §2.2's removal, and count (ii)'s fold landed there on 2026-08-26 alongside it. (iv) New at 0.4.7: a re-run of [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) against the folded §4.2 — which used to **also fail the conformance gate** (**DR-12**); **corrected 2026-09-03**, `subscription-firehose.ts` landed downstream 2026-08-26 and ran `green`/`partial-live`, so this count was open on its **re-run alone**. **That re-run was walked on 2026-09-03 (`chief/92`) and did NOT close** — though the headline is the other way round: **blocking BP-5 does not reproduce**, §4.2 having put the mechanism between the two peers, §8's parking sentence struck and no clause assigning the host anything; BP-1, BP-2 and BP-4 do not reproduce either. Two new deltas: **BP-7** (Med-High) — §4.2b's *MUST refuse if it cannot honour* is stated **at registration** only and no clause says what a producer owes a **live** adjustment, so §4.2c's *silence is not one of them* stops one paragraph short of the lever the walk needs — and **BP-8** (Med). **Unowned.** (v) New at 0.4.8: a re-run of [`kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md) against the folded §4.3, whose artefact objection (**DR-13**) is **closed the same way and on the same day**, and which additionally carries [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s second-independent-implementation condition (**W3**). **The re-run was walked on 2026-09-03 (`chief/92`) and did NOT close**, on the thinnest margin of the four: **eight of eight AP deltas flip**, blocking **AP-5** included, and one new delta remains — **AP-9** (Med, carrier), §4.3a asserting an effect-class signal on §4.2d's channel that no section names a frame for, and a **minor** bump under §7.2 for a field the table has no row for, which is **BP-8's defect a second time**. **W3 is restated and unmoved**, so even this count would not have closed on a clean walk. **Unowned.** *And the reading hazard is sharpest here:* `kcs:live-schema-mutation` came back **`green` over the four blocking V-deltas** of count (ii), because the encoding deliberately does not assert an unfolded delta (**DR-7**). Nothing in the run discharges any of the five, and the four hand-walks of 2026-09-03 discharge none of them either. **What the four establish together is one sentence:** every folded delta holds under re-attack — F/G/J/K/L, V-1/V-2/V-4/V-5/V-7, BP-1…BP-5 and AP-1…AP-8, **eight of eight** — and **every** new finding is a **carrier** or **perimeter** break, with **four of the six** (V-10, BP-8, AP-9, ADR-0014's marking) the *same* defect on the axis [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) named in advance: an operand deliberately kept **outside** the `schema_id` digest, with a declared consequence and nothing carrying it. **No version and no clause moved on any of the four.** **A SIXTH count arrived and was walked on the same day it was created (2026-09-12, `chief/920`), and it does not close either.** **KCB 0.5.2** folds **MA-12**'s carrier half as new **§4.5** — four named outcomes on the `fetch` response, owed per request, never synthesized, absence reading *pending*, §4.2f reconciled — which is new normative surface on a verb, so count **(vi)** is a re-run of Steps 8–10 of [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) gating §4.5 alone (**the same walk** as KMI count (i), not a second one). **§4.5's model held under attack at every clause and its perimeter did not**: **MA-17** (High, carrier) — the outcomes are named and the field they are read from is not, on the one verb §4 types by no protocol, §4.1 audits as *not an MCP call at all* and §4.5 itself states is not typed by a port, so KMI §7.1(f)'s forbidden implementation-private status string returns **as the slot**; (c)'s fail-safe then makes the failure **silent**, a store saying *not expected* into an unread slot being heard to say *pending*, which is the answer MA-12 was folded to close. It **reproduces with one store and one authority**, the way ADR-0014's carrier gap reproduced with one registry. And **MA-18** (Med, mis-route) — (a)'s closing SHOULD sends a `fetch` refusal's *why* to §4.3h, whose two MUSTs name §4.3 as the gate and a posture **class**, both excluded for `fetch` in terms. **One additive §4.5(a) edit for both**, unowned; count (vi) reads *fold MA-17 and MA-18, then re-run Steps 8–10 again*. **That makes six counts, all six re-run, none closed** — and the axis tally goes to **five**: MA-8, V-10, BP-7, ADR-0014's marking, and now MA-17, every one *a rule with a declared normative consequence and nothing that carries it*. **COUNT (ii) WAS RE-RUN AGAIN ON 2026-09-12 (`chief/940`), AGAINST ITS OWN FOLD, AND IT STILL DOES NOT CLOSE.** **KCB 0.5.3** folds **V-9** (§7.1's new NORMATIVE (a)–(e): the digest is `sha256` over the declaration's **published bytes**, a content address in KINP §3's `asset` form; cross-provider convergence **explicitly not claimed**; retrievability settled by checking §4's five verbs, `fetch` being the only carrier; and **two branches**, retrievable and **provider-attested**, with failure mode 2 *declared* open — no sixth verb and no reserved capability name, both refused on the record) and **V-11** (step 5's third bullet, the **mirror** of the existing MUST NOT, stated by property so it carries to the next rule id; no published digest moves). **Neither reproduces** on the walk. **Step 9's blocker is also gone**: 0.5.1's `deprecated` / `removal_version` carrier discharges ADR-0014 here with a **single registry and no peering**, and MA-14/MA-15/MA-16 do not reach the step because all three live inside §3.1(d)'s federated converse — so **ADR-0014's clause leaves this count's preconditions** and Step 11's V-11 qualification closes. **Nine of this pass's eleven deltas are now folded and hold under re-attack.** Four new perimeter deltas stand beside unfolded **V-10**: **V-12** (High, scope) — §7.1(d)'s retrievable branch is a **content address**, an *integrity* instrument, while failure mode 2 is a *staleness* failure, so `fetch` returns the superseded declaration, the verification cannot fail for the reason that matters, and *compare it against what the port delivers* rests on a document (a) states KCB does not define: **failure mode 2 is open on both branches and declared open on one**, and what would close it is the very verb §7.1 refuses; **V-14** (Med-High) — the new MUST binds the provider and **no clause gives the consumer the reading** for a bare prefix it can locally detect, while the verdict the fold cites is not §7.2's (non-recoverable is defined over a *moved published value*; a mislabel produces a **recomputation** mismatch §7 states no verdict for, so conformant consumers diverge); **V-15** (Med, collision) — §7.3a(a)'s *a deprecation that names no removal is not a deprecation* against §2's `removal_version` **SHOULD** and its *read it as a deprecation with no planned end*, one card state and two conformant readings, with §7.3d/§3's ranking and §7.3c's floor downstream of it; **V-13** (Med) — (d) omits `refused` from §4.5's four outcomes. **Two of the four land on the fold published hours earlier — the third consecutive fold in this repo to break on its own perimeter** (after §4.5's MA-17 and KMI §7.1(d)'s MA-19/MA-20), and the shape is consistent: the mechanism is checked hard and the **claim the prose makes about it** is not. **No version and no clause moved for the walk.** **COUNTS (ii), (iv) AND (v) WERE THEN RE-RUN SEPARATELY ON 2026-09-12 (`chief/950`), AGAINST ONE FOLD, AND NONE OF THE THREE CLOSES.** **KCB 0.5.4** gives §7.2's normative table the `volume` and `effect` rows §4.2a and §4.3a had been declaring a **minor** bump against since 0.4.7 and 0.4.8 — the nearest applicable row read **patch** — and follows the merge-key consequence through to §3.1(d) (four of ADR-0014's five carriers are rescued by the `version` their bump moves; the deprecation marking is not and cannot be, being applied **in place**). **KCB 0.5.5** gives §7.3g a **fourth frame**, `entry_changed`, the carrier three sections had been routing a MUST to (§2.4 and §7.2's `binding` row, §4.3a's class bullet, §7.2's `volume` row) while §7.3g named three frames and none of them was any of the three — one **generic** frame rather than three, riding §4.2d's existing channel, preceding the fact it announces, bounded away from a shape change and from `deprecated`, and with §2.4's *never left to a failed dial* **qualified rather than deleted** (met for the stream holder, not for a cached discovery binding — **DEFER-D**, unmoved). **V-10, BP-8 and AP-9 all fail to reproduce**, each re-attacked on the ground it was filed on. Three verdicts, one per count, never a combined one, and all three against the **prose** — the encodings of all three legs are green and now predate this fold (**DR-7**'s shape, on three counts at once). **(ii)** (Steps 2, 3, 7, 10; 5/6/9/11 restated unmoved, so V-12…V-15 stand as filed) → **V-16** (Med-High, payload): the frame MUST carry the new `version` and MUST **name** which operand moved, and carries **no new value**, so §7.3g's *puts the new address in its hands* and §2.4's *dials the new address* follow only from a re-`describe` **no clause requires** and §7.2's pull-side invariant says is not owed — and `successor_published` carries a `binding` where this frame does not. **(v)** (Step 6) → **AP-10** (Med-High), the same defect on the `effect` axis and sharper: §4.3f evaluates a `subscribe` posture **once at registration**, so §4.3c's intersection has no class to intersect and §4.3d's floor has **no evaluation point** on a live stream; **§4.3 itself needs no change**. **(iv)** (Step 8, Step 1 re-checked) → **nothing**: the same omission was put to `volume` and does **not** bite, because `volume`'s purpose is discrimination *before* binding, §4.2b's subscriber-declared limits still bind, and a moved `volume.cost` fails closed at §5's ceiling under §4.2e — recorded as a **decision**, not an omission — so count (iv) is held open by **BP-7** alone, which no part of this fold touched. V-16 and AP-10 are **one additive, KCB-only §7.3g edit** and **unowned**; they are the **fourth consecutive** fold here to break on its own perimeter rather than its model. **No version and no clause moved for the three walks.** | **All six re-runs are now done and none is clean** — (iii) `chief/89` + `chief/910`, (i) (ii) (iv) (v) `chief/92`, (vi) `chief/920`. Every remaining item is **unowned, in this repo and in every other**: **ADR-0014's** four-part clause — **written at 0.5.1**, and its count-(ii) precondition **discharged by the 2026-09-12 walk**; what remains of it is MA-14/MA-15/MA-16 on count (iii) · the **MT-1** fold (i) · **V-9 and V-11 folded at 0.5.3 and neither reproduces**, leaving **V-10, BP-8 and AP-9 folded at 0.5.4 / 0.5.5 and none reproduces**, leaving the **V-12 + V-13 / V-14 / V-15 / V-16** folds (ii) · the **BP-7** fold (iv) · the **AP-10** fold (v) — V-16 and AP-10 are literally one §7.3g edit · the **MA-17 / MA-18** fold (vi, one §4.5(a) edit) · the **DR-7** encoding extension (ii, downstream) · **ADR-0013 W3** (v, a second independent implementation) |
| [KCS](../../specs/conformance-scenario.md) | 2026-07-18 (0.2.0) — under the **previous** rule, grandfathered | **0.3.0**, 2026-08-20 — the determinism fold (delta Q: `structure_matches`, the stable-invariant rule) | A re-validation of that fold against [`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md). The fold is additive and backward-compatible, and the grandfathered debt the previous rule left it was **paid 2026-08-19** — the nine encodings exist, `kcs:format-stress` among them. §7.1 (assertion extensibility) and §7.3 (recording fidelity) are open **questions**, not gates — and the 2026-08-24 run supplied a re-open input for each: **DR-10** (the downstream §5 vocabulary omits `structure_matches`, the very predicate the 0.3.0 fold added, and declares a `media_map_complete` koine names nowhere, while every document declares `kcs_version: 0.3.0`) and **DR-2** (the evidence artifact records a per-scenario aggregate, not pass/fail per assertion with its cited clause, which is what §7.3 asks about and what [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) assumes a recorded result contains). **DR-10 bore on the re-validation directly** — the determinism fold cannot be exercised by a suite whose vocabulary lacks its predicate — and it was recorded as a *qualification* on that count, not a second gate, because a hand-walk could still discharge what a replay could not. **That hand-walk happened on 2026-09-03 (`chief/90`) and the count did NOT close.** The regression set flips (**M**, **N**, **O**, and the assertion half of **P** — three of them corroborated by the run rather than by the reading alone; **P** carries one declared residual, since no run has ever exceeded a `timeout_ms`, so §4's fails-liveness path is unexercised). **The fold under test half-flips**: byte equality is forbidden normatively, but `structure_matches` is admitted to the fixed core with only that **negative** constraint and its **comparison basis is fixed nowhere** — no slot in §2/§3 where a scenario declares which invariants must match (the signature is fixed at two operands), no plane clause behind the *Determinism/invariants* group where every other §5 predicate delegates to one, and two operands that are content hashes of deliberately-differing bytes. Two conformant runners may return different verdicts for one document and §4's content-addressed report hides the divergence: new blocking delta **R** ([`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md#findings-from-the-re-validation)). So the count **changed shape** rather than closing — from *re-validate the fold* to **fold R (fix the basis in §5, or give §2/§3 a declaration slot), then re-validate again**, a normal minor revision gated by a pressure test. No version and no clause moved on the walk. **DR-10 itself is discharged as a qualification without being fixed, and stays DOWNSTREAM work** under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) — koine specifies the §5 vocabulary and the console implements it, so it MUST NOT be closed by editing the runner from this repo — and it is **unowned**. Worth recording: a replay could not have found R even with the predicate implemented, because one runner is internally consistent and an open basis is invisible from inside it. *Positive evidence, at a scale no single scenario supplies:* nine documents were written in KCS 0.3.0 and all nine parse, replay and produce a content-addressed report; deltas **M**, **O** and **P** all ran as specified; and the §7.1 escape hatch was used as designed, twice, by different authors (**V-8**, **MA-11**). | **unowned** — both the R fold (koine) and DR-10 (downstream) |
| [KFT](../../specs/fine-tuning.md) | 2026-07-23 (0.3.0), on two clean pressure passes | **0.4.0**, 2026-08-06 — the additive FT-M…FT-Q producer-exhaust intake fold | **Two** counts as of **0.6.0** (2026-08-26). (i) The owner's re-run of the *Re-validation — KFT 0.4.0* section of [`e2e-producer-exhaust-finetune.md`](../../scenarios/e2e-producer-exhaust-finetune.md) — which walked clean **as written** and had never been executed. **It has now been executed — hand-walked on 2026-09-03 (`chief/91`) — and the count did NOT close.** Four of five deltas flip and the regression set holds: FT-M's `records[]` slot, FT-O's positional headers, FT-P's `recordCount` and FT-Q's schema citations are all in the prose, the schemas and the registry, and the 0.4.0 fold's additivity claim is confirmed by execution rather than by reading (a 0.3.0-shaped manifest still validates and gates identically). **FT-N half-flips** → new delta **FT-W** (High, gate integrity): §4.2's normative half is intact and stays intact — the gate reads the header, never the `tier` — but the sentence carrying it asserts the header is *the only descriptor available at admission*, and **KMI 0.3.5's MA-5 fold made that false two days after this pass's own downstream run**. A `dataset.records[]` file is a KMI asset, its §2 envelope may now carry its own `egress`, and no clause in either spec ranks the two carriers: a permissive envelope lets KMI §7.1(e) replicate across an authority-domain boundary a corpus §4.2 correctly pinned `local-only`, and the two **absence** defaults are opposite (`exportable` at KFT §4.2, fail-closed at KMI §7.1(e)), so a job declaring `egress` nowhere is admitted here and fails at the fetch, after placement and around FT-J. So the count **changed shape** rather than closing — from *re-run the fold* to **fold FT-W in KFT §4.1/§4.2** (additive, one spec; KMI needs no change, MA-5 being what finally gave §4.2's *"every media asset"* clause the operand it had always assumed) **then re-run that section again** — the same shape KMI count (i) and KCB count (iii) took on the same day, and it is **unowned**. The walk moved no version and no clause. **And its dependency-pin precondition has reopened:** it was **closed** on 2026-08-13 ([`chief/71-kft-dep-repin`](../../tasks/chief/completed/71-kft-dep-repin.json)) for the planes as they stood that day, and the header's own **track-current** rule now fails on three of five pins — KINP reads 0.2.x and is 0.4.0, KCB reads 0.4.x and is 0.5.0, KCS reads 0.2.x and is 0.3.0, all three minor bumps landed 2026-08-26, all three firing the header's re-check trigger. That is a precondition on the **status transition**, not a third gate, and not a finding against the fold. (ii) New at 0.6.0: a re-run of [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md), whose FT-R…FT-V the fold answers — its Steps 2–6 must now walk clean and its Steps 1/7 stay held. Caveat, and it grew: §3.3 and §8.1 were already normative surface **no pass has exercised**, and 0.6.0 is the first fold since the demotion to move §4's admission inputs (a `resume` ref joins §4.2's aggregate and §4.3's union), so §3.4/§4.2/§4.3/§5.4/§6/§7 are **changed** surface too. A cold job — every 0.4.0- and 0.5.0-era manifest — admits on exactly the inputs it did before, which is why (i) does not move. The conformance gate **is** met here — corrected 2026-09-03: `kcs:resume-checkpoint` has existed downstream since 2026-08-26 (`agora` `378fd3c`), walks this leg's seven steps against the **folded** text, and ran **`green`** / `partial-live` in the current evidence artifact; **DR-11 is closed**, and verified by running the gate at `agora` `c971fc2` rather than by reading it. It promotes nothing: the encoding was the precondition, and both counts above are open. The `green` is also the fourth instance of **DR-7**/**DR-8**'s hazard — it sits over a hand-walk that came back not clean, because FT-X and FT-Y are perimeter breaks the encoding does not reach and three of the five deltas are explicitly left unasserted for want of a §5 predicate. The 2026-08-24 run adds a third qualification and one piece of good news. Qualification: the suite pinned **KFT 0.5.0** at that run (it pins **0.7.0** today, checked 2026-09-03 — DR-5's *version* is stale, its *substance* is not), so §3.3's conversion round-trip and §8.1's graded refusals have no encoded assertion at all — every refusal is the ungraded §5 `refused` (**DR-5**) — and the **training-provider** role was a delta-N stand-in in all three KFT passes, so every refusal observed is an admitting-side refusal against a recorded provider (**DR-6**). Good news: the gate itself fired, five times over `expect: reject` steps — one `local-only` record kept a whole run off rented compute, **FT-B** reached the base model's own egress, **FT-A** held §5.4's output inheritance, **FT-D** closed the eval path, and **FT-F** refused `dpo` × `text-to-image` at admission. | **unowned** |

## Cheapest first

Ranked by what a promotion actually costs from here. This ordering is the point of the page.

1. **KGP — promoted 2026-08-28, demoted again 2026-09-12, and back on this list at the top.** The
   0.6.0 argument-type fold is what put it back, and the ranking still holds: what stands between
   KGP and `ratified` is **one scenario extension plus its encoding** — no delta set to fold, no
   clause in dispute, nothing else outstanding — which is the cheapest count on the page and the
   only one where the work is known in full before it starts. Two things it is **not**: not a
   replay (`kcs:worlds-to-fabric` predates the fold and asserts no literal-typed position — DR-7's
   shape), and not free, because the scenario half is koine's and **unowned**.
   *The 2026-08-28 promotion, kept because its lesson outlived it:* KGP ranked first because every koine-side gate
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
   reads six sections cold rather than re-reading walked ones. **The sentence that used to sit here is
   withdrawn**: it read *"the tenth scenario has no KCS encoding, so unlike KCS above, KFT cannot be
   promoted even on a clean re-run until that document is built downstream."* That was **false when
   written** — `console/src/kcs/scenarios/resume-checkpoint.ts` had existed downstream since
   2026-08-26 and had run `green`. See the corrected bullet under *Two facts* below; the artefact
   objection to KFT is gone, and nothing else about this row improves.
   **The first re-run has now happened — 2026-09-03, `chief/91` — and it was not clean, so KFT's cost
   went up rather than down.** Four of the five deltas flip and the regression set holds; **FT-N
   half-flips** on a carrier that did not exist when the fold was written, giving new delta **FT-W**
   (KMI 0.3.5's MA-5 put a second `egress` on the same `dataset.records[]` object, and nothing ranks
   the two). So count (i) is now **a fold plus a re-run**, not a re-run — the third row on this page to
   take that shape on the same day, after KMI count (i) and KCB count (iii). The walk also reopened the
   **dependency-pin precondition** this row had recorded as closed: three of five pins went stale on
   2026-08-26 and the header's own re-check trigger fired unpulled. Neither the FT-W fold nor the pin
   re-read is owned.
   **Gate (ii) has now been walked too — same day, same tasklist — and it was not clean either.** The
   six sections were read cold against `resume`-carrying jobs. *(That walk's own evidence table said
   **no replay available**, citing DR-11. Corrected the same day: a replay existed and was green. It
   corroborates the three flips and could not have produced either new delta — both are **perimeter**
   breaks in KMI §2 and KCB §4.2 that no KFT-scoped encoding reaches. The verdict does not move.)* **FT-R, FT-T and FT-V flip** and Steps 1 and 7 hold. **FT-S and FT-U half-flip**, giving two
   new deltas, and both came from folds that landed *later on 2026-08-26* than KFT 0.6.0 itself:
   **FT-X** (§4.2/§4.3 read the checkpoint's egress class and license off the KMI §2 envelope and state
   no rule for a **silent** one, where KMI 0.3.5 now says *absent is not `exportable`* and §4.2's
   nearest stated default is fail-open — so the FT-S breach returns through the carrier, in-domain,
   where KMI §7.1(e) cannot see it) and **FT-Y** (§3.4's REQUIRED `checkpoint`/`at_step` live only on
   §6's telemetry stream, which KCB §4.2b then made sheddable, leaving §7's MUST-verify with no durable
   source). So count (ii) is **a fold plus a re-run** as well. Both folds are additive and **KFT-only** —
   KMI and KCB need no change — and FT-X belongs in the same §4.2 edit as FT-W. **Neither is owned.**
   **The cold-job independence of the two gates was walked, not assumed, and it holds** — `resume` is
   absent from the schema's top-level `required` and every resume clause is conditioned on its presence
   — so gate (i)'s verdict above stands on its own.
   **The re-rank, now that both gates are in: the ordering does not move, and the margin is thinner
   than it was.** KFT's remaining koine-side work is three additive folds in **one** spec (FT-W and
   FT-X in the same §4.2/§4.3 edit, FT-Y in §5.2/§6) plus two re-runs — less than KMI's two-spec MA-12
   fold below it, and far less than KCB's pile, so it keeps 3rd on volume. It stays ahead of **KINP**
   only on the argument KINP's own row already makes — KINP's last blocker sits *downstream of KCS's
   unresolved open question 1*, which KFT's does not — and that is now the whole of the margin, because
   KINP has no koine-side work at all and KFT has three folds. Anyone re-reading this page after the
   FT-W/FT-X edit lands should expect these two to swap. The **KCS-encoding** condition on gate (ii)
   is a separate axis and is re-checked on its own terms below, not inherited into this ordering. The
   deferral recorded here earlier on 2026-09-03 is discharged.
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
5. **KMI — the re-run happened twice, was not clean either time, and the count grew two folds.**
   MA-5's two optional §2 fields and MA-10's answerable absence went in at **0.3.5** on 2026-08-26,
   additively, with 0.4.0 still spent on the EDL removal. **Steps 8–10 were walked on 2026-09-03
   (`chief/89`)** and count (i) **did not close**: Steps 8 and 9 flip and **MA-5 does not reproduce**,
   but Step 10 broke on a new delta **MA-12** — §7.1(f)'s three answers have no carrier on the verb
   that must deliver them, KCB §4's `fetch` defining no response vocabulary and KCB §4.2f already
   spending the word *pending fetch* on a fourth state. They were then **re-attacked the same day
   (`chief/92`)**, after the four KCB walks, because four of those walks' seven findings sit on **one
   axis** — *an operand kept outside a content digest, with a declared normative consequence and
   nothing carrying it* — and KMI's `license`/`egress` pair is outside the `asset` id by exactly that
   design. Step 8 held (an operand outside a digest is a hazard for **decisions taken over it**, never
   for the identity it establishes — which is why every finding on this axis, on both planes, is a
   carrier or perimeter break and none is a model break), Step 10 re-confirmed MA-12 and narrowed its
   fold's shape, and **Step 9 reversed** → **MA-13** (High, structural): §7.1(e)'s MUST is written over
   *"an asset's `egress`"*, but §2 makes the pair a **per-asserter** envelope field while the `asset` id
   binds **bytes**, so two participants holding the same bytes may each assert a conformant envelope
   with a different pair, and a holder that has only the permissive one satisfies (e) bullet 1,
   breaches bullet 2, and **cannot discover** the pair that would have stopped it. MA-5's laundering
   hole returns through **divergence** rather than absence, with **no misbehaviour at any hop** — which
   is why §2's attribution answer, sufficient for the *downgrade* case the first walk declared a
   residual, does not reach it. So KMI's cost went **up twice**: it is now **two** folds — MA-12 (small,
   additive, spanning **two** specs, KCB §4 + KMI §7.1(f)) and MA-13 (small, additive, **KMI-only**,
   minting no field) — then a re-run of Steps 8–10 again, and only then the wait on **KCB's** count
   (ii), which is not KMI's work and which was itself walked on 2026-09-03 and came back **not clean**
   (**MT-1**). That is what keeps it below KINP in this ranking. All of it is **unowned**. One premise
   worth correcting where it is repeated: count (i) is *KMI's own* as a **count** (it gates §7.1 alone)
   but only half KMI's as **work**, because MA-12's carrier belongs on KCB's verb.
   **MA-12 was then folded on 2026-09-12 (`chief/920`, KCB 0.5.2 §4.5 + KMI 0.3.7 §7.1(f)), Steps
   8–10 were re-run by hand the same day, and count (i) still did not close — for a fifth shape.**
   MA-12 does not reproduce; Step 8 holds a third time; Step 9 does not flip because **MA-13 stands**;
   and Step 10 does not flip on **MA-17** (High, carrier — §4.5(a) names four outcomes and **no field
   to read them from**, on the one verb KCB types by no protocol, so KMI §7.1(f)'s forbidden
   implementation-private status string returns as the **slot**, and because absence reads *pending*
   the failure is silent) and **MA-18** (Med, mis-route). So the *count* is unchanged in kind and the
   *work* moved again onto the other plane: KMI's remaining koine-side item is **MA-13 alone**
   (queued as `chief/930-fold-ma-13-most-restrictive-pair`), and everything else it waits on —
   MA-17 + MA-18, count (ii)'s MT-1 fold, and count (ii)'s re-run — is **KCB's**. The half-KMI
   reading of count (i) has now held twice, which is the strongest form of the coupling the ranking
   table records below.
   **MA-13 was then folded on 2026-09-12 (`chief/930`) as KMI 0.3.8** — §7.1(d) names the **serving**
   participant's evaluated pair as the one that travels, §7.1(e) states that the **most restrictive**
   of the pairs a holder holds or has received governs and that a holder MUST NOT prefer its own
   (ADR-0013's monotone-restrictive discipline, reused as ADR-0014 and KFT §4.2 use it), and (e)
   bullet 2's MUST is scoped to what a holder can know, with the fail-closed default for **absence**
   unchanged. KMI-only, additive, minting no field; **no `asset` id moves**, no KGP clause moves, no
   schema twin is touched, **DEFER-C is unmoved**. It **closes nothing** — a fold does not close its
   own gate, so count (i) becomes a re-run of Steps 8–10 against text carrying **both** MA-12's fold
   and this one — and with it **KMI has no koine-side item of its own left**: everything else it waits
   on is KCB's (MA-17 + MA-18, MT-1, count (ii)'s re-run) or downstream (DR-4, DR-8/DR-7).
   **That re-run was walked the same day and the last sentence did not survive it.** Steps 8–10 against
   **KMI 0.3.8 / KCB 0.5.2** — the first text carrying both folds — and **count (i) does not close, for
   a sixth shape**. **MA-13 does not reproduce**, and the fold reads well under attack: (d) sources the
   travelling pair from the one party that must have evaluated it before serving, the restriction is
   **monotone along a chain** (what travels is the pair *as evaluated under (e)*, and it joins the next
   holder's set to be ranked again), a holder may prefer neither its own pair nor the permissive one,
   bullet 2 is **meetable** where it had been a MUST a conformant holder could be in permanent
   undetectable breach of, and bullet 3's fail-closed absence default is byte-unchanged. **Step 8 holds
   a fourth time** and **Step 10 is unchanged** (MA-17/MA-18 unfolded, KCB's). **Step 9 half-flips**, on
   the perimeter of the fold's own sentence, and both findings are **KMI's own**: **MA-20** (High,
   carrier) — §7.1(d) permits the pair to accompany a replicated copy and fixes **no shape, field,
   envelope or attribution** for it in transit, while §2 defines the pair's *meaning* by its carrier
   (*asserted by whoever asserted the envelope, read off its `prov`*), so what arrives is a §2 field
   **outside a §2 envelope**: two conformant stores put it in different places and neither reads the
   other (**MA-17's failure on the KMI plane**), the receiver cannot attribute what it gets, the one
   thing that would carry attribution is the envelope (d)'s narrowness excludes, and because bullet 3
   fails **closed** an unread pair is heard as **no pair**, so the failure is **silent**; it reproduces
   with **two stores, one authority, one pair** — and **MA-19** (Med-High, collision) — (e)'s **per-axis**
   most-restrictive reading composes, on cross-cutting divergence, a pair **no participant asserted**,
   which (d) then carries against its own MUST NOT synthesize and its own *"passing on an assertion, not
   making one"* justification; fail-safe, so nothing leaks, but it **ratchets** and leaves no domain to
   ask and no asserter to reconcile with, which is precisely the recovery (e)'s asymmetry argument
   rests on. **One additive, KMI-only §7.1(d) edit** for both, and the answer is one this repo already
   decided: [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) merges
   **attributions, never contents** — carry the **set** of attributed pairs, let (e) compose over it to
   decide *this serve*, and keep the composition a derived value rather than the thing that travels.
   0.3.8 reused that ADR's second half and not its first. **So the sentence above is withdrawn**: KMI
   has one koine-side item of its own again, it is **unowned**, and count (i) reads *fold MA-19 + MA-20
   (KMI §7.1(d)) and MA-17 + MA-18 (KCB §4.5(a)), then re-run Steps 8–10 again*.
6. **KCB — the most work, the most implemented, and now the most walked.** **Six** independent
   counts as of 0.5.2 — the sixth arrived on 2026-09-12 with §4.5 (MA-12's carrier half) and was
   walked the same day, returning **MA-17** and **MA-18** and closing nothing. *What follows was
   written of the five that existed on 2026-09-03 and stands unchanged.* **Five** independent
   counts as of 0.5.0. It had **no fold outstanding** — V-1…V-7 landed at 0.5.0 on 2026-08-26, as
   MA-6/MA-8/MA-9 did at 0.4.9 — and **the 2026-09-03 walks gave it seven back**. All five counts have
   now been re-run by hand: count (iii) by `chief/89`, counts (i), (ii), (iv) and (v) by `chief/92`.
   **None of the five closes.**
   **The good news is real and comes first, because it is what a re-attack is for.** Every folded delta
   holds: F/G/J/K/L against the card extension, V-1/V-2/V-4/V-5/V-7 against §2.4/§4.4/§7.1/§7.3g,
   BP-1…BP-5 against §4.2 — **including blocking BP-5**, whose parking sentence §8 no longer carries
   and whose host assignment no clause now makes — and AP-1…AP-8 against §4.3, **eight of eight**,
   including blocking AP-5. §7's model, §4.2's placement and §4.3's monotone-restrictive intersection
   are sound under attack. **No fold is reopened and no model is in question.**
   **Every one of the seven new findings is a carrier or a perimeter break** — a normative consequence
   stated in one section with no field, frame or table row anywhere to carry it. **MT-1** (i): §3's path
   plan names no version per leg and §4.4c(2) silently resolves to the granted major, the symmetric case
   to the *highest published* default §4.4c forbids by name. **V-9**, **V-11**, **V-10** (ii).
   **BP-7**, **BP-8** (iv). **AP-9** (v). And **four of the six distinct defects — V-10, BP-8, AP-9 and
   ADR-0014's marking — are one defect on one axis**, the axis
   [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) named in advance: an
   operand deliberately kept **outside** the `schema_id` digest, with a declared consequence and nothing
   carrying it. That ADR enumerated the five such operands — `cost`, `binding`, `volume`, `effect`, the
   deprecated marking — and observed that only the first two have a declared bump to be rescued by; the
   walks found the other three failing in exactly that way. **V-10, BP-8 and AP-9 are literally one
   edit** to §7.2's table and §7.3g's frame list.
   **So the shape of the pile is now:** **five additive KCB-only folds** collapsing to roughly four
   edits (MA-14 + MA-15 + MA-16 in §3/§3.1(d); MT-1 in §3/§4.4c; V-9 + V-11 in §7.1; V-10 + BP-8 +
   AP-9 in §7.2/§7.3g; BP-7 in §4.2b/d), then **five re-runs again** — every count having changed
   shape rather than closed. *(Updated 2026-09-12: **V-9 + V-11 are folded** at KCB 0.5.3 and neither
   reproduces, and count (ii)'s same-day re-run also **discharged Step 9's ADR-0014 blocker** against
   the 0.5.1 carrier — so that edit leaves the pile and three take its place, **V-12 + V-13** in
   §7.1(d), **V-14** in §7.1 step 5 / §7.2 and **V-15** in §2/§7.3a. The count did not close, because
   **V-10** stands unfolded and would have held it open on a clean walk of the three steps. Updated
   again the same day: **V-10 + BP-8 + AP-9 are folded** at KCB 0.5.4 / 0.5.5 and **none of the three
   reproduces**, so that edit leaves the pile too — and one takes its place, **V-16 + AP-10** in §7.3g,
   one edit for two findings, because the frame that carries the signal names which operand moved and
   never its **new value**. Count (iv) returned **nothing** and is held open by **BP-7** alone. The
   axis tally stays at **five**: V-16 and AP-10 are not *nothing carries it* but *the carrier carries
   too little*.)*
   **ADR-0014's clause is no longer one of them**: it was written at KCB
   **0.5.1** on 2026-09-12, which removed it as a precondition of count (ii) outright — count (ii)'s
   walk had reproduced it with a **single registry and no peering**, making it a base carrier gap
   rather than a federation one, and publishing the carrier discharges that. Count (iii)'s re-run then
   returned **three defects in the new clause**, which is why item 1 of the register below is a fold
   rather than a closure: the pile did not shrink, it changed hands. On top of that sit the two conditions no koine edit reaches:
   **DR-7**, count (ii)'s encoding, which *exists* but predates the fold and must be **extended** to the
   scenario's F1–F13 set (ten of thirteen need declared console extensions), and **W3**, ADR-0013's
   retained second-independent-implementation condition on §4.3. **DR-12 and DR-13 are closed** — the
   §4.2 and §4.3 encodings landed downstream on 2026-08-26 and were verified **by running** the gates at
   `agora` `c971fc2` on 2026-09-03 — so the artefact objection now stands on DR-7 alone.
   **All of it is unowned, in this repo and in every other.**
   *And the reference implementation was re-read at that same sha* (§5.1 of the
   [cross-read](fold-coordination-federation-versioning.md)): **AG-1** and **AG-2** — the two blocking
   ones — **stand unchanged**. The standalone manifest 0.5.0 removed is still `registry/`'s only crawl
   path, and `Capability` still carries no `version` while no port carries a `schema_id`, so §7's
   identity pair is uncarried and the break-test's own premise is not representable there. AG-3 is
   two-thirds closed (a grant now names its issuer and its unit; the granted major is 0.5.0 surface),
   and **AG-5 is closed** in the way that matters: the downstream version register now pins KCB at 0.4.9
   and **declares the 0.5.0 lag with a reason** — a pre-1.0 minor is breaking under that build's own
   compatibility rule, so advancing would make every 0.4.x peer unreadable. That is the reader's
   obligation §7.2 gained in the fold, met by declining to move. **§7 remains unexercised outside this
   tree**, and these are downstream facts stated here, not fixed here.
   **KCB is the spec where reading `green` as a verdict does the most damage**: `kcs:live-schema-mutation`
   and `kcs:multi-authority` both came back green over passes with four and six blocking deltas open
   (**DR-7**, **DR-8**), and three of the four scenarios walked on 2026-09-03 have a green encoding
   sitting over a not-clean hand-walk. **KCB is not promoted by any of this — and would not have been on
   four clean re-runs**, because count (iii) and W3 stand regardless. Clearing four of five is not a
   promotion; clearing none of five is not close to one.

### The ranking, re-derived after the 2026-09-03 walks

**Eleven verdicts across four tasklists** landed on one day — KCS (`chief/90`), KINP + KCB (iii) + KMI
(i) (`chief/89`), KFT ×2 (`chief/91`), KCB ×4 + KMI (i) re-attacked (`chief/92`) — so the ordering
above is re-derived rather than assumed. **It does not move**,
and the useful output is *why*, plus what would move it next.

| # | Spec | koine-side work remaining | Downstream / external | Moved by the walks? |
|---|---|---|---|---|
| 2 | KCS | **1 fold** (R, §5 or §2/§3) + 1 re-validation | DR-10, a *drift*, not a gate | Cost went **up** (was: a reading) |
| 3 | KFT | **3 folds, one spec** (FT-W + FT-X in one §4.1/§4.2/§4.3 edit; FT-Y in §5.2/§6) + 2 re-runs + the reopened pin precondition | none — its encoding exists and ran | Cost went **up** twice |
| 4 | KINP | **none** | the `kcs:multi-authority` **extension** (DR-8), bounded by KCS open question 1 | Cost went **down**; only row with zero koine work |
| 5 | KMI | **2 folds ≈ 2 edits** — **MA-19 + MA-20** (KMI's own, one §7.1(d) edit) and **MA-17 + MA-18** (KCB's, one §4.5(a) edit) — + 1 re-run. **MA-13 was folded 2026-09-12 as KMI 0.3.8 and count (i)'s re-run returned MA-19/MA-20 in its place**, so the *no koine-side item of its own* reading held for hours and is withdrawn | DR-4, DR-8/DR-7 · **plus all of KCB count (i)** | Cost went **up** twice, then **sideways** twice on 2026-09-12 (MA-12 and MA-13 folded; MA-17/MA-18 and then MA-19/MA-20 in their place) |
| 6 | KCB | **7 folds ≈ 5 edits** (ADR-0014's clause written 2026-09-12; count (iii)'s re-run returned MA-14/MA-15/MA-16 in its place, count (vi)'s returned MA-17/MA-18) + 6 re-runs | DR-7's extension · ADR-0013 **W3** | Cost went **up** sevenfold, then **sideways** twice on 2026-09-12 |

Three things this table says that the prose above says only in pieces:

- **KCS keeps 2nd on the dependency argument, not on volume.** Its cost is now a fold plus a
  re-reading, which is no smaller than KFT's per-item cost; it stays ahead because KINP's last blocker
  is bounded by **KCS open question 1**, so KCS sits upstream of row 4 and a swap would invert a
  dependency. R is question 2's clause and does not touch that.
- **KFT and KINP are one edit from swapping**, as the KFT entry already predicted: KINP has no
  koine-side work at all, and the moment FT-W/FT-X lands the volume argument is gone. Nothing on
  2026-09-03 moved that margin either way.
- **Rows 5 and 6 are now coupled, and that is new.** KMI's remainder **strictly contains** KCB count
  (i) — the MT-1 fold and the `e2e-media-transform` re-run are KCB's work and KMI's third condition
  waits on them — so KMI cannot promote before KCB has cleared one of its six. KCB stays last only
  because its remainder contains that *plus* five more counts, a clause and W3. The honest reading is
  that these two rows should be read together: **any promotion argument for KMI is partly a promotion
  argument for KCB's count (i)**. *2026-09-12 tightened this rather than loosening it:* MA-12's fold
  put KMI's §7.1(f) answers on KCB's verb, the re-run then found **MA-17/MA-18 there**, and KMI's
  count (i) now waits on a **KCB** edit for the second time. **MA-13 was folded the same day
  (`chief/930`, KMI 0.3.8)**, and for a few hours that made the coupling total — every remaining item
  on row 5 KCB's or downstream. **The same day's re-run took it back**: Steps 8–10 against the first
  text carrying both folds returned **MA-19 + MA-20**, in KMI's own §7.1(d), the direct perimeter of
  the fold that had emptied the list. So the coupling is **strong but not total**, and the sharper
  reading of these two rows is the one the fourth and fifth passes make together: **a fold does not
  close its own gate, and a re-run is where the fold's perimeter is found** — twice in one day, on two
  specs, each time on the clause written to close the previous finding.

## Two facts that apply to every row

- **The conformance-gate is met for all six — corrected 2026-09-03, and it changes not one row
  above.** This bullet read *"met for four of the six — KFT and KCB are the exceptions"* until today,
  on **DR-11**, **DR-12** and **DR-13**: three scenarios written after the downstream encoding set was
  frozen at nine. All three were encoded at `agora` **`378fd3c`** on **2026-08-26 12:30:18**, in a
  commit that also **regenerated the evidence artifact** (twelve scenarios,
  `sha256-eb8fdc9c…36dd5`, 26 of 44 slots live, verdict `partial-live`, every scenario `green`).
  koine noticed on 2026-09-02 and **verified it by running** both downstream gates at `agora`
  `main` = `c971fc2` on 2026-09-03 — `coverage.test.ts` 3 passed (`KOINE_SCENARIOS.length === 12`,
  set-equal to this repo's `scenarios/*.md`, 0 skipped) and `evidence.test.ts` 13 passed, the
  artifact current under `--check`
  ([`kcs-encoding-gate-verification.md`](kcs-encoding-gate-verification.md) §6.0 and §6.4).
  **Re-taken independently on 2026-09-03** at the same sha rather than inherited from that record —
  `coverage.test.ts` **3 pass / 0 fail** (53 assertions), `evidence.test.ts` **13 pass / 0 fail** (98
  assertions), the artifact reporting itself current — and the two entries that matter name the
  sections they gate in the artifact itself: `kcs:subscription-firehose` → *KCB §4.2*,
  `kcs:cross-owner-posture` → *KCB §4.3 (ADR-0013)*, both `green` / `partial-live`. That is what makes
  them evidence for **those two counts** rather than generic greens — and it is also all they are:
  neither entry claims to close a count, and both sit in the same artifact as
  `kcs:live-schema-mutation`'s green over four blocking deltas.
  **Every count that named one of the three is still open**, on the re-run the encoding was a
  precondition *of*: KFT's two (both walked 2026-09-03, neither clean), KCB's (iv) and (v) (the
  latter also on ADR-0013's **W3**). What survives untouched is the sharper objection — **DR-7** and
  **DR-8**, where an encoding *exists* but **predates the fold it would have to assert**, so it must
  be **extended** rather than re-run; that still binds KCB count (ii) and KINP's only count. The
  lesson is the page's own second rule read in the other direction: this was a **blocking** claim
  that had shipped, and it cost a week.
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

**Updated 2026-09-12 — KCB count (iii)'s remainder changed hands rather than closing.** ADR-0014's
clause was written at **KCB 0.5.1**, the re-run it unblocked was walked by hand the same day, and the
2026-09-03 blocker **does not reproduce**: the carrier exists on both surfaces §7.3d names, the merged
entry's marking is no longer undefined, and §3.1(e) is no longer structurally unable to fire. Step 6
flips, Step 7 half-flips, and **Step 5 does not flip** — three new deltas against the new clause
(**MA-14**, **MA-15**, **MA-16**), all additive, all KCB-only, **one edit between them**, and still
**unowned**. Count (iii) now reads *fold MA-14/MA-15/MA-16, then re-run Steps 5–7 again*. Count (ii)
loses ADR-0014 as a precondition without closing. **No spec version moves for the walk, and KCB is no
more promotable than it was.**

**And neither KCB nor KMI moved a step closer to `ratified` on this walk, even in the counterfactual
where it had been clean.** KCB has **five** counts and KMI **two** *(six and two as of 2026-09-12)*; Steps 5–7 clear at most one of
KCB's and Steps 8–10 at most one of KMI's, and KMI's other count is KCB's work to discharge. This is
the failure the whole page exists to prevent — reading a single satisfied gate as a promotion — and it
is stated here because this walk is the first event that could have invited it.

**Restated after 2026-09-03, when the remaining walks landed and the counterfactual got harder to
dismiss** — and again after 2026-09-12, when KCB's **sixth** count was created and walked on the same
day and also did not close (MA-17, MA-18), and **again the same day when KMI count (i) was re-run
against the first text carrying both the MA-12 and MA-13 folds and did not close either** (MA-19,
MA-20 — KMI's own, in the clause the fold had just written). All of KCB's counts and both of KMI's have now been re-run;
**none closed**, so the
paragraph above holds on the facts. But the interesting version is the one where they had all come back
clean, and it is worth writing down because it is the shape of every future promotion argument on this
page: **KCB would still not be promotable** — count (iii) rested on ADR-0014's then-unwritten clause
and now rests on the three findings its re-run returned (MA-14/MA-15/MA-16), §4.3 carries ADR-0013's
**W3**, and count (ii) carries **DR-7** — and **KMI would still not be promotable**,
because its third condition is the conformance gate and that fails on two documents (**DR-4**,
**DR-8**/**DR-7**). Five clean walks and two clean walks respectively would have moved **zero** rows on
this page. A count is a *necessary* condition; the page's whole reason for existing is that a reader
counting satisfied conditions will conclude otherwise.

**The three things that would have promoted KFT, and which of them happened.** Its ladder entry
named exactly three conditions, and on 2026-09-03 all three were taken rather than assumed. (1) The
**artefact** — met, and met for a week before koine knew it; DR-11 is closed. (2) Gate **(i)**, the
FT-M…FT-Q intake fold executed rather than re-read — **not clean**, new delta **FT-W**. (3) Gate
**(ii)**, six sections read cold against `resume`-carrying jobs — **not clean**, new deltas **FT-X**
and **FT-Y**. So the one condition that was believed blocking was already discharged, and the two
believed to be formalities were not. **KFT is not promotable**, and the reason has changed shape
entirely: it is three additive KFT-only folds (FT-W + FT-X in one §4.1/§4.2/§4.3 edit, FT-Y in
§5.2/§6) followed by two re-runs, plus the reopened dependency-pin precondition on its header — all
of it koine-side work, and **none of it owned**. Recorded here because the counterfactual is the
trap this page exists to catch: had either gate come back clean, the artefact answer would have been
the difference between promoting and not, and koine's own record would have got it wrong.

**The eight things that stand between KCB and `ratified`, and who owns each.** KCB's row is the
longest on the page, so the register is pulled out flat. *Unowned* means unowned by any tasklist in
any repo, and it is recorded that way deliberately rather than parked against a tasklist that would
make it look otherwise.

| # | What | Where it lands | Kind | Owner |
|---|---|---|---|---|
| 1 | **MA-14 + MA-15 + MA-16 — one edit, three findings.** [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)'s four-part clause **is written** (KCB **0.5.1**, 2026-09-12), and the count (iii) re-run it unblocked returned three defects in it: §3.1(d)(i)'s **per-attribution form is not a shape** (MA-14); (i) and (ii) **collide on `deprecated`**, with §7.3d defining *marking* as the field, so the derived reading is circular (MA-15); and the merge rule reaches a **capability entry** while the address and issuer list a consumer dials with ride on the **manifest**, where (e) is circular for a disputed `params.mcp` (MA-16). MA-14 and MA-15 are in the ADR's Decision verbatim; the decision is **not** reopened | KCB §3/§3.1(d) — **count (iii)**; count (ii) no longer waits on it, the carrier being published | koine, additive | **unowned** |
| 2 | **MT-1** — §3 names the version a path leg was matched over; §4.4c refuses a resolved major that differs from a presented plan leg | KCB §3/§4.4c — count (i) | koine, additive | **unowned** |
| 3 | **V-12 + V-13 + V-14 + V-15 — four findings, three edits**, and **V-9 + V-11 are done**: folded at KCB **0.5.3** (2026-09-12) and **neither reproduces** on the re-run the same day. What that re-run returned in their place: §7.1(d)'s retrievable branch is a **content address**, an *integrity* instrument, while failure mode 2 is a *staleness* failure — `fetch` returns the superseded declaration and the verification cannot fail for the reason that matters — so failure mode 2 is open on **both** branches and declared open on one (**V-12**, High, scope), and (d) omits `refused` from §4.5's four outcomes (**V-13**, Med); step 5's new MUST binds the provider and **no clause gives the consumer the reading** for a bare prefix it can locally detect, while §7.2's non-recoverable verdict is defined over a *moved published value* and a mislabel produces a **recomputation** mismatch §7 states no verdict for (**V-14**, Med-High); and §7.3a(a)'s *a deprecation that names no removal is not a deprecation* collides with §2's `removal_version` **SHOULD** and its *read it as a deprecation with no planned end*, one card state with two conformant readings (**V-15**, Med, collision — MA-15's shape, reproducing with one registry) | KCB §7.1(d), §7.1 step 5/§7.2, §2/§7.3a — count (ii) | koine, additive | **unowned** |
| 4 | **V-16 + AP-10 — one edit, two findings**, and **V-10 + BP-8 + AP-9 are done**: folded at KCB **0.5.4** (§7.2's `volume` and `effect` rows) and **0.5.5** (§7.3g's fourth frame, `entry_changed`), and **none of the three reproduces** on the three re-runs the same day. What those re-runs returned in their place is one defect on two axes: the frame MUST carry the new `version` and MUST **name** which operand moved, and carries **no new value** — so §7.3g's *puts the new address in its hands* and §2.4's *dials the new address* follow only from a re-`describe` no clause requires (**V-16**, Med-High, count (ii)), and a live subscriber told *`effect` moved* has no class to feed §4.3c's intersection while §4.3f evaluates a `subscribe` posture **once at registration**, leaving §4.3d's floor no evaluation point on a live stream (**AP-10**, Med-High, count (v)). The fix is one §7.3g edit — carry the new **value** of each operand named, scoped to its port, as `successor_published` already carries a successor's `binding`. Count **(iv)** returned **nothing**: the same omission was put to `volume` and does not bite | KCB §7.3g — counts (ii) and (v) | koine, additive | **unowned** |
| 5 | **BP-7** — what a producer owes a **live** rate adjustment on §4.2d's channel, extending §4.2b's honour-or-refuse rule past registration | KCB §4.2b/d — count (iv) | koine, additive | **unowned** |
| 6 | **DR-7** — `kcs:live-schema-mutation` *exists* but **predates** the fold, so it must be **extended** to the scenario's F1–F13 set (ten of thirteen need declared console extensions) before a re-run asserts anything about §7 | downstream, under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) — count (ii) | not a koine edit | **OWNED since 2026-09-11 — agora.** It had been recorded as *unowned, downstream* here while agora recorded it as *unowned, upstream*: a dependency both sides could see and neither held. agora now carries the substantive row; this count re-runs once the extension lands |
| 7 | **W3** — [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s retained **second independent implementation** of §4.3, kept as a ratification condition beside the pressure test | external to koine — count (v) | not a koine edit | **unowned** |
| 8 | **MA-17 + MA-18 — one edit, two findings**, and the **newest count's first walk returned them on the day it was created**. §4.5 (KCB 0.5.2) folds MA-12's carrier half and then leaves its own outcome **unlocatable**: (a) forbids a consumer to *infer* an outcome and fixes **no field** for it, on the one verb §4 types by no protocol, §4.1 audits as *not an MCP call at all* and §4.5 states is not typed by a port — so the implementation-private status string KMI §7.1(f) forbids returns **as the slot**, and (c)'s absence-reads-*pending* makes the failure silent (MA-17, High, reproducing with **one store and one authority**); and (a)'s closing SHOULD routes a `fetch` refusal's *why* to §4.3h, whose MUSTs name §4.3 and a posture **class**, both excluded for `fetch` by §4.3a/§4.3f (MA-18, Med) | KCB §4.5(a) — count (vi) | koine, additive | **unowned** |

*Ownership, as of 2026-09-12 and read rather than assumed:* the **Owner** column above is about who
has taken the work, and this repo's `tasks/chief/` holds a **queued** tasklist naming item (2)
(`960-fold-mt-1-version-per-plan-leg`) and one naming item (5) (`970-fold-bp-7-live-adjustment`).
*Queued* is not *merged* and neither has run, so no count moves and no cell above is marked met — but
a reader should not take them for un-scheduled. Two tasklists **have** run, and both left their item
in the same place: `940-fold-v-9-and-v-11` folded V-9 and V-11 at KCB 0.5.3 and re-ran count (ii) the
same day, which is why item (3) names the **four findings that re-run returned** rather than the two
it folded; `950-fold-v-10-bp-8-ap-9` folded V-10, BP-8 and AP-9 at KCB 0.5.4 / 0.5.5 and re-ran
counts **(ii), (iv) and (v)** separately the same day, which is why item (4) now names **V-16 and
AP-10**. **No count moved for either**, and both items are again **unowned** — which is the pattern
this register exists to make visible: a fold that lands cleanly and a count that closes are different
events, and so far only the first has happened. Items (1) and (8) have no tasklist, and (6) and (7) are not koine work at all.

Then all six counts are re-run. Items 1–5 and 8 are additive and KCB-only; **items 6 and 7 are not
koine work at all**, which is the reason a reader who watches only this repo will see KCB stop moving before
it is promotable. Two downstream facts belong beside them and are stated here rather than filed
there: **AG-1** — the standalone `/.well-known/kcb-manifest.json` that 0.5.0 removed is still the
reference registry's **only** crawl path — and **AG-2** — its manifest type carries neither a
capability `version` nor a port `schema_id`, so §7's identity pair is uncarried and the break-test's
premise is not representable. Both were re-confirmed at `agora` `c971fc2` on 2026-09-03
([`fold-coordination-federation-versioning.md`](fold-coordination-federation-versioning.md) §5.1).
**§7 — the largest thing KCB has folded — is unexercised outside this tree.**

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
