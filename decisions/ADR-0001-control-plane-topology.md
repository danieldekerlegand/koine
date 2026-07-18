# ADR-0001 — Control-plane topology: direct-dial peers, thin shared commons

**Status:** Accepted (ratified 2026-07-18)
**Deciders:** ecosystem owner
**Refines:** [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB),
[`../ECOSYSTEM.md`](../ECOSYSTEM.md) §6
**Applies to:** Insimul, Pinakes, Cuneiform, Argos, Formant, and the shared runtime commons.

---

## Context

With the four protocol planes ratified, we have to decide **how the five services physically
communicate** and **where shared runtime code lives**. Two questions were on the table:

1. Should a central A2A/MCP server **route all inter-platform traffic** to the correct
   platform (a hub), or should services connect **directly** with communicator/messenger
   agents acting as liaisons (a mesh)?
2. The provider-router (extracted from Argos's "sacred ladder") needs a home. A dedicated
   shared repo would also let us build a **UI to run cross-platform test scenarios** and
   verify protocol stability.

A latent trap: conflating the **provider-router** (a gateway to *model backends* — a leaf
capability) with an **inter-platform router** (the control plane). Merging them would produce a
single component that must understand every payload in the ecosystem — the ESB /
distributed-monolith anti-pattern KCB was written to avoid.

## Decision

**1. Two distinct routers, never merged.**
The **provider-router** routes to model backends (OpenAI / mlx-serve / Ollama / placeholder)
and is one leaf capability on the bus. **Inter-platform routing** is the KCB control plane and
is a separate concern. The provider-router is never the path other platforms route through.

**2. Data plane: direct peer-to-peer A2A/MCP.**
Services connect **directly** over MCP/A2A. There is **no central server that relays or
transforms inter-service traffic.** ("Dumb pipes, smart endpoints.")

**3. Control plane: a thin shared commons that addresses but does not proxy.**
Centralize **route-by-lookup**, not **route-by-proxy**:
- a **discovery registry** (Cuneiform-provisionable) that indexes manifests and computes
  capability *paths* — it hands back **addresses**, then peers connect directly;
- the **resolver** (KINP §8) for identity/entity lookup.
Authoritative manifests remain at the providers; the registry is a cache/index.

**4. Optional aggregator facade — convenience only, never mandatory.**
A facade MAY present a *unified tool namespace* (one MCP endpoint listing tools from all
platforms) that **forwards without transforming**, for the benefit of clients (notably the
conformance console and external consumers). It MUST NOT become the mandatory inter-service
path; peers still dial directly.

**5. Liaison/messenger agents are adapters, not middlemen.**
An A2A service is already its own liaison. Dedicated liaison agents are justified only as
(a) **adapters** fronting a surface that cannot speak MCP/A2A natively, or (b)
**concierges/orchestrators** that decompose a genuine cross-platform request into sub-calls.
They are never a mandatory hop between two peers that already speak the protocol.

**6. A dedicated shared runtime-commons repo: `agora`.**
Create `agora` (placeholder name — the marketplace where parties meet and transact) as the
**runtime sibling to `koine`**: `koine` holds the contracts; `agora` holds the implementations —
the **provider-router**, the **discovery registry + resolver** reference implementation,
shared **protocol client libraries / manifest schemas**, and the **conformance console**.
This resolves the provider-router's home (open decision, provider-router tasklists US-PR5):
**the router lives in `agora`, not in Argos.**

**7. The conformance console is an observer on real connections, not a hub.**
The console discovers platforms via the registry, opens the **same direct A2A/MCP links
production uses**, injects requests, and records/observes traffic. It validates stability
precisely because it exercises the real data path rather than a mock hub. The hand-written
pressure-test scenarios (`../scenarios/*.md`) become its first runnable, observable scenarios.

## Consequences

**Positive**
- No single point of failure or scaling bottleneck on the data path; no payload-aware proxy to
  accrete business logic.
- One place (`agora`) to build shared runtime + the test console, without centralizing traffic.
- The console verifies the *actual* protocols (real connections), turning the paper pressure
  tests into a living conformance suite.
- Cross-language sharing is clean: the provider-router is a service over the wire (Argos=Python,
  Cuneiform=TS both call it), never an imported library.

**Negative / costs**
- A new repo to stand up and maintain (`agora`).
- Direct-dial requires each service to speak MCP/A2A (adapters where they don't — decision 5).
- The registry, though thin, is still shared infrastructure to run (Cuneiform-provisioned).

**Neutral**
- The optional facade (decision 4) is available if client ergonomics demand it, at the cost of
  an extra forwarding layer — adopt only if needed.

## Alternatives considered

- **Central A2A/MCP traffic hub (route-by-proxy).** Rejected: ESB / distributed-monolith —
  single point of failure, scaling bottleneck, must understand every payload, business-logic
  magnet. This is the pattern KCB exists to prevent.
- **Pure N² direct mesh with no registry.** Rejected: reintroduces the discovery explosion the
  registry solves; no place to compute cross-platform capability paths.
- **Universal liaison/messenger agents between every pair.** Rejected: adds a hop, latency, and
  a failure point with no benefit when both ends already speak MCP/A2A.
- **Provider-router hosted inside Argos.** Rejected in favor of `agora`: a dedicated commons
  gives cross-language reuse and a home for the registry/resolver/console.

## Relationship to the specs

- **KCB** already encodes decisions 2–3 (thin registry, "not a transform gateway"); this ADR
  makes the direct-dial data plane, the optional facade (4), and the liaison rule (5) explicit,
  and names `agora` as the commons.
- **ECOSYSTEM §6** (repo topology) gains `agora` as the runtime-commons sibling to `koine`.
