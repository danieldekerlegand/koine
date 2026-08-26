# Fold coordination — the federation fold read against the capability-versioning fold

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

**This document binds no clause.** It is the record of one cross-read, not a contract: where a
finding and a spec disagree the spec wins and the finding is the thing to re-check. It exists
because two folds landed in [`../../specs/capability-bus.md`](../../specs/capability-bus.md) on the
same day, from two tasklists, against two different pressure tests — and **a capability advertised
across an authority boundary is governed by both**:

| Fold | Version | Tasklist | Pressure test | Deltas |
|---|---|---|---|---|
| **Federation** (the control-plane half) | KCB **0.4.9** | [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json) | [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) | MA-6 (blocking), MA-8, MA-9 |
| **Capability versioning** | KCB **0.5.0** | [`86`](../../tasks/chief/86-fold-the-capability-versioning-breaks.json) | [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) | V-1…V-8, four blocking |

The two folds' own reasoning is in
[`federation-fold-dispositions.md`](federation-fold-dispositions.md) and
[`capability-versioning-fold-dispositions.md`](capability-versioning-fold-dispositions.md). This page
does not repeat either. It asks one question of the published text: **does a reader of both specify
the same behaviour?**

---

## 0. The rule this read applies

Stated first, because it decides what happens to what is found:

> **A contradiction between two folds is a design finding about the fabric, not a tidy-up.** Burying
> it in whichever fold merged second is how it becomes invisible — the second fold's changelog is the
> last place anyone looks for a defect in the first fold's clause. So a conflict is raised as an
> **ADR**, and the clause change lands with whichever re-ratification count already exercises it.

The federation fold pre-registered the same rule from its side, and pre-registered three constraints
and one near-miss for this read to verify rather than inherit. All four are checked in §2.

---

## 1. Method

Eleven seams were enumerated — every place where a 0.4.9 clause and a 0.5.0 clause govern the same
object — and each was read **against the published text of both**, not against either fold's
intent. A seam passes only if a reader implementing both clauses has exactly one behaviour available
to them; "the two do not obviously conflict" is not a pass, because the failure mode this read exists
to catch is two conformant-looking implementations that disagree at runtime, far from the cause
([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) leaves no hub to reconcile them).

**Ten pass. One does not**, and it is recorded as [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md).

---

## 2. The seams

### 2.1 The four the federation fold pre-registered

| # | Seam | Verdict | Evidence in the published text |
|---|---|---|---|
| **S1** | **V-2's rejected shape registry** vs **MA-7**'s *one non-federated commons* | **Agree** | §7.1's *Deliberately not done* paragraph rejects the shape registry **on the record**, citing KINP §3.4 (the prefix registry is the fabric's one deliberately non-federated commons) and [ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md). A versioning fold decided its own extent on a federation argument, which is the strongest form of agreement available. |
| **S2** | **V-5's refuse-for-want-of-a-version** vs **MA-6's** refuse-for-want-of-a-unit | **Agree, and stated as one rule** | §4.4c's second bounding rule says so explicitly: *"the same instrument §5 already uses for a `budget_units` ceiling whose unit is unstated across an authority boundary (MA-6) … one rule applied twice, not two conventions."* Both fail closed, both name what is missing, neither guesses. |
| **S3** | **V-4's `binding`** vs **MA-9's de-duplication converse** | **Agree** | §3.1(d)'s converse keys on provider **KINP id**, `(name, version)` and `schema_id`. §2.4 states the reading rather than leaving it to be derived: *"a `binding` is none of those three, so a per-major address neither merges two entries nor splits one."* **`version` stayed in the key** — the federation fold's named near-miss, checked and clear (§2.3 below). |
| **S4** | **V-7's frames** vs **§3.1**'s federated topology | **Agree** | §7.3g rides §4.2d's existing channel and inherits its property verbatim: *"the binding — and therefore its channel — runs directly between the two peers, and no party with jurisdiction over both ends was ever required."* A frame crosses an authority boundary because the **stream** does, and the registry is not on that path (ADR-0001). |

### 2.2 The seven this read added

