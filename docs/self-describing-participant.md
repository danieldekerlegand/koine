# Guide: publishing a self-describing participant

Koine has no central config store. Everything another system needs in order to talk to you — your
namespace, your capabilities, what knowledge you will and won't release, and how your vocabulary
crosses into the shared one — is published **by you, from your own repository and your own
endpoints**. Nobody registers it on your behalf, and no peer needs read access to your repo.

That convention is [ADR-0007](../decisions/ADR-0007-self-describing-participant.md); this guide is
the practical version of it. It is a checklist, not a spec — each item points at the spec that fixes
the shape.

> The identifiers below use KINP's placeholder namespaces (`refkb`, `worldsim`, `analyzer`,
> `mediastore`, `orchestrator`, `provider`) — made-up participants used throughout the Koine specs.
> Substitute your own.

## The four facets

A participant publishes four things. You publish only the ones the roles you claim reach — but note
the last two apply to a pure **consumer** too, because a consumer MUST reject a pack carrying
`local-only` content (KGP §7.2) and can only do that against a stated policy.

| # | Facet | What you publish | Where it lives | Spec |
|---|---|---|---|---|
| 1 | **Identity** | your namespace prefix and the fact that you are its sole minting authority; the kinds you mint under it; your anchoring to external authorities | prefix **registered by PR** in KINP §3.4; everything minted under it stays in your repo | [KINP](../specs/identity.md) §3.2–§3.4, §4.4, §6 |
| 2 | **Capability** | your KCB manifest — `kcb_version`, `produces` / `consumes` ports, `capabilities` (with `cost`), `auth`, `signing`, and any non-A2A endpoint such as `mcp` | **served** by you, in your AgentCard | [KCB](../specs/capability-bus.md) §2, §2.1 |
| 3 | **Egress** | which relations and records are `exportable` and which are `local-only`, plus the license classes you release under | your own repo | [KGP](../specs/grounding-pack.md) §7.1, §7.2 |
| 4 | **Translation** | the bridge / predicate mappings for the data you produce *and* consume — how your local predicates cross into the shared registry relations | your own repo — **never** committed here | [KGP](../specs/grounding-pack.md) §5, §7; [`registry/README.md`](../registry/README.md) |

The rule behind the "where" column is **publish at the edge, index at the center**.

## The checklist

### 1. Identity — register a prefix, mint everything else yourself

- [ ] Pick a namespace prefix and open a PR adding a row to KINP §3.4's registry. This is the only
      central act the convention requires, and it reserves a **name**, not config: a prefix belongs
      to exactly one minting authority and is immutable once published.
- [ ] Record in your own repo what you mint under it — the kinds, your local-id scheme
      (`<ns>:local` for provisional pre-reconciliation ids, KINP §6), and any anchoring to external
      authorities such as `wikidata` (KINP §4.4).
- [ ] Minting is offline-first (KINP §6): you must be able to mint without asking anyone.

### 2. Capability — one served card, one extension entry

- [ ] Serve an A2A AgentCard at your own `/.well-known/agent-card.json`.
- [ ] Add **one** entry to its `capabilities.extensions[]` whose `uri` is
      `https://koine.dev/kcb/manifest/0.3`, carrying the KCB manifest in its `params` (KCB §2).
      There is **no second well-known file** — the card is the whole served surface.
- [ ] Type every port by the plane it speaks (`knowledge` / `media` / `entity`…), so a registry can
      chain you into a path across planes (KCB §2.1).
- [ ] Assume the discovery registry is optional. It crawls your card and hands peers an **address**;
      peers then fetch the card from you. You must stay fully functional, and fully describable to a
      peer that dials you directly, with the registry down.

The [Capability-Bus walkthrough](walkthrough-capability-bus.md) shows a complete card and the
advertise → discover → dial loop it enables.

### 3. Egress — state it, and enforce it yourself

- [ ] Declare, per relation and per record, an egress class: `exportable` (the default) or
      `local-only` — never leaves its originating tier, under any encoding, including training sets
      (KGP §7.2).
- [ ] Declare the license classes you release under, and the allowlist you admit on (KGP §7.1).
- [ ] Enforce egress **at pack construction**, in your own producer, before any encoding is emitted.
      Egress is not advisory metadata for a consumer to honor, and no central component ever holds
      your rules. A projection (RDF-star, ProbLog, Neo4j) of a boundary-crossing pack therefore
      cannot contain `local-only` content.
- [ ] Remember the axes are independent: egress (may it leave at all) is not dialect (KGP §5, what
      logic a consumer may evaluate) and not trust (how much to believe a source).

### 4. Translation — map into the shared vocabulary, don't extend it privately

- [ ] Keep your bridge / predicate mappings in your own repo, with per-entry dialect, egress, and
      id-space rules.
- [ ] A mapping **coins no relation name**. If an entry has nothing to normalize to, close the gap
      by adding a row to [`registry/relations.tsv`](../registry/relations.tsv) or a domain file — a
      relation named only in a mapping is a second source of truth.
- [ ] Treat published entries as immutable: retarget by adding an entry that supersedes the old one,
      never by rewriting it (a relation signature is immutable, so an edit changes every dependent
      claim id).

## What stays out of Koine

Koine holds the **shape** of these four artifacts and stops there (README *"Scope: shape, not
instance"*). Your actual namespace value, your port list, your `local-only` relation set, and your
mapping entries are your deployment's instance data — they belong in your repo, on your release
cadence.

In particular, **bridge / predicate mappings must not be committed into Koine**, and neither may a
topology or a canonical node/edge ontology; [`registry/README.md`](../registry/README.md) states the
same rule from the registry's side. The test is: *if it would read the same for any other ecosystem
it belongs here; if it names a particular participant in a key or a value, it is instance data.*

Two corollaries worth stating plainly:

- **No participant reads another participant's repository.** Integration goes through served
  surfaces — the AgentCard extension, the KCB verbs, the data planes — never a submodule, a vendored
  config file, or a shared checkout. That keeps a config change a one-repo change.
- **The registry is an index, never an authority.** It returns an address to a self-description, not
  the self-description. A stale entry is a stale pointer, fixed by re-fetching from you.

## Optional: a source self-description in your repo

Your served card is derived from facts you already keep somewhere. ADR-0007 decision 7 allows a
single in-repo document that states where your four facets are, so what you serve can be checked
against a declared intent instead of hand-maintained. It is a **source** document, not a second
manifest: pointers and references only, referencing the KCB manifest shape rather than restating it,
and embedding no mapping, topology, or node/edge ontology. Nothing requires you to have one.

Its shape is [`schemas/participant-self-description.schema.json`](../schemas/participant-self-description.schema.json),
with a worked example at
[`schemas/fixtures/participant-self-description.json`](../schemas/fixtures/participant-self-description.json).
The schema holds those bounds for you: each facet block admits pointers only, so a manifest payload, a
mapping's rows, or a node/edge ontology will not validate — which is the point. Fill it in **in your own
repo**; the filled-in document never comes here.

## Further reading

- [ADR-0007](../decisions/ADR-0007-self-describing-participant.md) — the convention, its
  alternatives, and its costs.
- [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) — the traffic-side decision this
  extends: route-by-lookup, not route-by-proxy.
- [Capability-Bus walkthrough](walkthrough-capability-bus.md) — the served card in action.
