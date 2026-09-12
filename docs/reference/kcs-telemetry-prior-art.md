# The emitted-telemetry prior art — what was read on 2026-09-12, and the verdict

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

koine is about to specify an **exchange record**: an optional, observation-shaped frame carrying
what a capability exchange was — the verb, the capability, the two parties, the world, the tier,
the status, the ceiling **and its unit**, the actual spend, the timings, and the ids the exchange
touched. Span models and context propagation are mature, standardised, widely-deployed work in
exactly that neighbourhood, and under the [ADR-0006](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) /
[ADR-0010](../../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md) discipline the choice is
**profile by reference, or mint and record what was read and when**. Taking the second without
doing the first is what those two ADRs exist to prevent.

This page is the first half — the reading — and the verdict it gates.

**What this page is not.** It binds no clause and moves no version. Every spec header remains the
sole authority on its own version and status; nothing here is a status mirror. The clause the
verdict licenses lands in [`../../specs/conformance-scenario.md`](../../specs/conformance-scenario.md),
and the one pin it takes lands in [`upstream-standards.md`](upstream-standards.md), which is the
table of record for every upstream koine names.

**Verdict, up front — it is a split, and each half is stated with its reason in §5.**

| | Disposition |
|---|---|
| **W3C Trace Context** (`traceparent` / `tracestate`) | **Profile by reference.** Correlating one exchange observed at two participants is the problem it solved; minting a second trace identifier would compete with a working convention and lose. Pinned at **Level 1 — W3C Recommendation 2021-11-23**. |
| **OpenTelemetry** (trace data model, SDK, semantic conventions) | **Resembled, not adopted** — the disposition [`upstream-standards.md`](upstream-standards.md) already gives Kubeflow TrainJob, and for the same measured reason: the shape is the precedent, and the seam koine needs is empty in it. Two further findings in §3, one of which bears directly on the evidence rule. |
| **CloudEvents** | **Read and dismissed.** An envelope, deliberately silent about its payload — and koine's carrier for a frame on this channel is already fixed by KCB §4.2d/§7.3g. A second envelope over one channel is the defect this repo has filed five times. |

---

## 1. The starting fact, recorded rather than assumed

Before this sweep, **no koine specification had ever cited any of this prior art in writing.**
Measured, not remembered:

```
$ grep -rni 'opentelemetry\|traceparent\|trace-context' specs/
(no matches)
$ grep -rni 'opentelemetry\|traceparent\|trace-context\|trace context' . --include='*.md'
ROADMAP.md:371:   … | grep -rni 'opentelemetry\|traceparent' over these specs returns nothing | …
```

