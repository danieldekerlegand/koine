# ADR-0010 — KMI is a bridge between C2PA and MovieLabs OMC, not a third lineage vocabulary

**Status:** Accepted (2026-08-13)
**Deciders:** ecosystem owner
**Refines:** [`../specs/media-interchange.md`](../specs/media-interchange.md) (KMI) §3, §3.1–§3.4;
informs [`ADR-0005-otio-canonical-timeline.md`](ADR-0005-otio-canonical-timeline.md) (which
delimited koine's additive layer over OTIO as *identity, lineage, and the knowledge bridge* — this
record narrows the middle term of that list)
**Applies to:** media authorities (producer/authority for assets), media producers of any modality,
media consumers, and control-plane hosts brokering transforms on an agent's behalf.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

KMI §3 defines an **asset-lineage graph** — four binary relations (`media:derived_from`,
`media:variant_of`, `media:excerpt_of`, `media:perceptual_match`) carried in the KGP envelope, so
each edge has confidence, provenance, and a world. Together with §2's content-addressed asset id,
that graph was advertised as one of two things koine adds over OTIO, and the spec read as though the
ground were unoccupied.

**It is not.** A prior-art sweep found two bodies of work already modelling how one asset comes from
another, and koine mentioned neither:

- **C2PA** ships a **cryptographically signed** derivation chain. Each input to an asset is a
  `c2pa.ingredient` assertion whose `relationship` is `parentOf`, `componentOf`, or `inputTo`; each
  ingredient carries a hash-based **hard binding** to the bytes it names; the manifest is signed by
  a credentialed actor, so the chain is *attestable*, not merely recorded. It is also **deployed** —
  a conformance program listing **159 certified products as observed 2026-08-13**, including Google
  (roughly 35 entries), OpenAI, Amazon Bedrock, Getty Images, Qualcomm (in silicon), and Sony.
- **MovieLabs OMC v2.8** ships a derivation vocabulary **richer than C2PA's and richer than §3's**:
  **Revision**, **Variant**, **Derivation**, **Representation**, and **Alternative** — separating a
  new *version* of a work from a differently-encoded *rendition* from a functionally-substitutable
  *alternative*, distinctions §3 collapses into `media:variant_of`.

So KMI faced a signed, certified, widely deployed standard on one side and a richer domain ontology
on the other, and was publishing a third vocabulary against both while claiming the ground was open.
The claim was wrong on the facts; the question this record decides is what to do about the *design*.

Two koine precedents pull in opposite directions and both must be applied honestly.
[ADR-0005](ADR-0005-otio-canonical-timeline.md) **adopted** an external standard as canonical the
moment that standard covered the concern — koine's bespoke timeline was reinvention.
[ADR-0006](ADR-0006-kgp-rdf-prov-jsonld-relationship.md) **retained** a bespoke canonical and paid
the interop debt with a specified, round-trip-tested **projection**, because the standards modelled
the neighbouring concern but not the one KGP's identity discipline actually needed. The test is the
same in both: *does the standard discharge the requirement, or merely resemble it?* It is applied
here, to a third concern, and was allowed to come out either way.

---

## Options considered

### Option (a) — Keep §3 as-is, unmapped: ship a third lineage vocabulary

Leave the relations and the claim alone; say nothing about C2PA or OMC.

**Against.**
- It is the losing move on its own terms. Against a signed, certified, widely deployed chain **and**
  a richer domain vocabulary, a third unmapped vocabulary wins no adoption argument.
- Unmapped does not mean unmapped in practice — it means **every implementer invents the mapping
  privately**, which is precisely the interop failure ADR-0006 §4.1 closed for KGP. Two producers
  bridging KMI to C2PA independently would emit mutually unreadable manifests.
- It leaves a false claim in a normative document. That is a defect regardless of the design.

*Rejected.*

### Option (b) — Adopt C2PA wholesale as KMI's lineage model

Delete §3's relations; a KMI asset's lineage *is* its C2PA manifest chain.

**For.** Attestation for free, and the largest deployed footprint on this page.

**Against.**
- **A signature would become mandatory for internal bookkeeping.** C2PA's value is that everything in
  a manifest is attested by a credentialed actor. Recording "this preview is a downscale of that
  master" inside the fabric is not an attestation and must not require a certificate.
- **No place for a probabilistic edge.** `media:perceptual_match` is a similarity signal and
  **never identity** (KINP delta E). C2PA has no per-ingredient confidence — correctly, since a
  signed document should not carry hedged claims — so adopting it would either drop the relation or
  launder it into an attestation nobody made.
- **Manifest-anchored, not global.** A manifest is a per-asset *inbound* view travelling with the
  bytes. A knowledge authority that never holds the bytes could not assert or traverse lineage at
  all, and outbound traversal is not recoverable from a manifest.
- **Coarser than §3 where §3 is load-bearing**: no rendition/derivation distinction, no sub-range
  operand for `media:excerpt_of`.
- **It discharges neither thing KMI actually claims** — no world-scoping, no analysis→knowledge
  bridge — so adoption would not have retired §5 or `source_world` anyway.

*Rejected.*

### Option (c) — Adopt MovieLabs OMC v2.8 wholesale

Delete §3's relations; adopt OMC's five and its surrounding model.

**For.** Strictly richer than §3, from the domain that knows the problem best.

**Against.**
- **It is a production-domain ontology, and koine binds roles, not one industry's workflow.** KMI
  must hold for a TTS narration, a game capture, a screenshot in a chat log — participants with no
  production context at all. Importing a production ontology into the fabric's baseline is the
  agnosticism violation `CLAUDE.md` forbids.
- **Its richness requires knowledge KMI's producers do not have.** Nothing in a transcode pipeline
  knows whether its output is a Variant, a Representation, or an Alternative. A canonical whose
  relation choice demands a judgement the producer cannot make yields confident garbage — worse
  than the coarser relation that is merely honest.
