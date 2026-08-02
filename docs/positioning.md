# Koine in context: A2A, MCP, and existing standards

A fair question for anyone meeting Koine: *how is this different from A2A or MCP — and does it
reinvent things other projects already solved?* This document answers both, and explains what
Koine deliberately builds on rather than replaces.

## Koine is a specification, not a runtime

Koine is **contracts only** — the prose specs, schemas, and shared vocabularies that any system
implements *in its own codebase*. There is no application or server code here. The reference
runtime that implements these contracts (a model gateway, a discovery registry, a resolver, a
translation engine, a conformance console) lives in a **separate** project, [agora](https://github.com/danieldekerlegand/agora):
**Koine specifies, agora implements.**

This mirrors how the protocols Koine builds on are organized — MCP and A2A each keep their
specification in one repository and their SDKs and reference implementations in others. Keeping
the contract uncoupled from any one runtime is what lets *any* system conform without adopting a
particular stack.

## Where Koine sits: above transport, not beside it

A2A and MCP are **transport and RPC**. MCP connects one agent to tools, resources, and prompts;
A2A lets agents discover one another (via Agent Cards) and delegate tasks. Both are deliberately
**payload-agnostic** — they move messages; they don't define what the messages *mean*.

Koine defines the meaning: stable **identity**, **knowledge**, **media**, and **capability**
semantics that travel *over* that transport. It does not compete with A2A/MCP — it uses them:

- The Capability-Bus manifest ([KCB](../specs/capability-bus.md)) is **not** a new file. It rides
  inside a standard A2A Agent Card as one entry in `capabilities.extensions[]`, and its verbs map
  onto MCP tool-calls and A2A tasks/streaming. KCB is a *convention over existing standards*, not
  a new runtime.
- Conformance scenarios ([KCS](../specs/conformance-scenario.md)) run over participants' **real**
  MCP/A2A connections — testing the actual protocols, not mocks.

So the honest one-line positioning is: **A2A/MCP carry the message; Koine says what it means.**

## The gap Koine fills

This isn't only our framing. Independent analysis of agent-interoperability protocols (see
*"Governance Gaps in Agent Interoperability Protocols: What MCP, A2A, and ACP Cannot Express"*,
[arXiv:2606.31498](https://arxiv.org/pdf/2606.31498)) enumerates the semantics these protocols
*cannot* express — and they line up with Koine's specs:

| Gap the analysis identifies | Koine spec that addresses it |
|---|---|
| Cross-domain **identity & provenance** | [KINP](../specs/identity.md) + provenance envelopes |
| **Economic / cost** semantics | [KCB](../specs/capability-bus.md) cost + budget ceilings |
| **Cross-domain knowledge representation** | [KGP](../specs/grounding-pack.md) |
| **Accountability / audit trails** | content-addressed claim & asset ids |
| Data **semantics** beyond function signatures | KGP / [KMI](../specs/media-interchange.md) |

## Building on existing standards, not forking them

Koine's design rule is **adopt the interface or shape, not the runtime**. Each spec leans on
established work:

- **KINP (identity)** — adopts IRIs and CURIEs (W3C), the [W3C Entity Reconciliation API](https://openrefine.org/docs/technical-reference/reconciliation-api)
  (as used by OpenRefine and Wikidata) for its `reconcile` verb, the [W3C PROV](https://www.w3.org/submissions/2024/SUBM-prov-jsonld-20240825/)
  *shape* for provenance, and content-addressing (git/IPFS-style hashes) for assertions and
  assets. It anchors entities to external authorities (Wikidata, MusicBrainz, GeoNames). It
  deliberately does **not** mandate the full RDF/OWL/SPARQL or IPFS-network stacks — storage stays
  native, while remaining IRI-compatible.
- **KGP (knowledge)** — builds on SHA-256 for claim ids, PROV-shaped provenance, and [SPDX](https://spdx.org)
  license identifiers, and projects losslessly to RDF-adjacent and logic formats (Neo4j property
  graph, Datalog, ProbLog, Prolog, TSV).
- **KMI (media)** — uses ffprobe-shaped technical metadata and projects to the industry NLE/EDL
  formats (Final Cut FCPXML, Premiere xmeml, DaVinci CMX3600).
- **KCB (capability)** — an A2A Agent Card extension over MCP/A2A transport (above).
- **KFT (fine-tuning)** — a composition profile that references Hugging Face Hub coordinates, SPDX
  license classes, and safetensors/GGUF/ONNX weight formats; it adds no new plane or transport.

## What Koine adds that has no off-the-shelf equivalent

The parts that are genuinely Koine's contribution — the reason it exists as its own layer:

- The **`same_as` / `based_on` firewall** and `@world(W)` model (KINP) — a principled separation
  between real-world facts and fictional/derived worlds, so the two never contaminate each other.
- **Cross-plane capability semantics with cost** (KCB) — discovering and composing capabilities
  *across* knowledge/media/entity planes, with budget ceilings enforced before spend.
- **Egress and license gating** on knowledge and training data (KGP/KFT).
- **Cross-plane conformance assertions** (KCS) — e.g. `firewall_holds`, `claims_converge`,
  `cost_within_ceiling`, `always_completes`.

## In short

Koine is a thin semantic layer that **reuses A2A, MCP, and mature domain standards for everything
they already do well**, and adds only the identity, knowledge, media, and capability *meaning*
those layers leave undefined. If you already speak A2A or MCP, you are most of the way to
speaking Koine.
