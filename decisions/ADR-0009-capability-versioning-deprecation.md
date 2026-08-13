# ADR-0009 — Capability versioning & deprecation: evolving a schema without breaking subscribers

**Status:** Accepted (2026-08-13)
**Deciders:** ecosystem owner
**Refines:** [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB) §2, §2.1, §3, §5,
§7.2; resolves the inheritance in [`../specs/fine-tuning.md`](../specs/fine-tuning.md) (KFT) §11.5
**Applies to:** every participant on the bus — capability **providers** (who evolve schemas),
capability **consumers** and subscribers (who break when they do), and the control-plane **host**
that provisions the registry and issues grants.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

KCB §7.2 leaves one question open, and states it as a fork: *how does a provider evolve a
capability's schema without breaking subscribers — semver on capability names? content-addressed
schemas?* KFT §11.5 does not restate the question; it **inherits** it verbatim and adds one fact of
its own: *a finetuned model pins the `kft_version` it was trained under*. Both are the same
question, and answering it twice would produce two answers.

The question is live because the bus is built for exactly the situation that breaks subscribers.

- A capability is discovered by its **ports** (§2.1) and matched by the registry's path search
  (§3), not read by a human before each call. A consumer therefore binds to a *shape*, at
  discovery time, and may hold that binding for the life of a `subscribe` (§4).
- A published manifest is not a document a provider controls the read of. It rides on the peer's
  own AgentCard extension (§2), is crawled and **cached** by the registry (§3), and is authoritative
  from the provider's side only — there is no push to invalidate what a subscriber already bound to.
- Invocation is authorized by a **grant naming a capability** (`invoke:compose`, §5) and metered
  against a spend ceiling (`budget_units`) computed from a capability's advertised `cost` (§2.1).
  A capability that changes under a live grant changes what that grant authorizes and what it costs.

So "break a subscriber" has three distinct failure modes, and a versioning scheme that addresses
only the first is not a contract:

1. **Shape break** — the provider adds a required input, removes an output type, or renames a port;
   the subscriber's next invoke fails, or worse, silently produces something else.
2. **Silent mutation** — the provider changes a schema and *does not* signal it. Any scheme resting
   purely on a provider-declared version number is unfalsifiable here: a forgotten bump is
   indistinguishable from no change.
3. **Authorization / spend drift** — the capability behind an already-issued grant becomes a
   different, or more expensive, operation than the one that was authorized.

Three parts of the fabric already answer a structurally identical question, and they answer it the
same way. [`../registry/relations.tsv`](../registry/relations.tsv) fixes that *a relation's
signature is immutable once published* — changing it changes every dependent claim id, so a change
is a **new relation name**, never an edit in place. KINP §3 gives claims and assets ids that **are**
their content, so a mutated artifact is a different artifact by construction. KCB §2.2's own
0.2.0→0.3.0 migration retires a manifest location by **serving both** across a transition window
rather than by cutting over. KMI §4.4 does the same for a deprecated media type — with one gap this
record is also asked to close: *the transition window has no removal date*.

This record decides the rule those three are instances of, and applies it to the control plane.

---

## Options considered

### Option (a) — Semver on capability names

Each capability carries a semantic version; consumers discover and pin by name + version (or by a
range), and compatibility is what semver says it is: patch/minor are safe, major is not.

**For.**
- It is the *only* one of the two that can express **compatibility**. A digest can say "different";
  it cannot say "different but safe", which is the question a subscriber actually asks.
- It carries **semantic** change — a field whose meaning shifted while its type did not. No
  structural mechanism detects that; a declared major bump is the only signal available.
- It is legible to path search: the registry can prefer, or refuse, a route across a major boundary
  without hashing anything.
- Universally understood by implementers, and already the discipline koine applies to its own specs
  (`kcb_version`, `kgp_version`, `kft_version`).

**Against.**
- It is a **claim, not a fact**. A provider that edits a schema and forgets the bump ships failure
  mode 2 with the versioning scheme fully "in use". Nothing on the wire contradicts them.
- "Name + version" invites encoding the version *into* the name (`compose-v2`), which fragments
  discovery: a subscriber searching for `compose` no longer finds its successor.

### Option (b) — Content-addressed schemas

