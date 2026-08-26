# Promotability — what stands between each spec and `ratified`

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

Six specs, all `candidate`, none promotable today. That much is already visible from any of the
three status tables. What none of them says is **why** — which spec is one downstream artifact away
from `ratified` and which needs an eleven-delta fold first, or which specs fell from `ratified` as
opposed to never having reached it.

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
next normative edit — not by an implementer finding a defect, and not by an upstream break.

That is the pattern `specs/README.md` describes as *the ratification treadmill*, seen from the other
end: promotion on a prose pass is cheap, so it happened six times; a prose pass leaves nothing a
re-run can execute, so each demotion cost a fresh hand-walk. The conformance gate added on
2026-08-13 is the intervention, and Phase F4's delivery on 2026-08-19 means the next promotion is
the first one that will have a runnable artefact behind it.

## The table

| Spec | Was ratified | Demoted by | What blocks promotion today — the named gate | Owner |
|---|---|---|---|---|
| [KINP](../../specs/identity.md) | 2026-07-17 (0.2.0), held through 0.2.1 | **0.3.0**, 2026-08-23 — the §11 decision 1 federation fold ([ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md)) | Its **only** count: the cross-authority break test, written and run as [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md), which did **not** run clean. Deltas **MA-1, MA-2, MA-3, MA-4** are blocking here (MA-7 should-fix) and **none is folded**. The fold, then a re-run. *Positive evidence, from the 2026-08-24 run:* `kcs:worlds-to-fabric` is the suite's **only fully live** scenario (3/3 roles, verdict `live-pass`) and machine-observed the §4 firewall — `firewall_holds`, two `no_sameas_across_worlds` probes including the full four-hop path, and `based_on_exists` across a non-identity-inheriting world. That is KINP's core property held by a run rather than a reading; it does not touch the MA deltas, which are federation surface the encoding predates. | [`85-fold-the-federation-breaks`](../../tasks/chief/85-fold-the-federation-breaks.json) |
| [KGP](../../specs/grounding-pack.md) | 2026-07-17 (0.2.0), held through 0.4.0 | **0.5.0**, 2026-08-02 — retaining the bespoke canonical and specifying the RDF-star / PROV / JSON-LD projection ([ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)) | One item, and it is **downstream, not a koine edit**: the §4.1 round-trip fixture. Verified 2026-08-26 as **not delivered** — the merged work is an emitter with no reader, so §4.1 rule 2 (re-derive the claim id, reject on disagreement) has never run ([`kgp-projection-gate-verification.md`](kgp-projection-gate-verification.md)). KGP's other count — `kcs:worlds-to-fabric` — **is** met, and the 2026-08-24 run of it is now recorded and citable: §3.3 claim-id convergence (`claims_converge`, R1) and the §7 license/`local-only` egress filters (R2, both legs `expect: reject`) held on a fully live cast. But the run **does not narrow the gap above** — **DR-3** records that R3, the §4.1 projection round-trip, has no encoded counterpart, since KCS §5 has no round-trip predicate. A reader taking `live-pass` here as discharging the fixture gate has misread it. | [`87-kgp-projection-reader-and-roundtrip`](../../tasks/chief/87-kgp-projection-reader-and-roundtrip.json) *(agora)* |
| [KMI](../../specs/media-interchange.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-08-02 — adopting OTIO as the canonical timeline model ([ADR-0005](../../decisions/ADR-0005-otio-canonical-timeline.md)) | **Two** counts, neither closed. (i) §7.1 CAS replication: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) ran and left **MA-5** blocking (+ MA-10) — four of §7.1's own clauses held under direct attack, but the egress gate has no operand. (ii) The [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) re-run, which is **KCB's** to do — KMI's OTIO half is already re-validated clean. *One caveat the 2026-08-24 run added:* **DR-4** — the encoding of [`kmi-otio-roundtrip.md`](../../scenarios/kmi-otio-roundtrip.md) is `kcs:media-transform` re-titled over the same fixture and asserts nothing OTIO-specific, so **M-1 and the §4.2a fold are unexercised**. KMI's artefact gate is met **by count, not by content** on that document. It opens no new count, because M-1 is not one of KMI's two — but an owner citing that encoding as evidence for §4.2a would be citing a run that never touched it. | (i) [`85`](../../tasks/chief/85-fold-the-federation-breaks.json) · (ii) rides with KCB — **unowned** |
| [KCB](../../specs/capability-bus.md) | 2026-07-17 (0.2.0) | **0.3.0**, 2026-07-22 — the §2 manifest redefined as an A2A AgentCard extension | **Four** counts as of **0.4.7** (2026-08-26), none closed. (i) Re-run [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) against the extension shape — outstanding since 2026-07-22 and **unowned**. (ii) §7.5 break-test: [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) ran **not clean**, deltas **V-1…V-8** with V-2/V-4/V-5/V-7 blocking, all additively foldable into 0.5.0. (iii) §3.1 registry peering: [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) left **MA-6** blocking (+ MA-8/MA-9). (iv) New at 0.4.7: a re-run of [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) against the folded §4.2 — and **this count also fails the conformance gate** (**DR-12**, above): that scenario has no KCS encoding and none is owned, so a clean re-run would be necessary but not sufficient. *And the reading hazard is sharpest here:* `kcs:live-schema-mutation` came back **`green` over the four blocking V-deltas** of count (ii), because the encoding deliberately does not assert an unfolded delta (**DR-7**). Nothing in the run discharges any of the four. | (ii) [`86-fold-the-capability-versioning-breaks`](../../tasks/chief/86-fold-the-capability-versioning-breaks.json) · (iii) [`85`](../../tasks/chief/85-fold-the-federation-breaks.json) · (i) **unowned** |
| [KCS](../../specs/conformance-scenario.md) | 2026-07-18 (0.2.0) — under the **previous** rule, grandfathered | **0.3.0**, 2026-08-20 — the determinism fold (delta Q: `structure_matches`, the stable-invariant rule) | A re-validation of that fold against [`kcs-format-stress.md`](../../scenarios/kcs-format-stress.md). The fold is additive and backward-compatible, and the grandfathered debt the previous rule left it was **paid 2026-08-19** — the nine encodings exist, `kcs:format-stress` among them. §7.1 (assertion extensibility) and §7.3 (recording fidelity) are open **questions**, not gates — and the 2026-08-24 run supplied a re-open input for each: **DR-10** (the downstream §5 vocabulary omits `structure_matches`, the very predicate the 0.3.0 fold added, and declares a `media_map_complete` koine names nowhere, while every document declares `kcs_version: 0.3.0`) and **DR-2** (the evidence artifact records a per-scenario aggregate, not pass/fail per assertion with its cited clause, which is what §7.3 asks about and what [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) assumes a recorded result contains). **DR-10 bears on the re-validation directly:** the determinism fold cannot be exercised by a suite whose vocabulary lacks its predicate. *Positive evidence, at a scale no single scenario supplies:* nine documents were written in KCS 0.3.0 and all nine parse, replay and produce a content-addressed report; deltas **M**, **O** and **P** all ran as specified; and the §7.1 escape hatch was used as designed, twice, by different authors (**V-8**, **MA-11**). | **unowned** |
| [KFT](../../specs/fine-tuning.md) | 2026-07-23 (0.3.0), on two clean pressure passes | **0.4.0**, 2026-08-06 — the additive FT-M…FT-Q producer-exhaust intake fold | **Two** counts as of **0.6.0** (2026-08-26). (i) The owner's re-run of the *Re-validation — KFT 0.4.0* section of [`e2e-producer-exhaust-finetune.md`](../../scenarios/e2e-producer-exhaust-finetune.md) — walks clean **as written**, never executed; its dependency-pin precondition is **closed** ([`chief/71-kft-dep-repin`](../../tasks/chief/completed/71-kft-dep-repin.json)). (ii) New at 0.6.0: a re-run of [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md), whose FT-R…FT-V the fold answers — its Steps 2–6 must now walk clean and its Steps 1/7 stay held. Caveat, and it grew: §3.3 and §8.1 were already normative surface **no pass has exercised**, and 0.6.0 is the first fold since the demotion to move §4's admission inputs (a `resume` ref joins §4.2's aggregate and §4.3's union), so §3.4/§4.2/§4.3/§5.4/§6/§7 are **changed** surface too. A cold job — every 0.4.0- and 0.5.0-era manifest — admits on exactly the inputs it did before, which is why (i) does not move. And the conformance gate is **not** met here: the tenth scenario has no KCS encoding yet (**DR-11**). The 2026-08-24 run adds a third qualification and one piece of good news. Qualification: the suite pins **KFT 0.5.0**, so §3.3's conversion round-trip and §8.1's graded refusals have no encoded assertion at all — every refusal is the ungraded §5 `refused` (**DR-5**) — and the **training-provider** role was a delta-N stand-in in all three KFT passes, so every refusal observed is an admitting-side refusal against a recorded provider (**DR-6**). Good news: the gate itself fired, five times over `expect: reject` steps — one `local-only` record kept a whole run off rented compute, **FT-B** reached the base model's own egress, **FT-A** held §5.4's output inheritance, **FT-D** closed the eval path, and **FT-F** refused `dpo` × `text-to-image` at admission. | **unowned** |

