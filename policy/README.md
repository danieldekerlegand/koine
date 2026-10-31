# koine/policy — the license-class and trust-tier vocabularies

Two small JSON policy files that fix the closed enums behind the `license` and `tier` axes carried
on every interchange record. They are **data, not prose**: the schemas in
[`../schemas/`](../schemas/) and the specs in [`../specs/`](../specs/) reference these classes by
name, and consumers load them to decide what a record is allowed to do. Each file carries its own
`policyVersion`.

## Layout

- [`license-classes.json`](license-classes.json) — the per-record **license class** allowlist
  backing the `license` field (KGP §7.1), and the **single definition** of the class set, the
  identifier → class mapping and the default allowlist — KGP §7.1 restates them and the file wins on
  disagreement. Maps six classes — `public-domain` / `attribution` / `share-alike` /
  `non-commercial` / `proprietary` / `personal` — to their SPDX ids (or pseudo-ids `US-GOV-PD` /
  `PROPRIETARY` / `PERSONAL`) and each class's **obligations** (attribution manifests, share-alike partitioning,
  no commercial use, owner-scoping). An identifier may be listed under **more than one** class — the
  share-alike non-commercial ids sit under both `share-alike` and `non-commercial` — and then holds
  every class it is listed under (`rules[3]`, KGP §7.1). `non-commercial` was added at
  `policyVersion` **0.2.0**, closing finding **INT-8**
  ([`../docs/reference/interop-trial.md`](../docs/reference/interop-trial.md)); there is no separate
  `permissive` class. `Apache-2.0` — koine's own [`../LICENSE`](../LICENSE) — classes under
  **attribution**. The identifiers are **SPDX** ids, and the SPDX license list release they are
  resolved against is pinned in [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) —
  re-resolving them against that release is part of the drift check, and is what surfaced finding
  **F-1** (`PDM-1.0`, an id no SPDX release has ever defined, corrected to **`CC-PDM-1.0`** at
  `policyVersion` 0.1.1). The same `policyVersion` **0.2.0** also adds the pseudo-id `US-GOV-PD` (below).
- [`trust-tiers.json`](trust-tiers.json) — the provenance **trust tier** enum backing the `tier`
  field (KGP §7): `curated` / `acquired` / `synthetic` / `personal`, each with whether it
  `mayEnterOpenReleases` and its **containment** rules (synthetic and personal never mix into
  real-world tiers or open releases; personal never leaves the local machine by default).

### `US-GOV-PD` — United States government public domain

Works of the United States federal government — those its officers or employees prepare as part
of their official duties (17 U.S.C. §101) — carry no copyright in the United States
(17 U.S.C. §105), and agencies say so in their own words — for example, the USGS states that
*"USGS-authored or produced data and information are considered to be in the U.S. Public Domain"*.
Before 0.2.0 a producer holding such data had two choices, both bad: label it `CC-PDM-1.0`, a mark
whose label does not carry the jurisdiction the status depends on, or leave it unlabelled, which the
first rule makes **invalid** at every boundary. SPDX release 3.28.0 (the pinned release) defines a
few agency-specific notices — `NIST-PD`, `NCBI-PD`, `NTIA-PD` — but no identifier for the status
itself, so the class takes a pseudo-id, as `proprietary` and `personal` already do.

`US-GOV-PD` sits in **`public-domain`**. Its obligations are the honest ones: public domain **in the
United States**; status elsewhere is **the consumer's to assess**; credit the issuing agency as it
asks. A record labelled `US-GOV-PD` **MUST** carry `provenance.source_url`
([`../schemas/provenance.schema.json`](../schemas/provenance.schema.json)) naming the agency's own
public-domain statement, so the claim is checkable from the record; a consumer treats a
`US-GOV-PD` record without one as unlabelled. Admission stays per **class**, so the default
allowlist admits it; the obligation to assess its status outside the United States travels with the
record to whichever consumer admits it.

## How they are used

Both files are **admission policy applied at every boundary**:

- **License** answers *"may this record be admitted?"* — a record with an unknown or blank license,
  or one listed under no class, is **invalid** (producers must resolve it, never default silently);
  packs partition their record counts by class, and a consumer rejects any record holding a class
  outside its configured allowlist (default: `public-domain` + `attribution`) with a per-record
  report. A record holding two classes is admitted only if both are allowlisted.
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
