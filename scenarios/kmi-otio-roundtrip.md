# Scenario: OTIO round-trip identity loss (KMI pressure test)

**Purpose:** pressure-test KMI §4.2a's additive asset-id carrier against a
third-party OTIO round-trip. The test is deliberately adversarial: the
third-party editor is conformant to OTIO but does not preserve koine's
namespaced metadata. The question is whether a re-import can still identify
the clips, rather than whether the edited timeline remains valid OTIO.

This scenario is a focused follow-up to
[`e2e-media-transform.md`](e2e-media-transform.md), which established that a
clip's `metadata.koine.asset` is authoritative and `target_url` is only a
location. It exercises KMI §9.5; its finding is folded into KMI 0.3.3.

## Setup

The **media producer** `mediastore` publishes two content-addressed assets and
a canonical OTIO timeline. The **knowledge producer** `analyzer` owns the
timeline and needs to re-import an editor's cut. The **world producer**
`worldsim` is the source of the fictional gameplay footage, and the **identity
authority** `refkb` resolves KINP asset ids. These are the KINP §3.4
placeholder namespaces, not deployment names or endpoints.

The timeline contains two clips:

```json
{
  "name": "alderforest-wide",
  "media_reference": {
    "OTIO_SCHEMA": "ExternalReference.1",
    "target_url": "file:///offline/wide.mov",
    "metadata": {"koine": {"asset": "mediastore:asset:blake3-wide"}}
  }
}
```

The second clip has the same shape with
`mediastore:asset:blake3-close` and `file:///offline/close.mov`. The two
`target_url` values are intentionally stale local paths; only the KINP ids are
portable identity. `analyzer` also keeps a media map for the two ids, as
allowed by KMI §4.2d/§4.3.

## Step 1 — Export to a third-party OTIO editor

`analyzer` exports the canonical timeline as OTIO JSON. The editor accepts the
document, renders the clips, and writes an ordinary OTIO `Timeline` after
changing the cut order and shortening the close-up. The editor preserves
OTIO's structural fields (`Timeline`, `Track`, `Clip`, and `source_range`) but
drops unknown `metadata.koine` dictionaries while serializing.

✅ **Held:** the result remains valid OTIO, and the media map still identifies
the two source assets on `analyzer`'s side.

## Step 2 — Re-import the edited timeline

`analyzer` receives the edited OTIO document. Both clips now have no
`metadata.koine.asset`. Their `target_url` values are either the stale paths
from the export or editor-local paths such as
`file:///Users/editor/cuts/wide.mov` and
`file:///Users/editor/cuts/close.mov`.

🔴 **BROKE (M-1, high):** KMI's authoritative identity carrier has been
dropped, while OTIO's location carrier is stale or machine-local. The media
map cannot safely re-attach an id by path: the same path may be absent, may
point to a re-encoded byte stream with a different KINP id, or may be reused
for a different cut. Hashing an available replacement would mint a new asset,
not prove which original asset the clip means. `analyzer` therefore cannot
resolve either clip by KINP id without guessing, and a guessed attachment can
silently create wrong lineage or wrong-world analysis.

## Step 3 — Adversarial relink attempt

`analyzer` tries the available recovery choices:

| Recovery attempt | Result |
|---|---|
| Resolve `target_url` directly | Fails on a machine-local or stale path. |
| Match the path through `media_map` | No stable id exists for the editor's path. |
| Match by filename or clip name | Ambiguous and not content identity. |
| Hash replacement bytes and attach the old id | Invalid: KINP ids are content-addressed. |
| Treat the OTIO ordering/range as an identity hint | Invalid: it identifies an edit operation, not source bytes. |

🔴 **BREAK CONFIRMED:** a conformant OTIO round-trip can produce a structurally
valid timeline that is not safely re-importable as a KMI timeline. The missing
contract point is concrete: KMI must decide whether and how a producer MUST
re-attach asset ids after `metadata.koine` is lost, and how it detects that
loss instead of silently accepting a guess.

