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
- **KMI (media)** — uses ffprobe-shaped technical metadata and adopts [OpenTimelineIO](https://opentimeline.io)
  (Academy Software Foundation) as its canonical timeline model, reaching the industry NLE/EDL
  formats (FCPXML, `xmeml`, CMX3600, AAF) through OTIO's own adapters rather than bespoke
  exporters. What KMI adds over OTIO is what OTIO has no model for: content-addressed asset
  identity, the asset-lineage graph, and the analysis→knowledge bridge.
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

## Prior art considered — and why each is adopted, bridged, or dismissed

A prior-art sweep (2026-08) found **six bodies of work this document had never engaged**. Each is
cited here with the specific reason it does not retire a Koine spec — or, where it genuinely
overlaps, with the **narrowing Koine takes in response**. Where a body of work is better than
ours, the answer is to project onto it, not to ship a third vocabulary.

This section is **informative**. Where a comparison has been landed in the contracts, the spec and
the ADR are the record and this narrative points at them: the KGP half — nanopublications /
Trusty URIs and Frictionless / Data Package — lives in
[`../specs/grounding-pack.md`](../specs/grounding-pack.md) §3.4 and
[ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md), and the KMI half — C2PA and
MovieLabs OMC — lives in [`../specs/media-interchange.md`](../specs/media-interchange.md) §3.1. If
this document and those ever disagree, they win and this is the thing to fix.

| Prior art | Overlaps | Outcome |
|---|---|---|
| Nanopublications / **Trusty URIs** | KGP claim identity | **Dismissed** — hashes the publication, not the claim (below) |
| **C2PA** | KMI lineage | **Bridged** — KMI defines a projection to C2PA; it does not restate it |
| **MovieLabs OMC** v2.8 | KMI lineage | **Bridged** — richer derivation vocabulary than KMI's; KMI projects onto it |
| MLCommons **Croissant** | KFT dataset description | **Adopted by reference** — KFT cites, never restates |
| **Frictionless / Data Package** | KGP/KFT packaging | **Dismissed** — file packaging, not claim or admission semantics |
| **Pact** / consumer-driven contract testing | KCS | **Dismissed** — bilateral and mock-based (below) |
| **DIDs / Verifiable Credentials** | KINP identity | **Dismissed for the merge problem** — resolution + attestation, no merge |

### Nanopublications and Trusty URIs — the closest ancestor of KGP, and the decisive inversion

Nanopublications package an assertion with its provenance and publication info and identify the
result with a **Trusty URI**: a content hash folded into the identifier. That is the same instinct
KGP has — an identifier you verify rather than trust — and it is the nearest ancestor KGP has in
the literature.

The difference is *what gets hashed*, and it is decisive. **A Trusty URI hashes all four graphs —
head, assertion, provenance, and pubinfo.** Two labs asserting the **identical** triple therefore
mint **different** URIs, because their provenance and publication info differ. The identifier is a
fingerprint of a *publication event*.

**KGP hashes the claim alone.** Normalization (§3) is defined over the claim's subject, relation,
object, and world; provenance travels *beside* the claim as a repeated record and never enters its
identity. Two independent producers asserting the same thing therefore **converge on one claim id**
and their provenance records merge onto it (§3.3) — which is precisely what cross-producer merge
requires, and precisely what a Trusty URI cannot do by construction. Nanopublications are the
better model when the unit of interest is the publication; KGP's unit of interest is the **claim**,
so its identity had to invert.

This is also the honest reason KGP's canonical form is not RDF's (ADR-0006). Beyond the shape
argument: **RDFC-1.0 is defined over RDF 1.1 only and has no defined behaviour for RDF 1.2 triple
terms**, and revising it is *explicitly out of scope* for the RDF/SPARQL Working Group charter,
which runs to **2027**. The W3C canonicalization stack cannot — today, or on any published
schedule — canonicalize the structure KGP needs. That is a stronger justification than "we prefer
TSV," and as of the **2026-08-13 amendment** it is the one
[ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) leads with; the KGP-side
landing is [`../specs/grounding-pack.md`](../specs/grounding-pack.md) §3.4.

### C2PA and MovieLabs OMC — KMI narrows to a bridge

*Landed in the contracts: [`../specs/media-interchange.md`](../specs/media-interchange.md) §3.1 is
the record; this is the narrative pointing at it.*

**C2PA already ships a cryptographically signed derivation chain**: `c2pa.ingredient` with
`parentOf` / `componentOf` / `inputTo` relationships and hash-based "hard bindings," backed by a
real conformance program listing **159 certified products as observed 2026-08-13** — Google
(~35 entries), OpenAI, Amazon Bedrock, Getty, Qualcomm silicon, Sony. Separately, **MovieLabs OMC
v2.8** ships a *richer* derivation vocabulary than either: Revision / Variant / Derivation /
Representation / Alternative.

Both of KMI's originally-claimed differentiators over OTIO — content-addressed asset identity and
the lineage graph — are therefore already modelled, one of them by a signed, certified, widely
deployed standard. **KMI's answer is to be the bridge, not a third vocabulary**: define
projections onto C2PA's ingredient relationships and onto OMC's derivation vocabulary — canonical
form retained, mapping specified, lossy edges named, conformance tested as a round-trip, the same
discipline [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) applies to KGP —
and hold only the part neither occupies. That is a deliberate position rather than a retreat: a
producer whose problem is attestable published provenance should emit C2PA and a producer whose
problem is production-domain modelling should speak OMC, and KMI's job is to carry derivation
between them and into a plane neither reaches.

What *is* genuinely unoccupied is the **analysis→knowledge bridge**: nothing in OTIO, C2PA, OMC,
or IPTC connects media-analysis output to a knowledge graph. That, plus world-scoping
(`source_world`, per-asset and conditional on ingest, which engages the KINP §4.3 firewall), is
KMI's remaining ground — and it is narrower and more defensible than the claim it replaces.

### MLCommons Croissant — KFT adopts it by reference

Croissant v1.1 is the ML-dataset description format, with real adoption across Hugging Face,
Kaggle, and OpenML. **KFT does not restate it**: a KFT job references a dataset the way Croissant
already describes it. The same rule applies to weights (**ModelPack / KitOps** — whose
`model.parts[].type` already contemplates LoRA), to lineage (**Hugging Face `base_model`**, which
millions of repos already carry and the Hub validates), and to job structure (**Kubeflow
TrainJob**'s `initializer.{dataset,model}.storageUri` is the structural precedent KFT §3 should
resemble rather than diverge from).

What remains KFT's, because nothing else holds it: the **objective × adaptation taxonomy** (OpenAI
models only the objective axis; Kubeflow buries adaptation in argv), **egress-gated placement**,
**graded refusal routing**, and **cross-provider job portability** — nothing converts a job between
Axolotl, LLaMA-Factory, torchtune, TRL, and OpenAI despite 190k+ combined stars. That last is
arguably the most valuable thing KFT can deliver.

