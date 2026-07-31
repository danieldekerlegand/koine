# Koine

> *koinē* (κοινή) — "the common tongue." A shared protocol layer that lets otherwise-
> independent neuro-symbolic systems speak to each other as one system.

Koine is the **meta-repository** for an agnostic **neuro-symbolic interchange fabric**: the
contracts by which any conformant system publishes identity, knowledge, media, and capability,
and by which any other conformant system consumes them.

**Koine contains no application code.** It defines the contracts — identity, knowledge
interchange, media interchange, the capability bus, the conformance-scenario format, and the
fine-tuning profile — which participants implement in their own repositories. Think of it as a
constitution, not a runtime.

Koine is written against **roles**, never against products. A participant adopts one or more
roles and is bound only by the clauses for the roles it claims:

| Role | What it does |
|---|---|
| **Producer** | Writes into the fabric — claims, assets, worlds — under Koine identifiers. |
| **Consumer** | Reads from the fabric and ingests only what its declared portability tier admits. |
| **Authority** | Holds the canonical record for a domain and answers resolution/reconciliation for it (identity authority, knowledge authority, media authority). Authority is a **role**, not a privileged node. |
| **Host** | Provisions the control plane — the discovery registry, capability grants, orgs, infra. |
| **Provider** | Offers a capability on the bus and executes invocations against it. |

A participant is usually several of these at once, and the same deployment may host more than
one authority. Nothing in the specs requires a particular number of participants, a particular
vendor, or a particular deployment topology.

---

## The core thesis: a fabric, not a mesh of pipes

Participants are not peers passing files across N² bespoke edges. They are **producers of, and
consumers from, one shared neuro-symbolic fabric.** There is no "system A → system B" pipe;
there is a producer *writing worlds into the fabric* and an authority being the fabric's
canonical store. The fabric **is** the interconnect, and it collapses the N² integration
problem into "write-to-fabric / read-from-fabric."

Three planes carry everything that crosses the fabric:

| Plane | Carries | Held by / transport | Contract |
|---|---|---|---|
| **Control** | agent orgs, infra, tools, capabilities | host + providers over **MCP / A2A** | [`specs/capability-bus.md`](specs/capability-bus.md) 🚧 *(candidate 0.3.0)* |
| **Data — knowledge** | facts / predicates / graph | knowledge authority (canonical store) | [`specs/grounding-pack.md`](specs/grounding-pack.md) ✅ *(ratified)* |
| **Data — media** | assets, EDLs, metadata | media authority (asset library + CAS) | [`specs/media-interchange.md`](specs/media-interchange.md) ✅ *(ratified)* |

Underpinning **all three** is the one thing that makes "intersection" — joining data produced
by different participants — possible at all:

### → [`specs/identity.md`](specs/identity.md) — the Koine Identity & Namespace Protocol

Routing across the fabric is only hard because representations and *identities* don't match.
Fix identity and the fabric, the joins, and most of the routing fall out for free. Identity is
therefore the keystone and the first protocol specified here.

Design principle throughout: **dumb pipes, smart endpoints.** Koine defines shared contracts
and a shared namespace; intelligence stays in the endpoints. No central transform-gateway
(the ESB / distributed-monolith trap).

---

## Repository layout

```text
koine/
  README.md                        this file — the fabric thesis + index
  decisions/
    ADR-0001-control-plane-topology.md           ✅ direct-dial + thin commons; contracts here, code elsewhere
  specs/
    identity.md                    ✅ Koine Identity & Namespace Protocol (KINP) — ratified
    grounding-pack.md              ✅ Koine Grounding-Pack Protocol (KGP) — ratified
    capability-bus.md              🚧 Koine Capability-Bus Protocol (KCB) — candidate (0.3.0)
    media-interchange.md           ✅ Koine Media-Interchange Protocol (KMI) — ratified
    conformance-scenario.md        ✅ Koine Conformance-Scenario format (KCS) — ratified
    fine-tuning.md                 ✅ Koine Fine-Tuning Protocol (KFT) — ratified (a profile
                                   composing the four planes, not a fifth plane)
  registry/
    relations.tsv                  ✅ core relation vocabulary (binary relations)
    relations/cinematography.tsv   ✅ example domain extension (cine:)
    relations/media.tsv            ✅ media-lineage relations (media:)
    relations/social.tsv           ✅ person-level social relations (soc:)
    entity-types.tsv               ✅ entity-kind vocabulary
    media-types.tsv                ✅ media-kind vocabulary
    enums/                         ✅ shared closed vocabularies
  schemas/                         ✅ machine-readable twin of the prose specs (JSON Schema
                                   draft-2020-12); validators + fixtures live downstream
  policy/                          ✅ license-class + trust-tier policy
  scenarios/
    e2e-worlds-to-fabric.md        ✅ pressure test of the identity model (KINP)
    e2e-media-transform.md         ✅ pressure test of the control + media planes (KCB+KMI)
    e2e-finetune.md                ✅ pressure test of the fine-tuning profile (KFT)
    e2e-finetune-multimodal.md     ✅ multimodal pressure test of the same
    kcs-format-stress.md           ✅ pressure test of the KCS scenario format
```

## Status

**Ratified:** identity (KINP), knowledge (KGP), media (KMI), the conformance-scenario format
(KCS), and the fine-tuning profile (KFT). **Candidate:** the capability bus (KCB 0.3.0),
pending re-validation of its AgentCard-extension manifest. Each spec is validated by a pressure test (`scenarios/`) before ratification. Specs
are versioned independently (see each doc's header).

## Scope — shape, not instance

Koine holds the **shape** of the contract and nothing else. A schema saying "a canonical graph
export has nodes and edges" is shape, and it is here. A predicate map saying "*this* producer's
`depicts` edge lands on *that* authority's namespace" is deployment **instance** data, and it is
not — nor is a deployment's topology, its bridge tables, its implementation-record ADRs, or its
cross-repo adoption program.

Those live in the operator's own **private integration repo** (`rosetta`, for the deployment this
work grew out of). Nothing in `specs/`, `schemas/`, `registry/`, or `policy/` depends on that repo:
a new participant needs only what is here.
