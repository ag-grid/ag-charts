---
targets: ['*']
name: animation-test-migration
description: 'Migrate a series type from ratio-snapshot animation tests and manual -test docs pages to frame-trajectory coverage. Use when converting a series (area, pie, scatter, histogram, range-bar, candlestick, radar, …) to the trajectory harness.'
---

# Animation Test Migration

Convert one series type's animation coverage from manual `-test` docs pages and per-ratio image
snapshots to frame-trajectory tests. This procedure was established on bar (PR #7358) and line
(PR #7368) — read the `animation -test page actions` describes in `barSeries.test.ts` and
`lineSeries.test.ts` as the reference implementations, and the `animation-trajectory-tests` rule
for harness vocabulary. Work one series per PR against `latest`, under the AG-17755 umbrella.

## Step 1 — Inventory the behaviours to cover

1. List the animation examples on the series' `-test` page(s)
   (`packages/ag-charts-website/src/content/docs/<series>-series-test/_examples/*/main.ts`) — each
   control on those examples becomes at least one trajectory CASE, in both `standalone` and
   `integrated` mode where the page has an integrated variant (`options.mode: 'integrated'`).
   Non-animation examples on the same page (missing-data rendering, layout variants) stay put.
   Some series never had a `-test` page — skip this sub-step and Step 7 entirely for those, and
   drive the CASEs from the public `animation` docs-page actions plus the existing
   `spyOnAnimationManager` snapshot describes instead of hunting for pages that do not exist.
2. Add the relevant public `animation` docs-page actions (initial load, add/remove/update data,
   legend toggle) if the page lacks a button for them — same code path, cheap coverage.
3. List the existing snapshot animation describes in the series' `*.test.ts` and classify each:
   trajectory-expressible (motion, timing, bounds — the default) vs pixel-only (compositing,
   fills, painted clipping — kept as snapshots, ratio list trimmed to `[0, 0.5, 1]` or endpoints).

## Step 2 — Probe, then write CASEs

For each behaviour, add a temporary probe test that runs the action under
`spyOnAnimationFrames()` and dumps sampled frames (`process.stdout.write`). Read the real
per-frame values and phases; only then write the CASE. Reuse the suite's spec fragments
(`fadeIn`, `markersReflow`, `revealFromBaseline`, `axisReflowSpec`, `survivorBands`) or add
equivalents; shared helpers used by 2+ files belong in `chart/test/utils.ts`.

The moving reveal property varies by series family — box-plot uses `scalingY`, radar the bbox
`width`/`height`, range a `clip:x` swipe plus marker `width`/`height`. Derive it from the probe;
do NOT copy it from a sibling series' precedent. Probe the whole sampled scene, not just the mark
nodes: labels, containers and stacked inner edges animate too.

Every CASE needs:

-   an anti-vacuity guard (frame-0 collapsed/full-value assertion, or endpoint count change);
-   phase windows (`during`) on everything that moves, so desync regressions fail;
-   `frameInvariants` for cross-node contracts (stack contiguity, marker-on-path sync).

If the action snaps structurally at frame 0 (series toggles, category swaps), hand-roll the
capture instead of `captureUpdate` (see the structural-snap pitfall in the
`animation-trajectory-tests` rule).

## Step 3 — Negative-test every spec

Flip one direction/phase/settle value per new expectation, confirm the CASE fails with a
diagnostic naming the behaviour, revert. Never skip this: the vocabulary has vacuity traps.

## Step 4 — Regression sanity-check against historic bugs

`git log --oneline --grep=<SERIES>` and trawl the CRT JIRA project for the series' historic
animation bugs. For each, re-inject the defect by perturbing the CURRENT fix line (old fixes
rarely revert cleanly), run the new CASEs, and record caught/missed. A missed bug means a missing
CASE or invariant. Restore the source exactly (`git status` must be clean) before committing.

## Step 5 — Convert the snapshot blocks

Delete each trajectory-covered snapshot describe, leaving a one-line pointer comment naming the
covering CASE(s). `spyOnAnimationManager()` and `spyOnAnimationFrames()` cannot coexist under a
shared parent scope — a `spyOnAnimationManager()` at a top-level describe cascades into a sibling
`spyOnAnimationFrames()` describe. Keep any retained snapshot block's spy inside its own describe
rather than hoisted above both. Trim kept pixel-only blocks' ratio lists. `git rm` the matching PNGs under the
suite's `__image_snapshots__/` (they are never auto-pruned), then run the suite and confirm no
`*-diff.png` artifacts and no "new snapshot written" output. Snapshot deletion needs explicit
user authorisation — get it before this step.

## Step 6 — Pixel endpoint guards

Add 2-3 `expectAnimatedEndpointsMatchStatic` call sites per suite for the highest-value
transitions (data update, series add/remove, legend toggle). These replace the endpoint role of
the deleted 0%/100% snapshots.

## Step 7 — Retire the animation examples

Only after steps 1-6 are merged-quality and the user signs off. Scope removal to the animation
examples, not the whole page — a `-test` page often hosts unrelated examples too (e.g.
`area-series-test` keeps `missing-data-area`), and only line and bar happened to be
animation-only:

-   delete the animation `_examples/<name>/` directories the CASEs now cover, and remove their
    entries from the page's `index.mdoc`;
-   remove the matching per-example keys from any `'<series>-series-test'` block in
    `packages/ag-charts-website/e2e/example-options.ts`;
-   **only if no examples remain**, delete the whole
    `packages/ag-charts-website/src/content/docs/<series>-series-test/` directory and its
    `example-options.ts` block (this is what happened for line and bar);
-   grep the repo for remaining references (nav.json needs nothing — `-test` pages are excluded
    automatically).

## Step 8 — Verify

-   Targeted: `NX_DAEMON=false npx vitest run --config packages/ag-charts-community/vitest.config.ts <suite>`
    (enterprise config for enterprise series).
-   Full: `yarn nx test ag-charts-community` and `ag-charts-enterprise`.
-   Gates: `yarn nx format`, `yarn nx lint <package>`, `NX_DAEMON=false yarn nx build:types <package>`.
