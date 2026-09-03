# ADR-0014 — A federated merge merges attributions, never contents

**Status:** Accepted (2026-08-26)
**Deciders:** ecosystem owner
**Answers:** the one finding returned by the cross-read of the **federation fold** (KCB 0.4.9,
[`85`](../tasks/chief/completed/85-fold-the-federation-breaks.json)) against the **capability-versioning
fold** (KCB 0.5.0, [`86`](../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json)) — recorded in
[`../docs/reference/fold-coordination-federation-versioning.md`](../docs/reference/fold-coordination-federation-versioning.md).
**Refines:** [`ADR-0012-federated-authority-roles.md`](ADR-0012-federated-authority-roles.md), whose
discovery half KCB §3.1 applies, and
[`ADR-0009-capability-versioning-deprecation.md`](ADR-0009-capability-versioning-deprecation.md),
whose deprecation half KCB §7.3 applies. It contradicts neither; it decides what happens where the
two meet.
**Applies to:** the **authority** role in its registry form, and every **consumer** that reads a
discovery result rather than a provider's own card.

---

## Context

Two folds landed against [`../specs/capability-bus.md`](../specs/capability-bus.md) on the same day,
from two tasklists, against two different pressure tests:

- **0.4.9 — the federation half.** `MA-9` gave KCB §3.1(d) a **de-duplication converse**: where two
  entries reaching a registry through different peers resolve to the same provider **KINP id**, the
  same `(name, version)` **and** the same `schema_id`, they are **one** capability with *multiple
  attributions*, and the registry MUST return it once carrying every `served_by`.
- **0.5.0 — the versioning half.** `V-7` gave KCB §7.3g three push frames on §4.2d's existing control
  channel, and in doing so stated the boundary out loud: for a **discovery binding** — cached port
  shapes, no stream open — the **pull side is the whole of the contract**, and §7.3d's *"discovery
  MUST keep returning a deprecated entry, marked and carrying its removal version"* is the mechanism
  it leans on.

Read separately, each is right. Read together, the second leans on something the first is entitled to
discard.

### The finding, in three steps

1. **§7.3's deprecation marking has no carrier.** §7.3a requires *"an explicit deprecated marking on
   the predecessor"* and a **removal version**; §3 and §7.3d require discovery to return the entry
   *"marked, and carrying its removal version"*. **No field in §2's manifest, and no field in §3's
   `find` response, is named for either.** This is precisely the class `MA-8` folded for §3.1's own
   clauses — *a clause asserted with no carrier* — and the fold did not extend to §7.3's.
2. **The merge key excludes it, and cannot help excluding it.** A deprecation marking is not shape
   (§7.1 step 1 drops every non-shape key, so the digest does not move), it is not the capability's
   `version` (a deprecation is published *with its successor*; the predecessor's own entry gains a
   marking in place), and **§7.2's compatibility table has no bump row for marking a capability
   deprecated**. So a *stale* attribution and a *fresh* one satisfy §3.1(d)'s converse **exactly** —
   same provider id, same `(name, version)`, same `schema_id` — and MUST be returned as one entry
   whose marking is undefined, because the field is undefined.
3. **§3.1(e) cannot fire.** (e) tells a consumer to *"resolve any disagreement between two entries —
   or between an entry and what it finds on the wire — against the provider's own card"*. The
   converse in (d) has just removed the visible disagreement. The consumer sees one entry, one
   `observed_at` per attribution, and no reason to look.

The consequence is bounded but is exactly the shape §7.2 rates highest: in a **federated** deployment
a consumer holding a discovery binding can miss a deprecation on the one channel §7.3g says is the
whole of its contract, and `DEFER-E`'s deferral rests on the same uncarried clause — it is deferred
because *"a subscriber can already reconstruct the span from what §7.3d returns."*

### It generalizes, which is why it is a record and not a footnote

Four consecutive folds put an operand **outside** the `schema_id` digest, each for the same correct
reason — price, rate, reversibility and address are not *shape*:

| Carrier | Introduced | Declared bump when it changes | In §3.1(d)'s merge key? |
|---|---|---|---|
| `cost` (§5) | 0.4.0 | **minor** (§7.2) | no — but the bump moves `version`, which **is** |
| `binding` (§2.4) | 0.5.0 | **minor** (§7.2) | no — but the bump moves `version`, which **is** |
| `volume` (§4.2a) | 0.4.7 | **none stated** | **no** |
| `effect` (§4.3a) | 0.4.8 | **none stated** | **no** |
| the deprecation marking (§7.3a/d) | 0.4.0 | **none stated** | **no** |

§3.1(d)'s key is *the digest key plus `version`*. Every carrier deliberately kept out of the digest is
therefore out of the merge key too, and only the two with a declared bump are rescued — by the
`version` the bump moves, not by the key. The last three are gates or gate inputs (`effect` gates a
dispatch under §4.3; the marking gates ranking under §7.3d), and the converse says nothing about which
attribution's copy of them survives.

---

## Options considered

**(a) Nothing — the provider's card is authoritative and a consumer that cares re-reads it.** True and
insufficient. It is true of every §3 result and would equally excuse §3's ranking obligation, §7.3d's
marking obligation and `MA-8`'s whole fold. §7.3g has just spent a normative section establishing that
some consumers *do not* re-read, which is the entire reason the frames exist.

**(b) Put the marking in the merge key.** Rejected. It makes two views of one capability two
capabilities — the exact invention `MA-9`'s converse was folded to forbid — and it would recur for
`volume` and `effect` on the same argument until the key is the whole entry, at which point no merge
ever happens and `MA-9` is undone.

**(c) Give the marking a carrier and merge attributions, never contents.** Adopted, below.

**(d) Forbid the converse where any non-key field disagrees.** Rejected as (b)'s slower form: a
disagreement on `observed_at` alone is universal, so the exception would swallow the rule.

---

## Decision

**A registry merging under KCB §3.1(d) merges *attributions*; it does not merge *contents*.** Four
parts, each stated so it can be implemented without consulting this record:

1. **The marking gets a carrier.** The deprecated marking and its **removal version** are named
   fields on the §2 capability entry, and are carried through §3's `find` response — an extension of
   the shape `MA-8` already gave that response, **never a second envelope**. Optional on read and
   write, absent meaning *not deprecated*, on the same additive terms as `version`, `schema_id`,
   `binding` and `auth.accepted_issuers[]`.
2. **A registry MUST NOT synthesize a value for a field outside the merge key.** Where attributions
   disagree on any such field, the merged entry carries **each attribution's own copy**, bound to the
   `served_by` and `observed_at` that supplied it, and MUST mark that the attributions disagree. That
   is what §3.1(e) needs in order to fire, and it keeps §3.1(a)'s rule intact — a registry is
   authoritative for *which entries it serves*, never for the contents of an entry it did not read
   off the provider's card itself.