## Cheapest first

Ranked by what a promotion actually costs from here. This ordering is the point of the page.

1. **KGP — one downstream deliverable, zero koine edits.** Every koine-side gate is discharged. What
   remains is a reader for the §4.1 projection, rule 2 enforced against it, and a corpus wider than
   one binary claim — built in agora under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md),
   tracked as [`87`](../../tasks/chief/87-kgp-projection-reader-and-roundtrip.json). Then the owner
   promotes. **Nothing in koine blocks it.**
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
4. **KMI — one small fold, then a wait.** MA-5 puts two fields on the §2 envelope and MA-10 makes
   absence answerable; both are additive and 0.4.0 is already spent on the EDL removal. After that
   KMI is blocked on **KCB's** re-run, which is not KMI's work.
5. **KINP — real work.** Four blocking deltas across §3.4/§4/§5/§6 — a convergence target, a
   fail-closed branch, equivalence extended over worlds, a namespace registry federation is not
   itself federated — then a re-run of the scenario that found them. The scenario records that
   **none requires redesign** and every one is additive, which is the good news.
6. **KCB — the most work, and the most implemented.** **Four** independent counts as of 0.4.7, two
   folds (V-2/V-4/V-5/V-7 → 0.5.0, and MA-6/MA-8/MA-9), a re-run outstanding since 2026-07-22, and
   the new §4.2 backpressure count — which, alone among the four, also lacks a KCS encoding
   (**DR-12**). Real routing code downstream is already built against the pre-finding contract.
   KCB is the spec where reading `green` as a verdict does the most damage: `kcs:live-schema-mutation`
   and `kcs:multi-authority` both came back green over passes with four and six blocking deltas open
   (**DR-7**, **DR-8**).

