# The layer claim — what koine specifies, what it does not, and where it stands

> **Status:** Current · **Updated:** 2026-09-03 · **Owner:** koine · **Informative**

**Who this is for.** Someone meeting koine from outside — most likely from the governance-gaps
paper cited in §4 — who has not read this repository and should not have to in order to decide
whether koine is relevant to them. It is written to be read on its own.

**What it is not.** It binds no clause, adds no gate and moves no spec version. Where it disagrees
with a spec, the spec wins and this file is the defect. Every number in it is sourced from a file in
this repository; §7 lists the sources and states what was deliberately *not* drawn on.

---

## 1. The claim, in one paragraph

A2A and MCP are transport and RPC: MCP connects an agent to tools and resources, A2A lets agents
discover one another and delegate tasks. Both are deliberately payload-agnostic — they move
messages and do not define what the messages *mean*. **koine specifies the meaning**: stable
identity, knowledge, media and capability semantics that travel *over* that transport, written
against **roles** (producer / consumer / authority / host / provider) rather than against any
product. It is contracts only — no code, no server, no hub. The one-line form: **A2A and MCP carry
the message; koine says what it means.**

## 2. What koine specifies

Six specifications, each versioned and pressure-tested independently:

| | Plane | What it fixes |
|---|---|---|
| **KINP** | identity | Stable cross-authority identifiers, the merge policy for two authorities that named the same entity, and the `same_as` / `based_on` firewall that keeps real-world and fictional worlds from contaminating each other. |
| **KGP** | knowledge | Claims as content-addressed units, so two producers asserting the same thing converge on one id; provenance travels beside the claim, never inside its identity; license class, egress class and trust tier ride every record. |
| **KMI** | media | Asset identity and lineage over an adopted timeline model (OpenTimelineIO), plus the analysis→knowledge bridge. |
| **KCB** | capability | How a participant advertises a capability inside its A2A AgentCard, and how another discovers, authorizes (grant + spend ceiling) and calls it. |
| **KCS** | conformance | A declarative scenario — data, not code — driving several **real** participants over their actual connections, asserting properties that span planes, each tied to the clause it tests. |
| **KFT** | fine-tuning | A profile composing the four planes for training jobs: dataset and model *by reference*, egress-gated placement, graded refusal. |

*How many of the six are `ratified` today is deliberately **not** stated here.* Each spec's own
header is the only authority on its version and status; three tables in this repo mirror those
headers and are machine-checked against them, and
[`promotability.md`](promotability.md) says one line per spec on what stands between it and
`ratified`. A count written into this page is a fourth, unchecked mirror, and it rots on the next
promotion. (**Corrected 2026-09-03.** This paragraph used to read *"two of the six are ratified,
four are candidate"* — true when it was written on 2026-08-18, and wrong **two days later**: the
two it counted were KCS and KINP, and KCS 0.3.0's determinism fold demoted one on 2026-08-20 and
KINP 0.3.0's federation fold the other on 2026-08-23, leaving **zero** until KGP returned on
2026-08-28. It read as a *dated* reading, which
is why nothing caught it: a date does not stop a number being read as current. The fix is to hold
no count at all rather than to restate a fresh one. Record:
[`doc-drift-corrections.md`](doc-drift-corrections.md).)

## 3. What koine does not specify

This section is the more useful half. A contract that says what it is not for is easier to adopt
than one that appears to claim everything.

### 3.1 Not a runtime, and not a hub

There is no code here and no central server. Participants talk **directly**; the shared layer is
thin by design (*dumb pipes, smart endpoints*). A participant publishes its own self-description —
namespace, capability manifest, egress policy, vocabulary mappings — from its own endpoints, and a
registry returns an **address** to that self-description, never the self-description itself.

### 3.2 Not transport

koine defines no wire protocol of its own. It rides A2A and MCP and adds a convention over them.

### 3.3 Not the governance layer

This is the boundary most worth stating precisely, because the evidence in §4 is *about* governance
and koine is not a governance protocol. Measured against the six-dimension taxonomy of that paper,
on its own criterion (*what the specification encodes, not what could be built on top*):

