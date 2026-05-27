---
targets: ['cursor', 'codexcli', 'geminicli', 'copilot', 'agentsmd']
name: examples-ab-smoke
description: "A/B smoke-test every visible example across an AG product website (AG Charts, AG Grid, or AG Studio) by comparing two named sides (e.g. local HEAD vs published archive, RC staging vs production). Product-specific phases exercise the examples (Charts: controls/tooltip/legend; Grid: initial render), then pixel-diffs screenshots and routes exceptions to LLM triage. Use when smoke-testing a release branch, RC, or staging deploy before a merge or release. Triggers on `/examples-ab-smoke`, \"smoke test the docs examples\", \"compare local vs production\", \"A/B test before release\"."
invocable: user-only
---

# Examples A/B Smoke Test

Compares two named sides of an AG product website end-to-end. Discovers every example under the website's content tree, applies product-specific example-options config, and exercises each example through a product-defined phase set on each side. Pixel-diffs the screenshots, classifies anything non-clean as an exception, and queues exceptions for LLM triage.

The runner is product-agnostic — product-specific selectors, phases, wait logic, and discovery config live in **profile modules** under `scripts/profiles/`. The product is resolved from the `PRODUCT` env var, `sides.json.product`, or auto-detected from the git remote.

The bias is towards over-flagging. Errors during testing are exceptions. Image differences are exceptions until proven benign. Quiet "no change" requires confidence on both sides.

## Supported products

| Product | Profile | Status |
|---|---|---|
| AG Charts | `profiles/ag-charts.mjs` | Full — all 5 phases |
| AG Grid | `profiles/ag-grid.mjs` | Scaffold — initial render only |
| AG Studio | `profiles/ag-studio.mjs` | Stub — not yet implemented |

## When to use

- Before merging an RC — confirm the docs site is unchanged where it should be.
- Before promoting a release branch to production — compare local HEAD or staging against current production.
- Before publishing an archive — compare the archive build against the live site.
- After a substantial rendering or framework-wrapper refactor — run the matrix across multiple frameworks.
- User says: `/examples-ab-smoke`, "smoke test the docs", "A/B compare", "make sure these changes are safe to ship".

Not for:

- Performance comparison — use dedicated benchmark suites.
- Pixel-perfect regression on a single canvas — use visual snapshot suites.
- Single-example deep dives — run the dev server in a real browser.

## Sides

A run compares exactly two sides. Each side is `{ name, baseUrl }`. One framework per run, applied to both sides — multi-framework coverage is multiple runs.

### AG Charts presets

| Preset | `baseUrl` | Notes |
|---|---|---|
| `local` | `https://localhost:4600/charts` | Self-signed cert tolerated. |
| `production` | `https://ag-grid.com/charts` | Live site. Cookie banner auto-dismissed. |
| `archive:<version>` | `https://ag-grid.com/charts/archive/<version>` | Published archive. |
| `staging` | `https://staging.<host>/charts` | Set via env var. |

### AG Grid presets

| Preset | `baseUrl` | Notes |
|---|---|---|
| `local` | `https://localhost:4200` | Local dev server. |
| `production` | `https://ag-grid.com` | Live site. |

Common recipes:

- **Pre-merge confidence (Charts)**: `local` vs `archive:<previous-rc>` on `vanilla` — fastest, ~6 minutes for the full docs site.
- **Framework-wrapper refactor**: re-run the same pair across `vanilla`, then `reactFunctional`, then `angular`, then `vue3`.
- **Pre-release regression**: `staging` vs `production` on `vanilla`.

## Phases

Phases are product-specific. Each profile defines which phases to run and how to exercise the examples.

### AG Charts phases

1. **`initial`** — load page, settle animation, screenshot the chart wrapper.
2. **`controls`** — for each `.example-controls > button` in click order (`normal` or `reverse` per example options), record `data-scene-renders` before, click, and either wait for scene-renders to bump or `networkidle` if skipped. One screenshot per control state.
3. **`tooltip`** — drive via keyboard (`Tab` then `ArrowRight`) to surface the tooltip on a deterministic datum. Falls back to mid-canvas hover if the keyboard path fails.
4. **`legend-hover`** — hover the first legend proxy (`button[role="switch"].ag-charts-proxy-elem`) to propagate highlight to the canvas.
5. **`legend-toggle`** — click the first legend proxy to hide its series; restore at the end.

### AG Grid phases

1. **`initial`** — load page, wait for grid rows to render, screenshot the grid wrapper.

Additional phases (scroll, sort, filter, column-resize) will be added as the Grid e2e fixture stabilises.

## Exception classes

Every (example, framework, phase) ends in exactly one of three states: `clean`, `exception`, or `coverage-gap`. Exception classes:

