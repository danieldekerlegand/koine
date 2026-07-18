# Koine

> *koinē* (κοινή) — "the common tongue." The shared protocol layer that lets five
> otherwise-independent projects speak to each other as one system.

Koine is the **meta-repository** for the abstract interconnections and protocols
between the five projects in `~/Development`:

- **Insimul** (`workspace/`) — hybrid-AI fictional worlds → games in any genre/platform.
- **Pinakes** — global neuro-symbolic knowledge web + visualizations (grounding data layer).
- **Cuneiform** — Company-as-Code: templated agentic organizations + infra.
- **Argos** — any-to-any multimedia ingestion, neuro-symbolic KBs, and manipulation.
- **Formant** — AI-built audio plugins/instruments, played agentically.

**Koine contains no application code.** It defines the contracts — identity, knowledge
interchange, media interchange, and the capability bus — that the five projects
implement in their own repos. Think of it as the ecosystem's constitution, not a runtime.

---

## The core thesis: a fabric, not a mesh of pipes

The five projects are not peers passing files across N² bespoke edges. They are
**producers of, and consumers from, one shared neuro-symbolic fabric.** There is no
"Insimul → Pinakes" pipe; there is Insimul *writing worlds into the fabric* and Pinakes
being the fabric's canonical store. The fabric **is** the interconnect, and it collapses
the N² integration problem into "write-to-fabric / read-from-fabric."

Three planes carry everything that crosses the ecosystem:

| Plane | Carries | Owner / transport | Contract |
|---|---|---|---|
| **Control** | agent orgs, infra, tools, capabilities | Cuneiform + **MCP / A2A** | [`specs/capability-bus.md`](specs/capability-bus.md) ✅ *(ratified)* |
| **Data — knowledge** | facts / predicates / graph | Pinakes (canonical store) | [`specs/grounding-pack.md`](specs/grounding-pack.md) ✅ *(ratified)* |
| **Data — media** | assets, EDLs, metadata | Argos-originated interchange | [`specs/media-interchange.md`](specs/media-interchange.md) ✅ *(ratified)* |

Underpinning **all three** is the one thing that makes "intersection" — joining data
across projects — possible at all:

### → [`specs/identity.md`](specs/identity.md) — the Koine Identity & Namespace Protocol

Routing across the ecosystem is only hard because representations and *identities* don't
match. Fix identity and the fabric, the joins, and most of the routing fall out for free.
Identity is therefore the keystone and the first protocol specified here.

Design principle throughout: **dumb pipes, smart endpoints.** Koine defines shared
contracts and a shared namespace; intelligence stays in the projects. No central
transform-gateway (the ESB / distributed-monolith trap).

---

## Repository layout

```text
koine/
  README.md                        this file — the fabric thesis + index
  ECOSYSTEM.md                     ✅ full topology; supersedes the partial docs in
                                   Pinakes / Argos / Insimul
  decisions/
    ADR-0001-control-plane-topology.md  ✅ direct-dial + thin commons; the `agora` repo
    ADR-0002-reconcile-with-existing-bridges.md  ✅ Koine supersedes the LinguaScrape sync plans (fold)
  specs/
    identity.md                    ✅ Koine Identity & Namespace Protocol (KINP) — ratified
    grounding-pack.md              ✅ Koine Grounding-Pack Protocol (KGP) — ratified
    capability-bus.md              ✅ Koine Capability-Bus Protocol (KCB) — ratified
    media-interchange.md           ✅ Koine Media-Interchange Protocol (KMI) — ratified
    conformance-scenario.md        ✅ Koine Conformance-Scenario format (KCS) — ratified
  registry/
    relations.tsv                  ✅ core relation vocabulary (binary relations)
    relations/cinematography.tsv   ✅ example domain extension (cine:)
    relations/media.tsv            ✅ media-lineage relations (media:)
  scenarios/
    e2e-worlds-to-fabric.md        ✅ pressure test of the identity model (KINP)
    e2e-media-transform.md         ✅ pressure test of the control + media planes (KCB+KMI)
    kcs-format-stress.md           ✅ pressure test of the KCS scenario format
  tasks/chief/                     ✅ staged cross-project adoption tasklists (relocate to run)
```

## Status

**All five specs ratified.** Identity (KINP), knowledge (KGP), control (KCB), media (KMI), and
the conformance-scenario format (KCS) are all ratified, each validated by a pressure test
(`scenarios/`). The contract layer is complete. See [`ECOSYSTEM.md`](ECOSYSTEM.md) for the full
topology. Specs are versioned independently (see each doc's header).