| # | Seam | Verdict | Evidence |
|---|---|---|---|
| **S5** | **§4.4b's unreadable granted major** across an authority boundary | **Agree — the two folds close it together** | §4.4b says a grant whose major the provider cannot read is *"a grant with no readable major"*. Across a boundary that case is already gated by §5/MA-6: an issuer a provider has not stated in `auth.accepted_issuers[]` is **not authorization at all** and fails closed before any version question arises. Accepting an issuer is accepting its token shape; the residual case is intra-domain and resolves under §4.4c. |
| **S6** | **§4.4c case 4** (one published major answers a version-free call) vs a **foreign** grant | **Agree** | §5's rule is unconditional — *"a resolved major outside the granted major is refused at the gate"* — and applies to all four cases of §4.4c, so case 4 is not an exemption. Combined with S5, a cross-domain call reaches case 4 only through an accepted issuer. |
| **S7** | **§7.1 step 5's `kcb2` rule id** vs two authority domains on different release cadences | **Agree, and federation is why it was needed** | Independent domains upgrade independently, so *"a provider and a consumer one minor apart"* is the **normal** cross-domain state rather than a transient. V-3's rule id makes that state read *incomparable*, never *mutated* (§7.2). Note the rule id is a **literal stated in the spec** (`kcb1`, `kcb2`), not a registered token — which is what keeps it consistent with MA-7: it mints no commons. |
| **S8** | **§2.4's `binding`** vs **§3.1(e)**'s staleness | **Agree** | A binding change is a **minor bump** (§2.4, and §7.2's table now carries the row), so the `version` moves and §3.1(d)'s key separates the stale attribution from the fresh one. Two attributions at one `version` with different bindings can only be provider non-conformance, and §3.1(e) sends the consumer to the provider's card. **This is the mechanism the finding in §3 turns out to lack.** |
| **S9** | **§7.3g's `removal` frame** vs **§3.1(f)**'s *an unreachable peer invalidates nothing* | **Agree** | (f) forbids the **registry** invalidating a live `subscribe`; §7.3g has the **producer** ending one it is party to, after a frame that precedes the fact. Different actor, different cause, no overlap. |
| **S10** | **§5's `auth.accepted_issuers[]`** (MA-6) vs **§7.1's digest** and **§7.2's table** | **Agree** | `auth` is not a port, so it is nowhere near §7.1's key set; §2 states the field is additive and optional on read *"exactly like `version` and `schema_id`"*; §7.2's table is undisturbed. The federation fold's third pre-registered constraint, checked. |
| **S11** | **`effect`** (§4.3a, 0.4.8) vs **V-1's** digest reasoning | **Agree** | The federation fold warned that V-1's fold must not pull `effect` into the digest. §4.4d keeps `cost` outside and §7.1 step 1 names `cost`, `volume` **and** `effect` in one breath as dropped-before-hashing. Price, rate and reversibility are not shape; all three are outside, by one reason. |

### 2.3 The named near-miss, checked

The federation fold recorded one specific way this fold could have silently undone it:

> **Do not drop `version` from the key.** §3.1(d)'s converse keys on `(provider KINP id, (name,
> version), schema_id)`, and simplifying it to `(provider, name, schema_id)` — plausible, since a
> differing `schema_id` already separates most pairs — would collapse two majors into one entry with
> "multiple attributions" and silently undo **V-4** at the discovery layer.

**Checked and clear.** §3.1(d)'s converse is byte-unchanged at 0.5.0, `version` is in the key, and
§2.4 reads §3.1(d) rather than editing it. Two majors of one name stay two entries.

---

## 3. The one finding — and it is an ADR, not a patch

**A deprecation marking has no carrier, and §3.1(d)'s converse makes that decisive.**

Neither fold specifies behaviour the other forbids, so this is not a contradiction — it is a **gap at
the seam**, owned by neither fold and reachable only by reading both. Three steps:

1. **No carrier.** §7.3a requires *"an explicit deprecated marking on the predecessor"* and a
   **removal version**; §3 and §7.3d require discovery to keep returning that entry *"marked, and
   carrying its removal version"*. No field in §2's manifest and none in §3's `find` response is named
   for either. It is exactly the class **MA-8** folded for §3.1's own clauses — *a clause asserted with
   no carrier* — and the fold did not reach §7.3.
2. **The merge key excludes it.** A marking is not shape (§7.1 step 1 drops it, so the digest holds),
   it does not move `version` (the predecessor is marked *in place*, and §7.2's table has **no bump
   row** for marking something deprecated), and it is not the provider id. So a stale attribution and a
   fresh one satisfy §3.1(d)'s converse **exactly** and MUST come back as one entry whose marking is
   undefined — where **S8** was rescued by the minor bump `binding` gets, this has no bump to be
   rescued by.
3. **§3.1(e) cannot fire.** It tells a consumer to resolve *"any disagreement"* against the provider's
   card; (d) has just removed the visible disagreement.

**V-7 is what raises the cost.** §7.3g spends a normative section establishing that for a **discovery
binding** — cached shapes, no stream — the pull side is the *whole* of the contract, and §7.3d's
marking is the mechanism it leans on. `DEFER-E` is deferred on the same uncarried clause, reasoning
that *"a subscriber can already reconstruct the span from what §7.3d returns."*

**And it generalizes**, which is why it is a record rather than a footnote: §3.1(d)'s key is the
digest key plus `version`, so **every** operand deliberately placed outside the digest is outside the
merge key too. Of the five — `cost`, `binding`, `volume`, `effect`, the deprecation marking — only the
first two have a declared bump, and they are rescued by the `version` that bump moves, not by the key.

Recorded as **[ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md)** — *a
federated merge merges attributions, never contents* — which gives the marking a carrier, forbids a
registry synthesizing a value for a field outside the key, and makes the **restriction win** where the
disagreeing field is a gate ([ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s
monotone-restrictive discipline, reused rather than re-invented). **No KCB version moves for it**: the
clause spans both folds' sections, and it lands with counts (ii) and (iii), which already exercise
them. Nothing here is folded into 0.5.0 — that would be the burial §0 forbids.

---

## 4. One correction to the published text

Found by this read and **not** worked around: §3.1's closing paragraph, written by the federation fold
at 0.4.9, said *"the three other counts on this spec"* and enumerated three. KCB had **five** counts by
then — §4.3's cross-owner-posture re-run had landed at 0.4.8, from a third tasklist, between the
federation fold's planning and its landing. The sentence now names four and enumerates four. Editorial:
no clause, no version, no count moves, and the status note was already right.

It is the same failure the federation fold's own amendment log records in its other form — *"the
reserved-minor convention pushes every fold onto the same next patch, and nothing in CI catches two
branches claiming it."* Three folds against one spec in one week is the condition; an enumeration
written from a stale base is the symptom.

---

## 5. The reference implementation, read against the folded clause

*koine specifies and the runtime commons implements* ([ADR-0001](../../decisions/ADR-0001-control-plane-topology.md)),
so a fold the reference implementation already contradicts should be known **before** it ships.
**agora**'s `registry/` and `grants/` were read against the folded text.

**What this read is, exactly.** A read-only inspection of that repository's working tree at commit
`9fe2ee5` (2026-08-25): source read, no build run, no test run, no behaviour observed. Findings are
**reported here, not filed there** — koine holds contracts and grows no dependency on any
implementation, so these are for that repository's own backlog to pick up, and where a finding and
that code disagree the code is the thing to re-check.

| # | Grade | Finding |
|---|---|---|
| **AG-1** | **Blocking, and created by publishing 0.5.0** | The standalone `/.well-known/kcb-manifest.json` is **removed at KCB 0.5.0** (§2.2, §7.3f) and it is still the whole of the crawl path: `registry/src/crawl.ts` builds only that address (`KCB_MANIFEST_PATH`, `manifestUrl`), `grants/src/manifest.ts` publishes a bare manifest body at it *"for the registry crawl that pulls it in"*, and `provider-router-erl/src/apr_redirect_handler.erl` keeps it alive with a 308. Past 0.5.0 a producer MUST NOT emit the retired form and a registry is no longer obliged to crawl it. **The fix is small**: the router already serves the card at `/.well-known/agent-card.json`, so this is a crawl-path change plus retiring the redirect — not a redesign. §7.3f ends the obligation, never the readability, so nothing already published is invalidated. |
| **AG-2** | **Blocking for §7 as a whole** | §7's identity pair is **uncarried**: `schemas/src/manifest.ts`'s `Capability` has no `version`, and `KnowledgePort` / `MediaPort` / `EntityPort` carry no `schema_id`. Both are SHOULD and optional-on-read, so omitting them is *conformant* — but everything 0.4.0–0.5.0 builds on that pair then has nothing to stand on there: §3's highest-satisfying-version ranking, §7.2's silent-mutation detection, §3.1(d)'s de-duplication key, §2.4's per-major `binding`, §4.4c's resolution and §7.1 step 5's rule id. The break-test's premise — two majors of one name served side by side — is **not representable** in that type today. |
| **AG-3** | Should-fix | `grants/src/grant.ts`'s `Grant` is `{verb, scope, budget_units?}`: no **issuing host** (§5, MA-6), no **granted major** (§4.4b, V-5), no **ceiling unit** (§5, MA-6). The behaviour that results is **fail-closed and therefore safe** — a grant with no readable major can never be §4.4c case 2, so resolution collapses to *refuse for want of a version* or the single published major — but §4.4b's MUST is on the grant. That file is deliberately a mirror of two relying parties (`apr_grant.erl`, `grant.py`), so the change is three-sided and worth scheduling as one. |
| **AG-4** | Should-fix, **and a note back to koine** | `Capability.endpoint` — *"where this specific capability is invoked, when it differs from the provider's endpoints"* — is the job §2.4's `binding.endpoint` was minted for, under a name KCB §2 does not define. The implementation already had half of the field the break-test said the fabric lacked; V-4's fold is the moment to reconcile the spelling, because a per-capability address under two names in two repos is the divergence §2.4 exists to prevent. |
| **AG-5** | Should-fix | `schemas/src/versions.ts` pins `SPEC_VERSIONS.kcb = '0.4.6'`, and that file's own tracking table reads *"Nothing outstanding"* for KCB — four versions stale (0.4.7 §4.2, 0.4.8 §4.3, 0.4.9 §3.1/§5, 0.5.0 §2/§2.4/§4.4/§7). The file's stated rule is that a row which stops tracking writes its reason and its ending condition; none is written, so the lag reads as currency. |
| **AG-6** | Informative — **not** a divergence | `payload_schema_id`, `quoted_cost`, `volume`, `effect` and `accepted_issuers` are optional on read and write; implementing none of them is conformant, and this row exists so *unimplemented* is not later misread as *divergent*. One observation with teeth: `KnowledgePort.shape` exists there with no digest of any kind beside it, which is precisely the port **V-2** found blind — so those knowledge ports read as §7.1's *no cross-check available* today, by construction rather than by choice. |

**The honest summary.** Nothing in that implementation *contradicts* a folded clause; AG-1 is the one
finding the fold actively creates, and it is a path change. The larger fact is AG-2: the reference
implementation sits at the **pre-§7** manifest shape, so the seven folds this tasklist landed are
unexercised there, and the interoperability evidence for them is not yet stronger than the prose.

---

## 6. Is KCB promotable?

**No — and not for anything this fold could have done differently.**

[`promotability.md`](promotability.md) is the ladder of record and its KCB row is the long form. The
short form:

- **Five re-ratification counts, none closed.** A fold does not close its own gate, so count (ii)
  **changed shape** — from *fold the deltas* to *a re-run of Steps 3, 5, 7, 8, 9 and 10 against the
  folded text* — and the other four are restated and unmoved. Both folds together clear **zero of
  five**.
- **Count (ii) also fails the [ratification gate](../../specs/README.md#the-ratification-gate) on
  artefacts.** Its encoding `kcs:live-schema-mutation` *exists*, but it predates the fold and came back
  **`green` over all four blocking deltas** because an encoding deliberately does not assert an
  unfolded delta (**DR-7**). It must be **extended** to the scenario's new **F1–F13** set before a
  re-run asserts anything about the fold.
- **Counts (iv) and (v) fail the same gate with no encoding at all** (**DR-12**, **DR-13**), so a
  clean re-run of either would be necessary and not sufficient.
- **Every one of the five re-runs is unowned**, in this repo and in every other. That is the honest
  state, and it is recorded rather than parked against a tasklist that would make it look scheduled.

**KCB is the most-implemented plane in the fabric**, which is why the answer is worth stating plainly
to both organizations reading it: the contract moved twice in one day and the evidence did not move at
all. The cheapest thing that would change this answer is not another fold — it is one hand-walk of
[`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) against the folded text,
plus the encoding extension **DR-7** makes unavoidable.
