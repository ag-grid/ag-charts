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
-   `constant` means the property holds across the CAPTURED FRAMES — it does NOT mean `before`
    equals `after`. A change that lands as a first-frame structural snap (a category reorder/reverse
    reshapes the whole stroke by frame 0) reads `constant` even though its start and end scenes
    differ, and the pin is non-vacuous: a regression that tweened the change instead of snapping
    would break it. Never read `constant` as "nothing changed".
-   A constant trajectory vacuously satisfies `increases`/`decreases`/`monotonic`/`bounded`/
    `settlesAt`. A fade spec is only non-vacuous alongside a frame-0 collapsed guard (assert the
    node starts at opacity ~0) or an explicit start-value assertion.
-   `bounded` bounds intermediate values by the trajectory's OWN endpoints — it cannot distinguish
    a snap from a tween. `progresses` forces real intermediate motion but proves ONLY that: it
    asserts no direction, no bounds, and not that a value overshoots or dips outside the endpoint
    range. Use it for an edge or station that legitimately leaves the endpoint interval (overshoots,
    or dips and recovers) where `bounded` would wrongly reject. Never let a helper name or comment
    imply `progresses` verifies the overshoot — describe the observed motion separately from what
    the expectation enforces.
-   `degenerate` is for a value that legitimately goes non-finite for part of the trajectory — a
    per-station crossing that vanishes as a point enters or leaves at that edge. Pin those stations
    `degenerate`, not `any`, so the non-finite window is expected rather than silently swallowed.
-   A degenerate x-extent (vertical step connectors, organization layouts) makes the sampler emit
    non-finite `top@<i>` stations, so `expectNoAnimation` fails and reads as a false "it animates".
    For a series that snaps under degenerate geometry, pin constancy with
    `expectSceneSamplesMatch(frame, trajectory[0])` and mark the collapsed or polar `top@N` stations
    `degenerate`.
-   Probe output cannot be trusted to reveal non-finite values: `JSON.stringify` prints `NaN` as
    `null`, and a property-level `'any'` does not bypass the non-finite guard. Test
    `Number.isFinite` in the probe rather than eyeballing the dump.
-   `rotation` is not in `EXACT_MATCH_PROPS`, so at the default `monotonicTol` (0.5) a real ~0.4 rad
    per-frame step satisfies BOTH `increases` and `decreases`. Pass a tighter `monotonicTol` (~0.05)
    for radian and angle properties, then negative-test by flipping the direction.
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

A property that snaps this way is pinned `constant` — it sits at its settled value from the first
captured frame — not `any`. See the `constant`-across-frames note in the vocabulary above.

## Probe before pinning

Never guess what a series animates. Add a temporary probe test that dumps the sampled trajectory
(`process.stdout.write`) for the scenario, read the actual per-frame values and phases, then write
the spec from evidence and delete the probe.

To tell a snap from a tween, dump `before`, `trajectory[0]`, and `after` for the node. If
`trajectory[0]` already equals `after` while both differ from `before`, the change snapped on the
first frame — pin `constant`. If the samples interpolate between the endpoints, pin a direction or
`progresses`.

Sample the WHOLE scene, not just the mark nodes — labels, containers and stacked inner edges animate
too, and filtering the probe to the marks hides them until the CASE fails.

`createSceneGeometrySampler` keys shape nodes FLAT as `series[i]/<label>[id]` regardless of the
enclosing sub-group; only groups nest. Do not predict a nested key such as
`series[0]/group[itemNeedleGroup]/path[]` — read the key off the probe.

## Related contracts

The mock-canvas single-chart rule and shared-fixture placement discipline live in the
`test-harness-contracts` rule; both apply to trajectory suites (the pixel endpoint guard depends on
the FIRST-canvas contract).
