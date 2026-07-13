---
root: false
targets: ['*']
description: 'Frame-trajectory harness usage and pitfalls for AG Charts animation tests'
globs: ['**/series/**/*.test.ts', '**/axis/**/*.test.ts', '**/chart/test/utils.ts']
---

# Animation Trajectory Tests

Animation behaviour is tested with the frame-trajectory harness in
`packages/ag-charts-community/src/chart/test/utils.ts`, NOT with per-ratio image snapshots. The
legacy `spyOnAnimationManager()` + `toMatchImageSnapshot` pattern (one frozen PNG per ratio) is
reserved for genuinely pixel-only behaviour: compositing (destination-out gaps, pattern/gradient
fills) and painted clipping. Everything else — motion direction, phase timing, bounds, entry/exit
fades, per-frame invariants — is asserted structurally over the whole animation.

To migrate a series' animation tests wholesale, use the `animation-test-migration` skill; this rule
covers day-to-day usage.

## Core APIs

-   `const frames = spyOnAnimationFrames()` — declare at `describe` scope (it registers
    `beforeEach`/`afterEach`). Returns `{ runToEnd, captureAnimationFrames, captureUpdate }`.
    Animations progress incrementally frame-by-frame, exactly as a browser would render.
-   `createSceneGeometrySampler(chart)` — samples the whole scene per frame into a
    `SceneGeometrySample` (a `Map` keyed like `series[0]/rect[Q1]`, `series[0]/path[stroke]`,
    `axis[bottom]/text[l:w3]`).
-   `frames.captureUpdate(chart, sampler, action)` — the standard flow: settle, sample `before`,
    run `action`, capture the trajectory, settle, sample `after`, and assert the trajectory's
    endpoints equal the before/after scenes.
-   `expectSceneTrajectory(trajectory, spec, { frameInvariants })` — per-node, per-property
    expectations plus per-frame cross-node invariants.
-   `expectAnimatedEndpointsMatchStatic(frames, snapshot, chart, before, after)` — pixel-level
    endpoint guard: the animated route must settle at exactly what a non-animated (snapped) render
    of the same options produces. A few call sites per suite, not per-CASE.

## Expectation vocabulary — vacuity traps

-   Unnamed nodes and properties default to `constant`. `constant` is the STRICTEST expectation;
    `'any'` disables checking (but still fails on non-finite values).
-   A constant trajectory vacuously satisfies `increases`/`decreases`/`monotonic`/`bounded`/
    `settlesAt`. A fade spec is only non-vacuous alongside a frame-0 collapsed guard (assert the
    node starts at opacity ~0) or an explicit start-value assertion.
-   `bounded` bounds intermediate values by the trajectory's OWN endpoints — it cannot distinguish
    a snap from a tween. Use `progresses` to force real intermediate motion.
-   `during: '<phase>'` windows (`remove`/`update`/`add`/`trailing`/`initial`) also enforce
    constancy OUTSIDE the window — they are the detector for desynchronised-phase regressions.
-   **Negative-test every new spec**: flip a direction or phase, confirm the CASE fails loudly,
    revert. A spec that cannot fail is decoration.

## Structural snap pitfall

Series toggles and some data updates snap structurally at frame 0 (marker sets swap, label groups
flip `visible`, re-entering rects arrive from a null-x placeholder), which trips `captureUpdate`'s
whole-scene start anchor. Hand-roll the capture in those CASEs (settle → sample → act →
`captureAnimationFrames` → `runToEnd` → assert only the end anchor) — see `captureFrom` in
`lineSeries.test.ts` and `captureToggle` in `barSeries.test.ts`.

## Probe before pinning

Never guess what a series animates. Add a temporary probe test that dumps the sampled trajectory
(`process.stdout.write`) for the scenario, read the actual per-frame values and phases, then write
the spec from evidence and delete the probe.

## Related contracts

The mock-canvas single-chart rule and shared-fixture placement discipline live in the
`test-harness-contracts` rule; both apply to trajectory suites (the pixel endpoint guard depends on
the FIRST-canvas contract).
