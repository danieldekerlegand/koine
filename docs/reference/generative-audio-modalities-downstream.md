# Downstream notice — the KFT audio modalities, and what each mirror must do

> **Status:** Current · **Updated:** 2026-09-03 (§8 added — a verification pass at named shas) · **Owner:** koine · **Informative**

[KFT 0.7.0](../../specs/fine-tuning.md) added two `modality` tokens — **`text-to-audio`** and
**`audio-to-audio`** — to a **closed** vocabulary that three named participants mirror. The
reasoning is [`generative-audio-modalities.md`](generative-audio-modalities.md); this page is the
other half of publishing a vocabulary: **telling the mirrors**, in terms each one's own tasklist can
lift, instead of leaving them to discover it on a failed admission check.

**Report, not an edit.** Every repo named below is a sibling, and koine specifies rather than
implements ([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)). **No file outside this
repository was written, and none was read** — the deliverable is this statement, and each repo picks
it up under its own gates. Findings are numbered **AUD-1…AUD-6** so a downstream tasklist can cite a
row rather than paraphrase this page.

**Two provenance classes, kept apart.** Everything about *koine* below is verified in this worktree
and citable by file and section. Everything about *formant*, *lugh* and *agora* is either read from
[`../../ECOSYSTEM.md`](../../ECOSYSTEM.md) §2's role map (informative, shape-level) or **attributed
to the commissioning tasklist** `88-generative-audio-modalities`, which carries the observations that
opened this work. Attributed claims are marked **(reported)** and are not independently verified —
verifying them means reading another repo, which this page deliberately does not do.

---

## 1. What all three do, and which file is the source

The vocabulary is stated in **four** places in koine and they are not equal:

