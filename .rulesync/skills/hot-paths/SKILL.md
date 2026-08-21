---
targets: ['*']
name: hot-paths
description: 'AG Charts runtime hot paths: which files run per datum, per frame or per interaction, the invariants each tier must hold, and how to evidence a performance claim. Use when reviewing a change that touches series, scene, data-model, scale, interaction or DOM code, when asked whether a diff will cost performance, or when deciding which benchmark to run.'
---

# AG Charts Hot Paths

A chart renders up to a million datums and repaints at 60Hz, so the same edit costs
nothing in one file and 80ms of frame time in another. This skill says which files are
which, what each tier must hold, and how to evidence a claim rather than assert it.

It is a **review and impact-analysis** guide. For *implementing* an optimisation, use
`/ag-charts:optimize-series` — the full playbook with the BarSeries reference.

## Run the detector first

```bash
node tools/hot-paths/detect.js --range <base>...<head>   # exact revisions, fork point to head
node tools/hot-paths/detect.js --pr <number> --summary   # a PR, vs its merge-base
node tools/hot-paths/detect.js --base latest --summary   # the working tree, untracked files included
```

Three dots resolve the fork point of the head from the base — what a branch or PR
actually contains. Two dots compare the two revisions as given, which charges the
change for whatever the base has merged since. Prefer `--range` with resolved SHAs
when reviewing: `--pr` re-resolves the head, so a push landing mid-review moves it.

JSON on stdout is the default; `--summary` swaps it for the human-readable form.
The exit status is 0 whatever the verdict, so read the `triggered` boolean rather
than testing the status.

Two stages, both mechanical:

1. Changed non-test `.ts` files are matched against the tier globs in
   `tools/hot-paths/hot-path-index.json`.
2. Each hit is scored: added lines carrying loops, TypedArrays, per-datum or per-frame
   entry points, update-type or DOM calls; changes landing within 20 lines of an
   existing hot-path marker comment; and — the sharpest signal — added lines that
   **execute inside a loop** in the head revision.

The JSON output carries the tier, the frequency claim, the invariants for the tiers
hit, and the evidence handles. Read `triggered`; the invariants come with it, so there
is no need to restate the tier table from here.

Calibration at the current threshold, over the last 48 PR merges: stage 1 alone matches
**67%** of them — the tier globs are deliberately broad — and the stage-2 scoring narrows
that to **27%**, catching **10 of 13** known performance commits. The scoring is what
makes the pass affordable, so re-derive both rates after changing any weight; do not tune
the threshold on a single PR.

## The four tiers

| Tier | Runs | Where |
|------|------|-------|
| 1 | per datum, per `SERIES_UPDATE` — up to 1e6 | `chart/series/**`, `enterprise/src/series/**`, core `utils/aggregation.ts`, `utils/data/**`, `utils/geometry/**` |
| 2 | per animation frame, per node | `scene/**`, `motion/**`, `chart/marker/**`, `series/**/*Node.ts`, `series/**/*Shape.ts` |
| 3 | per pointer move, data transaction or chart update | `chart/interaction/**`, `chart/data/**`, `chart/axis/**`, `chart/tooltip/**`, `scale/**`, `dom/**`, `enterprise/src/features/**`, `chart.ts` |
| 4 | once per bundle load | `module/**`, `module-bundles/**`, `main.ts` — a size-limit question, not a benchmark one |

`ChartUpdateType` (`ag-charts-core/src/types/updateType.ts`) is the spine to reason
along: `FULL → UPDATE_DATA → PROCESS_DATA → PROCESS_DOMAIN → PROCESS_RANGE →
PERFORM_LAYOUT → PRE_SERIES_UPDATE → SERIES_UPDATE → PRE_SCENE_RENDER → SCENE_RENDER`.
Every stage a change pulls the pipeline back to runs everything downstream of it.

## Regressions this repo has actually shipped

The five recurring shapes, each with a real commit — check for these before anything else:

