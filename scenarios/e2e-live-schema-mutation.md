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
namespace is **flat and keyed by name**: `tools/list` cannot return two tools called `compose`. So
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

## Conformance case — the assertions the folded text requires (KCB 0.5.0)

**Why the table above is not enough after the fold.** The ten assertions above are what the *pass*
needed. Finding **DR-7** (recorded under *Downstream results*) says the encoding
`kcs:live-schema-mutation` came back `green` on 2026-08-24 **over four open blocking deltas**,
because an encoding deliberately does not assert a delta that has not been folded. Re-running that
encoding unchanged against KCB 0.5.0 would therefore assert the same subset and say **nothing** about
§2.4, §4.4, §7.1 step 5 or §7.3g. The encoding must be **extended**, and this is the set it must
carry — the negotiated behaviour stated as things a replay can observe, rather than clauses a reader
can agree with.

Two implementations that both satisfy this table negotiate the same way **without consulting each
other**, which is the property [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) makes
load-bearing: the registry returns an address, peers dial directly, and there is no hub to reconcile
a disagreement about which major was meant.

| # | What a replay must observe | Step | Clause | KCS §5 predicate |
|---|---|---|---|---|
| **F1** | Both majors are dialable: a consumer that read the manifest reaches `1.4.0` and `2.0.0` **deterministically**, at the transport ids their entries declare — and a consumer that guessed one from the name reaches neither. | 7 | §2.4 | — *extension* |
| **F2** | A version-free `invoke` against a provider publishing two majors of one name is **refused for want of a version**, and the refusal **names the majors published**. It is not served at the highest, the lowest, or any. | 8 | §4.4c(3) | `refused(step)` + `expect: "reject"`; the *reason* needs an extension |
| **F3** | An `invoke` carrying `version: "^1"` under a v1 grant runs against `1.4.0` and never `2.0.0` — and the same call with no operand, against a provider serving one major, still runs (the 0.4.9 path). | 8, 2 | §4.4c(1)(4) | — *extension* |
| **F4** | An `invoke` resolving to major 2 under a v1 grant is refused **at the gate, before any work and before any bill** — and the refusal names the granted major and the requested one. | 8 | §4.4c, §5 | `refused(step)`; *before-effect* needs an extension |
| **F5** | A stale `quoted_cost` is refused **quote mismatch** by name; the same call **without** the operand still fails closed against the ceiling, exactly as at 0.4.9. Both, in one run — the second is the regression half. | 3 | §4.4d, §5 | `cost_within_ceiling` + `refused`; the reason needs an extension |
| **F6** | A knowledge payload redefined behind an unchanged `shape`, where the port **does** publish a `payload_schema_id`: the digest **moves**, and the consumer detects it. | 5 | §2.1, §7.1 | — *extension* |
| **F7** | The same redefinition where the port publishes **none**: the consumer reports ***no cross-check available*** and **does not** report *unchanged*. This is the assertion that separates a declared absence from a silent break, and it is the whole of V-2's fold. | 5 | §7.1, §7.2 | — *extension* |
| **F8** | A `schema_id` carrying a canonicalization **rule id the consumer does not know** is read as *incomparable*, **not** as a silent mutation — the same verdict as F7 and not §7.2's non-recoverable one. | 6 | §7.1 step 5, §7.2 | — *extension* |
| **F9** | A port declaring **no** `payload_schema_id` canonicalizes **byte-identically** under `kcb1` and `kcb2`, and its published digest is unchanged across the 0.4.9 → 0.5.0 boundary. The fold moves no digest, and this is how that is checked rather than asserted. | 4, 6 | §7.1 step 5 | `structure_matches(a, b)` (KCS 0.3.0) |
| **F10** | The live subscriber receives a **`successor_published`** frame **before** `2.0.0` is invocable. | 7 | §7.3g | — *extension* |
| **F11** | It receives a **`deprecated`** frame carrying the **removal version**, before the removal. | 9 | §7.3g | — *extension* |
| **F12** | It receives a **`removal`** frame **before** the stream stops — and no run ends with a stream that stopped without one. The Step 10 failure mode is *learning by a dead stream*; this asserts its absence. | 10 | §7.3g, §7.2 | `always_completes(scenario)` is *inverted*; the ordering needs an extension |
| **F13** | A retiring **capability major** declaring a removal earlier than the successor's **next major** is non-conformant — while a koine-spec-axis surface declaring one full minor is conformant. Both halves, or (c)'s split is untested. | 9 | §7.3c | — *extension* |

**The cost of this table is V-8's, measured.** Ten of the thirteen have **no KCS §5 predicate**, and
two of the remaining three borrow a neighbour's meaning — the same gap the pass already recorded, at
roughly twice the size, because a folded clause asserts more than an unfolded one. That is not a
demand on KCS: **KCS §7 open question 1** already cites V-8 by name as evidence for *a fixed core plus
an escape hatch*, and the 2026-08-24 run declared five console extensions and reported them, which is
the escape hatch working. The extension is built the same way — **declared console extensions,
reported as such**, never smuggled into §5 — and **no KCS version moves** for it.

**Downstream obligation, named here rather than left to be found.** This extends an **existing**
encoding and adds no file to [`.`](README.md), so the set-equality the downstream encoding set is held
to against `scenarios/*.md` is **unaffected** — no test breaks by this section existing. What *is*
owed downstream is the extension itself: `kcs:live-schema-mutation` asserts assertions 1–10 above and
must come to assert **F1–F13** before a re-run can discharge KCB's §7.5 count. It is downstream work
under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and it is **unowned** — and as of
**2026-09-03** it is the *only* artefact gap left on this side, since **DR-11, DR-12 and DR-13 are
closed** (all three encoded downstream on 2026-08-26; verified by running the gate at `agora`
`c971fc2`). Those three were *"no document at all"*; this one is *"a document that predates the
fold"*, which **DR-7** is the record of, and it is the harder of the two to notice. Until it lands, a green
`kcs:live-schema-mutation` remains evidence for what it encodes and for nothing else.

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


> **Resolution:** — see *Fold status*, immediately below, and *Re-ratification — what this pass
> gates*. The verdict above is the record of the **pass**, stated at the version it ran against; the
> deltas were folded on 2026-08-26 at **KCB 0.5.0**, and KCB is still Candidate — on a re-run, not on
> these findings.

---

## Fold status — V-1…V-8 re-read against the folded spec (2026-08-26)

