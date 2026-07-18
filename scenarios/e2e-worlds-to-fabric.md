# Scenario: Worlds → Fabric (end-to-end pressure test)

**Purpose:** stress-test [`../specs/identity.md`](../specs/identity.md) (KINP 0.1.0) against
concrete data flowing through **three** projects, deliberately hunting for places it breaks.
Each step names what *held* and what *broke*; §Findings collects the required spec deltas.

**The story:** An Insimul designer builds a fiction (`alderforest`) containing an NPC
*Général Renaud*, modeled on the real Napoleon. A player records a playthrough; the footage
is uploaded to Argos, which extracts knowledge from it. Pinakes reconciles the extracted
entities against consensus reality. The user then runs cross-project queries.

---

## Step 1 — Insimul authors the world

```prolog
% World + entity (world-scoped namespace, §3.4/§5)
world(id(world, insimul, alderforest), inherits(id(world, pinakes, 'consensus-reality'))).
entity(id(ent, 'insimul:world:alderforest', 'npc-renaud'), type(person)).

% Lineage to the real figure — based_on, NOT same_as (§4.3 firewall)
based_on(id(ent, 'insimul:world:alderforest', 'npc-renaud'),
         id(ent, pinakes, 'napoleon-i'), confidence(0.8)).

% An in-fiction claim, world-scoped
commands(id(ent,'insimul:world:alderforest','npc-renaud'),
         id(ent,'insimul:world:alderforest','army-of-ash')) @ world(alderforest).
```

✅ **Held.** Provisional/authored entity minted offline (§6); firewall link present; claim
scoped to its world.

---

## Step 2 — Player records; footage uploaded to Argos

The asset is bytes; it attaches to entities. **Critical:** the asset must carry the
*source world*, or Argos has no way to know the footage is fiction.

```jsonc
{ "id": "argos:asset:blake3-a1b2…", "media_type": "video/mp4",
  "attaches_to": ["insimul:world:alderforest"],          // source world travels WITH the asset
  "prov": { "activity": "argos:run/1a2b", "asserted": "2026-07-17T…" } }
```

