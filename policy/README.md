# koine/policy — the license-class and trust-tier vocabularies

Two small JSON policy files that fix the closed enums behind the `license` and `tier` axes carried
on every interchange record. They are **data, not prose**: the schemas in
[`../schemas/`](../schemas/) and the specs in [`../specs/`](../specs/) reference these classes by
name, and consumers load them to decide what a record is allowed to do. Each file carries its own
`policyVersion`.

## Layout

- [`license-classes.json`](license-classes.json) — the per-record **license class** allowlist
  backing the `license` field (KGP §7.1). Maps five classes — `public-domain` / `attribution` /
  `share-alike` / `proprietary` / `personal` — to their SPDX ids (or pseudo-ids: the ecosystem's
  `PROPRIETARY` / `PERSONAL`, plus the producer-registered ids under
  [*Registered pseudo-ids*](#registered-pseudo-ids)) and each class's **obligations** (attribution
  manifests, share-alike partitioning, owner-scoping). `Apache-2.0` — koine's own [`../LICENSE`](../LICENSE) — classes under
  **attribution**. The identifiers are **SPDX** ids, and the SPDX license list release they are
  resolved against is pinned in [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) —
  re-resolving them against that release is part of the drift check, and is what surfaced finding
  **F-1** (`PDM-1.0`, an id no SPDX release has ever defined, corrected to **`CC-PDM-1.0`** at
  `policyVersion` 0.1.1). Pseudo-ids are not SPDX license-list identifiers, so that re-resolution
  does not reach them. Current `policyVersion`: **0.1.2**.
- [`trust-tiers.json`](trust-tiers.json) — the provenance **trust tier** enum backing the `tier`
  field (KGP §7): `curated` / `acquired` / `synthetic` / `personal`, each with whether it
  `mayEnterOpenReleases` and its **containment** rules (synthetic and personal never mix into
  real-world tiers or open releases; personal never leaves the local machine by default).

## How they are used

Both files are **admission policy applied at every boundary**:

- **License** answers *"may this record be admitted?"* — a record with an unknown or blank license
  is **invalid** (producers must resolve it, never default silently); packs partition their record
  counts by class, and a consumer rejects any class outside its configured allowlist (default:
  `public-domain` + `attribution`) with a per-record report.
- **Trust tier** answers *"how much should this source be believed, and where may it travel?"* — it
  is descriptive of provenance, and its containment gates are monotone CI ratchets in every
  consumer. A low-trust pack feeds KINP's hybrid merge **review queue** (KINP §11 decision 2)
  rather than auto-applying.

These are **two independent axes**, and both are separate again from KGP's `dialect` (§5, what
logic may be evaluated) and `egress` (§7.2, whether a record may cross a project boundary) — see
the axis table in [`../schemas/README.md`](../schemas/README.md). None implies another; a consumer
that conflates them is non-conformant.

## Registered pseudo-ids

A producer whose records carry a licence label of its own registers it here instead of having every
boundary reject it as unknown. The id takes the form `LicenseRef-<producer>-<idstring>` and is listed
under one class's `pseudoIds` in [`license-classes.json`](license-classes.json); an id that is not
listed is unknown and INVALID under that file's first rule. The listed class's obligations apply to it
unchanged — registration names a label; it creates no new class and no new obligation.

A `proprietary` id, `PROPRIETARY` included, is a **use label, not a copyright claim**: it says where a
record may go ("owner-scoped use only … never in open releases") and asserts no copyright, ownership
or authorship in the record's content. Whether anyone holds copyright in that content is outside
koine's admission policy, and the class neither makes nor implies such a claim.

| id | class | registering producer | since |
|---|---|---|---|
| `LicenseRef-Insimul-Proprietary` | `proprietary` | Insimul, a worlds producer | `policyVersion` 0.1.2 |
| `LicenseRef-Insimul-Synthetic` | `proprietary` | Insimul, a worlds producer | `policyVersion` 0.1.2 |

The table is informative and mirrors the JSON; on disagreement the JSON wins. A registered id is
**not** a trust tier: a `LicenseRef-<producer>-Synthetic` label says nothing about the record's `tier`,
which is set separately (KGP §7, [`trust-tiers.json`](trust-tiers.json)).

## Scope

koine holds only the **policy enums**. The validators that enforce them and the conformance CI that
exercises them are runtime and live downstream
([`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)),
not here.