The capability's port declarations are canonicalized and hashed; the digest is the schema's
identity. A subscriber pins the digest, and any change at all yields a different digest.

**For.**
- It is a **fact**, verifiable by the subscriber against bytes it fetched itself. Failure mode 2
  becomes structurally impossible: a silent mutation is a mismatch, detected before invoke.
- It is native. KINP §3 already mints claim and asset ids this way, and the registry's
  immutable-signature rule is the same discipline applied to relation names — a fabric that
  content-addresses its data and its vocabulary and *not* its contracts has an inconsistent floor.
- It survives caching and crawling: the registry may hold a stale card, but a stale digest is
  self-announcing rather than silently wrong.

**Against.**
- It has **no notion of compatible**. Adding one optional field re-hashes the whole port, so every
  subscriber pinned to the digest sees a break where none exists — a scheme that cries wolf on
  every additive change gets pinned-and-ignored, which is worse than no scheme.
- It cannot express semantic drift either: identical bytes, changed meaning, same digest.
- It gives grants nothing to bind to that survives a harmless edit, so §5 tokens would churn.

---

## Decision

Neither option is discarded, and the choice is not split down the middle: they answer **different
questions**, and the fabric already knows which layer each belongs to. This is the same shape as
[ADR-0006](ADR-0006-kgp-rdf-prov-jsonld-relationship.md)'s finding that the standards model
*meaning* while identity is a **byte** discipline. Here: **semver states intent, the content digest
establishes identity, and the digest is what makes the intent falsifiable.**

### 1. A capability is identified by `name` + a semver `version`

Every entry in the KCB extension's `params.capabilities` (§2) carries a `version` (semver). The
pair `(name, version)` — not the name alone — is the unit of **discovery**, of **grant scope**, and
of what a subscriber pins.

The version is **a field, never part of the name**. `compose` at `2.0.0` stays discoverable as
`compose`; `compose-v2` is not conformant. Registry queries (§3) match a capability name plus an
optional version range and rank the highest satisfying version, so a subscriber that asks for
`compose` without a range keeps finding successors, while one that pins `^1` keeps its guarantee.

This is additive to §2: a capability entry without `version` is read as `0.0.0`-unknown and MUST be
treated by a consumer as pinnable only by digest.

### 2. Every port carries a content-addressed `schema_id`

Each port in `params.produces`, `params.consumes`, and each capability's `inputs`/`outputs` carries
a `schema_id`: an **algorithm-prefixed digest** (`sha256-…`), in the same form KINP §3 uses for
claim and asset ids, over a canonicalized serialization of that port's declaration.

The §-edit fixes the canonicalization bytes; this record fixes what it must satisfy:

- **Deterministic** — key order and whitespace normalized, so two providers declaring the same port
  produce the same digest, and one provider re-serializing produces no drift.
- **Schema-only** — it covers `plane` and that plane's type vocabulary (`dialect`/`worlds`/`shape`,
  `media_types`/`world_pattern`, entity `types`), and **excludes** everything that is not shape:
  `description`, `cost`, and the capability's own `version`. Cost is priced, not typed (decision 5),
  and including the version would make every digest trivially unique and therefore useless as a
  cross-check on the version.
- **Falsifiable** — a consumer recomputes it from the card it fetched (§4 `describe`) and compares.
  A digest that does not match its declared version's history is a **silent mutation**, and the
  consumer MUST treat the capability as unusable rather than guess which side is right.

Digests are a cross-check, not a replacement for the version: they catch failure mode 2 and are
silent on semantics, which is exactly what decision 1 covers.

### 3. The subscriber-compatibility rule

What a provider MAY change under a given version bump, stated in port terms. A **live subscriber**
is any consumer holding a discovery binding or an open `subscribe` (§4) against `(name, major)`.

