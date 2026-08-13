# Scenario: a capability mutates under a live subscriber (KCB §7 break-test)

**Purpose:** break-test [`../specs/capability-bus.md`](../specs/capability-bus.md) **§7**
(KCB 0.4.0, *Candidate*) — the versioning, compatibility and deprecation surface encoded from
[`../decisions/ADR-0009-capability-versioning-deprecation.md`](../decisions/ADR-0009-capability-versioning-deprecation.md).
KCB §7.5 asks for exactly this pass by name, and states why: *"§7 is normative text that has not
yet been broken against, and an unexercised canonicalization (§7.1) rots."* Same method as the
earlier passes — every step is marked ✅ *held* or 🔴/🟡 *broke*, §Findings collects the deltas, and
the bias is **adversarial**: the point is to find the silent break, not to demonstrate the happy
path. Where a step *does* hold, it holds because something was tried against it.

The single property under test is ADR-0009's central invariant:

> **A subscriber never learns of a break by failing.**

Everything below is an attempt to make a subscriber learn by failing.

**The story.** A **media producer** publishes `compose` — *knowledge in (a mood descriptor), media
out (a score)* — the cross-plane leg [`e2e-media-transform.md`](e2e-media-transform.md) delta F
opened. A **knowledge producer** has been bound to it for months: it discovered `compose` once,
cached the port shapes, holds an open `subscribe`, and holds an `invoke:compose` grant with a spend
ceiling. Over one release cycle the provider then does everything a real provider does — widens an
input, re-prices, edits a schema and forgets the bump, ships a breaking successor, deprecates the
predecessor, and finally removes it — while the subscriber never once stops running. At each move
the question is the same: **did the subscriber find out in time, from something it could check?**

**Setup (KINP §3.4 placeholder namespaces).** The **media producer** `mediastore` publishes the
`compose` capability as a KCB extension on its AgentCard (§2), currently `1.2.0`. The **knowledge
producer** `analyzer` is the live subscriber. The control-plane **host** `orchestrator` provisions
the registry (§3) and issues grants (§5). The **identity authority** `refkb` holds entities. A
**capability provider** `provider:org:trainer` appears only in Step 11, holding a finetuned model
that archivally pins `compose` (§7.4, [`../specs/fine-tuning.md`](../specs/fine-tuning.md) §11.5).

The starting card, abridged to what §7 governs:

```jsonc
// mediastore's /.well-known/agent-card.json → capabilities.extensions[uri=…/kcb/manifest/0.3].params
{
  "kcb_version": "0.4.0",
  "capabilities": [
    { "name": "compose", "version": "1.2.0",
      "inputs":  [ { "plane": "knowledge", "dialect": "grounding-only",
                     "shape": "mood-descriptor", "schema_id": "sha256-3a91…" } ],
      "outputs": [ { "plane": "media", "media_types": ["audio/midi"],
                     "world_pattern": "*",       "schema_id": "sha256-c27f…" } ],
      "cost":    { "tier": "paid", "est_units": 1200 } }
  ],
  "auth": { "scheme": "capability-token", "grants_required": ["invoke:compose"] }
}
```

---

## Step 1 — What "live subscriber" actually is (KCB §7.2, §4)

§7.2 defines a live subscriber as *"any consumer holding a discovery binding or an open `subscribe`
(§4) against a `(name, major)`."* `analyzer` holds **all three** forms that definition covers, and
they are worth separating because they fail differently later:

| Binding held | Acquired at | Refreshed | What it caches |
|---|---|---|---|
| A **discovery binding** — `compose` satisfies `mood(knowledge) → score:audio` | one `discover` (§3), months ago | never, unless re-discovered | the port shapes + both `schema_id`s |
| An **open `subscribe`** — score events as they are composed | one `subscribe` (§4) | never — it is a *stream*, not a poll | the output port shape it decodes frames against |
| An **`invoke:compose` grant**, `budget_units: 2000`, issued while `compose` was major 1 | `orchestrator` governance (§5) | on re-issue only | the major it was issued against, and the price it was budgeted against |

✅ **Held — the definition is the right one.** All three are bindings to a *shape* rather than to a
document, which is precisely why §7 has to exist: none of the three has a channel back to the
provider, a fact §7's own preamble concedes (*"has no push channel to invalidate what a subscriber
already bound to"*). The section is honest about what it is compensating for.

🟡 **Noted, and it becomes Finding V-7.** The three rows refresh on *different* triggers — and two
of them (`subscribe`, the grant) have **no refresh trigger at all**. §7 states repeatedly that a
subscriber "meets a break at discovery or `describe` time"; nothing in §3, §4 or §7 obliges a
subscriber to *reach* discovery or `describe` time ever again. Hold that.

---

## Step 2 — A compatible widening: `1.2.0` → `1.3.0` (KCB §7.2 table)

`mediastore` widens the capability in three ways at once, all on the minor tier:

1. **widens** the input — the knowledge port now also accepts `dialect: "full"`, not only
   `grounding-only`;
2. adds an **optional** input field (`tempo_hint`);
3. **adds** an output `media_type` (`audio/wav` beside `audio/midi`) and an output field
   (`stems[]`).

