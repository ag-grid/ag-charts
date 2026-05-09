---
targets: ['claudecode']
name: examples-ab-smoke
description: A/B smoke-test every visible example across the AG Charts website (gallery + docs pages) by comparing two named sides (e.g. local HEAD vs published archive, RC staging vs production, production-vanilla vs RC-multi-framework). Captures initial render, exercises any `.example-controls` buttons above the example, exercises tooltip / legend interactions, then runs pixel diff. Exceptions (console errors, page errors, canvas-missing, control click did not bump scene-renders, image diff above threshold) are routed to an LLM triage step where each is judged regression vs benign, with image diffs held to a high bar before dismissal. Use when smoke-testing a release branch, RC, or staging deploy before a merge or release. Triggers on `/examples-ab-smoke`, "smoke test the docs examples", "compare local vs production", "A/B test before release".
invocable: user-only
---

# Examples A/B Smoke Test

Compares two named sides of the AG Charts website end-to-end. Discovers every `_examples/` directory under `content/` (gallery + docs pages), applies the same exception config used by the e2e tests (`EXAMPLE_OPTIONS`), and exercises each example through a fixed phase set on each side. Pixel-diffs the screenshots, classifies anything non-clean as an exception, and queues exceptions for LLM triage.

The bias is towards over-flagging. Errors during testing are exceptions. Image differences are exceptions until proven benign. Quiet "no change" requires confidence on both sides.

## When to use

- Before merging an RC into `bX.Y.Z` — confirm the docs site is unchanged where it should be.
- Before promoting a release branch to production — compare local HEAD or staging against current production.
- Before publishing an archive — compare the archive build against the live site.
- After a substantial rendering or framework-wrapper refactor — run the matrix across `vanilla` + `reactFunctional` + `angular` + `vue3`.
- User says: `/examples-ab-smoke`, "smoke test the docs", "A/B compare", "make sure these changes are safe to ship".

Not for:

- Performance comparison — use `data-selection-zoom` benchmark.
- Pixel-perfect regression on the chart canvas alone — use the Jest visual snapshot suite.
- Single-example deep dives — run the dev server in a real browser.

## Sides

A run compares exactly two sides. Each side is `{ name, baseUrl }`. One framework per run, applied to both sides — multi-framework coverage is multiple runs.

| Preset | `baseUrl` | Notes |
|---|---|---|
| `local` | `https://localhost:4600/charts` | Self-signed cert tolerated (`ignoreHTTPSErrors`). |
| `production` | `https://ag-grid.com/charts` | Live site. Cookie banner auto-dismissed. |
| `archive:<version>` | `https://ag-grid.com/charts/archive/<version>` | Published archive. Cookie banner auto-dismissed. |
| `staging` | `https://staging.<host>/charts` | Set via env var. |

Common recipes:

- **Pre-merge confidence**: `local` vs `archive:<previous-rc>` on `vanilla` — fastest, ~6 minutes for the full docs site.
- **Framework-wrapper refactor**: re-run the same pair across `vanilla`, then `reactFunctional`, then `angular`, then `vue3` — separate output dirs per run.
- **Pre-release regression**: `staging` vs `production` on `vanilla`.

## Phases per (example, framework) per side

1. **`initial`** — load page, settle animation, screenshot the chart wrapper.
2. **`controls`** — for each `.example-controls > button` in click order (`normal` or `reverse` per `EXAMPLE_OPTIONS`), record `data-scene-renders` before, click, and either:
   - Wait for scene-renders to bump (default), OR
   - Wait for `networkidle` if the page-level or button-text-level `skipCanvasUpdateCheck` says so.
   If the bump never arrives within 5s and the button is not in the skip list, flag as `control-no-render`. One screenshot per control state.
3. **`tooltip`** — drive via keyboard (`Tab` then `ArrowRight`) to surface the tooltip on a deterministic datum. Falls back to mid-canvas hover if the keyboard path fails.
4. **`legend-hover`** — hover the first legend proxy (`button[role="switch"].ag-charts-proxy-elem`) to propagate highlight to the canvas.
5. **`legend-toggle`** — click the first legend proxy to hide its series; restore at the end of the phase.

Console errors, page errors, missing canvases, and control-no-render events are accumulated as they happen and attached to the originating phase.

## Exception classes

Every (example, framework, phase) ends in exactly one of three states: `clean`, `exception`, or `coverage-gap`. Exception classes:

- `navigation-error` — `page.goto` threw or returned non-200.
- `console-error` — non-noise console error during the phase.
- `page-error` — uncaught exception in the page.
- `canvas-missing` — `.ag-charts-wrapper canvas` did not become non-zero within 20s.
- `control-no-render` — control click did not bump `data-scene-renders` and was not in `skipCanvasUpdateCheck`.
- `image-diff` — minor pixel diff (default: ≥0.05% of pixels changed at `pixelmatch.threshold=0.05`). Goes to LLM triage.
- `image-diff-major` — substantial pixel diff (default: ≥1% of pixels). Untriaged majors default to `regression` in the report.

Anything else is `clean`.

## How to run

### Prerequisites

- For `local` side: `yarn nx dev ag-charts-website` running on `https://localhost:4600/charts`.
- For `archive:<version>` side: confirm `https://ag-grid.com/charts/archive/<version>/` returns 200.
- Node ≥ 22 (for `node:fs` glob).
- `playwright`, `pixelmatch`, and `pngjs` available in `node_modules` at the repo root.

### Step 1 — copy the runner scripts

```bash
mkdir -p plans/examples-ab-smoke
cp .claude/skills/examples-ab-smoke/scripts/*.mjs plans/examples-ab-smoke/
```