| | Dimension | koine |
|---|---|---|
| **G1** | Membership | **Partial** — identity, self-declared role and per-capability authorization exist; admission and removal do not. Registration confers a name, not a privilege. |
| **G2** | Deliberation | **Absent — decided non-goal.** |
| **G3** | Voting | **Absent — decided non-goal.** |
| **G4** | Dissent preservation | **Absent — decided non-goal.** |
| **G5** | Human escalation | **Partial, narrow** — exactly one route to a person exists (the merge review queue), and it is a knowledge-contamination control, not a general escalation mechanism. |
| **G6** | Audit / replay | **Partial** — artifacts are provenanced and tamper-evident by construction; **events and decisions are not recorded at all**, and no past run can be reconstructed from a report. |

**The boundary in one sentence:** *koine specifies what crosses an organizational boundary, not how
one organization decides.* Every gate koine defines — license, egress, grant, spend ceiling,
training-data admission — is **unilateral**, and refusing is always available, so there is no
fabric outcome that is a function of several participants' preferences. A prior-art sweep dated
2026-08-18 found no standards-body specification of deliberation, voting or dissent preservation to
profile, and koine's rule is to adopt by reference or decline, never to invent. So it declines, and
records the conditions that would make that wrong.

Three things this is **not**:

- **Not a dismissal of governance.** G1, G5 and G6 stay measured *Partial* with three named
  findings open — a grant that is issued and never ends, gates that decide and record nothing, and
  a report whose run is not reproducible from it. Those are on koine's own axis and "governance is
  not koine's axis" must not be cited against them.
- **Not permanent.** The non-goal states its re-open trigger: a joint decision binding two
  participants under different minting authorities, a standard that appears and can be profiled, or
  any koine gate ceasing to be unilateral.
- **Not a claim that the property is unreachable.** Where two participants assert contradictory
  claims, both survive with provenance and confidence intact and neither is silently dropped —
  which is what dissent preservation exists to protect, reached without a governance layer.

### 3.4 Not economic coordination

A capability carries a cost and a grant carries a spend ceiling, but that is one participant
refusing to overspend its own budget. koine specifies no payment, settlement, pricing or incentive
mechanism.

### 3.5 Not a restatement of what it adopts

Where a standard covers a concern, koine cites it and mints nothing: **OpenTimelineIO** as the
canonical timeline model, **MLCommons Croissant** for dataset description, **KitOps / ModelPack**
for weights packaging and the Hugging Face **`base_model`** convention for published model lineage,
**SPDX** identifiers for licenses, the W3C **PROV** *shape* for provenance, IRIs and CURIEs for
identifiers. Where prior art is better than koine's, koine projects onto it
rather than shipping a third vocabulary — that is what the media lineage plane does toward C2PA and
MovieLabs OMC, with its lossy edges named rather than hidden.

## 4. The independent evidence for the layer — and its limits