The fold landed as `chief/86-fold-the-capability-versioning-breaks`: **KCB 0.5.0**, a minor, and no
other spec version moves. What each disposition is and *why it stops where it stops* is reasoned in
[`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md);
what follows is this document's own re-read — each finding put back against the folded text, saying
whether the break it recorded still reproduces.

**A fold does not close a gate.** KCB stays **Candidate**: the count this pass *is* becomes a
**re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text**, which has not happened, and which
per **DR-7** needs the extended encoding of *Conformance case* above before it could assert anything
about the fold. Nothing here may be cited as a pass.

| # | Folded in | Does the step's break still reproduce? |
|---|---|---|
| **V-5** | KCB 0.5.0 **§4.4a–c** + **§5** | **No.** Step 8's version-free call no longer has a wrong answer to choose between: an `invoke` may carry a `version` operand, the granted major is readable inside the token (the grant's `invoke:compose` **name** unchanged, so §5's anti-fragmentation argument is intact), and where neither is present and two majors are published the provider **refuses for want of a version** — with *highest published*, the choice that inverted fail-closed into fail-open, forbidden by name. A provider serving one major answers a bare call exactly as it did at 0.4.9, which is what keeps the fold additive. **Deliberately unspecified:** token format, issuance, rotation (§5's own boundary, unmoved), and any negotiation protocol — a refusal is not a counter-offer. |
| **V-4** | KCB 0.5.0 **§2.4** (+ **§2**, **§6**, **§4.1**) | **No.** Step 7's second major has an address: each `params.capabilities[]` entry MAY declare a transport `binding`, read from the manifest and **never guessed**, and a provider serving two majors that resolve to one transport id is non-conformant rather than merely stuck. The two namespaces are separated in terms — the capability **name** stays version-free because the registry matches it (§7.1 untouched), the transport id is local and nobody discovers by it. **V-4 and V-5 were two halves of one hole and are folded together**: an address with no operand still leaves the provider choosing, an operand with no address cannot route the choice. |
| **V-7** | KCB 0.5.0 **§7.3g** (riding **§4.2d**) | **No, for a stream.** Step 10's subscriber is now told: `successor_published`, `deprecated` (carrying the removal version) and `removal`, each **before** the fact it announces, on §4.2d's **existing** in-band channel — which already required that a V-7 fold ride it rather than mint a second. A producer that stops a stream at removal with no preceding frame is non-conformant, so *learning by a dead stream* is a defect with a name. **Open by design:** the frame rides a stream, and Step 1's other two binding forms have none — a cached **discovery binding**, and a **grant**, which does not expire. §7.3g states that boundary rather than implying it closed; the remainder is **DEFER-D**, whose trigger is a break driven through a consumer that discovered once, never subscribed, and invokes on a cadence of its own. |
| **V-2** | KCB 0.5.0 **§2.1** + **§7.1** | **No — and read the direction precisely.** Step 5's redefinition behind an unchanged `shape` is still *possible*; what is closed is that it can be **silent**. A knowledge port declaring a bare `shape` and no `payload_schema_id` now establishes **routing** identity and **not** payload identity, and a consumer MUST read it as §7.1's own *no cross-check available* — the failure was never the missing digest, it was the consumer believing the digest it held covered the payload. A provider that wants the cross-check publishes a `payload_schema_id`; none is obliged to. **Rejected on the record:** the **shape registry**, because it would mint a commons two authority domains must agree on before exchanging a knowledge port — against KINP §3.4's *one deliberately non-federated commons* and ADR-0007. Its re-open trigger is stated in the disposition record. |
| **V-3** | KCB 0.5.0 **§7.1 step 5** | **No, and it had to land in this fold.** The digest prefix MAY now carry a canonicalization **rule id**; absent means `kcb1` (0.4.x), this version states `kcb2` (`kcb1` + `payload_schema_id`), and a port declaring no `payload_schema_id` canonicalizes byte-identically under both, so **no published digest moves**. An unknown rule id reads *incomparable*, never *mutated*. Not optional given V-2: V-2 grows §2.1's knowledge vocabulary, which is exactly the event V-3 says fires it — folding one without the other would have broken two conformant parties on publication day. Step 11's 🟡 thread closes with it: an archival digest is interpretable because the rule that produced it can be named. |
| **V-6** | KCB 0.5.0 **§7.3c** | **No, on the half the break forces.** The floor is now stated **per axis**: a retiring **capability major** — an axis the retiring party publishes at will — waits for the successor's **next major**, so Step 9's *"`1.x` removed at `2.1.0`, shipped tomorrow"* is no longer conformant; a surface whose axis is a **koine spec version** keeps the original one-full-minor floor, where it was argued and is correct. §2.3's and KMI §4.4's declared removal versions are of that second kind and **do not move**. **Deferred:** `deprecated_at` (**DEFER-E**) — a subscriber can still reconstruct the declared span from the successor's version and the removal version under the new floor. |
| **V-1** | KCB 0.5.0 **§4.4d** + **§5** | **No.** Step 3's refusal was already correct and still is; what it could not do was name its condition. An `invoke` may now carry the `quoted_cost` §3's path search returned and the caller actually gated against, and a provider whose then-published cost differs refuses **quote mismatch** — distinguishing *the caller accepted the new price* from *the caller is budgeting against a stale one*. **Not a price lock:** no token, no expiry, nothing reserved; the then-published cost still governs and it still fails closed. |
| **V-8** | — **not folded, closed** | **Yes as a gap, and deliberately.** KCS §5 still has no versioning vocabulary, and this pass's four unexpressible assertions stand — now thirteen, per *Conformance case*. It was filed as **evidence** for KCS §7 open question 1, which cites it by name alongside MA-11; folding a vocabulary into §5 now would pre-empt the question the evidence feeds. **No KCS version moves.** One correction to the finding's own wording: it says *"no demand on the ratified spec"*, and KCS is **0.3.0 Candidate** today, not 0.2.0 Ratified — the disposition is unchanged, the reason is that the question already holds it, not that a ratified spec is off limits. |

**Two corrections this fold owes the pass, recorded rather than worked around.**

1. **Step 3 is in both lists.** *What a clean pass would license* names Steps 2, 3, 4, 6 and 11 as the
   regression set — but Step 3 carries 🔴 **V-1**. What held at Step 3 is the **digest exclusion** (a
   re-price does not re-digest, and must not); what broke is the **quote**. A re-run must treat Step 3
   as a regression check for the exclusion **and** a flip check for the quote, which is why the count
   above reads Steps 3, 5, 7, 8, 9, 10 and the regression set reads 2, 4, 6, 11.
2. **The fold's version prediction held.** Both this document and KCB §7.5 named **0.5.0**, the minor
   §7.3 already scheduled for §2.2's standalone-manifest removal, and that is where it landed — with
   the removal performed in the same publication, because §7.3f makes publishing the declared version
   *be* the removal. That is a deadline arriving, not a fold, and it closes no count.

**What the fold did not touch, on purpose.** Everything under *Not deltas* above is unchanged: the
minor tier under a three-way widening, both digest **exclusions** (`cost` and editorial), the
canonicalization's absorption of key-reordering and the absent-vs-empty pair, successor-beside-predecessor
with the ban on version-in-the-**name**, the archival pin's survival and its correct refusal to
authorize a re-run, and the one-policy-for-every-retiring-surface shape of §7.3. Those are the
regression set for the re-run.

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
   *(All seven folded at **KCB 0.5.0**, 2026-08-26, and V-8 closed where it lands — see* Fold status
   *above. The re-run has not happened, and it is **unowned**. Two amendments this line owes a
   re-runner: the fold took the **digest** route for V-2 and rejected the shape registry on federation
   grounds; and the regression set above mis-files **Step 3**, which carries 🔴 V-1 — the step is a
   regression check for the digest exclusion and a **flip** check for the quote, so the flip list is
   Steps **3**, 5, 7, 8, 9, 10 and the regression set is Steps 2, 4, 6, 11.)*
   **And a clean re-run needs an encoding that can fail.** Per **DR-7** the current
   `kcs:live-schema-mutation` came back `green` over all four blocking deltas because it does not
   assert an unfolded one; re-running it against 0.5.0 would assert the same subset. The extended
   assertion set is *Conformance case* above (**F1–F13**), and building it is unowned downstream work.
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

> **Resolution (2026-08-13, amended 2026-08-26):** recorded against **KCB 0.4.0**, whose §7 this pass
> break-tests at §7.5's request. Deltas **V-1…V-8** were **open — none folded**, and V-2/V-4/V-5/V-7
> are blocking, so **KCB stays Candidate** on both of its gates. No other spec version moves: V-8 is
> evidence for a KCS open question, KFT §11.5's archival-pin pointer is *confirmed* rather than
> changed, and KMI is untouched.
>
> **Amendment (2026-08-26) — the fold landed at KCB 0.5.0**, a minor: **V-2** → §2.1
> `payload_schema_id` + §7.1's *a bare `shape` is no cross-check* reader rule (shape registry rejected
> on the record); **V-4** → §2.4 transport `binding`; **V-5** → §4.4a–c + §5; **V-7** → §7.3g's three
> frames on §4.2d's existing channel; **V-3** → §7.1 step 5's canonicalization rule id; **V-6** →
> §7.3c's per-axis floor; **V-1** → §4.4d's `quoted_cost` and its named refusal; **V-8** closed where
> it lands, in KCS §7 open question 1, at no KCS version. Two remainders are deferred with triggers
> (**DEFER-D**, **DEFER-E**) and one alternative is rejected with a re-open trigger, all in
> [`../docs/reference/capability-versioning-fold-dispositions.md`](../docs/reference/capability-versioning-fold-dispositions.md).
> **KCB stays Candidate** — a fold does not close its own gate — and this pass's count is now a
> **re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text**, using the extended encoding of
> *Conformance case*. This document stands as the historical record of what the break-test found; the
> per-delta re-read is *Fold status*.

---

## Re-run — Steps 3, 5, 6, 7, 8, 9 and 10 walked by hand against KCB 0.5.0 (2026-09-03)

**What this is.** KCB's **count (ii)** — the §7.5 break-test's own gate, which *Fold status* above
turned from *fold the deltas* into *a re-run of the folded text*. This is that re-run, walked **by
hand** against KCB 0.5.0 as published.

**The step list is corrected a second time, and the correction is this walk's first finding.** *Fold
status* recorded that *What a clean pass would license* had mis-filed **Step 3** in the regression set
when Step 3 carries 🔴 **V-1**. It made exactly the same error one step later and did not catch it:
**Step 6 carries 🔴 V-3** (Med-High) and is likewise listed as a step that *"held"*. Both lists are
therefore wrong in the same way, and the corrected reading is:

- **Flip list:** Steps **3, 5, 6, 7, 8, 9, 10** — every step carrying a 🔴.
- **Regression set:** Steps **1, 2, 4, 11** — every step carrying only ✅ or 🟡.

A re-run driven off the published list would have skipped V-3's own step, which is the step the
canonicalization rule id exists for. Recorded here rather than silently walked, because the list is
what a future re-runner will read.

**Method, and why it is not a replay.** **DR-7** is the whole reason: `kcs:live-schema-mutation` came
back `green` on 2026-08-24 over all four blocking deltas, because an encoding does not assert an
unfolded one, and it still asserts assertions 1–10 rather than **F1–F13**. Re-running it against 0.5.0
would say nothing about §2.4, §4.4, §7.1 step 5 or §7.3g. This walk is against the **prose**.

### Per-step verdicts

| Step | What it tests | Verdict |
|---|---|---|
| **1** — What a live subscriber is | §7.2's definition | ✅ **holds** *(regression)*, and its 🟡 is now **stated** rather than latent |
| **2** — A compatible widening | §7.2's minor tier | ✅ **holds** *(regression)* |
| **3** — A re-price | V-1 + the digest exclusion | ✅ **flips**, and the exclusion holds |
| **4** — The unbumped mutation, media port | §7.1/§7.2 | ✅ **holds** *(regression)* |
| **5** — The same mutation, knowledge port | **V-2** | 🟡 **half-flips** → new delta **V-9** |
| **6** — Canonicalization drift | **V-3** | 🟡 **half-flips** → new delta **V-11** |
| **7** — The successor beside the predecessor | **V-4** | ✅ **flips** |
| **8** — The v1 grant meets v2 | **V-5** | ✅ **flips** |
| **9** — The deprecation window | **V-6** | 🟡 **half-flips** — V-6 flips; the *marking* has no carrier (**ADR-0014**) |
| **10** — Removal lands, the stream stops | **V-7** | 🟡 **half-flips** → new delta **V-10** |
| **11** — The archival pin | §7.4 | ✅ **holds** *(regression)*, and its 🟡 thread closes with V-3 |

### Step 1 — What "live subscriber" actually is ✅ *holds (regression)*

The definition is unchanged and still the right one. What changed is the 🟡: the three binding forms
still refresh on different triggers and two still have none, but §7.3g's closing bullet now **names
that boundary** instead of leaving §7's preamble to imply it is closed — a stream has the channel, a
cached discovery binding and a grant do not, and the remainder is **DEFER-D** with a stated trigger. A
latent exposure became a declared one, which is the same move V-2's fold makes at Step 5.

### Step 2 — A compatible widening ✅ *holds (regression)*

The three-way widening still rides the minor tier, *ignore-unknown-fields* is still normative, and the
by-reference media plane still absorbs an added output `media_type`. §7.2's table gained two rows at
0.5.0 (an added optional `payload_schema_id`; a changed transport `binding`) and both are **minor / does
not break**, so nothing in this step's tier reading moves. The three adversarial probes were re-run and
bounced identically.

### Step 3 — A re-price ✅ *flips, and the exclusion holds*

**The regression half.** §7.1 step 1 still drops `cost` — and now `volume`, `effect`, `binding` and the
capability's own `version` — before hashing. A re-price and an editorial edit produce byte-identical
digests; a shape edit does not. The exclusion is correct in both directions, as it was.

**The flip.** §4.4d gives *"never silent"* its operand. `analyzer` carries the `quoted_cost` it gated
against (`1200`), `mediastore` refuses **quote mismatch** naming the published `4000`, and the two
conditions V-1 said were indistinguishable are now distinguishable at the party that has to act on
them. The refusal was already fail-closed and still is; what it gained is a cause. Probed for the
obvious over-reach and it is not there: §4.4d states in terms that a quote is **not a price lock**,
reserves nothing, and does not bind the provider, so delta K's enforcement is untouched.

### Step 4 — The unbumped mutation, on a media port ✅ *holds (regression)*

The media-port narrowing is still caught from bytes the consumer already had. The serialization probe
still produces no false alarm — steps 2 and 3 of §7.1 are byte-unchanged. And **F9's property is
confirmed by construction rather than asserted**: this port declares no `payload_schema_id`, step 2
drops an absent key rather than serializing it, so its digest canonicalizes byte-identically under
`kcb1` and `kcb2` and did not move across the 0.4.9 → 0.5.0 boundary. The 🟡 filed here — that nothing
tells the *provider* it is broken — is unchanged and still deliberately not a delta.

### Step 5 — The same mutation, on the *knowledge* port 🟡 *half-flips*

**The half that flips, and it is V-2's own claim.** A `knowledge` port declaring a bare `shape` and no
`payload_schema_id` now establishes **routing** identity and not payload identity, and §7.1 makes the
consumer's reading of it NORMATIVE: *no cross-check available*, and an unmoved `schema_id` is **not**
evidence the payload is unchanged. §7.2 then reinforces it from the other side by forbidding the
consumer to report that port as a silent mutation. The redefinition Step 5 performs is still possible
and is no longer **silent** — a declared absence rather than a false assurance, which is precisely what
the fold claimed. Re-attacked and it holds.

**🔴 BROKE (V-9, high — structural). The cross-check the fold mints is not consumer-verifiable, so
failure mode 2 stays open on the branch that declares one.** Push the probe one step past where V-2
stopped: let `mediastore` **declare** a `payload_schema_id` over `mood-descriptor`, then redefine
`valence` and `arousal` exactly as Step 5 does, and **not** re-digest.

§7.1's own argument for why a digest is worth more than a version is *"Falsifiability is the point.
A consumer recomputes the digest from the card it fetched itself (`describe`, §4) and compares it
against the published value. The digest is a **fact** the consumer can check from bytes in hand; the
`version` is a **claim** the provider makes."* That argument does **not** extend to
`payload_schema_id`, on two independent grounds:

- **The bytes are unreachable.** §2.1 defines the value as a digest *"over the participant's own
  canonical declaration of the payload that port carries."* That declaration is not on the card, and
  **no KCB verb retrieves it.** `describe` fetches the AgentCard plus `tools/list` for *tool* schemas;
  `fetch` is a CAS GET by `asset` id; `invoke` and `subscribe` carry payloads, not declarations. A
  consumer has nothing to recompute from.
- **The rule is unstated.** §7.1 fixes a five-step canonicalization for `schema_id` and fixes **none**
  for `payload_schema_id`. Two providers declaring the same payload have no reason to produce the same
  digest, and one provider re-serializing has no rule that stops it drifting — the two properties §7.1
  opens by naming, for the digest one step up.

So a declared `payload_schema_id` is a **claim in digest clothing**: it moves when an honest provider
re-digests, and it does not move when a careless one does not. The careless case is **failure mode 2** —
*a schema edited without a bump* — which is the failure §7 exists for and which §7.1's chain otherwise
catches, because step 1 keeps `payload_schema_id` inside the port digest so a moved payload digest moves
the port digest at a moved version. That chain is sound **above** the root and unverifiable **at** it.

And the consumer is left worse placed than on the branch V-2 fixed, not better: on a bare `shape` it is
told, normatively, that it has no cross-check; on a declared `payload_schema_id` it is told the cross-
check exists, and §7.1 calls it *"the cross-check"* in terms. That is the consumer *"believing the
digest it held covered the payload"* — §7.1's own diagnosis of what actually failed at Step 5 —
reinstated on the branch a provider takes when it is trying to do the right thing.

*Bounded:* this reopens **no** part of V-2's disposition. The shape registry stays rejected on its
federation grounds (KINP §3.4, ADR-0007), and the *no cross-check available* default stays correct. Two
additive folds are available and neither mints a commons: state a canonicalization for
`payload_schema_id` and a route by which a consumer may obtain the declaration it covers (an
`invoke`-able capability the provider publishes, or a `fetch`-able `asset` — both surfaces exist); or,
minimally, state in §7.1 that a `payload_schema_id` a consumer cannot recompute is **provider-attested**
and carries the evidentiary weight of a `version`, not of a digest — which costs one sentence and stops
the section claiming falsifiability it does not have. → KCB §7.1/§2.1.

### Step 6 — Canonicalization drift 🟡 *half-flips*

**The half that flips.** V-3's exact scenario is the event that actually happened: 0.5.0 grew §2.1's
knowledge-port vocabulary by one term. §7.1 step 5 absorbs it — a rule id in the prefix, **absent means
`kcb1`**, this version states `kcb2`, an unknown rule id reads *incomparable* rather than *mutated*, and
§7.2's third bullet holds the non-recoverable verdict to *"the same rule, the same port, a moved digest,
an unmoved version."* The 0.4.x consumer and the 0.5.0 provider of Step 6 no longer break each other,
and — the stronger property — **no published digest moved**, because a port declaring no
`payload_schema_id` canonicalizes byte-identically under both rules. Checked at Step 4 rather than
assumed.

**🔴 BROKE (V-11, medium-high). The rule id is `MAY`, and the case that needs it is the one with no
`MUST`.** §7.1 step 5 states two obligations and they are asymmetric:

- *"A `schema_id` **MAY** carry a canonicalization rule id in its prefix … An **absent** rule id means
  `kcb1`."*
- *"a provider **MUST NOT** emit a `kcb2` prefix"* for a port that declares no `payload_schema_id`.

There is a MUST NOT for the branch that does not need the rule id and **no MUST for the branch that
does**. A conformant 0.5.0 provider may therefore declare a `payload_schema_id` — canonicalizing under
`kcb2`, since step 1 keeps that key — and publish the result under a bare `sha256-…` prefix, which the
section defines as meaning `kcb1`. The digest is then **mislabelled**: it says it was computed by a rule
that drops the very key it includes.

What that costs is exactly V-3's verdict, restored. A consumer on either rule recomputes under `kcb1`
because the prefix told it to, gets a different value from the published one, and lands on §7.2's
*silent mutation* — the verdict the table makes non-recoverable and which §7.1's *incomparable* branch
cannot reach, because nothing marked the digest incomparable. Two conformant parties break each other
at an unchanged version, which is the sentence V-3 was filed to make impossible.

*It is not a reading problem.* §7.1 does say *"Re-interpreting `kcb1` or `kcb2` is non-conformant"*, and
one can argue a mislabel is a re-interpretation — but that sentence is about **re-defining a named
rule**, not about **omitting the name**, and the section's own default (absent = `kcb1`) makes the
omission a positive statement rather than a silence. A rule whose enforcement depends on a reader
preferring the charitable reading is not enforcing anything.

*The fold is one word.* Make the rule id **REQUIRED** wherever the canonicalization used is not `kcb1` —
i.e. the mirror of the existing MUST NOT — so that absent-means-`kcb1` is a fact rather than a
convention. It moves no published digest (every digest published to date is `kcb1` and stays prefix-free)
and it changes no key set. → KCB §7.1 step 5.

### Step 7 — The successor published beside the predecessor ✅ *flips*

The second major has an address. §2.4 gives each `params.capabilities[]` entry an optional transport
`binding`, read from the manifest and **never guessed**, and makes a provider serving two majors that
resolve to one transport id **non-conformant** rather than merely stuck — so §7.2's dual-serving window
is operable on a flat, name-keyed MCP namespace for the first time. The two namespaces are separated in
terms: the capability **name** is what the registry matches and still MUST NOT carry a version, and the
transport id is local and nobody discovers by it, so §7.1's ban is untouched. Probed three ways and each
escape route the pass identified is now closed or explicitly permitted: name-mangling the *transport* id
is permitted and name-mangling the *capability* is still forbidden; two endpoints are available via
`binding.endpoint` rather than blocked by a single `params.mcp`; and serving only one major is now a
stated non-conformance instead of a silent one.

The registry-side half of this step is where **ADR-0014** first touches this walk, and it is stated
under Step 9 where the marking is published.

### Step 8 — The v1 grant meets v2 ✅ *flips*

The rule has an operand. §4.4a puts an optional `version` on `invoke`, §4.4b makes the granted major
readable inside the token with the grant's `invoke:compose` **name** unchanged, and §4.4c states the
resolution exhaustively — operand, else grant, else **refuse for want of a version** — with *highest
published* forbidden **by name** as the fail-open inversion this step found. Four probes:

- Version-free call, two majors published → refused, naming the majors. Not served at either.
- `version: "^1"` against a major-2 grant → resolves major 1, outside the granted major, refused **at
  the gate** naming both. Before the work, not after the bill.
- A grant whose major the provider cannot read → §4.4b routes it to case (c)(3), a grant with no
  readable major, which is not authorization for anything. Fail-closed, and it means §5's deliberate
  silence on token *format* costs this rule nothing.
- After Step 10's removal, a version-free call from the v1-granted caller against the one surviving
  major → §4.4c(4) resolves major 2, which is outside the grant, and §5 refuses. Fail-closed.

*One thing this step does not reach, and it is Step 1's of the media-transform pass.* §4.4c(2) —
resolve to the **granted** major — is correct as an authorization rule and is silent as a *selection*
rule: it can disagree with what §3's path search planned, and nothing refuses. That is
[`e2e-media-transform.md`](e2e-media-transform.md)'s **MT-1**, found on KCB count (i) the same day, and
it belongs there because it is a discovery finding rather than a §7 one. Named here so the two counts'
records agree.

### Step 9 — The deprecation window 🟡 *half-flips*

**V-6 flips.** §7.3c now states the floor **per axis**. A retiring **capability major** — an axis the
retiring party publishes at will — waits for the successor's **next major**, so `mediastore`'s *"`1.x`
removed at `2.1.0`, shipped tomorrow"* is non-conformant arithmetic; a surface whose axis is a **koine
spec version** keeps the one-full-minor floor, where it was argued and is right. §2.3's and KMI §4.4's
declared removals are of the second kind and do not move, as the fold said. §7.3e's ratchet still holds
under probe: extending later is a fresh declaration, shortening is refused.

**🔴 The marking has no carrier — [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md),
reproduced with a single registry.** §7.3a requires a deprecation to publish *"an explicit deprecated
marking on the predecessor"* and a **removal version**; §7.3d requires discovery to keep returning that
entry *"marked, and carrying its removal version"*; and §3's ranking bullet requires the registry to
rank it below any non-deprecated entry *"while still returning it, marked and carrying its removal
version."* Three normative clauses read a value that **no field carries**. §2's `params.capabilities[]`
entry is `name`, `version`, `binding`, `inputs`, `outputs`, `cost`, `effect`, `volume` — there is no
deprecated marking and no removal version on it — and §3's 0.4.9 response shape adds `served_by`,
`observed_at` and `incomplete[]`, which are attribution and completeness, not status.

This is the clause ADR-0014 decided on 2026-08-26 and deliberately left unwritten, and the ADR says it
*"lands with counts (ii) and (iii)"*. Count (iii)'s re-run met it on 2026-09-03 at the **federated merge
seam** — §3.1(d)'s converse merging a stale and a fresh attribution into one entry whose marking is
undefined. **This walk establishes that it is not a federation finding at all**: it reproduces here with
one registry, one authority domain and no peering anywhere in the cast, because the carrier is missing at
the base and §3.1(d) merely makes the consequence worse. That widens what ADR-0014's fold must do rather
than changing it — the ADR already decides *"the marking gets a carrier extending MA-8's response
shape"* — and it means the clause is a **precondition of this count**, not only of count (iii).

*Where the marking does have a carrier, and the asymmetry is the point.* §7.3g's `deprecated` frame
carries the removal version to a live `subscribe`. So the **push** side of the deprecation is
mechanized and the **pull** side — the one §7.3d, §3 and (a) all state, and the one every non-streaming
consumer uses — is not. A subscriber is told; a re-discoverer reads a field that does not exist.

### Step 10 — Removal lands, and the stream stops 🟡 *half-flips*

**V-7 flips, for a stream.** §7.3g puts three named frames on §4.2d's **existing** in-band channel —
`successor_published`, `deprecated` with its removal version, and `removal` — each emitted **before** the
fact it announces, and makes a producer that stops a stream at removal with no preceding `removal` frame
**non-conformant**. *Learning by a dead stream* is now a defect with a name, and ADR-0009's central
invariant is met on the binding form that violated it. Two properties were probed and hold: §4.2d's
one-channel rule is honoured (no second mechanism is minted, which §4.2d required in terms), and the
frames compose across §3.1 federation unchanged, because the binding and therefore its channel run
directly between the two peers. §7.3g's *"what this does not reach"* bullet states the two binding forms
it does not reach rather than implying they are closed — **DEFER-D**, with a trigger.

**🔴 BROKE (V-10, medium — carrier). Three clauses route a normative MUST to §7.3g's channel; §7.3g
names three frames and none of them is two of those three.** §4.2d mints one control channel and forbids
a second. Three sections then delegate a signal to it, and only one of them defines a frame:

| Section | What it says a live subscriber is told | Frame in §7.3g? |
|---|---|---|
| §7.3g | successor published; deprecated + removal version; removal | ✅ all three |
| §7.2's `binding` row / §2.4 | *"a live `subscribe` MUST be told on §4.2d's channel (§7.3g), never left to a failed dial"* — the bound major's transport `binding` changed | ❌ **none** — `successor_published` carries a *successor's* `binding`, never the bound one's |
| §4.3a | *"Where a capability's class changes while a `subscribe` binding is live, the producer signals it on the §4.2d control channel"* | ❌ **none** ([`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md), **AP-9**) |