`plans/` is gitignored — outputs there are large (low GB at full matrix).

### Step 2 — pick the sides

Define a `sides.json` next to the scripts:

```jsonc
{
  "left":  { "name": "local",   "baseUrl": "https://localhost:4600/charts" },
  "right": { "name": "archive", "baseUrl": "https://ag-grid.com/charts/archive/13.3.0" },
  "framework": "vanilla"
}
```

Or override via env vars (`LEFT_BASE_URL`, `LEFT_NAME`, `RIGHT_BASE_URL`, `RIGHT_NAME`, `FRAMEWORK`).

### Step 3 — discover the example matrix

```bash
node plans/examples-ab-smoke/discover.mjs --framework vanilla > plans/examples-ab-smoke/matrix.json
```

`discover.mjs` walks `packages/ag-charts-website/src/content/**/_examples/*/main.ts`, applies the merged `EXAMPLE_OPTIONS` config (gallery + examples-snapshots), filters out 404 examples, drops examples whose page disallows the requested framework, and writes a JSON list of `{page, example, framework, options}` tuples. The `--framework` flag must match the `framework` value in `sides.json`.

For a curated subset:

```bash
node plans/examples-ab-smoke/discover.mjs --framework vanilla --filter "page=gallery|cartesian-overview" > plans/examples-ab-smoke/matrix.json
```

### Step 4 — run the sweep

```bash
SIDES_FILE=plans/examples-ab-smoke/sides.json \
MATRIX_FILE=plans/examples-ab-smoke/matrix.json \
CONCURRENCY=4 \
OUTPUT_DIR=./plans/examples-ab-smoke \
node plans/examples-ab-smoke/run-ab-smoke.mjs
```

Wall time scales linearly with `(examples × 2 sides) / concurrency`. Concurrency 4 keeps the dev server happy.

### Step 5 — pixel-diff and pre-classify

```bash
node plans/examples-ab-smoke/diff.mjs
```

Writes `diff/<example>-<framework>-<phase>.png` for any pair that differs and updates `results.json` with per-phase `imageDiff: { changed, total, percent }`.

### Step 6 — LLM triage

```bash
node plans/examples-ab-smoke/triage-queue.mjs > plans/examples-ab-smoke/triage-queue.json
```

This emits a queue of exception bundles, each containing the screenshot pair, diff image (if any), captured console logs, and the phase context.

The triage step itself is **not** automated — it is delegated to Claude Code subagents launched from the calling skill or by the user:

```
For each exception in plans/examples-ab-smoke/triage-queue.json, spawn a
Task subagent (general-purpose) with this prompt:

  Triage the following AG Charts smoke-test exception. Default verdict is
  `regression`. Only return `benign-cosmetic` if you can identify the
  rendering or layout cause and convince yourself it is unrelated to chart
  output (e.g. cookie-banner pixel bleed, font-loading flake, scrollbar
  width). For `image-diff` specifically, the bar is high — describe the
  difference precisely and explain why it does not affect the chart.

  Read these files: <leftPng>, <rightPng>, <diffPng>, <consoleLog>.
  Phase: <phase>. Page: <page>. Example: <example>. Framework: <framework>.
  Control button at moment of failure (if applicable): <buttonLabel>.

  Respond as JSON: { "verdict": "regression" | "benign-cosmetic" |
  "benign-flake" | "needs-human", "reason": "<one sentence>" }.
```

Append each verdict back into `results.json` under `<example>.<framework>.<phase>.triage`.

### Step 7 — generate the report

```bash
node plans/examples-ab-smoke/generate-report.mjs
open plans/examples-ab-smoke/report.html
```

The report leads with the exception list. Verified-clean rows are collapsed. Header counters: `clean / untriaged / triaged-benign / regression / needs-human / runner-error`. Each exception card shows side-by-side screenshots, the diff image where applicable, the captured console output, and the LLM verdict + reason. Untriaged `image-diff-major` rows automatically count as `regression` so they cannot be missed in the summary.

## Maintenance

- `scripts/example-options.mjs` mirrors `packages/ag-charts-website/e2e/example-options.ts` and the `exampleOptions` constant in `gallery-examples.spec.ts`. **Keep in sync.** `discover.mjs` runs a regex-based drift check against both source files at startup and writes warnings to stderr for any top-level page key in either source that is missing from the mirror.
- The `.example-controls > button` selector is stable across the docs site — change it in one place (`SELECTORS` in `run-ab-smoke.mjs`) if the website layout shifts.
- `pixelmatch` thresholds live in `diff.mjs` (`PIXEL_THRESHOLD`, `CHANGED_PCT_MINOR_FLAG`, `CHANGED_PCT_MAJOR_FLAG`). The defaults bias towards over-flagging; loosen only with evidence that a class of diffs is reliably benign.
- The console-error noise filter (`isNoise()` in `run-ab-smoke.mjs`) covers AG Charts license banners, OneTrust, Hotjar, Plausible, Vite HMR, React DevTools. Add new noise here, never to per-example skip lists.
- New examples, new pages, new frameworks need no skill change — discovery is dynamic.

## Outputs

```
plans/examples-ab-smoke/
├── sides.json
├── matrix.json
├── results.json            # full structured per-phase data per side per (example, framework)
├── triage-queue.json       # exceptions awaiting LLM verdicts
├── report.html             # the visual report — open this
├── screenshots/
│   ├── <side>/<example>-<framework>-<phase>[-<control-slug>].png
│   └── ...
└── diff/
    └── <example>-<framework>-<phase>[-<control-slug>].png
```
