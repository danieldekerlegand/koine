# Koine Capability-Bus Protocol (KCB)

**Spec version:** 0.5.8
**Status:** Candidate
**Last updated:** 2026-09-12
**Applies to:** every participant on the bus — the control-plane host, capability providers, and
capability consumers (most participants are both provider and consumer).
**Depends on:** [`identity.md`](identity.md) (KINP 0.2.x) for identifiers;
[`grounding-pack.md`](grounding-pack.md) (KGP) and `media-interchange.md` for the payloads it
carries.

> **Status note (0.5.8):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.8 folds **BP-7** — the finding count **(iv)**'s 2026-09-03 walk of
> [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) returned at
> Step 3, and the last thing that count stood on. §4.2b's honour-or-refuse rule was stated at **one
> moment** — *"MUST refuse the subscription **at registration**"* — while §4.2b's own preamble makes the
> operands *"set at registration **and adjustable in-band** (d)"* and §4.2d calls its
> subscriber → producer direction *"the lever Step 3 of the leg went looking for and did not find."* So
> the section minted a lever and said nothing about what a producer **owes** when it is pulled: a
> saturated subscriber could ask for less and be unable to tell *honoured* from *refused* from *not
> implemented*, which returns it to the one lever that always worked — disconnect — and a lever whose
> effect is unobservable is the disconnect §4.2b was written to replace. **The fix was already written
> one paragraph away**: §4.2c governs the *other* in-band operand and gets it exactly right — *"A
> producer MUST answer a `resume` in exactly one of three ways, and **silence is not one of them**."*
> §4.2b therefore gains that discipline over its own operands: an adjustment on (d)'s channel MUST be
> answered **`applied`** (naming the operands now in force), **`cannot-honour`** (naming, per operand,
> the value it *can* meet — `gap-unavailable`'s shape) or **`unsupported`**, and **silence is not one of
> them**; a producer that cannot honour a live adjustment is **conformant by refusing**, one that takes
> the frame and keeps delivering under the old envelope is **not**. Four things are stated rather than
> left to be derived, three of them findings this repo has already paid for: the answer **echoes the
> adjustment's subscriber-minted id**, because named outcomes with nothing to attribute them to is
> **MA-17**'s carrier failure on the other verb and *which* answer arrived is the whole of the value;
> an **unanswered adjustment reads *not in force***, fail-closed on the reading side as §4.5(c) reads an
> absent `fetch` outcome as *pending*, and fixed for the subscriber rather than left to the conformance
> verdict **because** silence from a producer in breach and silence from a participant that implements
> none of this section are the same signal on the wire; the three named answers are what make the
> outcome **assertable**, closing §4.2d's own argument for preferring a frame over transport flow
> control, which through 0.5.7 was true of the request and not of its outcome; and the answer fixes a
> **shape, never a latency** — §4.2g stands untouched and is re-affirmed, `applied` committing to no
> drain time, no ramp, no schedule and no liability. **Patch, and the axis is named rather than
> assumed** — §7.2's table governs **a published capability's** bumps and decides nothing about KCB's
> own spec version, which moves on §7.3b's axis; the table is consulted for the two questions it *does*
> answer and both are **No** (no published digest moves, no live subscriber breaks). Additive at every
> surface: **no verb, plane, port kind, grant or authority role is added** and §4's verb table still has
> five entries; the answer rides §4.2d's **existing** channel and mints no second mechanism, which is
> §4.2d's own MUST; §4.1's audit is unchanged and `subscribe` remains the one session-shaped clause;
> §4.2d's ignore-what-you-do-not-understand rule holds **unchanged**, scoped to the frames a producer
> sends unasked; the lossless/lossy rule and *a retraction is never shed* are byte-unchanged; a
> subscription that declares none of §4.2's operands and never adjusts is a 0.4.6 subscription served as
> one and is never owed an answer; **§7.1 step 1's kept and dropped sets are byte-unchanged so no
> published `schema_id` or digest moves**; §7.2's table is undisturbed; and **0.6.0 stays spoken for**
> by §2.3's legacy-extension-URI-root removal — checked, not tripped. It composes across §3.1
> federation for §4.2d's stated reason: the binding, and therefore its channel, runs directly between
> the two peers, and no party with jurisdiction over both ends was ever required (ADR-0001). **No count
> closes and none is added** — BP-7 was found inside count (iv)'s own walk, so that count changes shape
> rather than gaining a sibling, and a fold does not close its own gate. What remains of count (iv) is
> the **re-run** of Steps 1–8 against text carrying both its findings' folds, BP-8's (0.5.4/0.5.5) and
> this one.
>
> **Status note (0.5.7):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.7 is the second half of the **MT-1** fold, and it is the half that **refuses**. 0.5.6
> made the disagreement sayable — §3's path result now names the **`(name, version)` each leg was
> matched over** — and a statement nothing reads is not yet a rule: §4.4c's resolution order ran on the
> operand and the grant alone, so a caller that planned over a top-ranked successor and holds a
> predecessor grant was still served the **predecessor**, now holding a plan that said so and having no
> way to present it. §4.4c therefore gains one further rule and one OPTIONAL operand: an `invoke`
> executing a planned leg MAY carry **`planned_leg`** — the `(name, version)` §3 named for that leg,
> carried as §3 returned it — and where the **resolved** major differs from the major of the presented
> leg the provider MUST refuse **plan mismatch**, naming **both**. That is not a new convention but
> **the instrument this bus already shares**, applied a third time: §5 refuses a `budget_units` ceiling
> whose unit is unstated (MA-6), §4.4c(3) refuses for want of a version where more than one major is
> published, and a plan that disagrees with what was resolved is refused the same way — *where a value
> could mean two things and no party is entitled to guess, refuse rather than assume*. Five things are
> stated rather than left to be derived: the comparison is on the **major and only the major**, so an
> ordinary compatible upgrade (`1.4.0` resolved against major 1) is **not** a mismatch; a presented leg
> naming a different capability is refused and **never ignored**, silent discard being the exact
> silence MT-1 is about; the operand is a **cross-check, never an operand of resolution** — applied
> after the order has resolved, never a fifth case of it, never a stand-in for a missing `version`, and
> minting **no default and no *highest published* fallback**, so the fail-open inversion **V-5** found
> is not reintroduced from the other side; the **grant is untouched and is a different party** — a
> resolved major outside the granted major is still refused at the gate, before the work, and nothing
> here widens a grant; and a *plan mismatch* refusal is a **refusal, not a counter-offer** (§4.4e), a
> re-dispatch under a different operand being a new `invoke`. **Patch, and the axis is named rather
> than assumed** — §7.2's table governs **a published capability's** bumps and decides nothing about
> KCB's own spec version, which moves on §7.3b's axis; the table is consulted for the two questions it
> *does* answer and both are **No** (no published digest moves, no live subscriber breaks). Additive at
> every surface: the operand is OPTIONAL on read and on write, an `invoke` carrying none of §4.4's
> operands against a provider publishing one major behaves exactly as it did at 0.4.9, **no verb,
> plane, port kind, grant or authority role is added**, no ranking rule and no resolution case changes,
> a caller that presents no plan is served exactly as at 0.5.6, **§7.1 step 1's kept and dropped sets
> are byte-unchanged so no published `schema_id` or digest moves**, §7.2's table is undisturbed, and
> **0.6.0 stays spoken for** by §2.3's legacy-extension-URI-root removal — checked, not tripped. **No
> count closes and none is added**: MT-1 was found inside count **(i)**'s own walk, so that count
> changes shape rather than gaining a sibling, this clause re-enters validation there rather than on
> §7.5's, and a fold does not close its own gate. What remains of count (i) is the **re-run** of
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against text carrying
> both halves.
>
> **Status note (0.5.6):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.6 is the first half of the **MT-1** fold — the finding count **(i)**'s 2026-09-03
> walk of
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) returned against §3's
> path planning, which is delta F's surface and the leg that count exists for. §7.1 makes
> `(name, version)` the unit of discovery and §3's *Ranking across versions* rule makes the registry
> match the **highest satisfying version** first, so a composed path is **already built over a
> specific version of each leg** — and the result said which nowhere. §3's *Composition* bullet named
> ports, planes, providers and a projected cost, and no version. The consequence is not a missing
> convenience: §4.4c resolves a version-free `invoke` to the **grant's** major, so a caller that
> planned over a top-ranked successor and holds a predecessor grant is served the **predecessor**,
> silently, with §5's gate satisfied and the leg that runs not the leg that was matched. §4.4c
> forbids resolving to the *highest published* major **by name** as the fail-open inversion **V-5**
> found; this is the same silent selection with the sign reversed, disagreeing not with the grant —
> which is correct and binding — but with §3's own plan. §3 therefore gains a NORMATIVE bullet:
> each leg of a returned path names the **`(name, version)` it was matched over** (an exact version,
> never a range, never the name alone, and §7.1's `0.0.0`-unknown where the entry carries none), the
> **projected cost** is the cost of exactly those legs so a caller gates spend against the same leg
> it planned over, and a plan leg is stated to be the registry's account of **what it matched** —
> reserving nothing, binding no provider, and leaving which major an `invoke` reaches to §4.4. That
> is the half that makes the disagreement **sayable**; the half that **refuses** it is §4.4c's and
> lands beside this one. **Patch, and the axis is named rather than assumed** — §7.2's table governs
> **a published capability's** bumps and decides nothing about KCB's own spec version, which moves on
> §7.3b's axis; the table is consulted for the two questions it *does* answer and both are **No** (no
> published digest moves, no live subscriber breaks). Additive at every surface: **no field, verb,
> plane, port kind, grant or authority role is added**, no ranking rule changes, a deployment that
> computes no paths gains no obligation, a **single-registry** deployment is conformant unchanged,
> **§7.1 step 1's kept and dropped sets are byte-unchanged so no published `schema_id` or digest
> moves**, §7.2's table is undisturbed, and **0.6.0 stays spoken for** by §2.3's
> legacy-extension-URI-root removal. **No count closes and none is added**: MT-1 was found inside
> count (i)'s own walk, so that count changes shape rather than gaining a sibling, and a fold does
> not close its own gate.
>
> **Status note (0.5.5):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.5 is the second half of the **V-10 / BP-8 / AP-9** fold: 0.5.4 gave §7.2's table the
> two rows it was missing, and this version gives the **MUST those rows state** a mechanism that
> exists. Three sections told a live subscriber it would be signalled on **§4.2d's** control channel
> — §2.4 and §7.2's `binding` row (0.5.0), §4.3a for an `effect` class (0.4.8), §7.2's `volume` row
> (0.5.4) — and **§7.3g named three frames, none of which is any of them**: `successor_published`
> carries a *successor's* `binding`, never the bound one's. §4.2d's own
> *ignore-what-you-do-not-understand* rule is what makes that a gap rather than a licence — a frame
> nobody names is one every conformant subscriber may discard, so an undefined signal and an absent
> one are the same signal, and §7.3g's contrasting property, that a producer emitting none is
> **detectable** because the frames are *named* and KCS §5 can assert their absence, was true of
> three facts and false of three others. §7.3g's table gains a **fourth** frame,
> **`entry_changed`** — one generic frame rather than three, which is the shape the break-test's own
> fix column proposed — announcing that a **declared non-shape operand** on the bound entry has
> moved, carrying the capability's **new `version`** (the fact all three rows rest on) and naming
> which operand moved. It obeys §7.3g's existing rules unchanged: it rides §4.2d's **existing**
> channel and mints no second mechanism, it **precedes** the fact it announces, a subscriber that
> does not understand it ignores it, and it is bounded — never a **shape** change (that is a new
> major, announced by `successor_published`) and never a substitute for `deprecated`, which has its
> own frame and its own §2 carrier. **No provider obligation is added**: all three MUSTs were
> already published, and what is added is a name to read them by; a `cost` change MAY ride it and is
> deliberately left a MAY, since §5 states no telling obligation and a re-price fails closed at the
> gate. §2.4's *"never left to a failed dial"* is **qualified rather than deleted** — met for the
> binding form this channel exists on (a subscriber re-establishing a dropped stream, or `invoke`ing
> the same capability, dials the new address), and **not** met for a cached discovery binding with
> no stream, which §7.3g's closing bullet already states the channel does not reach (**DEFER-D**,
> unmoved with its trigger intact). §2.4's *bounded on purpose* paragraph is untouched: no provider
> is required to serve two majors at two endpoints, no transport-id naming convention is defined,
> `binding` is not a discovery key, and §7.1's ban on version-in-the-name stands. **No published
> `schema_id` or digest moves** — a frame is not a field on a card and §7.1 step 1's key set is
> byte-unchanged — **§7.2's table rows are undisturbed**, and **0.6.0 stays spoken for** by §2.3's
> legacy-extension-URI-root removal.
>
> **Status note (0.5.4):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.4 folds **BP-8**, **AP-9** and **V-10** — three findings from three different pressure
> legs, and **one hole**. §7.2's normative table governs what a provider MAY change under a given
> bump, and it was written before `volume` (0.4.7, §4.2a) and `effect` (0.4.8, §4.3a) existed. Both
> operands nevertheless declare a **minor** bump *"(§7.2)"* in their own sections, on which the whole
> of their visibility rests — *the version moves, so a pinned subscriber can see it* — and the table
> they cite had **no row for either**, the nearest reaching them reading **patch**. So two sections
> asserted a bump the authority on bumps did not authorize.
> [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named that exposure in
> advance and deferred it *"to whichever pressure test breaks it"*; **BP-8**
> ([`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md)) and
> **AP-9** ([`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md))
> broke it, and **V-10**
> ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)) is the same
> defect read from the frame side. §7.2's table gains a **`volume`** row and an **`effect`** row, each
> **minor**, each stating whether a live subscriber breaks, and each **agreeing with** what §4.2a and
> §4.3a already declared — so **no provider obligation changes** and what changes is that the
> declaration now has an authority behind it. The merge-key consequence is followed through to
> **§3.1(d)**, where it matters: a field outside §3.1(d)'s key is rescued **not by the key but by the
> `version` its declared bump moves**, so **four** of ADR-0014's five carriers — `cost`, `binding`,
> `volume`, `effect` — now fail the converse rather than disagree inside a merged entry, and **one**
> is not rescued and cannot be — the deprecation marking, applied to a published capability **in
> place**, which is the case §3.1(d)(i)/(ii) were written for. **No published digest moves**: §7.1
> step 1 drops both operands by name before hashing and that drop list is **byte-unchanged** —
> checked against the step, not assumed — so the version moves and the `schema_id` does not, exactly
> as `cost` has since 0.2.0.
>
> **Status note (0.5.3):** stays **Candidate** on the same **six** counts, and **none of them
> moves.** 0.5.3 folds **V-9 and V-11** of
> [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) — the
> two structural findings count **(ii)**'s 2026-09-03 re-run left on **Steps 5 and 6**. 0.5.0 minted
> `payload_schema_id` as *the* cross-check a knowledge port's bare `shape` could not be, and the
> operand was **not consumer-verifiable**: §7.1 stated a five-step canonicalization for `schema_id`
> and **none** for it, and **no verb retrieved the declaration it digests**, so §7.1's own
> *falsifiability* argument was true of one digest and false of the other while the section called
> both a cross-check. §7.1 now states the canonicalization — `sha256` over the declaration's
> **published bytes**, a **content address of a document** in the same form KINP §3 gives an `asset`
> id, with the cross-provider convergence `schema_id` has **explicitly not claimed** — and settles
> retrievability by **checking §4's five verbs rather than assuming**: `fetch` can carry it and is
> the only one that can, since by construction the digest already *is* an `asset` address. So the
> cross-check has **two branches**: retrievable (a **fact** — fetch, verify, compare) and
> unretrievable (**provider-attested**, carrying a `version`'s evidentiary weight and not a
> digest's, with failure mode 2 **declared open** rather than silently open). **No sixth verb and no
> reserved capability name** — both are refused on the record with a re-open condition, on the
> ground the shape registry was refused on. **Patch, not minor**: `payload_schema_id` stays optional
> on read and on write, no verb/field/plane/port kind is added, §7.2's table is undisturbed, step
> 1's kept set and the `kcb1`/`kcb2` rules are byte-unchanged so **no published `schema_id` or
> digest moves and no next rule id is minted**, and a card carrying no `payload_schema_id` behaves
> exactly as at 0.5.2. **0.6.0 stays spoken for** by §2.3's legacy-extension-URI-root removal, which
> this fold has no mandate to discharge; the bump is deliberately **not** declared under §7.2's
> table, which governs *a published capability* and whose absence of a row for a spec-axis bump is
> the defect **BP-8/AP-9** found in §4.2a/§4.3a — not repeated here and not fixed here.
>
> The same publication folds **V-11**, Step 6's finding: V-3's fold answered canonicalization drift
> with a **rule id** in the digest prefix and then made **naming it optional**, putting the `MUST NOT`
> on the branch that does not need a name and **no MUST** on the branch that does — so a provider
> could canonicalize under **`kcb2`** (step 1 keeps `payload_schema_id`) and publish under a **bare**
> prefix the section defines to mean `kcb1`, **mislabelling** rather than unlabelling the digest and
> landing a recomputing consumer on §7.2's **silent mutation** with no rule id present for §7.2's
> *incomparable* branch to catch. Step 5 gains a third bullet, the **mirror** of the existing
> `MUST NOT`: emit the rule id of the rule actually used, **except** where that canonicalization is
> byte-identical to `kcb1`'s for the port in hand. Both arms are stated by the **property** that makes
> them true and **neither names a rule**, so they carry to the next rule id unchanged; the
> consumer-side rules are **unchanged and re-checked**; the **correction path** for an already
> mislabelled digest is stated and is not itself a mutation; and §7.2's *not a silent mutation* bullet
> now records that its own reservation holds **because** of this MUST. **No published digest moves** —
> every digest published to date is `kcb1` and stays prefix-free, both key sets are byte-unchanged, no
> next rule id is minted, and §2's worked card needed no correction. **Patch, and the narrowing is
> stated rather than hidden**: 0.5.2's text does not determine whether the permissive reading was
> conformant (the break-test's finding was that it enforces **neither** reading), so making the
> stricter one normative **disambiguates**; no value moves, nothing is added, `payload_schema_id`
> stays OPTIONAL, and a digest gaining a correct prefix reads *incomparable*, which is re-discovery
> and not the non-recoverable verdict. **§2.3's 0.6.0 removal is checked rather than tripped.**
>
> **No seventh count**: V-9 and V-11 were both found *inside* count (ii)'s own re-run, so the fold
> changes that count's shape rather than adding one, and the other five are restated unmoved. **KCB is
> no more promotable than it was** — **V-10** is the third finding of the same re-run and is not folded
> here.
>
> **Count (ii) was itself re-run by hand on 2026-09-12 and does not close.** **V-9 and V-11 do not
> reproduce**, and **Step 9's blocker is gone** — 0.5.1's `deprecated` / `removal_version` carrier
> discharges it with a single registry and no peering, so ADR-0014's clause leaves this count's
> preconditions and Step 11's V-11 qualification closes with it. Four new perimeter deltas stand —
> **V-12** (High, scope: §7.1(d)'s retrievable branch is a *content address*, an integrity instrument,
> and failure mode 2 is a staleness failure, so it is open on both branches and declared open on one),
> **V-14** (Med-High: the new MUST binds the provider and no clause gives the consumer the reading, and
> the verdict the fold cites is not the one §7.2 states), **V-15** (Med: §7.3a(a) and §2's
> `removal_version` SHOULD give one card state two conformant readings) and **V-13** (Med: `refused` is
> missing from (d)'s enumeration of §4.5's outcomes) — beside **V-10**, unfolded. Every folded delta
> held under re-attack and every new finding is a perimeter break; **no version and no clause moved**
> for the walk.
>
> **Status note (0.5.2):** stays **Candidate**, now on **six** counts. 0.5.2 folds **MA-12** of
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) — the blocker that
> scenario's Steps 8–10 left on **KMI count (i)**, and the half of it whose carrier belongs here.
> KMI §7.1(f) requires a store to answer *not held, and not expected* distinctly from *not reachable*
> and *not held, pending*; §4 typed `fetch` with **no response vocabulary at all**, cited §7.1(f)
> nowhere, and §4.2f had already spent *pending fetch* on a rate-limited refusal. New **§4.5** gives
> the three answers a **named** outcome set on the verb that delivers them — `held` /
> `not-held-pending` / `not-held-not-expected` / `refused` — owed **per request**, **never
> synthesized** (ADR-0014's second decision, read on this plane), with **absence reading *pending***
> and *not reachable* deliberately **not a value**; §7.1(f) keeps the meanings and KCB fixes only the
> wire. **Patch, not minor**: no verb is added (§4 still types five), no `asset` id moves, no envelope
> field is added, §7.2's table is undisturbed and **no published `schema_id` or digest moves** — and
> **0.6.0 stays spoken for** by §2.3's legacy-extension-URI-root removal, which this fold has no
> mandate to discharge. The bump is deliberately **not** declared under §7.2's table: that table
> governs *a published capability*, and declaring a spec bump under it is the defect **BP-8/AP-9**
> found in §4.2a/§4.3a — not repeated here and not fixed here either. New normative text, so a
> **sixth** count: a re-run of **Steps 8–10** of that scenario against the folded text, gating §4.5
> alone — the **same walk** as KMI count (i), not a second one. The five existing counts are restated
> and **none moves**, so **KCB is no more promotable than it was** — count (iii) still reads *fold
> MA-14/MA-15/MA-16, then re-run Steps 5–7 again*, and items (2)–(5) of
> [`../docs/reference/promotability.md`](../docs/reference/promotability.md) § *The eight things*
> remain unowned. **Count (vi) was itself walked by hand on 2026-09-12 and does not close**: MA-12
> does not reproduce, and §4.5's perimeter breaks on **MA-17** (High) and **MA-18** (Med) — one
> additive §4.5(a) edit, unowned, and item **(8)** of that register.
>
> **Status note (0.5.1):** stays **Candidate** on all **five** counts. 0.5.1 writes
> [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s four-part clause — the
> `deprecated` / `removal_version` carrier (§2, §3, §7.3a/§7.3d) and the merge rule on §3.1(d)'s
> converse — which is what count **(iii)** was waiting on; that count became *re-run
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) Steps 5–7 against the
> folded text*, because a fold does not close its own gate. **That re-run was walked by hand on
> 2026-09-12 and count (iii) still does not close**: the 2026-09-03 blocker does not reproduce and
> Steps 6/7 flip or half-flip, but Step 5 breaks on two defects inside the new clause — **MA-14**
> (the per-attribution form of §3.1(d)(i) is not a shape) and **MA-15** ((i) and (ii) collide on
> `deprecated`, and §7.3d makes the collision unavoidable) — with **MA-16** from Step 7 (the merge
> rule reaches a capability entry; `params.mcp` and `params.auth` ride on the manifest). All three
> are one additive KCB-only §3/§3.1(d) edit, and the count now reads *fold MA-14/MA-15/MA-16, then
> re-run Steps 5–7 again*. **No version and no clause moved for that walk.** Patch, not minor: every field optional on
> read and write, §7.2's table undisturbed, no published `schema_id` moves, and **0.6.0 stays spoken
> for** by §2.3's legacy-extension-URI-root removal. The other four counts are restated and none
> moves, so **KCB is no more promotable than it was.**
>
> **Status note (0.4.6):** stays **Candidate**, on the same two counts as 0.4.0 — 0.4.1 added a
> transition clause (§2.3), 0.4.2 corrected two upstream references (§1.1), 0.4.3 pins the MCP
> revision and audits which wire each verb assumes (§1.1, §4.1), 0.4.4 adds **§1.2**, an
> INFORMATIVE record of the layer claim and the external analysis that corroborates it
> (arXiv:2606.31498, 30 June 2026), and 0.4.5 points §1.2's closing bullet at **ADR-0011**, which
> decides the three governance dimensions KCB does not implement as **non-goals** — no normative
> clause, field, or manifest byte moves, and none of the five is a gate. 0.4.6 adds **§3.1**, the
> normative registry-federation clause applying
> [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md): a single host-provisioned registry
> (§3) stays conformant unchanged, and peering registries are specified as an additive composition
> that returns *addresses* across an authority boundary — never a proxy (ADR-0001). It adds a
> **third** re-ratification count, the cross-authority break test in
> [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), which is
> the same test KINP §11 decision 1 and KMI's federation clause name — now written and run as
> [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), and **not clean**
> (MA-6 blocking, MA-8/MA-9 should-fix), so that third count does not close. 0.3.0 changed the *shape* of the
> manifest — it is now an A2A AgentCard extension (§2), not a standalone
> `/.well-known/kcb-manifest.json` — and that re-validation is still outstanding. 0.4.0 adds the
> capability-versioning surface (§7, wired through §2/§2.1/§3/§5) per
> [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md). That fold is **additive**
> — fields added, none removed, nothing narrowed, no live subscriber broken — but it is new
> normative text, so the koine draft→candidate→ratified convention holds the status. Re-ratification
> path, **both** legs: (i) re-run
> [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the extension
> shape (no delta F/G/J/K/L is reopened — see **Pressure test**), and (ii) break-test §7 with the
> mutate-live-schema scenario (§7.5). Leg (ii) has been **written and run** —
> [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) — and did
> **not** pass clean: deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7, all additively foldable into a
> **0.5.0** minor. Both legs stay open. 0.4.1 moves the §2 extension URI's namespace root and
> opens the dual-accept window that retires the legacy root at **KCB 0.6.0** (§2.3); it neither
> adds a gate nor discharges one, and the two legs above are restated unchanged. 0.4.2 realigns the
> §2 example card with **A2A v1.0** and corrects the §4 MCP method names, and pins both upstreams in
> **§1.1**; it changes no KCB clause, field, or manifest shape, so the two legs are again restated
> unchanged. 0.4.3 pins **MCP revision 2026-07-28** in the same §1.1 table and adds **§4.1**, the
> per-verb audit of which MCP wire each clause assumes; it adds no field and removes none, and the
> two legs are restated unchanged once more. 0.4.4 adds **§1.2**, which is INFORMATIVE and cites
> external corroboration for where KCB sits; it defines nothing, delegates to nothing, and the two
> legs are restated unchanged again. 0.4.6 does not move either leg; it adds the third count above,
> which gates §3.1 alone. 0.4.7 resolves the **last open question** — §8's *subscription
> backpressure* — into a normative **§4.2**, after the pressure leg
> [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) found the
> spec's parking assignment **void rather than deferred**: flow control was left to *"the host's cost
> advisor"*, but §3 and ADR-0001 keep the host off the stream path and §3.1 federation leaves no
> single host with jurisdiction over both ends, so no downstream infra work could ever discharge it
> (**BP-5**). §4.2 puts the mechanism where the topology admits it — **between the two peers, on the
> binding's own axis** — as an optional port `volume` declaration (BP-1), optional `subscribe`
> rate/window/overflow operands whose governing question is *lossless or lossy* rather than *how
> fast* (BP-3), an optional content-addressed `resume` operand that makes a gap **detectable** and a
> shed **retraction** forbidden (BP-3), a metered subscription whose ceiling signals a **brake before
> the cliff** (BP-2), a `references` operand that makes the `fetch` fan-out predictable and bounds it
> by the subscriber's own declared rate (BP-4), and **one** in-band control channel in both
> directions — the same channel **V-7** needs, explicitly not a second mechanism. *Classification:*
> **patch** — every field is optional on read and on write, a subscription that declares nothing
> behaves exactly as it did at 0.4.6, no verb/plane/port kind is added, §7.2's compatibility table is
> not disturbed, and **0.5.0 stays spoken for** by §7.3's removal of §2.2's standalone manifest,
> which §7.3c forbids folding into an unrelated publication. New normative text, so it adds a
> **fourth** count to Candidate — a re-run of that leg, gating §4.2 alone. The three existing counts
> are restated and none moves. 0.4.8 adds normative **§4.3**, the autonomy-posture clause applying
> [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md), after the pressure leg
> [`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) returned
> **AP-1…AP-8** (blocking **AP-5**). Before it, the fabric expressed **spend** (§5) and named
> **irreversibility** nowhere, so a caller's posture across an ownership boundary had nothing on the
> wire to read: §4.3 mints one operand — a capability/port **`effect`** class, absent reading
> *unknown* and never *harmless* — plus a posture operand on the existing verbs, the
> **monotone-restrictive intersection** rule that answers *which posture wins* with no arbitration and
> no trust (and keeps ADR-0011's T3 from firing), a chain rule so a delegated leg cannot escape the
> caller's posture, and a **floor** no posture may skip. *Classification:* **patch** on the same
> grounds as 0.4.7 — every field optional, a dispatch declaring no posture behaves exactly as at
> 0.4.7, no verb/plane/port kind/authority role added, §7.2 undisturbed, and 0.5.0 still spoken for.
> New normative text, so a **fifth** count — a re-run of that leg, gating §4.3 alone; the four
> existing counts are restated and none moves. 0.4.9 folds the three deltas the
> **cross-authority break test** left open against §3.1 — **MA-6** (blocking), **MA-8**, **MA-9** —
> into §5 (a grant names its issuing host by KINP id; a provider states which issuers it honours via
> the optional `auth.accepted_issuers[]` of §2; a spend ceiling denominates in a stated unit or the
> cross-domain `invoke` is refused; fail closed on an unrecognized issuer), §3 (a `find` response
> shape carrying `served_by` + `observed_at` per entry and `incomplete[]` per result — the missing
> carrier for §3.1(c)(e)(f)), and §3.1 itself (a **horizon** on a forwarded query, and (d)'s
> de-duplication converse). *Classification:* **patch** — the one manifest field added is optional on
> read and write, no verb/plane/port kind is added, §7.1's `schema_id` digest and §7.2's
> compatibility table are undisturbed, and **0.5.0 stays spoken for** by §2.2's removal, which
> V-1…V-8 also occupy. New normative text, so no count closes: the third count (§3.1) becomes a
> **re-run of that pass against the folded text**, and the other **four** are restated and none
> moves. **0.5.0** is **the capability-versioning fold** — the deltas of count (ii), the §7.5
> break-test [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
> which returned **V-1…V-8** with **V-2/V-4/V-5/V-7** blocking. Seven fold and one closes: **V-2**
> (§2.1's optional `payload_schema_id` + §7.1's normative reader rule that a bare `shape` is *no
> cross-check available*, the shape-registry alternative **rejected on the record** as a second
> non-federated commons against KINP §3.4/ADR-0007); **V-4** (**§2.4**, an optional per-entry
> transport `binding`, so a second major is dialable while §7.1's ban on version-in-the-**name**
> stands — two namespaces, only one governed); **V-5** (**§4.4**, an optional `version` operand, the
> granted major made readable inside the token with the grant's name unchanged, and a resolution rule
> that **refuses for want of a version** rather than defaulting — deliberately the shape 0.4.9 gave
> `budget_units` at MA-6); **V-7** (**§7.3g**, three named frames — successor, deprecation, removal —
> on §4.2d's **existing** control channel, each before the fact it announces, since §4.2d already
> forbids minting a second); **V-3** (§7.1 step 5, a canonicalization **rule id** in the digest
> prefix, absent meaning `kcb1`, so **no published digest moves**); **V-6** (§7.3c's floor stated per
> axis — a retiring **capability** major waits for the successor's next major, while a koine-spec
> axis keeps one full minor, so §2.3's and KMI §4.4's removal versions do not move); **V-1** (§4.4d's
> optional `quoted_cost` and a refusal that names *quote mismatch*); **V-8** closed where it lands,
> as evidence already cited by KCS §7 open question 1. Two remainders are deferred with triggers
> (**DEFER-D** the binding forms §4.2d's channel cannot reach, **DEFER-E** `deprecated_at`); see
> [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md).
> **Minor, not patch:** every field is optional on read and on write and a participant implementing
> none of them stays conformant, but seven of the folds are **new normative surface a reader
> implements against** and §7.2's compatibility table itself gains a reader's obligation. 0.5.0 also
> **discharges an obligation already declared**: under §7.3f, publishing it *is* the removal of
> §2.2's standalone `/.well-known/kcb-manifest.json` — not a fold, a deadline arriving. §2.3's
> separate window is untouched and still runs to **0.6.0**. **Stays Candidate**: a fold does not
> close its own gate. Count (ii) becomes a **re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded
> text** — which, per **DR-7**, requires the KCS encoding to be *extended* before it can assert the
> folded behaviour at all — and the other **four** counts are restated and none moves.


> The **control plane**. Where the knowledge plane (KGP) and media plane move *data*, the
> capability bus moves *capability*: how a participant advertises what it can do, how orgs and
> agents discover and invoke each other, and how knowledge/media flow as subscriptions.
> Transport is **MCP + A2A** — open standards a conformant participant is likely to speak
> already — so KCB is mostly a *convention* over existing standards, not a new runtime. Dumb
> pipes: the bus carries invocations and data *references* (KINP ids, KGP pack ids), never
> transforms payloads.

---

## 1. Scope

KCB defines:
- the **capability manifest** every participant publishes (§2),
- the **discovery registry**, how it is populated, and how registries **peer** (§3, §3.1),
- the **verbs**: discover / describe / invoke / subscribe / **fetch** (§4),
- **trust & authorization** — capability grants, signing, per-world scoping (§5),
- the per-role **mapping** onto existing MCP/A2A surfaces (§6),
- **versioning, compatibility & deprecation** — how a capability evolves, and how a surface retires,
  without breaking a live subscriber (§7).

KCB does **not** define payload formats (KGP / media-interchange do), agent reasoning, or
infra provisioning (host-local concerns).

### 1.1 Upstream pins

KCB is a convention over two external standards, so every clause below is written against a
**named version**, not against "A2A" or "MCP" in the abstract. A bare reference would be
unimplementable: both standards have shipped breaking changes to surfaces this spec maps onto.

| Upstream | Pinned | Where it bites |
|---|---|---|
| **A2A** | **v1.0** | The host document of the §2 manifest. v1.0 replaced the v0.x top-level `"url"` with **`supported_interfaces[]`** (`AgentInterface{ url, protocol_binding }`) — see §2. |
| **MCP** | **revision 2026-07-28** | The transport of the §4 verbs. That revision made the core **stateless** and is a **breaking change** against its predecessor — see §4.1 for the per-clause audit. |

**The table of record is [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md)**, which
holds every pin in the fabric and the drift-check cadence that keeps them honest; the two rows above
are restated here so this spec reads standalone, and if they ever disagree with that file **the file
wins and this section is the defect**. That direction is deliberate and is the reverse of how a
spec's own version works: an upstream revision is a shared fact — the pinned MCP revision is the
*same* fact for KCB and for KCS — so it is recorded once where one sweep can check it
([`README.md`](README.md) § *External standards — the pin rule*). A pin states what KCB was
**validated against**, not that the upstream is frozen; moving one is a spec change under
[`README.md`](README.md)'s lifecycle.

**What the pinned MCP revision has that its predecessor did not.** The 2026-07-28 revision replaced
a session-oriented wire with a **stateless core**: there is no `initialize` handshake, no session
id, and per-request context rides in a per-request **`_meta`** rather than in state accumulated on a
connection; a server describes itself through a **mandatory `server/discover`** instead of through
what the handshake returned. The two wires are therefore **not interchangeable** — a client speaking
one is not a client speaking the other — which is why a bare "over MCP" is unimplementable here and
why §4.1 states, clause by clause, which wire each of KCB's five verbs assumes. A KCB participant's
own revision is a property of the MCP endpoint it publishes (`params.mcp`, §2), not a KCB field:
this pin says what KCB was written and validated against, and a participant still on the older wire
is a participant KCB describes rather than one it excludes.

### 1.2 The layer claim, and the external analysis that corroborates it (INFORMATIVE)

This section binds nothing. It records **why** the sentence above the scope list — *KCB is mostly a
convention over existing standards, not a new runtime* — is a defensible position rather than a
preference, and it names the one piece of **external, independent** evidence koine has for the
shape of that claim.

**The claim.** KCB does not compete with MCP or A2A; it sits *above* them and gives their traffic a
meaning they leave undefined — what a capability **is** (§7), what invoking it **costs** (§5), what a
grant **permits**, which world a port is scoped to (§2.1). The §1.1 pins are the other half of the
same posture: a layer above names the version of what it is above.

**The corroboration.** Richard Kang and Yudho Diponegoro, *Governance Gaps in Agent Interoperability
Protocols: What MCP, A2A, and ACP Cannot Express*, **arXiv:2606.31498**, submitted **30 June 2026**,
reaches the same structural conclusion from an entirely different direction and states it in one
sentence:

> "agent community governance constitutes a missing architectural layer above current
> interoperability standards, not a missing feature within them."

**Its scope, stated so it is not overread.** It is a systematic gap analysis of **five** protocols —
**MCP** (v1.1), **A2A** (v1.0.1), **ACP**, **ANP**, **ERC-8004** — against a **six-dimension
governance taxonomy** derived from organizational theory: **G1 membership**, **G2 deliberation**,
**G3 voting**, **G4 dissent preservation**, **G5 human escalation**, **G6 audit/replay**. Each
protocol–dimension pair is classified *Supported* / *Partial* / *Absent* **on what the specification
encodes, not on what could be built on top** — the authors' own stated limitation — and the paper
separates gaps that a protocol's extension mechanism could close from gaps that require a new layer.
It is a **taxonomy, not a specification**: it defines no wire format, no verb, and no field, so
there is **nothing here to adopt by reference** in the sense of §1.1 or of KFT §4.1.1. That is also
why the paper is **not** a row in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md): a pin records what a
normative clause was validated against, and no KCB clause delegates to this paper. A prior-art
citation is not a pin.

**What it does and does not say about koine — the non-overlap is the point.** The paper's axis is
**collective decision-making among agents**; KCB's axis is **interchange semantics between
organizations** — license class, egress class, trust tier, budget ceiling, capability grant. None of
G1–G6 is one of those, and none of those is one of G1–G6. Read that in both directions:

- **Toward koine, it is validation and not prior art.** The paper does not analyse, anticipate, or
  occupy a single KCB clause. It does not evaluate koine at all. What it corroborates is the *shape*
  of the claim this section opens with — that a layer above MCP/A2A is a real architectural position
  and not a failure to read the protocols — reached independently, on a different axis, by authors
  with no knowledge of this repo. It retires no koine clause and establishes no priority over one.
- **Toward the paper, koine is not an answer to it.** koine occupies a *different* layer above the
  same two protocols. Nothing in this spec implements G2 deliberation, G3 voting, or G4 dissent
  preservation, and a reader must not take "koine is the missing layer" from this citation — the
  paper names a missing **governance** layer, koine is a missing **semantics** layer, and the two
  are neighbours rather than the same thing.

**That last bullet is a decision, not an omission.**
[`../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md`](../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md)
records **G2**, **G3** and **G4** as explicit **non-goals** for the fabric — with the evidence (every
gate koine specifies is unilateral and refusal is always available; a sweep on 2026-08-18 found no
standards-body specification of any of the three to profile) and, more usefully, the **trigger that
re-opens the verdict**: a use case in which participants under different KINP §3.4 minting authorities
must reach one binding joint decision, or a standard koine could profile. Read alongside
[`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md), which
measures all six dimensions against the specs and keeps the shortfalls that *are* on koine's axis open
as findings.

---

## 2. The capability manifest

Every participant (and every agent/org a control-plane host runs) advertises what it offers. It does **not**
publish a second, standalone document for this. A capability provider already publishes an **A2A
AgentCard** (the standard `/.well-known/agent-card.json`), which carries its identity and its
service endpoints. The KCB manifest is therefore defined as a **named extension of that card**,
not as a top-level file of its own: the KCB-specific payload rides as one entry under the card's
`capabilities.extensions[]` array.

The host card is an **A2A v1.0** card (§1.1). In v1.0 a card does **not** carry a
top-level `"url"`: an agent's addresses are the entries of **`supported_interfaces[]`**, each an
**`AgentInterface{ url, protocol_binding }`**, so one card may advertise the same agent over
several bindings (e.g. `JSONRPC` and `GRPC`). KCB reads the A2A endpoint off that array rather than
off a single field — everywhere this spec says "the card's own service URL" it means *an
`AgentInterface.url` from `supported_interfaces[]`*. Nothing in the KCB extension itself is affected
by this: the extension entry, its `uri`, and its `params` are the same under either card version
(§2.3 governs the extension `uri`, not the card).

A2A's `AgentCard.capabilities.extensions` field is a list of **`AgentExtension`** objects, each
`{ uri, description, required?, params }` — the standard, in-band way to attach protocol-specific
metadata to a card without forking the A2A schema. The KCB manifest is one such extension,
identified by the stable extension URI **`https://w3id.org/koine/kcb/manifest/0.3`**; its `params`
object carries the KCB payload. That URI's namespace **root** moved at 0.4.1, and it is a matching
key — until **KCB 0.6.0** a consumer MUST also accept the legacy root as naming this same
extension (§2.3):

```jsonc
{
  // ── standard A2A AgentCard fields (abridged) ──
  "name":     "orchestrator:agent:composer",     // card identity — the KINP agent/entity id
  "supported_interfaces": [                       // A2A v1.0 — replaces v0.x's top-level "url"
    { "url": "https://…/a2a", "protocol_binding": "JSONRPC" }   // one AgentInterface; MAY be several
  ],
  "capabilities": {
    "extensions": [
      // ── the KCB manifest, as ONE AgentExtension on the card ──
      {
        "uri":         "https://w3id.org/koine/kcb/manifest/0.3",
        "description": "Koine capability-bus manifest",
        "required":    false,
        "params": {
          "kcb_version": "0.3.0",
          "mcp":         "https://…/mcp",          // MCP tools endpoint the extension still needs
          "produces":    [                          // ports emitted (§2.1)
            { "plane": "media", "media_types": ["audio/wav"], "world_pattern": "*",
              "schema_id": "sha256-…",              // digest over this port's shape (§7.1)
              "volume":    { "unit": "event", "rate": { "typical": 2, "peak": 30 } } }  // delivery envelope (§4.2a); outside the digest
          ],
          "consumes":    [                          // ports accepted
            { "plane": "knowledge", "dialect": "grounding-only", "schema_id": "sha256-…" },
            { "plane": "entity",    "types": ["mood", "scene"],  "schema_id": "sha256-…" }
          ],
          "capabilities": [                         // named, invocable units; i/o are ports
            { "name":    "compose",
              "version": "1.2.0",                                                  // semver, NEVER in the name (§7.1)
              "binding": { "tool": "compose" },                                    // OPTIONAL transport address for THIS major (§2.4)
              "inputs":  [ { "plane": "knowledge", "shape": "mood-descriptor",
                             "payload_schema_id": "sha256-…",                      // OPTIONAL digest over the PAYLOAD (§7.1)
                             "schema_id": "sha256/kcb2-…" } ],                     // knowledge IN — rule-id'd digest (§7.1 step 5)
              "outputs": [ { "plane": "media", "media_types": ["audio/midi"],
                             "schema_id": "sha256-…" } ],                          // media OUT (delta F)
              "cost":    { "tier": "paid", "est_units": 1200 },                    // path cost (delta K); outside the digest (§7.1)
              "deprecated":      true,                                             // OPTIONAL marking (§7.3a); absent = NOT deprecated
              "removal_version": "3.0.0" },                                        // OPTIONAL (§7.3a); the successor's next major (§7.3c)
            { "name":    "compose",                                                // the SAME name at the next major (§7.2)
              "version": "2.0.0",
              "binding": { "tool": "compose_2" },                                  // a different transport id; discovery still matches "compose"
              "inputs":  [ /* … */ ], "outputs": [ /* … */ ] }
          ],
          "auth":     { "scheme": "capability-token", "grants_required": ["invoke:compose"],
                        "accepted_issuers": ["orchestrator:agent:governance"] },  // OPTIONAL (§5)
          "signing":  { "key_id": "…", "alg": "ed25519" }  // shared shape with KGP manifest.signing
        }
      }
    ]
  }
}
```

- The KCB extension carries **only** the KCB-specific fields — `kcb_version`, `produces`,
  `consumes`, `capabilities` (with cross-plane ports, `cost`, and 0.4.0's `version`/`schema_id`,
  §7), `auth`, and `signing`. It
  **drops** the old top-level `identity` and `endpoints` blocks: those duplicated fields the
  AgentCard already carries and are now **read off the card itself** — `identity` from the card's
  own agent id (`name`), and the A2A endpoint from the card's own
  `supported_interfaces[]` (an `AgentInterface.url`; where the card advertises several bindings, the
  consumer selects one it speaks). Any non-A2A
  endpoint the extension still needs (e.g. the MCP tools URL) is a plain field in `params`.
- **A capability is `(name, version)`; a port carries a `schema_id`** (§7,
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)). Each entry in
  `params.capabilities` SHOULD carry a semver `version`, and each port in `params.produces`,
  `params.consumes`, and a capability's `inputs`/`outputs` SHOULD carry a content-addressed
  `schema_id`. Both are **additive and optional on read**: a card carrying neither is still a
  conformant manifest — a missing `version` reads as `0.0.0`-unknown (§7.1) and a missing
  `schema_id` means *no cross-check available*, never *invalid manifest* — and consumers MUST ignore
  manifest fields they do not understand (§7.2), so 0.3.0 and 0.4.0 readers and cards interoperate
  in both directions. The extension **URI does not move** for this addition: it names the
  payload-shape *family*, while the spec version rides in `params.kcb_version`. Minting a
  `…/manifest/0.4` URI for added optional fields would make every already-published card invisible
  to a crawler matching the old one — `compose-v2`'s fragmentation (§7.1) at the document level.
- **A capability entry MAY carry a transport `binding` (optional; V-4).** §7.2 mandates that a
  provider serve two majors side by side for a transition window, and the transport KCB chose cannot
  represent that from the capability name alone: an MCP tool namespace is flat and name-keyed, so
  `tools/list` cannot return two tools called `compose`, while §7.1 forbids the name-mangling that
  would fix it and `params.mcp` is a single address. Each entry in `params.capabilities[]` MAY
  therefore carry a `binding` naming the tool id and/or endpoint **that major** is invocable at,
  which a consumer **reads from the manifest and never guesses**. Additive and optional on read
  exactly like `version` and `schema_id`: absent, a provider serves one major at the single
  `params.mcp` address exactly as it did at 0.4.9. Its rules — and why it does not breach §7.1's ban
  on version-in-the-name — are **§2.4's**.
- **A capability entry MAY carry its own `deprecated` marking and `removal_version` (optional;
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)).** §7.3a requires a
  deprecation to publish *"an explicit deprecated marking on the predecessor"* and a **removal
  version**, and §3 and §7.3d require discovery to keep returning that entry *"marked, and carrying
  its removal version"* — four normative clauses that, through 0.5.0, named **no field to read**.
  Each entry in `params.capabilities[]` MAY therefore carry:
  - **`deprecated`** — a boolean marking. **Absent means *not deprecated*.** This is the one
    absence default that is safe to read permissively, and it is safe for a stated reason: a
    deprecation is a **declaration** (§7.3a) and an undeclared one does not exist, so absence here
    is not missing information but the ordinary state. What is *not* safe is a registry **inventing**
    the value, which §3.1(d) forbids.
  - **`removal_version`** — the version at which the obligation to serve this major ends, on the axis
    §7.3b fixes (for a capability, §7.1's semver). A `deprecated` entry SHOULD carry it; one that
    does not is §7.3a's *"unbounded promise a subscriber cannot plan against"* and a consumer MUST
    read it as a deprecation with **no planned end**, never as a removal that is imminent.

  Additive and optional on read exactly like `version`, `schema_id`, `binding` and
  `auth.accepted_issuers[]`: a card carrying neither field is a conformant manifest advertising no
  deprecation, and a consumer MUST ignore fields it does not understand (§7.2), so a 0.5.0 reader and
  a card carrying these interoperate in both directions. Neither field is **shape** — both are dropped
  before hashing by §7.1 step 1, so **no published `schema_id` moves** for this addition and the
  canonicalization rule id (§7.1 step 5) does not move either. Their *meaning* is **§7.3's**, not this
  section's; what a **federating** registry does when two attributions of one entry disagree on them is
  **§3.1(d)'s**. Marking a capability deprecated does **not** move its `version` — the predecessor is
  marked in place, and §7.2's table has no bump row for it — which is the fact §3.1(d) has to be
  written against.
- **`auth.accepted_issuers[]` (optional; MA-6).** Where a deployment federates registries (§3.1), a
  provider states which **grant issuers** it honours, by KINP id, beside the existing
  `auth.scheme` / `auth.grants_required`. Additive and optional on read exactly like `version` and
  `schema_id`: a card that omits it is a conformant manifest, and in a single-host deployment it is
  simply the host that provisioned the registry. Its meaning — and failing closed on an unrecognized
  issuer — is **§5's**, not this section's. Nothing about the extension `uri`, the `params` shape, or
  a port's `schema_id` digest (§7.1) is affected by it.
- Because the provider's identity is the card's KINP agent id, **a capability provider is itself a
  fabric entity** — an agent can be referenced, grounded, and reasoned about like any other node.
- **Prior art.** Extending A2A by convention rather than forking it is already the house style
  among control-plane implementations: an engine that defines the Google-A2A-aligned `AgentCard`
  type typically also extends the standard A2A `Message` with its own ACL extensions (e.g. a
  `fromAgent` / `toAgent` pair). The KCB manifest applies the same convention to the card's
  `capabilities.extensions[]`.

### 2.1 Ports span all planes (delta F)

Ports, capabilities, and their `cost` all live **inside the KCB extension's `params`** (§2) — the
`produces`, `consumes`, and `capabilities` arrays on `capabilities.extensions[]` whose `uri` is
`https://w3id.org/koine/kcb/manifest/0.3`. Collapsing the standalone manifest onto the AgentCard moves
*where* these fields are served (card extension, not a second file) but not *what* they carry: the
plane-typed port model (F), `world_pattern` world-scoping (J), and capability `cost` (K) are all
preserved verbatim as extension `params`, not dropped.

A **port** is a typed connection point used by the extension's `produces`, `consumes`, and every
capability's `inputs`/`outputs`. Its `plane` selects the type vocabulary:

| Port plane | Typed by | Example |
|---|---|---|
| `knowledge` | KGP `dialect` + optional `worlds`, plus a `shape` naming the payload and an OPTIONAL `payload_schema_id` digesting it (§7.1) | a mood descriptor; a GroundingPack |
| `media` | KMI `media_types` + optional `world_pattern` (delta J) | `audio/wav` from world `alderforest` |
| `entity` | KINP entity `types` | a `mood` / `scene` / `plugin` entity ref |

Because ports are plane-typed, a capability may **consume knowledge and produce media** — the
"compose a score from a mood" leg the pressure test exposed (F). The `compose` capability in the
§2 example carries exactly this shape (a `knowledge` input, a `media` output) inside the
extension's `params.capabilities`, so the cross-plane example remains valid on the card. Path-finding
(§3) therefore matches these extension ports **across planes**, not media-to-media only.
`world_pattern` on a media port (in `params.produces`) lets the registry answer "media *from world
X*" (J); without it, world-scoped media discovery is impossible. `cost` on a capability (in
`params.capabilities`) lets path search prefer cheaper routes and gate spend (K).

Every port additionally carries an OPTIONAL **`schema_id`** — an algorithm-prefixed digest
(`sha256-…`, the KINP §3 form) over the canonicalized bytes of that port's *shape*. It does not
re-type the port; it is the subscriber's **cross-check** on the capability's declared `version`, so
that a schema edited without a bump is detectable rather than silent. What the canonicalization
covers, and what it deliberately excludes (`description`, `cost`, the `version` itself), is fixed in
§7.1; what a consumer does when a digest moves under an unchanged version is fixed in §7.2.

A **`knowledge`** port MAY additionally carry an OPTIONAL **`payload_schema_id`** — the same
algorithm-prefixed digest form, taken over the participant's own canonical declaration of the payload
that port carries. It exists because `shape` holds a **free-form name** and not a structure, so
redefining the payload behind an unchanged `shape` produces a byte-identical `schema_id` at an
unchanged `version` — the one failure §7.1 exists to make impossible, and it lands on the cross-plane
leg (delta F) the fabric is for (**V-2**). Media ports are protected without this because a
`media_type` names an externally standardized format, and entity ports because `types` are
registry-controlled; knowledge ports have neither property. Unlike `cost`, `volume` and `effect`,
`payload_schema_id` **is** shape: it sits **inside** the §7.1 canonicalization as a knowledge-plane
shape key — so declaring one puts that port's own `schema_id` on the **`kcb2`** rule, which §7.1
step 5 requires the digest's prefix to **name** (**V-11**). It is optional on read and on write — and
what a consumer must conclude from a knowledge port that carries **none** is fixed in §7.1, not
here. So is what one that carries **one** is *worth*: §7.1 fixes the canonicalization, and fixes that
the cross-check is performable only where the declaration the digest covers can be obtained, and
**provider-attested** where it cannot (**V-9**).

A port MAY additionally carry an OPTIONAL **`volume`** — the delivery envelope a subscriber to that
port would be accepting (rate, payload size, asset references per delivery, resume horizon). Volume
is not shape: it sits **outside** the `schema_id` digest exactly as `cost` does, and it is what lets
a subscriber tell a firehose from a trickle **before** it binds, which no other field on any plane
could. Its shape and the rules that read it are fixed in **§4.2a**.

A capability and a port MAY additionally carry an OPTIONAL **`effect`** — the class of effect an
invocation over it causes: what the caller cannot undo (`reversibility`), and whether it is confined
to the callee's authority domain or observable outside it once made (`visibility`). Effect is not
shape either, and sits **outside** the `schema_id` digest exactly as `cost` and `volume` do. It is
the operand a declared autonomy posture reads, and without it two capabilities that differ only by
**permanence** are indistinguishable on every field the manifest and the registry carry. An absent
declaration reads as *unknown*, never as harmless. Its shape and the rules that read it are fixed in
**§4.3a**.

### 2.2 Migration — 0.2.0 standalone manifest → 0.3.0 card extension

0.2.0 served a standalone `/.well-known/kcb-manifest.json`; 0.3.0 folds that payload onto the peer's
existing A2A AgentCard as the `https://w3id.org/koine/kcb/manifest/0.3` extension (§2). Field-by-field:

| 0.2.0 standalone manifest field | 0.3.0 destination |
|---|---|
| `identity` (top-level) | **dropped** — read off the AgentCard's own agent id (`name`) |
| `endpoints.a2a` (self-reference to the card) | **dropped** — the A2A endpoint is the card's own `supported_interfaces[]` (A2A v1.0 `AgentInterface.url`) |
| `endpoints.mcp` (and any other non-A2A endpoint) | extension `params.mcp` (a plain `params` field) |
| `produces` | extension `params.produces` |
| `consumes` | extension `params.consumes` |
| `capabilities` (incl. cross-plane ports + `cost`) | extension `params.capabilities` |
| `auth` | extension `params.auth` |
| `signing` | extension `params.signing` |

- **The window is closed: the standalone manifest is REMOVED at this version (0.5.0).** 0.3.0
  bounded the transition by a *condition* ("until all consumers crawl the extension"), which is not
  something a consumer can plan against, so under the deprecation policy (§7.3) that deprecation was
  made to name its own end — **removed at KCB 0.5.0** — and this publication *is* that version.
  Under §7.3f the removal ends an **obligation**, not a readability: past 0.5.0 a provider MUST NOT
  rely on the standalone `/.well-known/kcb-manifest.json` being read, and a registry is **no longer
  obliged to crawl it** (§3 populates from the card extension alone). Serving the file additionally
  is not forbidden and is not conformance — nothing may depend on it. Nothing already published is
  invalidated: a manifest recorded under 0.2.0 stays readable, and an archival record naming that
  location stays resolvable (§7.4). The table above is retained as the field-by-field record of where
  each 0.2.0 field went, which a reader migrating an old deployment still needs.
- **This removal is not a fold.** It is an obligation declared before this release and now due;
  §7.3c forbids declaring and removing in one publication, and 0.5.0 is the version that was
  declared. §2.3's separate window — the legacy extension-URI root — is **untouched** and still runs
  to **KCB 0.6.0**.
- **`signing` MUST be preserved intact.** [`grounding-pack.md`](grounding-pack.md) line 313 declares
  `manifest.signing = {key_id, alg}` the *shared* signing shape between the KCB manifest and KGP
  packs; the collapse moves `signing` into `params` but MUST NOT change its shape, so provenance
  attribution (KINP §7) stays cryptographically valid across the migration.

### 2.3 Transition — the extension URI's namespace root moved (0.4.1)

The extension URI is a **matching key**, not a fetch target: a consumer identifies the KCB manifest
by string-comparing the `uri` of each entry in the card's `capabilities.extensions[]`. Changing that
string is therefore breaking for any consumer that matches on the old literal, and this section
states what a conformant participant does about it rather than leaving each implementation to guess.

**What moved.** Only the namespace *root*. The path and version segment are byte-unchanged, so the
two URIs name the same manifest-payload family and the same `0.3` shape:

| | Extension URI |
|---|---|
| **Legacy** — deprecated at 0.4.1, removed at **KCB 0.6.0** | `https://koine.dev/kcb/manifest/0.3` |
| **Current** — the form a producer emits | `https://w3id.org/koine/kcb/manifest/0.3` |

The root moved because the legacy hostname was **verified unregistered on 2026-08-11** — DNS held no
record for it and the host could not be resolved at all. An unregistered hostname standing as an
identifying URI is squattable, and there is no recovery once conformant implementations have shipped
the literal: a string already compiled into peers you do not operate cannot be recalled. `w3id.org`
is a community-run, redirect-only permanent-identifier service, so the identifier no longer depends
on any private domain registration staying renewed. Registration provenance (the PR that created the
entry) and the full rationale are recorded in
[ADR-0007](../decisions/ADR-0007-self-describing-participant.md)'s amendment log.

**The dual-accept window.** For the whole window — from 0.4.1 up to, but not including, **KCB
0.6.0**:

- **a. A consumer MUST accept both.** A consumer matching manifest extensions MUST treat an entry
  whose `uri` carries the legacy root and an entry whose `uri` carries the current root as
  identifying the **same** KCB manifest extension, and MUST read `params` identically from either. A
  consumer that matches only one of the two is non-conformant for the duration of the window.
- **b. A producer MUST emit the current form.** Every manifest a producer publishes MUST carry the
  `https://w3id.org/koine/…` URI on its KCB extension entry; a producer MUST NOT publish the legacy
  form alone.
- **c. Serving both is permitted; the current form is authoritative.** Per §7.3d a producer MAY
  *additionally* publish a second extension entry bearing the legacy URI with **byte-identical**
  `params`, so that a consumer written before this window still discovers it. Where both entries are
  present the current-root entry is authoritative, and a consumer MUST NOT count the legacy mirror
  as a second, distinct manifest.
- **d. The legacy form is deprecated on sight.** Discovery (§3) MUST keep returning a peer whose card
  carries only the legacy entry — marked deprecated, carrying the **0.6.0** removal version, and
  ranked below any peer that satisfies the same query with the current root (§7.3d).
- **e. At KCB 0.6.0 the obligation ends, not the readability.** Past 0.6.0 a producer MUST NOT emit
  the legacy URI and a consumer is no longer obliged to accept it. Nothing already published is
  invalidated (§7.3f) — an archival record naming the legacy URI stays resolvable (§7.4) — and the
  removal version MAY be moved later, never earlier (§7.3e).

**Why 0.6.0 rather than 0.5.0.** §7.3c requires at least one full minor between declaring and
removing, which 0.5.0 satisfies arithmetically; but 0.5.0 already carries §2.2's standalone-manifest
removal, and stacking two retirements in one release leaves a subscriber that first meets this
deprecation at 0.5.0 no version in which to act on it. 0.6.0 spends the whole 0.5.0 cycle as the
window. Per §7.3b that window is measured in KCB's own minor versions, never in wall-clock dates.

**Downstream obligation — named here, performed elsewhere.** Any implementation that pins the legacy
literal must migrate. A runtime commons carries the string in several places, including a
**byte-for-byte conformance corpus**: a corpus compared by bytes does not accept a substituted
string, so its fixtures must be re-emitted and re-hashed, not edited in place. Per
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) runtime work is not done in koine —
that migration is the cross-repo tasklist `agora:72-kcb-extension-uri-migration`, which depends on
this one. No schema in this repository models the AgentCard extension entry, so nothing here rejects
a legacy peer's card; clause **a** is prose, and prose is where a consumer's obligation lives. The
one schema that does name the URI — `participant-self-description.schema.json`'s
`manifest_extension_uri`, what a participant *declares it serves* — is the twin of clause **b** and
so admits the current form only.


