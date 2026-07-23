# ADR-0004 — Adopt Erlang/OTP for the provider-router + subscribe fan-out

**Status:** Accepted (a RECORD of a decision already made, not a gate)
**Deciders:** ecosystem owner
**Date:** 2026-07-22
**Refines:** [`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)
(provider-router home + over-the-wire sharing),
[`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB §4, `subscribe`).
**Supersedes (language only):** the Python `agora_provider_router` package standing up under the
agora `50-provider-router-extract` tasklist — its **language/runtime choice**, never its contract.

---

## Context

With the four planes ratified and the provider-router homed in `agora` (ADR-0001 decision 6), the
runtime question is *which runtime* the router — and the KCB `subscribe` fan-out that rides beside
it — should be written in. Two of the ecosystem's load-bearing workloads turn out to have the same
shape, and it is not the shape of a request/response web service.

**(a) The always-completes failover ladder is structurally an OTP supervision tree.** The router
walks a per-rung failover ladder, `paid → mlx → local → placeholder`. In the reference Python
implementation the configurable tiers are
`agora/provider-router/src/agora_provider_router/ladder.py` `TIERS = ("paid", "mlx", "local")`, and
`PLACEHOLDER` is the *unconditional terminal tier* — the module states it is **"always appended,
never configurable away"** — so a configured ladder can narrow *which* backends are tried but can
never break the always-completes contract. `router.py`'s `Router.complete` walks that ladder: every
rung that is unconfigured, unreachable, over budget, or errors is recorded as an attempt and the
walk continues, terminating in the offline, free placeholder. That is exactly a **supervision
tree**: each rung a supervised child that may crash, the placeholder a *permanent* terminal worker
that can never fail, and "the walk always completes" a **supervision property** rather than a
hand-rolled fall-through loop.

**(b) KCB `subscribe` fan-out to many consumers is a textbook BEAM per-process workload.** KCB §4's
`subscribe` verb registers a consumer for a world or capability and delivers KGP **deltas** over A2A
streaming / MCP notifications as they occur — one producer, many consumers, each consumer an
independent long-lived stream. Delivering the same delta stream to thousands of lightly-active
subscribers, each isolated so one slow or crashing consumer cannot stall the others, is the
canonical use the BEAM was built for: many cheap processes, one mailbox each.

**The latent trap this avoids.** This is a **language/runtime choice internal to ONE leaf
capability**, not a change to the control plane. ADR-0001 decision 1 keeps the provider-router a
*leaf* — "the provider-router is never the path other platforms route through" — so re-homing it on
a different runtime touches no over-the-wire contract and no KCB / KGP / KINP spec. Confusing "the
router's implementation language" with "the ecosystem's routing topology" would be the same
category error ADR-0001 was written to prevent (the ESB / distributed-monolith anti-pattern); this
ADR stays strictly on the leaf side of that line.

**The language-synthesis premise.** The Decision below rests on the ecosystem's language split:
**Erlang/OTP for concurrency + uptime** (many cheap processes, supervision trees, "let it crash")
and **Rust for CPU-bound work**. Workloads (a) and (b) are pure concurrency/uptime, so they land on
the BEAM; the CPU-bound translation/normalization they call into stays in Rust and is reached by
in-node interop — the split this ADR records in the interop plan below.

---

## Decision

**Decision 1 — the sacred ladder becomes an OTP supervision tree.** The provider-router is
re-homed on Erlang/OTP, and the always-completes failover ladder is modeled as a **supervision
tree**: each configurable rung (`paid` / `mlx` / `local`) is a supervised child that may crash or
be absent, and the `placeholder` is a **permanent terminal worker** — the OTP analogue of
`ladder.py`'s *"always appended, never configurable away"* tier. What is a hand-rolled fall-through
loop in `router.py`'s `Router.complete` (walk the rungs, record each as an attempt, fall through on
crash/absence/refusal, terminate in the offline placeholder) becomes a **supervision property**:
the tree is constructed so the walk *cannot* fail to terminate, because the permanent placeholder
child is always reachable and can never itself fail. This is what turns the **always-completes
invariant** — and with it the **ZERO-SPEND guarantee** that `tests/test_zero_spend.py` asserts (no
API keys and no local servers ⇒ every request falls to the placeholder ⇒ nothing is spent) — from
a property maintained by careful loop code into a *structural* property of how the tree is wired.

