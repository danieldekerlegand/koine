# ADR-0007 — The self-describing participant: communication config lives at the edge

**Status:** Accepted (2026-08-02)
**Deciders:** ecosystem owner
**Extends:** [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) (direct-dial
peers, route-by-lookup)
**Refines:** [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB) §2, §3; draws on
[`../specs/identity.md`](../specs/identity.md) (KINP) §3.4, §6 and
[`../specs/grounding-pack.md`](../specs/grounding-pack.md) (KGP) §7.1, §7.2
**Applies to:** every participant role (producer / consumer / authority / host / provider).
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

ADR-0001 settled where **traffic** goes: peers dial each other directly, and the shared control
plane hands back *addresses* rather than relaying payloads. It did not settle where **configuration**
goes — the far quieter question of who holds the answer to *"how do I talk to that participant, and
what will it give me?"*

That question has a default answer with strong gravity. Once a discovery registry exists, it is
tempting to let it hold not just addresses but the *content* those addresses describe: a shared
config store with every participant's namespace, ports, capabilities, egress rules, and vocabulary
mappings checked into one place, kept in sync by convention. It starts as a convenience (one file to
read, one PR to update two peers at once) and ends as the control-plane counterpart of the hub
ADR-0001 rejected: a component every participant must read from to function, that must be correct
about payloads it does not produce, and that turns a peer's local change into a cross-repo
coordination problem.

The pull is strongest for the artifacts that are *not* already served on the wire. A capability
manifest has an obvious home — KCB §2 puts it on the peer's own A2A AgentCard. But three other
things a peer must publish have had no stated home:

- the **namespace** it mints under and the fact that it is the minting authority for it (KINP §3.4);
- its **egress policy** — which of its knowledge is `exportable` and which is `local-only`
  (KGP §7.2), plus the license classes it will and will not release under (KGP §7.1);
- the **bridge / predicate mappings** by which its local vocabulary crosses into the shared
  registry relations, for the data it produces *and* the data it consumes.

Each of these is unavoidably a *deployment's* filled-in values, so koine cannot hold them (README
*"Scope: shape, not instance"*; [`../CLAUDE.md`](../CLAUDE.md) *"What does NOT belong here"*). But
"not in koine" is not the same as "in a central store somewhere else." Without a stated convention,
the residue lands in whichever shared place is nearest, and downstream participants end up unable
to stand up without it.

## Decision

**A participant is self-describing.** Everything another participant needs in order to communicate
with it is published **by that participant, from its own repository and its own served endpoints**.
No central hub, shared config store, or common repository holds a participant's communication
config, and no participant needs read access to another's repository to interoperate with it.

**1. Four facets, and the participant owns all four.**
A conformant participant publishes, for the roles it claims:

| Facet | What it publishes | Spec that fixes the shape |
|---|---|---|
| **Identity** | its namespace prefix and the fact that it is the sole **minting authority** for that prefix; the kinds it mints under it; its anchoring to external authorities where one exists | KINP §3.2–§3.4, §4.4, §6 |
| **Capability** | its KCB **capability manifest** — `kcb_version`, `produces` / `consumes` ports, `capabilities` (with `cost`), `auth`, `signing`, and any non-A2A endpoint such as `mcp` | KCB §2, §2.1 |
| **Egress** | its **egress policy**: which relations and records are `exportable` and which are `local-only` (never leaving the originating tier, under any encoding, including training sets), and the license classes it releases under | KGP §7.1, §7.2 |
| **Translation** | the **bridge / predicate mappings** for the data it produces and the data it consumes — how its local predicates cross into the shared registry relations, with each entry's dialect, egress, and id-space rules | KGP §5, §7; [`../registry/README.md`](../registry/README.md) |

A participant that claims only some roles publishes only the facets those roles reach: a pure
consumer still declares identity and capability, and still declares the egress and translation rules
governing what it **accepts**, because a consumer MUST reject a pack carrying `local-only` content
(KGP §7.2) and can only do so against a stated policy.

**2. Where each facet lives.**
The rule is *publish at the edge, index at the center*:

- **Served, machine-readable, authoritative:** the capability facet is served by the participant at
  its own `/.well-known/agent-card.json`, as the named KCB **AgentCard extension** — the entry in
  `capabilities.extensions[]` whose `uri` is the `https://w3id.org/koine/kcb/manifest` family URI
  (currently `https://w3id.org/koine/kcb/manifest/0.3`), carrying the manifest payload in its
  `params` (KCB §2). There is no second well-known file, and no copy of the card held elsewhere is
  authoritative.