| Change to a published capability | Bump | Breaks a live subscriber? |
|---|---|---|
| Add a **new capability** to the manifest | minor | No |
| Add an **optional** input field / an optional input port | minor | No |
| **Widen** an input port — accept more `media_types`, a broader `world_pattern`, more entity `types` | minor | No |
| **Add** an output field, or an additional produced `media_type` | minor | No — consumers MUST ignore unknown output fields |
| Editorial only — `description`, examples; no `schema_id` change | patch | No |
| Change `cost` | minor, and never silent | No — see decision 5 |
| Add a **required** input, or make an optional input required | **major** | Yes |
| **Remove or rename** a capability, a port, or a field | **major** | Yes |
| **Narrow** an input, or **remove/narrow** an output type | **major** | Yes |
| **Tighten** a produced port's `world_pattern` | **major** | Yes — it silently shrinks what the subscriber discovers (KCB delta J) |
| Change the **meaning** of an existing field at unchanged type | **major** | Yes — and only the declared bump can say so |

Two obligations fall out and are normative for the §-edit:

- **Consumers MUST ignore unknown fields** on outputs and MUST NOT reject a manifest carrying
  capabilities or ports they do not understand. Without this, every additive change is breaking and
  the minor tier is fiction. This matches the tolerance KCB §4 already requires of consumers for
  dangling asset references (delta L).
- **A digest change with no version change is a defect**, not a compatible edit. The provider MUST
  bump at least the minor when a `schema_id` changes; a consumer that detects otherwise applies
  decision 2's rule.

### 4. A breaking change is published as a successor, never edited in place

**The signal for a breaking change is the appearance of a new major alongside the old one.** A
provider MUST NOT mutate a published `(name, major)` into an incompatible shape. It publishes an
additional entry in `params.capabilities` at the new major, serves **both** for a transition window,
and marks the predecessor deprecated with a **declared removal version** — the field-level form of
what KCB §2.2 already does for the manifest location and KMI §4.4 for the legacy media type.

The subscriber's experience of a breaking change is therefore never a failed invoke: the capability
it bound to keeps working, and the successor is discoverable next to it. Discovery ranks the highest
version satisfying the caller's range, so an unpinned consumer migrates by re-discovering, and a
pinned one migrates when it chooses — until the declared removal.

This makes the control plane consistent with the two rules it already lives beside: a **relation
signature** is immutable once published because changing it changes every dependent claim id, and a
**claim or asset id** is its content. In all three cases the fabric evolves by *adding a successor
and retiring the predecessor on a declared schedule*, never by mutating a published surface.

The window's length and the mechanics of retirement — the **deprecation half** of this decision —
are fixed by **decision 7**, which is also what KMI §4.4's dateless window is waiting on.

### 5. Grants bind to a major; cost changes fail closed, never silently

Consistency with KCB's capability `cost` (§2.1) and grant spend ceilings (§5) is a constraint on
this decision, not an afterthought — a versioning scheme that let a provider expand authorization or
drain a budget by shipping a new schema would defeat both.

- **A grant binds to `(capability, major)`.** `invoke:compose` issued against major 1 authorizes
  every 1.x — that is what the compatibility rule in decision 3 is *for* — and does **not**
  authorize major 2. A provider cannot widen what an issued token permits by publishing a breaking
  change; the new major requires a new grant from the hosting org's governance (§5). Fail closed.
- **`cost` is outside the `schema_id`** (decision 2) because price is not shape. A re-priced
  capability is the same contract, so re-hashing it would signal a break that is not one.
- **A cost change is still never silent.** It is a minor bump, so the version moves and a pinned
  subscriber can see it; and the enforcement point is unchanged — path search (§3) returns the
  path's projected cost *before* invoke, and the grant's `budget_units` ceiling (§5) is evaluated at
  invoke against the then-published cost. A raise that exceeds the caller's remaining ceiling
  therefore **fails closed at the gate**, exactly as delta K designed it, rather than overspending.
- **Free-tier drift is a cost change like any other.** A capability moving `cost.tier` from `free`
  to `paid` is a minor with the above consequences — path search stops preferring it and a
  zero-budget grant stops reaching it — and never a silent bill.

### 6. The KFT inheritance: a pinned `kft_version` is an archival pin

KFT §11.5's inheritance resolves here, and the fact it adds is the resolution rather than a special
case: **a finetuned model pins the `kft_version` it was trained under.**

Under this decision, that pin is a **record on an immutable artifact**, not a live binding, and the
two behave differently on purpose:

- A finetuned model is a KINP `model` entity (KFT §5.1) produced by a PROV activity (§5.2). Its
  record carries the `kft_version` the job manifest declared (§3) and — because the run was an
  `invoke` on the bus — the `(name, version)` and port `schema_id`s of the **`finetune` capability**
  that produced it. The three are distinct and all three are worth pinning: the **spec** version
  (`kft_version`, `kcb_version`), the **manifest-shape** version (the extension URI, §2), and the
  **capability** version (decision 1).
- A live subscriber must be protected from change; an archival pin must merely stay **resolvable**.
  So retirement under decision 4 ends the obligation to *emit or accept* a retired version — it
  never ends the ability to *read* what was recorded under it. This is the same line KMI §4.4 draws
  for archived EDL assets: removal ends the obligation, not the readability.
- Therefore a finetuned model does not "break" when its producing capability reaches a new major.
  It reproduces, audits, and compares against the contract it names. A **re-run** is a new invoke
  and is governed by decision 5's grant rule like any other — the pin explains what was trained, it
  does not authorize training again.

A model whose provenance cannot name the contract version it was trained under is not reproducible,
which is why the pin is required rather than advisory.

### 7. The deprecation window: declared at deprecation, measured in versions

Decision 4 retires a predecessor across "a transition window." This is that window — the
**deprecation half** of the same rule — and it binds every retiring surface the fabric has, not just
capabilities: a capability major, a media type, a manifest location, an extension URI.

**a. A deprecation is a declaration, and it names its own end.** To deprecate a surface is to
publish, in the same release: (i) the successor, (ii) an explicit deprecated marking on the
predecessor, and (iii) a **removal version** — the version at which the obligation to emit or accept
the predecessor ends. A deprecation that names no removal is not a deprecation; it is an unbounded
promise a subscriber cannot plan against, and it is what KMI §4.4 is today.

**b. The window is measured in the retiring surface's own versions, never in wall-clock dates.** For
a capability, that axis is decision 1's semver: removal is declared as a capability version. For a
surface with no version of its own — a media type, a manifest location, an extension URI — it is the
**minor version of the spec that defines it**. Dates are rejected on two grounds: koine's surfaces
move on publication, not on a calendar, so a date is enforceable by nothing a consumer can read off
the contract; and any real calendar is a *deployment* fact, which belongs to that operator's private
integration repo rather than to an agnostic record.

**c. Never in the same release: at least one full minor.** The declared removal MUST be at least one
minor after the version that declared the deprecation, so declaring and removing are never the same
publication and a consumer one version behind still meets the deprecation before the removal. KMI
§4.4's "no earlier than the next **minor**" is exactly this floor — but a floor is not a policy. The
policy is that the concrete version is *named*.