3. **Where the disagreeing field is a gate, the restriction wins.** If **any** attribution marks the
   capability deprecated, the merged entry is deprecated for the purposes of §7.3d's ranking and
   marking. This is [ADR-0013](ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive
   discipline reused rather than a second convention invented, and the asymmetry that justifies it is
   measurable: a **false** deprecation costs a ranking demotion on an entry that §7.3d keeps returning
   and keeps functional, and is corrected by one re-read of the provider's card; a **missed** one is
   the silent case §7.2 makes non-recoverable. The same reading governs `effect` (§4.3's *unadmitted
   is a refusal, never a silent proceed*) and `volume` (§4.2's *absent reads unknown, never low*).
4. **This does not license reconciliation.** §3.1(d)'s prohibition is untouched: two entries from two
   **authorities** naming the same capability are still both returned and still never silently picked
   between. Parts 2 and 3 apply only *within* the converse — one provider, one `(name, version)`, one
   `schema_id`, reached more than once.

**What is deliberately not decided here.** No wall-clock timestamp on the marking (`DEFER-E` is
unmoved and its trigger unchanged), no cadence or TTL on a discovery binding (`DEFER-D`, likewise),
no bump row for `volume` or `effect` — the exposure is recorded above, and closing it is a §7.2
change that belongs to whichever pressure test breaks it — and no peering topology, membership or
trust weighting (§3.1(d) refuses ranking by attribution and this record does not reopen it).

---

## Why no spec version moves in this record

The clause this decision authorizes spans **both** folds' territory: the carrier is §2 and §3
(the versioning fold's sections), and the merge rule is §3.1(d) (the federation fold's). The
tasklist that found it was instructed that *a contradiction between two folds is a design finding
about the fabric, and burying it in whichever fold merges second is how it becomes invisible* — and
folding it into 0.5.0 would have been exactly that: a federation clause edited by a versioning fold,
on a section whose own re-ratification count belongs to a different pressure test.

So the finding is recorded here, and the clause lands where it re-enters validation:

- **KCB count (iii)** — the unowned re-run of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) Steps 5–7 against the
  folded §3.1 — is where §3.1(d)'s part is exercised.
- **KCB count (ii)** — the unowned re-run of
  [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) — is where
  §7.3d's carrier is exercised, and its Step 8 already walks a consumer that never re-`describe`s.

Neither count moves for this record and **no count closes**: KCB stays **Candidate** on all five,
exactly as it did before this was found.

**Amendment (2026-09-03) — count (iii) was re-run, and it reproduced this finding as its blocker.**
The Steps 5–7 re-run named above was walked by hand
([`89`](../tasks/chief/89-the-re-run-three-specs-wait-on.json), recorded in that scenario's *Re-run —
Steps 1–10 walked by hand against the folded text* section). Steps 6 and 7 flip and MA-6, MA-8 and
MA-9 all hold under re-attack, but **Step 5 does not flip**, on precisely this clause: a stale
attribution of `compose 1.4.0` and a fresh, deprecation-marked one — same provider KINP id, same
`(name, version)`, same `schema_id` — are required by §3.1(d)'s converse to come back as **one** entry
whose marking is undefined, §3's *rank a deprecated entry below a non-deprecated one* has nothing to
read, and §3.1(e) cannot fire because the converse removed the visible disagreement. Verified against
the text rather than inferred: no deprecation field exists on a §2 capability entry or in §3's
response shape. **The decision is unchanged and is not reopened** — this record predicted the count
the clause would land on, and the walk confirmed it from the other direction. What changes is only
the shape of count (iii): it now reads *write this ADR's four-part clause, then re-run Steps 5–7*,
and it remains **unowned**. **Still no spec version moves and no count closes**; KCB stays
**Candidate** on all five and is not promotable.

---

## Consequences

**Positive.** The one obligation §7.3g leans on becomes carriable and therefore assertable — a KCS
encoding can check that a deprecated entry came back marked, which today it cannot, because there is
no field to name. §3.1(e) becomes operable rather than nominal. And the general rule — *a merge merges
attributions, never contents* — is stated once for the four operands that are outside the digest today
and for every one a future fold adds, which is the pattern that produced this finding in the first
place.

**Negative, and accepted.** A federating registry's `find` response grows a per-attribution shape for
fields that in a single-registry deployment are simply the card's. That cost falls only on a
deployment that federates — a single-registry deployment (§3) is unaffected, as it is by all of §3.1 —
and it is the same cost `MA-8` already accepted for `served_by` and `observed_at`.

**Risk.** Part 3 is a fail-safe, and a fail-safe on a stale input demotes an entry that a provider may
have un-deprecated. §7.3 states no withdrawal procedure for a deprecation, so this is an unbounded
corner rather than a bounded one; it is accepted because the entry stays returned and stays functional
either way, and the correction is one card read. If a withdrawal procedure is ever specified, part 3
is the clause to re-read.

---

## Relationship to the specs

- [`../specs/capability-bus.md`](../specs/capability-bus.md) — §2 and §3 gain the carrier; §3.1(d)
  gains parts 2–4; §7.3a/d gain the pointer. **Not yet written**: the clause lands with counts (ii)
  and (iii), per the section above. No KCB version moves for this record.
- No other spec is touched. KINP, KGP, KMI, KFT and KCS carry no merge of a federated discovery
  result — §3.1 is the only place in the fabric where two attributions of one record are merged, and
  KMI §7.1's CAS replication is deliberately *not* an instance: an `asset` id **is** the bytes, so two
  holders of one asset cannot disagree about its contents.
- [`../docs/reference/fold-coordination-federation-versioning.md`](../docs/reference/fold-coordination-federation-versioning.md)
  is the read that produced this record, and carries the seam-by-seam verdicts this finding was the
  only exception to.