§4.2d's own rule is what makes this a gap rather than a licence: *"A producer that receives an unknown
frame MUST ignore it; a subscriber MUST tolerate a producer that never sends one."* A frame nobody names
is a frame every conformant subscriber may ignore, so an undefined signal and an absent one are the same
signal — and §7.3g's contrasting property, that *"a producer that emits none is now **detectable**
rather than merely silent, because the frames are named and a scenario can assert their absence (KCS
§5)"*, is exactly what a nameless frame does not have.

**And the promise fails for every binding form, not just one.** §2.4 says a `binding` change never leaves
a consumer at a failed dial. But a consumer holding an open `subscribe` **has** the channel and does not
dial — a stream is pushed — while the consumer that *does* dial is one holding a cached **discovery
binding**, which §7.3g's own closing bullet says the channel does not reach (DEFER-D). So the party with
the channel has no need of the frame and the party with the need has no channel: the obligation is
stated at neither. This is a genuine seam between two folds that landed on one day — V-4's §2.4 and
V-7's §7.3g — and it is the same **class** as ADR-0014's: a normative consequence attached to an operand
deliberately kept **outside** the `schema_id` digest, with no carrier.

*Severity, stated honestly.* Medium, not blocking. A failed dial is a failure, not a wrong answer, and
re-`describe` recovers it — so nothing here inverts fail-closed. What it costs is a stated MUST that no
implementation can satisfy and no scenario can assert, on the exact axis §7.2 rates highest.