### 2.4 Transport binding — addressing a second major (0.5.0)

Where a provider serves two majors of one capability, **how a consumer dials the one it means**.
This folds **V-4** of [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
which found the dual-serving window §7.2 *mandates* to be unrepresentable on the transport KCB
chose: an MCP tool namespace is flat and name-keyed, so two tools cannot both be `compose`; §7.1
forbids the `compose-v2` name-mangling that would fix it; and §2 carries a single `params.mcp`
address. The contract layer and the transport layer disagreed, and no clause reconciled them.

**Two namespaces, and only one of them is governed by the ban on version-in-the-name.** This is the
distinction that makes the fold consistent with §7.1 rather than a hole in it:

| Namespace | Who reads it | Rule |
|---|---|---|
| The **capability name** (`params.capabilities[].name`) | the registry (§3), and every consumer searching for the capability | MUST NOT carry a version. §7.1 is **unchanged**: a successor hiding under a different *name* is invisible to the party that needs to find it. |
| The **transport binding** (`params.capabilities[].binding`) | only a consumer that has already read this entry off this card | A local addressing detail. Nobody discovers by it, so a provider may serve major 2 at a tool id of its choosing. |

Normative:

- Each entry in `params.capabilities[]` MAY carry an OPTIONAL `binding`:

  ```jsonc
  "binding": { "tool": "compose_2",              // OPTIONAL — the MCP tool id THIS entry is invocable at
               "endpoint": "https://…/mcp/v2" }  // OPTIONAL — where, if not the manifest's params.mcp
  ```

- **A consumer reads the binding; it never guesses one.** A consumer MUST NOT derive a transport id
  from a capability's name and version, MUST NOT assume that two entries sharing a name share an
  address, and MUST NOT assume that an entry with no `binding` is unreachable — absent, the entry is
  invocable under its own `name` at the manifest's `params.mcp`, which is 0.4.9 behaviour exactly.
- **A provider serving more than one major of a name MUST make each addressable.** It does so by
  giving at least the entries that would otherwise collide a distinct `binding`. Serving two majors
  that resolve to one transport id is **non-conformant**: it is §7.2's dual-serving obligation
  asserted and not met.
- **A binding is not shape and not identity.** It addresses a capability, not a port, so §7.1's
  canonicalization and every published `schema_id` are untouched; and it is not part of what a grant
  scopes (§5) or what §3 matches or ranks. Under **§3.1(d)**'s de-duplication converse two entries
  are **one** capability where the provider KINP id, `(name, version)` and `schema_id` agree — a
  `binding` is none of those three, so a per-major address neither merges two entries nor splits one.
- **A binding may change without the payload changing**, so changing it is a **minor** bump on the
  capability that carries it (§7.2) — the version moves, and a consumer holding a cached address
  re-reads it at discovery or `describe` (§4). A live `subscribe` learns of it on §4.2d's control
  channel, in §7.3g's **`entry_changed`** frame, emitted before the move takes effect — so a
  subscriber that re-establishes a dropped stream, or `invoke`s the same capability, dials the new
  address rather than the old one. That is the whole reach of the promise and it is stated rather
  than implied (**V-10**): a consumer holding only a **cached discovery binding** has no channel
  (§7.3g's closing bullet, DEFER-D) and does meet a moved `binding` at a failed dial, recovering by
  re-`describe`.
- **The registry needs no field of its own.** §3 indexes what the card carries, so a `binding` is
  returned with the entry that carries it and ranked by nothing.

**Bounded on purpose.** This section does **not** require a provider to serve two majors at two
endpoints, does not define a naming convention for transport ids, does not make `binding` a
discovery key, and does not touch §7.1's ban on version-in-the-name.

---

## 3. Discovery registry

A thin index of manifests — *who offers what*. **The control-plane host provisions and hosts
it** (it is itself a host-provisioned org, per the fabric thesis: the interconnect fabric is
itself Company-as-Code). The registry is a cache/index over participants' own MCP/A2A surfaces,
not a source of truth — a provider's manifest is authoritative; the registry just makes it
findable. One registry per authority domain is the default and stays conformant unchanged; where a
deployment needs more than one, they **peer** (§3.1).

- **Population:** participants register their manifest (push), or the registry crawls known A2A
  agent-cards / MCP servers (pull) and **reads the KCB extension off each peer's
  `/.well-known/agent-card.json`** — it looks for the `capabilities.extensions[]` entry whose
  `uri` is `https://w3id.org/koine/kcb/manifest/0.3` and indexes that entry's `params` (ports,
  capabilities, cost, and — where present — each capability's `version` and each port's
  `schema_id`, §7.1). There is no separate manifest file to crawl; a card without the extension
  simply advertises no KCB ports.
- **Query:** `find(port | plane | world | capability)` → matching manifests, ranked. Ports are
  the extension `params`' `produces`/`consumes`/capability ports (§2.1); media ports match by
  `media_type` **and** `world_pattern` (delta J). A capability query matches a capability **name
  plus an OPTIONAL version range** (§7.1): the bare name matches every published version, a range
  (e.g. `^1`) only what satisfies it.
- **Ranking across versions (§7).** Among entries satisfying the same query the registry MUST rank
  the **highest satisfying version** first, and MUST rank a **deprecated** entry below any
  non-deprecated entry that satisfies the same query — while still returning it, marked and carrying
  its removal version (§7.3d). *Marked* and *carrying* name two fields, and since
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) they are the ones §2
  defines: **`deprecated`** and **`removal_version`** on the capability entry. The registry reads
  them off the provider's card like every other entry field and MUST NOT derive, infer, or
  synthesize either. This is what makes a successor discoverable *beside* its predecessor:
  an unpinned consumer migrates by re-discovering, a consumer pinned to `^1` keeps finding 1.x, and
  either way a subscriber meets a break or a deprecation at **discovery or `describe`** time rather
  than at `invoke` (§7.2).
- **What a `find` returns, where a deployment federates (§3.1(c)(e)(f); MA-8).** A result is a list
  of **entries** plus a result-level status. Each entry carries the manifest data above and:
  **`served_by`** — the KINP id of the registry that served it, which is the registry's own id for a
  locally indexed entry and the **peer's** id for a peered one, so peered is distinguishable from
  local — together with a resolvable address for that registry (§3.1(c)); and **`observed_at`** —
  when the serving registry observed the entry from its source, SHOULD-level per §3.1(e). The
  **result** carries **`incomplete[]`** — the KINP ids of peers that were asked and could not be
  reached (§3.1(f)) — empty when every peer answered, so a short result is never silently short.
  This is a **carrier** for clauses §3.1 already states normatively, not a new obligation: a
  single-registry deployment emits none of it and is conformant unchanged, and a consumer MUST
  ignore fields it does not understand (§7.2). It is deliberately **not** a ranking or a trust
  weighting over `served_by`, which §3.1(d) refuses.
- **The deprecation marking is entry data, not a second envelope
  ([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)).** §2's `deprecated` and
  `removal_version` reach a consumer the way `version`, `schema_id`, `binding` and `cost` do: as part
  of *"the manifest data above"* on each entry, in **every** `find` response and not only a federated
  one. Nothing is added to the result-level shape for them, and the three registry-generated fields
  above (`served_by`, `observed_at`, `incomplete[]`) are untouched — those exist because no provider
  card can carry them, which is exactly not the case here. So a **single-registry** deployment gains
  no new obligation at all: it returns what the provider published, and if the provider published
  neither field the entry carries neither and is conformant unchanged (§7.2's ignore-unknown-fields
  rule is what makes that true in both directions). Where a deployment **federates**, one entry may
  be reached through more than one peer and the two attributions may disagree about these fields —
  that case, and only that case, is **§3.1(d)'s**.
- **Composition:** because the extension's ports are plane-typed (§2.1), the registry computes a
  *path* from a start port to a goal port **across planes and providers** — e.g. `text →
  narration:audio`, `mood(knowledge) → score:audio`, `assets → edl → CMX3600` — the bounded,
  contract-matched form of any-to-any (delta F), resolved by matching the ports crawled off peers'
  card extensions rather than a central transform-gateway. Path search **prefers zero-`cost`
  routes** using each capability's `params.capabilities[].cost` and returns the path's projected
  cost so the caller can gate spend before invoking (delta K). Each leg of the returned path names
  the **`(name, version)` it was matched over**, and the projected cost is the cost of exactly those
  legs — the next bullet.
- **A path leg names the version it was matched over (MT-1).** NORMATIVE, and it mints no field.
  §7.1 makes `(name, version)` — *"not the name alone"* — the unit of discovery, and the *Ranking
  across versions* bullet above makes the registry match the **highest satisfying version** first.
  So a path is **already built over a specific version of each leg**; what was missing is that the
  result said which. Where a `find` returns a path:

  - Each leg MUST name the capability **`name`** and the **`version`** the registry matched it
    over — the exact version of the entry whose ports satisfied that leg, never a range, never the
    name alone, and never a version the registry did not match. A leg matched over an entry
    carrying no `version` is named at §7.1's **`0.0.0`-unknown** reading, which is a value and not
    an omission.
  - The path's **projected cost** is the sum of the `cost` of exactly the legs as named, read from
    the same entries. A caller that gates spend on the plan is therefore gating against the same
    `(name, version)` it planned over, and not against some other major of the same name.
  - A plan leg is the registry's account of **what it matched**, not a reservation and not an
    instruction. It reserves nothing, expires by nothing, and binds no provider — the registry
    returns *addresses* and peers dial directly
    ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)). Which major an `invoke` actually
    runs against is **§4.4**'s, resolved there and nowhere here.

  **Why this is a clause and not a nicety (MT-1).** Without it a plan cannot **disagree** with
  anything: §4.4c resolves a version-free `invoke` to the grant's major, so a caller that planned
  over a top-ranked successor and holds a predecessor grant is served the **predecessor** — a major
  the grant authorizes, so §5's gate is satisfied and nothing is refused, while the leg that runs is
  not the leg that was matched or the one the projected cost was quoted from. §4.4c forbids
  resolving to the *highest published* major **by name** as the fail-open inversion **V-5** found;
  this is the same silent selection with the sign reversed, and the party it disagrees with is not
  the grant but §3's own plan. The plan had to **say what it planned over** before any clause could
  catch the disagreement.

  **Additive at every surface.** The registry already indexes each capability's `version`
  (*Population*) and already returns it as entry data (*What a `find` returns*), so this fixes what
  the **path result** carries and mints no field, no verb and no ranking rule; ranking is unchanged;
  a deployment that computes no paths gains no obligation; a **single-registry** deployment is
  conformant unchanged; and a consumer MUST ignore fields it does not understand (§7.2), so a
  consumer that reads no leg version is unaffected.

  **Re-ratification — this adds no count, and the re-run has been walked (2026-09-12).** MT-1 is a
  delta of count **(i)**, so this bullet and §4.4c's cross-check re-enter validation there rather
  than opening a seventh count. That re-run has now been done — by hand, against the prose, at 0.5.7
  / KMI 0.3.8, the first text carrying both halves:
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) § *Re-run — Steps 1,
  3, 4 and 8 walked by hand against KCB 0.5.7 / KMI 0.3.8*. **MT-1 does not reproduce** and F/J/K/G/L
  hold for a second consecutive walk, but the count does **not** close: it breaks on **MT-2** (High,
  carrier) — this bullet's *"it mints no field"* is true of a **leg** and false of a **path**, since
  §3's *Query* bullet types `find` by four operand kinds returning *"matching manifests, ranked"* and
  no clause of §3, §4 or §7 types a path **request** or a path **result** at all, while §4.4c then
  types `planned_leg` *"as §3 returned it"* against that absence. The fold is MA-8's shape applied to
  the path result, additive and KCB-only, and **unowned**.
- **Route-by-lookup, not proxy ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).**
  The registry returns *addresses*; peers then connect **directly** over MCP/A2A — no
  inter-service traffic flows through it. An optional **aggregator facade** MAY present a unified
  tool namespace to clients (forwarding without transforming) for convenience, but is never the
  mandatory path. The registry + resolver reference implementation is a downstream runtime
  concern, not part of this contract.

### 3.1 Registry federation — peering registries (0.4.6)

How discovery works when more than one registry exists. This was KCB's open question 1 through
0.4.5 — *a single host-provisioned registry vs. per-org registries that peer* — deferred there
because two sibling specs deferred the same question at their own surfaces. It is decided once, for
all three, by [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md): **an authority is a
role, not a hard dependency.** KINP applies that decision to the identity-authority role (§11
decision 1 there); this section applies it to discovery.

This section is **additive**. A deployment that runs exactly one registry (§3) is conformant
unchanged: no verb changes (§4), and nothing below is required of a participant whose deployment has
one registry. At 0.4.9 the fold of **MA-6** adds one **optional** manifest field —
`auth.accepted_issuers[]` (§2) — read only by §5; a card that omits it is conformant, and the §3
`find` response shape that carries (c), (e) and (f) is emitted only where a deployment federates.

**a. Federation is a composition of registries, not a redefinition of one.** Each registry in a
federation is a §3 registry: it indexes the participants of its own **authority domain** — those
that registered with it, or whose cards it crawled — and a provider's own card remains
authoritative over any index entry (§2, §3). A registry is authoritative for **which entries it
serves**, never for the contents of an entry it did not read off the provider's card itself.

**b. Peering resolves queries, it does not relay traffic
([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).** A registry MAY answer a `find`
(§3) from its peers as well as its own index, by forwarding the *query* and merging the entries
returned. That is a control-plane lookup and stays within §3's route-by-lookup rule, because what
comes back is still an **address**: the consumer then dials the provider **directly** over MCP/A2A.
A registry MUST NOT carry `invoke`, `subscribe`, or `fetch` traffic (§4) on a peer's behalf, and a
peered entry MUST NOT name a registry as the address of a capability. An aggregator facade stays
what §3 already makes it — optional, forwarding without transforming, never the mandatory path.

**A forwarded `find` carries a horizon (MA-9).** Forwarding is otherwise unbounded: mutual or
three-way peering re-forwards the same query indefinitely, and nothing above stops it. A registry
that forwards a `find` MUST attach a **query id** and a **remaining hop count**, MUST decrement the
hop count on each forward, MUST NOT forward at zero, and MUST **drop** — answering from its own
index alone — a query id it has already seen. The values are a deployment's choice; what KCB fixes
is that the two operands exist on a forwarded query and that a registry honours them. This bounds a
**query**, not a topology: no peering topology, no federation membership protocol, and no limit on
how peers are configured is specified here or anywhere in this section.

**c. The authority boundary is observable.** Every entry a registry returns MUST be attributable to
the registry that served it: an entry sourced from a peer MUST carry that peer's **KINP id** (§2 —
a registry is a participant, so it has one) and a resolvable address for it, and MUST be
distinguishable from a locally indexed entry. A consumer that cannot tell which authority asserted
an entry cannot choose between two of them, which is the whole of what federation adds. The carrier
for this is §3's `find` response: per-entry **`served_by`** plus a resolvable address for it
(MA-8).

**d. Ranking and conflict across peers.** §3's ranking rules — highest satisfying version first,
deprecated below non-deprecated (§7.3d) — apply to the **merged** result set unchanged, and MUST
NOT be overridden by whether an entry is local or peered. Where two entries from different
authorities name the same capability, the registry MUST return **both**, ranked by §3's rules and
attributed per (c); it MUST NOT silently pick one. Two different providers offering the same
capability `name` at the same `version` is not a conflict at all — capability identity is
`(name, version)` **as published by a provider** (§7.1), and the provider is identified by its own
KINP id. The same provider reached through two peers at the same `(name, version)` but a differing
`schema_id` is a defect at that provider (§7.2), not a choice for the registry: both entries are
returned, and the consumer resolves it by re-reading the provider's card.

**The converse: one participant reached twice is one entry (MA-9).** The rule above forbids
silently reconciling two capabilities; it does not license **inventing** a second one. Where two
entries resolve to the same provider **KINP id**, the same `(name, version)` **and** the same
`schema_id`, they are **one** capability with **multiple attributions**: the registry MUST return it
once, carrying every `served_by` that offered it (c), and MUST NOT present it as two capabilities or
as two authorities. This completes the case the paragraph above already half-covers — same provider,
two peers, **differing** `schema_id` is a defect and both entries are returned; identical on all
three, it was always one capability and only the path to it differed.

**Merging attributions merges *attributions*, never *contents*
([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)).** The converse keys on
`(provider KINP id, (name, version), schema_id)`, and a capability entry carries fields that key
moves for **none** of: `cost` (§5), the transport `binding` (§2.4), `volume` (§4.2a), `effect`
(§4.3a), and the `deprecated` marking with its `removal_version` (§2, §7.3a). Each is deliberately
outside §7.1's digest, so two attributions of **one** capability can satisfy the converse *exactly*
and still disagree about them — a stale read of a provider's card beside a fresh one is the ordinary
way that happens, and for the marking it is the **expected** way, because §7.2's table has no bump
row for marking a capability deprecated and the predecessor is marked **in place**.

**Which of the five the key rescues, and which it does not (BP-8, AP-9).** A field outside the merge
key is rescued **not by the key but by the `version` its declared bump moves**, because `version` *is*
in the key: where §7.2 requires a bump for a change to such a field, a stale attribution and a fresh
one carry **different versions**, fail the converse, and are returned as the two entries they are —
the disagreement never reaches the inside of a merged entry, and (i) and (ii) never fire on it. As of
**0.5.4** four of the five are rescued that way: `cost` (§5, *never silent*), the transport `binding`
(§2.4), `volume` (§4.2a) and `effect` (§4.3a) each have a **minor** row in §7.2's table. The fifth is
not, and cannot be: the `deprecated` marking and its `removal_version` are applied to a published
capability **in place** — that is what §7.3's dual-serving window *is* — so no bump moves the version
under them, and two attributions at one identical key disagreeing about the marking stays the case
this clause was written for. Rules (i) and (ii) below are therefore unchanged in substance and
narrower in reach than they read at 0.5.1: they are the whole of the contract for the marking, and a
**backstop** for the other four, which a conformant provider's bump should have kept out of the
converse in the first place. That is a strength, not a redundancy — a provider that changes `volume`
without bumping has committed §7.2's *digest-change-without-a-bump* defect one field over, and (i)
carries both attributions rather than hiding it.