The router's per-rung **`Attempt`** record maps directly onto this tree. `Attempt`'s `dialed` flag
(the *contacted-and-did-not-answer* vs. *refused-on-price-and-never-contacted* distinction) and its
`projected` cost are exactly the audit trail a supervised child produces as the walk falls through:
a crashed/unreachable child yields a `dialed = true` failed attempt, and a rung skipped by the
budget walk yields a `dialed = false`, `projected`-only refusal. The **`budget_units` ceiling walk**
(KCB §5) carries over unchanged in semantics: the ladder order is a *preference* and the ceiling a
*request-level constraint*; because the ladder runs **expensive → free**, a rung whose `project`ed
cost exceeds the ceiling is **refused without being dialed** and the walk falls to a cheaper rung.
The ceiling stays a per-request constraint (never a ladder mutation), and the free, offline
placeholder **survives every ceiling** — a ceiling of `0` can never spend, so the ZERO-SPEND
terminal is reachable under any budget.

**Decision 2 — KCB `subscribe` fan-out becomes BEAM per-subscriber pub-sub.** KCB §4's `subscribe`
verb (A2A streaming / MCP notifications delivering KGP **deltas** to many consumers) is modeled as
**one lightweight BEAM process per subscriber** behind a pub-sub fan-out. The BEAM fits because
§4's delivery contract asks for *nothing the BEAM lacks and nothing it must add*: deltas are
**ordering-independent** and **content-addressed**, so **redelivery is idempotent** and **no
exactly-once machinery is required** — a subscriber process can simply re-apply a delta it has
already seen. Delta-L **dangling-reference tolerance** is then a **per-subscriber concern**: because
a stream may deliver a reference (an EDL, a claim) before the referenced asset's bytes have
propagated, each consumer tolerates the dangling ref and **fetches lazily**, which is naturally a
property of the isolated per-subscriber process rather than of the shared fan-out.

**Subscription backpressure** — KCB §7 open question 3, flow-control for high-volume-world
("firehose") subscriptions — maps naturally onto the BEAM's **per-process mailboxes and
backpressure**: a slow subscriber's mailbox absorbs and throttles its own stream without stalling
the others. This is a *fit note*, not a contract claim: firehose flow-control **remains an
agora / Cuneiform (costadvisor) infra concern**, exactly as §7 leaves it, and is **NOT a KCB
contract change** — the `subscribe` verb, its payloads, and its idempotency guarantees are untouched.

---

## Interop — Rust stays CPU-bound, reached from the BEAM