Richard Kang and Yudho Diponegoro, *Governance Gaps in Agent Interoperability Protocols: What MCP,
A2A, and ACP Cannot Express*, [arXiv:2606.31498](https://arxiv.org/abs/2606.31498), submitted
**30 June 2026**, grades five protocols — MCP, A2A, ACP, ANP, ERC-8004 — against the six dimensions
in §3.3 and concludes:

> "agent community governance constitutes a missing architectural layer above current
> interoperability standards, not a missing feature within them."

That is koine's own structural conclusion, reached independently by authors who had never seen this
repository. It is the strongest external evidence koine has, and it is worth being exact about what
it does and does not carry:

- **It does not analyse, mention or evaluate koine.** It is evidence that *a layer above MCP/A2A*
  is a real architectural position, not evidence that koine's clauses are right.
- **The non-overlap runs both ways.** The paper's axis is collective decision-making. koine's is
  interchange semantics between organizations — license, egress, trust tier, budget, grant. Not one
  of the paper's six dimensions is one of koine's, and not one of koine's is one of the six. So
  **koine is not the answer to that paper**: it occupies a *different* layer over the same two
  protocols, and nobody should read "koine is the missing governance layer" out of this citation.
- **It is a taxonomy, not a specification**, so there is nothing in it to adopt by reference. It is
  cited by arXiv id and date, and deliberately never as a version pin — no koine clause delegates
  to it.

## 5. Where koine actually stands: pre-adoption

Stated plainly, because a positioning document that omits this is advertising:

> **koine has never been implemented by anyone outside this tree.** Every implementation of every
> spec is the work of **one operator**. A contract exercised only by its author is a format, not a
> standard.

Two measurements dated 2026-08-18, both run by koine against koine, both in this repository:

- **An implementability audit** of the artefacts a third party would actually receive — the specs,
  the JSON schemas, the relation registry, the policy files, the scenarios, the decision records —
  answering one question: *could a competent engineer implement identity resolution and a knowledge
  producer from the specs alone?* **A conformant knowledge-pack producer: no.** The canonical
  encoding is named but never defined; claim ids will not converge because four decisions the text
  does not make must each be guessed; and a spec-faithful pack is rejected by koine's own schema.
  **Identity resolution: partially** — the model is implementable and the resolver API is not
  bound to any wire. Nineteen findings; three fixed, sixteen recorded as known gaps.
- **An interop trial** that then *built* the pack from those artefacts alone and handed it to the
  receiving side the same artefacts supply. Measured claim-id convergence between two
  spec-conformant producers: **1 of 5** at the hash, **0 of 5** as identifiers. Conformance
  verdict: **NON-CONFORMANT**, on twelve clause-cited assertions. Eleven further findings, six of
  which only appear once an artefact has to be filled in. The failure mode is the dangerous one:
  both producers emit well-formed packs, both pass a syntactic check, and the claims that should
  have merged simply do not — with no signal to either side.

And the honest note on conformance machinery: koine's conformance-scenario spec is ratified, but
there is **no runnable suite and no console** in this repository yet, and the scenario vocabulary
cannot currently express the first question an implementer has — *"is what I produced conformant?"*
— because every step it defines is an interaction between live participants. That gap is recorded
as a finding against a ratified spec, not glossed.

## 6. What would change this

The evidence koine lacks is one implementation it did not write. Everything else — including this
document — is a claim about the specs rather than a measurement of them.

The shortest path to the first of those, taken from the audit's own list, is small and mechanical
except for its last item: a column specification for the canonical tabular encoding; two or three
claim-id **test vectors** with expected hex; the hash input shown unwrapped once; a named collation
and a defined sort order; one decision on whether a claim id is namespaced; one golden pack
fixture; and — the one real break — reconciling the shared schema's entity-id and provenance
definitions with the identity spec, in a file downstream repos vendor by drift-gated copy.

If you have implemented any part of this, the interesting output is not "it worked". It is **every
place you had to guess**, which is a defect in the text and is what this project wants.

## 7. What this document draws on, and what was not decided here

**Sources.** Everything above is sourced from this repository's own public files: the six specs in
[`../../specs/`](../../specs/), the decision records in [`../../decisions/`](../../decisions/) —
the governance non-goal in particular — and three documents in this directory:
[`positioning.md`](positioning.md) (the fuller standards comparison),
[`governance-taxonomy-map.md`](governance-taxonomy-map.md) (the measurement behind §3.3, including
the three open findings), [`implementability-audit.md`](implementability-audit.md) and
[`interop-trial.md`](interop-trial.md) (the two measurements in §5).

**What was deliberately not drawn on.** No material outside this repository was used: not the
operator's private integration repository, not any commercial, portfolio or strategy material. This
repository takes no dependency on any of them by rule, and a public artefact is exactly the wrong
place to be the first exception. Nothing here names a customer, a price, a roadmap commitment or a
commercial relationship, and the two company names that appear in [`../../README.md`](../../README.md)
are not repeated here because this document does not need them to make its point.

**On publication.** This repository is already public and Apache-2.0 licensed, so landing this file
in it *is* the publication, and **no decline was required**. What is deliberately **not** done here
is any outward distribution act — contacting the paper's authors, posting to a mailing list, a
protocol venue or an extension registry, or any other approach to a third party. Those are outreach
decisions with an owner and a posture behind them; they belong in a `decisions/` record, and an
informative document does not get to take them by implication. Their absence is a choice, recorded
so it does not read as an oversight.

---

## Changelog

- **2026-08-18** — Created. The public statement of the layer claim and its boundary: what koine
  specifies (§2), what it does not (§3, with the six governance dimensions and the three decided
  non-goals), the independent evidence with its limits stated in both directions (§4), and the
  pre-adoption position with both in-repo measurements and their numbers (§5). No spec, schema,
  registry or policy file changed; no version or status moved.