## Two facts that apply to every row

- **The conformance-gate is met for four of the six — KFT and KCB are the exceptions, both as of
  2026-08-26.** Nine [`../../scenarios/`](../../scenarios/) pressure tests have machine-replayable
  KCS encodings, built downstream and run over live MCP/A2A links on 2026-08-19
  ([`kcs-encoding-gate-verification.md`](kcs-encoding-gate-verification.md)). Two scenarios written
  *after* that set was frozen have none, and each costs its spec the gate on one count:
  [`kft-resume-checkpoint.md`](../../scenarios/kft-resume-checkpoint.md) (**DR-11**), so KFT 0.6.0's
  §3.4 `resume` and the §4.2/§4.3 clauses reading it have no runnable document citing them; and
  [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) (**DR-12**), so
  KCB 0.4.7's §4.2 has none either. That is precisely what
  [the gate](../../specs/README.md#the-ratification-gate) forbids promoting on. KCB's other three
  counts are unaffected — the scenarios they re-run are all encoded — and for the four unaffected
  specs every gate named above is the spec's **own** outstanding pass. The gap is visible downstream
  rather than assumed: `agora`'s `console/src/kcs/scenarios/coverage.test.ts` asserts set-equality
  against this repo's `scenarios/*.md` and goes red naming **both** unencoded documents. Building
  the encodings is downstream work under
  [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) and **neither is owned**.
- **The downstream run is now citable — with two conditions.** Under
  [`../../specs/README.md`](../../specs/README.md#the-ratification-gate) a result becomes evidence a
  gate may read only once recorded in the scenario it ran, as a `## Downstream results` section. As
  of 2026-08-26 every scenario carries one
  ([`84-record-the-downstream-results`](../../tasks/chief/84-record-the-downstream-results.json)),
  so an owner **may** cite the 2026-08-24 run alongside a hand-walked pass. The conditions come from
  the run's own findings, indexed at
  [`../../scenarios/README.md`](../../scenarios/README.md#findings-from-the-run-dr-1dr-12): `green`
  means *the encoded assertions held*, not *the spec holds* — two scenarios came back green over
  four and six open blocking deltas (**DR-7**, **DR-8**) — and a green encoding is evidence only for
  what it encodes, which for three specs is less than their row above implies (**DR-3**, **DR-4**,
  **DR-5**). Neither condition changes a single row's verdict below; both change what a citation of
  the run is worth.

**On tasklist `53`.** KINP, KCB §3.1 and KMI §7.1 each name
[`chief/53-multi-authority-scenario`](../../tasks/chief/completed/53-multi-authority-scenario.json)
as a live gate while it sits in `completed/`. That is not a bookkeeping error: `53`'s scope was to
**write and run** the break test, and it did — [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md)
exists and ran. What the three specs are actually waiting on is the **fold** of what it broke, which
is [`85`](../../tasks/chief/85-fold-the-federation-breaks.json). A spec citing a retired tasklist for
a gate that has moved to a different tasklist is exactly how KGP's gate went stale for six days; the
three status notes should be repointed at `85` when that fold lands.

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