1. **Full rescan where an incremental path existed.** `26d7f84244` (epoch-column rescan
   on incremental updates), `f459a39824`, `1126e7a21c`. Look for code that ignores
   `processedData.changeDescription` or re-derives a column cache from scratch.
2. **Un-gated per-datum work.** `7695550125` (type-tracker called for every datum in a
   column whose type was already settled), `3842ae946c` (tick-skipping now gated on
   whether the axis can be picked). Look for a call inside a loop whose result the
   caller may not need.
3. **Too coarse an update type.** `3c4bbf73c8` (`FULL` → `PERFORM_LAYOUT` for selection
   state), `0fe6d15b8f` (redundant `commitPendingTransactions` in `performUpdate`).
4. **Allocation reintroduced into a loop a previous commit made allocation-free.** The
   `// scratch object`, `// avoid allocations`, `// allocation-free` comments are
   tripwires — the detector's marker proximity exists for exactly this.
5. **Scale and tick generation cost.** `2e6274835e` (`UnitTimeScale` tick generation
   regression, caught only in release testing). `unitTimeScale.ts` has nine perf touches.

## How to write the finding

State the frequency, then the cost, then the evidence. A hot-path finding that says
"this may be slow" is worth less than no finding, because it spends the author's
attention without directing it.

> **P1 — Per-datum allocation in `barSeries.createNodeData()`**
> `barSeries.ts:412` allocates a `{ x, y }` literal inside the datum loop, which runs
> once per datum (1e6 on `high-perf-bar`). The surrounding code uses a pre-allocated
> scratch object for exactly this reason (`barSeries.ts:237`). Mutate the scratch
> object instead. Evidence: `/benchmarks high-perf-bar high-perf-bar-stacked` —
> Initial Load is the affected measure.

Severity: **P1** for a new per-datum or per-frame cost, or an incremental path degraded
to a full one. **P2** for a tier-3 cost, a widened update type, or a
missing-but-available fast path. **P3** for tier-4 bundle growth inside budget.

## Evidence, and what it is worth

Get the benchmark set from the map rather than guessing — it is derived from the
examples on every run, so it cannot go stale:

```bash
node tools/hot-paths/benchmark-map.js --for <changed,paths>   # → recommended examples + /benchmarks command
node tools/hot-paths/benchmark-map.js --list                  # every example, with its series/axis types and test cases
```

It recommends only examples that actually run the changed series, and returns a
note instead of a command when none does — most non-cartesian series have no
benchmark example. A clean run on a benchmark that never executed the change is
worse than no evidence, so profile locally in that case rather than substituting
the nearest example.

- **`/benchmarks <example...>`** as a PR comment runs the browser suite. It compares the
  PR head against the **merge-base**, not the base-branch tip, so it measures the PR's
  own diff. `compare-browser-results.js` only calls a change a regression once it clears
  `--min-pct`, `--min-abs-ms` **and** `NOISE_BAND_FACTOR ×` the measured cross-run CV —
  so do not read a sub-noise-band percentage as a result in either direction.
- **`.size-limit.js`** in each package holds the src and dist budgets. This is the
  instrument for tier 4; benchmarks say nothing about it.
- **`chartHeapMemory.test.ts`** is the existing memory guard, retried 5× because heap
  comparisons are flaky.
- **`/ag-charts:benchmark-profile`** captures a local before/after profile;
  **`/ag-eng:profile-analyse`** reads it without opening DevTools. Use these when the
  benchmark moves but the cause is not obvious from the diff.

## What not to flag

- Cost outside tiers 1–3 — a slow path that runs once per chart creation is not a
  finding, and calling it one trains authors to ignore the pass.
- Micro-optimisations with no measurement behind them (`for` over `.map` in code that
  runs twice, `+=` over template strings outside a loop).
- Allocation in code guarded by a flag that is off in the measured configuration —
  check the guard before raising it.
- A benchmark delta inside the noise band. Say "no measurable change" rather than
  reporting the number.
- The absence of a benchmark run, on a PR the detector scores at the bottom of the
  range. Recommend the run; do not gate on it.
