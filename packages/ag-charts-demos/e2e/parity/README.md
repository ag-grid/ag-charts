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
ports 4701 and 4702 and compared with itself, and not one pixel may differ. That guards the
determinism the ports rely on, and CI runs it before the ports.

The config starts every server it needs and never reuses one already listening: a server on one
of these ports may belong to another checkout, and comparing against its build would pass or fail
for reasons unrelated to this tree. A busy port fails the run; move the ports with the variables
below.

| Variable                | Effect                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PARITY_DISCOVER`       | `1` finds every committed port by its `seeds/<demo>/<framework>/.seed-manifest.json` (all but the generated React seed), skips the stale ones (see "Stale ports are skipped") and serves each remaining one's built `dist` (the manifest's `dist` path) with `serve-dist.mjs` on ports 4710 upwards, in `<demo>/<framework>` order. CI runs this after self-parity. |
| `PARITY_STALE_REPORT`   | A file holding the output of `tools/seeds/check-seeds.mjs --stale`, relative to the working directory, which a `PARITY_DISCOVER` run reads instead of running the script itself. CI writes it on the runner before starting the run in its container.                                                                                                               |
| `PARITY_INCLUDE_STALE`  | `1` makes a `PARITY_DISCOVER` run compare the stale ports too, to check a port mid-alignment before its manifest is restamped. Never set in CI.                                                                                                                                                                                                                     |
| `PARITY_TARGETS`        | JSON array of `{ "demo", "framework", "baseURL" }`. Each entry is one served port to compare. The run then serves only the reference; the caller serves the ports. Takes precedence over `PARITY_DISCOVER`.                                                                                                                                                         |
| `PARITY_REFERENCE_URL`  | Where the React reference is served. Defaults to `http://localhost:<PARITY_REFERENCE_PORT>`, which the config starts; set it to use one served elsewhere.                                                                                                                                                                                                           |
| `PARITY_KEEP_ARTEFACTS` | `1` writes the screenshots for passing comparisons too.                                                                                                                                                                                                                                                                                                             |
| `PARITY_REFERENCE_PORT` | Port the config serves the reference on. Defaults to 4701.                                                                                                                                                                                                                                                                                                          |
| `PARITY_SELF_PORT`      | Port the config serves the second copy on in a self-parity run. Defaults to 4702.                                                                                                                                                                                                                                                                                   |
| `PARITY_PORT_BASE`      | First port a `PARITY_DISCOVER` run serves the ports on. Defaults to 4710.                                                                                                                                                                                                                                                                                           |

### Discovered ports

```sh
yarn nx run ag-charts-demos-seeds:build   # every seed's dist
PARITY_DISCOVER=1 yarn nx test:e2e:parity ag-charts-demos
```

`targets.ts` (`discoverParityPorts`) reads the manifests and fails early, naming the seeds, when a
port it is to compare has no built `dist`. A new port needs nothing here: commit
`seeds/<demo>/<framework>/` with its `.seed-manifest.json` (whose `dist` names the seed-relative
build output) and it is picked up.
`serve-dist.mjs` is a static server on Node's `http` and `fs` alone, so it runs inside the CI
Playwright image without an install. Files are served by extension. A missing path without an
extension is a route of the single-page app and gets `index.html`; a missing path with one is a 404. A path that is not valid percent-encoding is a 400, and a path escaping the directory a 403.

### Stale ports are skipped

A port is stale when its manifest's `sourceHash` is not the current hash of its React demo: the
demo changed after the port was last aligned. That is expected on `latest` between releases, since
ports are aligned at the release-branch cut (the "Demo Port Alignment" workflow,
`.github/workflows/demo-port-align.yml`) or on demand with `/port-showcases`, so a discovery run
compares only the current ports. Otherwise every pull request that visibly changed a demo would fail
parity against ports nobody is expected to have updated yet.

