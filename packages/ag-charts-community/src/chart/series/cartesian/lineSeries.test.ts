import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deepClone } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesStylerParams,
    AgLineSeriesStylerResult,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    NEG_BIG,
    STRIPPED_NUMBER_AXES,
    STRIPPED_TIME_AXES,
    expectPixelIdenticalAcrossMagnitude,
    isoEpochPair,
    magnitudePair,
    scaleToBigIntFinite,
} from '../../test/bigintExamples';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import { type MockLineStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type { CartesianOrPolarTestCase } from '../../test/utils';
import {
    type PhasedPropertyExpectation,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    type SceneNodeExpectation,
    type ScenePropertyExpectation,
    type TrajectoryExpectation,
    axisReflowSpec,
    cartesianChartAssertions,
    compareImageSnapshot,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectNoAnimation,
    expectSceneTrajectory,
    getVisibleLabelNodes,
    hoverAction,
    mixinReversedAxesCases,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'line'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['line'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.LINE_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'unit-time' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_MISSING_Y_DATA_EXAMPLE: {
            options: examples.LINE_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: ['line'],
            }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [LineSeries-1 / xValue] ignored:', '[undefined]'],
            ],
            skipWarningsReversed: false,
        },
        LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: ['line'],
            }),
            warnings: [
                ['AG Charts - invalid value of type [object] for [LineSeries-1 / xKey] ignored:', '[null]'],
                ['AG Charts - invalid value of type [object] for [LineSeries-1 / xValue] ignored:', '[null]'],
            ],
            skipWarningsReversed: false,
        },
        LINE_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.LINE_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('line', 2),
            }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS: {
            options: examples.LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS: {
            options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        LINE_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        LINE_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        LINE_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        LINE_STACKED_DATA_PER_SERIES: {
            options: examples.LINE_STACKED_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: ['line', 'line'],
            }),
        },
        LINE_NORMALISED_SINGLE_LINE: {
            options: {
                ...examples.NORMALISED_STACKED_AREA,
                series: [
                    {
                        ...(examples.NORMALISED_STACKED_AREA.series?.[0] as AgLineSeriesOptions),
                        type: 'line',
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('line', 1),
            }),
        },
        UNSTACKED_LINE_NORMALISED_SINGLE_LINE: {
            options: {
                ...examples.NORMALISED_STACKED_AREA,
                series: [
                    {
                        ...(examples.NORMALISED_STACKED_AREA.series?.[0] as AgLineSeriesOptions),
                        type: 'line',
                        normalizedTo: 100,
                        stacked: false,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('line', 1),
            }),
        },
    }),
    LINE_NULL_CATEGORY_KEY: {
        options: examples.LINE_NULL_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
        warnings: [
            ['AG Charts - invalid value of type [object] for [LineSeries-1 / xKey] ignored:', '[null]'],
            ['AG Charts - invalid value of type [object] for [LineSeries-1 / xValue] ignored:', '[null]'],
        ],
    },
    LINE_NULL_CATEGORY_KEY_ALLOWED: {
        options: examples.LINE_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
    },
    LINE_UNDEFINED_CATEGORY_KEY: {
        options: examples.LINE_UNDEFINED_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
        warnings: [
            ['AG Charts - invalid value of type [undefined] for [LineSeries-1 / xKey] ignored:', '[undefined]'],
            ['AG Charts - invalid value of type [undefined] for [LineSeries-1 / xValue] ignored:', '[undefined]'],
        ],
    },
    LINE_UNDEFINED_CATEGORY_KEY_ALLOWED: {
        options: examples.LINE_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
    },
    LINE_NULL_AND_UNDEFINED_KEYS: {
        options: examples.LINE_NULL_AND_UNDEFINED_KEYS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
    },
};

