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