Both port `schema_id`s move (all three edits are shape), and `version` goes `1.2.0` → `1.3.0`.

✅ **Held, and this is the tier working as designed.** `analyzer`'s cached binding stays valid
against every one of the three: rows 2–4 of §7.2's table say so, and the *ignore-unknown-fields*
obligation is what makes it true rather than merely asserted — `analyzer` decodes a score frame
carrying `stems[]` it has never heard of and drops the field instead of rejecting the frame. This is
the tolerance §4 already required for dangling asset references (delta L) applied one layer up, and
the reuse is a genuine strength: a consumer written to delta L is already written to §7.2.

✅ **Held under adversarial probing.** Three attempts to make the widening break `analyzer` failed:

- *Widen the input, then send it something only the widened form accepts.* `mediastore` cannot —
  `analyzer` is the **caller** on this port. Widening an input can only enlarge the set of calls the
  provider accepts, never change what an existing caller sends. The asymmetry in the table (widen
  input = minor, narrow input = major) is correctly oriented.
- *Add the output `media_type` and emit it on the live stream.* `analyzer` receives an `audio/wav`
  asset reference where it expected `audio/midi`. It does **not** break — but only because a KMI
  asset reference is a KINP id and the media type rides the asset envelope, so the frame is
  structurally identical and the surprise is deferred to `fetch`. Real, and worth stating: the minor
  tier is safe for *added* output types **because the media plane is reference-passing** (§4: the bus
  "carries invocations and data *references*… never transforms payloads"). A by-value bus could not
  make this promise.
- *Bump the minor without changing the digest, and vice versa.* Covered in Steps 4–6.

🟡 **But `analyzer` never observed any of it.** It kept working, so it had no reason to re-discover;
its cached shape is now two minors stale. Nothing is wrong yet — that is the point of the minor
tier. The exposure is that "stale but safe" and "stale and broken" are indistinguishable from inside
the subscriber. → **V-7**.

---

## Step 3 — A re-price: `1.3.0` → `1.4.0` (KCB §5, §7.1, §7.2)

`mediastore` raises `compose` from `est_units: 1200` to `4000`. Per §7.1 `cost` is **outside** the
digest; per §7.2 it is a **minor** bump, *"and never silent (§5)"*.

✅ **Held — the exclusion is right, and it is falsifiable in the correct direction.** The digests do
not move, because nothing about the shape moved. A consumer that recomputes them sees byte-identical
values and correctly reads *"this contract did not change."* Had `cost` been inside the digest, every
re-price would present to every subscriber as a schema mutation, and subscribers would learn to
ignore digest changes — the failure mode ADR-0009 rejects content-addressing-alone for. The
`description`-and-`version`-excluded rules survive the same probe: an editorial edit to
`description` produced no digest movement, and folding `version` in would have made every digest
unique and therefore useless as a cross-check *on* that version, exactly as §7.1 argues.

🔴 **BROKE (V-1, medium).** *"Never silent"* is asserted, not mechanized. `analyzer` gates spend
against the price **it last fetched** — `1200` — and §5 says the ceiling *"is evaluated at invoke
against the **then-published** cost."* Those are two different numbers held by two different parties,
and the invoke carries neither:

- `analyzer` computes `1200 ≤ 2000 remaining`, authorizes, and invokes.
- `mediastore` (or the caller's own gate, reading a fresh card) evaluates `4000 > 2000` and refuses.

The refusal is **fail-closed and therefore correct** — no silent bill, delta K holds. But the
provider cannot distinguish *"the caller saw 4000 and accepted it"* from *"the caller is still
budgeting against 1200"*, and the caller learns the price moved **by being refused**. For a price
that is arguably acceptable; the ADR invariant is about breaks. It is still an avoidable failing-to-
learn, and the fix is one field: the invoke carries the **quoted** cost the caller gated against
(the projected cost §3's path search already returns), and the provider fails closed on a *quote
mismatch* — which names the actual condition — rather than on a ceiling that may or may not have been
computed against reality. → KCB §3/§5.

---

## Step 4 — The unbumped mutation, on a media port (KCB §7.2)

The provider edits `compose`'s **output** port in place — drops `audio/midi`, keeps only
`audio/wav` — and does **not** bump. Version stays `1.4.0`. This is a *narrowing* of an output: row
9 of §7.2's table, a **major**, published as a silent patch. It is failure mode 2, the one the
digest exists for.

✅ **Held — cleanly, and from bytes the consumer already had.** `analyzer` re-runs `describe` (§4),
recomputes the digest over the output port by §7.1's four steps, and gets a value that differs from
the one it bound to **at an unchanged `version`**. Per §7.2 it treats the capability as **unusable**,
does not guess which side is right, and re-discovers. The canonicalization did its job under a real
edit: dropping `audio/midi` changes the sorted, de-duplicated `media_types` array, which changes the
serialized bytes, which changes the hash. No provider cooperation, no new endpoint, no trust in the
provider's diligence — the check is a fact computed from a card the consumer fetched itself.

✅ **Held under a serialization probe.** `mediastore` re-serialized its card with different key order
and re-emitted `world_pattern: "*"` as an absent key on one port and `[]` on another. §7.1 step 2
drops absent-or-empty keys and step 3 sorts keys by code point, so both re-serializations produced
byte-identical digests — no false alarm. The rules earn their place: without step 2 the empty-vs-
absent pair alone would have fired a spurious mutation.

🟡 **Exposure, not a delta.** The recovery §7.2 names — re-discovery — returns the *same* mutated
card, so `analyzer` re-detects the same mismatch and stays dead until `mediastore` fixes its own
bump. That is fail-closed and correct, but nothing tells `mediastore` it is broken: the defect is
detected entirely inside the consumer, and there is no defect signal back to the provider or to the
registry. **An option worth folding rather than a delta:** the registry (§3) already indexes both
`version` and each `schema_id` on every crawl, so it is the one party holding the *before and after*
of a card. Asking it to flag a digest change at an unchanged version turns per-consumer detection
into fabric-wide detection, at no new contract surface. It is not required for correctness, which is
why it is filed here and not below.

---

## Step 5 — The same mutation, on the *knowledge* port (KCB §7.1)

The provider does it again, on the input side: `mood-descriptor` is redefined — its `valence` field
changes from a signed float to an enum of five labels, and `arousal` is dropped. The port declaration
is untouched:

```jsonc
{ "plane": "knowledge", "dialect": "grounding-only", "shape": "mood-descriptor" }
```

🔴 **BROKE (V-2, high — structural).** The digest is **byte-identical**. §7.1 hashes the port's
declaration reduced to *shape keys*, and for a `knowledge` port those keys are `dialect`, `worlds`
and `shape` (§2.1). `shape` holds a **name** — `"mood-descriptor"` — not a structure. The payload
that name refers to is defined nowhere the digest can reach: it is not a media type from
[`../registry/media-types.tsv`](../registry/media-types.tsv), not an entity type from
[`../registry/entity-types.tsv`](../registry/entity-types.tsv), not a relation with an immutable
signature. It is a free string, and koine has no shape registry. So the provider changed the meaning
*and the structure* of what it accepts, the digest says "unchanged", the version says "unchanged",
and `analyzer` keeps sending the old form. This is the exact failure §7.1 was written to make
impossible, surviving on the one port plane the fabric's own thesis is about.

The severity is that it lands **precisely on delta F's cross-plane leg** — the knowledge-in/media-out
capability that made "any-to-any" real. Media ports are protected because `media_types` names an
externally-standardized format that cannot be redefined under the same name; entity ports are
protected because `types` are registry-controlled. Knowledge ports have neither property, and they
are the interesting ones.

Two candidate folds, both consistent with what the fabric already does:

- **Register the shape.** A `shape` name becomes a registry entry with an immutable signature, on the
  identical rule as a relation (*"changing it changes every dependent claim id, so a change means a
  NEW relation name, never an edit in place"* — [`../registry/README.md`](../registry/README.md)).
  Cheapest, and it makes §7.1's exclusion of the payload defensible rather than accidental.
- **Digest the payload schema.** The knowledge port carries a `payload_schema_id` over the actual
  declaration, so the shape name stays a label and the digest covers the structure.

→ KCB §7.1 / §2.1, [`../registry/`](../registry/).

---

## Step 6 — Canonicalization drift: the *false* silent mutation (KCB §7.1, §7.2)

A hypothetical future **KCB 0.5.0** adds one term to §2.1's type vocabulary — say `encoding` on
knowledge ports. `mediastore` upgrades and republishes; `analyzer` has not. Nothing about `compose`
changed: same version, same declared meaning, same accepted payloads.

🔴 **BROKE (V-3, medium-high).** The two parties now compute **different digests over the same port**.
§7.1 step 1 says *"keep only shape keys… every other key is dropped before hashing"* — so a 0.4.0
consumer drops `encoding` (it is not in the 0.4.0 vocabulary) and a 0.5.0 provider keeps it. Their
digests disagree. §7.2 then converts that disagreement into a verdict: a differing `schema_id` at an
unchanged `version` is a **silent mutation**, and the consumer *"MUST treat the capability as
unusable."* A conformant provider and a conformant consumer, one minor apart, break each other — and
they break in the direction §7.2 makes non-recoverable, because the consumer MUST NOT guess which
side is right.

This collides head-on with the other half of §7.2. *Consumers MUST ignore unknown fields* keeps the
minor tier alive at the **manifest** layer; *hash only the fields you know* silently forks the digest
at the **canonicalization** layer. Both cannot be true of the same key.

§7.1 anticipated the adjacent case and stopped one step short: *"A future algorithm is a new prefix,
never a reinterpretation of this one."* That versions the **hash**, not the **key-set rule**, and it
is the key-set rule that moves whenever §2.1's table grows. The fold is small and in the section's own
idiom — carry the canonicalization rule in the prefix (`sha256/kcb1-…`), so a consumer comparing
digests produced under two different rules sees *"computed differently"* rather than *"mutated"*, and
a digest it cannot recompute reads as **no cross-check available** (§7.1's own stated default), not as
a defect. → KCB §7.1/§7.2.

---

## Step 7 — The successor: `2.0.0` published beside `1.4.0` (KCB §7.2, §3)

`mediastore` ships the break properly this time. `compose 2.0.0` adds a **required** input
(`style_ref`, an entity port) and **tightens** the output `world_pattern` from `*` to
`worldsim:world:*` — rows 7 and 10 of the table, unambiguously major. It is published as an
**additional** entry in `params.capabilities`; `1.4.0` stays served and functional; the `1.x` line is
marked deprecated with a removal version.

✅ **Held — the shape of the signal is right.** The successor appears **beside** the predecessor under
the **same name**, so `analyzer` — which searches for `compose` — sees it. Had the provider taken the
tempting route and shipped `compose-v2`, `analyzer`'s query would have returned only the ageing
`1.4.0` forever and the successor would have been invisible to exactly the party that needed it;
§7.1's ban on version-in-the-name is load-bearing, not stylistic. Registry ranking (§3) behaves: an
unpinned consumer re-discovering gets `2.0.0` first, a consumer pinned to `^1` still resolves `1.4.0`,
and the deprecated entry is still returned, marked and carrying its removal version (§7.3d).

🔴 **BROKE (V-4, high — structural).** Two majors are now published under one name — and the bus has
nowhere to put the second one. §4 binds `invoke` to *"MCP tool call / A2A task"*, and an MCP tool
namespace is **flat and keyed by name**: `list_tools` cannot return two tools called `compose`. So
the dual-serving window §7.2 mandates is **unrepresentable on the transport KCB chose**, and the
provider's only escapes are the two the spec forbids or does not define:

- mangle the transport name (`compose_v2`) — which §7.1 rejects, though note it rejects it for
  *discovery*, where the registry matches names; the objection does not obviously extend to a
  transport-local tool id nobody discovers by;
- serve the majors at two different MCP endpoints — but `params.mcp` is a single field (§2), and
  nothing binds an endpoint to a capability version;
- serve only one and break the window.

The contract layer and the transport layer disagree, and §6 (*mapping onto existing surfaces*) does
not reconcile them. The fold that keeps both invariants is to separate the two namespaces
explicitly: the **capability name** is what the registry matches and MUST NOT carry a version
(§7.1 unchanged), while each `params.capabilities` entry MAY carry a **transport binding** — the
tool name / endpoint that major is invocable at — which a consumer reads from the manifest and never
guesses. That is additive, and it is the same move §2 already made for `params.mcp`.
→ KCB §2/§4/§6.

---

## Step 8 — The v1 grant meets v2 (KCB §5, §7.2)

`analyzer` — or, more to the point, an agent acting on `analyzer`'s behalf that has re-discovered and
now prefers the top-ranked `2.0.0` — invokes `compose`. Its token reads `invoke:compose`, issued
while `compose` was major 1. §5 is unambiguous about what should happen: the grant *"authorizes every
**1.x** … and does **not** authorize major 2 … Fail closed."*

*Declared:* `expect: "reject"` (KCS §3).

🔴 **BROKE (V-5, high — structural).** The rule is right and **has no operand**. Enforcing it requires
the provider to know which major the caller intended, and nothing on the wire says:

- the **token** says `invoke:compose` — §5 states the major *"travels with the issuance and is never
  encoded into a new grant name"*, so the wire artifact is version-free by design;
- the **invoke** says `compose` — §4 defines no version, range, or pinned `schema_id` argument;
- the **card** now offers `1.4.0` and `2.0.0` under that one name.

So the provider must *choose* a major for a version-free call. Every available default fails:

| Provider default | Result |
|---|---|
| Highest published | The v1-granted caller silently reaches `2.0.0`. §5's fail-closed rule is inverted into fail-open, and the caller is billed and bound at a major nobody granted. |
| Lowest / oldest | Every caller is pinned to the predecessor forever; the successor is unreachable and the deprecation can never complete. |
| Whatever the grant says | Correct — but the provider does not hold the issuance record; `orchestrator` does, and §5 does not put the major into the token. |

The first row is the whole scenario in one line: **the caller learns of a break by not learning of it
at all.** V-5 and V-4 are the two halves of one hole — V-4 is that the second major has no *address*,
V-5 is that the call has no *operand* to select or authorize one — and a fold must close both or
close neither. The minimal fix: an `invoke` carries the target version or range, the grant's major
travels *in* the token (the grant **name** stays `invoke:compose`, so §5's anti-fragmentation
argument is untouched), and a call whose resolved major is not the granted major is refused at the
gate. Fail closed, before the work, not after the bill. → KCB §4/§5/§7.2.

---

## Step 9 — The deprecation window (KCB §7.3)

`mediastore` deprecates the `1.x` line. Per §7.3a it publishes the successor, the marking, and a
removal version together. Per §7.3b the axis is *"the retiring surface's own versions"* — for a
capability, §7.1's semver. Per §7.3c the removal must be *"at least one minor after the version that
declared the deprecation."*

✅ **Held — the policy's *shape* is right, and the probes bounced.** Extending the window later was
accepted; shortening it was refused (§7.3e). Discovery kept returning the deprecated entry, marked
and dated in versions, ranked below `2.0.0` (§7.3d). Stating the policy once for *every* retiring
surface is vindicated by this pass: the same six clauses governed a capability major here, and govern
KCB's own standalone manifest (§2.2) and KMI's `edl+json` (§4.4) unchanged.

🔴 **BROKE (V-6, medium).** §7.3c's floor is **not a floor** when the retiring party also authors the
axis. `mediastore` declares: *"`compose 1.x` is removed at `2.1.0`."* That is one full minor after the
declaring version, so it is conformant — and `mediastore` may publish `2.1.0` **the following day**.
The window is bounded by a number the subscriber can read and by *nothing else*; its actual length is
entirely at the retiring party's discretion. §7.3e forbids moving the declared version earlier, but
never forbids *arriving* at it sooner, which achieves the same thing.

The rationale §7.3b gives for versions-over-dates is sound *where it was argued* — a spec minor is
published by koine on a public cadence, so "removed at KMI 0.4.0" is genuinely a deadline a consumer
can plan against. It does not transfer to a **provider's own capability semver**, which the
counterparty publishes at will. The distinction is not drawn, and it is the difference between a
deadline and a formality.

Two folds, either sufficient, neither reintroducing wall-clock dates:

- **Raise the floor to the axis's own unit.** A retiring *major* is removed no earlier than the
  successor's **next major** — one full breaking-change cycle of dual service, which costs the
  provider something to reach. "One minor" is the correct floor only for a surface whose version axis
  moves in minors.
- **Make the window observable.** The deprecated entry carries the version at which it *was declared*
  (`deprecated_at`), so a subscriber can see the declared span rather than only its endpoint, and a
  registry can rank on it.

→ KCB §7.3b/c.

---

## Step 10 — Removal lands, and the stream stops (KCB §7.2, §7.3f, §4)

`mediastore` publishes `2.1.0`. The `1.x` obligation ends (§7.3f). `analyzer`'s open `subscribe` —
running continuously since Step 1, never re-discovered, never re-`describe`d because it never had a
reason to — stops delivering frames.

🔴 **BROKE (V-7, high — structural; the headline).** `analyzer` learned of the break **by failing**.
Every signal §7 provides was published correctly and every one of them was published to a surface
`analyzer` had no obligation to read:

| §7 signal | Published where | Reached the live subscriber? |
|---|---|---|
| Successor `2.0.0` beside the predecessor (§7.2) | the card / registry | ❌ only on re-discovery |
| Deprecation marking + removal version (§7.3d) | the card / registry ranking | ❌ only on re-discovery |
| `schema_id` mismatch (§7.2) | recomputed from a fetched card | ❌ only on re-`describe` |
| Removal (§7.3f) | nowhere — it is the *absence* of a surface | ❌ observed as a dead stream |

§7 assumes a **polling** consumer and the bus's most durable binding is a **streaming** one. §7's own
preamble names the gap precisely — a consumer *"may hold that binding for the life of a `subscribe`
(§4)"*, and the manifest *"has no push channel to invalidate what a subscriber already bound to"* —
then answers it with *"this section is what a subscriber holds instead of that channel."* It is not.
Everything §7 offers is pull-side; a subscriber that never pulls holds nothing. The invariant
ADR-0009 puts above all others is violated by a fully conformant provider and a fully conformant
consumer, with no misbehaviour anywhere.

Nothing in §3, §4 or §7 states a re-validation obligation, and the grant makes it worse: `analyzer`'s
token also never expires, so even authorization — the one surface with a natural refresh point —
provides no cadence.

The fold has to put a signal on the axis the binding actually lives on. In descending order of
directness:

- **In-band deprecation/removal notice on the subscription stream.** `subscribe` already delivers
  typed frames (§4); a control frame carrying *"this `(name, major)` is deprecated, removal at V"* is
  the push channel §7's preamble says does not exist — and it costs one frame type. It is also the
  only option that reaches the subscriber *before* the removal without changing anyone's polling
  behaviour.
- **A re-validation obligation with a stated cadence.** A live subscriber MUST re-`describe` at least
  once per declared window, so a conformant one cannot sleep through a deprecation. Weaker: it works
  only if the window's length is itself trustworthy, which V-6 says it is not.
- **Bind the binding's lifetime to something that expires** — a discovery binding, or the grant,
  carries a TTL, and renewal is the re-validation point. Most invasive; touches §5.

→ KCB §4/§7.2/§7.3.

---

## Step 11 — The archival pin survives the removal (KCB §7.4)

`provider:org:trainer` holds a finetuned model produced by an `invoke` on `compose 1.2.0` — the
version from Step 1, now three majors dead. Its KFT job record pins `kft_version` and the
`(name, version)` + port `schema_id`s of the capability that produced it
([`../specs/fine-tuning.md`](../specs/fine-tuning.md) §11.5).

✅ **Held — and the distinction is doing real work.** Nothing about the removal touched the pin. The
model still resolves, still audits, still reproduces against the contract it names, and an evaluation
comparing it to a `2.x`-trained sibling can still state exactly what differed. §7.4's split is
vindicated by the contrast with Step 10: `analyzer`'s live binding needed **protection from change**
and got none; the trainer's pin needed only to stay **resolvable** and did, because §7.3f ends the
obligation to emit or accept, never the ability to read.

✅ **Held under the re-run probe.** Asking the pin to authorize a *re-run* of the finetune was
correctly refused: §7.4 says the pin explains what was trained and does not authorize training again,
and §5's grant rule applies to the new `invoke` like any other — which now means a grant against
major 2, since `1.x` is gone. The pin is a record, not a credential, and the two do not leak into each
other.

🟡 **One thread, not a delta.** The pinned `schema_id`s are only *interpretable* while the
canonicalization that produced them is known — and V-3 has just established that the canonicalization
rule is unversioned. An archival digest computed under KCB 0.4.0's key set cannot be distinguished
from one computed under a later one, so a future auditor cannot verify the pin even though it can
read it. V-3's fold (the rule in the prefix) closes this too; it is noted here because §7.4 is where
the cost of *not* folding it comes due, decades out.

---

## Assertions — as KCS steps (KCS §3, §5)

Encoding this pass as a KCS document ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md))
is what makes it replayable against real providers. The assertions it needs:

| # | Assertion | KCS §5 predicate | Step |
|---|---|---|---|
| 1 | The v1 binding still resolves after a minor widening | `capability_path_exists(mood, score:audio)` | 2 |
| 2 | An unknown output field does not reject the frame | `dangling_ref_tolerated(ref)` — *nearest available; not the same predicate* | 2 |
| 3 | A raise beyond the ceiling is refused, not billed | `cost_within_ceiling(invoke, budget)` + `refused(step)` | 3 |
| 4 | The digest moves on a shape edit and not on a re-price | — **none** | 3, 4 |
| 5 | A digest change at an unchanged version is caught | — **none** | 4, 5 |
| 6 | The successor is discoverable beside the predecessor | `capability_path_exists(…)` — *cannot express "both, ranked"* | 7 |
| 7 | The v1 grant does not reach v2 | `refused(step)` with `expect: "reject"` | 8 |
| 8 | The deprecated entry is returned, marked, ranked below | — **none** | 9 |
| 9 | The live stream survives to the declared removal | `always_completes(scenario)` — *inverted; asserts liveness, not notice* | 10 |
| 10 | The archival pin still resolves past removal | `resolves_to(local, canonical)` | 11 |

🟡 **BROKE (V-8, cleanup — lands in KCS, not KCB).** Four of the ten have **no predicate**, and three
more are borrowed from a neighbouring meaning. KCS §5's control-plane group
(`capability_path_exists`, `cost_within_ceiling`, `tier_resolved`, `dangling_ref_tolerated`,
`refused`) predates KCB §7 entirely, so the versioning surface — *this binding survived*, *this digest
moved / did not move*, *this deprecation was visible before its removal* — is unassertable. The
scenario is expressible in **prose** and not in the **format**, which is the same gap
[`kcs-format-stress.md`](kcs-format-stress.md) found by construction. KCS is Ratified 0.2.0, and its
own open question 1 (*"a fixed vocabulary vs. a small predicate DSL… Leaning: fixed core + an escape
hatch"*) is exactly where this lands: a fixed core plus an escape hatch would have absorbed all four
without a spec bump. Filed as **evidence for that question**, not as a demand on a ratified spec.
→ KCS §5/§7.1.

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **V-5** | **High (structural)** | §5's *grant binds to `(capability, major)`* has no operand: the token is version-free by design, `invoke` (§4) carries no version, and both majors answer to one name — so a provider defaulting to "highest published" lets a v1-granted caller silently reach v2. Fail-closed inverts to fail-open. | An `invoke` carries the target version/range; the granted **major travels in the token** (the grant *name* stays `invoke:compose`); a resolved major outside the grant is refused at the gate. | KCB §4/§5/§7.2 |
| **V-4** | **High (structural)** | The mandated dual-serving window is unrepresentable on the chosen transport: MCP tool namespaces are flat and name-keyed, so two majors cannot both be `compose`, while §7.1 forbids the name-mangling that would fix it and §2 has one `mcp` endpoint field. | Separate the namespaces: the **capability name** stays version-free for discovery (§7.1 unchanged); each `capabilities[]` entry MAY carry a **transport binding** (tool name / endpoint) for its major, read from the manifest and never guessed. | KCB §2/§4/§6 |
| **V-7** | **High (structural)** | Every §7 signal is **pull-side**, but the bus's most durable binding (`subscribe`, §4) never pulls, and no clause obliges a live subscriber to re-`describe` or re-discover — so a conformant subscriber sleeps through successor, deprecation and removal alike and learns by a dead stream. Violates ADR-0009's central invariant. | Put the signal on the binding's own axis: an in-band deprecation/removal **control frame** on the subscription stream (the push channel §7's preamble says is missing); optionally a stated re-validation cadence, or a TTL on the binding/grant. | KCB §4/§7.2/§7.3 |
| **V-2** | **High (structural)** | The `schema_id` is blind on **knowledge** ports: §2.1's shape key `shape` holds a free-form *name*, not a structure, and koine has no shape registry — so redefining the payload behind an unchanged name yields a byte-identical digest. Lands exactly on delta F's cross-plane leg. | Either **register** shape names with immutable signatures (the [`../registry/`](../registry/) relation rule), or add a `payload_schema_id` over the payload declaration. | KCB §7.1/§2.1, [`../registry/`](../registry/) |
| **V-3** | Med-High | The canonicalization is **unversioned**: §7.1 step 1 drops keys outside §2.1's *current* vocabulary, so growing that table in any future minor makes provider and consumer digest the same port differently — and §7.2 converts the disagreement into a non-recoverable "silent mutation". *Ignore unknown fields* and *hash only known fields* cannot both hold of one key. | Carry the canonicalization rule in the prefix (`sha256/kcb1-…`), extending §7.1's own "a future algorithm is a new prefix" from the hash to the key-set rule; an unrecomputable digest reads as *no cross-check available*, never as a defect. | KCB §7.1/§7.2 |
| **V-6** | Med | §7.3c's "at least one minor" is no floor when the **retiring party authors the axis**: declaring `1.x` removed at `2.1.0` is conformant and `2.1.0` may ship the next day. The versions-over-dates rationale holds for a *spec* minor (public cadence) and does not transfer to a provider's own semver. | For a retiring **major**, the floor is the successor's **next major**; and/or the deprecated entry carries `deprecated_at` so the declared span — not only its endpoint — is observable. | KCB §7.3b/c |
| **V-1** | Med | "A cost change is never silent" is asserted, not mechanized: the caller gates against its cached price and the provider evaluates the then-published one, with the invoke carrying neither — so the caller learns of a raise by refusal, and the provider cannot tell acceptance from staleness. | The invoke carries the **quoted** cost (§3 path search already returns it); the provider fails closed on a **quote mismatch**, which names the real condition. | KCB §3/§5 |
| **V-8** | Cleanup | KCS §5's control-plane predicates predate KCB §7, so four of this scenario's ten assertions have no predicate and three borrow a neighbour's meaning — the pass is expressible in prose but not in the format. | Evidence for KCS open question 1 (*fixed core + escape hatch*); no demand on the ratified spec. | KCS §5/§7.1 |

**Not deltas — what this pass tried to break and could not.** The **minor tier** survived a
three-way widening plus an added output type, because *ignore-unknown-fields* is normative and the
media plane passes references rather than values (Step 2). The **exclusions** from the digest are
right in both directions: a re-price and an editorial edit produced no movement, a shape edit did
(Steps 3, 4). The **canonicalization** absorbed key-reordering and the absent-vs-empty pair without a
false alarm (Step 4). **Successor-beside-predecessor** and the ban on version-in-the-name are
load-bearing and were vindicated (Step 7). The **archival pin** survived three majors and a removal,
and correctly refused to authorize a re-run (Step 11). And the **deprecation policy's shape** — one
set of clauses for a capability major, a media type and a manifest location alike — held under a
capability major, which is the surface it had never been applied to.

Also noted and deliberately not filed: the registry is the only party holding a card's before-and-
after across crawls, so it could flag a digest-without-a-bump fabric-wide at no new contract surface
(Step 4). That is an *option for the fold*, not a gap in the contract.

---

## Verdict

**§7's model is sound; its coverage is not.** Nothing in this pass argues for a different decision
than ADR-0009 made — semver for intent, digest for identity, successor-never-mutate-in-place — and
several probes that looked like they should break the model bounced off it instead. Every finding is
a **hole in the perimeter**, not a crack in the design, and every proposed fold is additive.

The perimeter fails in three places, and they are not independent:

- **Nothing carries a version at invoke time (V-5), and nothing can address the second major (V-4).**
  Together these mean the dual-serving window §7.2 mandates cannot actually be operated: the
  successor has no address and the call has no operand. This is the pair that turns fail-closed into
  fail-open, and it is the most urgent.
- **Nothing reaches a streaming subscriber (V-7).** §7 is a pull-side contract protecting bindings
  that never pull. The invariant ADR-0009 rates highest is violated by two conformant parties.
- **The digest does not cover the payload it most needs to (V-2), and cannot be compared across a
  spec minor (V-3).** The falsifiability argument that makes semver trustworthy is weakest exactly on
  the cross-plane leg the fabric exists for, and is self-breaking on any growth of §2.1's vocabulary.

**Blocking for re-ratification: V-2, V-4, V-5, V-7.** Should-fix in the same fold: V-3, V-6.
Cleanup: V-1. V-8 is evidence for a KCS open question and blocks nothing. None requires redesign —
V-4/V-5 add a transport binding and an invoke argument, V-7 adds a control frame, V-2 registers a
name, V-3 extends a prefix rule, V-6 raises a floor, V-1 adds a quote. **KCB stays candidate.**

> **Resolution:** — see *Re-ratification — what this pass gates*, below.

---

## Re-ratification — what this pass gates

The earlier scenarios keep a **Resolution** note naming the spec version that folded their deltas
([`e2e-media-transform.md`](e2e-media-transform.md) for F–L,
[`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) for A–E and KGP-1/2). This pass is younger than
its fold, so the note runs the other way: it records **which spec version this pass gates**, and what
a clean re-run would license.

### Which specs this pass gates

| Spec | Version at the time of this pass | What this pass does to it |
|---|---|---|
| **KCB** ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | 0.4.0, **Candidate** | **The gated spec.** §7 in full (§7.1 canonicalization, §7.2 compatibility, §7.3 deprecation, §7.4 archival pin), plus the §2/§2.1/§3/§4/§5 surfaces §7 was wired through. Eight deltas **V-1…V-8**; four blocking (**V-2, V-4, V-5, V-7**). **Not clean → KCB stays Candidate.** |
| **KCS** ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | 0.2.0, Ratified | **V-8 only, and as evidence, not a demand.** Four of this pass's ten assertions have no §5 predicate; that is input to KCS open question 1 (*fixed core + escape hatch*). No clause is contradicted and **no version moves**. |
| **KMI** ([`../specs/media-interchange.md`](../specs/media-interchange.md)) | 0.3.1, Candidate | **Untouched.** The `score:audio` port is a KMI-typed port, but every assertion here is about the *version* on the capability that carries it, never about the asset envelope, lineage, or timeline. KMI's own gate rides with the media-transform extension re-run, not with this pass. |
| **KFT** ([`../specs/fine-tuning.md`](../specs/fine-tuning.md)) | 0.4.0, Candidate | **Untouched — one confirmation.** §11.5's inheritance is an *informative pointer* to KCB §7.4, and Step 11 is the first thing to exercise it: the pinned `kft_version` survived three majors and a removal, and correctly refused to authorize a re-run. That vindicates the pointer; it changes no KFT clause and **no version moves**. |
| **`../schemas/`** | — | **No shape change, by construction.** This is a behavior test. A `schema_id` is a digest *over* a KCB §2.1 port declaration (§7.1), and koine ships no machine-readable twin of the KCB card extension — the twins that exist (`provenance`, `media-timeline`, `finetune-job`) are data-plane document shapes and no step reads or writes one. Every `schemas/*.json` is byte-unchanged and still parses. |

### What a clean pass would license

On a **clean** re-run — Steps 1–11 all ✅, no delta reopened — the capability-versioning §-edits
([ADR-0009](../decisions/ADR-0009-capability-versioning-deprecation.md) → KCB §7, `chief/54` +
`chief/55`) may return from **Candidate** to **Ratified**, and a KCB changelog entry may cite this
document by name and section as the evidence, exactly as KCB's *Pressure test* § already cites
[`e2e-media-transform.md`](e2e-media-transform.md) for F–L.

Two conditions, and **neither is sufficient alone**:

1. **This break-test re-runs clean.** Which means the four blocking deltas are folded first —
   **V-5** (the invoke carries a version; the granted major travels in the token), **V-4** (a
   per-major transport binding in `capabilities[]`), **V-7** (an in-band deprecation/removal control
   frame on `subscribe`), **V-2** (a registered or digested payload shape on knowledge ports) — with
   **V-3** and **V-6** in the same fold. All are additive, so that fold is a **minor**: KCB **0.5.0**,
   which is already the version §7.3 schedules for removing §2.2's standalone manifest. Steps 5, 7, 8,
   9 and 10 are the ones that must flip; Steps 2, 3, 4, 6 and 11 held and are the regression set.
2. **KCB's other gate closes.** Re-running [`e2e-media-transform.md`](e2e-media-transform.md)
   against the 0.3.0 AgentCard-extension manifest shape is an *independent* gate on the same
   candidate ([KCB §7.5](../specs/capability-bus.md#75-pressure-test-for-this-section) and that
   spec's *Pressure test* §). This pass never re-ran those discovery legs and makes no claim about
   them.

**What this pass does discharge** is §7.5's requirement that the break-test be *written and run* — the
one that did not exist when 0.4.0 published. §7.5 asked for four assertions by name; all four were
run, and **three of them broke** (the v1 binding survives a minor ✅ Step 2; a `schema_id` change
under an unchanged `version` is caught 🔴 **V-2** on knowledge ports, ✅ on media ports; the v1 grant
does not reach v2 🔴 **V-5**; a cost raise fails closed at the ceiling 🟡 **V-1** — it fails closed,
but by refusal rather than by a named quote mismatch). That is the pass doing its job: §7's *model*
is sound and its *perimeter* is not, and the perimeter is repairable additively.

> **Resolution (2026-08-13):** recorded against **KCB 0.4.0**, whose §7 this pass break-tests at
> §7.5's request. Deltas **V-1…V-8** are **open — none folded**, and V-2/V-4/V-5/V-7 are blocking, so
> **KCB stays Candidate** on both of its gates. No other spec version moves: V-8 is evidence for a
> KCS open question, KFT §11.5's archival-pin pointer is *confirmed* rather than changed, and KMI is
> untouched. When a fold lands, amend this note to name the version that closed each delta — as
> [`e2e-media-transform.md`](e2e-media-transform.md)'s Resolution does for F–L — after which this
> document stands as the historical record of what the break-test found.