Three rules follow. All three apply **only within the converse** — one provider KINP id, one
`(name, version)`, one `schema_id`, reached more than once.

- **(i) A registry MUST NOT synthesize a value for a field outside the merge key.** Where two
  attributions of one entry disagree on such a field, the merged entry MUST carry **each
  attribution's own copy**, bound to the `served_by` and `observed_at` (c, e) that supplied it. A
  registry MUST NOT pick one, prefer its own, prefer the newest, average, or drop the field. The
  per-attribution form **is** the mark of disagreement and MUST be machine-readable as one: an entry
  carries such a field **once** when every attribution agrees and **per attribution** when they do
  not, and a consumer MUST read the second form as *unresolved at the registry* and resolve it under
  (e), against the provider's own card. This is (a)'s rule reaching the **inside** of an entry — a
  registry is authoritative for *which entries it serves*, never for the contents of an entry it did
  not read off the provider's card itself — and it is what (e) needs in order to fire at all: (e)
  tells a consumer to resolve a disagreement against the provider's card, which it can only do if it
  can **see** the disagreement, and collapsing the field is precisely what would hide it. Nothing is
  added to the result-level shape for this; it is per-entry field data, not a second envelope.
- **(ii) Where the disagreeing field is a gate, the restriction wins.** If **any** attribution marks
  the capability `deprecated`, the merged entry is **deprecated** for the purposes of §7.3d's ranking
  and marking: ranked below any non-deprecated entry satisfying the same query, still returned, still
  functional. This is
  [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive
  discipline **reused**, not a second convention invented — the same reading that makes the effective
  posture an intersection, and the same one KMI §7.1(e) takes over a divergent `egress` — and the
  asymmetry that justifies it here is measurable rather than asserted: a **false** deprecation costs
  a **ranking demotion** on an entry §7.3d keeps returning and keeps functional, and is corrected by
  one re-read of the provider's card under (e); a **missed** one is the silent case §7.2 makes
  **non-recoverable** — the subscriber this window exists for meets the removal as a dead binding
  instead of at discovery. The same reading governs the other two gate-valued fields outside the key,
  `effect` (§4.3's *an unadmitted effect is a refusal, never a silent proceed*) and `volume` (§4.2's
  *absent reads unknown, never low*). It does **not** reach `removal_version`, which is a **planning**
  datum and not a gate: disagreeing removal versions stay under (i), carried per attribution and
  resolved against the provider's card, because §7.3e already fixes that a declared removal moves
  later and never earlier and a registry taking the earliest of two reads would be the registry
  shortening a window on the provider's behalf.
- **(iii) None of this licenses reconciliation.** (d)'s prohibition above is untouched: two entries
  from two **authorities** naming the same capability are still **both** returned, ranked by §3's
  rules and attributed per (c), and still never silently picked between. Rules (i) and (ii) are not
  an exception to it and MUST NOT be read as one — they govern the inside of a single entry that the
  converse has already established is **one** capability, and (ii)'s restriction-wins rule is a
  statement about a **field**, never a ranking over `served_by`, a trust weighting, or a preference
  between peers, all of which (d) refuses.

**What this clause deliberately leaves undecided.** No wall-clock timestamp on the marking — the
parked `deprecated_at` of `DEFER-E` is **unmoved** and its trigger unchanged, and `removal_version`
is a version on §7.3b's axis, never a date. No cadence, TTL, or refresh obligation on a discovery
binding (`DEFER-D`, likewise unmoved): `observed_at` records **when** an attribution was read and
obliges no one to read again. And no peering topology, federation membership protocol, or trust
weighting: (b) bounds a query and (d) refuses ranking by attribution, and neither is reopened.

**e. Staleness is visible, never silent.** A registry is already a cache (§3); a peered entry is a
cache of a cache. A registry SHOULD carry, on each peered entry, when that entry was observed from
its peer — the carrier is §3's per-entry **`observed_at`** (MA-8). A consumer MUST resolve any disagreement between two entries — or between an entry and
what it finds on the wire — against the **provider's own card**, never by preferring one index over
another.

**f. An unreachable peer degrades discovery; it invalidates nothing.** Per ADR-0012, an authority
role is not a hard dependency. A peer that cannot be reached MAY narrow what a `find` returns, and
a registry MUST report that a peer was unreachable rather than return a silently short result — the
carrier is §3's result-level **`incomplete[]`**, naming the peer by KINP id (MA-8). It
MUST NOT invalidate a locally registered manifest, a grant already issued (§5), a version already
pinned (§7.4), or a live `subscribe` (§4) — none of which is mediated by the registry.

**Re-ratification.** This section is new normative text and is candidate on the cross-authority
break test in
[`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), which must
break-test the pattern ADR-0012 shares across all three planes — for this section specifically,
peering that returns stale, conflicting, or unresolvable authority records. It is a **third** count
on this spec's status and gates §3.1 alone; the two legs in the status note are unaffected.

That test is now written and run:
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md). It did **not** pass
clean. §3.1(b)'s route-by-lookup rule held against the case built to break it, §3's version ranking
applied to the merged set unchanged, and §3.1(d) returned both authorities' entries without
reconciling them — but three deltas are open against this section: **MA-6** (blocking — discovery
federates and **authorization** does not: §5 grants issue from one host, so §3.1 returns addresses
whose calls nobody can authorize across a domain edge), **MA-8** (three of §3.1's six clauses have
no carrier in §3's `find` response — no serving-peer id, no peered-vs-local marker, no observation
time, no partial-result channel for an unreachable peer), and **MA-9** (a forwarded `find` has no
horizon and no de-duplication key).

**All three are folded at 0.4.9** — MA-6 by §5's issuer-named grant, the optional
`auth.accepted_issuers[]` of §2 and the stated-unit rule for `budget_units`; MA-8 by the §3 `find`
response shape (`served_by` + `observed_at` per entry, `incomplete[]` per result) that carries (c),
(e) and (f); MA-9 by (b)'s query-id-and-hop-count horizon and (d)'s de-duplication converse. The
extent of each is reasoned in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).
**The §3.1 count nevertheless stays open**: a fold does not close its own gate, and this count now
reads as a **re-run of Steps 5–7 against the folded text**. The four other counts on this spec —
the [`e2e-media-transform.md`](../scenarios/e2e-media-transform.md) re-run, the §7.5 mutate-live-schema
re-run, §4.2's subscription-firehose re-run, and §4.3's cross-owner-posture re-run — are restated and
**none moves**; in particular
0.5.0 stays spoken for by §2.2's standalone-manifest removal, which is why this fold is a patch. See
that scenario's *Re-ratification — what this pass gates* section.

**That re-run has now been walked — by hand, on 2026-09-03 — and this count does NOT close.**
Steps 5–7 were read against the folded text of §2, §3, §3.1 and §5 rather than replayed
(`kcs:multi-authority` came back `green` over six blocking deltas, **DR-8**; a green encoding is
evidence about the encoding). **Steps 6 and 7 flip** — §3.1(c)'s attribution reaches the prefix
question with KINP §3.4 answering *published where*, and §3.1's addresses compose with §5's
issuer-named grant so a peered address is authorizable or refused for a stated reason rather than
silently. Inside **Step 5** all three of the deltas this fold was written for hold: MA-9(i)'s
query-id-and-hop-count horizon terminates both the mutual and the three-way re-forward, MA-9(ii)'s
de-duplication converse returns **one** entry with **both** `served_by` attributions (with the
declared residual that `schema_id` is optional, so the conservative default returns both
unreconciled), and MA-8's three carriers — per-entry `served_by`, per-entry `observed_at`,
result-level `incomplete[]` — exist for the three clauses §3.1 had asserted without one.
**Step 5 nevertheless breaks, on a clause this repo has already decided and not yet written.**
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) (Accepted 2026-08-26)
records that §7.3's **deprecated marking and its removal version have no carrier** in §2's manifest
or §3's `find` response, and that §3.1(d)'s converse keys on
`(provider KINP id, (name, version), schema_id)` — **none of which a marking moves**. Re-walked, it
reproduces exactly: a stale attribution and a fresh, deprecation-marked one of the same
`compose 1.4.0` MUST be returned as **one** entry whose marking is undefined, §3's *rank a deprecated
entry below a non-deprecated one* has nothing to read, and §3.1(e) **cannot fire** because the
converse has just removed the visible disagreement. Verified against the text, not inferred: no
deprecation field exists on a §2 capability entry or in §3's response shape. ADR-0014's own
disposition says the clause *"lands with counts (ii) and (iii)"* — **count (iii) is this walk** — and
its four parts (a carrier for the marking; a registry MUST NOT synthesize a value for a field outside
the merge key; where the field is a gate the restriction wins; none of it licenses reconciling two
authorities) are the fold this count is now waiting on. **Nothing else about this spec's status
moves.** The other four counts are untouched by this walk and remain open, so **KCB is not
promotable on it and would not have been on a clean one** — clearing one of five is not a promotion.
The walk is recorded in that scenario's *Re-run — Steps 1–10 walked by hand against the folded text
(2026-09-03)* section.

**That clause is now written (0.5.1, 2026-09-12), and the count changes shape rather than closing.**
ADR-0014's four parts land as the `deprecated` / `removal_version` fields of §2, carried through §3's
`find` response as entry data, and the three rules of *Merging attributions merges attributions, never
contents* above. **A fold does not close its own gate**, so count (iii) became *re-run Steps 5–7
against the folded text* — the verdict is the scenario's, not this section's. The other **four** counts
are untouched by the fold and remain open, so clearing this one would still not promote KCB.

**That re-run has now been walked — by hand, on 2026-09-12 — and this count still does NOT close.**
Steps 5–7 were read against 0.5.1's text rather than replayed, for the standing reason
(`kcs:multi-authority` returns `green` and now predates **two** folds — **DR-8**). **The 2026-09-03
blocker does not reproduce**: the carrier exists on both surfaces §7.3d names (`describe` needed
nothing minted — §4's `describe` returns the card the extension rides on), the merged entry's marking
is no longer undefined because (ii) answers it, and (e) is no longer structurally unable to fire.
MA-6, MA-8 and MA-9 all hold under re-attack, **Step 6 flips** and **Step 7 half-flips**. **Step 5
does not flip**, on two breaks inside the new clause itself — neither of which reopens ADR-0014's
decision:

- **MA-14** (High): (i)'s **per-attribution form is not a shape**. (i) is a cardinality switch a
  consumer is normatively required to detect — a field carried *once* when attributions agree and
  *per attribution* when they do not — and §3 names no field, structure, or example for the second
  form, saying only what it is *not*. Two conformant registries emit two incompatible entries, and
  §7.2's ignore-unknown-fields rule then turns a disagreement into silence. ADR-0014's part 2
  required an explicit *mark* and its *Consequences* accepted a *per-attribution shape*; the clause
  renders both as an implicit mark carried by an unnamed one.
- **MA-15** (High): **(i) and (ii) collide on `deprecated`**. (ii) makes the merged entry deprecated
  *for §7.3d's ranking and marking*, §7.3d defines *marked* as *the entry carries §2's `deprecated`*,
  and (i) forbids picking one of two disagreeing attributions' values. The charitable reading — that
  (ii) states a **derived** property — is circular, because §7.3d's *marking* is defined as the
  field. The collision is in the ADR's Decision verbatim; what is missing is the distinction between
  **the field as published** and **the merged entry's effective marking**.
- **MA-16** (Med-High, Step 7): the merge rule reaches a **capability entry**, and the address and
  issuer list a consumer dials with ride on the **manifest** (`params.mcp`, `params.auth`). (i)'s
  MUST is broad enough to cover them and its framing paragraph enumerates only entry fields grounded
  in being outside §7.1's digest, which those are not; and for the address (e)'s *resolve against the
  provider's own card* is **circular**, the card being reached at the field in dispute. Both failure
  modes are detectable at the dial and `accepted_issuers[]` fails closed, which is why it is
  Med-High.

All three are **carrier or scope** breaks in a clause whose **model held** — (ii)'s restriction-wins
rule and (iii)'s no-reconciliation rule were both attacked directly and did not yield — and all three
are **one additive, KCB-only §3/§3.1(d) edit**. Count (iii) now reads *fold MA-14, MA-15 and MA-16,
then re-run Steps 5–7 again*, and is **unowned**. **No version moves and no clause moves for the
walk.** The other four counts are restated and none moves, so **KCB is not promotable** and would not
have been on a clean walk. Recorded in that scenario's *Re-run — Steps 5–7 walked by hand against
KCB 0.5.1 (2026-09-12)* section.

---

## 4. Verbs

| Verb | Transport | Meaning |
|---|---|---|
| **discover** | registry query (§3) | find providers by capability / interchange type / world |
| **describe** | one A2A agent-card fetch (`/.well-known/agent-card.json`) + MCP `tools/list` for tool schemas | fetch the provider's AgentCard **including its KCB extension** (`capabilities.extensions[]`, §2) in a single fetch — there is no second `/.well-known/kcb-manifest.json` to retrieve |
| **invoke** | MCP `tools/call` / A2A task | run a capability; inputs/outputs are KINP ids + KGP/media payloads by reference. The target **version** and the **quoted cost** the caller gated against are optional operands, and which major runs is resolved by a stated rule with no default — §4.4. A declared autonomy posture is an optional operand, and the capability's declared effect class is what it reads — §4.3. |
| **subscribe** | A2A streaming (MCP notifications only on the pre-2026-07-28 wire — §4.1) | register for a world or capability; receive KGP **deltas** (KGP §6) or media events as they occur. Rate, resumption, and the in-band control channel are §4.2; posture is §4.3; the §7 successor / deprecation / removal signals ride that same channel — §7.3g. |
| **fetch** | CAS GET by `asset` id | retrieve asset bytes by their KINP id; integrity self-verifies against the hash (delta G). Requires a `fetch:asset` grant (§5). The response carries exactly one **named outcome** — `held` / `not-held-pending` / `not-held-not-expected` / `refused` — owed **per request**, never synthesized, and absent reading *pending*; the names are §4.5, their meanings are KMI §7.1(f). |

`subscribe` is the control-plane half of KGP §6 subscriptions: KGP defines the delta payload,
KCB defines how a consumer registers and how the stream is delivered. Ordering-independence
(KGP §6) means the bus needs no exactly-once guarantee — content-addressed claim ids make
redelivery idempotent. Because a stream may deliver a **reference** (an EDL, a claim) before the
referenced asset's bytes have propagated, consumers MUST tolerate dangling asset references and
`fetch` them lazily on demand; producers MUST NOT assume bytes are pre-propagated (delta L).
That idempotency argument is about **redelivery**; it says nothing about **non-delivery**, and how a
subscriber slows a stream, resumes one, and is told what a producer is doing to keep up is **§4.2**.

### 4.1 Which MCP wire each verb assumes

KCB pins **MCP revision 2026-07-28** (§1.1), whose core is stateless. Because that revision breaks
against its predecessor, every clause above that touches MCP is audited here rather than left to the
reader: a verb is either *wire-independent* — it is a request/response exchange that never needed a
session — or it is named as assuming one wire. **No KCB clause requires the `initialize` handshake
or a session id.**

| Clause | How it uses MCP | Under the pinned revision |
|---|---|---|
| §2 `params.mcp` | An **address**, not a connection | Wire-independent. The field names where a peer's MCP surface is; it has never carried, or implied, a session. |
| §3 registry crawl | Pull over a peer's MCP/A2A surfaces | Wire-independent. The crawl reads the KCB extension off the **A2A card** (§2); its MCP leg is request/response. |
| §4 **describe** — `tools/list` | Request/response | Wire-independent. KCB reads the manifest off the A2A card, so `tools/list` supplies *tool schemas* only. The pinned revision's mandatory **`server/discover`** is the MCP-native way to learn what a server is; KCB neither requires nor forbids calling it, because the KCB payload is not served from there. |
| §4 **invoke** — `tools/call` | Request/response | Wire-independent, and *better* served by the pinned revision: a capability grant (§5) and the invoked capability's version travel **per call**, which is exactly what per-request `_meta` is for (§4.4a/b). Nothing in §5 or §7 reads state left by a previous call. The tool the call addresses is the one the manifest's `binding` names (§2.4), never one derived from the capability name. |
| §4 **fetch** | CAS `GET` by asset id | Wire-independent — not an MCP call at all. |
| §4 **subscribe** | Server→client **stream** | **The one session-shaped clause.** A stateless core has no client-scoped channel a server may push to, so under the pinned revision a `subscribe` stream is delivered over **A2A streaming**. "MCP notifications" names the pre-2026-07-28 wire; a participant on that wire MAY still deliver there, and a consumer MUST NOT assume it. |

The `subscribe` split costs the contract nothing, and that is by construction: KGP §6 deltas are
ordering-independent and content-addressed, so redelivery is idempotent and the bus needs no
exactly-once guarantee (§4). Which leg carries the stream is therefore a transport choice, not a
semantic one — no assertion in §5, no rule in §7, and no KCS assertion (KCS §5) reads it.

Two consequences for a reader on the older wire. First, nothing here retires it: KCB describes both,
and the pin records which one KCB was validated against. Second, a scenario that drives real
participants must **record which revision each speaks**, because a green run on one wire is not
evidence for the other — that recording is KCS's, and is noted there
([`conformance-scenario.md`](conformance-scenario.md) §4).

---

### 4.2 Subscription flow control (0.4.7)

How a subscriber asks for **less**, and how a producer says it is sending **more**. This was KCB's
open question 1 through 0.4.6 — *"firehose flow-control remains an infra concern for the host's cost
advisor"* — and it is folded here because a pressure leg,
[`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md), showed
that the parking assignment is **void rather than deferred**: §3 and
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) keep the host **off the stream path** (it
returns addresses; no traffic flows through it), none of its four instruments — grant, revocation,
ranking, the optional facade — reaches a running subscription, and under §3.1 federation no single
host has jurisdiction over both ends at all (**BP-5**). Nobody downstream can discharge a question
addressed to a party the fabric's own topology rule forbids from being in position, so the question
cannot leave the contract. Where it *can* live is the one place the topology admits: **between the
two peers, on the binding's own axis.**

This section is **additive at every surface**. A subscription that declares nothing behaves exactly
as it did at 0.4.6; every field below is optional on read and on write; no verb is added, no plane or
port kind is added, and a card conformant at 0.4.6 is conformant unchanged. It is also **not a
quality-of-service contract** — see (g).

**a. A port declares its volume (BP-1).** §2.1's port vocabulary carried no volume, rate, cadence, or
cardinality field on any plane, so a world emitting 4 deltas/second of 6 MB each and a world emitting
a handful a day were **indistinguishable on every field the registry indexes** — a subscriber learned
what it had bound to by running. Any port MAY therefore carry an OPTIONAL `volume` object declaring
the delivery envelope a subscriber would be accepting:

```jsonc
"volume": {
  "unit":            "delta",        // what is counted: a KGP delta, a media event, a frame
  "rate":            { "typical": 4, "peak": 20 },        // deliveries per second
  "payload_bytes":   { "typical": 6000000, "peak": 20000000 },  // one delivery, canonical (KGP §3)
  "references":      { "typical": 120 },                  // asset refs per delivery — the (f) operand
  "resume_horizon":  "PT1H"          // how far back this port can answer a `resume` (c); ISO 8601
}
```

Normative:

- A `volume` declaration is an **estimate of an envelope**, never a guarantee and never an SLA. A
  producer that exceeds it is **not in breach** of this section, and a subscriber MUST NOT treat it
  as one; what a subscriber gets from it is the ability to *choose before it binds*, which is the
  whole of what BP-1 asked for.
- An **absent** `volume` reads as *unknown*, never as *low*. A consumer MUST NOT infer a rate from
  silence, and MAY decline to bind a port that declares none.
- `volume` sits **outside** the port's `schema_id` digest (§7.1), for the same reason `cost` does:
  volume is not shape, and a re-declared envelope must not signal a payload break that is not one.
  Changing it is a **minor** bump on the capability that carries it (§7.2, which since 0.5.4 carries
  the row that authorizes it) — the version moves, so a pinned subscriber can see it — exactly as a
  re-price is (§5). A subscriber whose binding never pulls sees it because the producer emits
  §7.3g's **`entry_changed`** frame on (d)'s channel, carrying the new version and naming `volume`
  as what moved.
- §3's **ranking rules do not change**. A registry MAY return `volume` with an entry and a consumer
  MAY rank on it locally; ranking by highest satisfying version, deprecated below non-deprecated
  (§7.3d), is untouched, and no registry may reorder on volume.

**b. A subscription declares what it can take (BP-3, the brake).** `subscribe` (§4) registered a
scope and nothing else — no rate, window, batch size, or maximum in flight — so the only lever a
saturated subscriber had was **disconnect**. The verb is unchanged and remains the right verb held by
the right party at the right scope; it gains OPTIONAL operands, set at registration and adjustable
in-band (d):

| Operand | Meaning |
|---|---|
| `max_rate` | deliveries per second the subscriber will accept |
| `max_in_flight` | deliveries the subscriber will leave outstanding |
| `window` | a coalescing window (ISO 8601 duration) the subscriber asks the producer to apply |
| `on_overflow` | what the producer MUST do when a declared limit would otherwise be exceeded — one of `coalesce`, `defer`, `drop` |

Normative:

- **The contract's question is not *how fast* but *whether an adaptation is lossless*.** `coalesce`
  (merge the deltas in a window into one) and `defer` (queue and deliver later) are **lossless** for
  KGP payloads by construction — KGP §6 deltas are ordering-independent and KGP §3 claim ids are
  content-addressed, so coalescing, batching, re-ordering, or dropping a duplicate moves **no claim
  id** and changes **no merge outcome** (KGP §3.3's convergence is untouched). `drop` is **lossy**
  and MUST be named as such by a subscriber that chooses it. A producer MAY apply a lossless
  adaptation without being asked; it MUST NOT apply a lossy one that was not asked for.
- **A retraction is never shed.** Under `on_overflow: drop`, a delivery carrying a `retracts` or
  `supersedes` lifecycle relation (KINP §4.2, KGP §6) MUST still be delivered, and MUST NOT be
  coalesced into a form that loses it. This is the one payload that is not rate-safe: content
  addressing makes a **duplicate** a no-op, which is why §4 needs no exactly-once guarantee, and the
  same property makes a **gap** leave no trace — a merged graph records what arrived and holds
  nothing shaped like what did not, so a shed retraction leaves a claim asserted forever in a graph
  that is internally consistent and factually wrong.
- **A producer that cannot honour a declared limit MUST refuse the subscription at registration**,
  with a stated reason, rather than accept it and exceed it. Fail closed, as everywhere else on this
  bus (§5, §7.2).
- **The same rule past registration: a live adjustment is owed an answer, and silence is not one of
  them (BP-7).** These operands are *"set at registration **and adjustable in-band** (d)"*, and the
  bullet above governs one of those two moments. Nothing governed the other: a subscriber that learned
  it was behind ninety seconds in — which is when a merge queue tells you, not when a card does — could
  pull the lever (d) mints and not learn whether anything happened. A producer receiving a
  subscriber → producer adjustment frame (d) MUST therefore answer it in exactly one of three ways, and
  **silence is not one of them**: (i) **`applied`**, naming the operands now in force; (ii) refuse
  **`cannot-honour`**, naming for each operand it cannot meet the value it *can* — the same *state the
  limit you can meet* shape (c) gives `gap-unavailable`; or (iii) refuse **`unsupported`**, where it
  does not adjust that operand on a live subscription at all. A producer that cannot honour a live
  adjustment is **conformant by refusing**; a producer that accepts the frame and keeps delivering under
  the old envelope is **not**. This is the registration-time rule above **extended past the moment it
  was scoped to**, not a second convention — fail closed, as §5 and §7.2 do — and it is (c)'s discipline
  for `resume` applied to (b)'s own operands, which is where it was already written one paragraph away.
- **The answer names which adjustment it answers.** An adjustment frame carries an **id** minted by the
  subscriber and opaque to the producer; the answer **echoes it**, and an `applied` answer additionally
  carries the operands and the values now in force. Without the echo an answer is unattributable wherever
  more than one adjustment is outstanding — the carrier failure §4.5(a) exists to close on the other verb
  — and *which* answer arrived is the whole of what this bullet set is worth. The id identifies one frame
  and nothing else: it orders nothing, and a producer MUST NOT read it as a cursor, a sequence number or
  an acknowledgement of delivery (`resume.after` (c) is this section's only content-addressed point).
- **Three named answers are assertable; a stalled window is not.** (d)'s last bullet argues that a frame
  is preferable to transport-level flow control because KCS §5's cross-plane vocabulary can range over an
  interaction between participants, where a stalled transport window is one signal for *saturated*,
  *slow* and *dead*. That argument was true of the adjustment and not of its outcome: a scenario, and
  equally a subscriber, could state that backpressure was **asked for** and not that it was **applied**.
  Naming the three answers is what makes *honoured*, *refused* and *not implemented* three
  distinguishable facts — for the subscriber first, and for a KCS scenario because they are frames.
- **An unanswered adjustment is *not in force*.** A subscriber MUST NOT read silence, a delivery that
  arrives after it sent the frame, or a slowed stream as `applied`; absence reads **not in force**, which
  is fail-closed on the reading side as §4.5(c) reads an absent `fetch` outcome as *pending*. The reading
  is fixed for the subscriber rather than left to the conformance verdict because silence from a producer
  in breach of the bullet above and silence from a participant that implements none of this section and
  ignores an unknown frame (d) are **the same signal on the wire** — only one is a defect, and which it is
  does not change what the subscriber may conclude or which levers it has left.
- **The answer fixes a shape, never a latency (g).** `applied` states which operands are in force. It
  commits to no time by which deliveries already in flight drain, no ramp, no schedule and no liability,
  and a subscriber MUST NOT read one into it. Whether an adaptation is **lossless** remains the contract's
  only question about it: this clause moves no part of the *lossless-or-lossy* bullet above — a producer MAY still apply
  a lossless adaptation unasked, MUST NOT apply a lossy one that was not asked for, and a retraction is
  never shed — and scheduling, queue discipline, buffer sizing and admission policy stay exactly where (g)
  leaves them, in each participant's own infra.
- A subscription carrying **none** of these operands is a 0.4.6 subscription and MUST be served as
  one; a subscriber that never adjusts is never owed an answer, and the bullets above oblige a producer
  only in respect of a frame it was actually sent.

**c. A subscription is resumable (BP-3, the gap).** `subscribe` registered for deltas *"as they
occur"* with no `since`, cursor, or sequence a consumer could name, and KCB publishes no range-pull
verb — so a subscription could not be resumed, only re-established **at now**, and the recovery from
overload (a full snapshot of a high-volume world, demanded of an already-saturated subscriber) cost
strictly more than the overload. `subscribe` therefore gains one further OPTIONAL operand:

```jsonc
"resume": { "after": "<KGP pack id>" }     // the last delivery the subscriber merged
```

Normative:

- `resume.after` names a **content-addressed** point in the delta chain (a KGP pack id, KGP §6), not
  a sequence number or a wall-clock time. It is an operand on `subscribe`, **not a new verb** — the
  §4 verb table still has exactly five entries.
- A producer MUST answer a `resume` in exactly one of three ways, and **silence is not one of them**:
  (i) resume from that point; (ii) refuse `gap-unavailable`, naming the earliest point it *can*
  resume from; or (iii) refuse `resume-unsupported`. A producer that cannot resume is conformant; a
  producer that silently starts at now while a `resume` was asked for is **not**.
- A subscriber that receives a delivery whose `basis` (KGP §6) it has not seen MUST NOT merge it
  silently. It MUST resume (per this clause), or record the gap. Recording it is enough — the
  requirement is that a gap be **detectable**, which before this clause it was not.
- A producer SHOULD declare its `resume_horizon` on the port (a), so a subscriber can tell before it
  binds whether resumption after a plausible outage is available to it at all.

**d. The control channel — one channel, both directions (BP-5).** The mechanism (b) and (c) need is a
**signal on the subscription itself**, because ADR-0001 admits no third party onto that path. A
`subscribe` stream therefore carries, alongside its deliveries, in-band **control frames** in both
directions:

- **subscriber → producer** — set or adjust the (b) operands on a live subscription: slow down, pause,
  resume, change `on_overflow`. This is what makes the subscription adjustable without a teardown, and
  it is the lever Step 3 of the leg went looking for and did not find. What the producer **owes** such a
  frame is (b)'s own rule, since 0.5.8: `applied`, `cannot-honour` or `unsupported`, echoing the
  adjustment's id — **and silence is not one of them**.
- **producer → subscriber** — the reverse: *I have applied your adjustment*, *I cannot honour it and
  here is what I can*, *I do not adjust that on a live subscription* — the three answers (b) requires —
  and, unasked, *I am coalescing*, *I am deferring*, *I am shedding*, *I am approaching your ceiling*
  (e), *I am ending this subscription*. This is the **push channel** §7's
  preamble concedes is missing, and it is the same channel the §7 signals need: **V-7** of
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) found that
  no §7 deprecation or removal signal reaches a live `subscribe`, and asked for an in-band control
  frame in exactly this direction.

Normative:

- **There is one control channel, not two.** A fold of V-7 MUST carry its deprecation and removal
  signals on this channel rather than mint a second, parallel signalling mechanism. Backpressure and
  version signalling are the same missing push channel read from two sides.
- Frames ride the **same stream as the deliveries** — A2A streaming under the pinned revision, or
  MCP notifications on the pre-2026-07-28 wire (§4.1). No new transport, no new verb, no second
  connection, and §4.1's audit is unchanged: `subscribe` remains the one session-shaped clause.
- **Ignore what you do not understand.** A producer that receives an unknown frame MUST ignore it; a
  subscriber MUST tolerate a producer that never sends one. This is §7.2's ignore-unknown-fields rule
  applied at frame level, and it is what makes the channel additive: a participant that implements
  none of this section still interoperates. The rule holds **unchanged** and governs the frames a
  producer sends **unasked**: it is not a licence for silence where (b) owes an answer to a frame the
  subscriber sent, and it does not need to be, because (b) fixes what the subscriber concludes from
  silence — *not in force* — rather than leaving it to tell a producer in breach from a participant that
  never implemented the channel. The two are the same signal on the wire, so a 0.4.6 participant stays
  interoperable and a subscriber is never left hanging on either.
- **The host is not on this path, and does not need to be.** Flow control is negotiated between the
  two peers because the topology admits nobody else (ADR-0001, §3). This composes across §3.1
  federation unchanged, precisely because it never required a party with jurisdiction over both ends:
  where `worldsim` and `analyzer` sit in different authority domains, the binding — and therefore its
  control channel — still runs directly between them.
- **A frame is an interaction between participants**, so KCS §5's cross-plane assertion vocabulary can
  range over it. That is a reason to prefer a frame over transport-level flow control and not merely a
  side effect: a stalled A2A window is unattributable (*saturated*, *slow*, and *dead* are one signal)
  and unassertable, so a scenario cannot state that backpressure was applied and honoured — and a
  clause nothing can test is not a clause. Through 0.5.7 that held of the **request** and not of the
  **outcome**, which is what **BP-7** found: a scenario could assert the adjustment and not its effect.
  (b)'s three named answers are what close the argument, and the subscriber reads the same three
  frames a scenario asserts over.

**e. A metered subscription, and a brake before the cliff (BP-2).** §2.1 puts `cost` on
`params.capabilities[]` — a named, invocable unit — while a subscription scopes to a **world**, which
has no manifest object to price; and §5 evaluates the ceiling *"at invoke"*, of which a stream has
exactly one. `budget_units` was therefore inert on a subscription, not merely generous. Two additions
close it, and the second matters more than the first:

- A port's `volume` (a) MAY carry a `cost`, in the §2.1 shape, denominated **per `unit`**. Where it
  does, a grant's `budget_units` ceiling (§5) decrements **on delivery** rather than at invoke, and a
  subscription is metered for the first time. Where it does not, the subscription is unmetered exactly
  as it is today.
- **An exhausted ceiling MUST NOT be the first signal a subscriber receives.** A producer approaching
  the ceiling MUST signal on the control channel (d) *before* it stops. §5's enforcement rule is that
  an overrun *"fails at the gate"*, which on a stream can only mean **stopping** it — and **a ceiling
  is a cliff, where backpressure is a brake.** This clause is what converts the one into the other:
  the subscriber can slow down, narrow, or seek a raised grant while the binding is still alive.

Cost accounting and flow control remain **different instruments answering different questions**. §2.1
and §5 do close per-invoke cost and nothing here reopens that; what this clause adds is an operand and
an evaluation point on the one binding that had neither.

**f. Composition across a fetch fan-out (BP-4).** Delta L requires a consumer to tolerate dangling
asset references and `fetch` them **lazily on demand** (§4) — and under a firehose the demand *is* the
firehose, amplifying onto a CAS holder that is party to neither binding, at a rate set by two parties
that are not it. `fetch:asset` is a verb + scope with no rate dimension, and §4.1 makes `fetch` not an
MCP call, so §5's ceiling never sees it. Normative:

- A port's `volume.references` (a) makes the amplification **predictable before binding**: the derived
  `fetch` rate a subscription implies is its delivery rate multiplied by that count.
- The fan-out is the **subscriber's** traffic, not the producer's — delta L makes the `fetch` the
  consumer's own action — so a subscriber's declared `max_rate` (b) is what bounds it, and the
  subscriber is accountable for the load its binding places on a third participant.
- A CAS holder MAY apply its own limit on `fetch` and MUST **signal a refusal** rather than stall or
  drop silently. A `fetch` is request/response (§4.1), so no stream frame is needed: a refused `fetch`
  is a **pending fetch**, which delta L's dangling-reference tolerance already requires every consumer
  to handle. Backpressure on the fan-out therefore composes onto machinery that already exists.
- This holds unchanged under **KMI §7.1** replication-on-reference and **§3.1** peering, because the
  limit is applied by the participant that **holds the bytes**, in its own authority domain — the same
  fail-closed placement §7.1 already fixes for license, egress, and trust tier.

**g. This is not a quality-of-service contract.** KCB fixes the **shape** of the volume declaration,
the subscription operands, and the control frames, so that the planes agree on what a subscriber may
ask for and what a producer must answer. Scheduling, queue discipline, buffer sizing, admission policy
and the retry curve behind a refused `fetch` live in each participant's own infra — as token issuance
and rotation do for §5. Nothing here promises a latency, guarantees a rate, or makes a producer liable
for one.

**Re-ratification.** This section is new normative text, and it is candidate on a **re-run of the leg
that forced it** — [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md)
— against the folded text. That leg states the condition precisely: Step 1 must distinguish the two
worlds *before* binding, Step 2's meter must move, Step 3's table must have a lever that is not
disconnect, Step 4 must resume without a snapshot and must not silently miss a retraction, Step 5's
limit must survive the hop, and Step 6 must name a party that is actually on the path. That is a
**fourth** count on this spec's status, gating §4.2 alone; the three existing counts in the status
note are restated and none of them moves.

**Walked twice, and it does not close.** The first walk (2026-09-03) met five of those six
conditions and returned **BP-7** (Med-High — §4.2b's honour-or-refuse is stated at **registration**
only, and no clause says what a producer owes a **live** adjustment on (d)'s channel) and **BP-8**
(Med — (a) declares a `volume` change a **minor** bump *"(§7.2)"* against a table with no row for it).
**BP-8 is folded at 0.5.4 and 0.5.5** — §7.2 now carries the row, and §7.3g's `entry_changed` carries
the signal — and the second walk (2026-09-12, against 0.5.5) confirms it: **BP-8 does not reproduce**,
Step 1 holds with (a) unmoved, and the three other holds of that leg's Step 8 survive re-probing, with
one correction recorded there — the hold as phrased (*"§7.2's table is not disturbed"*) is now
literally false and the property it asserted, *no live subscriber breaks*, is what holds. The frame's
missing **new value** (**V-16**, **AP-10**) was put to `volume` directly and does **not** bite, for
reasons recorded at that Step 8, so **no new delta is filed on this count**. It did not close because
**BP-7 stood unfolded** — and **BP-7 is folded at 0.5.8**: (b) now states what a producer owes an
adjustment arriving on (d)'s channel, in (c)'s own answer-or-be-non-conformant shape, so Step 3's lever
answers on a live subscription and not only at registration. A fold does not close its own gate, so this
count now reads: **re-run Steps 1–8 against text carrying both folds** — BP-8's (0.5.4/0.5.5) and
BP-7's (0.5.8), one walk rather than two each re-reading the other's absence, since these two findings
are the whole of what this count still stood on. Record:
[`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) § *Re-run —
Steps 1–8 walked by hand against §4.2 (2026-09-03)* and § *Re-run — Step 8 walked by hand against
KCB 0.5.5 (2026-09-12)*.

---

### 4.3 Autonomy posture across an ownership boundary (0.4.8)

Which classes of effect a dispatch may cause **unattended**, and how two peers under different owners
combine what each will allow. This section applies
[ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md), which takes up the **G5 human
escalation** carve-out [ADR-0011](../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md)
§4 left open and decides the half of it that crosses an organizational boundary — and only that half.
The pressure leg that forced its shape is
[`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md), whose eight
findings **AP-1…AP-8** the clauses below answer one at a time.

**Why it is here rather than left to implementers.** A posture gates two things: **spend** and
**irreversibility**. Spend is fully expressed and enforced across an ownership boundary already — §5's
grants, the `budget_units` ceiling, the projected cost path search returns before an `invoke`, and
§4.2e's metered delivery. Irreversibility is expressed **nowhere**: before this section, no field on
any capability or port in any of the six specs said what an invocation does that its caller cannot
undo (AP-1). A caller's posture across a boundary was therefore not *weak*; it was **inapplicable** —
there was nothing on the wire for it to read.

This section is **additive at every surface**. Every field below is optional on read and on write; a
dispatch that declares no posture behaves exactly as it did at 0.4.7; no verb, plane, port kind, media
type or authority role is added; and a participant that implements none of it stays conformant and
interoperable. It is also **not a supervision model, not an approval transport, and not a security
control** — see (g), (h) and (i).

**a. A capability and a port declare their effect class (AP-1).** Any entry in
`params.capabilities[]`, and any port in `params.produces` / `params.consumes` / a capability's
`inputs` / `outputs`, MAY carry an OPTIONAL `effect` object stating what an invocation over it does
that the caller cannot undo, and whether that is confined to the callee's authority domain:

```jsonc
"effect": {
  "reversibility": "irreversible",   // none | local | irreversible
  "visibility":    "external",       // internal | external
  "note":          "publishes findings to peers outside this authority domain"  // OPTIONAL, informative
}
```

| Axis | Value | Meaning |
|---|---|---|
| `reversibility` | `none` | Changes no state that outlives the invocation. Reading bytes, computing, returning a payload. |
| | `local` | Changes state inside the **callee's own authority domain**, and the callee offers an inverse reachable on this bus. |
| | `irreversible` | Has no inverse on this bus, by anyone. |
| `visibility` | `internal` | Observable only inside the callee's authority domain. |
| | `external` | Observable outside it once made — publication, egress across an authority boundary, a dispatch to a third participant, or an act with a referent off the fabric entirely. |

Normative:

- The class is declared by the participant that **implements** the capability, on its own card
  ([ADR-0007](../decisions/ADR-0007-self-describing-participant.md) — participants are
  self-describing). No registry holds it, no central policy file overrides it, and no third party
  asserts it on another's behalf.
- **An absent `effect` reads as `unknown`, never as harmless.** `unknown` is a class like any other and
  is admitted only where a posture names it explicitly (b). This is the fail-safe direction §4.2a took
  for `volume`, for the same reason: a default that reads as benign converts a missing declaration into
  a silent grant, and here it would convert it into a silent grant of permanence.
- `effect` is **not shape**. It sits **outside** the port's `schema_id` digest (§7.1) exactly as `cost`
  (§2.1) and `volume` (§4.2a) do, and re-declaring it MUST NOT be read as a payload break. Changing it
  is a **minor** bump on the capability that carries it (§7.2), so the version moves and a pinned
  consumer can see it.
- Where a capability's class changes while a `subscribe` binding is live, the producer signals it on the
  **§4.2d control channel** — the single in-band channel that section specifies in both directions —
  in §7.3g's **`entry_changed`** frame, which since 0.5.5 is the name that signal is read by
  (**AP-9**). This section mints **no** second signalling path, and V-7's fold carries deprecation
  and removal on that same channel.
- A class is a property of what an `invoke` or a `subscribe` does. **`fetch` gets none:** serving bytes
  across an authority boundary is already gated by the participant that holds them, in its own domain
  and fail-closed (KMI §7.1 over KGP §7's classes), which is both adequate and correctly placed. A
  second control over the same act would be two gates disagreeing.

**b. A posture is a set of admitted classes, not a rung (AP-2, AP-4).** A posture is stated as the set
of effect classes the declaring party will allow to proceed **without a person**. It is an OPTIONAL
operand on the existing verbs — `invoke` and `subscribe` — in the operand shape §4.2b established, and
MAY equally be published on a card as the standing posture a participant executes under:

```jsonc
"posture": {
  "admits": [ { "reversibility": "none",  "visibility": "internal" },
              { "reversibility": "local", "visibility": "internal" } ]
}
```

Normative:

- **Postures are named by what they GUARANTEE.** The vocabulary is the effect classes of (a) and
  nothing else. **koine adopts no rung names** — no `autonomous`, no `plan-first`, no `ask-first`. A
  product's ladder is a **projection** onto these classes, declared and mapped by that product with its
  lossy edges named, in the same relationship KMI's lineage relations have to C2PA and OMC
  ([ADR-0010](../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md)) and a KFT job has to a
  trainer's native config (KFT §3.3). A rung is uninterpretable at a peer that does not run that
  console; a class is not.
- **`admits` is a set, and this specification defines NO total order over classes.** The two axes are
  independent, so two postures may each be stricter than the other on a different axis and neither is
  *"higher"*. Ranking classes on a single ladder would silently discard one of two ordinary rules
  (AP-4); a product that needs an ordering supplies it in its own projection.
- A dispatch carrying **no** `posture` operand gates on nothing and is served exactly as it was at
  0.4.7. Declaring a posture is what opts a caller into (c).

**c. Posture is monotone-restrictive; the effective posture is the intersection (AP-3).** This is the
load-bearing rule, and it is what makes the surface safe to cross a boundary with:

- The **caller's** posture bounds what the caller will dispatch. The **callee's** posture bounds what
  the callee will execute.
- **The effective posture of a dispatch is the intersection of the two**, and each side enforces its own
  half against its own gates.
- **No posture presented by a peer may widen any gate.** A caller cannot raise a callee's autonomy by
  asserting a posture, and a callee cannot lower a caller's by publishing one. A declaration a peer
  presents can only ever cause the reader to do **less**.

Two consequences are normative rather than commentary. First, *"which posture wins"* has an answer that
requires **no arbitration and no trust**: **the restriction wins, always**, because neither side is
asked to honour the other's declaration — each reads it and withholds. There is no third party to
arbitrate and none is wanted: the host is off the dispatch path (§3,
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md)) and under §3.1 federation no single host
has jurisdiction over both ends, the same structural fact **BP-5** established for flow control.
Second, because both sides still decide alone, **every gate in this fabric stays unilateral** and
ADR-0011's trigger **T3 does not fire**. That is a design constraint on this section, not an
observation about it: a posture rule that made any gate joint would be non-conformant with the record
that permits this one.

**d. The floor — what no posture may skip (AP-8).** The only part of a posture a caller may rely on
when the callee is another organization is the part the callee enforces unilaterally, so the floor is
written there. It is NORMATIVE and it is not negotiable per deployment:

- **No posture relaxes a mandatory gate.** KGP §7 license and egress, §5's grant and spend ceiling, and
  KFT §4 admission and §8.1 graded refusal fire identically at every posture. The most permissive
  posture expressible in (b) is not licence to omit one, and a participant that omits one is
  non-conformant regardless of what either side declared.
- **An effect the effective posture does not admit is a REFUSAL** — never a silent proceed, and **never
  a silent substitution** of a lesser effect, which is the disposition KFT §3.3 already fixes for an
  unexpressible adaptation axis.
- **An undeclared class is not admitted** wherever a posture gates on class (a).
- **Refusal remains available to both sides, unconditionally.** Declaring a posture never removes it.

**e. A delegated leg carries the posture; a class covers the leg, not the code (AP-5).** A callee that
re-dispatches to fulfil an invocation is the ordinary case on this bus — §5's ceiling exists precisely
because a *"cross-participant chain (knowledge producer → media producer → paid model)"* is normal
traffic. Spend propagates along that chain because the credential does; a posture computed pairwise
would evaporate at the second hop, and a caller cannot enumerate the parties behind its callee.
NORMATIVE:

- **A declared `effect` covers the leg.** It states what the invocation causes, **including every
  dispatch the callee makes to fulfil it** — not what the callee's own code does in isolation. A callee
  whose downstream provider publishes the caller's inputs declares `external`, whatever its own code
  does.
- **A re-dispatch MUST NOT present a posture wider than the effective posture it was invoked under.** It
  MAY narrow further. This is monotone-restrictive along the chain, in the same shape §5's ceiling
  already has for spend, and it is what makes (c) a boundary rule rather than a one-hop rule.
- A callee that cannot bound its downstream legs to the effective posture MUST refuse (d) rather than
  dispatch and hope. Fail closed, as everywhere else on this bus.

**f. Where the posture is evaluated.** For `invoke`, at the call, before any effect. For `subscribe`,
at registration — a stream is registered once, so a posture is evaluated once, exactly as §5's ceiling
was until §4.2e gave it a delivery-time evaluation point; where the classes of what a stream delivers
change, (a)'s control-channel signal is what reaches a live binding. A `fetch` is not evaluated against
a posture at all (a).

**g. This section names no person, and requires no console (NORMATIVE conformance requirement).**
Nothing above defines an interface, a timeout, a correlation id, an approval message, a queue, or a
human authority. What crosses the wire is a declaration, a set, and a refusal. **A participant with no
console at all is fully conformant**: a headless provider declares its classes and executes under a
fixed posture with no person anywhere in it, and a headless caller computes the intersection, dispatches
what is admitted and refuses what is not. A refused dispatch is not parked, held, or resumable — a
subsequent dispatch under a widened posture is a **new** invocation, which is why this section needs no
verb, no state and no resumption operand. koine fixes **when a stop is required**, never how a stop is
served; the latter is the implementer's ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).

**h. What a posture refusal carries (AP-6).** A refusal under (d) is a refusal like any other on this
bus, and KCB states its own minimum rather than discharging it onto a profile:

- It MUST name **which gate refused** — this section — and **which class** was not admitted.
- It MUST NOT disclose the contents behind the class. Naming the class is enough; the same rule KFT
  §8.1 states for a `local-only` corpus.
- It MAY carry the richer graded form where the caller is on a surface that defines one. A posture
  refusal on a KFT job is `refused-policy` in **KFT §8.1**'s table, and that section's standing rule —
  *a route MUST NOT breach the gate it just enforced* — reads over posture without amendment: a
  `route_to[]` naming a provider whose posture is **wider** than the one that just refused converts a
  correct refusal into the breach it prevented. KFT is a profile composed over KCB, so the citation runs
  this way and not the other: no caller on this bus needs to read a fine-tuning spec to learn what a
  refusal carries.

**i. What a declaration is worth across a boundary (AP-7).** Stated plainly, because a clause that
leaves it unsaid reads as a security control it is not. A declared class is an **assertion by its
declarant**, and no protocol mechanism here verifies it: a callee may declare `none`/`internal` and do
something permanent. Three things nonetheless separate this from an advisory hint, and they are what a
caller actually holds:

- **Silence costs the declarant, not the caller.** Absent reads `unknown`, and `unknown` is not admitted
  (a, d) — a participant that declines to classify loses the traffic. An advisory hint defaults to
  benign and puts the cost on the reader.
- **A misdeclaration is a breach of a stated term, not a disappointed expectation.** The declaration
  rides the participant's own card, which §5's `signing` shape makes cryptographically attributable
  rather than merely asserted, and conformance to it is assertable by a scenario (KCS §5).
- **Posture composes with the grant, and the grant binds.** Posture states which classes may proceed
  *unattended*; the grant (§5) states what may be invoked *at all*, is issued by the caller's own side,
  and is not an assertion by the peer. A caller that will not accept an irreversible effect should also
  not hold a grant that reaches one.

What this section deliberately does not do: it is **not a decision record**. Whether a fired gate must
leave a trace is **GOV-2** ([`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md)),
open, on koine's own axis, and this clause's companion rather than part of it — a stop that leaves no
trace is one the other organization cannot verify afterwards, which is the audit question and not the
escalation one.

**Re-ratification.** This section is new normative text, and it is candidate on a **re-run of the leg
that forced it** —
[`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) — against the
folded text: Step 1 must distinguish the two capabilities *before* dispatch, Step 3's disagreement must
resolve by a stated rule with no arbitration, Step 4's delegated leg must not escape the caller's
posture, Step 5's refusal must have a shape stated in KCB, and Step 8 must still complete with no
console anywhere. That is a **fifth** count on this spec's status, gating §4.3 alone; the four existing
counts in the status note are restated and none of them moves. ADR-0013 additionally carries a
**second-independent-implementation** condition on ratification (its **W3**), which is a condition of
that record rather than a finding of this leg.

**Walked twice, and neither condition is met.** The first walk (2026-09-03) met all five conditions
and flipped **eight of eight** deltas, including blocking **AP-5**, returning one new delta —
**AP-9** (Med, carrier): (a) asserted a signal on §4.2d's channel that no section named a frame for,
and a **minor** bump under §7.2 for a field the table had no row for. **AP-9 is folded at 0.5.4 and
0.5.5** and the second walk (2026-09-12, against 0.5.5) confirms both legs: the `effect` row exists
and agrees with (a), the frame is named and mints no second path, AP-1…AP-8 all still flip, and the
`fetch` carve-out is right a third time and for a stronger reason (KMI 0.3.8's most-restrictive-governs
rule). It does not close on new delta **AP-10** (Med-High, payload): `entry_changed` names **which**
operand moved and carries **no new class**, while (f) evaluates a `subscribe` posture **once at
registration** and points a live binding at that signal alone — so (c)'s intersection has nothing to
intersect and (d)'s floor has **no evaluation point** on a live stream, §7.2's *refusal at the next
dispatch* being right for `invoke` and being the thing a stream does not have. **§4.3 needs no
change**: the fold is the one §7.3g edit shared with **V-16**, and it is **unowned**. **W3** is
unmoved, unowned and external to this repo; a clean walk would not have promoted this section on its
own. Record:
[`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) § *Re-run —
Steps 1–8 walked by hand against §4.3 (2026-09-03)* and § *Re-run — Step 6 walked by hand against
KCB 0.5.5 (2026-09-12)*.


---

### 4.4 Version negotiation at invoke (0.5.0)

Which major an `invoke` runs against, and what the caller had been quoted when it decided to make the
call. This folds **V-5** (blocking) and **V-1** of
[`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md), and it is the
half of §7's perimeter that §2.4 does not address: §2.4 gives the second major an **address**, and
this section gives the call a **version**. Neither closes the hole alone — with an address and no
operand a provider still has to choose a major for a version-free call, and with an operand and no
address it cannot route the one that was chosen.

**Why a default cannot be specified.** §5 binds a grant to `(capability, major)` and fails closed on
a major it was not issued for. That rule is right and it had **no operand**: the token is version-free
by design (encoding the major into the grant *name* would fragment authorization the way `compose-v2`
fragments discovery, §7.1), `invoke` defined no version argument, and both majors answer to one name.
Every available default fails, and they fail in different directions — *highest published* inverts
fail-closed into **fail-open** and bills a v1-granted caller at v2; *lowest* makes a successor
unreachable forever; *whatever the grant says* is correct and the provider does not hold the issuance
record. Under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) the registry returns an
address and peers dial **directly**, so there is no hub to arbitrate a disagreement about which major
was meant: a clause that left the choice to the implementer would produce a runtime mismatch far from
its cause. This section therefore states the resolution exhaustively and, where it is genuinely
ambiguous, **refuses** rather than picks.

This section is **additive at every surface**. Every operand below is optional on read and on write; an
`invoke` that carries none of them against a provider publishing one major behaves exactly as it did at
0.4.9; no verb, plane, port kind or authority role is added.

**a. `invoke` carries the version it means (V-5).** `invoke` (§4) MAY carry an OPTIONAL **`version`**
operand — an exact semver or a range in the §3 `find` form (`1.4.0`, `^1`) — naming what the caller
intends to run against, in the operand shape §4.2b established and §4.3b reuses. A caller that pins
says so **on the wire**, where the party that enforces the pin can read it.

**b. The granted major travels in the token (V-5).** The grant's **`invoke:<capability>` form is
unchanged** — §5's anti-fragmentation argument is untouched, and no new grant name is minted. What
changes is that the issuance fact §5 already describes becomes **readable by the party that enforces
it**: a grant MUST carry the major it was issued at, alongside the issuing host (§5, MA-6) it already
carries. A provider presented with a grant whose major it cannot read MUST treat it as a grant with no
readable major, which is (c)'s third case and not an authorization for anything.

**c. Resolution — one rule, and no default (V-5).** A provider resolves the target major of an
`invoke` in exactly this order, and the order is NORMATIVE:

1. **The `version` operand, where present.** It names the target. If no published version satisfies
   it, the `invoke` is refused *no satisfying version*, naming the majors published.
2. **Otherwise the grant's major, where readable (b).** This is the case (b) exists for.
3. **Otherwise, where the provider publishes more than one major of that name — REFUSE for want of a
   version**, naming the majors it publishes so the caller can re-dispatch against one. A provider
   MUST NOT pick, and MUST NOT resolve to the highest published major: that is the fail-open
   inversion **V-5** found, and it is forbidden by name.
4. **Otherwise — the one major published.** A provider serving a single major answers a version-free
   call exactly as it did at 0.4.9, which is what keeps this fold additive.

Two rules bound the outcome:

- **A resolved major outside the granted major is refused at the gate** (§5) — before the work, not
  after the bill. Where the operand and the grant disagree, the operand does not widen the grant: the
  grant is what binds, and the refusal names the granted major and the requested one.
- **Refusal for want of a version is the same instrument §5 already uses** for a `budget_units` ceiling
  whose unit is unstated across an authority boundary (MA-6). Where a number or a name could mean two
  things and no party is entitled to guess, this bus refuses rather than assumes. The two clauses are
  one rule applied twice, not two conventions.

**A presented plan leg is a cross-check, and a mismatch is refused by name (MT-1).** Since 0.5.6 §3's
path result names the **`(name, version)` each leg was matched over**, so a caller executing a planned
leg holds a second statement of which capability it meant — one the resolution order above could not
read, because nothing on the wire carried it. An `invoke` MAY therefore carry an OPTIONAL
**`planned_leg`** — the `(name, version)` §3 named for the leg this call executes, carried as §3
returned it — in the operand shape (a) established and (d) reuses. The following are NORMATIVE:

- **A mismatch is refused, naming both.** Where `planned_leg` is present and the major resolved by the
  order above differs from the major of the presented leg, the provider MUST refuse **plan mismatch**,
  naming the major it resolved **and** the major the caller planned over. This is the instrument of the
  rule immediately above applied once more, and the third place this bus uses it: where a value could
  mean two things and no party is entitled to guess — a `budget_units` ceiling whose unit is unstated
  (§5, MA-6), a version with no operand and more than one major published ((c)(3)), and now a plan that
  disagrees with what was resolved — KCB refuses rather than assumes. One rule applied three times, not
  three conventions.
- **The comparison is on the major, and only the major.** A leg naming `1.4.0` resolved against major
  **1** is **not** a mismatch — that is what §7.2 makes a minor mean, and refusing it would turn every
  ordinary compatible upgrade into a refusal. A leg naming `2.0.0` resolved against major **1** is one,
  and it is MT-1's case exactly.
- **The presented leg names *this* call's capability.** A `planned_leg` whose `name` is not the
  capability being invoked is not a plan for this call: the provider MUST refuse, naming both names,
  and MUST NOT ignore the operand. Discarding it silently would restore the very silence MT-1 is
  about, and §7.2's ignore-unknown-fields rule does not license it: that rule is about a **field** a
  party does not understand, and here the field is understood and its **value** is the disagreement.
- **A leg named at `0.0.0`-unknown is compared like any other.** §3 names a leg matched over an entry
  carrying no `version` at §7.1's **`0.0.0`-unknown** reading, which is a *value* and not an omission,
  so where the provider resolves a declared major that is a disagreement and it is refused the same
  way. Nothing here makes `0.0.0` a wildcard and nothing matches leniently — a lenient match is a
  guess, which is what this instrument exists not to make — and §7.1 already holds such a capability
  *"pinnable only by digest"*, so a caller learning at a refusal that it planned over a declaration
  naming no version is the clause working rather than failing.
- **It is a cross-check, never an operand of resolution.** The check is applied **after** the order
  above has resolved, never inside it. A provider MUST NOT use `planned_leg` to select a major, MUST
  NOT treat it as a fifth case of that order, and MUST NOT let it stand in for a missing `version`
  operand at (c)(3) — a caller that wants to **select** a major says so with (a)'s `version`, which is
  the operand that names a target. No default is minted here and no *highest published* fallback
  appears anywhere in this clause: it only ever **refuses**, and a plan leg binds no provider (§3).
- **The grant is untouched, and is a different party.** The first rule above stands exactly as written:
  a resolved major outside the granted major is still refused at the gate, before the work, whether or
  not a plan leg was presented, and nothing here widens a grant or substitutes for one. The
  disagreement this clause catches is with **§3's plan** — where the resolution read the grant, the
  grant is correct and binding, and what is wrong is that the caller planned against something else and
  no one could say so.
- **Absent, nothing changes.** An `invoke` carrying no `planned_leg` is served exactly as at 0.5.6, and
  (e)'s rule stands: no caller is required to pin, to plan, or to present a plan it holds. A provider
  need not have served the plan, or have seen it — it compares two majors, both of which it can read.

Where `planned_leg` and (d)'s `quoted_cost` are both carried they come from the **same** §3 result,
whose projected cost is *"the cost of exactly those legs"*: the two operands cross-check one plan on
its two axes — which leg, and at what price — and neither reserves anything, expires by anything, or
binds the provider. A *plan mismatch* refusal is a refusal and not a counter-offer (e): it names the
condition, proposes no version, and a re-dispatch carrying (a)'s `version` — or a re-plan against §3 —
is a **new** `invoke`.

**d. The quoted cost is an operand, and a mismatch is refused by name (V-1).** *"A cost change is
never silent"* (§5) was asserted and not mechanized: §3's path search returns the projected cost
*before* an `invoke`, §5 evaluates the ceiling against the **then-published** cost, and the call
carried neither — so a caller learned that a price had moved **by being refused**, and a provider
could not distinguish *"the caller saw the new price and accepted it"* from *"the caller is still
budgeting against a stale one"*. `invoke` therefore MAY carry an OPTIONAL **`quoted_cost`** — the
projected cost §3 returned and the caller actually gated against, in §2.1's `cost` shape. Normative:

- Where `quoted_cost` is present and differs from the then-published cost of the resolved
  `(name, major)`, the provider MUST refuse **quote mismatch**, naming the published cost. That names
  the real condition, where a bare ceiling refusal names a symptom.
- Where it is **absent**, behaviour is 0.4.9's exactly: the ceiling is evaluated against the
  then-published cost and a raise beyond the caller's remaining ceiling fails at the gate rather than
  overspending (delta K).
- **It is not a price lock.** A quote is not a token, carries no expiry, reserves nothing, and does not
  bind the provider: the then-published cost still governs and the invoke still fails closed. What the
  operand buys is that the refusal is **attributable to the right cause**, which a caller can act on.
- `cost` remains **outside** the `schema_id` digest (§7.1) and a re-price remains a **minor** bump
  (§7.2). This clause adds an operand; it moves no digest and re-prices nothing.

**e. Bounded on purpose.** This section defines **no** token format, issuance or rotation mechanism
(§5's own boundary, unmoved); **no** version-negotiation protocol — a refusal under (c) is a refusal,
not a counter-offer, and a re-dispatch under a different operand is a new `invoke`, exactly as §4.3g
fixes for a posture refusal; and **no** requirement that a caller pin. A consumer content to follow a
provider's single published major carries nothing and is conformant.

**Re-ratification — this adds no count.** §4.4 is the fold of deltas already recorded against the
**§7.5** count (V-5, V-1), so it re-enters validation on that count rather than opening a new one: the
mutate-live-schema re-run is what exercises it. The other four counts in the status note are restated
and none moves.

**And the MT-1 rule (0.5.7) adds no count either — it re-enters on a *different* one.** **MT-1** is a
delta of count **(i)**, the extension-shape re-run of
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md), where §3's path planning
lives and where the walk found it. The clause above is the enforcement half of that fold (§3's naming
half landed at 0.5.6), so it re-enters validation on count (i) rather than opening a seventh: that
re-run against the folded text is what exercises it, and a fold does not close its own gate. The other
five counts are restated and none of them moves.

**And that re-run has been walked (2026-09-12), and count (i) does not close.** Steps 1, 3, 4 and 8
were re-run by hand against 0.5.7 / KMI 0.3.8 — the first text carrying both halves of the fold —
and recorded at that scenario's § *Re-run — Steps 1, 3, 4 and 8 walked by hand against KCB 0.5.7 /
KMI 0.3.8*. **MT-1 does not reproduce**: §3's plan says what it planned over, the refusal above
names both majors, the major-only comparison holds under probe, no default is minted, a leg naming
another capability is refused rather than discarded, and the grant rule is untouched and correctly
named a different party. The count breaks instead on the clause's **perimeter**: **MT-2** (High,
carrier — the path result `planned_leg` is typed against has no shape anywhere in §3, §4 or §7) and
**MT-3** (Med-High, scope — the cross-check binds the party that cannot detect the condition, since
`planned_leg` is optional by design while a provider resolving at (c)(2) **selects among published
majors** and says nothing, and **no response names the resolved major**, so the disagreement is
undetectable after the fact as well as before it; the contrast is §4.5, which named `fetch`'s
outcomes for exactly this reason). Count (i) now reads *fold **MT-2** (§3) and **MT-3** (§4.4c),
then re-run Steps 1, 3, 4 and 8 again*; both are additive and KCB-only, both are **unowned**, and
the other five counts are restated and none moves.

### 4.5 The `fetch` response — an absence that answers (0.5.2)

What a `fetch` says when it does not return bytes. This folds **MA-12** of
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), and it is the half of
that delta that cannot be written on the other plane: KMI **§7.1(f)** requires a store to be able to
answer, for an id it is asked for, **not held, and not expected** *distinctly from* **not reachable**
and from **not held, pending**, and lets a consumer conclude from those answers for the set it
reached — an obligation stated on the payload plane, where KMI §7 defines *the payloads, not the
pipe*. Through 0.5.1 **nothing carried it**: §4 typed `fetch` as *"a CAS GET by `asset` id"* with a
grant and **no response vocabulary at all**, this spec cited §7.1(f) nowhere, and §4.2f independently
called a rate-limited refusal a *pending fetch* — so a fourth state shared (f)'s default word on the
same verb. The clause was asserted and unmechanized: **MA-8's class of break, one plane over**.

This section gives the three answers **a carrier on the verb that must deliver them**. The **meaning**
of each answer is KMI §7.1(f)'s and is not restated here; on disagreement §7.1(f) governs and this
section is the bug. What is fixed here is only what is on the wire.

This section is **additive at every surface**. **No verb is added** — §4's table still types exactly
five — and no plane, port kind, grant or authority role is added; no `asset` id moves (KINP §3 / KMI
§7.1(a): the id *is* the hash of the bytes, and nothing here touches them); no envelope field is
added on either plane; no `schema_id` canonicalization or published digest moves (§7.1), because a
response outcome is not a port declaration; and §7.2's compatibility table is undisturbed. **A
deployment with one store behaves exactly as it did at 0.5.1**: a store holding the bytes serves them
as before, and a response carrying no outcome reads *pending* (c), which is the tolerance delta L has
required of every consumer since 0.2.0.

**a. The outcomes are NAMED (MA-12; the failure V-10 records).** A `fetch` response carries exactly
one outcome, from this closed set. The names are normative; an implementation binds them to its
transport in the ordinary way (`fetch` is request/response and not an MCP call — §4.1), and what
this clause forbids is a consumer having to **infer** an outcome from a status code, an empty body,
or a timeout.

| Outcome | What the answering store asserts | Defined by |
|---|---|---|
| **`held`** | it holds the copy, and the bytes **are** the response — 0.5.1's behaviour unchanged, self-verifying against the id (delta G, KMI §7.1(c)) | §4, delta G |
| **`not-held-pending`** | it holds no copy **now**, and it does **not** assert that none is coming — a replication of that id may be in flight, scheduled, or simply unknown to it | KMI §7.1(f) |
| **`not-held-not-expected`** | it holds no copy and **no replication of that id is in flight or scheduled** — the one answer a consumer may conclude from, and the one this fold exists to make sayable | KMI §7.1(f) |
| **`refused`** | it declines to serve **this** request, and asserts **nothing** about whether it holds the copy — §4.2f's rate limit and the fail-closed license / egress / trust-tier gate of KMI §7.1(b)(e) via §5 both land here | §4.2f, §5, KMI §7.1(b)(e) |

**`not reachable` is deliberately not a value in that set.** It is the **absence** of a response,
observed by the consumer and asserted by no one — see (c). A store that is not reachable has not
answered, and an unanswered `fetch` is not an answer of any kind.

Where a store can distinguish *why* it refused — a rate limit, an egress gate, a missing
`fetch:asset` grant — it SHOULD say so alongside `refused`, in the shape §4.3h fixes for a refused
dispatch. That detail is a courtesy to the caller; the **outcome** is what is normative, and a bare
`refused` is conformant.

**b. The answer is owed per request, and is about the id it was asked for (the failure BP-7
records).** A store's outcome describes **that id, at the moment it was asked**. It is NOT a
registration-time property of the store, NOT a capability-level declaration in §2, and NOT a standing
fact a third party may cache and re-serve. A store that answers `not-held-not-expected` for an id,
and later receives a copy of it, answers `held` for the next request and breaches nothing: §7.1(f)'s
answers describe a moment, and a consumer that needs a later one asks again. Nothing in this section
creates an obligation to **retain** what was answered `held`, or to **acquire** what was answered
`not-held-not-expected`.

**c. Absence reads *pending*, and `not-held-not-expected` is never synthesized
([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)).**

- A response carrying **no outcome** reads **`not-held-pending`**. So does a response carrying an
  outcome this version does not define — an unknown token is not an assertion, which is §7.2's
  ignore-unknown-fields rule read on this surface.
- A `fetch` that times out, fails to connect, or is otherwise **unanswered** is *not reachable*, and
  for every purpose this section governs it reads **`not-held-pending`**: the consumer has learned
  nothing about whether that store holds the copy. Silence is never `not-held-not-expected`, and a
  store that says nothing has not said *no holder remains*.
- **A participant MUST NOT synthesize `not-held-not-expected` for a store that did not assert it** —
  not a peering registry (§3.1), not a host, not a cache, and not a store answering about another
  store. Only the store asked may assert it, and only about **itself**. This is ADR-0014's second
  decision on the other plane — *a party MUST NOT synthesize a value for a field it did not
  determine* — and it is why §3's `find` returns an **address** and never an answer about bytes.
- **The conclusion rule is KMI §7.1(f)'s, unchanged**: a consumer that reaches every store in the
  set it can see and gets `not-held-not-expected` from all of them MAY conclude **for that set**, and
  MUST NOT conclude anything about a store it could not reach. This section widens that not at all —
  it only makes the premise something a store can actually say.

**d. `refused` and *pending fetch* are reconciled, not conflated (§4.2f).** §4.2f states that a
refused `fetch` is *"a **pending fetch**, which delta L's dangling-reference tolerance already
requires every consumer to handle"*. That sentence is about the consumer's **handling** and it stands
unchanged: `refused`, `not-held-pending`, and an unanswered `fetch` alike compose onto delta L's
tolerance — retry later, treat no reference as broken. What this section adds is that they are no
longer the same **assertion**. A rate-limited refusal MUST be answered **`refused`** and MUST NOT be
answered `not-held-pending`: the refusing store may well hold the bytes, and a consumer polling for
absence would otherwise count a busy holder as evidence toward *no holder remains*. The fourth state
§4.2f spent is the consumer's **handling**, not a fourth answer competing with §7.1(f)'s three.

**e. Bounded on purpose.** This section defines **no** minimum replica count, retention obligation,
durability guarantee or designated durable holder — **DEFER-C is unmoved** and keeps its stated
trigger
([`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md));
**no** polling cadence, TTL or freshness bound on any answer; **no** protocol for discovering the set
of stores a consumer can see, which is §3 / §3.1 returning addresses; and **no** new grant — a
`fetch` still requires `fetch:asset` (§5), and an ungranted one is refused at the gate, `refused`,
before any of this is reached. A store that only ever holds or does not hold, and never says why,
remains conformant: what (a) requires is that when it *does* distinguish *not expected* from
*pending*, there is a name for it that its caller reads the same way.

**Re-ratification — this adds a sixth count, and it is one walk, not two.** §4.5 is new normative
surface on a verb, so it re-enters validation; the pass that exercises it is **Steps 8–10** of
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), which is where MA-12
was found and re-confirmed. Count **(vi)**: a re-run of those steps against the folded text, gating
§4.5 alone. That is the **same walk** as KMI's count (i), not a second one — and because count (i)
also carries **MA-13** (KMI-only), the walk can close this count while leaving KMI's open. The five
existing counts are restated and **none moves**.

**That walk has been run — by hand, 2026-09-12 — and this count does NOT close.** **MA-12 does not
reproduce**: every clause above was attacked directly and none yielded — (a)'s closed set, (b)'s
per-request rule, (c)'s absence-reads-*pending* and never-synthesize rules, (d)'s reconciliation of
§4.2f, (e)'s boundary — and KMI §7.1(f)'s conclusion rule is preserved word for word. The section
breaks on its **perimeter**, twice, in the class its own opening paragraph names: **MA-17** (High,
carrier) — (a) forbids a consumer to *infer* an outcome and then fixes **no field, key, header or
response envelope** for it, while `fetch` is the one verb this spec types by no protocol (§4), audits
as *not an MCP call at all* (§4.1) and states is not typed by a port (above), so two conformant stores
put the same normative token in different places and the implementation-private status string §7.1(f)
forbids returns **as the slot** rather than the value — and, because (c) reads absence as
`not-held-pending`, a store saying *not expected* into an unread slot is **heard to say *pending***;
and **MA-18** (Med) — (a)'s closing SHOULD routes a `fetch` refusal's *why* to §4.3h's shape, whose
two MUSTs name §4.3 as the refusing gate and a posture **class**, neither of which exists for a verb
§4.3 excludes in terms (§4.3a, §4.3f). Both are **one additive §4.5(a) edit** — name the field the
outcome is carried in, as MA-8 named §3's, carry `held` in it too, and state KCB's own minimum for a
`fetch` refusal — and both are **unowned**. MA-17 reproduces with **one store and one authority**.
Count (vi) now reads *fold MA-17 and MA-18, then re-run Steps 8–10 again*; the five other counts are
restated and none moves. Record:
[`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) § *Re-run — Steps 8–10
walked by hand against KCB 0.5.2 / KMI 0.3.7 (2026-09-12)*.

---

## 5. Trust & authorization

- **Capability grants.** Invocation requires a capability token naming the granted verb + scope
  — `invoke:compose`, `subscribe:world/consensus-reality`, `fetch:asset` (delta G). Grants are
  issued by the hosting org's governance (the control-plane host's workforce governance) and are
  **per-capability, per-world, and carry a spend ceiling** (`budget_units`, delta K), so a
  cross-participant chain (knowledge producer → media producer → paid model) cannot exceed the caller's authorized
  spend. Path-finding (§3) prefers zero-cost routes and surfaces the projected cost before an
  `invoke`.
- **A grant names its issuer, and a provider states whose grants it honours (MA-6).** Discovery
  federates (§3.1) and authorization did not: the bullet above issues grants from *the hosting org's
  governance* — one host — while §3.1 makes a peer's provider discoverable and directly dialable, so
  peering returned addresses that nobody could authorize a call to. Therefore: a grant MUST name its
  **issuing host** by **KINP id** (a host is a participant, §2, so it already has one), and a
  provider MUST state which issuers it honours — the optional `auth.accepted_issuers[]` on its
  manifest (§2). **A federation is a stated set of accepted issuers, never an implicit one:** a
  provider that states none honours only its own domain's issuer, and a grant from an issuer a
  provider does not accept is **not authorization** — the provider MUST **fail closed** and refuse,
  exactly as it would for a missing grant. Publishing a card that a peer registry indexes is not
  consent to another domain's governance.
- **A spend ceiling denominates in a stated unit, or the cross-domain call is refused (MA-6).**
  `budget_units` is a quantity in the *issuing* host's governance, and two governance domains have no
  reason to mean the same thing by it. A grant crossing an authority-domain boundary MUST state the
  unit its ceiling denominates in, and a provider that cannot interpret that unit MUST refuse the
  `invoke` **for want of one** rather than assume its own. Fail closed; never convert silently. The
  §4.2e delivery-time evaluation of a subscription's ceiling is unchanged and inherits this
  unchanged.
- **KMI's byte replication inherits this and needs no clause of its own.** Cross-domain CAS
  replication is a `fetch:asset` grant (KMI §7.1(b)(e), which cites this section) — the issuer
  naming, the accepted-issuer set, the unit rule and the fail-closed rule all apply to it as
  written.
- **What this deliberately does not specify.** Token format, issuance, rotation, and any
  trust-federation or issuer-discovery protocol stay exactly where the closing note of this section
  already puts them — in the host's own infra. KCB fixes only the **shape**: that a grant carries its
  issuer, and that a provider publishes which issuers it accepts.
- **A grant binds to `(capability, major)`** (§7,
  [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)). `invoke:compose` issued
  while `compose` was at major 1 authorizes every **1.x** — which is what §7.2's compatibility rule
  exists to make safe — and does **not** authorize major 2. A provider therefore cannot widen what
  an already-issued token permits by publishing a breaking change: the successor requires a new
  grant from the hosting org's governance. Fail closed. The grant's `invoke:<capability>` **form is
  unchanged** — the major travels with the issuance and is never encoded into a new grant name,
  which would fragment authorization the way `compose-v2` fragments discovery (§7.1).
- **The granted major is readable, and which major runs is resolved by §4.4c (V-5).** The rule above
  was right and had **no operand**: nothing on the wire said which major an `invoke` meant, so a
  provider serving two majors under one name had to choose one for a version-free call — and *highest
  published*, the obvious choice, inverts the bullet above from fail-closed into **fail-open**,
  billing a v1-granted caller at v2. Therefore: a grant MUST carry the major it was issued at,
  readable by the provider that enforces it (§4.4b), beside the issuing host it already names (MA-6);
  the target major of a call is resolved by **§4.4c** — operand, else grant, else **refuse for want of
  a version**, never a default; and a resolved major outside the granted major is refused **at the
  gate**, before the work and before the bill. The grant's name, its scope, and the token format are
  all unchanged.
- **A re-priced capability fails closed, never silently.** `cost` sits *outside* a port's
  `schema_id` (§7.1) because price is not shape, so re-pricing does not re-digest the contract and
  does not signal a break that is not one; it is a **minor** bump (§7.2), so the version moves and a
  pinned subscriber can see it. Enforcement is unchanged: path search (§3) returns the projected
  cost *before* invoke, and the grant's `budget_units` ceiling is evaluated at invoke against the
  **then-published** cost — a raise beyond the caller's remaining ceiling fails at the gate rather
  than overspending (delta K). A capability moving `cost.tier` from `free` to `paid` is this case
  and not a special one: path search stops preferring it, a zero-budget grant stops reaching it, and
  there is no silent bill.
  **What 0.5.0 adds is the operand that names the condition (V-1):** an `invoke` MAY carry the
  `quoted_cost` it gated against (§4.4d), and a provider whose then-published cost differs refuses
  **quote mismatch** rather than a bare ceiling overrun. Enforcement, governance and direction are
  unchanged — the then-published cost still decides and it still fails closed; the caller simply
  learns *why*.
