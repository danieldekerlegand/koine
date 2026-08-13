# koine/policy — the license-class and trust-tier vocabularies

Two small JSON policy files that fix the closed enums behind the `license` and `tier` axes carried
on every interchange record. They are **data, not prose**: the schemas in
[`../schemas/`](../schemas/) and the specs in [`../specs/`](../specs/) reference these classes by
name, and consumers load them to decide what a record is allowed to do. Each file carries its own
`policyVersion`.

## Layout

- [`license-classes.json`](license-classes.json) — the per-record **license class** allowlist
  backing the `license` field (KGP §7.1). Maps five classes — `public-domain` / `attribution` /
  `share-alike` / `proprietary` / `personal` — to their SPDX ids (or pseudo-ids `PROPRIETARY` /
  `PERSONAL`) and each class's **obligations** (attribution manifests, share-alike partitioning,
  owner-scoping). `Apache-2.0` — koine's own [`../LICENSE`](../LICENSE) — classes under
  **attribution**. The identifiers are **SPDX** ids, and the SPDX license list release they are
  resolved against is pinned in [`../docs/upstream-standards.md`](../docs/upstream-standards.md) —
  re-resolving them against that release is part of the drift check, and is what surfaced finding
  **F-1** (`PDM-1.0`, an id no SPDX release has ever defined, corrected to **`CC-PDM-1.0`** at
  `policyVersion` 0.1.1).
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

## Scope

koine holds only the **policy enums**. The validators that enforce them and the conformance CI that
exercises them are runtime and live downstream
([`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)),
not here.