Staleness comes from the seed tooling, not from anything reimplemented here: the run reads the
report `tools/seeds/check-seeds.mjs --stale` prints (from `PARITY_STALE_REPORT` when set). Each
skipped port is printed when the run starts and again at its end, and recorded under `skipped` in
`summary.json` with reason `stale`. When every port is stale, or none is committed, the run passes
with the one test `no current ports to compare` and prints the same; self-parity runs regardless.
An alignment restamps the ports it edits, which makes them current and so compared, and the lint
job's `check-seeds.mjs --touched` fails a pull request that edits a port without restamping it (see
`tools/seeds/README.md`). An explicit `PARITY_TARGETS` run compares what it is given, stale or not.

### Explicit targets

Example, comparing the Angular financial seed served on port 4710 by hand. The subshell stops the
server when the run ends, so none is left behind on the port:

```sh
cd packages/ag-charts-demos
(
  node e2e/parity/serve-dist.mjs --dir seeds/financial/angular/dist --port 4710 &
  server=$!
  trap 'kill $server' EXIT
  PARITY_TARGETS='[{"demo":"financial","framework":"angular","baseURL":"http://localhost:4710"}]' \
    yarn nx test:e2e:parity ag-charts-demos
)
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

For every target, each state in `states.ts` is reached at 1440×900 and 1024×768 with the locale,
time zone, colour scheme and device scale factor pinned (`parity.spec.ts`). A state is reached
from a fresh load through the same controls a user has, so the port must reproduce the control as
well as the pixels. The states are the initial view, each tab, and one interaction per demo lifted
from the functional specs.

### The whole page, in a taller viewport

Each demo is a shell fixed to the viewport (`position: fixed; inset: 0`) whose content scrolls
inside its own regions, so a screenshot of the viewport would show only what is above the fold.
Instead, once the state has settled, the viewport grows until none of the demo's scroll regions
(`scrollContainers` in `states.ts`) overflows, keeping its width. The charts lay out again at each
step, and the page settles before the one screenshot is taken. Reference and port are grown the
same way, each to its own content.

The compared layout is therefore **taller than the viewport a user sees**, and not only longer:
the demos size charts with `clamp(min, Nvh, max)`, so the extra height grows those charts, which
grows the content again. Growth repeats until the content fits, at most eight rounds for the
current states, usually with each clamp at its maximum. A port whose content is taller or shorter
than the reference's comes out a different size and fails; the record then names both sizes.

### Gates

| Run         | Per-pixel threshold | Anti-aliased pixels | Differing pixels allowed |
| ----------- | ------------------- | ------------------- | ------------------------ |
| Self-parity | 0 (any change)      | counted             | none                     |
| Ports       | 0.05                | not counted         | 0.01% of the screenshot  |

The threshold is pixelmatch's: a YIQ colour distance compared against `35215 × threshold²`. The
port gate (`PORT_GATE` in `compare.ts`) was calibrated on the committed ports, locally on macOS:

- Ports that render like the reference differ by at most 41 pixels, 0.002% of the screenshot, so
  the ratio leaves five times that as headroom.
- 0.05 counts a recolour from `#ffffff` to `#e6e6e6` or from `#5090dc` to `#6aa8f0`; a threshold of
  0.1 counts neither.
- One missing 110×110 block is 0.5% of the tallest screenshot, fifty times the ratio.

`compare.test.ts` proves those cases fail and an identical image passes. CI renders on Linux, whose
text rasterisation differs from macOS; if a clean port fails there, recalibrate from the CI
artefacts rather than widening the gate by eye.

### Holding the page still

Both sides load with CSS transitions and animations switched off, so a hover colour started by the
state's last click cannot be caught mid-way on one side. AG Charts animates in script, which
`settle` waits out.