- `navigation-error` — `page.goto` threw or returned non-200.
- `console-error` — non-noise console error during the phase.
- `page-error` — uncaught exception in the page.
- `canvas-missing` — (Charts) `.ag-charts-wrapper canvas` did not become non-zero within 20s.
- `content-missing` — (Grid) `.ag-root-wrapper` did not appear within 20s.
- `control-no-render` — (Charts) control click did not bump `data-scene-renders`.
- `chart-not-settled` — (Charts) chart animation/update did not settle before screenshot.
- `grid-not-ready` — (Grid) grid did not render rows within timeout.
- `image-diff` — minor pixel diff (≥0.05% of pixels). Goes to LLM triage.
- `image-diff-major` — substantial pixel diff (≥1%). Untriaged majors default to `regression`.
- `legend-asymmetry` — (Charts) legend visible on one side but not the other.

## How to run

### Prerequisites

- Node ≥ 22 (for `node:fs` glob).
- `playwright`, `pixelmatch`, and `pngjs` available in `node_modules` at the repo root. The ag-grid repo ships `pngjs` but not `pixelmatch` — install it with `yarn add -D -W pixelmatch` (or `npm i pixelmatch`) before running step 5.
- For `local` side: the product's dev server running at the expected URL.
- For `archive:<version>` side: confirm the archive URL returns 200.

### Step 1 — copy the runner scripts

```bash
mkdir -p plans/examples-ab-smoke
cp ${CLAUDE_PLUGIN_ROOT}/skills/examples-ab-smoke/scripts/*.mjs plans/examples-ab-smoke/
cp -r ${CLAUDE_PLUGIN_ROOT}/skills/examples-ab-smoke/scripts/profiles plans/examples-ab-smoke/profiles
```

`plans/` is gitignored — outputs there are large.

### Step 2 — pick the sides and product

Define a `sides.json` next to the scripts:

```jsonc
{
  "product": "ag-charts",
  "left":  { "name": "local",   "baseUrl": "https://localhost:4600/charts" },
  "right": { "name": "archive", "baseUrl": "https://ag-grid.com/charts/archive/13.3.0" },
  "framework": "vanilla"
}
```

Or for AG Grid:

```jsonc
{
  "product": "ag-grid",
  "left":  { "name": "local",   "baseUrl": "https://localhost:4200" },
  "right": { "name": "production", "baseUrl": "https://ag-grid.com" },
  "framework": "vanilla"
}
```

Override via env vars (`LEFT_BASE_URL`, `LEFT_NAME`, `RIGHT_BASE_URL`, `RIGHT_NAME`, `FRAMEWORK`, `PRODUCT`).

### Step 3 — discover the example matrix

```bash
node plans/examples-ab-smoke/discover.mjs --product ag-charts --framework vanilla > plans/examples-ab-smoke/matrix.json
```

`discover.mjs` walks the product's content tree, applies merged example options, filters exclusions, and writes a JSON matrix. The `--product` flag selects the profile; if omitted, auto-detects from git remote. The `--framework` flag must match `sides.json`.

For a curated subset:

```bash
node plans/examples-ab-smoke/discover.mjs --product ag-charts --framework vanilla --filter "page=gallery|cartesian-overview" > plans/examples-ab-smoke/matrix.json
```

### Step 4 — run the sweep

```bash
SIDES_FILE=plans/examples-ab-smoke/sides.json \
MATRIX_FILE=plans/examples-ab-smoke/matrix.json \
CONCURRENCY=4 \
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/run-ab-smoke.mjs
```

Wall time scales linearly with `(examples × 2 sides) / concurrency`. Concurrency 4 keeps dev servers happy.

When the Playwright phase finishes, the sweep automatically rolls into `diff.mjs` then `triage-queue.mjs` (steps 5 and 6a). Set `SKIP_AUTO_CHAIN=1` to run them manually.

#### Iterating: re-run only the exceptions

Set `RERUN_EXCEPTIONS=1` to filter to tuples that had exceptions in existing `results.json`, then merge fresh outcomes back.

```bash
SIDES_FILE=plans/examples-ab-smoke/sides.json \
MATRIX_FILE=plans/examples-ab-smoke/matrix.json \
CONCURRENCY=4 \
OUTPUT_DIR=./plans/examples-ab-smoke \
RERUN_EXCEPTIONS=1 \
node plans/examples-ab-smoke/run-ab-smoke.mjs
```

Always finish with one full sweep before relying on the report for a release decision.

### Step 5 — pixel-diff and pre-classify

```bash
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/diff.mjs
```

Writes `diff/<example>-<framework>-<phase>.png` for any pair that differs and updates `results.json` with per-phase `imageDiff: { changed, total, percent }`.

> All post-sweep scripts resolve paths from `OUTPUT_DIR`. Always set it explicitly.

### Step 6 — LLM triage

Triage is a three-step pipeline: queue → dispatch → merge.

**6a. Build the queue.**

```bash
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/triage-queue.mjs
```

**6b. Chunk and dispatch.**

```bash
OUTPUT_DIR=./plans/examples-ab-smoke CHUNK_SIZE=20 \
node plans/examples-ab-smoke/triage-dispatch.mjs
```