## Findings

| # | Severity | Finding | Forced question |
|---|---|---|---|
| M-1 | High | A third-party OTIO round-trip drops `metadata.koine.asset`; `target_url` and the media map cannot recover identity without an unsafe guess. | §9.5 additive-metadata survival — id re-attach and loss detection. |

**Only §9.5 is forced by this pressure test.** The test says nothing about the
allowed OTIO core schema-version range (§9.1), profile-vocabulary granularity
(§9.2), CAS operational model (§9.3), or the perceptual-match backend (§9.4);
those questions remain open and are not carried into the next contract fold.

## Resolution — KMI 0.3.3

KMI 0.3.3 answers the forced question in §4.2a: `analyzer` MUST detect the
missing `metadata.koine.asset` and may re-attach an id only after the recovered
bytes hash to the known KINP asset id. The stale or local `target_url`, path,
filename, clip name, edit range, ordering, and perceptual similarity are not
identity evidence. If exact verification fails, `analyzer` rejects or
quarantines the clip and reports it unresolved; it does not guess. A verified
re-attachment restores `metadata.koine.asset` before the timeline is accepted
as canonical KMI. M-1 is therefore resolved without folding §9.1–§9.4.

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**Run of 2026-08-24** · encoding `kcs:kmi-otio-roundtrip` · KCS 0.3.0 · evidence
`sha256-2d9e6c43…c17bb3` **(superseded 2026-08-26 by `sha256-eb8fdc9c…36dd5`, twelve scenarios — this scenario's own per-scenario entry is byte-identical in it, checked 2026-09-03)**, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).

| | |
|---|---|
| Participants, by role | world **producer** (live) · knowledge **producer** (live) · identity **authority** (live) · media **provider** (`mediastore` composer, **stand-in**) |
| Over what links | **3 of 4 live** (75%) |
| Encoded as | 11 steps + 16 assertions, of which 3 are `expect: reject` — **all of them inherited** (see below) |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**Read this result narrowly.** The encoding registered under this scenario's name is not an
encoding *of this scenario*. It is the `kcs:media-transform` document spread into a new object with
a different `id` and `title`, backed by the **same** `media-transform` composer fixture; its own
module note says so — *"the KMI round-trip is a media-plane replay, not a console-local
interpretation of OTIO bytes … the scenario remains observer-only."* So the sixteen assertions that
came back green are the media-transform assertions, run twice.

**What that means for what this document hunts.** Nothing here exercised the property this pressure
test exists to find. **M-1** — a third-party OTIO round-trip drops the KINP asset-id carrier and
leaves only stale or local paths, so an adversarial relink has nothing safe to key on — has no
assertion in the suite. There is no export leg, no re-import leg, no probe of the metadata carrier's
survival, and no counterpart to the Step 3 relink attempt. The finding is **folded** (KMI 0.3.3, per
the Resolution above), and the fold is what a machine-replayable document would now be checking; no
document checks it.

**So the artefact gate is met here by count, not by content.** `scenarios/*.md` has an entry with a
matching `source`, the coverage gate is satisfied, and the run is green — and none of that is
evidence about §4.2a / §9.5. Recorded as **DR-4** rather than left to be inferred from a green line.

### Findings — from the downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-4 | **High** | `kcs:kmi-otio-roundtrip` is `kcs:media-transform` under a different id and title, sharing its fixtures. It contains no OTIO export, no re-import, and no assertion over the asset-id carrier, so **M-1 and the KMI 0.3.3 fold that closed it are unexercised**. | KMI's coverage of this pressure test is nominal. A green `kcs:kmi-otio-roundtrip` may **not** be cited as downstream evidence for §4.2a or §9.5 — it is evidence for the media-plane exchange, which `kcs:media-transform` already carries. Closing it is downstream work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md): a real encoding of these three steps. Unowned today. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).