**d. Both forms are served, and the predecessor stays functional, for the whole window.** This is
decision 4's dual-serve, which KCB §2.2 already applies to the manifest location and KMI §4.4 to the
legacy media type: deprecated means *superseded*, not *degraded*. Where both are offered for the
same thing the **successor is authoritative** (§4.4's rule, generalized). Discovery (§3) MUST keep
returning a deprecated entry — marked, and carrying its removal version — while ranking it below any
non-deprecated entry that satisfies the same query, so a subscriber meets the deprecation at
discovery or `describe` time and never at invoke.

**e. A declared removal moves later, never earlier.** Extending a window is a fresh declaration and
is compatible with everyone. **Shortening** one — pulling a removal version in — breaks every
subscriber that planned against it and MUST NOT be done; if a predecessor must go sooner than
declared, the move is a new major under decision 4, not a re-dated retirement.

**f. Removal ends the obligation, never the readability.** Past the removal version a producer MUST
NOT emit the retired form and a consumer is no longer obliged to accept it. Nothing already produced
is invalidated: content-addressed artifacts stay valid and fetchable, and the archival pins that
name a retired contract version (decision 6) stay resolvable. Retirement is a statement about the
**live** contract only — the same line KMI §4.4 already draws for archived EDL assets.

**g. The two surfaces mid-window today.** Both are governed by (a)–(f), and in both cases the clause
that names the version is the §-edit's to write — this record decides the policy and edits no
normative text:

- **KMI §4.4** deprecated `application/vnd.koine.edl+json` in KMI 0.3.0 and states only the floor
  ("no earlier than the next minor"), so it names no removal version. Under this policy it MUST name
  one, and the earliest conformant value is **KMI 0.4.0**. Setting it is `chief/55`'s job, not this
  record's; no spec version is bumped here.
- **KCB §2.2**'s standalone `/.well-known/kcb-manifest.json` is the same gap in the other spec: it
  is dual-served "until all consumers crawl the extension," which is a *condition*, not a version.
  The same §-edit names its removal version under the same policy.

### 8. What stays invariant, so the §-edit is additive

Decisions 1–7 reach KCB through a §-edit (`chief/55`). That edit **adds fields**; it MUST NOT
redefine the manifest. §2 was already redefined once — 0.2.0's standalone document became 0.3.0's
AgentCard extension (§2.2), a change still awaiting re-validation — and a second redefinition on top
of it would make the manifest the least stable surface on the bus. So the §-edit preserves:

- **One extension entry on the card.** No second well-known file, no companion document, no new
  endpoint. The manifest's location, and ADR-0007's rule that a participant publishes its own
  self-description, are untouched; `version` and `schema_id` are fields inside `params`.
- **The extension URI does not move for an additive change.** `https://w3id.org/koine/kcb/manifest/0.3`
  names the *payload-shape family*; the spec version is carried by `params.kcb_version`. Minting
  `…/manifest/0.4` for added optional fields would make every already-published card invisible to a
  crawler matching the old URI — `compose-v2`'s fragmentation (decision 1) at the document level.
  The URI moves only on a **breaking** manifest redefinition, and then both URIs are served across a
  declared window (decision 7): the fabric applying its own rule to its own surface.
- **Existing `params` fields keep their names and shapes** — `kcb_version`, `mcp`, `produces`,
  `consumes`, `capabilities`, `auth`, `signing`. `signing` in particular MUST stay shape-identical,
  because §2.2 fixes it as the **shared** signing shape with KGP `manifest.signing`, and KINP §7
  provenance attribution depends on that.
- **The new fields are optional on read.** A conformant 0.3.0 card carrying neither `version` nor
  `schema_id` stays valid: decision 1 reads a missing `version` as `0.0.0`-unknown, and a missing
  `schema_id` means "no cross-check available", not "invalid manifest". With decision 3's
  ignore-unknown-fields obligation, old and new readers interoperate in both directions.
- **The port model is unchanged.** §2.1's plane vocabularies, `world_pattern`, and `cost` are not
  re-typed — `schema_id` is a field *on* a port. Deltas F / G / J / K / L stay unreopened, so KCB
  §7's *0.3.0 re-check* remains true and the outstanding re-validation against
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md) is not invalidated by
  this record.
- **Existing grants stay valid.** Decision 5 binds a grant to `(capability, major)`; the grant's
  `invoke:<capability>` form (§5) does not change — the major it was issued against travels with the
  issuance rather than being encoded into a new grant name.

Judged by the table it is encoding, the §-edit is therefore a **minor** bump of KCB: fields added,
none removed, nothing narrowed, no live subscriber broken.

---

## Invariant regardless of which option had been decided

Some of this record's force does not depend on the fork's outcome, and the §-edit MUST preserve it
even if a later re-open changes the mechanism:

- **A published contract surface is never mutated in place.** Evolution is successor + declared
  retirement. This already binds relation signatures and content-addressed ids; decision 4 only
  extends it to the control plane.
- **A subscriber never learns of a break by failing.** Whatever signals a break must be visible at
  discovery or describe time (§3/§4), before invoke.
- **Authorization and spend fail closed** across any version change (§5).
- **A deprecation names its own end.** A retiring surface declares the version at which it is
  removed, at the moment it is deprecated; an unbounded window is not a deprecation (decision 7).
- **Retirement removes obligation, never readability.** Archived artifacts and the records that pin
  them stay resolvable past a removal.

---

## Consequences

**Positive**
- KCB §7.2 and KFT §11.5 are answered **once**, with the KFT half derived from the general rule
  rather than special-cased.
- Failure mode 2 (silent mutation) becomes detectable by the subscriber from bytes it already
  fetches for `describe`, with no new endpoint and no trust in the provider's diligence.
- Grants and spend ceilings gain a defined behaviour across schema evolution, closing an unstated
  gap in §5: previously nothing said whether `invoke:compose` followed `compose` through a rewrite.