🔴 **BROKE (found gap #1).** KINP §7.2 defines `attaches_to` as *entities*, and asset
envelopes have no dedicated **source-world** field. Without it, Step 4's reconciler defaults
extracted claims to `consensus-reality` and the firewall never engages — fiction leaks into
the real graph. **Delta A required.**

---

## Step 3 — Argos extracts knowledge from the footage

Vision/ASR yields a new *local* entity and a claim. Argos does **not** yet know this equals
Renaud or Napoleon.

```prolog
entity(id(ent, 'argos:local', 'e-8842'), type(person)).
% Extracted claim — lands in the SOURCE world (once Delta A lands), high-uncertainty
commands(id(ent,'argos:local','e-8842'),
         id(ent,'argos:local','e-8842-army')) @ world(alderforest) :- confidence(0.55).
```

✅ **Held** (given Delta A): entity content-addressing avoided — a stable provisional local
is minted (§2/§6), so learning more attributes later won't orphan these claims.

🔴 **BROKE (found gap #2).** The extracted claim `commands(e-8842, e-8842-army)` and
Insimul's `commands(npc-renaud, army-of-ash)` are *the same fact about the same referents*,
but they mint **different** `claim` hashes because (a) the entity IDs differ pre-reconciliation
and (b) normalization is unspecified. Content-addressed dedup (§2) silently fails across
producers. This is the dependency KINP §6 flags on `grounding-pack.md`, but the scenario
shows it is **load-bearing, not optional**. **Delta B required.**

---

## Step 4 — Pinakes reconciles

The resolver matches `argos:local:e-8842` against consensus reality via `reconcile` (§4.5).
Two candidates score high: the real Napoleon, and (via Step 1's `based_on`) the fictional
Renaud.

```prolog
% Cross-world, differing ontological status → based_on, NOT same_as (§4.3)
based_on(id(ent,'argos:local','e-8842'),
         id(ent, pinakes, 'napoleon-i'), confidence(0.83), src('argos:run/1a2b')).
% Same world, same ontological status → same_as
same_as(id(ent,'argos:local','e-8842'),
        id(ent,'insimul:world:alderforest','npc-renaud'), confidence(0.9)).
```

🔴 **BROKE (found gap #3).** KINP §4.5 says reconciliation *proposes* links but never states
**how the resolver chooses `same_as` vs `based_on`.** The correct rule emerges only here:
*when a candidate lives in a different world AND that world does not inherit-as-identity, emit
`based_on`; when same world (or identity-inheriting), emit `same_as`.* That rule must be
written into the spec. **Delta C required.**

✅ **Held:** because Renaud→Napoleon is `based_on` (Step 1) and e-8842→Napoleon is `based_on`
(here), no `same_as` path connects the fictional footage entity to the real Napoleon. Firewall
intact through two hops.

---

## Step 5 — Cross-project queries

**Q1: "Which real historical figures inspired characters in my footage?"**
Traverse `attaches_to` → entities in `alderforest` → `based_on` → `same_as`(wikidata).
Returns **Napoleon (Q517)**. ✅ Held.

**Q2: "List facts true of the real Napoleon."**
Query `world = consensus-reality`, traverse `same_as` only.
Returns his real biography; **excludes** `commands(_, army-of-ash)` and any Renaud/e-8842
claim (they're in `alderforest` and linked by `based_on`, not `same_as`). ✅ **Held — the
core anti-contamination property.**

**Q3 (in-playthrough): "Is Paris intact?"** where the fiction overrides a real fact.

```prolog
destroyed(id(ent, pinakes, 'paris')) @ world('insimul:world:alderforest#save-7f').
```

Query at `save-7f` sees the override; the same query at `consensus-reality` does not. ✅ Held
— world inheritance + override precedence (§5) behaves.

---

## Step 6 — A wrong belief, later corrected

The `commands(e-8842,…)` extraction (confidence 0.55) turns out wrong. Claims are immutable
and content-addressed (§2) — you cannot delete one. You assert a retraction with a later
**transaction time** (§7.1 bitemporal split):

```prolog
retracts(id(claim,argos,'sha256-…'), reason(misdetection)) @ world(alderforest)
    :- prov(asserted('2026-07-20T…')).
```

✅ **Held:** bitemporality lets "what we believe now" diverge from "what we asserted then"
without mutating immutable claims. But 🔴 **minor gap #4:** KINP lists relation kinds for the
*equivalence* layer (§4.2) but never reserves `retracts` / `supersedes`. **Delta D (minor).**

---

## Step 7 — The dedup limit (honest boundary)

Formant renders `kick.wav`; Argos re-encodes it during editing. Byte hashes differ →
**two** `asset` IDs though the audio is "the same." Content addressing is byte-exact; it does
not capture perceptual identity.

⚠️ **Not a break — a documented boundary.** Resolution: link them with a `derived_from`
*asset-level* relation (media-interchange concern), and let entity-level `attaches_to` carry
the shared meaning. KINP should explicitly scope perceptual/near-dup matching **out**. **Delta E (doc-only).**

---

## Findings — required spec deltas

| # | Severity | Gap | Delta |
|---|---|---|---|
| A | **High** | Asset envelope can't carry the source world → firewall never engages on ingested media. | Add `source_world` to the asset envelope (§7.2); ingestion MUST populate it. |
| B | **High** | Cross-producer claim dedup fails without shared normalization. | Elevate claim-normalization from a `grounding-pack.md` footnote to a **normative, load-bearing** KINP requirement (§6); specify canonical arg order, ID normalization (CURIE↔IRI), literals. |
| C | **High** | Resolver has no stated rule for choosing `same_as` vs `based_on`. | Add the world/ontological-status rule to §4.5: different non-identity-inheriting world ⇒ `based_on`; else `same_as`. |
| D | Minor | No reserved relations for retraction/supersession. | Reserve `retracts`, `supersedes` alongside the equivalence relations (§4.2). |
| E | Doc | Byte-exact asset hashing ≠ perceptual identity; unstated. | Scope perceptual/near-dup matching out of KINP; introduce asset-level `derived_from` in media-interchange. |

## Verdict

The **core thesis survives the stress test**: the `same_as`/`based_on` firewall (§4.3) plus
world scoping (§5) delivers the decisive property — real-world knowledge stays uncontaminated
by fiction *and* the two remain queryable together (Q1/Q2). The breaks are all at the
**seams** (media↔knowledge boundary, cross-producer dedup, resolver decision rule), not in the
model's spine. Deltas A–C should land before KINP is ratified past `candidate`; D–E are
cleanups. None require redesign.