Both sides also get the same third-party bytes. The demos load their web fonts from Google Fonts,
which does not always answer a stylesheet URL with the same stylesheet: now and then it names other
font files, and text drawn with them lands on different pixels. Measured before the fix, that made
between two and seven of 78 self-parity comparisons fail. The spec fetches each third-party
response once per worker and replays it to every page after, so the reference and the port always
see the same fonts. A port that inlines the font stylesheet at build time (Angular's font inlining)
bypasses this and differs whenever Google's answer at build time does not match the one pinned.

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

Both sides also lay their charts out with their web fonts already loaded: loaded with the switch,
and only then, the React app waits for them before a demo's first render, and the ports' first
layout sees them by their own timing. Charts measure their text on a canvas with whatever font it
has at that moment, so a first layout in a fallback font can land on other pixels than one in the
final font; the comparison needs the final font from the first layout, a visitor does not, which is
why a normal load never waits. See "Web fonts and the first render" in the package README.

## Results

Everything a run leaves is under `results/<run>/` (gitignored), where `<run>` is `self-parity` or
`ports`, so the two runs CI makes one after the other keep their own results. The JUnit report
and Playwright's output folder are named after the run in the same way.

- `summary.json`, described below.
- `<framework>/<demo>/<state>@<viewport>/repeat-<n>-retry-<m>/` with `reference.png`, `port.png`,
  `diff.png` and `side-by-side.png` for every failed attempt (every attempt with
  `PARITY_KEEP_ARTEFACTS=1`). Each repeat (`--repeat-each`) and retry has its own folder, so
  concurrent repeats never share one and a retry never overwrites the failure before it. The same
  files are attached to the Playwright report.

In CI the folder is uploaded with the `test-results-demos-e2e` artefact.

### `summary.json`

```jsonc
{
    "schemaVersion": 3,
    "generatedAt": "2026-09-21T10:15:00.000Z",
    "status": "passed", // Playwright's run status: passed | failed | timedout | interrupted
    "run": "ports", // or "self-parity"
    "reference": { "framework": "react", "baseURL": "http://localhost:4701" },
    "gate": { "pixelThreshold": 0.05, "includeAntiAliasing": false, "maxDiffPixelRatio": 0.0001 },
    "totals": { "comparisons": 78, "passed": 77, "flaky": 1, "failed": 0, "attempts": 79 },
    // Ports a discovery run did not compare; empty in any other run.
    "skipped": [
        {
            "demo": "procurement",
            "framework": "vue",
            "reason": "stale",
            "sourceHash": "sha256-…", // the demo's hash now
            "manifestHash": "sha256-…", // the hash the port was last aligned to
            "sourceCommit": "…", // null in a shallow clone whose history cannot tell
            "manifestCommit": "…",
        },
    ],
    "comparisons": [
        {
            "demo": "financial",
            "framework": "angular",
            "state": "initial",
            "viewport": "1440x900", // the viewport the page is first laid out in
            "repeatEachIndex": 0,
            "retry": 0,
            "screenshots": { "reference": "1440x1232", "port": "1440x1232" }, // null when none was taken
            "diffPixels": 6, // null when the comparison never ran
            "diffPixelRatio": 0.0000034, // diffPixels / pixels in the reference; 1 on a size mismatch
            "passed": true,
            "artefacts": {
                // relative to results/<run>/; present only when written
                "reference": "angular/financial/initial@1440x900/repeat-0-retry-0/reference.png",
                "port": "angular/financial/initial@1440x900/repeat-0-retry-0/port.png",
                "diff": "angular/financial/initial@1440x900/repeat-0-retry-0/diff.png",
                "sideBySide": "angular/financial/initial@1440x900/repeat-0-retry-0/side-by-side.png",
            },
            "error": "...", // only when not passed: the assertion or the reason the state was not reached
        },
    ],
}
```

`comparisons` holds one record per attempt, repeats and retries included, so a failure is never
hidden by a later pass. A comparison in `totals` is one `framework/demo/state@viewport` at one
repeat index, counted once: `failed` when its last attempt failed, `flaky` when it failed and then
passed on a retry, `passed` when every attempt passed. `attempts` counts the records. `skipped`
lists the stale ports a discovery run left out, each with the fields of its `check-seeds.mjs
--stale` entry; version 3 added it. The types are in `summary.ts`, and `summary-reporter.ts` writes
the file.
