# Demo parity harness

Pixel and behaviour parity of the framework ports of each demo app against the React reference
under `src/demos/<id>/`. Nothing is stored between runs: the reference and the port are loaded,
driven and photographed in the same run, so there are no golden images to update.

## Running

```sh
yarn nx test:e2e:parity ag-charts-demos
```

The Nx target builds the React app first and `playwright.parity.config.ts` serves `dist/` with
`vite preview`. With no ports configured the run is **self-parity**: the React app is served on
ports 4701 and 4702 and compared with itself, which must be pixel-identical. That guards the
determinism the ports rely on, and is what CI runs until the seeds exist.

| Variable                | Effect                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PARITY_TARGETS`        | JSON array of `{ "demo", "framework", "baseURL" }`. Each entry is one served port to compare. The run then serves only the reference; the caller serves the ports (for example `vite preview` of a seed). |
| `PARITY_REFERENCE_URL`  | Where the React reference is served. Defaults to `http://localhost:4701`, which the config starts; set it to use a reference served elsewhere.                                                            |
| `PARITY_KEEP_ARTEFACTS` | `1` writes the screenshots for passing comparisons too.                                                                                                                                                   |

Example, comparing the Angular financial seed served on port 4710:

```sh
PARITY_TARGETS='[{"demo":"financial","framework":"angular","baseURL":"http://localhost:4710"}]' \
  yarn nx test:e2e:parity ag-charts-demos
```

Every target is loaded as `<baseURL>/?deterministic=1#<demo>`. The hash selects the demo in the
multi-demo React app and is ignored by a standalone seed.

### Functional parity

The functional specs in `e2e/*.spec.ts` run against any served app through `DEMOS_BASE_URL`, which
also skips the dev server:

```sh
DEMOS_BASE_URL=http://localhost:4710 npx playwright test
```

## What is compared

For every target, each state in `states.ts` is photographed at 1440×900 and 1024×768 with the
locale, time zone, colour scheme and device scale factor pinned (`parity.spec.ts`). A state is
reached from a fresh load through the same controls a user has, so the port must reproduce the
control as well as the pixels. The states are the initial view, each tab, and one interaction per
demo lifted from the functional specs.

A comparison passes when the two screenshots are the same size and no more than
`MAX_DIFF_PIXEL_RATIO` (1%) of pixels differ, using the same per-pixel tolerance and anti-aliasing
handling as Playwright's own snapshot comparator (`compare.ts`).

`masks.ts` lists regions excluded from the comparison per demo. It is empty on purpose; an
addition needs a comment saying what differs and why that is acceptable, and is reviewed with the
PR that needs it.

## Deterministic mode

Both sides load with `?deterministic=1` (or are built with `VITE_DEMO_DETERMINISTIC=1`). The
financial demo is the only one with live data; `src/demos/financial/deterministic.ts` is the whole
contract a port mirrors:

- `randomSource(label)`: every consumer of randomness draws from its own seeded stream, so the
  result does not depend on construction or tick order. The labels are `bars:<ticker>` for each
  instrument's feed, `peers` for the peer performance feed and `movers:<tickers>` for the
  trending and most-active lists.
- `startTime()`: the session starts at a fixed instant (2026-07-23 15:30 UTC) instead of now.
- The stream starts paused; the seed history is what renders. Live still streams, reproducibly.

Web analytics and procurement are already deterministic: the sessions pool is generated from a
fixed seed and the procurement dataset is static JSON with its own `meta.now`. Both format with
`en-US` and read the local time zone, which the harness pins.

## Results

Everything the run leaves is under `results/` (gitignored):

- `summary.json`, described below.
- `<framework>/<demo>/<state>@<viewport>/` with `reference.png`, `port.png`, `diff.png` and
  `side-by-side.png` for every failed comparison (every comparison with
  `PARITY_KEEP_ARTEFACTS=1`). The same files are attached to the Playwright report.

In CI the folder is uploaded with the `test-results-demos-e2e` artefact.

### `summary.json`

```jsonc
{
    "schemaVersion": 1,
    "generatedAt": "2026-09-21T10:15:00.000Z",
    "status": "passed", // Playwright's run status: passed | failed | timedout | interrupted
    "reference": { "framework": "react", "baseURL": "http://localhost:4701" },
    "maxDiffPixelRatio": 0.01,
    "totals": { "comparisons": 26, "passed": 26, "failed": 0 },
    "comparisons": [
        {
            "demo": "financial",
            "framework": "react",
            "state": "initial",
            "viewport": "1440x900",
            "diffPixels": 0, // null when the comparison never ran
            "diffPixelRatio": 0, // diffPixels / pixels in the reference; 1 on a size mismatch
            "passed": true,
            "artefacts": {
                // relative to results/; present only when written
                "reference": "react/financial/initial@1440x900/reference.png",
                "port": "react/financial/initial@1440x900/port.png",
                "diff": "react/financial/initial@1440x900/diff.png",
                "sideBySide": "react/financial/initial@1440x900/side-by-side.png",
            },
            "error": "...", // only when not passed: the assertion or the reason the state was not reached
        },
    ],
}
```

One record per `framework/demo/state@viewport`; a retried test replaces its earlier record. The
types are in `summary.ts`, and `summary-reporter.ts` writes the file.