### Frictionless / Data Package — dismissed

Data Package standardizes how *files* are packaged and typed: resources, dialects, table schemas.
It is a good answer to "what is in this zip." It expresses nothing about claim identity, provenance
merge, license/egress class, or admission — the entire content of KGP §3/§7 and KFT §4. Adopting it
would rename a container without discharging a single normative clause. Landed in
[`../specs/grounding-pack.md`](../specs/grounding-pack.md) §3.4.

### Pact and consumer-driven contract testing — dismissed, and it makes KCS's case

Pact is the mature name in contract testing, and the comparison is the strongest argument *for*
KCS rather than against it. Pact is **bilateral** — one consumer, one provider, one pact — and it
is **mock-based**: the consumer's expectations are replayed against a stub, and the provider is
verified against a recorded pact, never against the live counterpart. KCS is the opposite on both
axes: a **declarative scenario driving N real participants over their actual MCP/A2A connections**,
with **cross-plane assertions** (`firewall_holds`, `claims_converge`, `cost_within_ceiling`,
`always_completes`) that no pact can express because they span planes and participants rather than
a single request/response pair, plus **traceability to the clauses under test** — every step and
assertion is cited to a named clause of the four plane specs. (Traceability is by construction of
the vocabulary; a machine-readable per-assertion spec-section *field* is not part of the format
today — see [KCS](../specs/conformance-scenario.md) §8.)

The nearest thing in the agent-protocol world is A2A's own test kit — a **45★** project as of the
2026-08 sweep, and declarative only in its participant matrix. **KCS is the most defensible spec in
the suite**, and it was for a long time also the least advertised — a positioning bug, not a design
one. It is fixed as of 2026-08-13: the index descriptions in [`../README.md`](../README.md),
[`../specs/README.md`](../specs/README.md) and [`../ECOSYSTEM.md`](../ECOSYSTEM.md) now state what
KCS is (declarative scenario data × N real participants × cross-plane assertions × traceability to
the clauses under test) rather than summarizing it as a generic conformance format. The landed
comparison is [`../specs/conformance-scenario.md`](../specs/conformance-scenario.md) §8, which also
records the conformance-program designs KCS could borrow from in a later revision — a forward note,
none of them adopted.

### DIDs and Verifiable Credentials — dismissed for the problem KINP actually solves

DIDs give a self-certifying identifier with a resolvable document; VCs give signed attestations
about a subject. Neither answers KINP's question, which is not "who signed this?" but **"these two
authorities each minted an identifier for what is plausibly the same entity — what is the merged
view, and what must never merge?"** A DID method resolves; it does not reconcile.

### Not competitors, despite appearances

- **IETF Web Bot Auth is not a KINP competitor.** The working group was chartered 2025-10-23 and
  has **zero `draft-ietf-webbotauth-*` documents**; both milestones are missed. Its scope is
  bot→website authentication *"using existing identifiers"* — orthogonal to cross-authority entity
  identity by construction, not merely by maturity.
- **No standard does cross-authority MERGE.** Agent Name Service v2 resolves collisions by
  **revoking** one side. The MCP Registry **prevents** collisions by namespace ownership.
  `owl:sameAs` is fifteen years into a documented failure mode (identity inflation, and the
  now-canonical "`sameAs` is not always the same" critique). KINP's hybrid merge policy plus the
  `same_as` / `based_on` firewall is a real gap, not a restatement.

### What this sweep changed

Nothing was retired; four of the six specs sit in a genuine gap and two are correctly-scoped
profiles. What changed is the *shape of three claims*: KMI narrows to a bridge, KFT adopts half
its manifest surface by reference, and ADR-0006 leads with the charter argument instead of a
preference. The suite is smaller in what it asserts and larger in what it can defend.

## In short

Koine is a thin semantic layer that **reuses A2A, MCP, and mature domain standards for everything
they already do well**, and adds only the identity, knowledge, media, and capability *meaning*
those layers leave undefined. If you already speak A2A or MCP, you are most of the way to
speaking Koine.