For each chunk in the manifest, spawn one `general-purpose` Agent with this prompt:

```
You are triaging smoke-test exceptions from an A/B comparison.

LEFT side: <left.name> (<left.baseUrl>)
RIGHT side: <right.name> (<right.baseUrl>)

Read items from: <chunk path>

Each item has: id, type, side, page, example, framework, phase, and evidence
(paths to PNGs + console/page-error arrays + diff percent for image-diff types).

For each item, examine the evidence using the Read tool (PNGs render visually):
- image-diff / image-diff-major: read leftScreenshot, rightScreenshot, diffPath
- navigation-error / page-error / console-error: read text fields in evidence
- canvas-missing / content-missing: read screenshots if present
- control-no-render: read screenshots; means a click did not bump renders
  within 5s on one side
- legend-asymmetry / chart-not-settled / grid-not-ready: examine evidence

Decide one of: regression | benign-cosmetic | benign-flake | needs-human

Rules:
- Default is `regression`. Only return benign-* if you can identify the cause.
- image-diff has a high bar — describe the difference and explain why it does
  not affect the output.
- nav/page/content errors are almost always `regression`.
- control-no-render on one side only = `regression`. Both sides = `needs-human`.

Write a JSON array of `{ id, verdict, reason }` to <verdicts path>. Reason ≤ 1 sentence.
```

**6c. Merge verdicts back into `results.json`.**

```bash
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/triage-merge.mjs
```

### Step 7 — generate the report

```bash
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/generate-report.mjs
open plans/examples-ab-smoke/report.html
```

The report adapts to the product — phase columns, URLs, and version display all derive from `results.json` rather than hardcoded assumptions.

### Step 8 — publish the report (optional)

The report is self-contained but references screenshots as relative paths, so serve alongside those directories.

```bash
SRC=./plans/examples-ab-smoke
SHARE="$SRC/share"
rm -rf "$SHARE" && mkdir -p "$SHARE"
cp "$SRC/report.html" "$SHARE/index.html"
rsync -a --link-dest="$(cd "$SRC" && pwd)/" "$SRC/screenshots/" "$SHARE/screenshots/"
rsync -a --link-dest="$(cd "$SRC" && pwd)/" "$SRC/diff/" "$SHARE/diff/"

npx -y netlify-cli deploy --dir="$SHARE" --prod --no-build
```

## Data model

`results.json` is the source of truth for everything downstream. Annotated shape:

```jsonc
{
  "sides": { "left": { "name": "…", "baseUrl": "…" }, "right": { … } },
  "framework": "vanilla",
  "product": "ag-charts",
  "sideMetadata": { "left": { … }, "right": { … } },
  "results": [
    {
      "page": "gallery",
      "example": "bar-with-labels",
      "framework": "vanilla",
      "left": {
        "side": "archive-13.3.0",
        "url": "…",
        "consoleErrors": [], "consoleWarnings": [], "pageErrors": [],
        "contentReady": true,
        "phases": {
          "initial":       { "name": "initial", "screenshots": [ … ], "exceptions": [ … ] },
          "controls":      { … },
          "tooltip":       { … },
          "legend-hover":  { … },
          "legend-toggle": { … }
        }
      },
      "right": { … }
    }
  ]
}
```

The `product` field tells downstream scripts which profile was used. Phase names vary by product.

## Product profiles

Each profile exports a standard interface (documented in `profiles/shared.mjs`):

- **Selectors** — DOM selectors for the product's content elements.
- **Phases** — ordered array of `{ name, run(ctx), guard?(ctx) }`. Each phase runner receives a context with the Playwright page, entry, side info, screenshot helpers, and a mutable `state` bag for cross-phase data.
- **Wait logic** — `waitForReady()` (content has settled) and `waitForContent()` (content element exists and is non-zero).
- **Discovery config** — content directory, glob pattern, example-options, drift check sources.
- **URL builder** — constructs the example URL from base URL + entry metadata.

To add a new product or new phases to an existing product, edit the corresponding profile under `scripts/profiles/`.

## Maintenance

- **AG Charts `example-options.mjs`** mirrors upstream e2e config. `discover.mjs` runs a drift check at startup.
- The console-error noise filter is in each profile's `isNoise()`. Add new noise patterns there.
- `pixelmatch` thresholds live in `diff.mjs`. The defaults bias towards over-flagging.
- New examples, pages, and frameworks need no skill change — discovery is dynamic.

## Outputs

```
plans/examples-ab-smoke/
├── sides.json
├── matrix.json
├── results.json
├── triage-queue.json
├── triage-chunks/
├── triage-verdicts/
├── triage-manifest.json
├── report.html
├── share/
├── screenshots/
│   ├── <side>/<example>-<framework>-<phase>[-<control-slug>].png
│   └── ...
└── diff/
    └── <example>-<framework>-<phase>[-<control-slug>].png
```
