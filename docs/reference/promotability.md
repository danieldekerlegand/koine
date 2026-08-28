# Promotability — what stands between each spec and `ratified`

> **Status:** Current · **Updated:** 2026-08-28 · **Owner:** koine · **Informative**

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
| [KINP](../../specs/identity.md) | 2026-07-17 (0.2.0), held through 0.2.1 | **0.3.0**, 2026-08-23 — the §11 decision 1 federation fold ([ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md)) | Its **only** count, and **the fold is now done — the gate is not.** The cross-authority break test [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran **not clean**; **MA-1, MA-2, MA-3, MA-4** (blocking) and **MA-7** were all folded at **KINP 0.4.0** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), reasoned in [`federation-fold-dispositions.md`](federation-fold-dispositions.md)). **A fold does not close its own gate**, so the count did not close — it *changed shape*, from *fold the deltas* to **a re-run of that pass against the folded text**: Steps 2/3/4/6 must flip and Step 1 is the regression set. That re-run is **unowned**, and it is the only thing between KINP and the prose half of promotion. The **KCS-encoding** condition binds on top of it and is itself gated on KCS open question 1 (MA-11). *Positive evidence, from the 2026-08-24 run:* `kcs:worlds-to-fabric` is the suite's **only fully live** scenario (3/3 roles, verdict `live-pass`) and machine-observed the §4 firewall — `firewall_holds`, two `no_sameas_across_worlds` probes including the full four-hop path, and `based_on_exists` across a non-identity-inheriting world. That is KINP's core property held by a run rather than a reading; it does not touch the MA deltas, which are federation surface the encoding predates. | the fold is **done** ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)); the re-run is **unowned** |
| [KGP](../../specs/grounding-pack.md) | 2026-07-17 (0.2.0), held through 0.4.0 · **and again 2026-08-28 (0.5.2)** | **0.5.0**, 2026-08-02 — retaining the bespoke canonical and specifying the RDF-star / PROV / JSON-LD projection ([ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)) | **Nothing. Both counts are discharged and KGP is `ratified` again as of 2026-08-28.** Its one open item was the §4.1 round-trip fixture — downstream, not a koine edit — verified 2026-08-26 as **not delivered** (the merged work was an emitter with no reader, so rule 2 had never run). The reader, rule-2 enforcement from the recovered graph, a four-pack corpus across three encodings and a mutation test per encoding landed at `agora` **`af5b7dd3a1201eff70067f45e7824614a81769ac`**, and the verdict was re-taken there by **running and perturbing** it — `make check-knowledge` green (152/0), the evidence artifact current under `--check`, and eight hand-made perturbations inside §3.1's hashed set all refused ([`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md)). Its other count — `kcs:worlds-to-fabric` — was already met, and its 2026-08-24 run is recorded and citable: §3.3 claim-id convergence (`claims_converge`, R1) and the §7 license/`local-only` egress filters (R2, both legs `expect: reject`) held on a fully live cast. The two stay **separate evidence for separate things** — **DR-3** records that R3, the §4.1 round-trip, has no encoded counterpart, so the encoding never discharged the fixture and the fixture does not discharge the encoding. *What ratification does not do:* freeze the evidence. The artifact is current only while `check-kgp-roundtrip-evidence` stays green downstream, and a model-shape change returns KGP to `candidate` the ordinary way. | **none** — closed by [`87-kgp-projection-reader-and-roundtrip`](../../tasks/chief/87-kgp-projection-reader-and-roundtrip.json) *(koine)* + `agora chief/84` |
| [KMI](../../specs/media-interchange.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-08-02 — adopting OTIO as the canonical timeline model ([ADR-0005](../../decisions/ADR-0005-otio-canonical-timeline.md)) | **Two** counts, neither closed, and **the fold cleared neither.** (i) §7.1 CAS replication: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran and left **MA-5** blocking (+ MA-10) — four of §7.1's own clauses held under direct attack, but the egress gate had no operand. Both were folded at **KMI 0.3.5** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)): §2 gained optional `license`/`egress`, §7.1(d)(e) made the policy travel with the bytes and barred serving a copy whose policy did not, and §7.1(f) became three-valued. As with KINP the count **changed shape rather than closing** — it is now a **re-run of Steps 8–10 against the folded text**, and it is **unowned**. (ii) The [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) re-run, which is **KCB's** to do — KMI's OTIO half is already re-validated clean. *One caveat the 2026-08-24 run added:* **DR-4** — the encoding of [`kmi-otio-roundtrip.md`](../../scenarios/kmi-otio-roundtrip.md) is `kcs:media-transform` re-titled over the same fixture and asserts nothing OTIO-specific, so **M-1 and the §4.2a fold are unexercised**. KMI's artefact gate is met **by count, not by content** on that document. It opens no new count, because M-1 is not one of KMI's two — but an owner citing that encoding as evidence for §4.2a would be citing a run that never touched it. | (i) folded by [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), re-run **unowned** · (ii) rides with KCB — **unowned** |
| [KCB](../../specs/capability-bus.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-07-22 — the §2 manifest redefined as an A2A AgentCard extension | **Five** counts as of **0.5.0** (2026-08-26), none closed. (i) Re-run [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) against the extension shape — outstanding since 2026-07-22 and **unowned**. (ii) §7.5 break-test: [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) ran **not clean**, deltas **V-1…V-8** with V-2/V-4/V-5/V-7 blocking; **V-1…V-7 folded at 0.5.0** on 2026-08-26 ([`86`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json)), V-8 closed where it lands — so this count too is now a **re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text**, and **unowned**. It **also fails the conformance gate**, in a way the other four do not share: the encoding *exists* but predates the fold (**DR-7**), so it must be **extended** to the scenario's new **F1–F13** set before a re-run could assert anything — ten of those thirteen need declared console extensions (V-8), and that work is unowned too. Publishing 0.5.0 additionally discharged §2.2's declared standalone-manifest removal, which closes no count. (iii) §3.1 registry peering: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) left **MA-6** blocking (+ MA-8/MA-9), all three folded at **0.4.9** on 2026-08-26 ([`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)) — so this count too is now a **re-run of Steps 5–7 against the folded text**, and **unowned**. It consumed no minor: 0.5.0 was reserved for §2.2's removal, and count (ii)'s fold landed there on 2026-08-26 alongside it. (iv) New at 0.4.7: a re-run of [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) against the folded §4.2 — and **this count also fails the conformance gate** (**DR-12**, above): that scenario has no KCS encoding and none is owned, so a clean re-run would be necessary but not sufficient. (v) New at 0.4.8: a re-run of [`kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md) against the folded §4.3, which **fails the conformance gate the same way** (**DR-13**) and additionally carries [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s second-independent-implementation condition (**W3**). *And the reading hazard is sharpest here:* `kcs:live-schema-mutation` came back **`green` over the four blocking V-deltas** of count (ii), because the encoding deliberately does not assert an unfolded delta (**DR-7**). Nothing in the run discharges any of the five. | (ii) [`86-fold-the-capability-versioning-breaks`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json) · (iii) folded by [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json), re-run **unowned** · (i) (iv) (v) **unowned** |
| [KCS](../../specs/conformance-scenario.md) | 2026-07-18 (0.2.0) — under the **previous** rule, grandfathered | **0.3.0**, 2026-08-20 — the determinism fold (delta Q: `structure_matches`, the stable-invariant rule) | A re-validation of that fold against [`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md). The fold is additive and backward-compatible, and the grandfathered debt the previous rule left it was **paid 2026-08-19** — the nine encodings exist, `kcs:format-stress` among them. §7.1 (assertion extensibility) and §7.3 (recording fidelity) are open **questions**, not gates — and the 2026-08-24 run supplied a re-open input for each: **DR-10** (the downstream §5 vocabulary omits `structure_matches`, the very predicate the 0.3.0 fold added, and declares a `media_map_complete` koine names nowhere, while every document declares `kcs_version: 0.3.0`) and **DR-2** (the evidence artifact records a per-scenario aggregate, not pass/fail per assertion with its cited clause, which is what §7.3 asks about and what [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) assumes a recorded result contains). **DR-10 bears on the re-validation directly:** the determinism fold cannot be exercised by a suite whose vocabulary lacks its predicate. *Positive evidence, at a scale no single scenario supplies:* nine documents were written in KCS 0.3.0 and all nine parse, replay and produce a content-addressed report; deltas **M**, **O** and **P** all ran as specified; and the §7.1 escape hatch was used as designed, twice, by different authors (**V-8**, **MA-11**). | **unowned** |
| [KFT](../../specs/fine-tuning.md) | 2026-07-23 (0.3.0), on two clean pressure passes | **0.4.0**, 2026-08-06 — the additive FT-M…FT-Q producer-exhaust intake fold | **Two** counts as of **0.6.0** (2026-08-26). (i) The owner's re-run of the *Re-validation — KFT 0.4.0* section of [`e2e-producer-exhaust-finetune.md`](../../scenarios/e2e-producer-exhaust-finetune.md) — walks clean **as written**, never executed; its dependency-pin precondition is **closed** ([`chief/71-kft-dep-repin`](../../tasks/chief/completed/71-kft-dep-repin.json)). (ii) New at 0.6.0: a re-run of [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md), whose FT-R…FT-V the fold answers — its Steps 2–6 must now walk clean and its Steps 1/7 stay held. Caveat, and it grew: §3.3 and §8.1 were already normative surface **no pass has exercised**, and 0.6.0 is the first fold since the demotion to move §4's admission inputs (a `resume` ref joins §4.2's aggregate and §4.3's union), so §3.4/§4.2/§4.3/§5.4/§6/§7 are **changed** surface too. A cold job — every 0.4.0- and 0.5.0-era manifest — admits on exactly the inputs it did before, which is why (i) does not move. And the conformance gate is **not** met here: the tenth scenario has no KCS encoding yet (**DR-11**). The 2026-08-24 run adds a third qualification and one piece of good news. Qualification: the suite pins **KFT 0.5.0**, so §3.3's conversion round-trip and §8.1's graded refusals have no encoded assertion at all — every refusal is the ungraded §5 `refused` (**DR-5**) — and the **training-provider** role was a delta-N stand-in in all three KFT passes, so every refusal observed is an admitting-side refusal against a recorded provider (**DR-6**). Good news: the gate itself fired, five times over `expect: reject` steps — one `local-only` record kept a whole run off rented compute, **FT-B** reached the base model's own egress, **FT-A** held §5.4's output inheritance, **FT-D** closed the eval path, and **FT-F** refused `dpo` × `text-to-image` at admission. | **unowned** |

## Cheapest first

Ranked by what a promotion actually costs from here. This ordering is the point of the page.

1. **KGP — done, 2026-08-28. It is off this list.** It ranked first because every koine-side gate
   was already discharged and what remained was one downstream deliverable, built in agora under
   [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md). That deliverable arrived
   (`agora chief/84`), [`87`](../../tasks/chief/87-kgp-projection-reader-and-roundtrip.json) re-took the
   verdict against it obligation by obligation, and the owner promoted. **The ranking's premise held:
   the cheapest promotion on the page was the one that happened, and it still cost an artifact plus an
   audit of that artifact — not a status edit.** The rows below inherit the same bar.
2. **KCS — a re-validation, no fold, now with a snag under it.** The 0.3.0 change was additive and
   backward-compatible against a scenario that exists and whose encoding runs. This is a
   read-and-confirm pass, and nobody owns it. What the 2026-08-24 run added is **DR-10**: the
   downstream §5 vocabulary has no `structure_matches`, which is the predicate the 0.3.0 fold
   *is*, so the re-validation cannot be discharged by a machine replay of that clause — a
   hand-walk still can, and the drift is downstream work either way.
3. **KFT — two re-runs, one missing artefact, and more cold reading than it looks.** One re-run is
   the KCS shape (re-run a section that already walks clean); the other is the new resume-checkpoint
   leg 0.6.0 folded on 2026-08-26. The asterisk grew with it: §3.3 and §8.1 were already
   unexercised, and 0.6.0 changed §4's admission inputs for `resume`-carrying jobs, so the owner
   reads six sections cold rather than re-reading walked ones. It also **lost its place in this
   ranking's premise** — the tenth scenario has no KCS encoding, so unlike KCS above, KFT cannot be
   promoted even on a clean re-run until that document is built downstream. Still unowned, now on
   two fronts.
4. **KMI — the fold landed; now a re-run, then a wait.** MA-5's two optional §2 fields and MA-10's
   answerable absence went in at **0.3.5** on 2026-08-26, additively, with 0.4.0 still spent on the
   EDL removal. What is left on count (i) is a **re-run of Steps 8–10**, which nobody owns; after
   that KMI is blocked on **KCB's** re-run, which is not KMI's work. Its position in this ranking
   did not move — the cost simply shifted from *writing clauses* to *walking a scenario*.
5. **KINP — the real work is done, and it moved KINP up this list in substance if not in rank.**
   The four blocking deltas plus MA-7 landed at **0.4.0** on 2026-08-26: §6's convergence target is
   domain-scoped, §4.5 has its fail-closed fourth branch, §4.2 has `world_aligns_with`, §4.1 carries
   the weakest issuer, and §3.4 says plainly that the prefix registry is the one **non-federated**
   commons. None required redesign and every one is additive, exactly as the scenario predicted.
   **What remains is a single re-run and nothing else** — KINP has no second count, no downstream
   deliverable of its own, and no fold outstanding. It is now the cheapest *koine-side* promotion on
   this page after KGP, and the only reason it does not rank above KCS and KFT is that its re-run is
   a full four-step hand-walk of a not-clean pass rather than a read-and-confirm — and that it is
   **unowned**.
6. **KCB — the most work, and the most implemented.** **Five** independent counts as of 0.5.0, **no
   fold outstanding** — V-1…V-7 landed at 0.5.0 on 2026-08-26, as MA-6/MA-8/MA-9 did at 0.4.9 — so
   what remains is **four re-runs of folded text**, a re-run outstanding since 2026-07-22, and
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
what the three counts read as is a **re-run of the scenario against the folded text**, which is
**unowned by any tasklist in any repo**. The three specs are therefore correct to keep citing the
**scenario**, not a tasklist: the scenario is the artefact a re-run executes and it does not move,
whereas every tasklist that has ever owned a leg of this work is now in `completed/`. The general
rule, and it is the one KGP's six-day stale gate teaches: **point a gate at the artefact that
discharges it, and name the owner separately** — because owners retire and artefacts do not.

An unowned gate is the honest state and is recorded as such here rather than parked against a
tasklist that would make it look scheduled. Three of the six specs (KINP, KMI count (i), KCB count
(iii)) are waiting on one re-run of one document that nobody has picked up.

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