- **The KGP envelope still would not be discharged.** OMC does not carry per-edge confidence and
  provenance in the form the rest of koine already speaks, so the envelope would have to be added
  back on top of it.
- **Adopting either standard leaves the other unbridged.** A producer publishing media still needs
  C2PA; a producer inside a professional production still needs OMC. Adoption picks one audience.

*Rejected.*

### Option (d) — Retain §3 as the fabric-internal form and specify projections onto both

Keep the four relations, because they are what the KGP envelope can carry and what the fabric's
generic producers can actually populate; stop claiming the ground; specify the mapping onto each
target, name what does not survive, and make conformance a round-trip.

**For.** It is the only option that serves both audiences, keeps confidence/provenance/world on
every edge, requires no certificate for internal bookkeeping, demands no domain judgement a
generic producer cannot make, and leaves KMI claiming only what it can defend.

**Against.** Two mappings to maintain, and two upstream pins that will drift. Both are real costs and
are paid explicitly below.

*Decided.*

---

## Decision

**KMI is a bridge between C2PA and MovieLabs OMC, not a third lineage vocabulary.** Concretely:

1. **§3's relation set is retained** as the fabric-internal canonical form — not because it is
   better than either standard, but because it is the form the KGP envelope (confidence,
   provenance, world) can carry and the form a generic producer can populate without domain
   judgement it does not have.
2. **§3 is explicitly not claimed as new ground** (§3.1). The spec engages C2PA and OMC by name,
   with dated adoption evidence, and says in its own voice that being the bridge is the deliberate
   position rather than a retreat from a larger one.
3. **The projections are specified in the spec, not left to implementers** — §3.2 onto C2PA's
   ingredient relationships, §3.3 onto OMC's derivation vocabulary — each stating relation by
   relation what it maps to and, explicitly, **what does not survive**.
4. **Neither projection is lossless, and neither claims to be.** This is the one place KMI's
   discipline is deliberately weaker than KGP's, whose RDF-star/PROV/JSON-LD projection round-trips
   losslessly over its binary core. Both KMI targets are *asymmetric* to §3 — C2PA is coarser and
   collapses it, OMC is finer and §3 cannot fill it — so the obligation is **complete or reported**:
   what is not projected is reported, never silently dropped.
5. **Conformance is the round-trip, not a document shape.** Over the subset it projects, a
   projection MUST read back to the same §3 edges. Accordingly **no schema in `schemas/` gains a
   projection document shape** — the same rule ADR-0006 fixed for KGP.
6. **Emitting a projection is OPTIONAL; emitting it differently is not.** A producer may ignore both
   targets; a producer that emits one MUST emit it per §3.2 / §3.3.
7. **Neither target is authoritative on ingest.** An arriving C2PA manifest or OMC record is
   *evidence* that mints §3 edges under the producer's normal provenance and confidence rules.
8. **What KMI claims narrows** to the two things §3.1 identifies as unoccupied: the
   **analysis → knowledge bridge** (§5) and **world-scoping** (§2, §5) — with the re-open test §3.1
   states, under which a standard that later specifies either binding makes adoption the right move.

---

## Consequences

- **KMI's self-description changes, and `docs/positioning.md` follows the spec.** The spec is the
  record; any disagreement between them is a positioning bug.
- **Two upstream pins enter the drift check.** C2PA's ingredient revision and OMC v2.8 are now
  normative references from a spec, so they take rows in
  [`../docs/upstream-standards.md`](../docs/upstream-standards.md) and are reviewed on that file's
  cadence. Moving either pin is a spec change.
- **A standing obligation on §3.** Any relation added to §3 later MUST appear in both projection
  tables or be explicitly declared unprojected, with the reason. A relation absent from them is a
  defect, not an omission.
- **One new downstream artifact, named and not built here.** The machine-checked round-trip fixture
  for both projections is a **downstream validator** per
  [ADR-0001](ADR-0001-control-plane-topology.md) — conformance fixtures live with the implementing
  runtime, not in koine — and is tracked cross-repo alongside KGP's projection fixture (see
  `../tasks/chief/`).
- **KMI's re-ratification gate is unchanged.** Because emitting a projection is optional, the
  fixture gates the *projections'* conformance, not KMI's status. KMI's path back to ratified
  remains the outstanding re-run of
  [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md), which it shares with
  KCB.
- **The asymmetry is now documented rather than latent.** A reader who wants attestation knows to
  emit C2PA; a reader in a professional production knows to emit OMC; a reader who wants lineage
  *joined to knowledge* has one place to get it, and that is the whole of KMI's claim.
- **Cost accepted:** two mappings to maintain against upstreams that move independently. The
  alternative — an unmapped vocabulary — costs the same maintenance privately, in every
  implementation, incompatibly.

---

## Relationship to the specs

- [`../specs/media-interchange.md`](../specs/media-interchange.md) §3 (the retained relation set),
  §3.1 (prior art and the narrowed claim), §3.2 (C2PA projection), §3.3 (OMC projection), §3.4 (the
  shared conformance obligation), §5 (the claim that remains).
- [`ADR-0005-otio-canonical-timeline.md`](ADR-0005-otio-canonical-timeline.md) — adopting OTIO left
  *identity, lineage, and the knowledge bridge* to koine. This record narrows **lineage** in that
  list from a claim to a bridge; identity (§2) and the knowledge bridge (§5) are untouched.
- [`ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](ADR-0006-kgp-rdf-prov-jsonld-relationship.md) —
  the retain-and-project discipline this record reuses, and the source of the *conformance is the
  round-trip, not a document shape* rule.
- [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) — why the round-trip
  fixture is a downstream artifact.