*The fold is additive and small:* §7.3g's frame table gains a `binding_changed` frame on the bound
`(name, major)` (and a `class_changed` frame for §4.3a, or one generic `entry_changed` frame naming the
field that moved and its new value, which is the shape ADR-0014's carrier wants for the marking too);
alternatively §7.2's row and §2.4's sentence are narrowed to say what is actually true — that a
`binding` change is met at re-discovery, and DEFER-D covers the rest. Either is one edit. → KCB
§7.3g/§7.2/§2.4.

### Step 11 — The archival pin ✅ *holds (regression)*

Unchanged, and its 🟡 thread closes. The pin still resolves past three majors and a removal (§7.3f ends
the obligation, never the readability) and still correctly refuses to authorize a re-run (§7.4 + §5).
The thread — that a pinned `schema_id` is only *interpretable* while the canonicalization that produced
it is known — is answered by §7.1 step 5, which is why that clause names §7.4 as *"where the cost of not
stating the rule would have come due."* **V-11 qualifies that closure**: an archival digest published
under `kcb2` with an absent rule id is interpretable only by guessing, decades out, which is the exact
condition the thread was filed for.

### Findings — from the re-run

| # | Severity | Gap | Fold | Spec |
|---|---|---|---|---|
| **V-9** | **High (structural)** | `payload_schema_id` is not consumer-verifiable: the payload declaration it digests is reachable by no KCB verb, and §7.1 states a canonicalization for `schema_id` and none for it. So on the branch that **declares** one, §7.1's failure mode 2 — a payload edited without a re-digest — stays open, while the consumer is told a cross-check exists. §7.1's own *falsifiability* argument does not extend to the operand V-2's fold minted. | State a canonicalization for `payload_schema_id` and a route by which the declaration it covers can be obtained; **or** state that a `payload_schema_id` the consumer cannot recompute is **provider-attested** and carries a `version`'s evidentiary weight, not a digest's. Reopens no part of V-2's disposition. | KCB §7.1/§2.1 |
| **V-11** | Med-High | §7.1 step 5's rule id is **`MAY`**, with a `MUST NOT` on the branch that does not need it and no `MUST` on the branch that does — so a `kcb2`-canonicalized digest may be published under the absent prefix the section defines as meaning `kcb1`, and a consumer recomputing under the rule it was told lands on §7.2's non-recoverable *silent mutation*. V-3's verdict, restored through the optionality of V-3's own fix. | Make the rule id **REQUIRED** wherever the canonicalization is not `kcb1` — the mirror of the existing MUST NOT. Moves no published digest and changes no key set. | KCB §7.1 step 5 |
| **V-10** | Med (carrier) | §7.2's `binding` row and §2.4 route a normative MUST to §4.2d's channel *"(§7.3g)"*, and §7.3g's three frames do not include it; §4.3a does the same for an effect-class change (**AP-9**). §4.2d's *tolerate a producer that never sends one* makes an unnamed frame indistinguishable from an absent one, so the signal is unassertable (KCS §5). And *"never left to a failed dial"* is met for **no** binding form: the stream holder has the channel and does not dial, the discovery-binding holder dials and has no channel (**DEFER-D**). | Add the missing frame(s) to §7.3g's table — or one generic *entry changed* frame, which is also the shape ADR-0014's marking carrier wants — **or** narrow §7.2's row and §2.4's sentence to what is true. | KCB §7.3g/§7.2/§2.4 |
| — | — | **ADR-0014 reproduces here, with a single registry** (Step 9): §7.3a(ii), §7.3d and §3's ranking bullet all read a *deprecated marking* and a *removal version* that no field in §2 or §3 carries. Not a new delta — the decided-but-unwritten clause, established by this walk to be a **base** carrier gap rather than a federation one, so it is a precondition of **count (ii)** as well as count (iii). | Write ADR-0014's four-part clause. | KCB §2/§3 |

### What this re-run does and does not close

**Count (ii) does NOT close.** Five of the seven flip steps flip outright — **V-1** (Step 3), **V-4**
(Step 7), **V-5** (Step 8), the stream half of **V-7** (Step 10) and the *declared absence* half of
**V-2** (Step 5) — and the regression set holds in full, including F9's *no published digest moved*
checked by construction at Step 4. **§7's model was never in question and still is not; its perimeter
is repaired in five places and open in three.** Every one of V-9, V-10 and V-11 is a **perimeter** break
of the same kind the original pass found, and every proposed fold is additive.

So the count **changes shape** rather than closing: from *re-run Steps 3, 5, 7, 8, 9 and 10 against the
folded text* to **fold V-9, V-10 and V-11 (additive, KCB-only; no published digest moves, no grant name
moves, no verb added) and write ADR-0014's clause, then re-run Steps 3, 5, 6, 7, 8, 9 and 10** — the
corrected list, which now includes Step 6. It is **unowned**.

**The artefact objection is unchanged and independent.** **DR-7** stands exactly as *Conformance case*
states it: the encoding must come to assert **F1–F13** before a re-run can discharge anything, and
folding V-9/V-10/V-11 will add to that set rather than reduce it. Nothing in this walk touches it, and
nothing in it is discharged by a `green` line.

**No version moves and no clause moves.** §1–§8 are byte-unchanged, no `schema_id` canonicalization
changes, and no published digest moves; the edit is this section, a gate paragraph in
[`../specs/capability-bus.md`](../specs/capability-bus.md) and a changelog entry. **KCB is not
promoted**: clearing none of five is not a promotion, and four clean re-runs would not have been one
either.

---

## Re-run — Steps 5, 6, 9 and 11 walked by hand against KCB 0.5.3 (2026-09-12)

**What this is.** KCB's **count (ii)** again, walked against the first text that carries the fold of
this document's own findings. Two publications have moved the clauses this pass reads since the
2026-09-03 walk, and both were folds of that walk's findings:

- **KCB 0.5.1** wrote [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s
  four-part clause — §2's `deprecated` / `removal_version` fields, carried through §3's `find`
  response **as entry data in every response and not only a federated one**. That was **Step 9's**
  blocker here, and the 2026-09-03 walk is what established it reproduces with a **single registry
  and no peering**, making it a precondition of this count as well as count (iii).
- **KCB 0.5.3** folds **V-9** (§7.1's new NORMATIVE (a)–(e) and the scoped *falsifiability*
  paragraph) and **V-11** (§7.1 step 5's third bullet, plus §7.2's *not a silent mutation* bullet).
  Those are **Steps 5 and 6**.

**What this walk therefore covers, and what it deliberately does not re-attack.** Steps **5**, **6**,
**9** and **11** read clauses that moved; they are walked. Step **4** is a regression check that reads
§7.1 directly, so it is re-checked rather than assumed. Steps **1**, **2**, **3**, **7**, **8** and
**10** read §2.4, §4.4c/d, §5, §7.2's table and §7.3g, **every clause of which is byte-unchanged since
the 2026-09-03 walk** — verified rather than asserted, on the fold's own *no clause moves* claim — so
their verdicts are **restated unmoved**, not replayed. Re-attacking a hand-walk against text that has
not moved produces a second opinion, not a second observation, and this record does not need one.

**Method, and why it is not a replay.** **DR-7** is unchanged and independent: `kcs:live-schema-mutation`
came back `green` on 2026-08-24 over all four blocking deltas, because an encoding does not assert an
unfolded one, and it still asserts assertions 1–10 rather than **F1–F13**. It now predates **three**
publications of the spec it gates. Its exit code is not evidence about this fold either, and nothing
below is discharged by one. This walk is against the **prose**.

### Per-step verdicts

| Step | What it tests | Verdict |
|---|---|---|
| **1** — What a live subscriber is | §7.2's definition | ✅ **holds** — restated unmoved (§7.2's definition byte-unchanged) |
| **2** — A compatible widening | §7.2's minor tier | ✅ **holds** — restated unmoved |
| **3** — A re-price | V-1 + the digest exclusion | ✅ **flips** — restated unmoved (§4.4d, §5 byte-unchanged) |
| **4** — The unbumped mutation, media port | §7.1/§7.2 | ✅ **holds** *(regression, re-checked against the folded §7.1)* |
| **5** — The same mutation, knowledge port | **V-9** | 🟡 **half-flips** — V-9 does not reproduce → new deltas **V-12**, **V-13** |
| **6** — Canonicalization drift | **V-11** | 🟡 **half-flips** — V-11 does not reproduce → new delta **V-14** |
| **7** — The successor beside the predecessor | V-4 | ✅ **flips** — restated unmoved (§2.4 byte-unchanged) |
| **8** — The v1 grant meets v2 | V-5 | ✅ **flips** — restated unmoved (§4.4a–c, §5 byte-unchanged) |
| **9** — The deprecation window | V-6 + **ADR-0014** | 🟡 **half-flips** — the carrier exists and V-6 holds → new delta **V-15** |
| **10** — Removal lands, the stream stops | **V-10** | 🟡 **half-flips** — restated unmoved; **V-10 stands, unfolded** |
| **11** — The archival pin | §7.4 | ✅ **holds** *(regression)*, and its 🟡 thread **closes in full** |

### Step 5 — The same mutation, on the *knowledge* port 🟡 *half-flips*

**V-9 does not reproduce, and both of its grounds are answered.** The **rule** is stated: §7.1(a)
fixes a `payload_schema_id` as `sha256` over the declaration's bytes **as published** — a content
address of a document in the form [KINP §3](../specs/identity.md) gives an `asset` id — with no key
set to name, a SHOULD applying step 3's byte discipline where the declaration is itself JSON, and
step 5's rule id explicitly excluded from its prefix. The **bytes** are settled by checking §4's five
verbs one at a time rather than by assuming an answer either way: `discover` returns addresses,
`describe` returns the card and `tools/list` *tool* schemas, `invoke` and `subscribe` carry payloads
and never declarations of payloads, and **`fetch` can carry it** — because by (a) the digest already
*is* an `asset` address, so a `fetch` self-verifies on arrival (delta G). Re-attacked on the point
that mattered most and it holds: (b) **declines** to claim the cross-provider convergence the five
steps give `schema_id`, and says why claiming it would require KCB to fix the declaration's *format*,
which is the shape registry rejected on federation grounds one paragraph up. The section no longer
calls both digests *the cross-check* and the *falsifiability* paragraph is scoped to the one it is
true of.

**🔴 BROKE (V-12, high — scope). A content address is an integrity instrument, and failure mode 2 is
a staleness failure, so the retrievable branch does not close it either.** Run Step 5's mutation
against (d)'s **good** branch. `mediastore` declares `payload_schema_id = P0` over a declaration `D0`
(`valence` a signed float, `arousal` present), publishes `D0` into a CAS `analyzer` can reach, and
`analyzer` holds the `fetch:asset` grant. `mediastore` then redefines the payload exactly as this
step does — enum `valence`, no `arousal` — and does **not** re-digest.

(d) says that on this branch *"the cross-check is performable end to end and the digest is a **fact**:
fetch the bytes, verify them against the address, read the declaration, compare it against what the
port delivers."* Walk that sentence with the mutation in place:

- **`fetch` returns `D0`.** It must: `P0` addresses `D0`'s bytes and nothing else, and the provider's
  edit did not touch them. A content address **cannot** resolve to the document that superseded it.
- **The verification succeeds.** It always does. Verifying bytes against their own content address is
  a check on the *store*, not on the *provider*, and it cannot fail for the reason failure mode 2
  names. Where a `schema_id` mismatch is the whole signal, a `payload_schema_id` match is no signal.
- **The consumer now holds a stale declaration it cannot tell is stale.** Nothing on this branch
  distinguishes *the provider is still implementing `D0`* from *the provider edited past `D0` and did
  not re-digest* — which **is** failure mode 2, verbatim.
- **The step that would catch it is the one KCB does not define.** *"Compare it against what the port
  delivers"* is not a digest operation: (a) states in terms that the declaration is a document KCB
  does not define, and (b) states that its format is free enough that two participants declaring one
  payload produce two values. So the comparison rests on the consumer being able to parse a document
  of an unfixed format and validate traffic against it, which no clause requires, enables or names a
  format for — and on a `consumes` port there is no arriving traffic to validate at all, so the break
  surfaces only when the consumer's own call fails, which is the *"never learns of a break by failing
  an invoke"* outcome §7.2 exists to prevent.

The asymmetry is the finding, and it is structural rather than editorial. `schema_id`'s falsifiability
works because **the card is live and the digest is published over it**: a stale digest disagrees with
bytes the consumer holds *now*. A `payload_schema_id`'s referent is reached **through** the digest, so
it can never disagree with it. The instrument is sound for what content addresses are for — *these
bytes are those bytes* — and it is the wrong instrument for *are these bytes still the ones you
implement*.

So (d)'s two branches are not *fact* and *claim*; they are *a claim with the document in hand* and *a
claim without it*, and the difference between them is real but smaller than the paragraph states.
**Failure mode 2 is open on both branches**, and §7.1 declares it open on one. That is exactly the
error V-9 recorded — a consumer told a cross-check exists that it cannot in fact perform — moved one
branch over, and it lands on the branch a provider takes when it is doing the most it can.

*Bounded, and it reopens nothing.* (a), (b), (c) and (e) all hold; the *deliberately not done*
paragraph's two refusals stand on their own grounds. **Note precisely what would close this**: a route
to the declaration the provider is **currently** implementing, which is a **live** artifact and
therefore a verb — the sixth verb §7.1 refuses, or the reserved capability name it refuses beside it.
That is the fold refusing to buy currency at the price of a plane-wide addition, which is a defensible
trade and is **not what the text says it did**. The additive fold is therefore to say so: scope (d)'s
*fact* to what a content address establishes, state that failure mode 2 is open on **both** branches
with the retrievable one differing in that the consumer holds a declaration it can argue from, and
point the reader at the re-open condition already written one paragraph down. One §7.1(d) edit. →
KCB §7.1(d).

**🔴 BROKE (V-13, medium — enumeration). (d) reads three of §4.5's four outcomes and the fourth has no
branch.** (d) sends a consumer to the attested branch on *"no holder, no grant, or a
`not-held-not-expected` / `not-held-pending` answer (§4.5)"*. §4.5 (KCB 0.5.2) names **four**
outcomes, and **`refused`** is not in that list. It is the one that matters most for this reading,
because §4.5 says in terms that a rate-limited holder MUST answer `refused` and MUST NOT answer
`not-held-pending` — *a busy holder is not evidence toward no holder remains* — so `refused` is
precisely the answer that must **not** be read as an absence. A consumer meeting it has no stated
branch and two defensible readings: treat the digest as attested, which is **permanent** on evidence
§4.5 says is not evidence, or retry, which no clause bounds. The KMI §7.1(b)(e) egress gate lands on
`refused` too, so the case is not exotic — it is what a consumer in another authority domain meets
first. One clause, folded with V-12: name `refused` and say it is neither branch — the consumer has
learned nothing about the declaration and holds whatever branch it was on. → KCB §7.1(d).

### Step 6 — Canonicalization drift 🟡 *half-flips*

**V-11 does not reproduce.** Step 5 now carries a third bullet written as the **mirror** of the
existing `MUST NOT`, and the mirroring is what makes it hold under attack: both arms are stated by
the **property** that makes them true — emit the rule id where the digest depends on it, never where
it does not — and **neither names a rule**, so they carry to the next rule id §2.1's vocabulary mints
without a re-edit. Probed four ways and each closes: a `kcb2` digest under a bare prefix is
**non-conformant** in terms, and the section says why the omission is a **statement** rather than a
silence (which is why it is a MUST and not a SHOULD); the **correction path** is stated and is shown
not to be a mutation, so a provider cannot defend leaving a mislabel standing on the ground that
fixing it would move a published value; the exception and the `MUST NOT` do not overlap, the exception
being exactly the set the `MUST NOT` covers; and (a)'s exclusion of the rule id from a
`payload_schema_id` prefix does not collide with it, the two digests living in different keys. **No
published digest moves** — checked at Step 4, not inferred.

**🔴 BROKE (V-14, medium-high — the MUST binds the provider and no clause tells the consumer what a
breach looks like).** The fold made the provider's obligation exact and left the consumer reading
0.5.2's text. Let `mediastore` breach it: a knowledge port declaring a `payload_schema_id`,
canonicalized under `kcb2`, published under a bare `sha256-…`. Two things follow, and the second is
worse than the first.

- **The breach is locally detectable and no clause directs the consumer to detect it.** Both facts are
  on the same card — *this port declares a `payload_schema_id`* and *its `schema_id` carries no rule
  id* — so a consumer can conclude *mislabelled, non-conformant* from bytes in hand. Step 5's
  consumer-side bullet does not reach it: it covers *"a rule id it does not know"*, and a bare prefix
  is not an unknown rule id — bullet 1 tells the consumer it **is** `kcb1`, a rule it knows. The
  section hands the consumer the evidence and the opposite instruction.
- **The verdict the fold names for this case is not the one §7.2 states.** Step 5's new bullet
  justifies its MUST by saying a recomputing consumer *"lands on §7.2's silent mutation, the one
  verdict that table makes non-recoverable."* §7.2's non-recoverable verdict is defined over a
  **moved published value**: *"a `schema_id` that differs from the one it bound to at an unchanged
  `version`."* A mislabel produces nothing of the kind — the published value never moves; what
  disagrees is the consumer's **recomputation** against an unmoved published value. And for that
  disagreement **§7 states no verdict at all**: the *falsifiability* paragraph tells a consumer to
  recompute and compare and stops there; §7.2's table governs changes to a published capability; the
  *not a silent mutation* bullet lists two things it is not. So the state a breach produces is
  **undefined** rather than non-recoverable, and two conformant consumers may take opposite actions on
  one card — one treating the capability as unusable, one reading *no cross-check available*, one
  ignoring the mismatch entirely.

*Severity, stated honestly.* Medium-high, not blocking. The MUST is the load-bearing repair and it is
correct; what is missing is its other half, and the failure is a divergence between conformant
consumers rather than an inversion of fail-closed. But note what it costs *this fold specifically*: the
argument for making the naming a MUST rather than a SHOULD rests on a consequence the cited clause does
not deliver, so the strongest sentence in the repair is the one that does not check out.

*The fold is additive and small*, and it is the mirror once more — the consumer's half of a rule whose
provider half is already written: one step-5 bullet giving the reading for a **bare** prefix on a port
whose declaration makes `kcb1` and the required rule differ (today: a knowledge port declaring a
`payload_schema_id`) — *no cross-check available*, never a mutation, and reportable as a
non-conformance — plus naming the verdict for a **recomputation mismatch** generally, which §7 has
never stated and which §7.2's own bullet should own beside its two *not a silent mutation* cases. →
KCB §7.1 step 5, §7.2.

### Step 9 — The deprecation window 🟡 *half-flips*

**The 2026-09-03 blocker does not reproduce.** ADR-0014's clause is written (0.5.1) and the three
clauses that read a marking now name a field: §7.3a(ii)/(iii) names §2's `deprecated` and
`removal_version` as *the* carriers for a retiring capability major and says a deprecation declared in
prose or a `description` string has deprecated nothing; §2 defines both as optional entry fields with
`deprecated` absent reading *not deprecated*; §3 carries them **as entry data in every response**, so
a single-registry deployment gains the carrier without touching MA-8's three registry-generated
fields. Attacked on the single-registry cast this step actually has: **MA-14, MA-15 and MA-16 do not
reach it** — all three live inside §3.1(d)'s converse, which needs two attributions and therefore
peering, and there is none anywhere in this pass. The pull side is mechanized and the asymmetry the
last walk recorded — subscriber told, re-discoverer reading a field that does not exist — is gone.
**V-6 holds under re-attack**: §7.3c's per-axis floor still makes *"`1.x` removed at `2.1.0`, shipped
tomorrow"* non-conformant arithmetic, and §7.3e's ratchet still refuses a shortened window.

**🔴 BROKE (V-15, medium — collision). §7.3a and §2 give one card state two conformant readings.**
`mediastore` marks the predecessor `"deprecated": true` and carries **no** `removal_version`. That is
permitted: §2 makes it a **SHOULD**. The two clauses then disagree about what has happened.

- **§7.3a(a):** to deprecate is to publish (i), (ii) **and** (iii) in the same release, and *"a
  deprecation that names no removal **is not a deprecation**; it is an unbounded promise a subscriber
  cannot plan against."*
- **§2:** *"A `deprecated` entry SHOULD carry it; one that does not is §7.3a's unbounded promise … and
  a consumer MUST read it **as a deprecation** with no planned end, never as a removal that is
  imminent."*

§2 quotes §7.3a's sentence and inverts its verdict, and it is a **strength** collision, not only a
reading one: §2 **permits** by SHOULD what §7.3a says fails to be a deprecation at all. The
consequences are live on this step. §7.3d and §3 rank a deprecated entry below a non-deprecated one —
Registry A reads §2 and demotes, Registry B reads §7.3a and does not, so one query returns two orders
from two conformant registries. §7.3g's `deprecated` frame *"carries the removal version"* and has
nothing to carry. And §7.3c's floor — the V-6 repair this very step validates — has no second operand
to measure, so the one state §7.3a calls *an unbounded promise* is the one state the floor cannot
bound.

*Severity, stated honestly.* Medium. Both readings keep the capability served and both fail safe, so
nothing here inverts fail-closed; what it costs is a ranking a consumer cannot predict and a window
§7.3c cannot floor. It is **MA-15's shape** — a collision between two clauses of one fold, in the
ADR's Decision as much as in the spec — and it reproduces with **one registry and one authority**, as
ADR-0014's carrier gap did. *The fold is one edit and does not reopen the ADR*: make the two clauses
agree by deciding which is true — either `removal_version` is REQUIRED on a `deprecated` entry, and
§7.3a's sentence is the rule, or §7.3a's sentence is narrowed to what §2 permits and the marking alone
constitutes the deprecation with `removal_version` a planning datum. The second is the reading §2 was
written against and the one §3.1(d)(ii) already assumes; either way the other clause moves. → KCB
§2/§7.3a.

### Step 4 — The unbumped mutation, on a media port ✅ *holds (regression, re-checked)*

Re-checked rather than assumed, because §7.1 moved under it. Step 1's kept set is byte-unchanged and a
media port declares no `payload_schema_id`, so it canonicalizes byte-identically under `kcb1` and
`kcb2`; bullet 2's `MUST NOT` and the new bullet 3's **exception** name that same port from opposite
directions and agree, so its digest stays prefix-free. **F9 — *no published digest moved* — is
therefore confirmed by construction for a second fold**, which is the property this step exists to
carry. The mutation is still caught: the digest moves at an unmoved version and §7.2's verdict is
undisturbed.

### Step 11 — The archival pin ✅ *holds (regression), and its 🟡 thread closes in full*

The pin still resolves past three majors and a removal and still refuses to authorize a re-run. The
thread — a pinned digest is *interpretable* only while the rule that produced it can be named — was
answered by V-3's fold and then **qualified by V-11** at the last walk: an archival digest published
under `kcb2` with an absent rule id was interpretable only by guessing, decades out. That
qualification is gone, because the naming is now a MUST exactly where the value depends on it. One
property worth recording on the other digest: an archived **`payload_schema_id`** needs no rule id at
all — (a) makes it a content address, which is interpretable for as long as the bytes exist and is
not a function of any KCB version. On the archival axis the weaker instrument is the more durable one,
which is V-12's finding read from the other end.

### Steps 1, 2, 3, 7, 8 and 10 — restated unmoved

Every clause these steps read is byte-unchanged since the 2026-09-03 walk: §7.2's live-subscriber
definition and its minor tier (Steps 1, 2), §4.4d's `quoted_cost` and §5 (Step 3), §2.4's transport
binding (Step 7), §4.4a–c and §5's token (Step 8), §7.3g's three frames and §4.2d's channel (Step 10).
Their verdicts stand as recorded: Step 3 flips, Steps 7 and 8 flip, Steps 1 and 2 hold, and **Step 10
half-flips with V-10 standing** — §7.2's `binding` row and §2.4 still route a normative MUST to a
frame §7.3g does not name, and the binding form that actually dials still has no channel (DEFER-D).
**V-10 is not folded on this branch**, by design: it is one edit with **BP-8** and **AP-9** and it
gates counts (iv) and (v) as well as this one.

### Findings — from the re-run

| # | Severity | Gap | Fold | Spec |
|---|---|---|---|---|
| **V-12** | **High (scope)** | §7.1(d)'s retrievable branch calls the cross-check *performable end to end* and the digest *a fact*, but a `payload_schema_id` is a **content address**: `fetch` always returns the bytes the digest names, the verification is a check on the store and can never fail for the reason **failure mode 2** names, and the step that would catch it — *compare it against what the port delivers* — rests on a document KCB states in terms that it does not define. A provider that edits the payload and does not re-digest is invisible on this branch too. Failure mode 2 is open on **both** branches and declared open on one. | Scope (d)'s *fact* to what a content address establishes — *these bytes are those bytes* — state failure mode 2 open on both branches, with the retrievable one differing in that the consumer holds a declaration it can argue from, and point at the re-open condition already written for the verb that would buy **currency**. Reopens no part of the V-9 fold. | KCB §7.1(d) |
| **V-14** | Med-High | §7.1 step 5's new MUST binds the provider and **no clause gives the consumer the reading**: a bare prefix on a port declaring a `payload_schema_id` is locally detectable, and the consumer-side bullet covers only *a rule id it does not know* while bullet 1 tells it a bare prefix **is** `kcb1`. And the verdict the fold cites for a breach is not §7.2's: §7.2's non-recoverable case is a **moved published value**, while a mislabel produces a **recomputation** mismatch against an unmoved one — for which §7 states no verdict at all, so conformant consumers diverge. | One step-5 bullet: the consumer's reading for a bare prefix where the required rule is not `kcb1` — *no cross-check available*, never a mutation, reportable as non-conformance — plus the verdict for a recomputation mismatch, beside §7.2's two *not a silent mutation* cases. | KCB §7.1 step 5, §7.2 |
| **V-15** | Med (collision) | §7.3a(a) — *"a deprecation that names no removal is not a deprecation"* — and §2's `removal_version` bullet — SHOULD, and *"a consumer MUST read it **as a deprecation** with no planned end"* — give one card state (`deprecated: true`, no `removal_version`) two conformant readings, and §2 **permits** what §7.3a says is not a deprecation. Two conformant registries rank one query two ways (§7.3d, §3), §7.3g's `deprecated` frame has no removal version to carry, and §7.3c's floor has nothing to measure. Reproduces with **one registry, one authority**. | Decide which clause is true: `removal_version` REQUIRED on a `deprecated` entry, or §7.3a narrowed so the marking alone constitutes the deprecation and the removal version is a planning datum (the reading §2 and §3.1(d)(ii) already assume). One edit; the ADR is not reopened. | KCB §2/§7.3a |
| **V-13** | Med (enumeration) | §7.1(d) routes a consumer to the attested branch on three of **§4.5's four** outcomes and omits **`refused`** — the one §4.5 says a rate-limited holder MUST answer and MUST NOT replace with `not-held-pending`, *a busy holder being no evidence toward no holder remains*, and the one KMI §7.1(b)(e)'s egress gate lands on. A consumer meeting it has no branch: reading it as attested is permanent on evidence §4.5 says is not evidence, retrying is unbounded. | Name `refused` in (d) and say it is **neither** branch — nothing has been learned about the declaration. Folded with V-12 in the same paragraph. | KCB §7.1(d) |

### What this re-run does and does not close

**Count (ii) does NOT close, and it would not have closed on a clean walk at Steps 5, 6 and 9 either
— V-10 stands, unfolded.** That is the plain reading and it is stated first, because the rest of this
section is a list of things that went right.

**What did go right is the fold record, and it is the strongest it has been.** **V-9 and V-11 do not
reproduce**, each re-attacked on the ground it was filed on rather than read for plausibility, and the
0.5.1 carrier closes **Step 9's** blocker with a single registry and no peering — the precondition this
count shared with count (iii). Counting from the original pass, **nine of the eleven deltas this
document has filed are folded and hold under re-attack** (V-1…V-7, V-9, V-11), V-8 is closed where it
lands, and the regression set holds in full with **F9 confirmed by construction for a second fold**.
**§7's model has never been in question across four walks; its perimeter is now repaired in eight
places and open in four.**

**Every new finding is again a perimeter break, and two of the four land on the fold published hours
before this walk.** That makes it the **third consecutive** fold in this repo whose own re-run breaks
on its perimeter rather than its model — after KCB §4.5 (MA-17) and KMI §7.1(d) (MA-19/MA-20) — and
the pattern is worth naming rather than re-discovering: a fold that mints a **mechanism** is checked
hard, and the **claim the prose makes about the mechanism** is not. V-12 is exactly that shape (the
mechanism is right and the sentence describing it is not), V-14 is the recognised *declared
consequence, nothing carrying it* axis on its **consumer** half, and V-15 is **MA-15's** shape, a
collision between two clauses of one fold.

So the count **changes shape** rather than closing: from *fold V-9, V-10 and V-11 and write
ADR-0014's clause, then re-run Steps 3, 5, 6, 7, 8, 9 and 10* to **fold V-10 (one edit with BP-8 and
AP-9), V-12 + V-13 (one §7.1(d) edit), V-14 (one §7.1 step 5 / §7.2 edit) and V-15 (one §2/§7.3a
edit), then re-run Steps 5, 6, 9 and 10**. ADR-0014's clause is **struck from this count's
preconditions** — it is written and Step 9 confirms it carries here. Every remaining item is additive
and KCB-only, and all four are **unowned**.