| Statement | Role for a mirror |
|---|---|
| [`../../registry/enums/modality.tsv`](../../registry/enums/modality.tsv) | **The one to vendor.** `registry/` is the machine-readable surface a downstream repo copies under a drift gate; it carries the columns (`data_planes`, `typical_base`, `typical_method`, `description`) the prose statements drop. |
| [`../../specs/fine-tuning.md`](../../specs/fine-tuning.md) §3.1 | Normative prose. Its table has **no `description` column**; the audio distinction it cannot hold sits in a paragraph beneath it. Read it for meaning, do not parse it for tokens. |
| [`../../schemas/finetune-job.schema.json`](../../schemas/finetune-job.schema.json) `properties.modality.enum` | What a validator enforces. Vendor this too if you validate jobs — see [AUD-5](#5-agora-the-general-trainer-and-the-validator). |
| [`../../registry/README.md`](../../registry/README.md) | Prose, **unguarded**, enumerating the tokens inline. Never mirror from it. |

Three rules that apply to all three consumers:

- **Verbatim means order too.** The four statements were verified equal *including order* when the
  rows landed (7 tokens, all four identical and in order). A mirror that reorders is still a
  drift risk for anything that indexes positionally.
- **Tokens are immutable once published** (KFT §3.1, the same discipline as a relation signature).
  So a mirror never needs to handle a token *changing* — only tokens being *added*. Additive-only
  is the whole compatibility story here.
- **A token you do not implement is not a token you may omit.** §8.1 grades a refusal, and the grade
  turns on whether *another provider* can take the job. Omitting a known-but-unimplemented token
  collapses `out-of-envelope` (re-routable) into `invalid` (terminal) — see
  [AUD-4](#4-lugh-the-narrow-provider-envelope).

---

## 2. The rows, as a mirror sees them

Copied from the registry, for reading convenience only — the file is the source:

| `modality` | `data_planes` | `typical_base` | `typical_method` | Shape of the corpus |
|---|---|---|---|---|
| `text-to-audio` | `media(audio)` | Stable Audio Open, MusicGen, AudioLDM 2 | `lora\|full` | caption → audio; music, SFX, **and speech (TTS)** — there is no separate `text-to-speech` token |
| `audio-to-audio` | `media(audio)` | RVC, so-vits-svc, Demucs | `full\|lora` | paired audio → audio, **no caption side**; `full` leads because the typical bases are small task-specific architectures, not foundation models |

The `typical_*` columns are **informative** — the normative obligation is FT-F, which validates the
`modality × method` combination (and base architecture) at admission and refuses an incoherent
request before compute is committed. A mirror that hard-codes `typical_method` as an allow-list is
reading an informative column as a gate.

---

## 3. formant — the `KftModality` mirror

**Role (ECOSYSTEM §2):** consumer, provider planned — *"Audio-plugin/instrument IDE; routes model
calls through the provider-router and fine-tuning through KFT."* **Which rows: both.**

**AUD-1 — the block is lifted.** *(reported: formant tasklist `38-kft-generative-audio-ratify-and-flip`)*
That tasklist requires `KftModality` to be a verbatim mirror of the koine enum, ran five iterations,
verified the enum four ways and **correctly refused to write a mirror of rows that did not exist**.
They exist now. The action is: re-vendor from `registry/enums/modality.tsv` at **KFT 0.7.0**, all
seven tokens in file order, and re-run its own drift gate. Nothing else in `38` was wrong — the
dependency was mis-pointed, not the work.

**AUD-2 — the word *ratified* is still not satisfiable, and that is not this fold's failure.**
`38`'s criterion reads *"a verbatim mirror of the **ratified** koine enum"* (reported). KFT is
**0.7.0 candidate**, and it stays candidate: a normative vocabulary change re-enters validation, and
the spec carries two standing gates that 0.7.0 restates and does not move. If `38` is read
literally it is still blocked, and will be until KFT is promoted — which does not depend on these
rows at all. The honest resolution is on formant's side: restate the criterion as *the published
enum at a named version* (`0.7.0`), or accept a candidate spec deliberately and say so. koine will
not promote a spec to unblock a mirror.

**AUD-3 — a version pin four minors stale, and this fold makes it worse.**
`formant`'s `KFT_VERSION` reads **`0.3.0`** (reported) against this spec's **0.7.0** — behind
`0.4.0` (the FT-M…FT-Q intake fold), `0.5.0` (§3.3 conversion mapping, §8.1 graded refusal),
`0.6.0` (§3.4 `resume`) and now `0.7.0`. It is a **separate defect in a separate repo** and is
flagged, not fixed, here. Why a vocabulary change makes it acute rather than merely untidy: after
AUD-1, formant's mirror carries tokens that **only exist at 0.7.0** while its pin claims `0.3.0`.
The artifact is then self-contradictory in a way neither half is on its own, and `kft_version` is a
field a job manifest actually carries (KFT §11) — so the contradiction travels on the wire. Bump
the pin in the same change that lands the tokens, or the mirror is worse off than before.

---

## 4. lugh — the narrow-provider envelope

**Role (ECOSYSTEM §2):** provider — *"the narrow, local-only `finetune` provider for
containment-gated (`synthetic` / `personal`) training data."* **Which row: `audio-to-audio`
especially, `text-to-audio` too.**

**AUD-4 — the placement rule routes audio here, so a missing token dead-ends a job that has nowhere
else to go.** The chain is entirely in koine and each link is normative: a user's own recordings
classify `personal` and commonly carry `egress: local-only` (KGP §7.1/§7.2) → KFT §4.2 takes the
**most restrictive** egress over every media asset, so the *job* is `local-only` → §4.2's placement
rule requires local/in-tier compute → the general cloud trainer is not a lawful placement. lugh is
where that job belongs.

Now the failure mode if lugh does not know the token. §8.1 requires the refusal grade to distinguish
*no provider can take this* from *I cannot take this*:

- Unknown token, treated as malformed → **`invalid`**. Terminal. `route_to[]` is not admitted. The
  caller is told a coherent job is broken.
- Known token, not implemented → **`out-of-envelope`**. Re-routable, with a `route_to[]` hint.

And §8.1's no-breach rule bites immediately afterwards: a `local-only` job refused here **MUST NOT**
be routed to a cloud-capable trainer — *"routing a `local-only` job to a cloud-capable trainer
converts a correct refusal into the exact privacy breach §4.2 exists to prevent"* — so where lugh is
the only in-tier candidate, `route_to[]` is correctly **empty**. That is the honest answer, and it is
why the grade must still be right: an empty route on `out-of-envelope` says *nobody in-tier yet*,
where `invalid` says *your job is broken*. Only one of those is true.

**The manifest cost is smaller than it looks, and it is not zero.** KFT §2's own worked
`finetune` manifest already lists `audio/*` in its media input port, so accepting audio assets needs
**no new field, no new port kind and no new plane**. But if lugh's *actual* published port is
narrower than that example (video-capable small models are its stated line), widening it to accept
`audio/*` is a change to the port's declared shape → its `schema_id` moves (KCB §7.1) → KCB §7.2
requires **at least a minor bump**, because *"a digest change with no version change is a defect."*
The good news is that the same table rules a widened input port **minor** and **not** breaking for a
live subscriber. So: widen, bump minor, re-publish. Do not widen silently.

---

## 5. agora — the general trainer, and the validator

**Role (ECOSYSTEM §2):** host / general `finetune` provider. **Which rows: both**, as the
all-`exportable` case — the one where no containment gate fires and the job is simply admitted or
refused on its own coherence.

**AUD-5 — a stale vendored schema turns a conformant job into `invalid`, and that is a false
refusal with no route out.** `schemas/finetune-job.schema.json`'s `properties.modality.enum` gained
both tokens at 0.7.0 (and the golden fixture's `kft_version` moved with it). A validator still
holding the 0.6.0 enum — the `finetune-job.schema.json` validator + conformance CI is agora's
program (ROADMAP Phase F3) — rejects a **conformant** 0.7.0 job at the syntactic gate. Under §8.1
the resulting grade is `invalid`: terminal, no `route_to[]`, no re-route. The job is not incoherent;
the validator is stale. This is the one place where a vocabulary lag produces a *wrong answer*
rather than a missing capability, which is why it is listed above the trainer's own work.

**AUD-6 — the two rows are unexercised vocabulary, and nothing downstream can cite them yet.** No
scenario or leg in [`../../scenarios/`](../../scenarios/) walks an audio job. KFT §3.1's *Pressure
test* section records the two tokens the way it already records §3.3 and §8.1 — normative surface no
pass has walked. The consequence for a downstream conformance run is exact: a KCS encoding **cannot
assert an audio admission**, so a green suite is not evidence these rows work, and under the
[ratification gate](../../specs/README.md#the-ratification-gate) they are not citable in a
promotion. Exercising them means a new `scenarios/*.md` **and** its KCS encoding — and per
[`CLAUDE.md`](../../CLAUDE.md), adding a scenario is itself a cross-repo obligation with no local
red light, since the downstream encoding set is held to set-equality with `scenarios/*.md`. **This
work is unowned**, exactly like DR-11…DR-13. It is named here so that "no audio test" reads as a
known gap rather than an oversight; whoever needs the rows exercised owns it.

---

## 6. The findings, as rows

| # | Repo | Severity | What it is | Verified here? |
|---|---|---|---|---|
| **AUD-1** | formant | Unblocking | `KftModality` re-vendored from `registry/enums/modality.tsv` at KFT 0.7.0, all 7 tokens in file order | Rows: yes. formant's state: **reported** |
| **AUD-2** | formant | Blocking, downstream-owned | `38`'s *"ratified"* wording is unsatisfiable — KFT stays **candidate** on two unmoved gates; restate the criterion or accept a candidate deliberately | Status: yes. Criterion text: **reported** |
| **AUD-3** | formant | Defect, pre-existing, worsened | `KFT_VERSION` reads `0.3.0` against 0.7.0; after AUD-1 the mirror carries tokens that exist only at 0.7.0 while the pin claims 0.3.0, and `kft_version` travels on the wire | **Reported** |
| **AUD-4** | lugh | Correctness | Recognise both tokens so an unimplemented modality refuses `out-of-envelope` (re-routable) not `invalid` (terminal); widening a media port to `audio/*` moves its `schema_id` → **minor bump required**, and empty `route_to[]` is the correct answer for a `local-only` audio job | Chain and grades: yes. lugh's port: **reported/unknown** |
| **AUD-5** | agora | Correctness | Re-vendor `finetune-job.schema.json` at 0.7.0; a stale enum makes a conformant job `invalid` — a false, terminal refusal | Schema: yes. Validator state: **reported** |
| **AUD-6** | any | Gap, unowned | No scenario walks an audio job, so no KCS encoding can assert one and neither row is citable in a re-ratification | Yes |

---

## 7. What koine does not do next

It does not open tasklists in sibling repos, track their adoption on this page, or hold its own
version back for a mirror. Adoption is tracked where it always is — ROADMAP's *Track downstream
adoption* row, off each scenario's `## Downstream results` — and a mirror that has not caught up is
that repo's finding, not koine's. The one thing this page **is** claiming: after today, no consumer
of this enum can say it was not told.

---

## 8. Verification pass, 2026-09-03 — four of the six are discharged, and the two that are not are named

**This section reverses §0's provenance rule, deliberately and once.** The page above says *"no file
outside this repository was written, and none was read"*, and every downstream claim in it is marked
**(reported)** on that basis. That was the right rule for a *report*. It is the wrong rule for a
*re-check*: `chief/91` had to read `agora` at a named sha anyway — to re-verify the KCS-encoding gate
after koine's own record turned out to be a week stale
([`kcs-encoding-gate-verification.md`](kcs-encoding-gate-verification.md) §6.4) — and a page that
leaves five findings as **(reported)** when the answer was one `grep` away is doing the same thing
that cost the week. **Still no file outside this repository was written.** §1–§7 are unedited; the
verdicts below sit here rather than being folded into §6's table, so the reported and the verified
stay distinguishable.

Read at: `formant` `25c5ab5`, `agora` `c971fc2`, `lugh` `36f6f09` — all `main`, all 2026-09-03.

| # | Repo | Verdict | Evidence, at that sha |
|---|---|---|---|
| **AUD-1** | formant | ✅ **discharged** | `src/shared/agentic/kftFinetuneClient.ts` — `KFT_MODALITIES` carries all **seven** tokens in koine's file order, `text-to-audio` then `audio-to-audio` last, and `PROPOSED_KFT_MODALITIES` is now empty |
| **AUD-2** | formant | ✅ **resolved on formant's side, the way this page said it had to be** | `tasks/chief/completed/38-kft-generative-audio-ratify-and-flip.json` is in `completed/`, and its description restates the criterion as *a published enum at a stated version* rather than a *ratified* one — citing AUD-2 by name. **koine did not promote anything to unblock it** |
| **AUD-3** | formant | ✅ **discharged** | `KFT_VERSION = '0.7.0'`, moved in the same change as the tokens, so the artifact is no longer self-contradictory on the wire |
| **AUD-4** | lugh | ⬜ **open — and owned, deferred on a dated record** | Not a silent lag: `docs/decisions/adr-0007-kft-0-7-0-adoption-deferral.md` (2026-08-27) holds the mirrors at **KFT 0.4.0** across 0.5.0/0.6.0/0.7.0, deliberately and with the reasoning that the pin is *one conformance claim with no partial value*; `manifests/vendor-drift-triage.json` carries the adoption task, and it names the obligation this page states — *"recognise the two additive §3.1 tokens … vocabulary a conformant provider must not refuse as unknown"*. **The AUD-4 failure mode is live until that task lands**: a `local-only` audio job routed here by KFT §4.2 still meets an enum that does not know the token |
| **AUD-5** | agora | ✅ **discharged** | `schemas/src/koine-schemas/finetune-job.schema.json`'s `modality` enum carries both tokens; `schemas/src/versions.ts` pins **KFT 0.7.0** and its register records the point of declaring a token you do not run — a conformant audio job is refused **`out-of-envelope`** (re-routable) rather than **`invalid`**, with `manifest.availability` publishing both rows `unavailable`. That is exactly the wrong-answer case AUD-5 was raised on, closed |
| **AUD-6** | **koine** | ⬜ **open, and it is the only one of the six that is koine's own** | Confirmed by inspection of [`../../scenarios/`](../../scenarios/): none of the twelve pressure tests walks an audio job, so no KCS encoding can assert one and neither row is citable in a re-ratification. **Unowned.** Note what changed underneath it: AUD-6 said this gap was unowned *"exactly like DR-11…DR-13"* — and those three are now **closed**, so the comparison no longer carries. AUD-6 is unowned on its own |

**What the verified answers change, and what they do not.** They discharge no koine gate: KFT 0.7.0
stays `candidate` on two counts that were walked on 2026-09-03 and neither of which closed, and the
audio rows remain **unexercised vocabulary** — surface no pass has walked, recorded the way §3.3 and
§8.1 already are, and **not a third gate**. What they do change is who is waiting on whom. Of the six
findings this page raised, **four are closed downstream**, one is **open under a dated downstream
decision with an ending condition** (lugh ADR-0007), and the last is **koine's own**. That is the
opposite of the shape the page predicted, and the reason to write it down is §7's closing claim: *no
consumer of this enum can say it was not told*. Two of the three were told and acted within a day.

**The rule this pass adds to §7.** koine does not track adoption on this page — that stays true, and
§8 is not a status board. But **re-checking a finding you raised is not tracking adoption**, and
declining to read a sibling repo cost a week on DR-11. Where a page's findings are all downstream, a
dated verification pass at named shas belongs *in the page*, once, when something forces the read
anyway.

---

## 9. AUD-6, half-discharged — 2026-09-12: a pass now walks an audio job, and it is not clean

**AUD-6 was two things and this section closes one of them.** It said the rows were *"unexercised
vocabulary"* and that exercising them meant *"a new `scenarios/*.md` **and** its KCS encoding — the
join neither side can author alone."* The scenario half is now written:
[`../../scenarios/kft-audio-modalities.md`](../../scenarios/kft-audio-modalities.md) (2026-09-12),
a focused KFT leg walking one job per row — a caption→audio `text-to-audio` LoRA and a paired,
mixed-class `audio-to-audio` voice-conversion `full` finetune.

**It came back not clean, and that is worth more to a re-ratification than a clean walk.** Six
findings, **AU-1…AU-6** — a series deliberately distinct from this page's `AUD-n`, which are
*adoption* findings in other repos:

| # | What it is |
|---|---|
| **AU-1** (High, **blocking**) | `audio-to-audio` is minted on the property that its corpus is *paired asset↔asset with no caption side*, and KFT §4.1's FT-I bullet — the only pairing carrier the spec names — types a training-record row as *"a KMI `asset` id **and its text**"*. `dataset.media[]` is the corpora *"not the training samples"*, the job schema's `dataset` is `additionalProperties: false`, the header schema fixes no row layout, and a Croissant descriptor is never an admission input. **A published row has no expressible supervision**, so two conformant providers train two different models from one manifest |
| **AU-2** (Med-High) | §3.1's *"neither row moves a clause of §4"* is true of §4.2/§4.3/§4.1.1 and **false of §4.1**, and the reason it gives is `audio-to-audio`'s reason offered for both rows — `text-to-audio`'s caption side is a `records[]` row, not a media entry |
| **AU-3** (Med-High) | The audio pair is the **only** duplicate in §3.1's *Data-plane port* column (and in `registry/enums/modality.tsv`'s `data_planes`), so §2's *told apart by their ports* and §8.1's `route_to[]` cannot discriminate the two rows. **This is the finding that reaches the narrow provider**: the correct grade is still `out-of-envelope`, but the route out of it cannot be computed from ports |
| **AU-4** (Med) | §7 resolves cardinality because *"the arrays enumerate their members"*; a paired corpus's N samples are 2N members, so the estimate doubles and refuses `over-budget` a job that fits |
| **AU-5** (Med-High) | §3.3's four pinned conversion targets train no audio model, while §3.3.2's `modality` row asserts a mapping in all four columns and §3.3.1's gating set makes a refusal mandatory — two conformant readings of one matrix |
| **AU-6** (Med) | §5.3's export matrix and `registry/media-types.tsv` have no row for a **`full`** finetune's weights. Pre-existing; first made the *typical* path by `audio-to-audio` |

All six are **additive and KFT-only** — no KMI, KCB, KGP or KINP clause is read differently by that
walk — and all six are **unowned**. None of them is a model break: §4.2's gate, §4.3's union,
§5.4's inheritance and §8.1's grades were each attacked on an audio corpus and **all held**.

**What remains of AUD-6, and it is the half this page has always said is downstream.** The leg has
**no KCS encoding and no run** — recorded as **DR-14** in
[`../../scenarios/README.md`](../../scenarios/README.md#findings-from-the-run-dr-1dr-14) and in that
leg's own `## Downstream results`, on the day the file landed rather than a week later. So:

- **The rows are still not citable in a re-ratification.** Under
  [the ratification gate](../../specs/README.md#the-ratification-gate) a `candidate → ratified`
  promotion needs the machine-replayable encoding, not only the hand-walk.
- **The encoding is downstream work** under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)
  and is **unowned** — and per [`CLAUDE.md`](../../CLAUDE.md) the downstream encoding set is held to
  **set-equality** with `scenarios/*.md`, so the new file **breaks that test on arrival**. When the
  encoding is built it must assert the **folded** text: an encoding that predates its fold returns
  `green` while asserting nothing (**DR-7**/**DR-8**), which is the one thing this leg's row states
  in advance rather than discovering afterwards.
- **AU-1…AU-6 are a third condition on KFT's promotion**, additional to its two open counts and
  moving neither. AUD-6's own status therefore goes from *open* to **half-discharged**: exercised by
  a pass, not by an encoding, and now carrying six open deltas of its own.

**AUD-4 is unchanged by this, and one thing in it is sharpened.** The narrow provider's deferral
still ends the way its own dated record says it does. But AU-3 says the re-route AUD-4 turns on is
not computable from ports as §8.1 defines it, so *recognise the token so an unimplemented modality
refuses `out-of-envelope` rather than `invalid`* remains exactly right on the grade and now has a
known gap on the **route**. That gap is koine's to fold, not the provider's to work around.