**Decision 3 — CPU-bound translation/normalization stays in Rust, invoked from the BEAM.** The
BEAM is chosen for concurrency and uptime, not for raw single-threaded throughput; the CPU-bound
translation and normalization the router and its subscribers call into stays in **Rust** and is
invoked from Erlang across an in-node boundary. The concrete mechanism is either a **NIF** (e.g.
[`rustler`](https://github.com/rusterlium/rustler)-generated native functions linked into the node)
or an **isolated port program** (the Rust work runs as a separate OS process the BEAM talks to over
a port). This is the operational form of the language-synthesis premise from the Context: **Rust =
CPU-bound, Erlang = concurrency/uptime**, wired together in one node.

**The uptime constraint is explicit.** The supervision tree of Decision 1 exists to give an
always-completes guarantee, and a native call must not be able to defeat it. A NIF runs *inside* a
BEAM scheduler thread, so a NIF that blocks too long or crashes can stall or take down a scheduler —
and with it the very supervision tree the always-completes invariant depends on. Therefore any
CPU-bound native work either (i) runs as a **NIF on a dirty scheduler** and stays **short-lived and
non-blocking** (never occupying a normal scheduler, never running unbounded), or (ii) runs behind a
**port / external process** whose crash the BEAM observes as an ordinary child failure the
supervision tree can absorb. Either way a crashing or long-running translator **cannot take down a
scheduler or the tree** — the always-completes guarantee the OTP tree is built to give survives the
native boundary.

**The class of work that stays Rust-side — by reference only.** The ecosystem already draws this
CPU-bound line elsewhere, and this ADR names those surfaces **only as the *class* of work that
belongs in Rust**, without re-specifying any of them (koine is contracts-only):
[KGP §3](../specs/grounding-pack.md) **claim normalization** — the normative byte-canonicalization
that maps a claim's canonical byte string to its `sha256-…` claim id — and the related
**TSV ⇔ projection** translation, plus the **Insimul-native Trealla ABI reasoning core**, are the
kind of deterministic, CPU-bound byte work that stays Rust-side. Those contracts are defined in
their own specs and repos; this ADR does not restate or amend them — it only records that
provider-router translation is the *same class* of work and lands on the *same side* of the split.

**"Dumb pipes, smart endpoints" is not violated.** The Rust ⇔ Erlang boundary is **in-node interop
private to the provider-router implementation** — invisible on the wire, appearing nowhere in the
OpenAI-compatible `/v1` surface or the KCB manifest. Calling native code inside one leaf capability
does **not** turn the router into a payload-aware, content-transforming proxy on the control plane;
it stays a leaf that other platforms reach over the wire. This keeps the ADR clear of the
**ESB / distributed-monolith anti-pattern** that
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md) rejects: the smarts live *inside* an
endpoint, the pipes between endpoints stay dumb.

---

## Supersession — the Python router's language, not its contract

**Decision 4 — this supersedes the *language choice* of the Python `agora_provider_router`
package, and nothing else.** The reference router stood up under the agora `50-provider-router-extract`
tasklist is a Python/asyncio package; Decision 1 re-homes that leaf on Erlang/OTP. What is
superseded is **only the language/runtime**. The router's **external contract is preserved
byte-for-byte**:

- The **OpenAI-compatible `/v1` wire surface** is unchanged. Every dialable backend speaks the
  OpenAI wire format, so dispatch is a single code path regardless of which rung answers — that
  property is a *contract with callers*, not an implementation detail of Python, and the Erlang
  router presents the identical `/v1` surface.
- The **KCB manifest at `/.well-known/kcb-manifest.json`** (`manifest.py` `MANIFEST_PATH`) is
  served unchanged. A registry crawl (KCB §3) and any caller must see a **byte-identical manifest**
  across the language change.

**The preserved manifest surface, concretely.** The Erlang router republishes the same document
`manifest.py` builds today:

- the `generate.<modality>` **capabilities**, each carrying a `cost` object of
  `tier` / `est_units` / `basis` / `unpriced` (KCB §2 / §2.1) — e.g. a keyless binary advertising
  `{"tier": "placeholder", "est_units": 0}` and the same binary with a key advertising its paid
  tier, figures made comparable by the shared `basis`;
- the `auth.budget_units` **spend-ceiling declaration** (KCB §5) — the currency and ceiling a caller
  reads before dialing;
- the router **identity `agora:agent:provider-router`** (`ROUTER_IDENTITY`).

Because these are the same bytes, a KCB §3 registry crawl and every downstream caller are blind to
the language migration underneath.

**Downstream adopters are unaffected — they call over the wire.** ADR-0001 decision 1 keeps the
provider-router a service reached over the wire, and its consequence states it plainly:
*"cross-language sharing is clean: the provider-router is a service over the wire (Argos=Python,
Cuneiform=TS both call it), never an imported library."* Because argos
`80-provider-router-argos-adopt` and cuneiform `81-provider-router-adopt-cuneiform` call the router
over that wire and never import it, the Python→Erlang migration needs **no change on their side**.
The Python package's **parity suite** — `tests/test_zero_spend.py`, `tests/test_cost.py`,
`tests/test_manifest.py`, `tests/test_conformance_fixture.py` — is the **acceptance contract for the
Erlang port**: the port ships only when it passes the same fixtures byte-for-byte.