**The artefact objection is unchanged and independent.** **DR-7** stands exactly as *Conformance case*
states it: the encoding must come to assert **F1–F13** before a re-run can discharge anything, and
folding V-12…V-15 adds to that set rather than reducing it. It is **owned since 2026-09-11 (agora)**
and nothing in this walk touches it.

**No version moves and no clause moves.** Every normative clause of §1–§8 is byte-unchanged — §7.1's
five steps, (a)–(e) and the *falsifiability* paragraph included — no canonicalization changes, and no
published digest moves; the edit is this section, a gate paragraph in
[`../specs/capability-bus.md`](../specs/capability-bus.md) and a changelog entry. **KCB is not
promoted and is not promotable**: count (iii) and ADR-0013's **W3** stand regardless of anything here.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**Run of 2026-08-24** · encoding `kcs:live-schema-mutation` · KCS 0.3.0 · evidence
`sha256-2d9e6c43…c17bb3` **(superseded 2026-08-26 by `sha256-eb8fdc9c…36dd5`, twelve scenarios — this scenario's own per-scenario entry is byte-identical in it, checked 2026-09-03)**, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

| | |
|---|---|
| Participants, by role | knowledge **producer** / live subscriber (`analyzer`, live) · control-plane **host** (`orchestrator`, live) · media **provider** (`mediastore` composer, **stand-in**) · capability **provider** holding the archival pin (**stand-in**) |
| Over what links | **2 of 4 live** (50%) |
| Encoded as | 15 steps + **16** assertions, of which **4** are `expect: reject`. Five predicates are declared **console extensions**, not KCS §5 vocabulary — `capability_digest_stable`, `capability_digest_moved`, `silent_mutation_detected`, `successor_offered_beside`, `deprecation_visible` |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**`green` here does not mean this pass came out clean.** It did not: **V-1…V-8** are open, four of
them blocking, and none is folded. The encoding deliberately does not assert an unfolded delta —
*"asserting a fold koine has not made"* is the phrase in its own module note — so what went green is
the subset of the §Assertions table that today's contracts actually support. Read the two lists
below together or not at all.

**What passed**, by the row of the §Assertions table it encodes:

| Row | Assertion | Held as |
|---|---|---|
| 1 | The v1 binding still resolves after a minor widening | `capability_path_exists` |
| 2 | An unknown output field does not reject the frame | `dangling_ref_tolerated` — the prose's own *"nearest available; not the same predicate"* |
| 3 | A raise beyond the ceiling is refused, not billed | `cost_within_ceiling` + `refused` |
| 4 | The digest moves on a shape edit and not on a re-price | `capability_digest_moved` + `capability_digest_stable` (ext) |
| 5 | A digest change at an unchanged version is caught | `silent_mutation_detected` (ext) |
| 6 | The successor is discoverable beside the predecessor | `successor_offered_beside` (ext) |
| 7 | The v1 grant does not reach v2 | `refused` over `expect: reject` |
| 8 | The deprecated entry is returned, marked, ranked below | `deprecation_visible` (ext) |
| 9 | The live stream survives to the declared removal | `completes` — inverted, as the prose says: it asserts liveness, not notice |
| 10 | The archival pin still resolves past removal | `resolves_to` |

**What was replayed but deliberately not asserted.** Two of the blocking deltas cannot honestly
become assertions in a runtime, and the encoding records the exposure instead:

- **V-2** (Step 5, high/structural) — the re-serialization probe ran and shows the `schema_id`
  genuinely **unchanged** across a redefined knowledge payload, because §2.1's shape key holds a
  free-form *name* and koine has no shape registry. No assertion claims the mutation was *caught*,
  because on today's contract it is not. Asserting either candidate fold — register the shape, or
  add a `payload_schema_id` — would be the implementing repo asserting a contract koine has not
  ratified.
- **V-7** (Step 10, the headline) — what the document *can* show is the exposure: the subscriber's
  cached binding is compared against the provider's current card and is **two minors stale**, having
  had no obligation to re-`describe`. That the removal itself would be learned by a dead stream is a
  property of **absence**, which no observation log can carry.

V-8 is not a runtime failure at all: it is the record that KCS §5's control-plane group predates
KCB §7, which is why five predicates above are extensions. That finding is now **corroborated by
construction** — the encoding could not be written without them.

**What the run does not say.** The **provider** — the participant that widens, re-prices, mutates
and retires — was a stand-in, as was the archival-pin holder. Every mutation above was staged from a
recording rather than performed by a live provider. Given that this scenario's whole subject is what
a provider does to a subscriber over a release cycle, that is the more consequential half of
**DR-1** here than the raw 50%.

### Findings — from the downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-7 | **High** (reading hazard, not a new break) | `kcs:live-schema-mutation` returns **`green`** over a pass koine records as **not clean** — V-1…V-8 open, V-2/V-4/V-5/V-7 blocking. The green is honest and the encoding is right to be silent, but nothing in the evidence artifact says which deltas were skipped. | A green line here may **not** be cited as evidence that KCB §7 holds. It is evidence that the *ten supportable rows* of the §Assertions table hold, over a half-recorded cast, **while the four blocking deltas remain open**. This run therefore does not move either KCB gate: the *Re-ratification — what this pass gates* section above stands unchanged, and the clean §7.5 re-run it demands has still not happened. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).