describe('LineSeries', () => {
    setupMockConsole();
    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    // Frame-trajectory invariants for a path series: the sampler reads back the drawn geometry each frame —
    // bbox extent, `top@<i>` (topmost y at fixed x-stations) and `subpaths` (a stroke gap adds subpaths).
    describe('animation frame-trajectory (spike)', () => {
        const frames = spyOnAnimationFrames();

        it('CASE 3: line data-update morphs the path per-station monotonically', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { x: 0, y: 90 },
                    { x: 1, y: 50 }, // B is the domain floor, so dropping it grows the extent downward
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
            });

            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            const before = sampleScene();
            const pathKeys = [...before.keys()].filter((k) => k.startsWith('series[0]/path'));
            expect(pathKeys).toHaveLength(1); // one stroke path
            const pathKey = pathKeys[0];

            await chart.updateDelta({
                data: [
                    { x: 0, y: 90 },
                    { x: 1, y: 10 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();

            // The update grows the unpinned y-domain, so wider tick labels widen the y-axis gutter and shift both
            // axes' sub-groups, while the y-axis swaps its tick set and slides the survivors.
            expectSceneTrajectory(trajectory, {
                [pathKey]: {
                    x: { during: 'update', expect: 'decreases' },
                    y: { during: 'update', expect: 'increases' },
                    width: { during: 'update', expect: 'decreases' },
                    height: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                    // Per-station: A's end rides the rescale down while B's end rises toward the new
                    // floor; the midpoint pivots in place. `subpaths` is unnamed so it must stay 1.
                    'top@0': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                    'top@1': { during: 'update', expect: ['increases', 'bounded'] },
                    'top@3': { during: 'update', expect: ['decreases', 'bounded'] },
                    'top@4': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                },
                // The marker fade-in starts in the add phase and completes during trailing.
                'series[0]/marker[*]': { opacity: { during: ['add', 'trailing'], expect: 'increases' } },
                ...axisReflowSpec('bottom', { shift: 'left', translate: 'right' }),
                ...axisReflowSpec('left', { shift: 'up', translate: 'right', plotEdge: 'shrinks', grid: true }),
            });

            // Endpoints: the captured trajectory starts at the settled before-state and reaches the
            // settled after-state (per-frame direction/progression/bounds are in the spec above).
            expect(trajectory[0].get(pathKey)!.height).toBeCloseTo(before.get(pathKey)!.height, 0);
            expect(trajectory.at(-1)!.get(pathKey)!.height).toBeCloseTo(after.get(pathKey)!.height, 0);
        });
    });

    // One CASE per control on the line-series-test page, in standalone and integrated modes.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        // Both domains are pinned, so every mutation below is provably non-scale-affecting and the path and
        // markers animate in isolation within a fixed pixel mapping.
        const lineOptions = (
            data: Array<{ x: number; y: number | undefined }>,
            mode?: 'integrated'
        ): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 10 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            if (mode != null) {
                (options as AgChartOptions & { mode: string }).mode = mode;
            }
            return prepareTestOptions(options);
        };

        // The sampler suffixes re-created paths (path[stroke#2]); match the single stroke path by prefix.
        const pathKey = (sample: SceneGeometrySample): string => {
            const keys = [...sample.keys()].filter((k) => k.startsWith('series[0]/path'));
            expect(keys, 'series[0]/path').toHaveLength(1);
            return keys[0];
        };

        const markerCount = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/marker\[/.test(k)).length;

        // A marker's settled screen x (its position may live in the local coord or the translation).
        const markerX = (sample: SceneGeometrySample, label: string) => {
            const m = sample.get(`series[0]/marker[${label}]`);
            return m ? m.x + (m.translationX ?? 0) : undefined;
        };

        // Line markers snap to their new target instead of position-tweening, so captureUpdate's whole-scene
        // endpoint check trips on that frame-0 snap; these CASEs hand-roll the capture and pin only what tweens.
        const captureFrom = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // Anti-vacuous guard: a node must be present but visually collapsed on the first captured frame. A
        // missing node yields Infinity so the guard fails loudly rather than passing on an absent node.
        const expectNodeStartsCollapsed = (
            trajectory: SceneGeometrySample[],
            key: string,
            prop: 'opacity' | 'width' = 'opacity'
        ) => {
            const value = trajectory[0].get(key)?.[prop] ?? Infinity;
            expect(value, `${key} ${prop} at frame 0`).toBeLessThanOrEqual(0.001);
        };
        const expectMarkerStartsCollapsed = (
            trajectory: SceneGeometrySample[],
            label: string,
            prop: 'opacity' | 'width' = 'opacity'
        ) => expectNodeStartsCollapsed(trajectory, `series[0]/marker[${label}]`, prop);

        // On a number-axis value update every present marker snaps to opacity 0 and fades back to 1. Only
        // anti-vacuous alongside a frame-0 `expectMarkerStartsCollapsed` guard.
        const fadeIn: PhasedPropertyExpectation = {
            during: ['add', 'trailing'],
            expect: ['increases', 'bounded'],
            settlesAt: 1,
        };
        // Markers legitimately re-map their local x/y when data lands, so that is left free; a tweened
        // translation, though, means markers flying across the screen, so pin it constant.
        const markerPosition: Record<string, ScenePropertyExpectation> = {
            x: 'any',
            y: 'any',
            translationX: 'constant',
            translationY: 'constant',
        };

        // Every value jitters within the pinned domain: the path morphs per-station and the markers re-fade at
        // their new heights, while the x-extent, both axes and subpath continuity hold.
        it('update points: path morphs per-station while the x-extent and axes hold', async () => {
            const { before, trajectory } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 90 },
                            { x: 1, y: 50 },
                            { x: 2, y: 140 },
                            { x: 3, y: 70 },
                            { x: 4, y: 110 },
                        ],
                    })
            );
            const key = pathKey(before);
            expectSceneTrajectory(trajectory, {
                [key]: {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    // The bbox envelope is not endpoint-bounded mid-morph — stations peak at different times, so the
                    // aggregate swings past its endpoints; the per-station tops carry the real per-point invariant.
                    y: 'any',
                    height: 'any',
                    'top@0': { during: 'update', expect: ['monotonic', 'progresses', 'bounded'] },
                    'top@1': { during: 'update', expect: ['monotonic', 'bounded'] },
                    'top@2': { during: 'update', expect: ['monotonic', 'progresses', 'bounded'] },
                    'top@3': { during: 'update', expect: ['monotonic', 'bounded'] },
                    'top@4': { during: 'update', expect: ['monotonic', 'bounded'] },
                },
                // Markers are re-created at their new local position and only opacity re-fades — they do not
                // position-tween, so translation holds at 0. The path stations above carry the value motion.
                'series[0]/marker[*]': {
                    translationX: 'constant',
                    translationY: 'constant',
                    opacity: fadeIn,
                },
            });
            // Marker 2 survives the update yet still re-fades from invisible: the guard that makes the
            // opacity spec above non-vacuous (without it a marker held at opacity 1 would also pass).
            expectMarkerStartsCollapsed(trajectory, '2');
        });

        // Departed markers leave the scene immediately, so enter/exit is asserted via markerCount plus the
        // shared fade-in glob; through a structural reshape only the extent and continuity are pinned.
        const markersFadeIn: Record<string, SceneNodeExpectation> = {
            'series[0]/marker[*]': { opacity: fadeIn },
        };
        // When survivors also move while fading in, pin the fade and leave local position free;
        // markerPosition still pins translation.
        const markersReflow: Record<string, SceneNodeExpectation> = {
            'series[0]/marker[*]': { opacity: fadeIn, ...markerPosition },
        };
        // On an initial-load reveal the markers additionally scale in from zero size (the swipe scale-in
        // the easeOut-very-slow debug flag suppresses), staggered across the reveal, so width/height grow.
        const markersScaleIn: Record<string, SceneNodeExpectation> = {
            'series[0]/marker[*]': {
                opacity: fadeIn,
                width: ['increases', 'bounded'],
                height: ['increases', 'bounded'],
                ...markerPosition,
            },
        };
        // `increasingExtent`/`decreasingExtent` bound a monotonic edge to its endpoints and force a real
        // tween; `squeezing` is for an edge that overshoots or dips, so it can only be proven to move.
        const increasingExtent: readonly TrajectoryExpectation[] = ['increases', 'progresses', 'bounded'];
        const decreasingExtent: readonly TrajectoryExpectation[] = ['decreases', 'progresses', 'bounded'];
        const squeezing: readonly TrajectoryExpectation[] = ['progresses'];
        const extentMorph = (
            x: ScenePropertyExpectation,
            width: ScenePropertyExpectation,
            subpaths: ScenePropertyExpectation,
            // Stations whose crossing legitimately vanishes mid-animation (a point entering/leaving at
            // that edge) sample non-finite for part of the trajectory, so they must be `degenerate`.
            degenerateTops: number[] = [],
            // Per-station overrides once the probed trajectory supports a stronger expectation than `any`.
            tops: Record<string, ScenePropertyExpectation> = {}
        ): SceneNodeExpectation => {
            const stationTops: Record<string, ScenePropertyExpectation> = {};
            for (let i = 0; i <= 4; i++) stationTops[`top@${i}`] = degenerateTops.includes(i) ? 'degenerate' : 'any';
            return { x, width, subpaths, y: 'any', height: 'any', ...stationTops, ...tops };
        };

        // "Add points after" — new points extend the path rightward within the pinned x-domain: the left
        // edge (x=0) is anchored so bbox x holds while width grows, and the two new markers fade in.
        it('add points: path extends and new markers fade in', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 1, y: 120 },
                            { x: 2, y: 80 },
                            { x: 3, y: 160 },
                            { x: 4, y: 60 },
                            { x: 5, y: 130 },
                            { x: 6, y: 90 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(7);
            const key = pathKey(before);
            // Retained points sit at fixed stations and morph monotonically, except the one nearest the
            // growing right edge, which overshoots its settled crossing before easing back.
            const addAfterTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': squeezing,
                'top@4': decreasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(
                    { during: 'update', expect: 'constant' },
                    { during: ['update', 'add', 'trailing'], expect: ['increases', 'bounded'] },
                    { during: 'update', expect: 'constant' },
                    [],
                    addAfterTops
                ),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '5');
        });

        // "Add points before" — prepend points; the path's left edge steps OUT (bbox x decreases) and the
        // width grows, mirroring add-after. The new leading markers fade in.
        it('add points before: the left edge steps out and the width grows', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 3, y: 40 },
                    { x: 4, y: 120 },
                    { x: 5, y: 80 },
                    { x: 6, y: 160 },
                    { x: 7, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 1, y: 90 },
                            { x: 2, y: 70 },
                            { x: 3, y: 40 },
                            { x: 4, y: 120 },
                            { x: 5, y: 80 },
                            { x: 6, y: 160 },
                            { x: 7, y: 60 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(7);
            const key = pathKey(before);
            // Prepended points widen the path from the left: the station by the anchored right edge legitimately
            // vanishes, and the one by the growing left edge overshoots, so it can only be proven to progress.
            const addBeforeTops = {
                'top@0': decreasingExtent,
                'top@1': squeezing,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(decreasingExtent, increasingExtent, 'constant', [4], addBeforeTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // Interior insertion leaves the extent unchanged, so the width HOLDS while the interior densifies and
        // the new interior markers fade in.
        it('add points middle: the extent holds while the interior densifies', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 2, y: 120 },
                    { x: 4, y: 80 },
                    { x: 6, y: 160 },
                    { x: 8, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 1, y: 90 },
                            { x: 2, y: 120 },
                            { x: 4, y: 80 },
                            { x: 5, y: 110 },
                            { x: 6, y: 160 },
                            { x: 8, y: 60 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(7);
            const key = pathKey(before);
            expect(after.get(key)!.x).toBeCloseTo(before.get(key)!.x, 0);
            expect(after.get(key)!.width).toBeCloseTo(before.get(key)!.width, 0);
            // Retained points land exactly on the five fixed-fraction stations and interpolated points fall strictly
            // between them, so every station holds constant even as the path densifies.
            const addMiddleTops = {
                'top@0': 'constant' as const,
                'top@1': 'constant' as const,
                'top@2': 'constant' as const,
                'top@3': 'constant' as const,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(
                    { during: 'update', expect: 'constant' },
                    { during: 'update', expect: 'constant' },
                    { during: 'update', expect: 'constant' },
                    [],
                    addMiddleTops
                ),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // "Remove points middle" — interior points leave; the endpoints (x-extent) are unchanged so the
        // path keeps its width and single subpath, and the removed markers drop from the scene.
        it('remove points: interior markers leave while the stroke stays connected', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 100 },
                    { x: 5, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 1, y: 120 },
                            { x: 4, y: 100 },
                            { x: 5, y: 60 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(6);
            expect(markerCount(after)).toBe(4);
            const key = pathKey(before);
            // Both endpoints are pinned, so the outermost stations hold and the interior ones morph
            // monotonically to the closed gap's re-sampling.
            const removeMiddleTops = {
                'top@0': 'constant' as const,
                'top@1': decreasingExtent,
                'top@2': increasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(
                    { during: 'update', expect: 'constant' },
                    { during: 'update', expect: 'constant' },
                    { during: 'update', expect: 'constant' },
                    [],
                    removeMiddleTops
                ),
                ...markersFadeIn,
            });
        });

        // "Remove the first point" — the leftmost point leaves, so the path's left edge steps IN: bbox x
        // increases while width shrinks (unlike remove-middle, which holds the extent).
        it('remove first point: the left edge steps in and the width shrinks', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 1, y: 40 },
                    { x: 2, y: 120 },
                    { x: 3, y: 80 },
                    { x: 4, y: 160 },
                    { x: 5, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 2, y: 120 },
                            { x: 3, y: 80 },
                            { x: 4, y: 160 },
                            { x: 5, y: 60 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(4);
            const key = pathKey(before);
            // The retained points keep their pixel positions, so every interior station morphs cleanly to
            // where the shrunk path now crosses it.
            const removeFirstTops = {
                'top@0': decreasingExtent,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(increasingExtent, decreasingExtent, 'constant', [], removeFirstTops),
                ...markersFadeIn,
            });
            // Marker 2 survives the removal yet re-fades from invisible (removal snaps all present markers to
            // opacity 0 and fades them back, as value updates do), making the fade glob non-vacuous.
            expectMarkerStartsCollapsed(trajectory, '2');
        });

        // "Remove the last point" — the rightmost point leaves, so the path's right edge steps in: bbox x
        // holds (left edge anchored) while width shrinks.
        it('remove last point: the right edge steps in and the width shrinks', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 1, y: 40 },
                    { x: 2, y: 120 },
                    { x: 3, y: 80 },
                    { x: 4, y: 160 },
                    { x: 5, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 1, y: 40 },
                            { x: 2, y: 120 },
                            { x: 3, y: 80 },
                            { x: 4, y: 160 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(4);
            const key = pathKey(before);
            // The retained points keep their pixel positions, so every interior station morphs cleanly to
            // where the shrunk path now crosses it.
            const removeLastTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
                'top@4': decreasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph('constant', decreasingExtent, 'constant', [], removeLastTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // An interior value becoming undefined opens a gap: the stroke splits in two and the gap's marker leaves.
        // The straddling stations go non-finite and subpaths spikes mid-morph, so both are pinned at endpoints.
        it('update to undefined: the stroke splits at the gap and the gap marker leaves', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 1, y: 120 },
                            { x: 2, y: undefined },
                            { x: 3, y: 160 },
                            { x: 4, y: 60 },
                        ],
                    })
            );
            expect(markerCount(after)).toBeLessThan(markerCount(before));
            const key = pathKey(before);
            expect(before.get(key)!.subpaths).toBe(1);
            expect(after.get(key)!.subpaths).toBe(2);
            expectSceneTrajectory(trajectory, {
                [key]: {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    y: 'any',
                    height: 'any',
                    subpaths: 'any',
                    // Stations 2 and 3 straddle the opened gap (x=2), so they lose their crossing and go
                    // non-finite; the flanking stations sit on unchanged pinned-extent points and hold.
                    'top@0': 'constant',
                    'top@1': 'constant',
                    'top@2': 'degenerate',
                    'top@3': 'degenerate',
                    'top@4': 'constant',
                },
                ...markersFadeIn,
            });
        });

        // One update drops points, adds points and changes surviving values at once: removed markers leave, new
        // ones enter, and the survivors re-map to their new heights in a single batch.
        it('combined add/remove/update: markers leave, enter, and re-map in one update', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 1, y: 100 },
                            { x: 2, y: 60 },
                            { x: 3, y: 150 },
                            { x: 5, y: 90 },
                            { x: 6, y: 120 },
                        ],
                    })
            );
            expect([...before.keys()]).toContain('series[0]/marker[0]');
            expect([...after.keys()]).not.toContain('series[0]/marker[0]');
            expect([...after.keys()]).not.toContain('series[0]/marker[4]');
            expect([...after.keys()]).toContain('series[0]/marker[5]');
            const key = pathKey(before);
            // Remove and add run back-to-back, so width and the interior stations dip through the mid-batch shape
            // before overshooting to the settle; only `squeezing` holds, and subpaths briefly forks before rejoining.
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(increasingExtent, squeezing, squeezing, [3, 4], {
                    'top@0': squeezing,
                    'top@1': squeezing,
                    'top@2': squeezing,
                }),
                ...markersReflow,
            });
            expectMarkerStartsCollapsed(trajectory, '5');
        });

        // Drop the first point, append one at the end: the left edge steps in monotonically while width dips and
        // recovers, interior stations morph monotonically, and the rightmost loses its crossing.
        it('shift left: left edge steps in as the first point leaves and one enters at the end', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 1, y: 40 },
                    { x: 2, y: 120 },
                    { x: 3, y: 80 },
                    { x: 4, y: 160 },
                    { x: 5, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 2, y: 120 },
                            { x: 3, y: 80 },
                            { x: 4, y: 160 },
                            { x: 5, y: 60 },
                            { x: 6, y: 90 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(5);
            const key = pathKey(before);
            const shiftLeftTops = {
                'top@0': decreasingExtent,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(increasingExtent, squeezing, 'constant', [4], shiftLeftTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '6');
        });

        // Mirror of shift left: the left edge steps out monotonically while width dips and recovers, interior
        // stations morph monotonically, and the rightmost station loses its crossing.
        it('shift right: left edge steps out as a new first point enters and the last leaves', async () => {
            const { before, trajectory, after } = await captureFrom(
                lineOptions([
                    { x: 2, y: 40 },
                    { x: 3, y: 120 },
                    { x: 4, y: 80 },
                    { x: 5, y: 160 },
                    { x: 6, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 1, y: 90 },
                            { x: 2, y: 40 },
                            { x: 3, y: 120 },
                            { x: 4, y: 80 },
                            { x: 5, y: 160 },
                        ],
                    })
            );
            expect(markerCount(after)).toBe(5);
            const key = pathKey(before);
            const shiftRightTops = {
                'top@0': decreasingExtent,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(decreasingExtent, squeezing, 'constant', [4], shiftRightTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        const twoSeriesOptions = (seriesCount: 1 | 2): AgCartesianChartOptions => {
            const series: NonNullable<AgCartesianChartOptions['series']> = [
                { type: 'line', xKey: 'x', yKey: 'a', marker: { enabled: true } },
                { type: 'line', xKey: 'x', yKey: 'b', marker: { enabled: true } },
            ];
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, a: 40, b: 100 },
                    { x: 1, a: 120, b: 60 },
                    { x: 2, a: 80, b: 140 },
                    { x: 3, a: 160, b: 90 },
                    { x: 4, a: 60, b: 120 },
                ],
                series: series.slice(0, seriesCount),
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 10 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            return prepareTestOptions(options);
        };

        // A newly added line arrives fully-formed — final geometry and full opacity from frame 0, nothing tweens
        // (bar fades its entering series in instead). Pinned so a change either way is caught.
        it('add series: the entering series appears fully-formed without animation', async () => {
            const options = twoSeriesOptions(1);
            const { before, trajectory, after } = await captureFrom(options, () =>
                chart.update({ ...options, series: twoSeriesOptions(2).series })
            );
            expect([...before.keys()].filter((k) => k.startsWith('series[1]/path'))).toHaveLength(0);
            const enteringPath = [...after.keys()].filter((k) => k.startsWith('series[1]/path'));
            expect(enteringPath).toHaveLength(1);
            // Present and already at full opacity on the first frame (a snap, not a fade)...
            expect(trajectory[0].get(enteringPath[0])?.opacity).toBe(1);
            expect(trajectory[0].get('series[1]/marker[0]')?.opacity).toBe(1);
            // ...and nothing animates across the capture.
            expectNoAnimation(trajectory);
        });

        // "Remove Series" — the second line leaves the scene (its nodes drop immediately, like a removed
        // bar series), so only the survivor's continued presence is observable.
        it('remove series: the removed series drops from the scene', async () => {
            const { before, trajectory, after } = await captureFrom(twoSeriesOptions(2), () =>
                chart.update(twoSeriesOptions(1))
            );
            expect([...before.keys()].filter((k) => k.startsWith('series[1]/path'))).toHaveLength(1);
            expect([...after.keys()].filter((k) => k.startsWith('series[1]/path'))).toHaveLength(0);
            // The removed series drops immediately with no fade-out, so the honest invariant is that the surviving
            // series[0] holds every property constant; series[1] is already gone by the first captured frame.
            expect(trajectory.some((f) => [...f.keys()].some((k) => k.startsWith('series[1]')))).toBe(false);
            expectSceneTrajectory(trajectory, {});
        });

        // A series legend-hidden both before and after an update must stay visually inert even when its
        // own data changes: while a visible sibling animates, it contributes no motion of any kind.
        it('hidden series: a legend-hidden line stays inert while a sibling animates', async () => {
            const base = twoSeriesOptions(2);
            const hidden: AgCartesianChartOptions = {
                ...base,
                series: base.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
            };
            chart = AgCharts.create(hidden);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            const before = sampleScene();
            // Every value changes; series[1] is hidden throughout, so only visible series[0] may animate.
            await chart.updateDelta({
                data: [
                    { x: 0, a: 90, b: 150 },
                    { x: 1, a: 50, b: 30 },
                    { x: 2, a: 140, b: 175 },
                    { x: 3, a: 70, b: 45 },
                    { x: 4, a: 110, b: 160 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expect([...before.keys()].filter((k) => k.startsWith('series[1]')).length).toBeGreaterThan(0);
            // The update triggered real motion: the visible series[0] re-fades its markers from invisible.
            // Without this the hidden-series assertion below could pass on an update that did nothing at all.
            expectMarkerStartsCollapsed(trajectory, '0');
            // The hidden series[1], by contrast, holds every tracked property constant across that same
            // capture — filtered to its nodes, nothing (visibility, opacity, geometry) moves.
            const hiddenOnly = (s: SceneGeometrySample) => new Map([...s].filter(([k]) => k.startsWith('series[1]')));
            expectNoAnimation(trajectory.map(hiddenOnly));
        });

        // The hidden line's stroke fades out in place then flips non-visible while its markers leave at once;
        // the sibling and both pinned axes hold still.
        it('legend hide: the toggled-off line fades its stroke out and drops its markers at once', async () => {
            const options = twoSeriesOptions(2);
            const { before, trajectory, after } = await captureFrom(options, () =>
                chart.update({
                    ...options,
                    series: options.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
                })
            );
            const key = [...before.keys()].find((k) => k.startsWith('series[1]/path'))!;
            expect([...before.keys()].filter((k) => k.startsWith('series[1]/marker'))).toHaveLength(5);
            expect([...trajectory[0].keys()].filter((k) => k.startsWith('series[1]/marker'))).toHaveLength(0);
            // Anti-vacuity: the stroke starts fully visible, so the fade below is a genuine departure.
            expect(trajectory[0].get(key)!.opacity).toBe(1);
            expectSceneTrajectory(trajectory, {
                [key]: {
                    opacity: { during: ['remove', 'update'], expect: ['decreases', 'bounded'], settlesAt: 0 },
                    visible: { during: ['remove', 'update'], expect: ['decreases', 'bounded'] },
                },
            });
            expect(after.get(key)!.visible).toBe(0);
        });

        // The line re-enters where it left: the stroke fades back in place and the markers re-fade behind it at
        // settled geometry, so nothing sweeps or flies in.
        it('legend show: the re-shown line fades back in place, markers never outrunning the stroke', async () => {
            const options = twoSeriesOptions(2);
            const hidden: AgCartesianChartOptions = {
                ...options,
                series: options.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
            };
            const { trajectory, after } = await captureFrom(hidden, () => chart.update(options));
            const key = [...trajectory[0].keys()].find((k) => k.startsWith('series[1]/path'))!;
            expectSceneTrajectory(trajectory, {
                [key]: {
                    opacity: { during: ['update', 'add'], expect: ['increases', 'bounded'], settlesAt: 1 },
                },
                'series[1]/marker[*]': { opacity: fadeIn, ...markerPosition },
            });
            // Anti-vacuity: both fades genuinely start from invisible.
            expectNodeStartsCollapsed(trajectory, key);
            expectNodeStartsCollapsed(trajectory, 'series[1]/marker[2]');
            // The stroke leads the re-entry: on every frame the markers are at most as opaque as it.
            for (let i = 0; i < trajectory.length; i++) {
                const strokeOpacity = trajectory[i].get(key)?.opacity ?? 0;
                const markerOpacity = trajectory[i].get('series[1]/marker[2]')?.opacity ?? 0;
                expect(markerOpacity, `frame ${i}`).toBeLessThanOrEqual(strokeOpacity + 0.001);
            }
            expect(after.get('series[1]/marker[2]')!.opacity).toBe(1);
        });

        const WEEKS: Array<{ x: string; y: number }> = [
            { x: 'w3', y: 60 },
            { x: 'w4', y: 185 },
            { x: 'w5', y: 148 },
            { x: 'w6', y: 130 },
            { x: 'w9', y: 62 },
            { x: 'w10', y: 137 },
            { x: 'w11', y: 121 },
        ];

        const categoryOptions = (
            data: Array<{ x: string; y: number }>,
            mode?: 'integrated'
        ): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            if (mode != null) {
                (options as AgChartOptions & { mode: string }).mode = mode;
            }
            return prepareTestOptions(options);
        };

        // "Add End Week" — a new category appends; every band narrows and shifts left to make room, the
        // path re-covers the reflowed bands, and the new marker fades in.
        it('category add end week: bands reflow left and the new marker fades in', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: [...WEEKS, { x: 'w12', y: 78 }] })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(8);
            const key = pathKey(before);
            // The narrower bands pull the left edge in (decreasingExtent) while the new band widens the extent past
            // its start (squeezing); stations 1, 2 and 4 ride the rescale monotonically, station 3 overshoots.
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(decreasingExtent, squeezing, 'constant', [], {
                    'top@0': 'constant',
                    'top@1': increasingExtent,
                    'top@2': increasingExtent,
                    'top@3': squeezing,
                    'top@4': increasingExtent,
                }),
                ...markersReflow,
                ...axisReflowSpec('bottom', { shift: 'left' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w12');
        });

        // "Add Start Week" — a new category prepends; bands reflow right and the new leading marker fades in.
        it('category add start week: bands reflow right and the leading marker fades in', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: [{ x: 'w2', y: 90 }, ...WEEKS] })
            );
            expect(markerCount(after)).toBe(8);
            const key = pathKey(before);
            // The prepended band pushes the extent right before the narrower bands pull it back past its start
            // (squeezing on x and width); the leading stations resample the reshaped left side, the trailing holds.
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(squeezing, squeezing, 'constant', [], {
                    'top@0': decreasingExtent,
                    'top@1': squeezing,
                    'top@2': decreasingExtent,
                    'top@3': increasingExtent,
                    'top@4': 'constant',
                }),
                ...markersReflow,
                ...axisReflowSpec('bottom', { shift: 'right' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w2');
        });

        // The whole band set swaps at once: the markers land instantly and fade in while the axis cross-fades
        // the outgoing and incoming label sets in place.
        it('category replace all: markers and axis labels cross-fade to the new set', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({
                    data: [
                        { x: 'Mon', y: 100 },
                        { x: 'Tue', y: 150 },
                        { x: 'Wed', y: 120 },
                    ],
                })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(3);
            // A single stroke path spans the swap — no re-creation, so it genuinely tweens: the extent expands while
            // shrinking as seven bands compress into three, and the interior stations overshoot before recovering.
            expectSceneTrajectory(trajectory, {
                'series[0]/path[*]': extentMorph(increasingExtent, decreasingExtent, 'constant', [], {
                    'top@0': decreasingExtent,
                    'top@1': squeezing,
                    'top@2': squeezing,
                    'top@3': squeezing,
                    'top@4': increasingExtent,
                }),
                ...markersReflow,
                'axis[bottom]/text[*]': {
                    opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
                    x: 'constant',
                },
                'axis[bottom]/line[*]': { opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' } },
            });
            expectMarkerStartsCollapsed(trajectory, 'Mon');
            // The outgoing label set leaves the scene once faded; the incoming set settles fully opaque.
            expect(after.has('axis[bottom]/text[l:w3]')).toBe(false);
            expect(after.get('axis[bottom]/text[l:Mon]')!.opacity).toBe(1);
        });

        // Middle insertion: two categories drop into the interior gap rather than at an edge, so the new bands
        // must land between their neighbours and everything to their right must slide right to make room.
        it('category add middle weeks: inserted bands land between neighbours and slide the rest right', async () => {
            const withMiddle = [
                { x: 'w3', y: 60 },
                { x: 'w4', y: 185 },
                { x: 'w5', y: 148 },
                { x: 'w6', y: 130 },
                { x: 'w7', y: 90 },
                { x: 'w8', y: 110 },
                { x: 'w9', y: 62 },
                { x: 'w10', y: 137 },
                { x: 'w11', y: 121 },
            ];
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: withMiddle })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(9);
            expect([...before.keys()]).not.toContain('series[0]/marker[w7]');
            expect([...after.keys()]).toContain('series[0]/marker[w7]');
            expect([...after.keys()]).toContain('series[0]/marker[w8]');
            // The narrower bands pull the extent in from the left while widening past it as the two new bands claim
            // their share; interior stations ride the rescale up cleanly and the flanking ones hold.
            expectSceneTrajectory(trajectory, {
                [pathKey(before)]: extentMorph(decreasingExtent, increasingExtent, 'constant', [], {
                    'top@0': 'constant',
                    'top@1': increasingExtent,
                    'top@2': increasingExtent,
                    'top@3': increasingExtent,
                    'top@4': 'constant',
                }),
                ...markersReflow,
                // Left of the gap the labels are unmoved; from the gap rightward every label slides — a bidirectional
                // spread axisReflowSpec cannot express, so the per-frame motion is left free.
                'axis[bottom]/text[*]': 'any',
                'axis[bottom]/line[*]': 'any',
            });

            // The inserted markers land in order between w6 and w9...
            expect(markerX(after, 'w6')).toBeLessThan(markerX(after, 'w7')!);
            expect(markerX(after, 'w7')).toBeLessThan(markerX(after, 'w8')!);
            expect(markerX(after, 'w8')).toBeLessThan(markerX(after, 'w9')!);
            // ...and the series point just past the insertion slides right to make room for them.
            expect(markerX(after, 'w9')).toBeGreaterThan(markerX(before, 'w9')!);

            // The axis mirrors it as a bidirectional spread from the gap, so the reflow is asserted directly here
            // rather than through the single-direction axisReflowSpec.
            const axisLabelX = (s: SceneGeometrySample, label: string) => s.get(`axis[bottom]/text[${label}]`)?.x;
            expect(axisLabelX(before, 'l:w7')).toBeUndefined();
            expect(axisLabelX(after, 'l:w7')).toBeDefined();
            expect(axisLabelX(after, 'l:w8')).toBeDefined();
            expect(axisLabelX(after, 'l:w9')!).toBeGreaterThan(axisLabelX(before, 'l:w9')!);

            // The inserted markers animate in from invisible to fully shown.
            expectMarkerStartsCollapsed(trajectory, 'w7');
            expect(after.get('series[0]/marker[w7]')!.opacity).toBeGreaterThan(0.99);
        });

        // Line reorder does not tween marker position, so the coverage is that the reshuffle LANDED —
        // otherwise the CASE would pass on a no-op. The stroke snaps on frame 0, hence `constant`.
        it('category reorder: markers re-map to the reshuffled bands', async () => {
            const reordered = [WEEKS[3], WEEKS[0], WEEKS[5], WEEKS[1], WEEKS[6], WEEKS[2], WEEKS[4]];
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: reordered })
            );
            expect(markerCount(after)).toBe(markerCount(before));
            const order = reordered.map((d) => d.x);
            for (let i = 1; i < order.length; i++) {
                expect(markerX(after, order[i - 1])!).toBeLessThan(markerX(after, order[i])!);
            }
            expect(markerX(after, 'w6')!).toBeLessThan(markerX(before, 'w6')!);
            expectSceneTrajectory(trajectory, { [pathKey(before)]: 'constant' });
        });

        // The swipe-in reveal masks a fully-drawn path behind a growing clip window, so the drawn shape is
        // already settled on frame 0 and only the clip advance (plus markers scaling in) signals the reveal.
        it('integrated mode: initial load reveals the line and scales its markers in', async () => {
            chart = AgCharts.create(categoryOptions(WEEKS, 'integrated'));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            const key = pathKey(trajectory.at(-1)!);
            expectSceneTrajectory(trajectory, {
                [key]: { clip: 'decreases', 'clip:x': increasingExtent },
                ...markersScaleIn,
            });
            // The last marker scales in last, so it is still zero-size at the start of the reveal.
            expectMarkerStartsCollapsed(trajectory, 'w11', 'width');
        });

        // As with reorder the markers snap to their new bands, so the coverage is that the reversal
        // LANDED: w3 ends rightmost and w11 leftmost. The stroke snaps on frame 0, hence `constant`.
        it('integrated mode: reverse re-maps markers to the reversed bands', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS, 'integrated'), () =>
                chart.updateDelta({ data: [...WEEKS].reverse() })
            );
            expect(markerCount(after)).toBe(markerCount(before));
            expect(markerX(after, 'w11')!).toBeLessThan(markerX(after, 'w3')!);
            expect(markerX(after, 'w3')!).toBeGreaterThan(markerX(before, 'w3')!);
            expect(markerX(after, 'w11')!).toBeLessThan(markerX(before, 'w11')!);
            expectSceneTrajectory(trajectory, { [pathKey(before)]: 'constant' });
        });

        // Integrated mode changes animation defaults, so re-exercise a category add there: the bands must still
        // reflow and the new marker must still fade in from invisible.
        it('integrated mode: category add end week fades the new marker in', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS, 'integrated'), () =>
                chart.updateDelta({ data: [...WEEKS, { x: 'w12', y: 78 }] })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(8);
            const key = pathKey(before);
            // The narrower bands pull the left edge in (decreasingExtent) while the new band widens the extent past
            // its start (squeezing); stations 1, 2 and 4 ride the rescale monotonically, station 3 overshoots.
            expectSceneTrajectory(trajectory, {
                [key]: extentMorph(decreasingExtent, squeezing, 'constant', [], {
                    'top@0': 'constant',
                    'top@1': increasingExtent,
                    'top@2': increasingExtent,
                    'top@3': squeezing,
                    'top@4': increasingExtent,
                }),
                ...markersReflow,
                ...axisReflowSpec('bottom', { shift: 'left' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w12');
        });

        // Integrated reorder mirrors the standalone case; the stroke snaps to its reshaped form on the first
        // frame rather than tweening, so the path is pinned `constant`.
        it('integrated mode: reorder re-maps markers to the reshuffled bands', async () => {
            const reordered = [WEEKS[3], WEEKS[0], WEEKS[5], WEEKS[1], WEEKS[6], WEEKS[2], WEEKS[4]];
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS, 'integrated'), () =>
                chart.updateDelta({ data: reordered })
            );
            expect(markerCount(after)).toBe(markerCount(before));
            const order = reordered.map((d) => d.x);
            for (let i = 1; i < order.length; i++) {
                expect(markerX(after, order[i - 1])!).toBeLessThan(markerX(after, order[i])!);
            }
            expect(markerX(after, 'w6')!).toBeLessThan(markerX(before, 'w6')!);
            expectSceneTrajectory(trajectory, { [pathKey(before)]: 'constant' });
        });

        // A point is appended on a timer while an earlier append is still animating: each interrupting update
        // must keep the stroke one connected subpath and let the line keep growing.
        it('ticking: appending points mid-animation keeps the stroke connected and growing', async () => {
            const data = [
                { x: 0, y: 40 },
                { x: 1, y: 120 },
                { x: 2, y: 80 },
                { x: 3, y: 160 },
                { x: 4, y: 60 },
            ];
            chart = AgCharts.create(lineOptions(data));
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            let nextX = 5;
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene, {
                frames: 40,
                onFrame: async (i) => {
                    if (i > 0 && i % 8 === 0 && nextX <= 8) {
                        data.push({ x: nextX, y: nextX % 2 === 0 ? 90 : 140 });
                        nextX++;
                        await chart.updateDelta({ data: [...data] });
                    }
                },
            });
            const key = pathKey(trajectory.at(-1)!);
            for (let i = 0; i < trajectory.length; i++) {
                expect(trajectory[i].get(key)?.subpaths, `frame ${i} subpaths`).toBe(1);
            }
            expect(markerCount(trajectory.at(-1)!)).toBeGreaterThan(markerCount(trajectory[0]));
            // The stroke keeps growing (not frozen mid-tick): its final width exceeds its initial width.
            expect(trajectory.at(-1)!.get(key)!.width).toBeGreaterThan(trajectory[0].get(key)!.width);
        });

        // A second data change lands before the first finishes: the batch must abandon the first target and
        // settle on the second (final count 7, not the interrupted update's 3).
        it('rapid update: an interrupting update settles on the final data, not the abandoned one', async () => {
            chart = AgCharts.create(
                lineOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                ])
            );
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            await chart.updateDelta({
                data: [
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene, {
                onFrame: async (i) => {
                    if (i === 5) {
                        await chart.updateDelta({
                            data: [
                                { x: 0, y: 40 },
                                { x: 1, y: 120 },
                                { x: 2, y: 80 },
                                { x: 3, y: 160 },
                                { x: 4, y: 60 },
                                { x: 5, y: 130 },
                                { x: 6, y: 90 },
                            ],
                        });
                    }
                },
            });
            // The stroke stays a single connected subpath through the interrupted transition.
            for (let i = 0; i < trajectory.length; i++) {
                const frameKey = [...trajectory[i].keys()].find((k) => k.startsWith('series[0]/path'));
                if (frameKey != null) {
                    expect(trajectory[i].get(frameKey)!.subpaths, `frame ${i} subpaths`).toBe(1);
                }
            }
            await frames.runToEnd(chart);
            const after = sampleScene();
            const key = pathKey(after);
            expect(markerCount(after)).toBe(7);
            expect(after.get(key)!.subpaths).toBe(1);
        });

        // The initial load reveals the line via a left-to-right swipe with the markers scaling in glued to the
        // swipe edge; the observable sync is the ordering, captured here across frames.
        it('easeOut reveal: markers scale in left-to-right in sync with the path swipe', async () => {
            const data = [
                { x: 'A', y: 40 },
                { x: 'B', y: 120 },
                { x: 'C', y: 80 },
                { x: 'D', y: 160 },
                { x: 'E', y: 60 },
                { x: 'F', y: 100 },
            ];
            chart = AgCharts.create(categoryOptions(data));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene, { frames: 40 });
            const key = pathKey(trajectory.at(-1)!);
            // The swipe is clip-based: the stroke is drawn in full from frame 0 and the clip window's right edge
            // grows monotonically across the plot — that growth IS the swipe. clip:x exists only during the sweep.
            expectSceneTrajectory(trajectory, {
                [key]: {
                    'top@0': 'constant',
                    'top@1': 'constant',
                    'top@2': 'constant',
                    'top@3': 'constant',
                    'top@4': 'constant',
                    'clip:x': ['increases', 'progresses', 'bounded'],
                    x: 'any',
                    y: 'any',
                    width: 'any',
                    height: 'any',
                    opacity: 'any',
                    subpaths: 'any',
                    clip: 'any',
                    'clip:y': 'any',
                },
                ...markersScaleIn,
            });

            const finalWidth = trajectory.at(-1)!.get('series[0]/marker[A]')!.width;
            expect(finalWidth).toBeGreaterThan(1);
            const firstFrameAbove = (label: string, fraction: number) =>
                trajectory.findIndex((f) => (f.get(`series[0]/marker[${label}]`)?.width ?? 0) > finalWidth * fraction);
            // Each marker begins scaling in no earlier than the one to its left: the L-to-R stagger across
            // the whole row, not just the extremes.
            const starts = ['A', 'B', 'C', 'D', 'E', 'F'].map((l) => firstFrameAbove(l, 0.01));
            expectMonotonic(starts, 'increasing');
            // And the stagger is wide enough that the leftmost finishes (>=90%) strictly before the rightmost
            // even starts — this strictness is what fails on a total snap (all indices would be 0).
            const leftmostDone = trajectory.findIndex(
                (f) => (f.get('series[0]/marker[A]')?.width ?? 0) >= finalWidth * 0.9
            );
            expect(leftmostDone).toBeGreaterThan(0);
            expect(starts.at(-1)!).toBeGreaterThan(0);
            expect(leftmostDone).toBeLessThan(starts.at(-1)!);
        });

        // "Move Legend" — a legend reposition reflows the layout rect, which the product snaps rather than
        // tweening. The reflow lands (the path width changes) but no frame animates.
        it('legend move snaps without tweening', async () => {
            const options = categoryOptions(WEEKS);
            options.legend = { position: 'bottom' };
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const before = sampleScene();
            await chart.update({ ...options, legend: { position: 'right' } });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);
            const key = pathKey(before);
            expect(Math.abs(trajectory.at(-1)!.get(key)!.width - before.get(key)!.width)).toBeGreaterThan(1);
        });

        // "Change Theme" — a restyle, not a data change: the data-driven series geometry lands immediately
        // (no tween), while only the axis re-fades its restyled tick lines.
        it('theme change snaps the series without tweening', async () => {
            const options = categoryOptions(WEEKS);
            options.theme = 'ag-default';
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const strokeOf = () => (deproxy(chart).series[0] as any).properties.stroke;
            const strokeBefore = strokeOf();
            await chart.update({ ...options, theme: 'ag-sheets' });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // The series geometry holds constant on EVERY frame, not just at the endpoints, so a tween that wandered
            // off and returned is still caught; the axis is excluded as it legitimately re-fades its tick lines.
            const seriesOnly = (s: SceneGeometrySample) => new Map([...s].filter(([k]) => k.startsWith('series[')));
            expectNoAnimation(trajectory.map(seriesOnly));
            // The sampler reads geometry only, so the palette swap is the change-landed signal.
            expect(strokeOf()).not.toBe(strokeBefore);
        });

        // Extending stacked lines must animate the stack as a unit, pinned by two per-frame invariants:
        // the stack never inverts at any station, and neither path dips below its settled bottom envelope.
        it('stacked add points: the stack never inverts nor dips below its bottom envelope', async () => {
            const stackedData = [
                { quarter: 'Q1', apples: 50, oranges: 30 },
                { quarter: 'Q2', apples: 60, oranges: 40 },
                { quarter: 'Q3', apples: 70, oranges: 35 },
            ];
            const options: AgCartesianChartOptions = {
                data: stackedData,
                series: [
                    { type: 'line', xKey: 'quarter', yKey: 'apples', stacked: true, marker: { enabled: true } },
                    { type: 'line', xKey: 'quarter', yKey: 'oranges', stacked: true, marker: { enabled: true } },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    // Pinned so the added points are non-scale-affecting (cumulative max 125 < 150).
                    y: { type: 'number', position: 'left', min: 0, max: 150 },
                },
            };
            const { before, trajectory, after } = await captureFrom(prepareTestOptions(options), () =>
                chart.updateDelta({
                    data: [
                        ...stackedData,
                        { quarter: 'Q4', apples: 80, oranges: 45 },
                        { quarter: 'Q5', apples: 65, oranges: 50 },
                    ],
                })
            );
            const pathKeys = (sample: SceneGeometrySample) =>
                [...sample.keys()].filter((k) => /^series\[[01]\]\/path/.test(k)).sort((a, b) => a.localeCompare(b));
            expect(pathKeys(before)).toHaveLength(2);
            expect(markerCount(before)).toBe(6);
            // Both stacked paths share one bbox x-range per frame, so same-index stations align in
            // screen x and the settled bottoms (y + height) define the envelope nothing may dip below.
            const settledBottoms = pathKeys(before).map((k) => {
                const path = before.get(k)!;
                return path.y + path.height;
            });
            const stackHolds: SceneFrameInvariant = {
                name: 'stack order and bottom envelope hold',
                check: (frame) => {
                    const [lower, upper] = pathKeys(frame).map((k) => frame.get(k));
                    if (lower == null || upper == null) return 'expected both stacked paths in every frame';
                    for (let s = 0; s <= 4; s++) {
                        const lowerTop = lower[`top@${s}`];
                        const upperTop = upper[`top@${s}`];
                        if (!Number.isFinite(lowerTop) || !Number.isFinite(upperTop)) {
                            return `station ${s} is non-finite`;
                        }
                        if (upperTop > lowerTop + 1) {
                            return `stack inverted at station ${s}: upper y ${upperTop.toFixed(2)} below lower y ${lowerTop.toFixed(2)}`;
                        }
                    }
                    return [lower, upper].some((path, i) => path.y + path.height > settledBottoms[i] + 1)
                        ? 'a path dipped below its settled bottom envelope'
                        : undefined;
                },
            };
            // Both paths tween the same shared x/width and interior stations 1-3 move together, but station 4
            // diverges — proof the upper layer's new segment moves from its stacked position, not the baseline.
            const [lowerKey, upperKey] = pathKeys(before);
            const sharedInteriorTops = {
                'top@0': 'constant' as const,
                'top@1': decreasingExtent,
                'top@2': decreasingExtent,
                'top@3': decreasingExtent,
            };
            expectSceneTrajectory(
                trajectory,
                {
                    [lowerKey]: extentMorph(decreasingExtent, squeezing, 'constant', [], {
                        ...sharedInteriorTops,
                        'top@4': increasingExtent,
                    }),
                    [upperKey]: extentMorph(decreasingExtent, squeezing, 'constant', [], {
                        ...sharedInteriorTops,
                        'top@4': decreasingExtent,
                    }),
                    'series[*]/marker[*]': { opacity: fadeIn, ...markerPosition },
                    ...axisReflowSpec('bottom', { shift: 'left' }),
                },
                { frameInvariants: [stackHolds] }
            );
            expect(markerCount(after)).toBe(10);
            expectMarkerStartsCollapsed(trajectory, 'Q4');
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped
        // render of the same options produces (see expectAnimatedEndpointsMatchStatic).
        it('sanity: update points endpoints match static renders', async () => {
            const options = lineOptions([
                { x: 0, y: 40 },
                { x: 1, y: 120 },
                { x: 2, y: 80 },
                { x: 3, y: 160 },
                { x: 4, y: 60 },
            ]);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: [
                    { x: 0, y: 90 },
                    { x: 1, y: 50 },
                    { x: 2, y: 140 },
                    { x: 3, y: 70 },
                    { x: 4, y: 110 },
                ],
            });
        });

        it('sanity: category add end week endpoints match static renders', async () => {
            const options = categoryOptions(WEEKS);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: [...WEEKS, { x: 'w12', y: 78 }],
            });
        });

        it('sanity: legend hide endpoints match static renders', async () => {
            const options = twoSeriesOptions(2);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                series: options.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
            });
        });
    });

    describe('#create', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const { assertions, options, warnings = [] } = example;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await assertions(chart);

                for (const [index, message] of warnings.entries()) {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                }
                if (warnings.length === 0) {
                    expect(console.warn).not.toHaveBeenCalled();
                }
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    // The initial-load reveal is pinned per-frame by the 'easeOut reveal' and integrated
    // initial-load trajectory CASEs in 'animation -test page actions'.

    const ANIMATION_CATEGORY_DATA = [
        { quarter: 'week 3', iphone: 60, macos: 31 },
        { quarter: 'week 4', iphone: 185, macos: 43 },
        { quarter: 'week 5', iphone: 148, macos: 35 },
        { quarter: 'week 6', iphone: 130, macos: 42 },
        { quarter: 'week 9', iphone: 62, macos: 45 },
        { quarter: 'week 10', iphone: 137, macos: 24 },
        { quarter: 'week 11', iphone: 121, macos: 57 },
    ];

    // Category data updates (add/remove/replace/update points) and legend hide/show are pinned
    // per-frame by the trajectory CASEs in 'animation -test page actions'.

    // Stacked-line animation is pinned per-frame by the 'stacked add points' trajectory CASE in
    // 'animation -test page actions'.

    describe('multiple overlapping lines', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        it('should render line series with the correct relative Z-index', async () => {
            const options: AgChartOptions = {
                data: repeat(null, 30).reduce(
                    (result, _, i) => [
                        {
                            ...(result[0] ?? {}),
                            [`x${i}`]: 0,
                            [`y${i}`]: i,
                        },
                        {
                            ...(result[1] ?? {}),
                            [`x${i}`]: 1,
                            [`y${i}`]: 30 - i,
                        },
                    ],
                    [{}, {}]
                ),
                series: repeat(null, 30).map((_, i) => ({
                    type: 'line',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    strokeWidth: 30,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    // Painted-clipping fidelity only: the clip-window motion itself is pinned by the 'easeOut
    // reveal' trajectory CASE, so just the endpoint and midpoint ratios are snapshotted.
    describe('clipping animation', () => {
        const animate = spyOnAnimationManager();

        describe('AG-10477', () => {
            for (const ratio of [0, 0.5, 1]) {
                it(`should render correctly at ${ratio * 100}%`, async () => {
                    animate(1200, ratio);
                    const options: AgChartOptions = {
                        data: [
                            { month: 'Jun', a: 50, b: 50 },
                            { month: 'Jul', a: 100, b: 0 },
                            { month: 'Aug', a: 100, b: 0 },
                            { month: 'Sep', a: 100, b: 0 },
                            { month: 'Oct', a: 100, b: 0 },
                        ],
                        series: [
                            { type: 'line', xKey: 'month', yKey: 'a', strokeWidth: 22 },
                            { type: 'line', xKey: 'month', yKey: 'b', strokeWidth: 22 },
                        ],
                    };

                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);
                    await compare();
                });
            }
        });
    });

    describe('data per series', () => {
        it('with category keys should render as expected', async () => {
            const options: AgChartOptions = {
                series: [
                    {
                        data: [
                            { key: '2020', value: 300 },
                            { key: '2021', value: 200 },
                            { key: '2022', value: 350 },
                            { key: '2023', value: 400 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                    {
                        data: [
                            { key: '2022', value: 100 },
                            { key: '2023', value: 130 },
                            { key: '2024', value: 160 },
                            { key: '2025', value: 200 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            // TODO: replace with `compare()` with 0 percent threshold
            await compareImageSnapshot(chart, ctx, {
                failureThreshold: 0,
                failureThresholdType: 'percent',
            });
        });

        it('with continuous keys should render as expected', async () => {
            const options: AgChartOptions = {
                series: [
                    {
                        data: [
                            { key: new Date('2020'), value: 300 },
                            { key: new Date('2021'), value: 200 },
                            { key: new Date('2022'), value: 350 },
                            { key: new Date('2023'), value: 400 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                    {
                        data: [
                            { key: new Date('2022'), value: 100 },
                            { key: new Date('2023'), value: 130 },
                            { key: new Date('2024'), value: 160 },
                            { key: new Date('2025'), value: 200 },
                        ],
                        type: 'line',
                        xKey: 'key',
                        yKey: 'value',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            // TODO: replace with `compare()` with 0 percent threshold
            await compareImageSnapshot(chart, ctx, {
                failureThreshold: 0,
                failureThresholdType: 'percent',
            });
        });

        it('should handle stacked case', async () => {
            const options = {
                ...examples.LINE_STACKED_DATA_PER_SERIES,
                series: examples.LINE_STACKED_DATA_PER_SERIES.series!.map((series, index) => ({
                    ...series,
                    id: `series-${index}`,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await waitForChartStability(chart);

            const state = chart.getState();

            state.legend = [
                {
                    seriesId: 'series-0',
                    visible: false,
                },
            ];

            await chart.setState(state);

            await compareImageSnapshot(chart, ctx, {});
        });

        it('should handle stacked with unconnected missing data case', async () => {
            const options = {
                ...examples.LINE_STACKED_MISSING_DATA,
                series: examples.LINE_STACKED_MISSING_DATA.series!.map((series) => ({
                    ...series,
                    connectMissingData: false,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await compareImageSnapshot(chart, ctx, {});
        });

        it('should handle stacked with connected missing data case', async () => {
            const options = {
                ...examples.LINE_STACKED_MISSING_DATA,
                series: examples.LINE_STACKED_MISSING_DATA.series!.map((series) => ({
                    ...series,
                    connectMissingData: true,
                })),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);

            await compareImageSnapshot(chart, ctx, {});
        });
    });

    describe('item styler', () => {
        it('calculates first, last, min, max values', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            size: 20,
                            itemStyler: (params) => {
                                if (params.first) return { fill: 'red' };
                                if (params.min) return { fill: 'yellow' };
                                if (params.max) return { fill: 'green' };
                                if (params.last) return { fill: 'blue' };
                            },
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-16613 should not error on hover with null category keys', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: null, y: 20 },
                    { x: 'A', y: 10 },
                    { x: 'B', y: 15 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        allowNullKeys: true,
                        marker: {
                            size: 20,
                            itemStyler: (params: AgLineSeriesMarkerItemStylerParams<unknown, unknown>) => {
                                if (params.first) return { fill: 'red' };
                                if (params.last) return { fill: 'blue' };
                            },
                        },
                    } as any,
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Hover over the null category data point
            await hoverAction(100, 300)(chart);
            await waitForChartStability(chart);

            // Hover over a non-null category data point
            await hoverAction(400, 300)(chart);
            await compare();
        });
    });

    describe('label enablement', () => {
        const labelOptions = (enabled: boolean) =>
            prepareTestOptions({
                data: [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                    { x: 'C', y: 15 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', label: { enabled } }],
            } as AgChartOptions);

        test('draws no labels while the label is disabled', async () => {
            chart = AgCharts.create(labelOptions(false));
            await waitForChartStability(chart);
            expect(getVisibleLabelNodes(chart)).toHaveLength(0);
        });

        test('removes the drawn labels once an update disables them', async () => {
            chart = AgCharts.create(labelOptions(true));
            await waitForChartStability(chart);
            expect(getVisibleLabelNodes(chart).length).toBeGreaterThan(0);

            await chart.update(labelOptions(false));
            await waitForChartStability(chart);
            expect(getVisibleLabelNodes(chart)).toHaveLength(0);
        });

        test('draws labels once an update enables them', async () => {
            chart = AgCharts.create(labelOptions(false));
            await waitForChartStability(chart);

            await chart.update(labelOptions(true));
            await waitForChartStability(chart);
            expect(getVisibleLabelNodes(chart).length).toBeGreaterThan(0);
        });
    });

    test('AG-8290 label boxing', async () => {
        chart = AgCharts.create(
            prepareTestOptions({
                data: [
                    { month: 'Jan', value: 29.9 },
                    { month: 'Apr', value: 129.2 },
                    { month: 'Jul', value: 135.6 },
                    { month: 'Oct', value: 194.1 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        label: {
                            itemStyler: (params) => {
                                if (params.datum.month === 'Jul') {
                                    return {
                                        border: {
                                            stroke: 'red',
                                            strokeWidth: 6,
                                            strokeOpacity: 1,
                                        },
                                        padding: {
                                            top: 30,
                                            bottom: 60,
                                            left: 40,
                                            right: 20,
                                        },
                                        fontWeight: 'bold',
                                        fill: {
                                            type: 'gradient',
                                            colorStops: [
                                                { color: '#70C1FF', stop: 0.1 },
                                                { color: '#FFD86F', stop: 0.3 },
                                                { color: '#FF9A60', stop: 0.5 },
                                                { color: '#D16BA5' },
                                            ],
                                        },
                                    };
                                }
                            },
                            enabled: true,
                            cornerRadius: 8,
                            fill: 'rgb(252, 255, 197)',
                            fillOpacity: 0.7,
                            padding: 10,
                            border: {
                                stroke: '#AAA',
                                strokeWidth: 3,
                                strokeOpacity: 0.2,
                            },
                        },
                    },
                ],
            })
        );
        await compare();
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockLineStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgLineSeriesStylerParams<D, C>): AgLineSeriesStylerResult | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            marker: {
                                fill: 'cyan',
                                shape: 'triangle',
                                size: 50,
                            },
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses')
                        return {
                            marker: {
                                fill: 'magenta',
                                fillOpacity: 0.5,
                                shape: 'star',
                                size: 40,
                            },
                            stroke: 'purple',
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'sales context' };
                c2 = { name: 'expenses context' };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            { type: 'line', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'line', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            describe('callbacks', () => {
                test('context', () => {
                    styler.expect().nthCalledWithContext(0, c1);
                    styler.expect().nthCalledWithContext(1, c2);
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgLineSeriesMarkerItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.xValue === 'February') {
                        if (params.yKey === 'sales') {
                            return { fill: 'gold', shape: 'plus', strokeWidth: 0 };
                        } else {
                            return { fill: 'grey', shape: 'cross' };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'sales',
                                marker: {
                                    fill: 'lime', // ignored
                                    shape: 'square', // ignored
                                    strokeWidth: 3, // ignored only for February
                                    itemStyler,
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'expenses',
                                marker: {
                                    fill: 'olive', // ignored
                                    shape: 'square', // ignored
                                    itemStyler,
                                },
                                stroke: 'navy', // ignored
                                strokeWidth: 5, // not ignored
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    return { marker: { size: 50, fill: { type: 'gradient' } } };
                                },
                            },
                            {
                                type: 'line',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: () => {
                                    return { marker: { size: 50, fill: { type: 'pattern' } } };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('stroke options', () => {
            beforeEach(async () => {
                const options = prepareTestOptions({
                    data: [
                        { month: 'Jan', subscriptions: 222 },
                        { month: 'Feb', subscriptions: 240 },
                        { month: 'Mar', subscriptions: 280 },
                        { month: 'Apr', subscriptions: 300 },
                        { month: 'May', subscriptions: 350 },
                        { month: 'Jun', subscriptions: 420 },
                        { month: 'Jul', subscriptions: 300 },
                        { month: 'Aug', subscriptions: 270 },
                        { month: 'Sep', subscriptions: 260 },
                        { month: 'Oct', subscriptions: 385 },
                        { month: 'Nov', subscriptions: 320 },
                        { month: 'Dec', subscriptions: 330 },
                    ],
                    legend: { item: { line: { length: 120 }, marker: { size: 40 } } },
                    series: [
                        {
                            type: 'line',
                            xKey: 'month',
                            yKey: 'subscriptions',
                            marker: { size: 35 },
                            styler: () => {
                                return {
                                    strokeWidth: 4,
                                    strokeOpacity: 0.5,
                                    stroke: 'fuchsia',
                                    lineDash: [9, 5, 4, 6],
                                    lineDashOffset: 7,
                                    marker: {
                                        strokeWidth: 7,
                                        strokeOpacity: 0.8,
                                        stroke: 'lime',
                                        lineDash: [7, 3, 2, 3],
                                        lineDashOffset: 7,
                                    },
                                };
                            },
                        },
                    ],
                });
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
    });

    describe('segmentation', () => {
        it('should render line series with segmentation styling on x-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                    { x: 3, y: 25 },
                    { x: 4, y: 30 },
                    { x: 5, y: 35 },
                    { x: 6, y: 40 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2, stroke: 'red', strokeWidth: 3 },
                                { start: 2, stop: 4, stroke: 'blue', strokeWidth: 2 },
                                { start: 4, stroke: 'green', strokeWidth: 4 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with segmentation styling on y-axis', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                    { x: 'C', y: 15 },
                    { x: 'D', y: 25 },
                    { x: 'E', y: 30 },
                    { x: 'F', y: 35 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 10, stop: 20, stroke: 'orange', strokeWidth: 2, lineDash: [5, 5] },
                                { start: 20, stop: 30, stroke: 'purple', strokeWidth: 3 },
                                { start: 30, stroke: 'cyan', strokeWidth: 4, lineDash: [10, 2] },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render multiple line series with different segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y1: 10, y2: 5 },
                    { x: 1, y1: 20, y2: 15 },
                    { x: 2, y1: 15, y2: 25 },
                    { x: 3, y1: 25, y2: 20 },
                    { x: 4, y1: 30, y2: 35 },
                    { x: 5, y1: 35, y2: 30 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2.5, stroke: 'red', strokeWidth: 2 },
                                { start: 2.5, stroke: 'blue', strokeWidth: 3 },
                            ],
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 3, stroke: 'green', strokeWidth: 2, lineDash: [3, 3] },
                                { start: 3, stroke: 'purple', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with dashed segmentation from specific month', async () => {
            const options: AgChartOptions = {
                data: [
                    { month: 'Jan', value: 30 },
                    { month: 'Feb', value: 72 },
                    { month: 'Mar', value: 105 },
                    { month: 'Apr', value: 130 },
                    { month: 'May', value: 145 },
                    { month: 'Jun', value: 175 },
                    { month: 'Jul', value: 140 },
                    { month: 'Aug', value: 150 },
                    { month: 'Sep', value: 220 },
                    { month: 'Oct', value: 195 },
                    { month: 'Nov', value: 95 },
                    { month: 'Dec', value: 55 },
                ],
                title: {
                    text: 'Zone with dash style',
                },
                subtitle: {
                    text: 'Dotted line typically signifies prognosis',
                },
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        yName: 'Series 1',
                        marker: {
                            enabled: true,
                            size: 11,
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Sep',
                                    strokeWidth: 3,
                                    lineDash: [3, 9],
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        title: {
                            text: 'Values',
                        },
                        nice: true,
                    },
                },
                legend: {
                    position: 'bottom',
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with financial data segmentation and special marker', async () => {
            const options: AgChartOptions = {
                data: [
                    { month: "Jan '24", value: 13.5e6 },
                    { month: "Feb '24", value: 12.9e6 },
                    { month: "Mar '24", value: 12.2e6 },
                    { month: "Apr '24", value: 11.6e6 },
                    { month: "May '24", value: 10.2e6 },
                    { month: "Jun '24", value: 9e6 },
                    { month: "Jul '24", value: 8.8e6 },
                    { month: "Aug '24", value: 8.3e6 },
                    { month: "Sep '24", value: 8e6 },
                    { month: "Oct '24", value: 7.6e6 },
                    { month: "Nov '24", value: 7.2e6 },
                    { month: "Dec '24", value: 7e6 },
                    { month: "Jan '25", value: 17.8e6 },
                    { month: "Feb '25", value: 17e6 },
                    { month: "Mar '25", value: 16e6 },
                    { month: "Apr '25", value: 15.2e6 },
                    { month: "May '25", value: 14e6 },
                    { month: "Jun '25", value: 12.5e6 },
                    { month: "Jul '25", value: 9e6 },
                ],
                padding: { top: 40, right: 10, bottom: 40, left: 60 },
                title: { text: 'Cash' },
                subtitle: {
                    text: '$8.241M • LAST CLOSE',
                    color: 'rgb(185, 192, 204)',
                    fontSize: 15,
                    fontWeight: 'bold',
                },
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'value',
                        yName: 'Cash',
                        stroke: '#3b3743',
                        strokeWidth: 3,
                        strokeOpacity: 1,
                        marker: {
                            itemStyler: ({ datum }) => {
                                if (datum.month === "Aug '24") {
                                    return {
                                        size: 15,
                                        fill: '#3b3743',
                                        strokeWidth: 3,
                                        stroke: '#faf1f8',
                                    };
                                }
                                return {
                                    size: 0,
                                };
                            },
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: "Aug '24",
                                    stroke: 'rgb(92, 123, 187)',
                                    lineDash: [8, 6],
                                },
                            ],
                        },
                    },
                ],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        paddingOuter: 0.8,
                        interval: {
                            values: ["Jan '24", "Apr '24", "Jul '24", "Oct '24", "Jan '25", "Apr '25", "Jul '25"],
                        },
                        line: {
                            enabled: false,
                        },
                        crossLines: [
                            {
                                type: 'range',
                                range: ["Jan '24", "Jul '25"],
                                fill: '#faf1f8',
                                fillOpacity: 0.7,
                                strokeWidth: 0,
                            },
                        ],
                        label: {
                            color: 'rgb(185, 192, 204)',
                            fontSize: 15,
                            fontWeight: 'bold',
                        },
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        nice: false,
                        min: 0,
                        max: 18e6,
                        interval: { values: [0, 4.5e6, 9e6, 13.5e6, 18e6] },
                        label: {
                            color: 'rgb(185, 192, 204)',
                            fontSize: 15,
                            fontWeight: 'bold',
                            formatter: ({ value }) => `${value / 1e6}M`,
                        },
                        gridLine: {
                            style: [
                                {
                                    stroke: 'grey',
                                    lineDash: [4, 6],
                                },
                            ],
                        },
                        line: {
                            enabled: false,
                        },
                    },
                },
                legend: { enabled: false },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 10 },
                    { x: 'Feb', y: 15 },
                    { x: 'Mar', y: 12 },
                    { x: 'Apr', y: 18 },
                    { x: 'May', y: 22 },
                    { x: 'Jun', y: 25 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Jan', stop: 'Feb', stroke: 'red', strokeWidth: 3 },
                                { stop: 'Apr', stroke: 'blue', strokeWidth: 4, lineDash: [5, 3] }, // Missing start - should use 'Feb'
                                { stop: 'Jun', stroke: 'green', strokeWidth: 2, lineDash: [3, 2] }, // Missing start - should use 'Apr'
                            ],
                        },
                        marker: {
                            enabled: true,
                            fill: 'orange',
                            stroke: 'darkorange',
                            strokeWidth: 2,
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 100 },
                    { x: 'Q2', y: 120 },
                    { x: 'Q3', y: 110 },
                    { x: 'Q4', y: 140 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', stroke: '#ff4444', strokeWidth: 5 }, // Missing stop - should use 'Q2'
                                { start: 'Q2', stroke: '#4444ff', strokeWidth: 3, lineDash: [4, 4] }, // Missing stop - should use 'Q4'
                                { start: 'Q4', stop: 'Q4', stroke: '#44ff44', strokeWidth: 2 },
                            ],
                        },
                        marker: {
                            enabled: true,
                            shape: 'diamond',
                            size: 8,
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with Y-axis segmentation and missing values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y: 5 },
                    { x: 'B', y: 15 },
                    { x: 'C', y: 25 },
                    { x: 'D', y: 35 },
                    { x: 'E', y: 45 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 0, stop: 20, stroke: 'crimson', strokeWidth: 4 },
                                { stop: 40, stroke: 'mediumblue', strokeWidth: 3, lineDash: [6, 2] }, // Missing start - should use 20
                                { start: 40, stroke: 'forestgreen', strokeWidth: 5 }, // Missing stop - should extend to max
                            ],
                        },
                        marker: {
                            enabled: true,
                            fill: 'gold',
                            stroke: 'orange',
                            strokeWidth: 1,
                            shape: 'triangle',
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render line series with complex missing values pattern', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 15 },
                    { x: 4, y: 25 },
                    { x: 5, y: 30 },
                    { x: 6, y: 28 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 1, stop: 2, stroke: 'red', strokeWidth: 3 },
                                { stroke: 'blue', strokeWidth: 4 }, // Missing both start/stop - should bridge from 2 to 4
                                { start: 4, stroke: 'green', strokeWidth: 2, lineDash: [5, 5] }, // Missing stop - should extend to end
                            ],
                        },
                        marker: {
                            enabled: true,
                            size: 6,
                            shape: 'square',
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('cutout drawing mode', () => {
        it('should render line series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 25 },
                    { x: 3, y: 15 },
                    { x: 4, y: 30 },
                    { x: 5, y: 20 },
                    { x: 6, y: 35 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        title: 'Line Series',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'circle',
                        },
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'black',
                                lineDash: [4, 2],
                            },
                        },
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(250, 300)(chart);
            await compare();
        });

        it('should render multi-line series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { month: 'Jan', sales: 100, expenses: 80 },
                    { month: 'Feb', sales: 120, expenses: 90 },
                    { month: 'Mar', sales: 110, expenses: 85 },
                    { month: 'Apr', sales: 140, expenses: 100 },
                    { month: 'May', sales: 130, expenses: 95 },
                    { month: 'Jun', sales: 150, expenses: 110 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'sales',
                        title: 'Sales',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'square',
                        },
                        strokeWidth: 3,
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'white',
                                lineDash: [4, 2],
                            },
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'expenses',
                        title: 'Expenses',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'triangle',
                        },
                        strokeWidth: 3,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(200, 250)(chart);
            await compare();
        });

        it('should render line series with default highlight style cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 10 },
                    { x: 4, y: 20 },
                    { x: 5, y: 12 },
                    { x: 6, y: 18 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            enabled: true,
                            size: 25,
                            shape: 'diamond',
                        },
                        strokeWidth: 2,
                    },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(300, 280)(chart);
            await compare();
        });

        it('should use cutout on dimmed non-highlight markers to mask the line', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 10 },
                    { x: 4, y: 20 },
                ],
                highlight: {
                    drawingMode: 'cutout',
                },
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'circle',
                        },
                        highlight: {
                            unhighlightedItem: {
                                fillOpacity: 0.4,
                                strokeOpacity: 0.4,
                            },
                        },
                    },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(300, 280)(chart);
            await waitForChartStability(chart);
            await compare();
        });

        it('should dim non-highlight markers with cutout in multi-series default highlight style', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { month: 'Jan', sales: 100, expenses: 80 },
                    { month: 'Feb', sales: 120, expenses: 90 },
                    { month: 'Mar', sales: 110, expenses: 85 },
                    { month: 'Apr', sales: 140, expenses: 100 },
                    { month: 'May', sales: 130, expenses: 95 },
                    { month: 'Jun', sales: 150, expenses: 110 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'sales',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'circle',
                        },
                    },
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'expenses',
                        strokeWidth: 5,
                        marker: {
                            enabled: true,
                            size: 28,
                            shape: 'triangle',
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await hoverAction(220, 250)(chart);
            await waitForChartStability(chart);
            await compare();
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [{ x: 'Value', s1: 100, s2: 200, s3: 300 }],
                series: [
                    { type: 'line', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'line', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'line', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });

    describe('aggregation data size transitions', () => {
        const getNodeDataCount = () => {
            const chartInstance = deproxy(chart);
            const series = chartInstance.series[0] as any;
            return series.contextNodeData?.nodeData?.length ?? 0;
        };

        it('should render consistent node count after data size transitions (small -> large -> small)', async () => {
            const smallData = Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.random() * 100 }));
            const largeData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: Math.random() * 100 }));

            const options: AgCartesianChartOptions = {
                data: smallData,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const initialNodeCount = getNodeDataCount();
            expect(initialNodeCount).toBeGreaterThan(0);

            await chart.update({ ...options, data: largeData });
            await waitForChartStability(chart);

            const largeDataNodeCount = getNodeDataCount();
            expect(largeDataNodeCount).toBeGreaterThan(0);

            await chart.update({ ...options, data: smallData });
            await waitForChartStability(chart);

            const finalNodeCount = getNodeDataCount();

            expect(finalNodeCount).toBe(initialNodeCount);
        });

        it('should render correct node count after multi-step data size transitions', async () => {
            const data1K = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: Math.sin(i / 10) * 100 }));
            const data10K = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: Math.sin(i / 10) * 100 }));
            const data100K = Array.from({ length: 100000 }, (_, i) => ({ x: i, y: Math.sin(i / 10) * 100 }));

            const options: AgCartesianChartOptions = {
                data: data1K,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const baseline1K = getNodeDataCount();
            expect(baseline1K).toBeGreaterThan(0);

            // 1K -> 10K
            await chart.update({ ...options, data: data10K });
            await waitForChartStability(chart);

            // 10K -> 1K (should match baseline)
            await chart.update({ ...options, data: data1K });
            await waitForChartStability(chart);
            expect(getNodeDataCount()).toBe(baseline1K);

            // 1K -> 100K
            await chart.update({ ...options, data: data100K });
            await waitForChartStability(chart);

            // 100K -> 1K (should match baseline)
            await chart.update({ ...options, data: data1K });
            await waitForChartStability(chart);
            expect(getNodeDataCount()).toBe(baseline1K);
        });
    });

    // A series re-shown while highlighting is active must animate to the dimmed opacity, not to 1.
    describe('CRT-1025 legend toggle with highlighting', () => {
        const animate = spyOnAnimationManager();

        const OPTIONS: AgChartOptions = {
            data: ANIMATION_CATEGORY_DATA,
            series: [
                { type: 'line', xKey: 'quarter', yKey: 'iphone' },
                { type: 'line', xKey: 'quarter', yKey: 'macos' },
            ],
            axes: {
                y: { type: 'number', position: 'left' },
                x: { type: 'category', position: 'bottom' },
            },
        };

        for (const ratio of [0, 0.5, 1]) {
            it(`should animate re-shown series to dimmed opacity at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = deepClone(OPTIONS);
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Hide series 0
                options.series![0].visible = false;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                // Activate highlighting on series 1 directly via highlightManager
                const chartInstance = deproxy(chart);
                const series1 = chartInstance.series[1] as any;
                const nodeData = series1.contextNodeData?.nodeData;
                expect(nodeData?.length).toBeGreaterThan(0);
                chartInstance.ctx.highlightManager.updateHighlight(chartInstance.id, nodeData[0]);
                await waitForChartStability(chart);

                // Precondition: highlighting must be active for series 0 to be dimmed
                expect(chartInstance.ctx.highlightManager.getActiveHighlight()).toBeDefined();

                // Re-show series 0 while highlighting is active
                animate(1200, ratio);
                options.series![0].visible = true;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                // The default theme sets unhighlightedSeries.opacity = 0.2.
                // With the fix, animation targets 0.2; with the bug, it targeted 1.
                const series0 = chartInstance.series[0] as any;
                const path = series0.paths?.[0];
                if (ratio === 1) {
                    expect(path.opacity).toBeCloseTo(0.2, 1);
                } else if (ratio === 0.5) {
                    expect(path.opacity).toBeGreaterThanOrEqual(0);
                    expect(path.opacity).toBeLessThanOrEqual(0.2);
                } else if (ratio === 0) {
                    expect(path.opacity).toBeLessThan(0.1);
                }
            });
        }
    });

    // Markers must draw in 'overlay' mode while fading in, or 'cutout' compositing leaves stroke gaps.
    // Only the compositing result is pixel-only, so just the endpoint and midpoint ratios are snapshotted.
    describe('CRT-1052 line stroke gaps with markers', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.5, 1]) {
            it(`should render continuous stroke at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = {
                    data: ANIMATION_CATEGORY_DATA,
                    series: [
                        {
                            type: 'line',
                            xKey: 'quarter',
                            yKey: 'iphone',
                            strokeWidth: 4,
                            marker: { enabled: true, size: 14 },
                        },
                    ],
                    axes: {
                        y: { type: 'number', position: 'left' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                await compare();
            });
        }

        for (const ratio of [0, 0.5, 1]) {
            it(`should render continuous stroke after legend toggle at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = {
                    data: ANIMATION_CATEGORY_DATA,
                    series: [
                        {
                            type: 'line',
                            xKey: 'quarter',
                            yKey: 'iphone',
                            strokeWidth: 4,
                            marker: { enabled: true, size: 14 },
                        },
                    ],
                    axes: {
                        y: { type: 'number', position: 'left' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Toggle series off then back on
                options.series![0].visible = false;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                animate(1200, ratio);
                options.series![0].visible = true;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                await compare();
            });
        }

        for (const ratio of [0, 0.5]) {
            it(`should use overlay drawing mode on markers during animation at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = {
                    data: ANIMATION_CATEGORY_DATA,
                    series: [
                        {
                            type: 'line',
                            xKey: 'quarter',
                            yKey: 'iphone',
                            strokeWidth: 4,
                            marker: { enabled: true, size: 14 },
                        },
                        {
                            type: 'line',
                            xKey: 'quarter',
                            yKey: 'macos',
                            strokeWidth: 4,
                            marker: { enabled: true, size: 14 },
                        },
                    ],
                    axes: {
                        y: { type: 'number', position: 'left' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Activate highlighting so steady-state drawing mode would be 'cutout'
                const chartInstance = deproxy(chart);
                const series1 = chartInstance.series[1] as any;
                const nodeData = series1.contextNodeData?.nodeData;
                expect(nodeData?.length).toBeGreaterThan(0);
                chartInstance.ctx.highlightManager.updateHighlight(chartInstance.id, nodeData[0]);
                await waitForChartStability(chart);

                expect(chartInstance.ctx.highlightManager.getActiveHighlight()).toBeDefined();

                // Toggle series 0 off then back on while highlighting is active
                options.series![0].visible = false;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                animate(1200, ratio);
                options.series![0].visible = true;
                await chart.update({ ...options });
                await waitForChartStability(chart);

                // During animation markers must composite as 'overlay'; 'cutout' erases the line stroke underneath and
                // leaves gaps.
                const series0 = chartInstance.series[0] as any;
                const datumSelection = series0.datumSelection;
                for (const { node } of datumSelection) {
                    expect(node.drawingMode).toBe('overlay');
                }
            });
        }
    });

    // Hiding a series while animations are skipped must sync _contextNodeData.visible, or the stale
    // visible:true drives a spurious animation on the next non-skipped update.
    describe('stale visibility on skipped animation (CRT-1083)', () => {
        it('should sync _contextNodeData.visible when series hidden during animation skip', async () => {
            // No spyOnAnimationManager — animations are skipped by default in JSDOM,
            // which is the condition required to enter the early-return path in updateSelections().
            const options: AgChartOptions = {
                data: [
                    { x: 0, v1: 10, v2: 20 },
                    { x: 1, v1: 30, v2: 40 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'v1' },
                    { type: 'line', xKey: 'x', yKey: 'v2' },
                ],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const series1 = chartInstance.series[1] as any;

            // Confirm contextNodeData exists and is not marked invisible
            expect(series1.contextNodeData).toBeDefined();
            expect(series1.contextNodeData?.visible).not.toBe(false);

            // Hide second series (simulates legend click / setLegendState)
            (options.series![1] as AgLineSeriesOptions).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            // Core assertion: _contextNodeData.visible must be synced to false
            expect(series1.contextNodeData?.visible).toBe(false);
        });
    });

    describe('crossfiltering', () => {
        it('selectedKey with one selected item sets crossFiltering on contextNodeData', async () => {
            const data = [
                { x: 'Jan', y: 10, selected: true },
                { x: 'Feb', y: 20, selected: false },
                { x: 'Mar', y: 15, selected: false },
            ];
            const options = prepareTestOptions({
                data,
                series: [{ type: 'line', xKey: 'x', yKey: 'y', selectedKey: 'selected' } as any],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('AG-17300 unit-time axis extrapolation', () => {
        const data = [
            { time: new Date('2024-01-01'), value: 10 },
            { time: new Date('2024-01-02'), value: 20 },
            { time: new Date('2024-01-03'), value: 15 },
            { time: new Date('2024-01-04'), value: 30 },
            { time: new Date('2024-01-05'), value: 25 },
        ];

        it('draws a segment to the boundary when max is below the last data point', async () => {
            const options: AgCartesianChartOptions = {
                axes: {
                    x: { type: 'unit-time', position: 'bottom', max: new Date('2024-01-03') },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', data, xKey: 'time', yKey: 'value' }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await compare();
        });

        it('draws a segment from the boundary when min is above the first data point', async () => {
            const options: AgCartesianChartOptions = {
                axes: {
                    x: { type: 'unit-time', position: 'bottom', min: new Date('2024-01-03') },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'line', data, xKey: 'time', yKey: 'value' }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        const categoryNumberAxes = { x: { type: 'category' as const }, y: { type: 'number' as const } };

        it('renders a plain line series with out-of-safe-range bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', y: BIG },
                        { x: 'b', y: BIG * 2n },
                        { x: 'c', y: NEG_BIG },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a stacked line series with bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'a', stacked: true },
                        { type: 'line', xKey: 'x', yKey: 'b', stacked: true },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a 100%-stacked line series with bigint values (normalizedTo degrades to Number)', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'a', stacked: true, normalizedTo: 100 },
                        { type: 'line', xKey: 'x', yKey: 'b', stacked: true, normalizedTo: 100 },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders bigint epoch timestamps on a time axis (<=1000 pts)', async () => {
            // minTimeInterval() must not run Math.sign/abs/min over a bigint interval — that throws during time-axis
            // granularity computation (small datasets bypass the aggregation path).
            const options: AgCartesianChartOptions = {
                data: Array.from({ length: 50 }, (_, i) => ({
                    x: 1_700_000_000_000n + BigInt(i) * 86_400_000n,
                    y: Math.sin(i / 5),
                })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            } as unknown as AgCartesianChartOptions;
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a line series with ISO-8601 datetime-string x values on a time axis', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { time: '2024-01-15T09:00:00Z', y: 12 },
                        { time: '2024-01-15T10:00:00Z', y: 15 },
                        { time: '2024-01-15T11:00:00Z', y: 11 },
                        { time: '2024-01-15T12:00:00Z', y: 18 },
                    ],
                    series: [{ type: 'line', xKey: 'time', yKey: 'y' }],
                    axes: { x: { type: 'time' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const single = (ys: number[]) => (toValue: (v: number) => number | bigint) =>
            ys.map((y, i) => ({ x: i + 1, y: toValue(y) }));
        const paired = (rows: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            rows.map(([a, b], i) => ({ x: i + 1, a: toValue(a), b: toValue(b) }));

        it('positions a non-stacked line series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'line', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([3, 4, 5])
                )
            );
        });

        it('positions a straddling-zero line series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'line', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([-3, 4, -5])
                )
            );
        });

        it('positions a stacked line series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    {
                        series: [
                            { type: 'line', xKey: 'x', yKey: 'a', stacked: true },
                            { type: 'line', xKey: 'x', yKey: 'b', stacked: true },
                        ],
                        axes: STRIPPED_NUMBER_AXES,
                    },
                    paired([
                        [1, 2],
                        [2, 2],
                        [2, 3],
                    ])
                )
            );
        });
    });

    // Above AGGREGATION_THRESHOLD, a bigint series must render identically to its Number baseline.
    describe('bigint high-volume aggregation invariance (AG-16608)', () => {
        const N = HIGH_VOLUME_COUNT;

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint line identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createChart,
                    magnitudePair(
                        { series: [{ type: 'line', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                        (toValue) => Array.from({ length: N }, (_, i) => ({ x: i + 1, y: toValue(sig(i)) })),
                        scaleToBigIntFinite
                    )
                );
            }
        );

        it('renders high-volume ISO-string x identically to numeric epoch x on a time axis', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                isoEpochPair({ series: [{ type: 'line', xKey: 'x', yKey: 'y' }], axes: STRIPPED_TIME_AXES }, N)
            );
        });
    });
});