- **In the participant's own repository, under its own version control:** the identity, egress, and
  translation facets, plus the reviewed source form of whatever the participant serves. These are
  the deployment's filled-in values; they are diffable, reviewable, and change on the participant's
  own release cadence — not on a shared repo's.
- **Registered by PR in the shared vocabulary, at prefix granularity only:** the namespace *prefix*
  is registered in KINP §3.4's open registry so it is reserved to exactly one minting authority.
  What that prefix reserves is a name; what is minted under it stays entirely with the participant.
- **In the shared registry, as vocabulary only:** a mapping's target relations. A mapping coins no
  relation name; closing a gap means adding a row to `registry/relations.tsv` or a domain file
  (`registry/README.md`). The mapping itself never comes here.

**3. The registry returns an address to the self-description, never the self-description.**
This is ADR-0001 decision 3 applied to configuration: *route-by-lookup, not route-by-proxy*. The
discovery registry (KCB §3) indexes what it crawls off each peer's card and hands back **addresses**;
peers then fetch the card directly from the peer that serves it. A registry entry is a cache and an
index, never a source of truth (KCB §3), and a stale entry is a stale *pointer* — resolved by
re-fetching from the participant — not a stale contract. Correspondingly, a participant is
**discoverable without being dependent**: it must remain fully functional, and fully describable to a
peer that dials it directly, when the registry is unavailable.

**4. No participant reads another participant's repository.**
Cross-participant integration goes through the served surfaces — the AgentCard extension, the KCB
verbs (`describe`, §4), and the data planes — never through a shared checkout, a vendored config
file, or a submodule of a peer's repo. A participant's in-repo facets are *its* source of truth for
*its* behavior; what peers consume is what it serves. This keeps a config change a one-repo change.

**5. Egress policy is enforced by the emitting participant, not by the fabric.**
The egress facet is not advisory metadata for a consumer to honor. KGP §7.2 places the filter at
**pack construction**, in the producer, before any encoding is emitted — so no central component
ever needs to hold a participant's egress rules in order for them to hold. This is the strongest
single argument for the convention: a centralized egress policy would be a shared component holding
the rules for data it never sees, which is precisely the failure mode ADR-0001 rejected on the data
plane, with a privacy blast radius attached.

**6. koine holds the shape; the values never come here.**
For each facet, koine specifies the shape and the vocabulary and stops. A participant's actual
namespace value, its port list, its `local-only` relation set, and its mapping entries are that
deployment's instance data and live in that deployment's own repository. No koine spec, schema,
registry file, or policy file may link to a participant's private config or take a dependency on it.
This ADR is what makes that stance *sufficient* rather than merely restrictive: a downstream
participant can hold its own config and still be fully interoperable, because the convention says
that is where the config is supposed to be.

**7. A shape-only in-repo self-description is warranted; a second served manifest is not.**
The served surface needs nothing new — KCB §2's AgentCard extension is the runtime self-description,
and adding a parallel well-known file would re-create exactly the duplication KCB 0.3.0 collapsed
(KCB §2.2). What has no shape today is the **source** self-description: the single in-repo document
by which a participant states where its four facets are, so the artifact it serves can be derived
and checked against a declared intent rather than hand-maintained. koine MAY therefore specify a
shape-only schema for that document, bounded by three rules: it carries **pointers and references,
not payloads**; it **references** the KCB manifest shape rather than restating it; and it embeds no
mapping, topology, or node/edge ontology. If those bounds cannot be held, the document is not worth
having and the AgentCard extension stands alone.

## Consequences

**Positive**
- A participant can be stood up, versioned, and changed **without a second repository** — the
  primary aim. Onboarding is "publish your card and your four facets," not "get write access."
- Config changes stay one-repo changes; there is no shared file two teams must edit in lockstep, and
  no drift between a peer's real behavior and a central store's belief about it.
- The registry stays thin enough to remain optional on the critical path (decision 3), preserving
  ADR-0001's no-single-point-of-failure property for the control plane as well as the data plane.
- Egress and privacy rules stay with the party that holds the data and can actually enforce them.
- Authority over a namespace and authority over the config that describes it are held by the same
  party — a peer cannot be misdescribed by a third party's stale entry.

**Negative / costs**
- No single place to read the whole fabric's configuration; a cross-participant view requires
  crawling N cards, which is the registry's job and its main justification.
- Onboarding cost moves to each adopter: four facets to publish rather than one row to add to a
  shared file. The adopter guide exists to make that cost small and explicit.