**Scope — koine only *records* this.** koine is contracts-only, so this ADR records the decision and
its rationale and nothing more. The **Erlang/OTP implementation and the actual port land in agora**
(runtime commons, per [ADR-0001](../decisions/ADR-0001-control-plane-topology.md)), **not in koine**.
This tasklist **edits no agora, argos, or cuneiform file**; the language migration is a follow-up
tracked in agora, recorded here as an accepted decision.

---

## Alternatives considered

- **Keep the router in Python/asyncio** — the current `50-provider-router-extract` loop, an
  `async def` walk over the ladder with `try`/`except` fall-through. Rejected: the always-completes
  contract stays a property of *careful loop code* rather than a structural one, and asyncio gives no
  supervision and no cheap-process isolation — so it leaves workload (a)'s supervision-tree leverage
  and workload (b)'s per-subscriber fan-out on the table. It works, but it hand-rolls what OTP gives
  for free.
- **Put `subscribe` fan-out on a non-BEAM external broker** (Kafka / Redis Streams / an MQ). Rejected
  for this leaf: §4's deliveries are already **ordering-independent + content-addressed / idempotent**
  (workload (b)), so the broker's exactly-once and total-order machinery is weight paid for guarantees
  the contract explicitly does not need — while still requiring a per-subscriber process to hold the
  lazy-fetch, dangling-ref-tolerant state. A broker remains a fine agora/Cuneiform infra choice for
  cross-node durability, but it is not a *substitute* for the per-subscriber BEAM process; it would sit
  behind one, not replace it.
- **Rust end-to-end (router + fan-out in Rust/tokio)** — one language for CPU-bound and concurrent
  work alike. Rejected: it inverts the ecosystem's language synthesis, buying raw throughput the router
  (an I/O-bound dispatcher) does not need at the cost of OTP's supervision and "let it crash" uptime
  model — the very properties workloads (a) and (b) are chosen for. Rust stays where it is CPU-bound
  (Decision 3), reached from the BEAM, not the other way around.

---

## Consequences

**Positive**
- The **always-completes invariant becomes structural** — a permanent terminal placeholder child the
  supervision tree can always reach — rather than a property maintained by loop code, and the
  **ZERO-SPEND guarantee** (`tests/test_zero_spend.py`) rides on it.
- **Per-subscriber BEAM processes** give `subscribe` fan-out natural isolation, lazy-fetch dangling-ref
  tolerance, and mailbox backpressure with no exactly-once machinery to build (workload (b)).
- The **external contract is preserved byte-for-byte** — OpenAI-compatible `/v1` + the
  `/.well-known/kcb-manifest.json` document — so downstream adopters (argos `80`, cuneiform `81`) are
  unaffected and the Python parity suite becomes the port's acceptance contract.

**Negative / costs**
- A **new Erlang/OTP toolchain + skill set** to stand up and maintain in agora (build, release, on-call
  familiarity) alongside the existing Python/TS surfaces.
- The **Rust-NIF failure-isolation burden** (Decision 3): every native call must be proven to stay on a
  dirty scheduler / short-lived or behind a port, or it can defeat the very uptime guarantee the tree
  exists to give — a standing correctness obligation, not a one-time cost.
- A **byte-for-byte re-implementation** must clear the full Python parity suite before it can ship;
  until it does, two implementations of the same contract exist.

**Neutral**
- The **KCB / KGP / KINP contracts are untouched** — this is a runtime choice inside one leaf, invisible
  on the wire; the manifest, the `/v1` surface, and every spec version/status stay exactly as they are.
- An external broker (rejected as a *substitute* above) remains available as agora/Cuneiform infra
  *behind* the per-subscriber process if cross-node durability is later required — adopt only if needed.

---

## Scope boundary

This ADR changes **no KCB / KGP / KINP contract**, adds **no runtime code to koine**, and leaves the
**KCB 0.2.0 spec version and its Ratified status untouched** — it is a downstream runtime/implementation
decision recorded here, not a spec revision.