- **A subscription is metered on delivery, and braked before it stops** (§4.2e). The rules above
  evaluate `budget_units` *at invoke*, of which a stream has exactly one — so a ceiling on a
  `subscribe:world/…` grant was inert until §4.2 gave it an operand (a port's `volume.cost`, §4.2a)
  and an evaluation point (per delivery). Enforcement is otherwise unchanged and still fails closed,
  with one addition that matters: an exhausted ceiling MUST NOT be the **first** signal a subscriber
  receives — a producer approaching it signals on the §4.2d control channel first, because on a
  stream *"fails at the gate"* can only mean stopping, and a ceiling is a cliff where backpressure is
  a brake.
- **A grant says what may be invoked; a posture says what may proceed unattended** (§4.3). The two
  compose and neither substitutes for the other: a grant is issued by the caller's own side and
  **binds**, while a posture is read off a peer's declaration and can only ever cause its reader to do
  **less** (§4.3c). Nothing in §4.3 widens a grant, raises a ceiling, or relaxes any gate in this
  section — a posture that admits an effect the grant does not authorize changes nothing, and the
  invoke still fails closed. A caller unwilling to accept an irreversible effect should also not hold a
  grant that reaches one; the `signing` shape below is what makes the peer's declaration attributable
  rather than merely asserted (§4.3i).
- **Signing.** Manifests and KGP packs share one signing shape (`{key_id, alg}`); inter-project
  packs and invocations SHOULD be signed so provenance (KINP §7 `prov.agent`) is
  cryptographically attributable, not merely asserted.
- **Merge-review linkage.** A pack arriving from a low-trust provider feeds the hybrid merge
  **review queue** (KINP §11 decision 2) rather than auto-applying — trust level becomes an
  input to merge aggressiveness. This is the concrete tie between the control plane's auth and
  the knowledge plane's contamination controls.

Full auth mechanics (token issuance, rotation, identity providers like Keycloak/Authentik)
live in the control-plane host's infra; KCB fixes only the *shape* of grants and signing so the
planes agree.

---

## 6. Mapping onto existing surfaces (by role)

| Role | Typical starting point | KCB participation |
|---|---|---|
| **Control-plane host** | MCP sidecars, an A2A SDK, workforce governance, agent generator seams | Provisions the registry (§3); issues grants (§5); every agent it runs publishes the KCB extension **on its own A2A agent-card** (no separate manifest file). |
| **Media authority** | an HTTP `/mcp` surface, a served `/.well-known/agent-card.json`, an API surface map | Publish the KCB extension **on the agent-card it already serves**; the extension's `params.produces` carries media ports with `world_pattern` (delta J) so a peer can discover "media *from world X*" by crawling that card; `produces` media + `grounding-only` knowledge (with `source_world`); `subscribe` to grounding worlds. |
| **Knowledge authority** | a resolver + KGP producer, a graph API | Expose `resolve`/`reconcile`/`query` and KGP snapshot/delta as capabilities; the authority provider. |
| **World producer** | a simulation/game server, generators | Consume grounding capabilities; expose world-export as a capability; in-world agents MAY publish their own manifests. |
| **Domain consumer → provider** | no agent surface yet | Consumer first (ground its own design work); later a **provider** — expose its native operation ("render this instrument") as an invocable capability so a peer's agents can drive it. |

**Mapping a capability onto a tool namespace (V-4).** Every role above that *provides* meets one
transport fact: an MCP tool namespace is **flat and name-keyed**, while §7.2 obliges a provider to
serve two majors of one capability side by side for a transition window. The two are reconciled by
**§2.4**, and only there: the capability **name** stays version-free because the registry matches it
(§3, §7.1), and the per-major **transport id** rides as an optional `binding` on the manifest entry,
which a consumer reads and never derives. A provider serving one major maps it onto one tool under its
own name and needs nothing from §2.4; a provider mid-window gives at least the colliding entries
distinct bindings, or it has not met §7.2's obligation.

---

## 7. Versioning, compatibility & deprecation

How a provider evolves a capability's schema without breaking subscribers. This was KCB's open
question 2 through 0.3.0, stated as a fork — *semver on capability names* vs *content-addressed
schemas*. [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) decides it by
layering both, because they answer different questions: **semver states intent, the content digest
establishes identity, and the digest is what makes the intent falsifiable.**

The bus is built for exactly the situation that breaks subscribers — a capability is discovered by
its **ports** (§2.1) and matched by the registry's path search (§3) rather than read by a human
before each call, so a consumer binds to a *shape* at discovery time and may hold that binding for
the life of a `subscribe` (§4); and a manifest rides on the peer's own card (§2), is crawled and
cached (§3), and has no push channel to invalidate what a subscriber already bound to. This section
is what a subscriber holds instead of that channel.

It is **additive** to §2 — fields, not a redefinition of the manifest. The extension URI does not
move, existing `params` field names are unchanged, `signing` stays shape-identical to KGP's
`manifest.signing`, the port model of §2.1 is not re-typed, and both new fields are optional on read.

### 7.1 A capability is `(name, version)`; a port carries a `schema_id`

**Capability identity.** Every entry in `params.capabilities` (§2) SHOULD carry a semver
**`version`**. The pair `(name, version)` — not the name alone — is the unit of **discovery** (§3),
of **grant scope** (§5), and of what a subscriber pins. The version is **a field, never part of the
name**: `compose` at `2.0.0` stays discoverable as `compose`, and `compose-v2` is not conformant,
because the registry matches capability *names* and a successor hiding under a different name is
invisible to a subscriber searching for the original. A capability entry without `version` is read
as **`0.0.0`-unknown** and MUST be treated by a consumer as pinnable only by digest.

**Port identity.** Every port — in `params.produces`, `params.consumes`, and each capability's
`inputs`/`outputs` — SHOULD carry a **`schema_id`**: an algorithm-prefixed digest in the KINP §3
form (`sha256-<lowercase hex>`) over the canonicalized bytes of that port's declaration.

**A knowledge port's `shape` is a routing identity, not a payload identity (V-2).** NORMATIVE, and it
is an obligation on the **reader**: a `knowledge` port declaring a `shape` and **no**
`payload_schema_id` (§2.1) establishes what the port is *for* and **not what it carries**, because
`shape` holds a free-form name and a provider may redefine the payload behind an unchanged name at an
unchanged digest and an unchanged `version`. A consumer MUST therefore read such a port as this
section's own ***no cross-check available*** default, and MUST NOT read an unmoved `schema_id` on it
as evidence that the payload is unchanged. This converts a **silent** break into a **declared
absence**, which is the whole of what the break-test demanded: the consumer that failed did not fail
for want of a digest, it failed because it believed the digest it held covered the payload. A provider
that wants the cross-check publishes a `payload_schema_id` over its own canonical declaration of that
payload — optional, no provider is obliged to, and **how far that cross-check reaches is fixed below**
rather than assumed (**V-9**). Media ports (`media_types` names an externally
standardized format) and entity ports (`types` are registry-controlled) are unaffected: their shape
keys carry structure that a third party fixes, which is exactly the property `shape` lacks.

*Deliberately not done: a shape registry.* Registering `shape` names with immutable signatures, on the
[`../registry/`](../registry/) relation rule, was the alternative and is **rejected on the record** —
it would mint a commons two authority domains must agree on before they can exchange a knowledge port,
where [KINP §3.4](identity.md) records the prefix registry as the fabric's *one* deliberately
non-federated commons and [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) federates
every other authority role; and a payload shape is authored by the participant that implements the
capability, which [ADR-0007](../decisions/ADR-0007-self-describing-participant.md) makes
self-describing. The reasoning, and the break that would re-open it, are in
[`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md).

**Canonicalization.** The bytes hashed are a JSON serialization of the port object reduced to shape
and normalized, so that two providers declaring the same port produce the same digest and one
provider re-serializing produces no drift:

1. **Keep only shape keys** — `plane`, plus that plane's type vocabulary from §2.1's table:
   `dialect`, `worlds`, `shape`, `payload_schema_id` (knowledge); `media_types`, `world_pattern`
   (media); `types` (entity). Every other key is dropped before hashing, explicitly including
   `description`, `cost`, `volume` (§4.2a), `effect` (§4.3a), the capability's own `version`, its
   `binding` (§2.4), its `deprecated` marking and `removal_version` (§2, §7.3a), and `schema_id`
   itself. **Naming the last two changes nothing and is stated because it was checked**: a
   deprecation marking is not shape by any reading — it says *when this port stops being served*,
   never *what it carries* — so it already fell outside the kept set this step defines by
   enumeration, and adding it to the drop list is clarifying rather than normative. Therefore
   **no published `schema_id` moves** for ADR-0014's carrier, the kept sets of `kcb1` and `kcb2` are
   both unchanged, and no **next** rule id is minted by it (step 5 mints one only when §2.1's *shape*
   vocabulary grows, which this does not). `payload_schema_id` is the one 0.5.0 addition and it is
   kept, because it **is** shape (§2.1): a port that starts declaring one has declared a different
   contract, and the digest must move. `cost` is priced, not typed (§5), so a
   re-price must not re-digest; and folding the `version` in would make every digest trivially
   unique and therefore useless as a cross-check *on* that version.
2. **Normalize values** — array-valued vocabularies (`media_types`, `types`, `worlds`) are sorted
   lexicographically by Unicode code point and de-duplicated; a key whose value is absent or empty
   is dropped rather than serialized as `null` or `[]`.
3. **Normalize the serialization** — UTF-8; object keys sorted lexicographically by code point; no
   insignificant whitespace; no trailing newline; shortest-form JSON string escaping. The same byte
   discipline KINP §3 applies to a claim id.
4. **Hash and prefix** — `sha256` over those bytes, lowercase hex, prefixed with the algorithm name
   and a hyphen. A future algorithm is a **new prefix**, never a reinterpretation of this one.
5. **Name the rule that produced it (V-3).** Step 1's key set is drawn from §2.1's vocabulary *as
   this version states it*, so any future minor that grows that table would make a provider and a
   consumer one minor apart digest the same port differently — and §7.2 converts that disagreement
   into *silent mutation*, the one verdict it makes non-recoverable. Two conformant parties would
   break each other, and *ignore unknown fields* (which keeps the minor tier alive at the manifest
   layer) and *hash only the keys you know* (which forks the digest here) cannot both hold of one
   key. Step 4's own principle — *a future algorithm is a new prefix, never a reinterpretation* — is
   therefore extended from the **hash** to the **key-set rule**:

   - A `schema_id` carries a **canonicalization rule id** in its prefix, as
     `sha256/<rule>-<lowercase hex>`. **An absent rule id means `kcb1`** — the key set and
     normalization of 0.4.x — so every digest already published keeps its meaning, nothing is
     republished, and no already-conformant card moves. That default is a **statement, not a
     silence**: a bare prefix asserts `kcb1` exactly as `sha256/kcb1-…` would, which is why the
     third bullet below is a MUST and not a SHOULD (**V-11**).
   - This version states **`kcb2`**: `kcb1`'s rules plus the knowledge plane's `payload_schema_id`.
     Because step 2 drops an absent key rather than serializing it, a port that declares **no**
     `payload_schema_id` canonicalizes **byte-identically** under both, and a provider MUST NOT emit a
     `kcb2` prefix for such a port. **This fold therefore moves no published digest.** A port that
     *does* declare one has changed its shape and its digest moves — which is a minor bump under §7.2
     like any other shape change, so a consumer on the old rule meets a moved digest at a **moved
     version** and takes the ordinary re-discovery path, never the silent-mutation one.
   - **Naming the rule is a MUST wherever the digest depends on it (V-11).** NORMATIVE, and it is the
     **mirror** of the MUST NOT above rather than a second rule: a provider MUST emit, in a
     `schema_id`'s prefix, the rule id of the rule it actually canonicalized under — **except** where
     that canonicalization is byte-identical to `kcb1`'s **for the port in hand**, which is the case
     the previous bullet forbids naming, so that a digest which would have been published unchanged
     at 0.4.x stays comparable to the one that was. Today the exception is exactly a knowledge port
     declaring **no** `payload_schema_id`, and the MUST is exactly one **declaring** one: step 1 keeps
     that key and `kcb1` drops it, so the two rules produce different bytes and the label is the only
     thing that says which. Publishing such a digest under a **bare** prefix is **non-conformant** —
     the prefix does not merely fail to say `kcb2`, it **says `kcb1`** by the first bullet's default,
     so the digest is **mislabelled rather than unlabelled**, and a consumer recomputing under the
     rule it was told gets a different value at an unmoved version and lands on §7.2's **silent
     mutation**, the one verdict that table makes non-recoverable — reached with **no** rule id
     present for §7.2's *incomparable* branch to catch it. The two branches therefore carry
     **opposite** strengths, and each is stated by the property that makes it true rather than by
     naming a rule: emit the rule id where the value depends on it, never where it does not. The
     **correction path for a digest already mislabelled is safe, and is not itself a mutation**:
     re-publishing it with its true rule id changes the prefix and not the hex, and the next bullet
     holds comparison to digests computed under the **same** rule id — so a consumer that bound to the
     bare form reads the corrected one as **incomparable** and re-discovers (§3), whether or not it
     knows `kcb2`. A provider MUST NOT leave a mislabelled digest standing on the ground that
     correcting it would move a published value.
   - **Comparison is meaningful only between digests computed under the same rule id.** A consumer
     that meets a rule id it does not know MUST read that digest as this section's *no cross-check
     available* default — never as a defect, and never as a mutation (§7.2).
   - Growing §2.1's shape vocabulary again mints the **next** rule id, and the two obligations above
     carry over to it unchanged **because neither names a rule**: a port whose canonicalization under
     the new rule is byte-identical to `kcb1`'s MUST NOT be prefixed with it, and one whose
     canonicalization differs MUST be. Re-interpreting `kcb1` or `kcb2` is non-conformant, for the
     reason step 4 already gives about the hash.

   This is also what makes §7.4's archival pin *interpretable* rather than merely resolvable: a digest
   recorded decades out is comparable only if the rule that produced it can be named. §7.4 needs no
   clause of its own — it is where the cost of not stating the rule would have come due.

**The `payload_schema_id` canonicalization, and how far the cross-check it mints reaches (V-9).**
NORMATIVE. The five steps above construct their own bytes: §7.1 defines the port object, so it can
reduce that object to shape and normalize it. `payload_schema_id` digests a document KCB does **not**
define — the participant's own declaration of the payload, authored by the participant that implements
the capability ([ADR-0007](../decisions/ADR-0007-self-describing-participant.md)). KCB therefore cannot
reduce it, and must not be read as having done so.

a. **What is hashed.** A `payload_schema_id` is `sha256` over the bytes of that declaration **exactly
   as the participant publishes them**, lowercase hex, algorithm-prefixed — the same form
   [KINP §3](identity.md) gives an `asset` id (*the hash of the bytes*), and for the same reason: it is
   a **content address of a document**, not a canonicalization of an object. There is no key set, no
   value normalization and no serialization rule, because there is no KCB-defined object to apply one
   to. Where the declaration is itself a JSON document a provider SHOULD apply **step 3's** byte
   discipline to it before publishing, so that re-serializing its own declaration produces no drift.
   **Step 5's rule id does not apply to this digest and MUST NOT appear in its prefix**: a rule id
   names a **key set**, and this canonicalization has none to name.

b. **What that determinism is, and what it is not.** The digest is a deterministic function of the
   published bytes — the same bytes always produce the same value, so a provider re-publishing
   byte-identical bytes never drifts, which is the second of the two properties the five steps open by
   naming. The **first** is not claimed, and saying so is the point of this paragraph: two participants
   declaring the same payload in two **different documents** produce **different** `payload_schema_id`
   values, and so do two serializations of one document where (a)'s SHOULD was not applied — the SHOULD
   removes the drift a single provider causes itself, and reaches no further. A consumer MUST NOT read
   a difference between two ports' `payload_schema_id` values as evidence that those ports carry
   **different payloads**; it is evidence
   of different **bytes**, which is all a content address ever asserts. The convergence `schema_id`
   gets from step 1's key set has no counterpart here, and minting one would require KCB to fix the
   declaration's *format* — which is the shape registry, rejected above on its federation grounds.

c. **Obtaining the declaration — checked against §4's five verbs, not assumed.** `discover` returns
   registry entries and addresses (§3). `describe` returns the AgentCard and, over `tools/list`, *tool*
   schemas (§4.1) — neither is the declaration, and a `produces` port on a subscription is not a tool at
   all. `invoke` and `subscribe` carry **payloads**, never the declaration of one. **`fetch` can carry
   it, and it is the only one that can**: by (a) the digest already *is* an address in the `asset` form,
   so where the participant has published that declaration into a CAS the consumer can reach, and the
   consumer holds the `fetch:asset` grant (§5), `fetch` returns the bytes and self-verifies them against
   that address (delta G, §4).

d. **The cross-check therefore has two branches, and which one a consumer is on is a fact it
   discovers, never one the card asserts.** Where the declaration is retrievable the cross-check is
   performable end to end and the digest is a **fact**: fetch the bytes, verify them against the
   address, read the declaration, compare it against what the port delivers. Where it is not — no
   holder, no grant, or a `not-held-not-expected` / `not-held-pending` answer (§4.5) — the consumer MUST
   read that `payload_schema_id` as **provider-attested**, carrying the evidentiary weight of a
   `version` (a **claim the provider makes**) and not that of a `schema_id` (a **fact the consumer
   checks**). On that branch this section's ***no cross-check available*** default applies unchanged and
   §7's **failure mode 2** — a payload edited without a re-digest — **stays open and is declared open**,
   which is the whole of what this paragraph fixes: V-2 converted a silent break into a declared absence
   on the branch that declares **no** `payload_schema_id`, and this does the same on the branch that
   declares one. A consumer MUST NOT read an unretrievable declaration as a defect, and MUST NOT read it
   as a mutation (§7.2) — the same reading step 5 gives an unknown rule id.

e. **No obligation is added to a provider.** Publishing the declaration into a CAS is a provider's
   choice, exactly as declaring a `payload_schema_id` at all is. A provider that declares one and
   publishes nothing retrievable is **conformant**, and has made an attestation rather than a false
   claim. What is forbidden is the consumer-side error V-2 named in the first place: believing a digest
   covers something it has not checked.

*Deliberately not done: a declaration-retrieval verb.* A **sixth verb**, or a reserved capability name
every provider declaring a `payload_schema_id` must publish, would make the cross-check unconditional,
and both are refused here. A verb is a plane-wide addition this fold has no mandate for; a reserved
capability name is a commons two authority domains must agree on before they can exchange a knowledge
port, which is the ground the shape registry was rejected on one paragraph up, and
[KINP §3.4](identity.md) keeps the prefix registry as the fabric's *one* non-federated commons. The
re-open condition is stated so it is not re-argued: a measured case in which the **attested** branch is
where the break lands — a participant whose declaration is retrievable by no route, on a leg where the
consumer's refusal to trust it cost more than the unverified bind would have.

**Falsifiability is the point — and it is true of one of these two digests without qualification.**
A consumer recomputes a **`schema_id`** from the card it fetched itself (`describe`, §4) and compares it
against the published value; the bytes it digests are **on the card**, so nothing further is needed. The
digest is a **fact** the consumer can check from bytes in hand; the `version` is a **claim** the provider
makes. Digests catch a forgotten bump and are silent on meaning; versions carry meaning and cannot be
verified. Neither replaces the other, and a missing `schema_id` means *no cross-check is available* —
never *invalid manifest*. A **`payload_schema_id`** is a fact on the same terms **only on the retrievable
branch of (d)**, because the bytes it digests are not on the card; on the attested branch it is a claim,
and a reader must not carry this paragraph's argument across to it (**V-9**).

### 7.2 The subscriber-compatibility rule

A **live subscriber** is any consumer holding a discovery binding or an open `subscribe` (§4)
against a `(name, major)`. This table is normative: it fixes what a provider MAY change under a
given bump.

| Change to a published capability | Bump | Breaks a live subscriber? |
|---|---|---|
| Add a **new capability** to the manifest | minor | No |
| Add an **optional** input field, or an optional input port | minor | No |
| **Widen** an input port — accept more `media_types`, a broader `world_pattern`, more entity `types` | minor | No |
| **Add** an output field, or an additional produced `media_type` | minor | No — consumers MUST ignore unknown output fields |
| Editorial only — `description`, examples; no `schema_id` change | patch | No |
| Add an OPTIONAL `payload_schema_id` to a knowledge port (§2.1) | minor | No — the digest moves *with* the version, and what the port routes is unchanged |
| Change a capability's transport `binding` (§2.4) | minor | No — but a live `subscribe` MUST be told on §4.2d's channel, in §7.3g's `entry_changed` frame, before the move takes effect. A cached discovery binding with no stream is **not** reached (§7.3g, DEFER-D) and meets the move at a failed dial |
| Change `cost` | minor, and never silent (§5) | No |
| Change a port's **`volume`** (§4.2a) | minor | No — the delivery envelope moves, not the shape; the version moves with it, so a pinned subscriber can see it, and a live `subscribe` is told on §4.2d's channel in §7.3g's `entry_changed` frame |
| Change a capability's or a port's **`effect`** class (§4.3a) | minor | No — the class is not shape; the version moves with it, so a pinned consumer can see it, and a live `subscribe` is told on §4.2d's channel in §7.3g's `entry_changed` frame (§4.3a). A class the caller's posture does not admit is a **refusal** at the next dispatch (§4.3c–d), never a silent proceed |
| Add a **required** input, or make an optional input required | **major** | Yes |
| **Remove or rename** a capability, a port, or a field | **major** | Yes |
| **Narrow** an input, or **remove/narrow** an output type | **major** | Yes |
| **Tighten** a produced port's `world_pattern` | **major** | Yes — it silently shrinks what the subscriber discovers (delta J) |
| Change the **meaning** of an existing field at unchanged type | **major** | Yes — and only the declared bump can say so |

**The last two rows close a disagreement, and it is recorded rather than quietly fixed
(BP-8, AP-9, V-10).** `volume` and `effect` were minted after this table was written, each in its own
section and each declaring a **minor** bump *"(§7.2)"* — §4.2a: *"the version moves, so a pinned
subscriber can see it"*; §4.3a: *"so the version moves and a pinned consumer can see it"* — and until
this version the table they cited had **no row for either**. The nearest row that reached them was
*Editorial only — `description`, examples; no `schema_id` change*, which reads **patch**, so the one
mechanism by which a subscriber learns of a re-declared envelope or a widened effect class was
asserted in two sections and unauthorized by the table that governs bumps.
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named the exposure in advance
and deliberately declined to close it — *"no bump row for `volume` or `effect` … closing it is a §7.2
change that belongs to whichever pressure test breaks it"*. Three broke it: **BP-8**
([`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md)), **AP-9**
([`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md)) and **V-10**
([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)). The rows
**agree with** what those two sections already declared and change no provider's obligation; what they
change is that the declaration now has an authority behind it. **No digest moves for them**: §7.1 step
1 drops `volume` and `effect` by name before hashing, and that drop list is untouched here — the
version moves and the `schema_id` does not, which is exactly the pairing `cost` has had since 0.2.0.

Two obligations fall out of that table, and both are normative.

- **Consumers MUST ignore unknown fields.** A consumer MUST ignore output fields it does not
  understand, and MUST NOT reject a manifest carrying capabilities or ports it does not understand.
  Without this, every additive change is breaking and the minor tier is fiction. It is the same
  tolerance §4 already requires of consumers for dangling asset references (delta L).
- **A digest change with no version change is a defect**, not a compatible edit. A provider MUST
  bump at least the minor when a port's `schema_id` changes. A consumer observing a `schema_id`
  that differs from the one it bound to at an **unchanged** `version` has detected a **silent
  mutation**: it MUST treat the capability as unusable and MUST NOT guess which side is right.
  Re-discovery (§3), not a retry, is the recovery.
- **Two things are NOT a silent mutation, and a consumer MUST NOT report them as one.** (i) A
  knowledge port whose `schema_id` has *not* moved is no evidence that its payload has not, where the
  port carries no `payload_schema_id` — that port never had a payload cross-check, and §7.1 makes a
  consumer read it as *no cross-check available* (**V-2**). (ii) A digest carrying a canonicalization
  **rule id** the consumer does not know is *incomparable*, not mutated, and is read the same way
  (**V-3**). The verdict this table makes non-recoverable is reserved for the case it was written for:
  the same rule, the same port, a moved digest, an unmoved version. **That reservation holds only
  because §7.1 step 5 requires the rule id wherever the digest depends on it (V-11)**: a digest
  produced under one rule and published under the prefix that names another would reach this verdict
  carrying no rule id for (ii) to catch, which is why the naming is a MUST there and not a SHOULD.
- **Which major a call runs against is §4.4c's, and it is not a default.** This table governs what a
  provider MAY change under a bump; §4.4 governs which of the published majors an `invoke` reaches.
  The two are complementary and neither substitutes: a provider dual-serving under this table MUST
  make each major addressable (§2.4) and MUST resolve — or refuse — under §4.4c.

**A breaking change is published as a successor, never edited in place.** A provider MUST NOT mutate
a published `(name, major)` into an incompatible shape. It publishes an **additional** entry in
`params.capabilities` at the new major, serves **both** for a transition window, and marks the
predecessor deprecated with a declared removal version (§7.3). So the signal for a break is the
*appearance of a new major beside the old one*, visible at discovery or `describe` time: the
capability a subscriber bound to keeps working, the successor is discoverable next to it, an
unpinned consumer migrates by re-discovering and a pinned one when it chooses. **A subscriber never
learns of a break by failing an invoke.**

That invariant is **pull-side**, and the bus's most durable binding never pulls: a consumer holding an
open `subscribe` (§4) is under no obligation to re-`describe`, and before 0.5.0 it learned of a
successor, a deprecation and a removal alike by a **dead stream** (**V-7**). **§7.3g** is the
streaming half of this rule — the same three facts, pushed on §4.2d's existing in-band control
channel, each before it takes effect — and since 0.5.5 it carries a **fourth** frame,
`entry_changed`, which is where the three rows of the table above that promise a live subscriber a
signal (`binding`, `volume`, `effect`) get the carrier they were asserting without (**V-10**,
**BP-8**, **AP-9**). A discovery binding held with no stream open, and a grant (§5), which does not
expire, are reached by neither half; §7.3g states that boundary rather than implying it is closed.

This is the rule two other parts of the fabric are already instances of: a **relation signature** is
immutable once published ([`../registry/README.md`](../registry/README.md)) because changing it
changes every dependent claim id, and a **claim or asset id** *is* its content (KINP §3). In all
three cases the fabric evolves by adding a successor and retiring the predecessor on a declared
schedule — never by mutating a published surface.

### 7.3 Deprecation — a retiring surface names its own end

The window §7.2 opens, stated once for **every** retiring surface the bus has: a capability major, a
media type, a manifest location (§2.2), an extension URI.

- **a. A deprecation is a declaration, and it names its own end.** To deprecate a surface is to
  publish, in the same release: (i) the successor, (ii) an explicit deprecated marking on the
  predecessor, and (iii) a **removal version** — the version at which the obligation to emit or
  accept the predecessor ends. A deprecation that names no removal is not a deprecation; it is an
  unbounded promise a subscriber cannot plan against.

  **(ii) and (iii) are fields, and §2 names them
  ([ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)).** For a retiring
  **capability major** — the one surface here that a manifest carries — the marking is §2's
  `deprecated` on the `params.capabilities[]` entry and the removal version is its
  `removal_version`. Both are optional on read and write and **absent `deprecated` means *not
  deprecated***. A provider that declares a deprecation in prose, a release note, or a
  `description` string and not in these fields has **not** deprecated anything under this section:
  discovery (d) has nothing to rank on, §7.3g's `deprecated` frame has nothing to carry, and the
  subscriber this window exists for never learns. The other three surfaces (b) names — a media type,
  a manifest location, an extension URI — have **no manifest entry of their own** and are declared
  where they are defined, in the prose of the spec that defines them, on that spec's own minor axis;
  this clause adds no field for them and none is implied.
- **b. The window is measured in the retiring surface's own versions, never in wall-clock dates.**
  For a capability that axis is §7.1's semver. For a surface with no version of its own — a media
  type, a manifest location, an extension URI — it is the **minor version of the spec that defines
  it**. A version is a deadline a consumer can read off the contract; a calendar date is a
  *deployment* fact, visible only to the operator and enforceable by nothing on the wire.
- **c. Never in the same release — and the floor is measured on the axis's own unit (V-6).**
  Declaring and removing MUST NOT be the same publication, so that a consumer one version behind
  still meets the deprecation before the removal. *How far apart* depends on **who authors the
  axis**, and the two cases are not the same rule:
  - **A surface whose axis is a koine spec version** — a media type, a manifest location, an
    extension URI: **at least one full minor**, unchanged from 0.4.x. This is where the rule was
    argued and where it is correct: a spec minor is published on a public cadence by a party that is
    not the retiring one, so "removed at KMI 0.4.0" is a deadline a consumer can plan against.
  - **A retiring capability major** — an axis the retiring party **publishes itself, at will**: **at
    least the successor's next major.** *"`1.x` removed at `2.1.0`"* is conformant arithmetic and no
    floor at all, because (e) forbids moving a declared removal *earlier* and says nothing about
    **arriving** at it sooner — a provider may declare it and ship `2.1.0` the next day, which is
    exactly what the break-test did. One full breaking-change cycle of dual service is a floor that
    costs the declaring party something to reach, which is what makes it one.
  - The three surfaces mid-window under this policy are all of the **first** kind, so no declared
    removal version moves for this change (see below).
- **d. Both forms are served, and the predecessor stays functional, for the whole window.**
  Deprecated means *superseded*, not *degraded*. Where both are offered for the same thing the
  **successor is authoritative**. Discovery (§3) MUST keep returning a deprecated entry — marked,
  and carrying its removal version — while ranking it below any non-deprecated entry that satisfies
  the same query, so a subscriber meets the deprecation at discovery or `describe` time. *Marked*
  means the entry the registry returns carries §2's `deprecated`, and *carrying its removal version*
  means it carries §2's `removal_version`; a registry MUST pass both through as the provider
  published them and MUST NOT drop, rewrite, or invent either (§3, and §3.1(d) where a federating
  registry merges two attributions of one entry).
- **e. A declared removal moves later, never earlier.** Extending a window is a fresh declaration
  and is compatible with everyone. **Shortening** one breaks every subscriber that planned against
  it and MUST NOT be done; a predecessor that must go sooner than declared goes as a new major under
  §7.2, not as a re-dated retirement.
- **f. Removal ends the obligation, never the readability.** Past the removal version a producer
  MUST NOT emit the retired form and a consumer is no longer obliged to accept it. Nothing already
  produced is invalidated: content-addressed artifacts stay valid and fetchable, and an archival
  record naming a retired contract version stays resolvable (§7.4). Retirement is a statement about
  the **live** contract only.
- **g. A live subscriber is told, on the channel that already exists (V-7).** Everything in (a)–(f)
  is **pull-side**: a subscriber meets a deprecation at discovery or `describe` (d), and a consumer
  that never re-discovers meets it nowhere. The bus's most durable binding never pulls — an open
  `subscribe` (§4) is under no obligation to re-`describe` — so a fully conformant subscriber slept
  through successor, deprecation and removal alike and learned by a **dead stream**, which is
  precisely the invariant §7.2 rates highest. Therefore, NORMATIVE: a producer serving a live
  `subscribe` bound to a `(name, major)` MUST emit, on the **§4.2d control channel** in the
  producer→subscriber direction, each of the following events that binds that subscriber:

  | Frame | Announces | Emitted |
  |---|---|---|
  | `successor_published` | a successor at a new major now stands beside the bound one (§7.2), carrying that successor's version and — where the provider serves it elsewhere — its `binding` (§2.4) | when the successor is published |
  | `deprecated` | the bound `(name, major)` is now marked deprecated, carrying its declared **removal version** (a) | when the marking is published |
  | `removal` | the removal version has been reached and this subscription ends under (f) | **before** the stream stops |
  | `entry_changed` | a **declared non-shape operand** on the bound entry has moved — its transport `binding` (§2.4), a port's `volume` (§4.2a), an `effect` class (§4.3a) — carrying the capability's **new `version`** and naming which of them moved (**V-10**, **BP-8**, **AP-9**) | when the new version is published, and **before** the change takes effect |

  - **Each frame precedes the fact it announces**, never follows it. A subscriber MUST NOT be left to
    learn any of the four from a failed `invoke`, a failed dial, or a stream that simply stops; a
    producer that stops a stream at removal without a preceding `removal` frame is
    **non-conformant**, and so is one that moves a bound entry's `binding` without a preceding
    `entry_changed`.
  - **One channel, not two.** These are frames on §4.2d's existing in-band channel, which mints that
    channel in both directions and requires exactly this: *"a fold of V-7 MUST carry its deprecation
    and removal signals on this channel rather than mint a second, parallel signalling mechanism."*
    No verb, no transport, no second connection, and §4.1's audit is unchanged.
  - **Additive under §4.2d's own rule.** A subscriber that understands none of the four ignores them
    and is exactly as exposed as it was at 0.4.9 — no worse; a producer that emits none is now
    **detectable** rather than merely silent, because the frames are **named** and a scenario can
    assert their absence (KCS §5). That property is the whole of why a fourth frame was minted
    rather than the three MUSTs narrowed: an *unnamed* frame is one §4.2d's own
    ignore-what-you-do-not-understand rule lets every conformant subscriber discard, so an undefined
    signal and an absent one are the same signal and neither is assertable (**V-10**). It composes
    across §3.1 federation unchanged, for §4.2d's stated reason:
    the binding — and therefore its channel — runs directly between the two peers, and no party with
    jurisdiction over both ends was ever required.
  - **`entry_changed` carries a version, not a shape, and one fact never gets two frames
    (V-10, BP-8, AP-9).** This is the one frame in the table that announces no deprecation fact, and
    it lands here rather than in a table of its own for §4.2d's reason: there is **one** channel, so
    there is one place its vocabulary is named, and a second frame table would be a second place to
    look for it. Three sections already stated that a live subscriber is told on this
    channel and none of them named a frame: §2.4 and §7.2's `binding` row (0.5.0), §4.3a for an
    `effect` class (0.4.8), and §7.2's `volume` row (0.5.4). This frame is their carrier and adds
    **no obligation that was not already published** — what it adds is a name to read it by.
    Normative: it MUST carry the capability's **new `version`**, which is the fact a pinned
    subscriber acts on and the fact every one of those three rows rests on (*the version moves, so a
    pinned subscriber can see it*); it MUST name which operand moved, so a subscriber may act on one
    and ignore another; it MUST NOT be used to announce a change of **shape**, which is a new major
    and is announced by `successor_published`; and it MUST NOT be used in place of `deprecated`,
    which has its own frame and its own carrier in §2 (a). A change to `cost` (§2.1, §5) MAY be
    carried by it — §5 states no telling obligation, a re-price failing closed at the gate instead —
    and carrying it is a courtesy, never a substitute for that gate.
  - **What *"never left to a failed dial"* is actually worth, stated rather than promised
    (V-10).** §2.4 and §7.2's `binding` row both make that promise, and it is met for exactly one of
    §7.2's three binding forms — the one this channel exists on. A subscriber holding an open
    `subscribe` does not dial the stream it already has, but it dials the entry's address again
    whenever it re-establishes a dropped stream or `invoke`s the same capability, and `entry_changed`
    is what puts the new address in its hands before either. A consumer holding a **cached discovery
    binding** and no stream dials on every call and has no channel at all: for it the promise is
    **not** met, and this fold states that here instead of leaving it unqualified — it is the next
    bullet's boundary and **DEFER-D**, not a gap this frame closes.
  - **What this does not reach, stated rather than implied.** §7.2 defines three binding forms and
    this channel exists on one of them. A **discovery binding** — cached port shapes with no stream
    open — and a **grant** (§5), which does not expire, have no channel, so for those (a)–(f)'s
    pull-side machinery remains the whole of the contract. The two mechanisms that would reach them —
    a stated re-validation cadence, and a TTL on the binding or the grant — are **deliberately not
    folded here**: a cadence is only as good as the declared window, which (c) has just conceded was
    not trustworthy; and a TTL is the most invasive of the three, touches §5's issuance, and buys a
    streaming subscriber nothing this frame does not. The break that would force one is recorded, with
    its trigger, in
    [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md)
    (DEFER-D).

Two surfaces are mid-window under this policy today, and one has just left it. **Removed at this
version:** KCB's own standalone `/.well-known/kcb-manifest.json`, whose declared removal was **KCB
0.5.0** and this is it (§2.2) — under (f) the obligation ends and the readability does not. **Still
mid-window:** the **legacy namespace root** of the §2 manifest extension URI, removed at **KCB 0.6.0**
(§2.3), and KMI's deprecated `application/vnd.koine.edl+json`, removed at **KMI 0.4.0**
([`media-interchange.md`](media-interchange.md) §4.4). Both of those axes are **koine spec versions**,
so (c)'s one-full-minor floor is the one that applies to them and **neither declared removal version
moves** for (c)'s split.

### 7.4 An archival pin is not a live binding

A record that *names* a contract version is not a subscriber to it, and the two are governed
differently on purpose. The case the fabric already has is a finetuned model, which pins the
`kft_version` it was trained under ([`fine-tuning.md`](fine-tuning.md) §11.5) and — because the run
was an `invoke` on this bus — the `(name, version)` and port `schema_id`s of the `finetune`
capability that produced it.

A live subscriber must be **protected from change**; an archival pin must merely stay
**resolvable**. So retirement under §7.3 ends the obligation to *emit or accept* a retired version,
and never the ability to *read* what was recorded under it. A finetuned model therefore does not
"break" when its producing capability reaches a new major: it still reproduces, audits, and compares
against the contract it names. A **re-run** is a new `invoke` and is governed by §5's grant rule
like any other — the pin explains what was trained; it does not authorize training again.

### 7.5 Pressure test for this section

§7 is normative text that has not yet been broken against, and an unexercised canonicalization
(§7.1) rots. Before KCB re-ratifies, the **mutate-live-schema** scenario MUST break-test it: a
provider ships a capability v2 while a v1 subscriber is live, and the scenario asserts that the v1
binding survives, that a `schema_id` change under an unchanged `version` is caught as a silent
mutation (§7.2), that the v1 grant does not reach v2 (§5), and that a cost raise fails closed
against the spend ceiling rather than overspending. Prefer finding the break to asserting
correctness.

**That scenario has landed and been run:**
[`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md). All four
assertions above were exercised and **three broke**, along with four more the section had not
anticipated — deltas **V-1…V-8**, of which **V-2, V-4, V-5 and V-7** are blocking. §7's *model* is
not in question (semver for intent, digest for identity, successor-never-mutate-in-place all held,
several under direct attack); its *perimeter* is: nothing carries a version at invoke time (V-5) and
the second major has no address on the transport (V-4), so the dual-serving window §7.2 mandates
cannot be operated; no §7 signal reaches a streaming subscriber (V-7); and the digest is blind on
knowledge ports (V-2) and incomparable across a spec minor (V-3). Every proposed fold is additive.
The scenario's *Re-ratification — what this pass gates* section states the condition precisely: this
pass discharges §7.5's requirement that the break-test be **written and run**, and does **not**
discharge the gate, because the run was not clean.

**Those folds have now landed — at 0.5.0, the version §7.3 already schedules for §2.2's removal.**
Seven of the eight are folded and one is closed: **V-2** → §2.1's `payload_schema_id` and §7.1's
reader rule (a bare `shape` is not a cross-check); **V-4** → **§2.4**'s transport `binding`;
**V-5** → **§4.4a–c**'s version operand, readable granted major and no-default resolution, with §5;
**V-7** → **§7.3g**'s three frames on §4.2d's existing channel; **V-3** → §7.1 step 5's
canonicalization rule id; **V-6** → §7.3c's per-axis floor; **V-1** → §4.4d's quoted cost and its
named refusal; **V-8** is closed where it lands, in KCS §7 open question 1. Three of the seven are
**split** — V-2's shape-registry route is rejected on the record, V-7's cadence/TTL remainder is
DEFER-D and V-6's `deprecated_at` is DEFER-E — and the extent of each is reasoned in
[`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md).

**A fold does not close its own gate. KCB stays Candidate**, and this count is now a **re-run of
Steps 3, 5, 7, 8, 9 and 10 against the folded text**, with Steps 2, 4, 6 and 11 as the regression
set. (Step 3 is in both lists on purpose: its digest-exclusion half *held* and its quote half broke —
see that scenario's *Fold status*, which corrects the pass's own regression-set line.) The re-run is
**unowned**, and per **DR-7** re-running today's KCS encoding proves nothing about the fold: that
encoding deliberately does not assert an unfolded delta, so it must be **extended** — through the
declared-console-extension escape hatch KCS §7 open question 1 blesses and **V-8** measures the cost
of — before a clean run can discharge this count.

**That re-run has now been walked twice, by hand, and this count does NOT close.** The first walk
(2026-09-03) corrected the step list above — it mis-files **Step 6** exactly as the scenario's *Fold
status* found it mis-filing Step 3, so the flip list is Steps **3, 5, 6, 7, 8, 9, 10** and the
regression set is Steps **1, 2, 4, 11** — and returned **V-9**, **V-11** and **V-10** with
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s unwritten clause
reproducing at Step 9 **with a single registry and no peering**. The second (2026-09-12, against
**0.5.3**, the first text carrying this document's own folds) re-walked Steps **5**, **6**, **9** and
**11**, re-checked Step **4**, and restated Steps 1, 2, 3, 7, 8 and 10 unmoved on the ground that
every clause they read is byte-unchanged. **V-9 and V-11 do not reproduce**, and **Step 9's blocker is
gone** — 0.5.1's `deprecated` / `removal_version` carrier discharges it here, so ADR-0014's clause is
struck from this count's preconditions. Step 11's `kcb2`-with-an-absent-prefix qualification closes
with it. Four new perimeter deltas stand: **V-12** (High — §7.1(d)'s retrievable branch is a
**content address**, an integrity instrument, and failure mode 2 is a **staleness** failure, so it is
open on both branches and declared open on one), **V-14** (Med-High — step 5's new MUST binds the
provider and no clause gives the **consumer** the reading, and the verdict the fold cites is not the
one §7.2 states), **V-15** (Med — §7.3a(a)'s *a deprecation that names no removal is not a
deprecation* collides with §2's SHOULD and its *read it as a deprecation with no planned end*) and
**V-13** (Med — §7.1(d) enumerates three of §4.5's four outcomes and omits `refused`). **V-10 stands,
unfolded**, so the count would not have closed on a clean walk of the three steps either. It now
reads: **fold V-10 (one edit with BP-8 and AP-9), V-12 + V-13 (one §7.1(d) edit), V-14 (one §7.1
step 5 / §7.2 edit) and V-15 (one §2/§7.3a edit), then re-run Steps 5, 6, 9 and 10.** All four are
additive and KCB-only, and all four are **unowned**. **DR-7** is untouched and independent. Records:
that scenario's *Re-run — Steps 3, 5, 6, 7, 8, 9 and 10 walked by hand against KCB 0.5.0
(2026-09-03)* and *Re-run — Steps 5, 6, 9 and 11 walked by hand against KCB 0.5.3 (2026-09-12)*
sections.

**A third walk, against 0.5.5, and it does not close either.** Steps **2**, **3**, **7** and **10**
were re-read by hand the same day against the first text carrying the **V-10 / BP-8 / AP-9** fold —
Steps 2 and 3 because §7.2's table gained two rows beside the rows they read, Step 7 because §2.4's
`binding` bullet moved, Step 10 because it is where V-10 was filed — with Steps 5, 6, 9 and 11
restated unmoved on the verified ground that §7.1, §2's `removal_version` bullet and §7.3a are
byte-unchanged, so **V-12, V-13, V-14 and V-15 stand exactly as filed**. **V-10 does not reproduce**,
on both legs: §7.3g's `entry_changed` is the carrier every routed MUST was missing, minting no second
mechanism and preceding the fact it announces, and *"never left to a failed dial"* is **qualified**
rather than deleted. Step 7 holds with V-4 intact, and Steps 2 and 3 hold with the two new rows
reading **No** in the column that carries their property. **Step 10 half-flips** on one new delta:
**V-16** (Med-High, payload) — `entry_changed` MUST carry the new `version` and MUST **name** which
operand moved, and it carries **no new value**, so §7.3g's *puts the new address in its hands* and
§2.4's *dials the new address* are both wider than the mechanism, following only from a re-`describe`
no clause requires and §7.2's pull-side invariant says is not owed; `successor_published` carries a
`binding` and this frame does not. The fold is one §7.3g edit shared with **AP-10** (count (v)) and
it is **unowned**. The count now reads: **fold V-12 + V-13 (one §7.1(d) edit), V-14 (one §7.1 step 5
/ §7.2 edit), V-15 (one §2/§7.3a edit) and V-16 (one §7.3g edit, with AP-10), then re-run Steps 5, 6,
9 and 10.** **DR-7** is untouched. Record: that scenario's *Re-run — Steps 2, 3, 7 and 10 walked by
hand against KCB 0.5.5 (2026-09-12)* section.

---

## 8. Open questions

**None open.** Every question this section has held is now normative text; the record of what each
one was, and what decided it, is kept below rather than deleted.

1. ~~**Subscription backpressure**~~ — *flow-control for high-volume-world subscriptions (per-invoke
   cost is now handled by capability `cost` + grant spend ceilings, §2.1/§5); firehose flow-control
   remains an infra concern for the host's cost advisor.* **Resolved in place at 0.4.7 → normative
   §4.2.** The numbering is deliberately **not** shifted, so every existing §8.1 reference still
   resolves. Its second clause was wrong rather than incomplete: the pressure leg
   [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) showed
   the host cannot be the addressee at all (**BP-5**), because ADR-0001 keeps it off the stream path
   and §3.1 leaves no host with jurisdiction over both ends of a federated binding. The first clause
   held and is preserved in §4.2e: per-invoke cost *is* closed, and flow control is a different
   instrument answering a different question — a ceiling is a cliff, backpressure is a brake.

*Resolved and moved:* **capability versioning & deprecation** was open question 2 through 0.3.0. It
is decided by [ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) and is now
normative **§7**; the numbering of the questions above shifted accordingly in 0.4.0.
**Registry federation** — *a single host-provisioned registry vs. per-org registries that peer* —
was then open question 1 through 0.4.5, and noted that it mirrored KINP §11 decision 1 and would
likely resolve the same way. It did:
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) decides the shared pattern for all
three planes, and its KCB application is now normative **§3.1**. The numbering shifted again in
0.4.6, leaving one open question — which 0.4.7 then resolved **in place**, per the entry above.

## Pressure test

Exercised by [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
All blocking deltas were folded in 0.2.0: **F** (ports span all planes, §2.1/§3), **G**
(`fetch` verb §4 + `fetch:asset` grant §5), **J** (`world_pattern` on media ports, §2.1/§3),
**K** (capability `cost` + grant spend ceiling + cost-aware path search, §2.1/§3/§5), **L**
(dangling-reference tolerance, §4).

**0.3.0 re-check — the AgentCard-extension collapse reopens none of F/G/J/K/L.** The change is
one of *shape and location*, not of the port/cost/world model: F's cross-plane ports and K's
capability `cost` moved verbatim into the extension's `params.produces`/`consumes`/`capabilities`
(§2.1), and J's `world_pattern` still rides on media ports in `params.produces` — the port table,
the "compose a score from a mood" cross-plane leg, and cost-aware path search all hold unchanged,
now matched off peers' card extensions (§3). G (`fetch` verb + `fetch:asset` grant) and L
(dangling-reference tolerance) live in §4/§5 and are untouched by the manifest collapse. Because no
delta is reopened, the 0.3.0 **Candidate** has a clean re-ratification path: re-run
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) against the extension
shape (discovery now crawls the `https://w3id.org/koine/kcb/manifest/0.3` extension off
`/.well-known/agent-card.json` rather than fetching a standalone `/.well-known/kcb-manifest.json`)
and confirm each leg still resolves; nothing in the port contract needs to change to re-ratify.

**0.4.0 — a second gate.** The versioning fold (§7) reopens no delta either: it adds `version` and
`schema_id` as optional `params` fields (§2/§2.1) and leaves the port model, the verbs, `signing`,
and the extension URI untouched, so the 0.3.0 re-check above still holds verbatim. But §7 states
rules the media-transform scenario never exercises — a live subscriber across a version bump, a
digest that moves without one, a grant meeting a new major, a cost raise meeting a ceiling — and it
therefore has its own break-test:
[`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) (§7.5).
**Re-ratifying KCB needs both passes:** the extension-shape re-run *and* a clean mutate-live-schema
pass. The break-test has now been **written and run**, and it is **not clean** — deltas **V-1…V-8**,
blocking **V-2** (the digest is blind on knowledge ports), **V-4** (a second major is unaddressable
on the transport), **V-5** (nothing carries a version at invoke time, so §5's grant rule has no
operand) and **V-7** (no §7 signal reaches a live `subscribe`). All folds are additive; see §7.5 and
that scenario's *Findings* and *Re-ratification* sections. The extension-shape re-run remains
outstanding and independent.

**0.4.7 — a fourth gate.** The backpressure fold (§4.2) reopens no delta either: it adds an optional
`volume` to a port (§2.1), optional operands to `subscribe`, an in-band control channel on a stream
that already exists, and a reading rule for a grant field §5 already defined — so F/G/J/K/L, V-1…V-8
and MA-6/MA-8/MA-9 are all untouched, and delta **L** is in fact what §4.2f's fan-out backpressure
composes onto. Its own break-test is the leg that forced it,
[`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md), whose six
findings **BP-1…BP-6** (blocking **BP-5**, **BP-3**) §4.2 answers clause by clause. **Re-ratifying
KCB now needs four passes:** the extension-shape re-run, a clean mutate-live-schema pass, a clean
cross-authority pass for §3.1, and a clean re-run of the firehose leg for §4.2. Each is independent
and none of the first three is moved by this fold. One convergence is deliberate and recorded in both
documents: **V-7** and **BP-5** want the *same* push channel, so §4.2d specifies one channel in both
directions and requires V-7's fold to ride it rather than mint a second.

**0.4.8 — a fifth gate.** The autonomy-posture fold (§4.3) reopens no delta either: it adds an
optional `effect` to a capability and a port (§2.1), an optional `posture` operand to verbs that
already exist, a conflict rule, a chain rule and a floor written over gates that already exist — so
F/G/J/K/L, V-1…V-8, MA-6/MA-8/MA-9 and BP-1…BP-6 are all untouched, and §4.2d's control channel is
what an effect-class change on a live binding rides rather than a second mechanism. Its own break-test
is the leg that forced it,
[`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md), whose eight
findings **AP-1…AP-8** (blocking **AP-5**, the delegated leg that escapes the caller's posture) §4.3
answers clause by clause. **Re-ratifying KCB now needs five passes:** the extension-shape re-run, a
clean mutate-live-schema pass, a clean cross-authority pass for §3.1, a clean re-run of the firehose
leg for §4.2, and a clean re-run of the cross-owner-posture leg for §4.3. Each is independent and none
of the first four is moved by this fold. ADR-0013 additionally carries a
**second-independent-implementation** condition on ratifying §4.3 (its **W3**); that is a condition of
the record, not a finding of the leg.

**0.5.0 — the second gate's deltas fold, and no sixth gate opens.** The capability-versioning fold
reopens no delta either: F/G/J/K/L, MA-6/MA-8/MA-9, BP-1…BP-6 and AP-1…AP-8 are all untouched, and
three of the new clauses are deliberately built **onto** earlier folds rather than beside them —
§7.3g's frames ride §4.2d's control channel (which mandated exactly that), §4.4c's refuse-for-want-of-a-version
is the instrument §5 already uses for MA-6's unstated ceiling unit, and §2.4's `binding` is excluded
from §3.1(d)'s three-part de-duplication key by construction. It adds **no count**: §2.4, §4.4, §7.1
step 5, §7.2's two new reader rules and §7.3c/g are the fold of the deltas count (ii) already holds,
so they re-enter validation on that count. **Re-ratifying KCB still needs five passes**, and all five
are open: the extension-shape re-run, a clean mutate-live-schema pass (now a re-run of **Steps 3, 5,
7, 8, 9 and 10** against the folded text), a clean cross-authority pass for §3.1, a clean firehose
re-run for §4.2, and a clean cross-owner-posture re-run for §4.3 — plus ADR-0013's **W3** on §4.3
alone. What did change is that 0.5.0 discharges §2.2's declared removal (§7.3f); that is a deadline
arriving, not a fold, and it closes nothing.

**2026-09-03 — the other four counts were re-run, and none of them closes.** Count (iii) was walked
on this date (changelog, below) and did not close. The remaining four have now been walked the same
way — **by hand, against the prose**, because per **DR-7**/**DR-8** an encoding does not assert an
unfolded delta and three of these four have returned `green` over open blocking deltas. Each carries its
own verdict against the section it gates; **no version moves and no clause moves** for any of them.

- **(i) the extension-shape re-run** —
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) § *Re-run — the KCB legs
  walked by hand against KCB 0.5.0*. **Does not close.** The question the count exists to ask is
  answered **yes** and answered by execution: F, G, J, K and L all hold against the card extension, and
  the three folds that landed on Steps 1/3/4 after the count opened (§4.2, §4.3, §4.4) are confirmed
  additive by running them rather than by citing their own additivity claims. It does not close on new
  delta **MT-1** (High, structural): §3's path plan names no `(name, version)` per leg, and §4.4c(2)
  resolves a version-free `invoke` to the **granted** major — so a caller that planned over the
  top-ranked successor and holds a predecessor grant is served the predecessor **silently**, no gate
  having been breached. §4.4c forbids *highest published* by name as the fail-open inversion; the
  grant-major default is the symmetric silent selection and disagrees not with the grant but with §3's
  own plan. Fold: §3 names the version a path leg was matched over, and §4.4c refuses a resolved major
  that differs from a presented plan leg. Additive; **unowned**.
- **(ii) the §7.5 mutate-live-schema re-run** —
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) § *Re-run —
  Steps 3, 5, 6, 7, 8, 9 and 10 walked by hand against KCB 0.5.0*. **Does not close.** Five flips are
  clean — **V-1** (§4.4d's quote mismatch), **V-4** (§2.4's addressable second major), **V-5** (§4.4c's
  exhaustive resolution, *highest published* forbidden by name), the stream half of **V-7** (§7.3g's
  three frames) and the *declared absence* half of **V-2** — and the regression set holds, with F9's
  *no published digest moved* confirmed by construction rather than asserted. Three new perimeter
  deltas: **V-9** (High) — `payload_schema_id` is not consumer-verifiable, since no verb retrieves the
  declaration it digests and §7.1 states a canonicalization for `schema_id` and none for it, so failure
  mode 2 stays open on the branch that **declares** one while the consumer is told a cross-check exists;
  **V-11** (Med-High) — §7.1 step 5's rule id is `MAY`, with a MUST NOT on the branch that does not need
  it and no MUST on the branch that does, so a `kcb2` digest may be published under the prefix that
  means `kcb1` and restore V-3's non-recoverable verdict; **V-10** (Med) — §7.2's `binding` row and
  §2.4 route a normative MUST to §4.2d's channel *"(§7.3g)"* and §7.3g names no such frame, while the
  binding form that actually dials has no channel at all (**DEFER-D**). The walk also establishes that
  **[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) is a base carrier gap, not
  a federation one**: §7.3a(ii), §7.3d and §3's ranking bullet read a *deprecated marking* and a
  *removal version* that no field in §2 or §3 carries, and that reproduces at Step 9 with a **single**
  registry and no peering anywhere — so the ADR's clause is a precondition of **this** count as well as
  count (iii). One bookkeeping correction: the published step list mis-files **Step 6** exactly as *Fold
  status* found it mis-filing Step 3, so the flip list is Steps **3, 5, 6, 7, 8, 9, 10** and the
  regression set is Steps **1, 2, 4, 11**. **DR-7** is untouched and independent. **Unowned.**
- **(iv) the §4.2 firehose re-run** —
  [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) § *Re-run —
  Steps 1–8 walked by hand against §4.2*. **Does not close.** Five of the six conditions that leg names
  are met, and **BP-5** — the blocking delta, and the one the leg was built to find — does not
  reproduce: §4.2 places the mechanism between the two peers, §8's parking sentence is struck, and no
  clause assigns the host anything. BP-1, BP-2 and BP-4 do not reproduce either. Two new deltas:
  **BP-7** (Med-High) — §4.2b's *MUST refuse if it cannot honour* is stated **at registration** only,
  and no clause says what a producer owes a **live** adjustment on §4.2d's channel, so §4.2c's
  *silence is not one of them* discipline stops one paragraph short of the lever Step 3 needs;
  **BP-8** (Med) — §4.2a states that a `volume` change is a **minor** bump *"(§7.2)"* and §7.2's
  normative table has no row for it, the nearest reading being *patch*, so the visibility BP-1's fix
  depends on is asserted in §4.2 and absent from the table that governs bumps. **Unowned.**
- **(v) the §4.3 cross-owner-posture re-run** —
  [`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) § *Re-run —
  Steps 1–8 walked by hand against §4.3*. **Does not close.** All five conditions that leg names are
  met and **eight of eight deltas flip**, including blocking **AP-5** — §4.3e's leg-covering class and
  its no-widening chain rule close both halves of it — and Step 6's `fetch` carve-out is *more* clearly
  right after KMI 0.3.5's MA-5 than when it was written. One new delta: **AP-9** (Med, carrier) — §4.3a
  asserts that an effect-class change on a live `subscribe` is signalled on §4.2d's channel, and no
  section names such a frame (§7.3g names three, none of them this), so an undefined signal and an
  absent one are the same signal; and it asserts a **minor** bump under §7.2 for a field §7.2's table
  has no row for, which is BP-8's defect a second time. ADR-0013's **W3** is restated and **unmoved**.
  **Unowned.**

**What the four walks establish together, and it is one sentence.** §7's model, §4.2's placement and
§4.3's intersection rule are all sound and all confirmed under re-attack; **every** new delta is a
**carrier** or **perimeter** break — a normative consequence stated in one section with no field, frame
or table row in another to carry it — and **four of the six** (V-10, BP-8, AP-9, and ADR-0014's marking)
are the *same* defect on the *same* axis: an operand deliberately kept **outside** the `schema_id`
digest, with a declared consequence and nothing carrying it. ADR-0014 named that axis in advance. All
five counts remain open; **KCB is not promoted, and would not have been on four clean re-runs**, because
count (iii) and ADR-0013's W3 stand regardless.

**2026-09-12 — count (ii) was walked a second time, against 0.5.3, and it does not close.** The
first text to carry this document's own folds was read at Steps **5**, **6**, **9** and **11**, with
Step **4** re-checked because §7.1 moved under it and Steps 1, 2, 3, 7, 8 and 10 restated unmoved on
the verified ground that every clause they read is byte-unchanged. **V-9 and V-11 do not reproduce**,
and **Step 9's blocker is gone**: 0.5.1's `deprecated` / `removal_version` carrier discharges it with
a **single registry and no peering**, so ADR-0014's clause leaves this count's preconditions, and
MA-14/MA-15/MA-16 do not reach the step because all three live inside §3.1(d)'s federated converse.
Step 11's V-11 qualification closes with it. Four new perimeter deltas: **V-12** (High, scope) —
§7.1(d)'s retrievable branch is a **content address**, which is an *integrity* instrument, while
failure mode 2 is a *staleness* failure, so `fetch` returns the superseded declaration, the
verification cannot fail for the reason that matters, and the step that would catch the break rests
on a document (a) states KCB does not define: failure mode 2 is open on **both** branches and
declared open on one; **V-14** (Med-High) — step 5's new MUST binds the provider, no clause gives the
**consumer** the reading for a bare prefix it can locally detect, and §7.2's non-recoverable verdict
is defined over a **moved published value** while a mislabel produces a **recomputation** mismatch
for which §7 states no verdict; **V-15** (Med, collision) — §7.3a(a)'s *a deprecation that names no
removal is not a deprecation* against §2's SHOULD and its *read it as a deprecation with no planned
end*, one card state with two conformant readings, reproducing with one registry; **V-13** (Med) —
§7.1(d) omits `refused` from §4.5's four outcomes. **V-10 stands, unfolded.** Nine of this pass's
eleven deltas are now folded and hold under re-attack; **§7's model has not been in question across
four walks and its perimeter is repaired in eight places and open in four**. Two of the four new
findings land on the fold published hours earlier — the **third consecutive** fold in this repo to
break on its own perimeter, after §4.5 (MA-17) and KMI §7.1(d) (MA-19/MA-20) — and the shape is
consistent: the mechanism is checked and the **claim the prose makes about it** is not. **No version
and no clause moved for the walk.**

**2026-09-12 (second entry this day) — counts (ii), (iv) and (v) were each walked against 0.5.5, and
none of the three closes.** One edit, three pressure legs, and **three separate verdicts, one per
count** — deliberately, because a combined verdict destroys the structure the six counts exist to
keep. All three walks are against the **prose**: the encodings of all three legs are green and now
predate this fold, so an exit code is not a verdict here (**DR-7**'s shape, on three counts at once).
**V-10, BP-8 and AP-9 all fail to reproduce**, which is the headline — §7.2's two rows authorize the
bump the frame's payload depends on, and §7.3g's `entry_changed` is the carrier every routed MUST was
missing, minting no second mechanism and preceding the fact it announces. **(ii)** → **V-16**
(Med-High, payload): the frame MUST carry the new `version` and MUST **name** which operand moved, and
carries **no new value**, so §7.3g's *puts the new address in its hands* and §2.4's *dials the new
address* are wider than the mechanism — `successor_published` carries a `binding` and this frame does
not. **(v)** → **AP-10** (Med-High), the same defect on the `effect` axis and sharper: §4.3f evaluates
a `subscribe` posture **once at registration**, so §4.3c's intersection has no class to intersect and
§4.3d's floor has no evaluation point on a live stream. **(iv)** → **nothing**; the same omission was
put to `volume` and does not bite, because `volume`'s purpose is discrimination *before* binding,
§4.2b's subscriber-declared limits still bind, and a moved `volume.cost` fails closed at §5's ceiling.
Count (iv) is held open by **BP-7** alone, which no part of this fold touched. V-16 and AP-10 are
**one additive, KCB-only §7.3g edit** and **unowned**. The axis tally is unchanged at **five** — MA-8,
V-10, BP-7, ADR-0014's marking, MA-17 — because V-16 and AP-10 are not *nothing carries it* but *the
carrier carries too little*; they are the **fourth consecutive** fold in this repo to break on its own
perimeter rather than its model, after §4.5's MA-17, KMI §7.1(d)'s MA-19/MA-20 and §7.1's V-12/V-14.
**No version and no clause moved for the three walks** — every normative clause of §1–§8 is
byte-unchanged, §7.3g's four rows and §7.2's table included, and no published digest moves; the edit
is three scenario sections, three gate paragraphs and a changelog entry. **KCB is not promoted and is
not promotable.**

**2026-09-12 (third entry this day) — count (i) was re-run against 0.5.7, and it does not close.**
The MT-1 fold landed in the house form for a fold with a carrier half and an enforcement half — two
patches in one publication cycle, **0.5.6** (§3's path leg names the `(name, version)` it was matched
over) and **0.5.7** (§4.4c refuses a resolved major that differs from a presented plan leg) — and
Steps **1, 3, 4** and **8** of
[`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) were then walked by hand
against 0.5.7 / KMI 0.3.8, the first text carrying both halves. Against the **prose**: the encoding
now predates **eight** publications of the spec it gates (**DR-7**), is the same encoding
`kcs:kmi-otio-roundtrip` re-titles over one fixture (**DR-4**), and answered Steps 3 and 4's provider
half from a `standin` (**DR-1**). **MT-1 does not reproduce**, re-attacked on the ground it was filed
on: the plan says what it planned over, the refusal names both majors, the comparison is bounded on
the major so an ordinary compatible upgrade is not refused, the operand cannot be used to select
(probed), and the grant rule is byte-unchanged and names a different party. **F, G, J, K and L hold
for a second consecutive walk**, and K is stronger by construction — the projected cost is now read
from the same entries the legs are named from, so delta K and delta F compose rather than merely
coexist. Two new **perimeter** deltas, both landing on the fold published hours earlier: **MT-2**
(High, carrier) — §3's *"it mints no field"* is true of a **leg** and false of a **path**, because
§3's *Query* bullet types `find` by four operand kinds returning *"matching manifests, ranked"*, §4's
verb table types `discover` the same way, neither takes a (start port, goal port) pair or returns a
path, and §4.4c nonetheless types `planned_leg` *"as §3 returned it"* — so a provider must compare a
value whose shape is fixed nowhere, and an unparseable plan is an absent plan, which is MT-1's own
silence returning through the shape; it reproduces with **one registry and one provider**, and the
contrast is MA-8, §4.5 and ADR-0014's marking, all of which minted a carrier for exactly this reason.
**MT-3** (Med-High, scope) — `planned_leg` is OPTIONAL by design (§4.4e), so the refusal binds the one
party that **cannot know a selection happened**, while a provider resolving at (c)(2) *does* select
among published majors where (c)(3) forbids exactly that, and **no response names the resolved
major** (KMI's `produced_by` names the run activity, not the capability version), so the disagreement
is undetectable after the fact as well as before it. Count (i) now reads *fold MT-2 and MT-3, then
re-run Steps 1, 3, 4 and 8 again*; both additive, both KCB-only, both **unowned**, and the other five
counts are restated and none moves. **MT-2 is the seventh finding on the axis** ADR-0014 named (after
MA-8, V-10, BP-7, the marking, MA-17 and MA-20) and this is the **fifth consecutive** walk in this
repo to break on a fold's perimeter rather than its model. **No version and no clause moved for the
walk** — every normative clause of §1–§8 is byte-unchanged, §3's MT-1 bullet and §4.4c's cross-check
included, and no published digest moves; the edit is two gate paragraphs, this paragraph, a changelog
entry and a scenario section. Count (i) is also **KMI's second promotion condition**, so a clean walk
here would have been worth more than one spec's count — it closes only KCB count (i) either way, and
**KCB is not promoted and is not promotable**.

**Downstream evidence (2026-08-24) — and this spec is where reading it wrong costs the most.** The
KCS encodings of three of the five gating scenarios were run over real MCP/A2A links and all three
came back `green` (`kcs:media-transform`, `kcs:live-schema-mutation`, `kcs:multi-authority`; recorded
in each scenario's `## Downstream results`). **No count above moves**, and the reason is the single
most important thing an owner citing this run must understand:

- **`green` is not a gate verdict.** Per the runner, `green` means every encoded step and assertion
  passed with no transport failure. Two of those three scenarios are ones koine records as *not
  clean* — `kcs:live-schema-mutation` over **four** open blocking deltas (V-2/V-4/V-5/V-7) and
  `kcs:multi-authority` over **six** (MA-6 among them) — and both come back green **because the
  encodings deliberately do not assert a delta that has not been folded** (findings **DR-7**,
  **DR-8**). The green line is evidence that the *encoded* path works, and evidence of nothing about
  the breaks. Reading it as "§7 holds" is the `passes: true` error one layer down.
- **What it is positive evidence for.** Delta **F**'s cross-plane path planning
  (`capability_path_exists`) and delta **K**'s spend ceiling (`cost_within_ceiling`, on both
  projected and actual spend) held under machine replay against real peers, including the mood→score
  leg that F exists for; and delta **L**'s dangling-reference tolerance and **G**'s `fetch` grant
  refusal both ran as encoded, the refusal as an `expect: reject` step. §7's compatibility surface
  was *replayed* but, per DR-7, not asserted.
- **And after the 0.5.0 fold, DR-7 becomes a work item rather than a caveat.** Re-running
  `kcs:live-schema-mutation` unchanged against the folded text would assert the same subset it
  asserted before and would say nothing about §2.4, §4.4, §7.1 step 5 or §7.3g. The encoding must be
  **extended** to assert the negotiated behaviour — the assertion set is written out in that
  scenario's *Conformance case* section — and **V-8** is the standing measure of what that costs:
  four of its ten assertions have no KCS §5 predicate, so the extension rides the declared
  console-extension escape hatch KCS §7 open question 1 leans toward. That extension is downstream
  work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**; it adds
  no count and does not qualify one, it is what makes count (ii) discharge*able*.
- **The fourth and fifth counts had no encoding — DR-12, DR-13 — and both are CLOSED (2026-08-26).**
  This bullet read *"have no encoding at all"* until **2026-09-03**.
  [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) and
  [`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) were koine's
  eleventh and twelfth scenarios against a downstream set of nine, and both were encoded downstream at
  `agora` `378fd3c` on 2026-08-26 — `subscription-firehose.ts` and `cross-owner-posture.ts`, each with
  the predicates KCS §5 cannot state declared as **console extensions** (BP-6; AP-1/AP-7), each run
  `green` / `partial-live` in the current evidence artifact. Verified by **running** the downstream
  count gate at `agora` `main` = `c971fc2`, not by reading a status line
  ([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
  §6.4). **Both counts are therefore open on their own re-run alone**, and §4.3 additionally on
  [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s **W3**. The one artefact
  objection KCB still carries is **DR-7** on count (ii), which is a different claim: there the encoding
  *exists* and **predates the fold**, so it must be extended rather than re-run. Closing DR-12 and
  DR-13 adds no count, removes no count, and promotes nothing — all five stand.

## Changelog

- **0.5.8** (2026-09-12, patch) — **BP-7 folded: a producer owes a live adjustment an answer, and
  silence is not one of them.** §4.2b's honour-or-refuse rule was stated **at registration** only,
  while §4.2b's preamble makes its operands *"adjustable in-band (d)"* and §4.2d calls that direction
  the lever Step 3 of
  [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) *"went
  looking for and did not find"* — so the section minted a lever and left its effect unobservable, and
  a subscriber that pulled it was back to disconnect. §4.2b gains **§4.2c's own discipline over (b)'s
  operands**: an adjustment on (d)'s channel MUST be answered `applied` (naming the operands in force),
  `cannot-honour` (naming, per operand, the value it can meet) or `unsupported`, and **silence is not
  one of them** — the registration-time rule extended past the moment it was scoped to, not a second
  convention, fail closed as §5 and §7.2 do. Four further bullets state what would otherwise be
  re-derived: the answer **echoes the adjustment's subscriber-minted id** (MA-17's carrier failure, not
  repeated — and the id orders nothing and is not a cursor); an **unanswered adjustment reads *not in
  force***, fail-closed on the reading side as §4.5(c) reads an absent `fetch` outcome as *pending*, and
  fixed for the subscriber because a producer in breach and a participant that implements none of this
  section are the same silence on the wire; the three named answers are what make the **outcome**
  assertable, which §4.2d's last bullet argued for and had only of the request; and the answer fixes a
  **shape, never a latency** — **§4.2g is untouched and re-affirmed**, `applied` committing to no drain
  time, ramp, schedule or liability, and scheduling, queue discipline, buffer sizing and admission
  policy staying in each participant's own infra. §4.2d is amended in three places to point at the rule
  rather than past it, and its **ignore-what-you-do-not-understand rule holds unchanged**, scoped to
  the frames a producer sends unasked. **Patch**: additive at every surface, the answer riding §4.2d's
  existing channel (§4.2d's own MUST against a second mechanism), no verb/plane/port kind/grant/
  authority role added and §4's verb table still five entries, §4.1's audit unchanged, the
  lossless/lossy rule and *a retraction is never shed* byte-unchanged, a 0.4.6 subscription served as
  one and never owed an answer, **§7.1 step 1 byte-unchanged so no published `schema_id` or digest
  moves**, §7.2's table undisturbed, and **0.6.0 stays spoken for** by §2.3's removal — checked, not
  tripped. The bump is on **§7.3b's axis**; §7.2's table governs a *published capability's* bumps and is
  consulted only for the two questions it answers, both **No**. **No count closes and none is added**:
  BP-7 was found inside count **(iv)**'s own walk, so that count changes shape to *re-run Steps 1–8
  against text carrying both folds* — BP-8's (0.5.4/0.5.5) and this one — and the other five counts are
  restated and none moves. **KCB is no more promotable than it was.**
- **Editorial** (2026-09-12, fourth entry this day) — **count (i) was re-run against 0.5.7, and it
  does not close.** Steps 1, 3, 4 and 8 of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) walked by hand against
  0.5.7 / KMI 0.3.8, the first text carrying both halves of the MT-1 fold. Against the prose, never a
  replay: that encoding now predates **eight** publications of this spec (**DR-7**), is the one
  `kcs:kmi-otio-roundtrip` re-titles (**DR-4**), and answered the provider half of Steps 3 and 4 from
  a `standin` (**DR-1**). **MT-1 does not reproduce** — the plan says what it planned over, the
  refusal names both majors, the major-only comparison holds, the operand cannot select, and the
  grant rule is untouched and names a different party — and **F, G, J, K and L hold for a second
  consecutive walk**, with K stronger by construction. Two new perimeter deltas on the fold published
  hours earlier: **MT-2** (High, carrier) — *"it mints no field"* is true of a **leg** and false of a
  **path**; no clause of §3, §4 or §7 types a path **request** or **result**, and §4.4c types
  `planned_leg` *"as §3 returned it"* against that absence, so an unparseable plan is an absent plan;
  reproduces with one registry and one provider. **MT-3** (Med-High, scope) — the cross-check binds
  the party that cannot detect the condition, since a provider resolving at (c)(2) selects among
  published majors where (c)(3) forbids exactly that, and **no response names the resolved major**.
  Count (i) now reads *fold MT-2 and MT-3, then re-run Steps 1, 3, 4 and 8 again*; both additive,
  both KCB-only, both **unowned**; the other five counts restated and none moves. MT-2 is the
  **seventh** finding on ADR-0014's axis and this is the **fifth consecutive** walk to break on a
  fold's perimeter rather than its model. **No version and no clause moved** — §1–§8 byte-unchanged,
  no published digest moves; the edit is §3's and §4.4's gate paragraphs, a *Pressure test*
  paragraph, this entry and a scenario section.
- **Editorial** (2026-09-12, third entry this day) — **counts (ii), (iv) and (v) were each re-run
  against 0.5.5, and none of the three closes.** One edit, three pressure legs, **three separate
  verdicts** — one per count, against the section that count gates, because a combined verdict would
  destroy the structure the six counts exist to keep. Every walk is against the **prose**: the KCS
  encodings of all three legs are green and now predate this fold, so an exit code is not a verdict
  here (**DR-7**'s shape, on three counts at once). **V-10, BP-8 and AP-9 all fail to reproduce.**
  §7.2's two rows agree with §4.2a and §4.3a and authorize the bump `entry_changed`'s payload depends
  on — a dependency confirmed by walking rather than by reading either changelog — and §7.3g's fourth
  frame is the carrier every routed MUST was missing, minting no second mechanism (§4.2d's own MUST),
  preceding the fact it announces, and bounded away from a shape change and from `deprecated`. §2.4's
  *"never left to a failed dial"* qualification reads correctly against §7.3g's closing bullet, and
  **DEFER-D is byte-unchanged with its trigger intact**. **Count (ii)**
  ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md), Steps 2, 3,
  7 and 10; Steps 5, 6, 9 and 11 restated unmoved on byte-unchanged clauses, so **V-12, V-13, V-14 and
  V-15 stand as filed**) returns **V-16** (Med-High, payload): `entry_changed` MUST carry the new
  `version` and MUST **name** which operand moved, and carries **no new value**, so §7.3g's *puts the
  new address in its hands* and §2.4's *dials the new address* both follow only from a re-`describe`
  **no clause requires** and §7.2's pull-side invariant says is not owed — and `successor_published`
  carries a `binding` where this frame does not. **Count (v)**
  ([`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md), Step 6)
  returns **AP-10** (Med-High), the same defect on the `effect` axis and sharper: §4.3f evaluates a
  `subscribe` posture **once at registration** and points a live binding at this signal alone, so
  §4.3c's intersection has no class to intersect and §4.3d's floor has **no evaluation point** on a
  live stream — §7.2's *refusal at the next dispatch* being right for `invoke` and being exactly what a
  stream does not have. **§4.3 needs no change.** **Count (iv)**
  ([`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md), Step 8,
  Step 1 re-checked) returns **no new delta**: the same omission was put to `volume` and does not bite,
  because §4.2a's purpose for `volume` is discrimination *before* binding, §4.2b's subscriber-declared
  limits still bind on a live subscription, and a moved `volume.cost` fails closed at §5's ceiling
  under §4.2e's delivery-time evaluation — a **decision recorded**, not an omission. That leg's Step 8
  also corrects its own wording: the hold *"§7.2's table is not disturbed"* is now literally false
  (two rows), and the property it asserted — **no live subscriber breaks** — is what holds, both new
  rows reading *No*. **BP-7 stands unfolded** and is the whole of why count (iv) does not close.
  **V-16 and AP-10 are one additive, KCB-only §7.3g edit** (carry the new **value** of each operand the
  frame names, scoped to its port where the operand is port-level, as `successor_published` already
  carries a successor's `binding`) and are **unowned**. Dispositions for **V-10, BP-8 and AP-9** —
  including why one generic frame beat three specific ones, and why the two table rows are not a new
  bump tier — are in
  [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md)
  § *V-10, BP-8 and AP-9 — three findings, three legs, one hole*. **No version moves and no clause
  moves**: every normative clause of §1–§8 is byte-unchanged — §7.3g's four rows and six bullets,
  §7.2's table, §2.4, §4.2, §4.3 and §7.1 included — no canonicalization changes and **no published
  `schema_id` or digest moves**; the edit is three scenario sections, three gate paragraphs, a
  *Pressure test* paragraph and this entry. **All six counts stay open and KCB is not promotable.**

- **0.5.7** (2026-09-12) — **the second half of the MT-1 fold: a plan that disagrees with what was
  resolved is refused by name.** 0.5.6 made the disagreement **sayable**; a statement no clause reads
  is not yet a rule. §4.4c resolved on the `version` operand and the grant alone, so the MT-1 case ran
  unchanged — a caller that planned over the top-ranked successor and holds a predecessor grant served
  the **predecessor**, with §5's gate satisfied, nothing refused, and now a plan in its hand naming the
  leg it meant and no way to present it. §4.4c gains one OPTIONAL operand and one rule: an `invoke`
  executing a planned leg MAY carry **`planned_leg`** — the `(name, version)` §3 named for that leg,
  carried as §3 returned it, in the operand shape §4.4a established and §4.4d reuses — and where the
  **resolved** major differs from the major of the presented leg the provider MUST refuse **plan
  mismatch**, naming the major it resolved and the major the caller planned over. **The instrument is
  reused, not minted**: §5 refuses a `budget_units` ceiling whose unit is unstated across an authority
  boundary (MA-6), §4.4c(3) refuses for want of a version where more than one major is published, and
  this is the same rule a third time — *where a value could mean two things and no party is entitled to
  guess, refuse rather than assume*. Five boundaries are stated rather than left to be derived. The
  comparison is on the **major and only the major**: `1.4.0` resolved against major 1 is **not** a
  mismatch — that is what §7.2 makes a minor mean, and refusing it would make every compatible upgrade
  a refusal — while `2.0.0` against major 1 is MT-1's case exactly. A presented leg naming a **different
  capability** is refused and **never ignored**, silent discard being the very silence MT-1 names, and
  the one place §7.2's ignore-unknown-fields rule does not reach: the field is understood and its
  *value* is the disagreement. The operand is a **cross-check, never an operand of resolution** —
  applied after the order has resolved and never inside it, never a fifth case, never a stand-in for a
  missing `version` at (c)(3), and a caller that wants to **select** still says so with §4.4a's
  `version` — so **no default is minted and no *highest published* fallback appears**, and the
  fail-open inversion **V-5** found is not reintroduced from the other side. The **grant is untouched
  and is a different party**: a resolved major outside the granted major is still refused at the gate,
  before the work, whether or not a plan leg was presented, and nothing here widens a grant or
  substitutes for one — where the resolution read the grant, the grant is correct and binding, and what
  is wrong is that the caller planned against something else. And a *plan mismatch* refusal is a
  **refusal, not a counter-offer** (§4.4e): it names the condition, proposes no version, and a
  re-dispatch carrying `version` — or a re-plan against §3 — is a **new** `invoke`. Where `planned_leg`
  and §4.4d's `quoted_cost` are both carried they come from the **same** §3 result, whose projected
  cost is *"the cost of exactly those legs"*, so the two operands cross-check one plan on its two axes
  — which leg, and at what price. **Patch, and the axis is named rather than assumed**: §7.2's table
  governs *a published capability's* bumps and decides nothing about KCB's own spec version, which
  moves on §7.3b's axis — the table is consulted for the two questions it does answer, and both are
  **No**. Additive at every surface: the operand is OPTIONAL on read and on write, an `invoke` carrying
  none of §4.4's operands against a provider publishing one major behaves exactly as at 0.4.9, no verb,
  plane, port kind, grant or authority role is added, no ranking rule and no resolution case changes,
  **§7.1 step 1's kept and dropped sets are byte-unchanged so no published `schema_id` or digest
  moves**, §7.2's table is undisturbed, and **0.6.0 stays spoken for** by §2.3's
  legacy-extension-URI-root removal — checked rather than tripped. **No count closes and none is
  added**: MT-1 was found inside count **(i)**'s own walk, so that count changes shape rather than
  gaining a sibling; §4.4's *Re-ratification* paragraph records that this clause re-enters validation
  on count (i) and not on §7.5's, since that is where the delta was filed; and a fold does not close its
  own gate. **KCB is no more promotable than it was.** Item **(2)** of
  [`../docs/reference/promotability.md`](../docs/reference/promotability.md) § *The eight things that
  stand between KCB and `ratified`* — the MT-1 fold — is **written** across 0.5.6 and 0.5.7, exactly as
  item (1) was written at 0.5.1, and writing a fold is not closing a count: what count (i) now holds is
  the **re-run**. Items (3), (4), (5) and (8) are unmoved, (6) is downstream under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and (7) is external to this repo.

- **0.5.6** (2026-09-12) — **the first half of the MT-1 fold: a path plan says what it planned
  over.** Count **(i)**'s 2026-09-03 walk of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) answered the question
  that count exists to ask — *does the port/cost/world model survive being served as an AgentCard
  extension?* — **yes**, F/G/J/K/L all holding against the card, and broke on a new seam in Step 1:
  **MT-1** (High, structural). §7.1 makes `(name, version)` the unit of discovery and §3's *Ranking
  across versions* bullet makes the registry match the **highest satisfying version** first, so a
  composed path is already built over a specific version of every leg — and §3's *Composition* bullet
  named ports, planes, providers and a projected cost and **no version anywhere**. §4.4c then resolves
  a version-free `invoke` to the **grant's** major, so a caller that planned over a top-ranked
  successor and holds a predecessor grant is served the **predecessor**: a major the grant authorizes,
  so §5's gate does not fire, nothing is refused, and the leg that runs is not the leg that was
  matched or the one whose cost was quoted. §4.4c forbids *highest published* **by name** as the
  fail-open inversion **V-5** found; this is the symmetric silent selection, and the party it
  disagrees with is not the grant — which is correct and binding — but **§3's own plan**, which
  nothing on the wire carried. §3 gains a NORMATIVE bullet: each leg of a returned path MUST name the
  **`(name, version)` it was matched over** — the exact version of the entry whose ports satisfied
  that leg, never a range, never the name alone, and §7.1's **`0.0.0`-unknown** as a *value* where the
  entry carries no `version`; the **projected cost** is the cost of exactly those legs read from the
  same entries, so a caller gating spend on the plan gates against the same `(name, version)` it
  planned over; and a plan leg is the registry's account of **what it matched**, reserving nothing,
  expiring by nothing and binding no provider, with which major an `invoke` runs against left to
  **§4.4** ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)'s route-by-lookup rule
  untouched — the registry still returns addresses and never proxies). This is the half that makes the
  disagreement **sayable**; the half that **refuses** it is §4.4c's. **Patch, and the axis is named
  rather than assumed**: §7.2's table governs *a published capability's* bumps and decides nothing
  about KCB's own spec version, which moves on §7.3b's axis — the table is consulted for the two
  questions it does answer, and both are **No**. Additive at every surface: the registry already
  indexes `version` (*Population*) and already returns it as entry data (MA-8), so **no field, verb,
  plane, port kind, grant or authority role is added**, no ranking rule changes, a deployment that
  computes no paths gains no obligation, a single-registry deployment is conformant unchanged, a
  consumer that reads no leg version is unaffected (§7.2's ignore-unknown-fields rule), **§7.1 step
  1's kept and dropped sets are byte-unchanged so no published `schema_id` or digest moves**, §7.2's
  table is undisturbed and **0.6.0 stays spoken for** by §2.3's removal. **No count closes and none is
  added** — MT-1 was found inside count (i)'s own walk, so that count changes shape rather than
  gaining a sibling — the other five are restated unmoved, and **KCB is no more promotable than it
  was**.

- **0.5.5** (2026-09-12) — **the other half of V-10 / BP-8 / AP-9: the MUST three sections state now
  points at a frame that exists.** 0.5.4 gave §7.2's table its `volume` and `effect` rows; this
  version gives the signal those rows promise a carrier. Three sections routed a live subscriber's
  notification to **§4.2d's** in-band control channel — §2.4 and §7.2's `binding` row (0.5.0), §4.3a
  for an `effect` class (0.4.8), and §7.2's `volume` row (0.5.4) — and **§7.3g named three frames and
  none of them was any of the three**: `successor_published` carries a *successor's* `binding` and
  never the bound one's. §4.2d's *"a subscriber MUST tolerate a producer that never sends one"* is why
  that is a gap and not a licence — an **unnamed** frame is one every conformant subscriber may
  discard, so an undefined signal and an absent one are indistinguishable, and §7.3g's own contrasting
  property (*a producer that emits none is detectable rather than merely silent, because the frames
  are named and a scenario can assert their absence*, KCS §5) held for three facts and failed for
  three others. **§7.3g's table gains a fourth frame, `entry_changed`** — one generic frame rather
  than three, the shape
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)'s own fix
  column proposed — announcing that a **declared non-shape operand** on the bound entry has moved
  (`binding` §2.4, `volume` §4.2a, `effect` §4.3a), carrying the capability's **new `version`** and
  **naming which operand moved**. It obeys §7.3g's rules unchanged: it rides §4.2d's **existing**
  channel and mints no second signalling mechanism, it **precedes** the fact it announces (a producer
  that moves a bound entry's `binding` without a preceding `entry_changed` is now non-conformant, as
  one that stops a stream without a preceding `removal` already was), a subscriber that does not
  understand it ignores it, and it is **bounded** — MUST NOT announce a change of **shape**, which is
  a new major carried by `successor_published`, and MUST NOT stand in for `deprecated`, which has its
  own frame and its own §2 carrier (ADR-0014). **No provider obligation is added**: every one of the
  three MUSTs was already published and only the name was missing; a `cost` change (§2.1, §5) **MAY**
  ride the frame and is deliberately left a MAY, because §5 states no telling obligation — a re-price
  fails closed at the gate — and a courtesy signal must not read as a substitute for that gate.
  **§2.4's promise is qualified, not deleted.** *"Never left to a failed dial"* is met for the one
  binding form this channel exists on: a subscriber holding an open `subscribe` does not dial the
  stream it has, but it dials the entry's address whenever it re-establishes a dropped stream or
  `invoke`s the same capability, and the frame puts the new address in its hands first. It is **not**
  met for a consumer holding only a **cached discovery binding**, which dials on every call and has no
  channel at all; that is §7.3g's closing bullet and **DEFER-D**, stated on §2.4's own sentence rather
  than left as an unqualified promise. **DEFER-D is unmoved** and keeps its trigger, and §7.3g's
  boundary — a discovery binding with no stream, and a grant (§5), reached by neither half — is
  byte-unchanged. §2.4's **bounded on purpose** paragraph is untouched: no provider is required to
  serve two majors at two endpoints, no naming convention for transport ids is defined, `binding` does
  not become a discovery key, and §7.1's ban on version-in-the-name is not touched.
  **Patch, and the axis is named rather than assumed.** §7.2's table — including the two rows 0.5.4
  added — governs **a published capability's** bumps and decides nothing about KCB's own spec version;
  the axis for a koine spec is §7.3b's *minor version of the spec that defines it*. Consulted for the
  two questions it **does** answer: no published digest moves (a frame is not a field on a card and
  §7.1 step 1's key set is byte-unchanged, so `kcb1` and `kcb2` are untouched and no next rule id is
  minted) and no live subscriber breaks (an unrecognized frame is ignored under §4.2d). Patch because
  the fold is additive at every surface — no verb, field, plane, port kind, grant or authority role is
  added, §7.2's rows are undisturbed, and a participant that implements none of it behaves exactly as
  at 0.5.4 — and because it names a carrier for MUSTs already published rather than minting one, which
  is the shape 0.5.2's §4.5 took for MA-12. **0.6.0 stays spoken for** by §2.3's
  legacy-extension-URI-root removal, and the bump is deliberately **not** declared under §7.2's table
  (BP-8/AP-9's own defect, not repeated). **No count closes and none is added**: V-10, BP-8 and AP-9
  were each found inside an existing count's re-run, so counts (ii), (iv) and (v) change shape rather
  than gaining siblings, the other three are restated unmoved, and **KCB is no more promotable than it
  was** — MT-1, V-12 + V-13, V-14, V-15, MA-14/MA-15/MA-16, BP-7, MA-17 + MA-18, DR-7 and ADR-0013's
  W3 all stand.

- **0.5.4** (2026-09-12) — **BP-8, AP-9 and V-10 folded: §7.2's table governs the two operands minted
  after it was written.** Three findings, three different pressure legs, **one hole**. §7.2's
  normative table fixes what a provider MAY change under a given bump; `volume` (§4.2a, 0.4.7) and
  `effect` (§4.3a, 0.4.8) arrived afterwards, and each declares a **minor** bump *"(§7.2)"* in its own
  section — *the version moves, so a pinned subscriber can see it* — against a table with **no row for
  either**. The nearest row that reached them, *Editorial only — `description`, examples; no
  `schema_id` change*, reads **patch**, so the single mechanism by which a subscriber learns of a
  re-declared delivery envelope or a widened effect class was asserted in two sections and
  unauthorized by the table that governs bumps.
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named this exposure in
  advance and declined to close it — *"closing it is a §7.2 change that belongs to whichever pressure
  test breaks it"* — and three legs broke it: **BP-8**
  ([`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md), count
  (iv)), **AP-9** ([`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md),
  count (v)) and **V-10**
  ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md), count (ii)),
  the last being the same defect read from the frame side. **The table gains two rows**, a `volume` row
  and an `effect` row, each **minor**, each stating whether a live subscriber breaks, and each
  **agreeing with** the section that declared it — so **no provider's obligation changes**; what
  changes is that the declaration now has an authority behind it, and the disagreement is recorded in
  §7.2 rather than silently repaired. **The merge-key consequence is followed through to §3.1(d)**,
  which is where the absent rows actually bit: a field outside §3.1(d)'s merge key is rescued **not by
  the key but by the `version` its declared bump moves**, because `version` *is* in the key — so of
  ADR-0014's five carriers, **four** (`cost`, `binding`, `volume`, `effect`) now fail the converse and
  are returned as the two entries they are, and **one** is not rescued and cannot be: the deprecation
  marking is applied to a published capability **in place**, so no bump moves a version under it, and
  it stays the case §3.1(d)(i)/(ii) were written for. Rules (i) and (ii) are unchanged in substance and
  narrower in reach — the whole of the contract for the marking, a **backstop** for the other four.
  §3.1(d)'s *deliberately leaves undecided* list loses the `volume`/`effect` item, which is now
  decided; **DEFER-D and DEFER-E are unmoved**, and so is (d)'s refusal of a peering topology or trust
  weighting. **No published `schema_id` or digest moves** — §7.1 step 1's drop list names `volume`
  (§4.2a) and `effect` (§4.3a) explicitly and is **byte-unchanged**, checked against the step rather
  than assumed, so both `kcb1` and `kcb2` are untouched and no next rule id is minted. ADR-0014 carries
  a dated amendment recording the closed exposure and the corrected reading of its own generalization
  table. **No count closes and none is added**: BP-8, AP-9 and V-10 were each found *inside* an
  existing count's re-run, so counts (ii), (iv) and (v) change shape rather than gaining siblings, the
  other three are restated unmoved, and **KCB is no more promotable than it was**.

- **Editorial** (2026-09-12, second entry this day) — **count (ii) was re-run against the folded
  text, and it does not close.** Steps **5**, **6**, **9** and **11** of
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) were walked
  **by hand** against 0.5.3 — the first text carrying that document's own folds — with Step **4**
  re-checked because §7.1 moved under it and Steps 1, 2, 3, 7, 8 and 10 restated unmoved on the
  **verified** ground that every clause they read is byte-unchanged since the 2026-09-03 walk.
  Prose, never a replay: `kcs:live-schema-mutation` now predates **three** publications of the spec
  it gates and still asserts assertions 1–10 rather than F1–F13 (**DR-7**). **V-9 and V-11 do not
  reproduce** — (a)'s content-address canonicalization, (b)'s refusal to claim cross-provider
  convergence, (c)'s verb-by-verb retrievability check and (d)'s two branches all held under direct
  attack, and step 5's third bullet holds on all four probes, including the correction path and the
  non-overlap of its exception with the existing `MUST NOT`. **Step 9's blocker is gone**: 0.5.1's
  `deprecated` / `removal_version` carrier discharges it with a **single registry and no peering**,
  MA-14/MA-15/MA-16 not reaching the step because all three live inside §3.1(d)'s federated
  converse — so **ADR-0014's clause leaves this count's preconditions**, V-6 holds under re-attack,
  and Step 11's V-11 qualification closes. Four new **perimeter** deltas, all additive and KCB-only
  and all **unowned**: **V-12** (High, scope) — §7.1(d)'s retrievable branch is a **content
  address**, an *integrity* instrument, and failure mode 2 is a *staleness* failure, so `fetch`
  returns the superseded declaration, the verification cannot fail for the reason that matters, and
  *compare it against what the port delivers* rests on a document (a) states KCB does not define;
  failure mode 2 is open on **both** branches and declared open on one, and what would close it is
  the **verb** the section refuses on the record; **V-14** (Med-High) — the new MUST binds the
  provider, no clause gives the **consumer** the reading for a bare prefix it can locally detect,
  and §7.2's non-recoverable verdict is defined over a **moved published value** while a mislabel
  produces a **recomputation** mismatch for which §7 states no verdict at all; **V-15** (Med,
  collision) — §7.3a(a)'s *a deprecation that names no removal is not a deprecation* against §2's
  SHOULD and its *read it as a deprecation with no planned end*, one card state and two conformant
  readings, §7.3d/§3's ranking and §7.3c's floor both downstream of it; **V-13** (Med) — §7.1(d)
  enumerates three of §4.5's four outcomes and omits `refused`, the one §4.5 says is not evidence of
  an absence. **V-10 stands, unfolded** (one edit with BP-8 and AP-9), so the count would not have
  closed on a clean walk of the three steps either. It now reads *fold V-10, V-12 + V-13, V-14 and
  V-15, then re-run Steps 5, 6, 9 and 10*. The other five counts are restated and **none moves**;
  **DR-7** is untouched and independent. **No version and no clause moved** — every normative clause
  of §1–§8 is byte-unchanged, §7.1's five steps and (a)–(e) included, no canonicalization changes
  and no published digest moves; the edit is §7.5's gate paragraph, a *Pressure test* paragraph,
  this entry and a scenario section. **KCB is not promoted and is not promotable.** Record: that
  scenario's *Re-run — Steps 5, 6, 9 and 11 walked by hand against KCB 0.5.3 (2026-09-12)* section.
- **0.5.3** (2026-09-12) — **V-9 and V-11 folded: the payload cross-check is given a
  canonicalization and its reach is stated instead of implied, and the canonicalization rule id
  becomes a MUST on the branch whose digest depends on it.** Two of the three findings count **(ii)**'s
  2026-09-03 re-run returned, both on §7.1, both additive, both KCB-only.

  **V-9 — the cross-check a consumer could not perform.** The structural finding Step 5 of
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) returned
  against count **(ii)** on 2026-09-03. V-2's fold (0.5.0) minted `payload_schema_id` so that a
  knowledge port could carry a payload identity its free-form `shape` could not — and then left the
  operand **unverifiable in both of the two ways §7.1 opens by naming**: the *rule* was unstated (§7.1
  fixes five steps for `schema_id` and none for this), and the *bytes were unreachable* (`discover`
  returns addresses, `describe` returns the card plus `tools/list` **tool** schemas, `invoke` and
  `subscribe` carry payloads and not declarations of payloads). §7.1's *"falsifiability is the point"*
  paragraph was therefore true of `schema_id` and false of `payload_schema_id`, while §2.1 and §7.1
  called both *the cross-check*. New NORMATIVE paragraphs (a)–(e) in §7.1: **(a)** the digest is
  `sha256` over the declaration's bytes **as published** — a **content address of a document**, the
  same algorithm-prefixed form [KINP §3](identity.md) gives an `asset` id, with no key set and no
  value normalization because there is no KCB-defined object to reduce, and a SHOULD to apply step 3's
  byte discipline where the declaration is itself JSON; **(b)** what that determinism is **and is
  not** — same bytes always the same value, but **no cross-provider convergence**, so a consumer MUST
  NOT read two differing `payload_schema_id` values as evidence of two different payloads (minting
  convergence would mean KCB fixing the declaration's *format*, which is the shape registry, already
  rejected); **(c)** retrievability checked verb by verb against §4 rather than assumed — **`fetch`
  can carry it and is the only one that can**, because by (a) the digest already *is* an `asset`
  address, self-verifying on arrival (delta G) where the provider published the declaration into a
  reachable CAS and the consumer holds the `fetch:asset` grant; **(d)** the two branches, and that
  which one a consumer is on is a **fact it discovers, never one the card asserts** — retrievable is a
  **fact** (fetch, verify, read, compare), unretrievable is **provider-attested** and carries a
  `version`'s weight rather than a digest's, taking this section's *no cross-check available* default
  with **failure mode 2 declared open**, never read as a defect and never as a mutation (§7.2);
  **(e)** no provider obligation is added — a declared `payload_schema_id` with nothing retrievable
  behind it is **conformant**, and what is forbidden is the consumer-side error V-2 named. The
  *falsifiability* paragraph is **scoped** rather than left to be over-read, and §2.1's closing
  pointer now covers a port that carries **one** as well as one that carries **none**. **Deliberately
  not done**: a sixth verb, and a reserved capability name every declaring provider must publish —
  both would make the cross-check unconditional, both are refused on the record (a verb is a
  plane-wide addition with no mandate here; a reserved name is a commons two authority domains must
  agree on, the shape registry's own ground, against [KINP §3.4](identity.md)'s one non-federated
  commons), with the re-open condition stated. **Patch, not minor, and decided rather than assumed**:
  the operand stays OPTIONAL on read and write, no verb/plane/port kind/field/grant/authority role is
  added, §7.2's table is undisturbed, **step 1's kept set and both rule ids are byte-unchanged so no
  published `schema_id` or digest moves and no next rule id is minted**, and a card carrying no
  `payload_schema_id` behaves exactly as at 0.5.2. The one narrowing is stated plainly: a provider
  that had digested some *reduced* form of its own declaration must now digest the published bytes —
  which is the narrowest reading of the 0.5.0 sentence *"over the participant's own canonical
  declaration"* rather than a replacement of it, and `payload_schema_id` is one version old. **0.6.0
  stays spoken for** by §2.3's legacy-extension-URI-root removal, and the bump is deliberately **not**
  declared under §7.2's table (BP-8/AP-9's defect, not repeated here). **No count closes and none is
  added**: V-9 was found inside count **(ii)**'s own re-run, so that count changes shape rather than
  gaining a sibling, the other five are restated unmoved, and **V-10** — the third finding of that
  re-run — is **not** folded here, so **KCB is no more promotable than it was**.

  **V-11 — the rule id was `MAY` on the branch that needed a `MUST`.** Step 6 of the same re-run.
  V-3's fold (0.5.0) answered the canonicalization-drift break by putting a **rule id** in the digest
  prefix with **absent meaning `kcb1`**, and then made naming it optional: the `MUST NOT` landed on
  the branch that does **not** need a name — a port declaring no `payload_schema_id`, which
  canonicalizes byte-identically under `kcb1` and `kcb2` — and **no MUST** landed on the branch that
  does. A conformant provider could therefore canonicalize a port **under `kcb2`**, because step 1
  keeps `payload_schema_id`, and publish the result under a **bare** prefix that step 5 defines to
  mean `kcb1`. The digest is then **mislabelled rather than unlabelled**: it names a rule that drops
  the very key it includes, a consumer recomputes under the rule it was told, gets a different value
  at an **unmoved version**, and lands on §7.2's **silent mutation** — the one verdict that table
  makes non-recoverable — with **no rule id present** for §7.2's *incomparable* branch to catch it.
  That is V-3's own verdict restored through the optionality of V-3's fix, and it is not repaired by
  reading step 5 charitably: *"re-interpreting `kcb1` or `kcb2` is non-conformant"* governs
  **re-defining a named rule**, not **omitting the name**, and the section's own default makes the
  omission a positive assertion rather than a silence. Step 5 gains a third bullet, stated as the
  **mirror** of the existing `MUST NOT` rather than as a second rule: a provider MUST emit the rule id
  of the rule it actually canonicalized under, **except** where that canonicalization is byte-identical
  to `kcb1`'s for the port in hand — today the exception is exactly a knowledge port declaring **no**
  `payload_schema_id` and the MUST is exactly one declaring one. Both arms are stated by the
  **property** that makes them true and **neither names a rule**, so they carry over unchanged to the
  next rule id §2.1's vocabulary mints. Three things are stated rather than left to be derived: the
  first bullet now says the absent prefix is a **statement, not a silence** (which is why this is a
  MUST and not a SHOULD); the **correction path** for a digest already mislabelled is safe and is not
  itself a mutation, since re-publishing it with its true rule id moves the prefix and not the hex and
  the comparison bullet then makes it **incomparable** to what a consumer bound to, so re-discovery
  (§3) is the recovery and a provider MUST NOT leave a mislabel standing on the ground that correcting
  it would move a published value; and §7.2's *not a silent mutation* bullet records that its own
  reservation — *the same rule, the same port, a moved digest, an unmoved version* — **holds only
  because** of this MUST. **The consumer-side rules are unchanged and were re-checked**: an unknown
  rule id is still read as *no cross-check available* and never as a defect or a mutation, comparison
  is still meaningful only within one rule id, and growing §2.1's shape vocabulary still mints the
  next rule id. **No published digest moves**: every digest published to date is `kcb1` and stays
  prefix-free, the two rules' key sets are byte-unchanged, and the `sha256/<rule>-<hex>` form is
  0.5.0's. §2's worked AgentCard needed **no correction** — checked, not assumed: its one input port
  declaring a `payload_schema_id` already carries `sha256/kcb2-…` and every port declaring none
  already carries a bare `sha256-…`. **Patch, not minor, and decided rather than assumed.** The
  honest statement of what moves is that this is a **narrowing**: a provider reading 0.5.2
  permissively could publish a `kcb2` digest under a bare prefix, and at 0.5.3 it cannot. It is a
  patch because the set it narrows is one 0.5.2's own text does not determine — step 5's *comparison
  is meaningful only between digests computed under the same rule id* and its ban on re-interpreting
  a named rule already argue against the permissive reading, and the break-test's finding was that
  the text **enforces neither reading**, not that the permissive one is right — so making the
  stricter reading normative **disambiguates** rather than replaces; and because no `schema_id` value
  moves, no key set moves, no rule id is minted, no field/verb/plane/port kind is added,
  `payload_schema_id` stays OPTIONAL, and **no live subscriber breaks** (a digest gaining a correct
  prefix is read as *incomparable*, which is re-discovery, not the non-recoverable verdict). The bump
  is deliberately **not** declared under §7.2's table for the reason the V-9 paragraph gives; what
  the table **is** consulted for is the two questions it does answer — does a published digest move
  (**no**) and does a live subscriber break (**no**) — and its rows are **undisturbed**. **0.6.0
  stays spoken for** by §2.3's legacy-extension-URI-root removal, checked rather than tripped: a
  minor here would discharge a removal this fold has no mandate to discharge. **No count closes and
  none is added** — V-11 was found inside count (ii)'s own re-run, alongside V-9 and **V-10**, which
  is still not folded.

- **Editorial** (2026-09-12) — **count (vi) walked by hand, and it does not close.** Steps 8–10 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) re-run against **KCB
  0.5.2 / KMI 0.3.7**, deliberately **not** a replay (`kcs:multi-authority` returned `green` over that
  pass's six blocking deltas and now predates **three** folds — **DR-8**). **MA-12 does not
  reproduce**: §4.5(a)–(e) were attacked clause by clause and none yielded, and §7.1(f)'s conclusion
  rule is preserved word for word. Step 10 nonetheless does not flip, on two **perimeter** findings in
  §4.5's own paragraph (a): **MA-17** (High, carrier) — the outcomes are named and the field they are
  read from is not, on the one verb §4 types by no protocol, §4.1 audits as *not an MCP call at all*
  and §4.5 states is not typed by a port, so the implementation-private status string KMI §7.1(f)
  forbids returns as the **slot**, and (c)'s fail-safe makes the failure silent (a store saying *not
  expected* into an unread slot is heard to say *pending*) — and **MA-18** (Med, mis-route) — (a)'s
  closing SHOULD routes a `fetch` refusal's *why* to §4.3h, whose two MUSTs name §4.3 as the refusing
  gate and a posture **class**, and §4.3a/§4.3f exclude `fetch` from posture in terms. MA-17
  reproduces with **one store and one authority**. Both are **one additive, KCB-only §4.5(a) edit**
  and both are **unowned**; count (vi) now reads *fold MA-17 and MA-18, then re-run Steps 8–10 again*.
  Steps 8 and 9 are KMI's clauses and are recorded there: Step 8 holds a third time, Step 9 does not
  flip on **MA-13**, which no part of this fold touches. **No version moves and no clause moves** —
  every normative clause of §1–§8 byte-unchanged (§4.5(a)–(e) included), no canonicalization changes
  and no published digest moves; the edit is §4.5's *Re-ratification* gate paragraph, this entry and a
  scenario section. **KCB is not promoted and is not promotable**:
  clearing one of six would not have promoted it, and count (iii), items (2)–(5) of
  [`../docs/reference/promotability.md`](../docs/reference/promotability.md) § *The eight things*,
  **DR-7** and ADR-0013's **W3** all stand regardless.

- **0.5.2** (2026-09-12) — **MA-12 folded: `fetch` gains a named response vocabulary.** The blocker
  Steps 8–10 of [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) left on
  **KMI count (i)** on 2026-09-03 and re-confirmed the same day. KMI **§7.1(f)** (the MA-10 fold, KMI
  0.3.5) requires a store to be able to answer, for an id it is asked for, **not held, and not
  expected** *distinctly from* **not reachable** and **not held, pending** — and **nothing carried
  it**: KMI §7 defines *the payloads, not the pipe* and mints no field for any of the three, §4 here
  typed `fetch` as *"a CAS GET by `asset` id"* with a grant and no response vocabulary, this spec
  cited §7.1(f) nowhere, and §4.2f independently called a rate-limited refusal a *pending fetch*, so
  a fourth state shared (f)'s default word on the same verb. **MA-8's class of break, one plane
  over.** New **§4.5** carries the answers on the verb that delivers them, in the shape the
  2026-09-03 Step 10 re-attack constrained it to and which was **not optional**: the outcomes are
  **NAMED** in the table that types the verb (`held` / `not-held-pending` / `not-held-not-expected` /
  `refused`) rather than left to a status string — the failure **V-10** records, of a MUST routed to
  a table that names no such thing; the answer is owed **per request** and about the id asked for,
  never a registration-time property of a store — the failure **BP-7** records; and
  **`not-held-not-expected` is never synthesized** by a party that did not determine it, which is
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s second decision read on
  this plane. **Absence reads *pending***: a response with no outcome, an unknown outcome, or no
  response at all is `not-held-pending`, and *not reachable* is deliberately **not a value** — it is
  the absence of an answer, asserted by no one. §7.1(f)'s **conclusion rule is unchanged** and is
  cited rather than restated; on disagreement §7.1(f) governs. §4.2f is **reconciled, not
  contradicted**: its *pending fetch* is the consumer's **handling**, which `refused`,
  `not-held-pending` and silence all still compose onto under delta L, while a rate-limited refusal
  MUST now be answered `refused` and MUST NOT be answered `not-held-pending` — a busy holder is not
  evidence toward *no holder remains*. **Additive**: no verb added (§4 still types five), no `asset`
  id moves, no envelope field added, no plane/port kind/grant/authority role added, §7.2's table
  undisturbed, no `schema_id` canonicalization or published digest moves, and a single-store
  deployment behaves exactly as at 0.5.1. **DEFER-C is unmoved** — no minimum replica count,
  retention obligation, durability guarantee or designated durable holder — and §4.5(e) states the
  rest of the boundary (no cadence or TTL, no store-set discovery protocol, no new grant). Patch,
  and **0.6.0 stays spoken for** by §2.3's removal; the bump is deliberately **not** declared under
  §7.2's table (BP-8/AP-9's defect, not repeated). **A sixth count**: a re-run of Steps 8–10 against
  the folded text, gating §4.5 alone — the same walk as KMI count (i), not a second — since a fold
  does not close its own gate. The five existing counts are restated and none moves.
- **Editorial** (2026-09-12, second entry this day) — **count (iii) was re-run against the folded
  text, and it does not close.** 0.5.1 wrote
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s clause, so the count
  became *re-run [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md)
  Steps 5–7*; that re-run was walked **by hand** — never replayed, since `kcs:multi-authority`
  returns `green` and now predates **two** folds (**DR-8**) — and is recorded in that scenario's
  *Re-run — Steps 5–7 walked by hand against KCB 0.5.1 (2026-09-12)* section. **The 2026-09-03
  blocker does not reproduce**: §7.3d's *marked* and *carrying its removal version* read a field on
  both surfaces they name (`describe` needed nothing minted), (ii) answers the merged entry's marking
  where 0.5.0 left it undefined, and §3.1(e) is no longer structurally unable to fire. **MA-6, MA-8
  and MA-9 hold under re-attack**, **Step 6 flips**, **Step 7 half-flips** — and **Step 5 does not
  flip**, on two defects inside the new clause: **MA-14** (High — §3.1(d)(i) is a cardinality switch
  a consumer MUST detect and §3 names no form for it, so §7.2's ignore-unknown-fields rule turns a
  disagreement into silence; ADR-0014 part 2 asked for an explicit *mark* and *Consequences* for a
  *per-attribution shape*, and the clause gives an implicit mark on an unnamed one) and **MA-15**
  (High — (ii)'s *deprecated for §7.3d's ranking **and marking*** and (i)'s *MUST NOT pick one* land
  on one field name, and the derived reading is circular because §7.3d defines *marking* as the
  field; the collision is in the ADR's Decision verbatim). Step 7 adds **MA-16** (Med-High — the
  merge rule keys on three per-**capability** facts while `params.mcp` and `params.auth` ride on the
  **manifest**; (i)'s framing paragraph enumerates only entry fields *"deliberately outside §7.1's
  digest"*, which those are not, and (e)'s *resolve against the provider's own card* is **circular**
  for a disputed address). **No model is in question** — (ii)'s restriction-wins and (iii)'s
  no-reconciliation rules were attacked directly and did not yield — and all three are **one
  additive, KCB-only §3/§3.1(d) edit**, **unowned**. Count (iii) now reads *fold MA-14/MA-15/MA-16,
  then re-run Steps 5–7 again*; the other **four** counts are restated and none moves. **No version
  moves and no clause moves for this walk** — every normative clause of §1–§8 is byte-unchanged,
  including all of §3.1(a)–(f) and the merge rule the walk attacked, no canonicalization changes and
  no published digest moves; the only edit inside a section is §3.1's *Re-ratification* **gate
  paragraph**, which binds nothing, beside the 0.5.1 status note and this entry. **KCB is not promotable**, and would not have been on a clean walk.
- **0.5.1** (2026-09-12) — **ADR-0014's clause is written.** The four-part decision of
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) — Accepted 2026-08-26,
  *decided-but-unwritten* ever since, and the blocker count **(iii)**'s 2026-09-03 re-run returned
  at Step 5 — lands in **§2**, **§3**, **§3.1(d)**, **§7.1 step 1** and **§7.3a/§7.3d**.
  **Part 1, the carrier:** §7.3a requires a deprecation to publish *"an explicit deprecated
  marking"* and a **removal version**, and §3's ranking bullet and §7.3d require discovery to keep
  returning that entry *"marked, and carrying its removal version"* — four normative clauses that
  through 0.5.0 named **no field to read**. A `params.capabilities[]` entry now MAY carry
  **`deprecated`** (boolean; **absent means *not deprecated***, safe because a deprecation is a
  declaration and an undeclared one does not exist) and **`removal_version`** (§7.3b's axis; a
  `deprecated` entry SHOULD carry it and one that does not is read as a deprecation with **no
  planned end**, never as an imminent removal). They are carried through §3's `find` response as
  **entry data** — manifest data on the entry, like `cost` — in *every* response and not only a
  federated one, so MA-8's three registry-generated fields (`served_by`, `observed_at`,
  `incomplete[]`) are untouched and it is **never a second envelope**. **Parts 2–4, the merge rule,**
  land on §3.1(d)'s converse, which keys on `(provider KINP id, (name, version), schema_id)` — none
  of which a marking moves, so a stale attribution and a deprecation-marked one satisfy it
  *exactly*: (i) a registry **MUST NOT synthesize** a value for a field outside the merge key, and
  where attributions disagree the merged entry carries **each attribution's own copy** bound to the
  `served_by`/`observed_at` that supplied it — the per-attribution form being the machine-readable
  mark of disagreement, which is what §3.1(e) needs in order to fire and what keeps §3.1(a) intact;
  (ii) where the disagreeing field is a **gate** the **restriction wins**, so any attribution marking
  the capability deprecated makes the merged entry deprecated for §7.3d's ranking — ADR-0013's
  monotone-restrictive discipline **reused**, on a measured asymmetry (a false deprecation costs a
  ranking demotion on an entry that keeps working and is corrected by one re-read; a missed one is
  the silent case §7.2 makes non-recoverable) — and the same reading governs `effect` and `volume`
  while deliberately **not** reaching `removal_version`, a planning datum whose disagreement stays
  under (i) because §7.3e forbids shortening a window and a registry taking the earliest of two reads
  would be doing exactly that; (iii) **no reconciliation is licensed** — two **authorities** naming
  the same capability are still both returned and never silently picked between, and (i)/(ii) apply
  **only within** the converse. **Patch, not minor**, and decided rather than assumed: every field is
  optional on read and write, a card carrying neither behaves exactly as at 0.5.0 (§7.2's
  ignore-unknown-fields rule, in both directions), no verb, plane, port kind or authority role is
  added, §7.2's normative table is **undisturbed**, a **single-registry** deployment gains no
  obligation at all, and **no published `schema_id` moves** — §7.1 step 1's *kept* set is unchanged
  (both keys are named on its drop list as a clarification, and a marking is not shape by any
  reading), so `kcb1` and `kcb2` are both unchanged and no next rule id is minted. The bump is
  **not** declared under §7.2's table, deliberately: that table governs *a published capability*, it
  has **no row** for a manifest field outside the digest, and declaring a spec bump under it is the
  defect **BP-8**/**AP-9** found in §4.2a and §4.3a — a defect this fold does not repeat and does not
  fix. **The minor axis is checked rather than tripped:** **0.6.0 stays spoken for** by §2.3's
  removal of the legacy extension-URI namespace root (`https://koine.dev/kcb/manifest/0.3`), whose
  dual-accept window runs *to* 0.6.0 — publishing one here would discharge a removal this fold has no
  mandate to discharge — and KMI's `application/vnd.koine.edl+json` removal rides **KMI 0.4.0**, a
  different spec's axis, untouched by a KCB bump. What ADR-0014 leaves undecided is left undecided
  and said so in §3.1(d): no wall-clock timestamp (`DEFER-E` unmoved, and `removal_version` is a
  version and never a date), no cadence or TTL on a discovery binding (`DEFER-D` unmoved), no §7.2
  bump row for `volume` or `effect` (BP-8/AP-9 stay open), and no peering topology, membership
  protocol or trust weighting. **Stays candidate, and this closes nothing on its own**: count (iii)
  now reads *re-run Steps 5–7 against the folded text* — a fold does not close its own gate — and the
  other **four** counts are restated and none moves, so KCB is no more promotable than it was.
- **Editorial** (2026-09-03, third entry this day) — **counts (i), (ii), (iv) and (v) were re-run, and
  none of them closes.** All four were walked **by hand** against the prose, never replayed: three of
  the four encodings return `green` over open blocking deltas (**DR-7**, **DR-8**), and an encoding does
  not assert an unfolded delta. Each verdict is recorded in the scenario it belongs to and is restated
  in the *Pressure test* section above. **Every folded delta holds under re-attack** — F/G/J/K/L against
  the card extension, V-1/V-2/V-4/V-5/V-7 against §2.4/§4.4/§7.1/§7.3g, BP-1…BP-5 against §4.2, and
  AP-1…AP-8 against §4.3, eight of eight — so no fold is reopened and no model is in question. Six new
  findings, every one a **carrier** or **perimeter** break: **MT-1** (a path plan carries no version and
  §4.4c(2) silently selects one), **V-9** (`payload_schema_id` is not consumer-verifiable),
  **V-11** (the canonicalization rule id is `MAY` on the branch that needs a MUST), **V-10** (§7.2's
  `binding` row and §2.4 route a MUST to a frame §7.3g does not name), **BP-7** (§4.2b's honour-or-refuse
  rule stops at registration), **BP-8** / **AP-9** (§4.2a's and §4.3a's declared **minor** bumps have no
  row in §7.2's normative table). The walk also establishes that
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s missing carrier for §7.3's
  *deprecated marking* reproduces with a **single registry** and no peering, so it is a base gap rather
  than a federation one and is a precondition of count **(ii)** as well as count (iii). And it corrects
  count (ii)'s published step list, which mis-files **Step 6** exactly as *Fold status* found it
  mis-filing Step 3. **No version moves and no clause moves** — §1–§8 are byte-unchanged, no
  `schema_id` canonicalization changes and no published digest moves; the edit is the *Pressure test*
  paragraph above, this entry, and four scenario sections. **All five counts stand and KCB is not
  promotable**: clearing none of five is not a promotion, and four clean re-runs would not have been one
  either, count (iii) and ADR-0013's **W3** standing regardless.
- **Editorial** (2026-09-03, second entry this day) — **DR-12 and DR-13 are closed, and KCB is no
  closer to `ratified`.** The *Pressure test* bullet above recorded counts (iv) and (v) as
  additionally failing [the ratification gate](README.md#the-ratification-gate) for want of a KCS
  encoding. Both encodings landed downstream at `agora` `378fd3c` on **2026-08-26 12:30:18** — in the
  same commit that regenerated the evidence artifact to twelve scenarios — and koine did not learn
  for a week. Re-verified on 2026-09-03 by **running** `coverage.test.ts` (3 passed,
  `KOINE_SCENARIOS.length === 12`, set-equal to `scenarios/*.md`, 0 skipped) and `evidence.test.ts`
  (13 passed, artifact current) at `agora` `main` = `c971fc2`. **All five counts stand**: (i) the
  `e2e-media-transform` re-run, (ii) the Steps 3/5/7/8/9/10 re-run whose encoding must first be
  **extended** past the fold it predates (**DR-7** — the one artefact objection that survives),
  (iii) ADR-0014's four-part clause then Steps 5–7 again, (iv) the §4.2 re-run and (v) the §4.3
  re-run plus ADR-0013's **W3**. **No clause changes, no version moves** — the edit is that bullet
  and this entry.
- **Editorial** (2026-09-03) — **count (iii) was re-run, and it does not close.** Steps 5–7 of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) were walked **by hand**
  against the folded text of §2/§3/§3.1/§5 — not replayed, because `kcs:multi-authority` returns
  `green` over the deltas it predates (**DR-8**). **Steps 6 and 7 flip**; **Step 5 does not**, and it
  breaks on exactly the clause [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)
  decided on 2026-08-26 and deliberately left unwritten: §7.3's deprecated marking has **no carrier**
  in §2 or §3, and §3.1(d)'s de-duplication converse merges a stale and a fresh attribution into one
  entry whose marking is undefined, with §3.1(e) unable to fire. MA-6, MA-8 and MA-9 — the three
  deltas 0.4.9 folded — **all hold** under re-attack; the break is the seam finding, arriving on the
  count ADR-0014 said it would land with. **No version moves and no clause moves**: this entry and
  §3.1's closing paragraph are the whole of the edit. **No count closes** — count (iii) stays open,
  now waiting on ADR-0014's fold rather than on the re-run, and counts (i), (ii), (iv) and (v) are
  untouched and unmoved, so **KCB stays Candidate and is not promotable**. The same walk found one
  delta against KMI (**MA-12**, KMI §7.1(f)'s three answers have no carrier on KCB §4's `fetch`);
  it is recorded there and against §4 in the scenario, and it closes nothing here either.
- **Editorial** (2026-08-26) — **the two 2026-08-26 folds read against each other.** 0.4.9 (the
  federation fold) and 0.5.0 (the capability-versioning fold) landed in this spec on the same day
  from two tasklists, and a capability advertised across an authority boundary is governed by both.
  Eleven seams were read against the **published** text of each; the record is
  [`../docs/reference/fold-coordination-federation-versioning.md`](../docs/reference/fold-coordination-federation-versioning.md).
  **Ten agree** — including the three the federation fold pre-registered (V-2's shape-registry
  rejection rests on KINP §3.4/MA-7; §4.4c's *refuse for want of a version* and §5's *refuse for want
  of a unit* are stated as one rule applied twice; §2.4 reads §3.1(d) rather than editing it, and
  **`version` stayed in the de-duplication key**, the named near-miss). **One does not**, and it is
  recorded as [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) rather than
  folded into either version: §7.3a/d's **deprecated marking and removal version have no carrier** in
  §2 or §3 — MA-8's class, unreached by that fold — and §3.1(d)'s converse keys on
  `(provider KINP id, (name, version), schema_id)`, none of which a marking moves, so two attributions
  that disagree about a deprecation MUST come back as one entry whose marking is undefined and
  §3.1(e) cannot fire. §7.3g is what makes it bite. **No version moves and no count closes**: the
  clause spans both folds' sections and lands with counts (ii) and (iii), which already exercise them.
  This entry also records one **correction** found by that read — §3.1's closing paragraph said *"the
  three other counts"* and enumerated three; §4.3's count had landed at 0.4.8 from a third tasklist
  between that paragraph's planning and its writing, so it now names four. The status note was
  already right; no clause, no version and no count moves for the correction.
- **0.5.0** (2026-08-26) — **The capability-versioning fold.** Folds the deltas of this spec's second
  re-ratification count — the §7.5 break-test
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md), which drove
  a capability through a full release cycle under a live subscriber and returned **V-1…V-8**,
  blocking **V-2/V-4/V-5/V-7**. §7's *model* was never in question; its **perimeter** was, and this
  release repairs it additively. Seven fold, one closes:
  - **V-2** (blocking) → **§2.1** gains an OPTIONAL knowledge-port `payload_schema_id`, and **§7.1**
    gains the rule that matters more: a knowledge port declaring a bare `shape` and no payload digest
    establishes **routing** identity and not **payload** identity, and a consumer MUST read it as
    §7.1's own *no cross-check available* — a silent break becomes a **declared absence**. The
    scenario's alternative, a **shape registry**, is **rejected on the record**: it would mint a
    commons two authority domains must agree on before exchanging a knowledge port, against KINP
    §3.4's *one deliberately non-federated commons* and ADR-0007's self-describing participant.
  - **V-4** (blocking) → new **§2.4**: an OPTIONAL per-entry transport `binding`, so the dual-serving
    window §7.2 *mandates* can actually be operated on a flat, name-keyed MCP tool namespace. Two
    namespaces, only one governed: the capability **name** stays version-free (§7.1 unchanged,
    because the registry matches names), while the transport id is a local address nobody discovers
    by. Read from the manifest, **never guessed**; not shape, not identity, and not part of §3.1(d)'s
    de-duplication key. §6 gains the role-facing statement of the same mapping.
  - **V-5** (blocking) → new **§4.4a–c** with **§5**: an OPTIONAL `version` operand on `invoke`; the
    granted major made **readable inside the token** while the grant's `invoke:<capability>` name
    stays unchanged (so §5's anti-fragmentation argument is untouched); and a resolution rule stated
    exhaustively — operand, else grant, else **refuse for want of a version**, never a default, with
    *highest published* forbidden **by name** because it inverts fail-closed into fail-open. This is
    the shape 0.4.9 gave `budget_units` crossing an authority boundary (MA-6), reused deliberately:
    under ADR-0001 there is no hub to arbitrate which major was meant.
  - **V-7** (blocking) → new **§7.3g**: three named frames — `successor_published`, `deprecated`,
    `removal` — each emitted **before** the fact it announces, on **§4.2d's existing** in-band control
    channel, which already required that a V-7 fold ride it rather than mint a second. §7.2's *a
    subscriber never learns of a break by failing* was pull-side and its most durable binding never
    pulls; this is the streaming half. The binding forms the channel cannot reach — a cached discovery
    binding, and a grant, which does not expire — are **stated** rather than implied closed (DEFER-D).
  - **V-3** → **§7.1 step 5**: the digest prefix MAY carry a canonicalization **rule id**
    (`sha256/<rule>-…`), extending step 4's *a future algorithm is a new prefix* from the hash to the
    **key-set rule**. Absent means **`kcb1`** (0.4.x); this version states **`kcb2`** (`kcb1` plus
    `payload_schema_id`); a port declaring no `payload_schema_id` canonicalizes byte-identically under
    both and MUST NOT be re-prefixed, so **no published digest moves**. An unknown rule id reads as
    *no cross-check available*, never as a mutation. Folding V-2 without this would have fired V-3 on
    publication day, since V-2 grows §2.1's vocabulary.
  - **V-6** → **§7.3c**, split by axis: a retiring **capability major** — an axis its own retiring
    party publishes at will — waits for the successor's **next major**, one full breaking-change cycle
    of dual service; a surface whose axis is a **koine spec version** keeps the original one-full-minor
    floor, which is where it was argued and is correct. The remaining mid-window surfaces (§2.3, KMI
    §4.4) are both of the second kind, so **no declared removal version moves**. `deprecated_at` is
    DEFER-E.
  - **V-1** → **§4.4d** with **§5**: an OPTIONAL `quoted_cost` operand and a refusal that names
    **quote mismatch**. The refusal was already correct and fails closed; what it could not do was
    distinguish *the caller accepted the new price* from *the caller is budgeting against a stale one*.
    No price lock, no quote token, no expiry — the then-published cost still governs.
  - **V-8** → **closed, not folded.** KCS §7 open question 1 already cites it by name as evidence that
    its escape hatch works. No KCB clause, no KCS version.
  **Minor, not patch.** Every field is optional on read and on write, no field or verb is removed, no
  plane, port kind or authority role is added, and a participant implementing none of this stays
  conformant — but seven folds are **new normative surface a reader implements against**, and §7.2's
  own compatibility table gains a reader's obligation. That is a minor by §7.2's terms.
  **And 0.5.0 discharges an obligation already declared:** under §7.3f, publishing this version **is**
  the removal of §2.2's standalone `/.well-known/kcb-manifest.json` — declared at 0.3.0, dated at
  0.4.0, and now due. A registry is no longer obliged to crawl it and a provider MUST NOT rely on it
  being read; nothing already published is invalidated (§7.4). §2.3's separate window — the legacy
  extension-URI root — is **untouched** and still runs to **KCB 0.6.0**.
  **Bounded on purpose:** no shape registry (rejected, with its re-open trigger); no token format,
  issuance or rotation (§5's boundary, unmoved); no version-negotiation protocol — a refusal is not a
  counter-offer; no re-validation cadence or binding TTL (DEFER-D); no `deprecated_at` (DEFER-E); no
  requirement that a caller pin, that a provider publish a payload digest, or that a provider serve two
  majors at two endpoints. The extent of each fold, and the reasoning for every CLOSE and DEFER, is in
  [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md).
  **Status: stays Candidate.** A fold does not close its own gate. Count (ii) becomes a **re-run of
  Steps 3, 5, 7, 8, 9 and 10 against the folded text** — and per **DR-7** that re-run must use an
  **extended** KCS encoding, since the current one deliberately does not assert an unfolded delta; the
  assertion set it needs is written out in that scenario's *Conformance case*. The other four counts
  are restated and none moves. **No schema twin changes** — koine ships no machine-readable twin of the
  KCB card extension, and `participant-self-description.schema.json` references the manifest by pointer
  without restating a `params` field (ADR-0007 decision 7). **No registry file changes** — the one route
  that would have touched [`../registry/`](../registry/) is the rejected shape registry.

- **0.4.9** (2026-08-26) — **The federation fold, control-plane half.** Folds the three deltas
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) — the ADR-0012
  cross-authority break test §3.1 names as this spec's third count — recorded against KCB.
  **MA-6** (blocking, **§5** + an optional `auth.accepted_issuers[]` in **§2**): discovery federated
  and authorization did not, so §3.1 returned addresses whose calls nobody could authorize across a
  domain edge. A grant now names its **issuing host** by KINP id, a provider states which issuers it
  honours, an unrecognized issuer **fails closed**, and a `budget_units` ceiling crossing a boundary
  either denominates in a stated unit or the `invoke` is refused for want of one. KMI §7.1(b)(e)'s
  `fetch:asset` leg inherits all of it by citing §5, as it already does — no separate clause.
  **MA-8** (**§3** + pointers from **§3.1(c)(e)(f)**): three of §3.1's six clauses were asserted with
  nothing to carry them, so the `find` response gains a shape — per-entry `served_by` (the serving
  registry's KINP id, the peer's for a peered entry) with a resolvable address and `observed_at`,
  plus a result-level `incomplete[]` naming unreachable peers. Mechanization of clauses already
  normative, deliberately **not** a ranking or trust weighting over `served_by`, which §3.1(d)
  refuses. **MA-9** (**§3.1(b)** and **§3.1(d)**): a forwarded `find` carries a **query id and a
  remaining hop count** and a registry drops a query it has seen — the horizon peering had none of;
  and (d) gains its **converse**, that entries resolving to the same provider KINP id,
  `(name, version)` and `schema_id` are **one** capability with multiple attributions, never two.
  **Patch, not minor:** the single manifest field added is optional on read and write, the §3
  response shape is emitted only by a federating deployment and a single-registry deployment behaves
  exactly as at 0.4.8, no verb, plane, or port kind is added, §7.1's `schema_id` canonicalization and
  §7.2's subscriber-compatibility table are undisturbed so no live subscriber breaks, and
  **0.5.0 stays spoken for** by §7.3's removal of §2.2's standalone manifest — the same minor
  V-1…V-8 occupy, which this fold deliberately does not consume.
  **Bounded on purpose:** no token format, issuance, rotation, trust-federation or issuer-discovery
  protocol (§5's own boundary, unmoved); no peering topology and no federation membership protocol
  (§3.1(b) bounds a *query*, not a topology). The extent of each fold is reasoned in
  [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md),
  which also fixes the constraints this fold owes the sibling capability-versioning fold.
  **Status: stays Candidate.** New normative text re-enters validation and a fold does not close its
  own gate: the §3.1 count becomes a **re-run of Steps 5–7 against the folded text**, and the
  media-transform, §7.5, §4.2 and §4.3 counts are restated and none moves. No schema twin changes —
  `participant-self-description.schema.json` references the manifest by pointer and restates no
  `params` field ([ADR-0007](../decisions/ADR-0007-self-describing-participant.md) decision 7).

- **0.4.8** (2026-08-26) — **Candidate.** **Normative §4.3 — autonomy posture across an ownership
  boundary**, applying [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md), which
  takes up the **G5** carve-out
  [ADR-0011](../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md) §4 left open and
  decides the half that crosses an organizational boundary. Forced by the pressure leg
  [`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md), which returned
  **AP-1…AP-8**, blocking **AP-5**. The structural finding: a posture gates **spend** and
  **irreversibility**; §5 expresses spend exactly, and *no field on any capability or port in any of
  the six specs said what an invocation does that its caller cannot undo* — so a cross-owner posture
  was not weak but **inapplicable** (**AP-1**). What §4.3 fixes, clause by clause: a capability/port MAY
  declare an **`effect`** class — `reversibility` × `visibility` — outside the `schema_id` digest as
  `cost` and `volume` are, absent reading *unknown* and never *harmless*, and `fetch` deliberately
  getting none because KMI §7.1 already gates it fail-closed in the right domain (**AP-1**); a posture
  is a **set of admitted classes**, named by what it guarantees, with **no rung names adopted** and
  **no total order defined** — a product ladder is a projection with its lossy edges named, ADR-0010's
  discipline (**AP-2**, **AP-4**); posture is **monotone-restrictive**, so the effective posture is the
  **intersection** and *the restriction always wins* — no arbitration, no trust, no host on the path
  (the **BP-5** fact), and every gate stays unilateral so ADR-0011's **T3 does not fire** (**AP-3**); a
  **floor** no posture may skip — KGP §7, §5, KFT §4/§8.1 fire identically at every posture, an
  unadmitted effect is a refusal and never a silent proceed *or substitution*, an undeclared class is
  not admitted (**AP-8**); a declared class **covers the leg, not the callee's own code**, and a
  re-dispatch MUST NOT present a posture wider than the one it was invoked under — the chain rule that
  keeps §4.3c from being a one-hop rule, modelled on §5's spend ceiling (**AP-5**); KCB states the
  **minimum a posture refusal carries** in its own terms and cites KFT §8.1 as the profile's richer
  form rather than discharging onto it (**AP-6**); and the section says plainly **what a declaration is
  worth across a boundary** — silence costs the declarant, a misdeclaration is a breach of a signed,
  KCS-assertable term, and the grant binds where the posture is read (**AP-7**). §4.3g is a NORMATIVE
  conformance requirement: the section names **no person and requires no console**, and a refused
  dispatch is not parked or resumable — a widened re-dispatch is a new invocation, which is why no verb
  or state is added. *Classification:* **patch** — every field optional on read and on write, a dispatch
  declaring no posture behaves exactly as it did at 0.4.7, no verb / plane / port kind / media type /
  authority role is added, §7.2's compatibility table is undisturbed so no live subscriber breaks, and
  **0.5.0 remains spoken for** by §7.3's removal of §2.2's standalone manifest. Status: new normative
  text, so a **fifth** count on Candidate — a re-run of that leg against the folded text — gating §4.3
  alone; the four existing counts are restated and none moves. ADR-0013's retained
  second-independent-implementation condition (**W3**) additionally gates §4.3's ratification. **§8
  still holds no open questions:** this fold answers an ADR, not a parked question.

- **Editorial** (2026-08-26) — Recorded the **downstream results** of the gating scenarios in
  *Pressure test*, and this spec is where reading them wrong costs the most. Three of the four
  gating scenarios' KCS encodings were run over real MCP/A2A links on 2026-08-24 and all three came
  back `green`; **no count moves**. The reason is stated normatively for the reader rather than left
  to inference: `green` means every encoded step and assertion passed with no transport failure, and
  two of the three are passes koine records as *not clean* — `kcs:live-schema-mutation` over four
  open blocking deltas (V-2/V-4/V-5/V-7) and `kcs:multi-authority` over six (MA-6 among them) —
  because **an encoding deliberately does not assert a delta that has not been folded** (findings
  **DR-7**, **DR-8**). Positive evidence is delta **F**'s cross-plane path planning, delta **K**'s
  spend ceiling on projected and actual spend, **L**'s dangling-reference tolerance and **G**'s
  `fetch` grant refusal, all under machine replay against real peers. Separately, **DR-12** records
  that the fourth count's scenario,
  [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md), has **no
  KCS encoding at all** — it is koine's eleventh against a downstream set of nine — so every clause
  of §4.2 lacks a machine-replayable document citing it and a clean re-run of that leg would be
  necessary but not sufficient under [the ratification gate](README.md#the-ratification-gate). That
  encoding is downstream work under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned**; it qualifies the
  fourth count rather than adding a fifth. **No clause changes and the status does not move** — KCB
  stays **Candidate** on all four counts.
- **0.4.7** (2026-08-26) — **Candidate.** **§8's last open question (subscription backpressure) is
  resolved and promoted to a normative §4.2**, after the focused pressure leg
  [`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) attacked
  it and returned six deltas **BP-1…BP-6**, blocking **BP-5** and **BP-3**. The leg's structural
  finding is what forced the fold: §8.1 parked flow control on *"the host's cost advisor"*, but §3
  and [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) keep the host **off the stream
  path**, its grant / revocation / ranking / facade instruments all fail to reach a running
  subscription, and under §3.1 federation no single host has jurisdiction over both ends — so the
  assignment was **void, not deferred**, and no downstream infra work could discharge it. What §4.2
  fixes, clause by clause: a port MAY declare its **`volume`** envelope, outside the `schema_id`
  digest as `cost` is, so a firehose is distinguishable from a trickle *before* binding and an absent
  declaration reads *unknown*, never *low* (**BP-1**); `subscribe` gains optional `max_rate` /
  `max_in_flight` / `window` / `on_overflow` operands under the normative rule that what the contract
  governs is **whether an adaptation is lossless**, not how fast — coalescing and deferral are
  lossless for KGP payloads by construction, `drop` is lossy and must be named, and **a retraction is
  never shed** (**BP-3**); an optional content-addressed **`resume`** operand — not a new verb — that
  a producer MUST answer resumed / `gap-unavailable` / `resume-unsupported` and never with silence,
  making a gap **detectable** where content-addressed merge left no trace of one (**BP-3**); a
  metered subscription whose ceiling decrements on delivery and MUST signal **before** it stops, so a
  cliff becomes a brake (**BP-2**); a `volume.references` operand and the rule that the fan-out is the
  *subscriber's* traffic, bounded by its own declared rate and refusable by the CAS holder onto delta
  L's existing pending-fetch tolerance (**BP-4**); and **one** in-band control channel in both
  directions, which is also the push channel **V-7** asked for — V-7's fold MUST ride it rather than
  mint a second. §4.2g fixes the boundary: this is shape, not a QoS contract. **BP-6** is evidence for
  a KCS open question and changes nothing here. *Classification:* **patch** — every field is optional
  on read and on write, a subscription that declares nothing behaves exactly as it did at 0.4.6, no
  verb / plane / port kind / media type is added, §7.2's compatibility table is not disturbed so no
  live subscriber anywhere is broken, and **0.5.0 remains spoken for** by §7.3's removal of §2.2's
  standalone manifest, which §7.3c forbids folding into an unrelated publication. Status: new
  normative text, so it adds a **fourth** count to Candidate — a re-run of the firehose leg against
  the folded text — gating §4.2 alone. The three existing counts are restated and none moves.
  **§8 now holds no open questions.**
- **Editorial** (2026-08-24) — The cross-authority break test §3.1 names as this spec's **third**
  re-ratification count has **landed and been run**:
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), which composes two
  independently built authority domains into one fabric and peers their registries. It did **not**
  pass clean. What held: §3.1(b)'s *forward the query, return an address* rule survived a peer
  reachable only from inside its own domain and produced an honest *unreachable* rather than a
  silent proxy; §3's version/deprecation ranking applied to the merged set unchanged; §3.1(d)
  returned both authorities' same-named capability without reconciling them. What broke: **MA-6**
  (blocking) — discovery federates and **authorization does not**, since §5 issues grants from one
  host and no clause says whose token a provider honors across a domain edge, whether a grant
  crosses one, or whether `budget_units` denominates the same quantity in two governance domains;
  **MA-8** — §3.1(c)'s attribution, (e)'s observation time and (f)'s report-an-unreachable-peer have
  **no carrier** in §3's `find` response; **MA-9** — a forwarded `find` carries no query id, hop
  limit or visited set, and (d)'s never-silently-reconcile rule has no converse for one participant
  crawled by two registries. All three are additive and fold into the **0.5.0** minor §7.3 already
  schedules. **No clause changes and the status does not move** — KCB stays **Candidate** on all
  three counts; the other two (the [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md)
  re-run against the §2 AgentCard extension, and the §7.5 deltas V-2/V-4/V-5/V-7 from
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)) are
  untouched by that pass and neither moves.
- **0.4.6** (2026-08-24) — **Candidate.** Applied
  [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) to discovery: **§8 open question 1
  (registry federation) is resolved and promoted to a normative §3.1**, so the single
  host-provisioned registry of §3 generalizes to **peering registries**. What §3.1 fixes: peering
  resolves *queries* and returns *addresses*, never traffic — the consumer still dials the provider
  directly, so ADR-0001's route-by-lookup-not-proxy stance is preserved rather than reinterpreted;
  every peered entry is attributable to the peer that served it, by KINP id and a resolvable
  address, because a consumer that cannot see the authority boundary cannot choose across it; §3's
  version/deprecation ranking applies to the merged set unchanged and two authorities naming the
  same capability are **both** returned rather than silently reconciled; and an unreachable peer
  narrows discovery but invalidates no manifest, grant, pin, or live subscription — the ADR's
  *an authority is a role, not a hard dependency* stated at this surface. *Classification:*
  **patch** — the fold is additive (no field added to or removed from the manifest, no verb
  changed, nothing narrowed), a single-registry deployment conformant at 0.4.5 is conformant
  unchanged, and **0.5.0 is spoken for** by §7.3's removal of §2.2's standalone manifest location,
  which §7.3c forbids folding into an unrelated publication. Status: this is new normative text, so
  it adds a **third** count to Candidate — the cross-authority break test in
  [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), the same
  test KINP 0.3.0 names — gating §3.1 alone. The two existing re-ratification legs are restated and
  neither moves.
- **0.4.5** (2026-08-18) — **Candidate.** **§1.2**'s closing bullet — *no KCB clause implements G2
  deliberation, G3 voting, or G4 dissent preservation* — now points at
  [`../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md`](../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md),
  which decides all three as **non-goals** for the fabric. *Why the pointer is in the spec at all:*
  0.4.4 left that bullet stating a **fact**, and a fact of the form "koine does not do X" is read as
  an omission until something says it is a choice — the reader who asks *"omission or decision?"* asks
  it here, so the answer belongs here. *What the ADR carries, so this section does not:* the evidence
  (every gate KCB and its sibling specs define is **unilateral** and refusal is always available, so
  there is nothing to aggregate preferences over; a sweep dated 2026-08-18 found **no** standards-body
  specification of deliberation, preference aggregation or dissent to profile — the adopt-by-reference
  option was tried first and came back empty), the **re-open trigger** (participants under different
  KINP §3.4 minting authorities needing one binding joint decision, or a standard appearing), and the
  explicit carve-out that G1 / G5 / G6 stay measured *Partial* with findings **GOV-1…GOV-3** open —
  "governance is not koine's axis" is **not** licence to dismiss those. *Classification:* **patch** —
  §1.2 is informative, the addition is a cross-reference, no field is added or removed, nothing is
  narrowed, and a manifest conformant at 0.4.4 is conformant unchanged. Both re-ratification legs are
  restated and neither moves; **0.5.0 remains spoken for** by §7.3's removal of §2.2's standalone
  manifest location.
- **0.4.4** (2026-08-18) — **Candidate.** Added **§1.2**, INFORMATIVE: the layer claim KCB has always
  made — *a convention over MCP/A2A, not a new runtime* — plus the first **external, independent**
  corroboration of its shape, Kang & Diponegoro, *Governance Gaps in Agent Interoperability
  Protocols*, **arXiv:2606.31498**, **30 June 2026**. *Why it is in the spec and not only in
  [`../docs/reference/positioning.md`](../docs/reference/positioning.md):* KCB is the spec that asserts
  the position, so the evidence for it belongs where the assertion is; the positioning document
  points here. *What the citation is careful about, in three parts.* **(i) Scope.** The paper analyses
  **five** protocols (MCP v1.1, A2A v1.0.1, ACP, ANP, ERC-8004) against a **six-dimension governance
  taxonomy** (membership, deliberation, voting, dissent preservation, human escalation, audit/replay),
  classified *Supported/Partial/Absent* on what a specification **encodes** — the authors' own stated
  limitation, restated in §1.2 so a reader does not take the matrix for a claim about what is
  buildable. **(ii) Non-overlap, in both directions.** The paper's axis is collective decision-making;
  KCB's is interchange semantics — license class, egress class, trust tier, budget ceiling, capability
  grant. No dimension of one is a dimension of the other, so the paper is **validation of the layer
  claim and prior art over nothing** — it retires no clause and establishes priority over none — and,
  read the other way, **koine is not an answer to the paper**: no KCB clause implements deliberation,
  voting, or dissent preservation, and §1.2 says so rather than letting the citation imply it.
  **(iii) Pin discipline.** Cited by **arXiv id and submission date**, never by title alone, per
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) — and deliberately
  **not** a row in that table: it is a taxonomy, not a specification, no KCB clause delegates to it,
  and a prior-art citation is not a pin. *Classification:* **patch** — §1.2 is informative, adds no
  field, removes none, and narrows nothing; a manifest conformant at 0.4.3 is conformant unchanged.
  Both re-ratification legs are restated and neither moves. (**0.5.0 remains spoken for** by §7.3's
  removal of §2.2's standalone manifest, so an informative addition could not have taken the minor in
  any case.)

- **Editorial** (2026-08-13) — Fixed the **direction of authority** on §1.1's pin table. It read
  *"the pin of record is this table"*, which conflicted with KMI §4.1, KFT §3.2 and §4.1.1, and
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) itself, all of which treat that
  file as the record — leaving two documents each claiming to be the one place a pin could be wrong.
  §1.1 now states that the file wins and that §1.1 is a standalone-readability restatement, with the
  reason the direction is the reverse of a spec's own version/status mirrors: an upstream revision is
  a shared fact across specs, so it is recorded once where a single drift sweep can check it, whereas
  a spec's own version is a property of that spec and its header wins. **No pin value changed** —
  A2A **v1.0** and MCP **revision 2026-07-28** are the same two rows — and **no clause changed**: §2
  and its extension entry, §2.3's dual-accept window, §3, §4's verbs, §4.1's per-verb wire audit,
  §5's grants and §7's versioning surface are byte-unchanged, so a manifest conformant at 0.4.3 is
  conformant unchanged. Stays **0.4.3 Candidate** on the same two restated gates.
- **0.4.3** (2026-08-13) — **Candidate.** Pinned the **MCP revision** KCB maps onto — **2026-07-28**
  — in the **§1.1** table beside the A2A pin, and added **§4.1**, a per-clause audit of which MCP
  wire each verb assumes. *Why a pin was required here and not merely tidy:* that revision is a
  **breaking change**. It replaced a session-oriented wire with a **stateless core** — no
  `initialize` handshake, no session id, per-request context in a per-request **`_meta`** — and made
  **`server/discover`** the mandatory way a server describes itself, in place of what the handshake
  used to return. The two wires are not interchangeable, so "over MCP" without a revision is not an
  implementable instruction. *What §4.1 settles:* **no KCB clause requires the handshake or a session
  id**, and each is now said so explicitly rather than left to inference — `params.mcp` is an address,
  the §3 crawl and §4 `describe`/`invoke` are request/response (a grant and a capability version
  travel per call, which is what `_meta` is for), and `fetch` is not an MCP call at all. The single
  session-shaped clause is §4 **`subscribe`**: a stateless core has no client-scoped channel a server
  can push to, so under the pinned revision a subscription stream is delivered over **A2A streaming**,
  and "MCP notifications" is named for what it is — the **pre-2026-07-28** wire, still permitted to a
  participant on it, never assumable by a consumer. That split is free because KGP §6 deltas are
  ordering-independent and content-addressed (§4), so no §5 rule, no §7 rule and no KCS assertion
  reads which leg carried the stream. *Scope — what did not move:* **no field is added to or removed
  from any KCB surface.** The manifest is byte-identical — the `capabilities.extensions[]` entry, its
  `uri` (§2.3) and every `params` field; no participant is required to declare its MCP revision,
  because the revision is a property of the endpoint `params.mcp` already names, and where a run needs
  it recorded that is a scenario's job (KCS §4, informative). The verbs, the grant model, §7's
  versioning surface, and every pre-existing MUST/SHOULD are unchanged. *Classification:* **patch** —
  a clause that was silent is now explicit, and a transport disjunction §4 already offered is
  attributed to the wire each half needs; a manifest that conformed at 0.4.2 conforms unchanged at
  0.4.3, and an implementation on the pinned revision was always the intended reader. (Independently:
  **0.5.0 is spoken for** — §7.3 declared §2.2's standalone manifest removed there — so a minor could
  not be spent on this without breaking that promise.) Status stays **Candidate** on the *unchanged*
  pair of gates restated at 0.4.1 and 0.4.2 — the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) and a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **0.4.2** (2026-08-13) — **Candidate.** Corrected two references that had drifted behind the
  standards KCB rides on, and pinned both in a new **§1.1**. *(i) A2A.* The §2 example AgentCard
  showed the **v0.x** top-level `"url"`; **A2A v1.0** replaced it with **`supported_interfaces[]`**,
  each entry an **`AgentInterface{ url, protocol_binding }`**. The example, the §2 prose that reads
  the A2A endpoint "off the card's own service URL", and §2.2's migration row now all describe the
  v1.0 shape — so koine's canonical illustration of the document its manifest rides inside is no
  longer a major version behind it. *(ii) MCP.* §4's `describe` row named the pre-JSON-RPC-namespacing method for
  listing tools; under the pinned revision the method is **`tools/list`**. The `invoke` row's prose "MCP tool call" is likewise now the method,
  **`tools/call`**. *Scope — what did not move:* the **KCB manifest's own shape is unchanged**. The
  `capabilities.extensions[]` entry, its `uri` (`https://w3id.org/koine/kcb/manifest/0.3`, §2.3), and
  every `params` field — `kcb_version`, `mcp`, `produces`, `consumes`, `capabilities`, `auth`,
  `signing` — are byte-identical; only the *host card* around it and the *method names* KCB calls
  move. §7's versioning surface, the verbs themselves, the grant model and every MUST/SHOULD are
  untouched. *Classification:* **patch** — nothing is added to or removed from a KCB surface and
  nothing narrows; a manifest that conformed at 0.4.1 conforms unchanged at 0.4.2, and a consumer
  already speaking A2A v1.0 and current MCP was always the intended reader. The corrections make the
  spec match what a conformant implementation must already do. Status stays **Candidate** on the
  *unchanged* pair of gates restated at 0.4.1 — the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) and a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **0.4.1** (2026-08-13) — **Candidate.** Moved the §2 manifest extension URI's namespace **root** to
  a `w3id.org` permanent identifier — `https://koine.dev/kcb/manifest/0.3` →
  `https://w3id.org/koine/kcb/manifest/0.3` — and opened the transition window that retires the
  legacy root (**§2.3**, new). *Reason:* the legacy hostname was **verified unregistered on
  2026-08-11** (DNS held no record; the host would not resolve), so the identifier the fabric names
  itself by was squattable, with no recovery once conformant implementations had shipped the literal;
  registering it ourselves would only have converted the exposure into a renewal that must never
  lapse. Provenance of the w3id entry and the full rationale:
  [ADR-0007](../decisions/ADR-0007-self-describing-participant.md)'s amendment log. *The window:* the
  URI is a **matching key**, so from 0.4.1 up to but not including **KCB 0.6.0** a consumer MUST
  accept **both** roots as identifying the same extension, a producer MUST emit the w3id form (and
  MAY additionally serve a byte-identical legacy mirror entry, §7.3d), discovery marks the legacy
  form deprecated and ranks it below (§7.3d), and at 0.6.0 the obligation — never the readability
  (§7.3f/§7.4) — ends. 0.6.0 rather than 0.5.0 because §7.3c's one-minor minimum would otherwise land
  the removal in the same release as §2.2's, leaving a subscriber that first meets this deprecation
  no version in which to act (§2.3). *Classification:* **patch**, not minor — nothing is removed and
  nothing narrows during the window (the read side *broadens* to two accepted roots, and §7.3c
  forbids declaring and removing in one publication, as KMI 0.3.1 did for `edl+json`); the narrowing
  is the 0.6.0 removal, and that is the minor. The manifest payload shape, the `…/kcb/manifest/0.3`
  path and version segment, the verbs, `signing`, §7's versioning surface, and every other MUST/SHOULD
  are unchanged. In-repo occurrences moved with it (both ADR bodies, docs, `ROADMAP.md`, and
  `schemas/participant-self-description.schema.json` + its fixture, whose `manifest_extension_uri`
  pattern is the twin of the producer clause and so admits the w3id form only); the 0.3.0/0.4.0
  entries below are **not** rewritten — they record the root current when those versions shipped.
  *Downstream, not done here:* implementations pinning the legacy literal migrate under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) — the cross-repo tasklist
  `agora:72-kcb-extension-uri-migration`, which depends on this one and whose **byte-for-byte
  conformance corpus** must be re-emitted and re-hashed rather than string-substituted. Status stays
  **Candidate** on the *unchanged* pair of gates: the 0.3.0 extension-shape re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) **and** a clean §7.5
  mutate-live-schema pass ([`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md),
  still carrying blocking V-2/V-4/V-5/V-7). This release neither adds a gate nor discharges one.

- **Editorial** (2026-08-13) — §7.5's break-test is no longer a forward reference: it names the
  landed scenario [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md)
  and records its outcome (deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7 — §7's model held, its
  perimeter did not), as do the status note and the **Pressure test** §. No normative change: no
  clause, field, canonicalization or version-range rule is touched, and the deltas are **not folded
  here** — they land in a later minor (**0.5.0**), which is also where §7.3 already schedules §2.2's
  removal. Version and status are unchanged: **0.4.0, Candidate**, still on both gates.

- **0.4.0** (2026-08-13) — **Candidate.** Encoded the capability-versioning decision
  ([ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md)): the old §7 open question
  2 is now the normative **§7**. A capability is `(name, semver version)` and every port carries a
  content-addressed `schema_id` whose canonicalization bytes are fixed here (§7.1); the
  subscriber-compatibility table, the ignore-unknown-fields obligation, the digest-without-a-bump
  defect, and successor-never-mutate-in-place are normative (§7.2); the deprecation policy — a
  removal version declared *at* deprecation, measured in versions rather than dates, at least one
  minor out, dual-served, moveable later but never earlier, ending obligation but never readability
  — is stated once for every retiring surface (§7.3); and an archival pin is distinguished from a
  live binding (§7.4). Wired through §2 (`version`/`schema_id` in the extension example and its
  optional-on-read rule), §2.1 (`schema_id` on ports), §3 (name + version-range matching;
  highest-satisfying-version first and deprecated ranked below), and §5 (a grant binds to
  `(capability, major)`; a `cost` change is a minor that fails closed at the ceiling). §2.2's
  standalone `/.well-known/kcb-manifest.json` gains the removal version its condition-bounded window
  lacked — **KCB 0.5.0**. Open questions renumbered into §8. **Additive** per ADR-0009 decision 8:
  fields added, none removed, nothing narrowed, extension URI unchanged at
  `…/kcb/manifest/0.3` (that fold moved no URI; the namespace *root* moves later — §2),
  `signing` shape-identical, no delta F/G/J/K/L reopened, and
  0.3.0 cards and already-issued grants still valid — hence a minor bump. Status stays **Candidate**,
  now gated on the 0.3.0 extension re-run **and** the §7.5 mutate-live-schema break-test
  (`chief/56-live-schema-mutation-scenario`).

- **Editorial** (2026-07-31) — Agnostic reframe, part 2: the §2 card identity uses the KINP §3.4
  illustrative placeholder namespaces; registry hosting, grant issuance, auth infra, and the §7
  open questions (§8 as of 0.4.0) name the **host** role rather than a named product. No normative change — the
  manifest shape, extension URI, verbs, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.3.0** (2026-07-22) — **Candidate.** Redefined the §2 manifest as a named A2A **AgentCard
  extension** (`capabilities.extensions[]`, uri `…/kcb/manifest/0.3`, under the namespace root
  current at the time — the root has since moved, §2) instead of a
  standalone document. Collapsed the two well-known files into one: the KCB payload now rides on the
  peer's existing `/.well-known/agent-card.json`, so there is no separate
  `/.well-known/kcb-manifest.json`. Dropped the duplicated top-level `identity`/`endpoints` (now read
  off the card); moved `produces`/`consumes`/`capabilities`/`auth`/`signing` into the extension's
  `params` with all deltas F/J/K preserved. Added a field-by-field migration note (§2.2). Status
  dropped Ratified→Candidate pending re-validation of the extension shape against
  `scenarios/e2e-media-transform.md`.
- **0.2.0** (2026-07-17) — **Ratified.** Folded pressure-test deltas: F (cross-plane ports),
  G (`fetch` verb + `fetch:asset` grant), J (`world_pattern` on media ports), K (spend ceilings
  and cost-aware path search), L (dangling-reference tolerance).
- **0.1.0** (2026-07-17) — Initial candidate draft.