- Consistency is eventual. Two peers can hold divergent mappings for the same data until someone
  notices; the shared relation registry narrows this to *mapping* divergence, not *vocabulary*
  divergence, but does not eliminate it.
- A participant that goes dark takes its self-description with it. Registry-cached addresses and
  crawled card snapshots mitigate discovery, not authority.

**Neutral**
- The optional aggregator facade (ADR-0001 decision 4) may still present a unified view of many
  cards. Under decision 3 that is a convenience over addresses, and it MUST NOT become the
  authoritative source for any peer's self-description.
- Whether a given deployment keeps its facets in one repo per participant or several is a deployment
  fact, recorded in that deployment's own integration repo — not here.

## Alternatives considered

- **A central config store / shared "fabric config" repo holding every participant's namespace,
  ports, egress rules, and mappings.** Rejected: it is route-by-proxy for configuration. Every
  participant gains a hard dependency on a repo it does not own; a local change becomes a
  cross-repo PR; the store must be correct about payloads it never sees; and it becomes a
  business-logic magnet in exactly the way ADR-0001 rejected for traffic. It also inverts koine's
  scope rule by giving instance data a shared home, which is what makes the temptation to put it
  *in koine* recur.
- **Let the discovery registry be authoritative for manifests (not just an index).** Rejected: KCB
  §3 already states a provider's manifest is authoritative and the registry is a cache. Promoting
  the cache makes registry downtime a fabric outage and makes a crawl lag a correctness bug rather
  than a freshness one.
- **Publish everything on the wire — serve the egress policy and mappings as well-known endpoints
  alongside the card.** Rejected as a *requirement*: the translation facet is how a participant
  reads and writes its own store, and exposing it wholesale leaks internal structure with no
  consumer that needs it — peers need the *relations* a claim normalizes to, and those are already
  in the shared registry. A participant MAY serve any of it, and a `describe` response MAY summarize
  its egress classes; nothing here forbids that.
- **Peers read each other's repositories (submodule or vendored config).** Rejected: it is a build-
  time coupling standing in for a runtime contract, breaks for any participant whose repo is
  private, and re-creates N² integration — the thing koine exists to remove.
- **Say nothing; treat this as already implied by ADR-0001.** Rejected: ADR-0001 decided the traffic
  question, and readers were entitled to take its silence on configuration as permissive.
  Downstream participants that need to hold their own config need a record they can cite, not an
  inference.
- **A second well-known file for the in-repo self-description.** Rejected (decision 7): KCB §2.2
  just finished collapsing two well-known files into one served card; a third would reopen it.

---

## Relationship to the specs

- **KCB** §2's AgentCard extension is the served form of the capability facet, and §3's
  address-returning registry is the discovery mechanism this record leans on; the spec is unchanged
  by this ADR.
- **KINP** §3.4's open, PR-registered prefix registry is the *only* central act this convention
  requires, and it registers a name, not config; §6's offline-first minting is what makes a
  participant describable without a round-trip. Unchanged.
- **KGP** §7.1–§7.2 fix the egress and license vocabulary; decision 5 restates where enforcement
  sits (producer, at pack construction) rather than adding to it. Unchanged.
- **[`../registry/`](../registry/)** keeps holding shared vocabulary only. Its *"Deployment instance
  data lives elsewhere"* rule — canonical node/edge schemas and predicate mappings live in the
  deployment's own repo — is the translation facet's half of this record, and the two must stay
  consistent.
- **[`../schemas/`](../schemas/)** MAY gain the shape-only in-repo self-description schema described
  in decision 7, role-scoped, draft-2020-12, with illustrative CURIEs in the KINP §3.4 placeholder
  namespaces (`refkb` / `worldsim` / `analyzer` / `mediastore` / `orchestrator`). It must reference
  the KCB manifest shape, never restate it, and must carry no deployment values. It has since landed as
  [`../schemas/participant-self-description.schema.json`](../schemas/participant-self-description.schema.json)
  (golden positive: [`../schemas/fixtures/participant-self-description.json`](../schemas/fixtures/participant-self-description.json)),
  which enforces those three bounds structurally; having one remains OPTIONAL for a participant.
- **KMI**, **KCS**, and **KFT** are untouched. KFT §4.2's cloud/local placement gate is an
  application of the egress facet, and reads the same under this record.
- Which endpoints a particular deployment serves, what it mints, and what it marks `local-only` are
  deployment facts, recorded in that deployment's own integration repo — not here.

---

## Amendment log

