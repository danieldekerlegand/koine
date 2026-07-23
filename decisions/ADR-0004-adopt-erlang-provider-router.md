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
