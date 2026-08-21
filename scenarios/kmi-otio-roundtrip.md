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