### 2026-08-13 — the manifest extension URI moves to a w3id.org permanent identifier

**What changed.** The `uri` family that identifies the KCB manifest entry inside a participant's
AgentCard `capabilities.extensions[]` array moves off a privately-registered hostname and onto a
**w3id.org permanent identifier**:

| | Extension URI family |
|---|---|
| Retired | `https://koine.dev/kcb/manifest/…` |
| Current | `https://w3id.org/koine/kcb/manifest/…` |

Only the namespace root moves. The path and version-segment convention is untouched, so
`…/kcb/manifest/0.3` still names the same 0.3 manifest shape it always did.

**Provenance of the new namespace.** `/koine/` was requested by pull request against the W3C
Permanent Identifier Community Group's repository — the documented way an entry is created, since
w3id is a community-run, redirect-only service whose entries are plain directories added by PR:

- **PR:** [perma-id/w3id.org#6550](https://github.com/perma-id/w3id.org/pull/6550) — *Koine: add
  /koine/ permanent identifier namespace*.
- **Status:** **open**, awaiting maintainer merge (opened 2026-08-13). Until it merges the
  identifier does not yet resolve; it is nonetheless the namespace the specifications name, because
  what a matching key needs is a *reserved* name under a service pledged to keep resolving it, and
  a redirect that lands later is recoverable in a way a squatted hostname is not.
- **Contents:** a `koine/` directory holding `.htaccess` (the redirect rules) and `README.md`
  (namespace scope plus maintainer contact, both required by that repository's conventions). The
  rules cover the `kcb/manifest/<version>` path family explicitly, then one rule per specification
  (`kinp` / `kgp` / `kcb` / `kmi` / `kcs` / `kft`), then a catch-all to the repository root — all
  `302`.
- **Redirect target:** the specifications' **public** documentation host,
  <https://github.com/danieldekerlegand/koine>. Every target was checked to resolve `200` before
  the PR was opened.

Those two links are the whole provenance chain: a reader can confirm what was requested, of whom,
and where it points, without asking anyone.

**Why the move happened.** `koine.dev` — the hostname the extension URI had been minted under —
was **verified unregistered on 2026-08-11**: DNS held no record for it and a request could not
resolve the host at all. That is not a cosmetic defect. Under §2 of this record the extension URI
is how a consumer *identifies* the KCB manifest: it string-matches the `uri` of an entry in the
card's `capabilities.extensions[]`. The URI is therefore a **matching key**, not a fetch target —
implementations embed the literal string, and that string was pointing at a name anyone could
register. Whoever registered it would control the resolution target of the identifier the fabric
uses to name itself, and once conformant implementations have shipped the literal there is no
recovery path: you cannot recall a string that is already compiled into peers you do not operate.
Registering the hostname ourselves would only have converted the exposure into a renewal that must
never lapse for the life of the protocol. A w3id permanent identifier removes the class of failure
instead of re-timing it, which is precisely the case that service exists for.

**Why this introduces no private dependency.** w3id.org is a public, community-operated redirect
service, and the redirect target is koine's own public specification repository. No spec, schema,
registry, or policy file gains a link to any private or instance repository, and no participant is
required to read one in order to resolve the identifier (CLAUDE.md's scope rule; decision 4 of this
record — no participant reads another participant's repository — is likewise untouched).

**What did *not* change.** No decision in this record. Decisions 1–7 stand as accepted
**2026-08-02**: the capability facet is still served by the participant on its own AgentCard as one
named extension entry, there is still no second well-known file, the registry still returns an
address rather than a self-description, and the identity / egress / translation facets still live
in the participant's own repository. The manifest *payload* shape is untouched. Only the string
that names the entry moves.

**Spec effect.** Normative, on a candidate spec: the extension URI is a matching key, so changing
it is breaking for any consumer matching on the old literal. The KCB-side landing is made in
[`../specs/capability-bus.md`](../specs/capability-bus.md) itself, at **KCB 0.4.1** (2026-08-13):
every occurrence moved to the w3id form, plus **§2.3** — the normative dual-accept window, in which
a consumer MUST accept both roots as naming the same extension and a producer MUST emit the w3id
form — with an explicit end, the removal of the legacy root at **KCB 0.6.0** (a version, not a
date, per KCB §7.3b), and a dated changelog entry. Status stays **Candidate** on its existing pair
of re-ratification gates; this release neither adds one nor discharges one. Runtime implementations that
pin the old literal migrate downstream, per
[ADR-0001](ADR-0001-control-plane-topology.md); no runtime work is done here.