- The control plane now matches the discipline the registry and the data planes already enforce, so
  "how does this evolve?" has one answer across koine rather than three.
- KMI §4.4's dateless deprecation stops being an open loop, and it closes as an *instance* rather
  than a one-off: the retirement policy is stated once (decision 7) and applies to a capability
  major, a media type, and a manifest location alike, so no future spec re-invents it.
- The scheme is testable, which is what makes the follow-up pressure test meaningful.

**Negative / costs**
- Providers carry two artifacts per capability instead of none: a version they must bump honestly
  and a digest they must compute. The digest is mechanical; the bump is judgement, and decision 3's
  table is the only thing standing between judgement and drift.
- Serving two majors concurrently is real cost for a provider — duplicated implementations for the
  window's length. This is the price of never breaking a live subscriber, and the window bounds it.
- Canonicalization is another byte discipline koine owns and must keep stable; ADR-0006's warning
  applies — an unexercised canonicalization rots.
- Consumers that today reject unknown manifest fields must be relaxed before the minor tier is
  usable; that is a real (if small) migration for existing implementations.
- Measuring windows in versions rather than dates means a slow-publishing surface holds its
  deprecated forms longer than a calendar would. The trade is deliberate: a version is a deadline a
  consumer can read off the contract, and a date is one only the operator can see.
- Naming a removal version at deprecation time forces the call before the migration's cost is fully
  known, and decision 7e makes it one-way — extendable, never pullable-in.

**Neutral**
- No change to the port model (§2.1), the verbs (§4), the registry's route-by-lookup stance
  ([ADR-0001](ADR-0001-control-plane-topology.md)), or the manifest's location on the AgentCard
  ([ADR-0007](ADR-0007-self-describing-participant.md)) — a `version` and a `schema_id` are new
  fields inside `params`, not a new document or a new surface.
- KGP, KMI's asset model, KCS, and KINP are untouched by decisions 1–6.

---

## Alternatives considered

- **Semver alone (option (a) as decided).** Rejected as *insufficient*, not wrong: it is
  unfalsifiable against a forgotten bump, and a compatibility contract nobody can check is a
  convention. It survives as decision 1 with the digest as its check.
- **Content addressing alone (option (b) as decided).** Rejected as *insufficient* for the opposite
  reason: it cannot express "changed but safe", so it converts every additive edit into a break and
  trains subscribers to ignore it. It survives as decision 2, in the layer where identity belongs.
- **Version in the capability name (`compose-v2`).** Rejected: it fragments discovery. The registry
  matches capability names (§3), so a successor under a different name is invisible to a subscriber
  searching for the original — the opposite of decision 4's "the successor appears next to the
  predecessor."
- **Negotiate the version per invoke instead of publishing it.** Rejected: it moves the break to
  invoke time, violating the invariant that a subscriber never learns of a break by failing, and it
  gives the registry nothing to rank or path-search on.
- **Pin subscribers to a manifest snapshot (version the whole card, not each capability).** Rejected:
  it couples unrelated capabilities — one capability's breaking change would invalidate every
  subscriber of every other capability on the same card — and the card is already versioned at the
  shape level by the extension URI (§2), which is a different concern.
- **Leave it to each provider's own policy.** Rejected: subscribers are cross-participant by
  construction, so a per-provider policy is not discoverable and cannot be asserted against. This is
  precisely the class of question the fabric exists to settle once.

---

## Relationship to the specs

- **KCB** §7.2 stops being an open question and becomes normative text: `version` on capability
  entries (§2), `schema_id` on ports (§2.1), version-range matching and successor ranking in the
  registry (§3), grant-binds-to-major and the cost-change rule (§5), plus the compatibility table.
  That §-edit is a follow-up, **not** part of this record. Decision 8 fixes what it MUST NOT touch —
  the extension URI, the existing `params` field names, `signing`'s shared shape, the port model — so
  it lands as an **additive minor** rather than a second redefinition of the manifest; §2.2's own
  standalone-manifest window gets its named removal version there too (decision 7g).
- **KFT** §11.5 resolves to decision 6 by inheritance; the `kft_version` field (§3) and the model
  entity + PROV activity (§5.1/§5.2) already carry what the pin needs, so the expected change is
  clarifying rather than structural.