The single repository-wide match is the roadmap row recording that the gap exists. So this is a
**first reading**, and it is dated as one: everything below was fetched on **2026-09-12**, and
every version, status line and quotation is as served on that date. A later reader checking whether
it still holds is doing the [drift check](upstream-standards.md#the-drift-check), which is the point
of dating it.

## 2. What was read, and when

Fetched **2026-09-12**. "Version" is what the document served, not what is remembered about it.

| Artefact | Version / status as fetched | What it fixes |
|---|---|---|
| **W3C Trace Context** | **W3C Recommendation, 23 November 2021** (*"includes editorial updates since the 6 February 2020 W3C Recommendation"*) | `traceparent` — `version` · `trace-id` (16 bytes) · `parent-id` (8 bytes) · `trace-flags` (only `sampled` defined); `tracestate` — optional vendor name/value pairs. **Propagation**, nothing else. |
| **W3C Trace Context Level 2** | **Candidate Recommendation Draft, 28 March 2024** | Adds the random-trace-id flag plus trace-id/span-id generation guidance. Not a Recommendation. |
| **OpenTelemetry Specification** | **1.60.0** | Trace data model. A Span carries: name · SpanContext · parent · **SpanKind** (`SERVER` `CLIENT` `PRODUCER` `CONSUMER` `INTERNAL`) · start and end timestamps · attributes · links · events · **Status**, a **closed** enum (`Unset` `Ok` `Error`, description permitted only with `Error`). |
| **OpenTelemetry trace SDK** | same spec release | The **Sampler**: `DROP` · `RECORD_ONLY` · `RECORD_AND_SAMPLE`, with exporters receiving only sampled spans. A conformant deployment may export **zero** spans. |
| **OpenTelemetry Semantic Conventions** | **1.44.0** | General · CI/CD · cloud · database · exceptions · FaaS · feature flags · GraphQL · HTTP · messaging · object stores · **RPC** · system, plus per-signal conventions. |
| **OpenTelemetry GenAI semantic conventions** | **moved out of the main repository**; the in-tree `gen_ai.*` registry entries are marked **Deprecated** | Token accounting only — `gen_ai.usage.input_tokens`, `output_tokens`, `cache_creation.input_tokens`, `cache_read.input_tokens`, `reasoning.output_tokens`. |
| **CloudEvents** | **v1.0.2** latest release (`main` serves **1.0.3-wip**) | REQUIRED context attributes `id` · `source` · `specversion` · `type`; OPTIONAL `datacontenttype` · `dataschema` · `subject` · `time`. Of the payload: *"This specification does not place any restriction on the type of this information."* |

## 3. What each does, and does not, cover for an exchange record

The ask names eleven things the record carries. Reading the prior art **against that list** is the
whole of the sweep, because a standard is not a candidate for adoption in the abstract — it is a
candidate for carrying a named field.

| What the record carries | Covered by standardised work? |
|---|---|
| **Correlation** — one exchange, observed at two participants, recognised as one | **Yes, definitively.** `traceparent`'s `trace-id` + `parent-id`. This is the single thing worth taking by reference. |
| **Timings** | **Yes.** Span start and end timestamps. |
| **Status** | **Yes, and instructively.** OTel's `Status` is a **closed** three-value enum with description permitted only on `Error`. That a status field on an exchange record is closed rather than free-form is the **settled** shape, not koine's invention — which is what makes closing it a correction rather than a novelty. |
| **The verb** | **No.** SpanKind carries *direction* (`CLIENT`/`SERVER`), not the operation; semconv's nearest is `rpc.method`, an open string. KCB §4 types exactly five verbs, and a free string cannot be asserted against that. |
| **The capability** | **No.** semconv has `rpc.service` / `rpc.method` and **no version anywhere**, so KCB §7.1's identity pair `(name, version)` — *"not the name alone"* — has no carrier. |
| **The two parties, as KINP ids** | **No.** `service.name` is a free-form resource attribute and `server.address` / `client.address` are network addresses. Neither is an identity under a namespace grammar (KINP §3.1). Trace Context carries no party at all. |
| **The world** | **No.** Nothing in semconv 1.44.0 names anything of the kind. |
| **The trust tier** | **No.** |
| **The ceiling, and its unit** | **No.** semconv 1.44.0 defines no attribute for a monetary cost, a currency, a spend unit or a budget ceiling — checked across its listed areas. |
| **The actual spend** | **No.** The nearest is GenAI's token **counts**, which are counts and not amounts, carry no unit or currency, and are in a convention set that has been moved out of the main repository with the in-tree entries deprecated. |
| **The ids the exchange touched** | **No, not as typed ids.** OTel `Links` correlate *spans*; domain identifiers could ride as opaque attribute strings, which is precisely the un-asserted form KCS §5 cannot evaluate against. |

**Three of eleven.** And the eight that are missing are not an arbitrary eight: they are exactly the
fields that make the record **evidentiary for a KCS assertion** rather than merely diagnostic. A
`cost_within_ceiling(invoke, budget)` cannot be decided from a document that has no ceiling, no
unit and no spend; a `tier_resolved(invoke, tier)` cannot be decided from one with no tier. This is
the same empty seam the **Kubeflow TrainJob** row records one spec over — *"no license, egress,
trust-tier, or budget field anywhere in its API"* — and it is empty for the same honest reason:
observability describes a system to its operator, and these fields exist to hold one party to a
term across an **organizational boundary**. They are not an oversight upstream.

### 3.1 The finding that bears on the evidence rule, not on the vocabulary

The sharpest thing the sweep returned is not about fields at all. **OpenTelemetry's data is
droppable by construction.** Its SDK specification defines a Sampler with `DROP` and `RECORD_ONLY`
decisions and states that exporters *"MUST receive those spans which have `Sampled` flag set to
true and they SHOULD NOT receive the ones that do not"*; a deployment sampling at zero exports
nothing and remains conformant. That is correct engineering for observability, where the cost of
recording everything is the problem being solved.

It is **fatal for evidence**, and it fixes two things about the fold before a clause is written:

1. **Emission must stay OPTIONAL**, and not as a courtesy to participants without a console — as a
   truthful description of every deployed system of this shape. A koine clause requiring emission
   would be requiring something the entire standardised ecosystem in this space declines to require.
2. **An absent record asserts nothing**, so an emitted record may never *outrank* an outcome a
   runner observed itself. A predicate decided off a droppable document is decided off evidence
   whose absence means neither *it did not happen* nor *it happened and was not recorded*. koine has
   written this reading four times on other planes — KCB §4.5(c)'s absent `fetch` outcome reads
   *pending*, KCB §4.2b's unanswered adjustment reads *not in force*, KMI §2's absent `egress` is
   *not* `exportable`, KMI §7.1's unreachable store is a pending fetch and never a conclusion — and
   it is the same reading here.

That finding is an input to the **evidence-precedence rule**, which is the half of this fold that
cannot stay informative. It is recorded here because it came from the sweep, and a sweep whose only
output is a pin table has under-read its sources.

## 4. CloudEvents — read and dismissed, with the reason

CloudEvents is the mature answer to *how do I put a typed event on a wire such that a consumer can
route it without understanding it* — `id`, `source`, `specversion`, `type`, and an explicit refusal
to constrain the payload. It is a good specification and it is not this one's problem to solve.

Two reasons it is dismissed rather than deferred:

- **The carrier is already fixed.** An exchange record travels as a frame, and KCB **§4.2d** mints
  *one* in-band control channel in both directions with a MUST against minting a second, while
  **§7.3g** states there is *"one place its vocabulary is named"*. Adopting a second envelope over
  that channel would put a normative token in a slot no koine clause names — which is the defect
  this repository has now filed **eight** times on one axis — MA-8, V-10, BP-7, ADR-0014's marking,
  MA-17, MA-20, MT-2, BP-9, every one of them *a rule with a declared normative consequence and
  nothing that carries it*. Minting the ninth deliberately would be remarkable.
- **It carries the envelope and declines the payload**, which is the half koine does not need and
  refuses the half koine is writing. Its `type` is where the meaning would have to go, and its
  value space is the domain's own — so adopting it would buy a `specversion` field and oblige a
  commons two authority domains must agree on before exchanging a record, against KINP §3.4's one
  deliberately non-federated commons.

Recorded so the option is not lost: if a later revision needs an exchange record to cross a
**transport koine does not specify** — a message bus rather than the KCB channel — CloudEvents is
the envelope to profile, and this paragraph is the re-open trigger.

## 5. The verdict, and what it obliges

**Profile by reference — W3C Trace Context, Level 1.** Where a §9 exchange record carries a
correlation identifier, it is a Trace Context `trace-id` and not a koine-minted one. The reasoning
is the **Hugging Face `base_model`** row's, verbatim in shape: the convention is deployed
everywhere, it already rides the HTTP that carries MCP and A2A, and a parallel koine trace
identifier would compete with a working convention and lose. It costs koine nothing — Trace Context
constrains propagation and says nothing about what koine puts in the record — and it buys the one
property the record cannot establish for itself, that **two participants' observations of one
exchange are recognisable as one exchange**.

The pin is **Level 1, the Recommendation of 2021-11-23**, and the **Level 2 Candidate Recommendation
Draft of 2024-03-28 is deliberately not taken**. That is the [OWL-Time row's](upstream-standards.md#the-pin-table)
worked pattern and the same argument: a CR Draft is by its own boilerplate revisable at any time,
the `trace-id`/`parent-id` fields koine reads are unchanged between the two, and staking a normative
clause on a document that may still move buys nothing. Re-check when Level 2 reaches Recommendation.

The row is added to [`upstream-standards.md`](upstream-standards.md) so the quarterly drift check
sweeps it like every other upstream. It is entered **⬜ not yet pinned** until the citing clause
exists, and moves to ✅ when KCS §9 cites it — a row claiming a spec pins something no spec cites
would be the drift the table exists to surface.

**Mint and record — everything else.** The eight uncovered fields of §3 are minted in KCS §9, and
this page is the *record* half of *mint and record*: it states what was read, on what date, and what
each source does and does not carry, so that a later reader can tell a decision from an omission.
Three constraints follow from the reading and are not free choices:

- **`status` is a closed enum**, because that is the settled shape (OTel's `Status`) and because a
  field documented free-form and consumed as closed is a divergence between two conformant readers —
  the class of defect delta **R** already records against `structure_matches` one section over.
- **Spend names its unit**, because a ceiling that does not is the defect KCB §5 already refuses an
  `invoke` for (MA-6), and because the one standardised near-neighbour — GenAI's token counts —
  demonstrates the failure rather than the fix: a count with no unit is not an amount.
- **Emission is OPTIONAL and its absence asserts nothing** (§3.1).

**Resembled, not adopted — OpenTelemetry.** No KCS clause delegates to it, no KCS field is defined
by it, and it therefore takes **no pin**: this page is the record of the reading, and
*"a prior-art link is not a pin"* is [`upstream-standards.md`](upstream-standards.md)'s own words,
in the W3C PROV row. What is carried forward is the *shape* argument (a
closed status enum, start/end timestamps) and the *sampling* finding, both cited above with what
they decide.

## 6. The downstream draft, read as input

An implementer in the **conformance-console role** has been shipping this vocabulary without it, and
holds a draft of the extension in its own tree carrying **nine reconciliations, D-1…D-9**. That
draft is **input, and a proposal** — it is cited here, and it is not adopted as a decision. The
reason is structural rather than a judgement on its quality: koine's ratification evidence is
computed in part off the shape that implementer emits, so adopting its draft as a decision would be
this repository ratifying its own downstream reflection. The same reading the KCS *Pressure test*
already applies to **DR-7** and **DR-8** — an encoding that predates its fold asserts nothing about
the fold — applies to a draft that predates the clause.

Two of the nine are named in the ask and are answered **in the text** rather than inherited, because
both are correctness questions rather than preferences:

- **Spend arrives un-denominated beside a grant that must denominate its unit.** KCB §5 already
  refuses an `invoke` whose `budget_units` ceiling crosses an authority boundary without stating its
  unit; a record reporting the spend against that ceiling in no unit cannot be compared to it.
- **`status` is documented free-form and consumed as a closed enum.** Two conformant readers, two
  readings, one document.

The other seven have **not been read here** and this page deliberately does not restate them: a
record that paraphrases a document it has not read is worse than one that says it has not. Reading
them is available to whoever folds a later revision, and the draft is cited by role above so that a
reader can ask for it.

**The split of work is stated so neither side waits on the other.** Ratifying the clause is koine's.
Rewriting the console's span implementation against the folded text is the implementer's, downstream
under [ADR-0001](../../decisions/ADR-0001-control-plane-topology.md), and nothing in this repository
closes it.

## 7. What this sweep does not claim

- **It is not a full-table drift sweep.** One row was fetched fresh — the new Trace Context row. No
  existing row of [`upstream-standards.md`](upstream-standards.md) was re-fetched, so that file's
  *Last reviewed* header does not move and the quarterly floor still stands where it stood.
- **It read specifications, not implementations.** Whether a given observability backend accepts a
  record of this shape is an implementation question and is not evidence for or against the clause.
- **It does not close delta R**, does not promote KCS, and does not discharge **DR-10**. The reading
  above bears on `structure_matches` only by analogy — both are divergence-between-conformant-readers
  defects — and an analogy is not a fold.
- **Three of the artefacts above have no version track that ages predictably** (the GenAI
  conventions mid-move, CloudEvents' `main` serving a `-wip`, semconv's per-area stability). Where
  that is so it is said above rather than smoothed over, and none of the three is pinned.

## Related

- [`upstream-standards.md`](upstream-standards.md) — the table of record for the Trace Context pin, and the drift check that ages it.
- [`../../specs/conformance-scenario.md`](../../specs/conformance-scenario.md) — KCS, where the clause this sweep gates lands.
- [`positioning.md`](positioning.md) — what koine adopts, bridges, or dismisses, and why.
- [`../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](../../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) and [`../../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md`](../../decisions/ADR-0010-kmi-lineage-bridge-not-vocabulary.md) — the profile-by-reference-or-mint-and-record discipline this sweep discharges.
- [`generative-audio-modalities.md`](generative-audio-modalities.md) — the decide-before-a-row-is-written discipline this page follows.