- **KMI** §4.4's deprecated `application/vnd.koine.edl+json` is the outstanding instance of decision
  4's retirement half — it declares a transition window with no removal version. Decision 7 supplies
  the policy it was missing: a deprecation names a concrete removal version, measured in the defining
  spec's minors and at least one minor out, dual-serving until then and staying readable after. The
  earliest conformant value for §4.4 is therefore **KMI 0.4.0** — but the clause that names it is the
  §-edit's (`chief/55`). This record edits no normative clause and bumps no spec version.
- **[`../schemas/`](../schemas/)** — no schema in this repo models the KCB manifest (it is defined by
  KCB §2 and served on the AgentCard; `participant-self-description.schema.json` deliberately holds
  it **by reference only**), so decisions 1–2 add no schema here.
- **KINP**, **KGP**, and **KCS** are untouched.
- Which capability a particular deployment versions when, and what any one provider's migration
  calendar is, are deployment facts recorded in that deployment's own integration repo — not here.

---

## Follow-ups

This record decides; it edits no normative clause. Two follow-ups carry it (ROADMAP Phase F2):

| Follow-up | What it does | Tasklist |
|---|---|---|
| **The KCB §7.2 §-edit** | Encodes decisions 1–5 as normative KCB text (§2/§2.1/§3/§5), fixes the `schema_id` canonicalization bytes, notes the KFT §11.5 inheritance, **and sets the concrete removal version for KMI §4.4's `edl+json`** — plus KCB §2.2's standalone manifest location — under decision 7's deprecation policy, additively per decision 8. Bumps the affected spec versions; this record bumps none. | `chief/55-kcb-versioning-spec-edit` |
| **The mutate-live-schema pressure test** — ✅ **landed, run, not clean** | A `scenarios/` scenario in which a provider ships a capability v2 while a v1 subscriber is live — asserting no silent break: the v1 binding survives, the digest catches an unbumped mutation, the v1 grant does not reach v2, and a cost raise fails closed against the spend ceiling. Prefer finding the break to asserting correctness. **Outcome:** nothing here argues for a different decision — semver-for-intent, digest-for-identity and successor-never-mutate-in-place all held under attack — but the *perimeter* is open in eight places (**V-1…V-8**; blocking V-2/V-4/V-5/V-7). All folds are additive, and land in KCB **0.5.0**. | [`../scenarios/e2e-live-schema-mutation.md`](../scenarios/e2e-live-schema-mutation.md) |

---

## Amendment log

### 2026-08-13 — the extension-URI literal is restated under the current namespace

**What changed.** One literal. Decision 8's *"the extension URI does not move for an additive
change"* bullet quotes the manifest extension URI as its worked example; that URI's namespace root
has moved to a **w3id.org permanent identifier**, so the bullet now quotes
`https://w3id.org/koine/kcb/manifest/0.3` where it previously quoted the same path under the
hostname that root replaced. The move itself is recorded once, in full — provenance, registration
PR, and rationale — in
[`ADR-0007-self-describing-participant.md`](ADR-0007-self-describing-participant.md)'s amendment
log; this entry only keeps *this* record from quoting a retired string.

**Why.** The extension URI is a **matching key**: implementations embed the literal. A record whose
worked example prints a string no producer emits teaches the wrong string, which is the one failure
mode a matching key has.

**What did *not* change.** No decision. Decisions 1–8 stand as accepted **2026-08-13**, and decision
8's bullet says exactly what it said before: the URI names the *payload-shape family*, the spec
version rides in `params.kcb_version`, and the URI moves only on a **breaking** manifest
redefinition — both URIs then served across a declared window (decision 7). That clause is in fact
what governs the namespace move: it is a breaking change to a matching key, so KCB §2 states the
dual-accept window, the fabric applying its own rule to its own surface.

**Spec effect.** None from this entry. The normative landing is made in KCB itself, at **0.4.1**
(2026-08-13): every occurrence moved, plus **§2.3**, the dual-accept window that retires the legacy
root at **KCB 0.6.0** — a removal version measured in KCB's own minors, per §7.3b/c, which is this
record's decision 7.
