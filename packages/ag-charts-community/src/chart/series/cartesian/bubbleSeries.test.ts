import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgBubbleSeriesItemStylerParams,
    AgBubbleSeriesStylerParams,
    AgBubbleSeriesStylerResult,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorRepeat,
    AgImageFillFit,
    AgPatternName,
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
    expectPixelIdenticalAcrossUpdate,
    isoEpochPair,
    magnitudePair,
    scaleToBigIntFinite,
} from '../../test/bigintExamples';
import * as examples from '../../test/examples';
import { type MockBubbleStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    type SceneGeometrySample,
    compareImageSnapshot,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    expectSceneTrajectory,
    expectWarningsCalls,
    getAggregatedMarkerXValues,
    getSeriesAggregationInternals,
    hoverAction,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from '../../test/utils';

describe('BubbleSeries', () => {
    setupMockConsole();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await compareImageSnapshot(chart, ctx, defaults);
    };

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    describe('multiple overlapping bubbles', () => {
        it('should render bubble series with the correct relative Z-index', async () => {
            const options: AgChartOptions = {
                data: repeat(null, 30).reduce(
                    (result, _, i) => [
                        {
                            ...(result[0] ?? {}),
                            [`x${i}`]: 0,
                            [`y${i}`]: i,
                            [`s${i}`]: 0.5,
                        },
                        {
                            ...(result[1] ?? {}),
                            [`x${i}`]: 1,
                            [`y${i}`]: 30 - i,
                            [`s${i}`]: 0.5,
                        },
                    ],
                    [{}, {}]
                ),
                series: repeat(null, 30).map((_, i) => ({
                    type: 'bubble',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    sizeKey: `s${i}`,
                    minSize: 20,
                    maxSize: 50,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with reversed axes', async () => {
            const options: AgChartOptions = {
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
                axes: {
                    y: {
                        type: 'number',
                        position: 'left',
                        reverse: true,
                    },
                    x: {
                        type: 'number',
                        position: 'bottom',
                        reverse: true,
                    },
                },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [BubbleSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = examples.BUBBLE_UNDEFINED_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [BubbleSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BUBBLE_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('pattern fill', () => {
        it.each([
            'vertical-lines',
            'horizontal-lines',
            'forward-slanted-lines',
            'backward-slanted-lines',
            'circles',
            'squares',
            'triangles',
            'diamonds',
            'stars',
            'hearts',
            'crosses',
        ] as AgPatternName[])('it should create a chart with %s pattern', async (pattern) => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'pattern',
                                    pattern,
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });
    });

    describe('image fill', () => {
        it.each(['repeat', 'no-repeat'] as AgColorRepeat[])(
            'it should create a chart with repeat %s image',
            async (repetition) => {
                const options: AgChartOptions = {
                    theme: {
                        overrides: {
                            bubble: {
                                series: {
                                    fillOpacity: 1,
                                    fill: {
                                        type: 'image',
                                        url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                        width: 25,
                                        height: 25,
                                        repeat: repetition,
                                    },
                                },
                            },
                        },
                    },
                    ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
                };

                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(['contain', 'cover', 'stretch', 'none'] as AgImageFillFit[])(
            'it should create a chart with fit %s image',
            async (fit) => {
                const options: AgChartOptions = {
                    theme: {
                        overrides: {
                            bubble: {
                                series: {
                                    fillOpacity: 1,
                                    fill: {
                                        type: 'image',
                                        url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                        fit,
                                    },
                                },
                            },
                        },
                    },
                    ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
                };

                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );
    });

    describe('gradient fill', () => {
        it('should render bubble series with a vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with an axes bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with an axes bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'linear',
                                    rotation: 90,
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a default radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    bounds: 'axis',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a series bound radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'radial',
                                    bounds: 'series',
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bubble series with a radial gradient fill', async () => {
            const options: AgChartOptions = {
                theme: {
                    overrides: {
                        bubble: {
                            series: {
                                fill: {
                                    type: 'gradient',
                                    /* @ts-expect-error internal option */
                                    gradient: 'radial',
                                    colorStops: [
                                        {
                                            color: 'green',
                                        },
                                        {
                                            color: 'white',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                ...examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    // One CASE per control on the bubble example (Randomise / Add / Remove), plus the initial-load reveal.
    // Bubble is marker-only and maps each sizeKey to a radius, so the reveal scales markers to their own size.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        // Pinned x/y domains make every data mutation below provably non-scale-affecting: within
        // [0,6] x [0,200] the markers reposition, resize, or enter/leave without moving the axes.
        const bubbleOptions = (data: Array<{ x: number; y: number; s: number }>): AgCartesianChartOptions =>
            prepareTestOptions({
                data,
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', minSize: 10, maxSize: 40 }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 6 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            });

        const DATA = [
            { x: 1, y: 40, s: 5 },
            { x: 2, y: 120, s: 20 },
            { x: 3, y: 80, s: 10 },
            { x: 4, y: 160, s: 30 },
            { x: 5, y: 60, s: 15 },
        ];
        // Randomise moves every position AND resizes every marker (min/max sizeKey swap ends).
        const MOVED = [
            { x: 1, y: 150, s: 30 },
            { x: 2, y: 50, s: 5 },
            { x: 3, y: 170, s: 25 },
            { x: 4, y: 30, s: 8 },
            { x: 5, y: 110, s: 20 },
        ];

        const markerKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/marker\[/.test(k));
        const markerCount = (sample: SceneGeometrySample) => markerKeys(sample).length;
        const sortedWidths = (sample: SceneGeometrySample) =>
            markerKeys(sample)
                .map((k) => Math.round(sample.get(k)!.width))
                .sort((a, b) => a - b);

        // Only the initial load animates, so updates SNAP; a data update also re-keys the marker nodes,
        // so constancy is asserted over the trajectory rather than before->after.
        const captureSnap = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // Domain straddling the origin: the scale-in is sign-agnostic, so a clamp-to-zero or NaN in the
        // negative-domain mapping would survive the positive-only reveal CASE above.
        it('initial load: markers reveal correctly across a negative-spanning domain', async () => {
            const NEG = [
                { x: -4, y: -80, s: 10 },
                { x: -1, y: 60, s: 20 },
                { x: 2, y: -40, s: 15 },
                { x: 5, y: 90, s: 25 },
            ];
            const options = prepareTestOptions({
                data: NEG,
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', minSize: 10, maxSize: 40 }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: -6, max: 6 },
                    y: { type: 'number', position: 'left', min: -100, max: 100 },
                },
            });
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            // Anti-vacuity: every marker scales in from zero, fully opaque, exactly as the positive reveal.
            for (const key of markerKeys(trajectory[0])) {
                expect(trajectory[0].get(key)!.width, `${key} width @ frame 0`).toBeLessThanOrEqual(0.001);
                expect(trajectory[0].get(key)!.opacity, `${key} opacity @ frame 0`).toBeGreaterThanOrEqual(0.99);
            }
            expectSceneTrajectory(trajectory, {
                'series[0]/marker[*]': {
                    width: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    height: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    x: { during: 'initial', expect: ['decreases', 'bounded'] },
                    y: { during: 'initial', expect: ['decreases', 'bounded'] },
                    opacity: 'constant',
                },
            });
            // Settled positions must honour the signed domain; compared by bbox centre so differing radii
            // cannot confound the ordering.
            const end = sampleScene();
            const centreY = (x: number) =>
                end.get(`series[0]/marker[${x}]`)!.y + end.get(`series[0]/marker[${x}]`)!.height / 2;
            const centreX = (x: number) =>
                end.get(`series[0]/marker[${x}]`)!.x + end.get(`series[0]/marker[${x}]`)!.width / 2;
            expect(centreY(5)).toBeLessThan(centreY(-1)); // y=90 above y=60
            expect(centreY(-1)).toBeLessThan(centreY(2)); // y=60 above y=-40
            expect(centreY(2)).toBeLessThan(centreY(-4)); // y=-40 above y=-80
            expect(centreX(-4)).toBeLessThan(centreX(-1));
            expect(centreX(-1)).toBeLessThan(centreX(2));
            expect(centreX(2)).toBeLessThan(centreX(5));
            for (const key of markerKeys(end)) {
                expect(Number.isFinite(end.get(key)!.y), `${key} y finite`).toBe(true);
            }
        });

        // Initial load scales every marker in from zero to its own sizeKey radius at opacity 1 — a
        // scale-in, not a fade.
        it('initial load: markers scale in to their sizeKey-mapped radii', async () => {
            chart = AgCharts.create(bubbleOptions(DATA));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // Anti-vacuity: markers start collapsed yet fully opaque on frame 0, so `opacity: constant` is
            // anchored to 1 rather than vacuously stuck at 0.
            for (const key of markerKeys(trajectory[0])) {
                expect(trajectory[0].get(key)!.width, `${key} width @ frame 0`).toBeLessThanOrEqual(0.001);
                expect(trajectory[0].get(key)!.opacity, `${key} opacity @ frame 0`).toBeGreaterThanOrEqual(0.99);
            }
            expectSceneTrajectory(trajectory, {
                'series[0]/marker[*]': {
                    width: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    height: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    x: { during: 'initial', expect: ['decreases', 'bounded'] },
                    y: { during: 'initial', expect: ['decreases', 'bounded'] },
                    opacity: 'constant',
                },
            });
            // The reveal lands each marker at its own radius: the largest sizeKey (maxSize) settles far
            // wider than the smallest (minSize), proving the size mapping is preserved through the tween.
            const end = trajectory.at(-1)!;
            expect(end.get('series[0]/marker[4]')!.width).toBeGreaterThan(end.get('series[0]/marker[1]')!.width + 20);
        });

        // "Randomise" — every position and radius changes. Bubble skips the batch, so the markers snap
        // to their new positions and sizes; the captured trajectory is constant from the first frame.
        it('update data: markers snap to their new positions and radii without tweening', async () => {
            const { before, trajectory, after } = await captureSnap(bubbleOptions(DATA), () =>
                chart.updateDelta({ data: MOVED })
            );
            // Anti-vacuity: the radii genuinely changed (constancy would pass vacuously if nothing did).
            expect(sortedWidths(after), 'settled radii differ from the pre-update radii').not.toEqual(
                sortedWidths(before)
            );
            expectNoAnimation(trajectory);
        });

        // "Add" — a new datum. Bubble skips the batch, so the entrant appears at full size on the first
        // captured frame (no scale-in) and the survivors are untouched.
        it('add point: the new marker appears at full size without animating', async () => {
            const { before, trajectory, after } = await captureSnap(bubbleOptions(DATA), () =>
                chart.updateDelta({ data: [...DATA, { x: 0.5, y: 100, s: 12 }] })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(6);
            // Anti-vacuity: the entrant is already at full size on frame 0 — contrast the initial load,
            // where a marker scales in from zero — proving add does not animate.
            expect(trajectory[0].get('series[0]/marker[0.5]')!.width, 'entrant width @ frame 0').toBeGreaterThan(5);
            expectNoAnimation(trajectory);
        });

        // "Remove" — drop two data points. Bubble skips the batch, so the dropped markers leave the
        // scene at once (no fade-out) and the survivors are untouched.
        it('remove points: dropped markers leave the scene at once', async () => {
            const { before, trajectory, after } = await captureSnap(bubbleOptions(DATA), () =>
                chart.updateDelta({ data: DATA.slice(0, 3) })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(3);
            // Anti-vacuity: the dropped markers are already gone on frame 0 (a fade-out would keep them
            // present, collapsing over the trajectory) — proving remove does not animate.
            expect(markerCount(trajectory[0])).toBe(3);
            expectNoAnimation(trajectory);
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped render
        // of the same options produces. One chart per test — the mock canvas only snapshots the first.
        it('sanity: update data endpoints match static renders', async () => {
            const options = bubbleOptions(DATA);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: MOVED,
            });
        });

        it('sanity: remove points endpoints match static renders', async () => {
            const options = bubbleOptions(DATA);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: DATA.slice(0, 3),
            });
        });
    });

    describe('AG-11673 styler', () => {
        type D = { height: number; weight: number; age: number; name: string };
        type C = unknown;
        type M = MockBubbleStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const maleHeightWeight: D[] = [
            { height: 174.4, weight: 65.6, age: 21, name: 'Liam' },
            { height: 175.3, weight: 71.8, age: 23, name: 'Noah' },
            { height: 193.5, weight: 80.7, age: 28, name: 'Oliver' },
            { height: 186.5, weight: 75.6, age: 23, name: 'Elijah' },
            { height: 187.2, weight: 78.8, age: 22, name: 'James' },
            { height: 181.5, weight: 74.8, age: 21, name: 'Benjamin' },
            { height: 184.7, weight: 86.4, age: 26, name: 'Lucas' },
            { height: 175.1, weight: 62.1, age: 23, name: 'Ethan' },
            { height: 184.1, weight: 81.6, age: 21, name: 'Alexander' },
            { height: 184.5, weight: 78.4, age: 27, name: 'Mason' },
        ];
        const femaleHeightWeight: D[] = [
            { height: 161.2, weight: 51.6, age: 22, name: 'Melody' },
            { height: 167.5, weight: 59.8, age: 20, name: 'Ava' },
            { height: 159.5, weight: 49.2, age: 19, name: 'Sophia' },
            { height: 157.4, weight: 63.7, age: 25, name: 'Isabella' },
            { height: 155.8, weight: 53.6, age: 21, name: 'Mia' },
            { height: 170.2, weight: 59.1, age: 23, name: 'Amelia' },
            { height: 159.1, weight: 47.6, age: 26, name: 'Harper' },
            { height: 166.9, weight: 69.8, age: 22, name: 'Evelyn' },
            { height: 176.2, weight: 66.8, age: 28, name: 'Abigail' },
            { height: 160.2, weight: 75.2, age: 40, name: 'Charlotte' },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgBubbleSeriesStylerParams<D, C>): AgBubbleSeriesStylerResult | undefined => {
                    // FIXME: there's no `params.title` value
                    if (params.seriesId === 'BubbleSeries-1') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                            },
                            stroke: 'lime', // not ignored (but no effect)
                        };
                    } else if (params.seriesId === 'BubbleSeries-2') {
                        return { shape: 'heart', fill: 'fuchsia', minSize: 2, maxSize: 200, lineDash: [5, 3] };
                    }
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'male context' };
                c2 = { name: 'female context' };
                chart = AgCharts.create(
                    prepareTestOptions({
                        legend: { item: { marker: { size: 40 } } },
                        series: [
                            {
                                type: 'bubble',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                minSize: 30,
                                maxSize: 100,
                                context: c1,

                                styler: styler.frozen,
                                shape: 'star', // not ignored
                                strokeWidth: 0, // not ignored
                                fill: 'magenta', // ignored
                            },
                            {
                                type: 'bubble',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                minSize: 30,
                                maxSize: 100,
                                context: c2,

                                styler: styler.frozen,
                                shape: 'plus', // ignored
                                fillOpacity: 0.5, // not ignored
                                strokeWidth: 3, // not ignored
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            test('highlight', async () => {
                await hoverAction(200, 165)(chart);
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
        describe('fill types', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        legend: {},
                        series: [
                            {
                                type: 'bubble',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                minSize: 30,
                                maxSize: 100,
                                styler: () => {
                                    return {
                                        fill: {
                                            type: 'gradient',
                                            colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                                        },
                                    };
                                },
                            },
                            {
                                type: 'bubble',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                sizeKey: 'age',
                                minSize: 30,
                                maxSize: 100,
                                styler: () => {
                                    return {
                                        fill: {
                                            type: 'pattern',
                                            pattern: 'stars',
                                        },
                                    };
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
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgBubbleSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.datum.name === 'Mason') {
                        return {
                            fill: {
                                type: 'pattern',
                                pattern: 'stars',
                            },
                            fillOpacity: 1,
                            strokeWidth: 5,
                        };
                    }
                    if (params.datum.name == 'Charlotte') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'deeppink', stop: 0.1 }, { color: 'pink' }],
                            },
                        };
                    }
                    if (params.datum.name == 'Harper') {
                        return {
                            lineDash: [1, 0],
                            shape: 'square',
                        };
                    }
                    return {};
                };
                const opts: AgCartesianChartOptions<D, C> = {
                    legend: { item: { marker: { size: 40 } } },
                    series: [
                        {
                            type: 'bubble',
                            title: 'Male',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            sizeKey: 'age',
                            minSize: 30,
                            maxSize: 100,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'star', // not ignored
                            strokeWidth: 0, // not ignored
                            fill: 'magenta', // ignored
                        },
                        {
                            type: 'bubble',
                            title: 'Female',
                            data: femaleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            sizeKey: 'age',
                            minSize: 30,
                            maxSize: 100,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'plus', // ignored
                            fillOpacity: 0.5, // not ignored
                            strokeWidth: 3, // not ignored
                        },
                    ],
                };
                chart = AgCharts.create(prepareTestOptions(opts));
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('itemStyler size', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgBubbleSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    if (params.highlightState === 'highlighted-item') {
                        return { size: 120, fill: 'lime' };
                    }
                    return { size: params.datum.weight > 75 ? 80 : 10 };
                };
                const opts: AgCartesianChartOptions<D, C> = {
                    series: [
                        {
                            type: 'bubble',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            sizeKey: 'age',
                            minSize: 20,
                            maxSize: 50,
                            itemStyler,
                        },
                    ],
                };
                chart = AgCharts.create(prepareTestOptions(opts));
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            test('highlight', async () => {
                await hoverAction(200, 165)(chart);
                await compare();
            });
        });
    });

    describe('cutout drawing mode', () => {
        it('should render bubble series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 10, y: 20, size: 15 },
                    { x: 20, y: 30, size: 25 },
                    { x: 30, y: 40, size: 20 },
                    { x: 40, y: 50, size: 30 },
                    { x: 50, y: 60, size: 18 },
                ],
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        title: 'Bubble Series',
                        highlight: {
                            highlightedItem: {
                                fill: 'blue',
                                fillOpacity: 0.2,
                                stroke: 'black',
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
            await hoverAction(200, 300)(chart);
            await compare();
        });

        it('should render scatter series with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 10, y: 15 },
                    { x: 20, y: 25 },
                    { x: 30, y: 35 },
                    { x: 40, y: 45 },
                    { x: 50, y: 55 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        title: 'Scatter Series',
                        shape: 'diamond',
                        highlight: {
                            highlightedItem: {
                                fill: 'green',
                                fillOpacity: 0.5,
                                stroke: 'pink',
                            },
                        },
                        size: 25,
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
            await hoverAction(250, 350)(chart);
            await compare();
        });

        it('should render multi-series bubble with cutout highlight drawing mode', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', series1: 10, series2: 15, size1: 20, size2: 25 },
                    { category: 'B', series1: 20, series2: 25, size1: 30, size2: 35 },
                    { category: 'C', series1: 30, series2: 35, size1: 25, size2: 30 },
                    { category: 'D', series1: 40, series2: 45, size1: 35, size2: 40 },
                ],
                series: [
                    {
                        type: 'bubble',
                        xKey: 'category',
                        yKey: 'series1',
                        sizeKey: 'size1',
                        title: 'Series 1',
                        highlight: {
                            highlightedItem: {
                                fillOpacity: 0,
                                stroke: 'black',
                            },
                        },
                    },
                    {
                        type: 'bubble',
                        xKey: 'category',
                        yKey: 'series2',
                        sizeKey: 'size2',
                        title: 'Series 2',
                        highlight: {
                            highlightedItem: {
                                fill: 'yellow',
                                fillOpacity: 0.2,
                                stroke: 'pink',
                                lineDash: [4, 2],
                            },
                        },
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
            await hoverAction(180, 280)(chart);
            await compare();
        });
    });

    describe('showInLegend', () => {
        const commonOptions = {
            series: [
                {
                    type: 'bubble',
                    data: [{ x: 10, y: 20, size: 15 }],
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    title: 'Male',
                },
                {
                    type: 'bubble',
                    data: [{ x: 20, y: 20, size: 10 }],
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    title: 'Female',
                },
            ],
            legend: {},
        } satisfies AgCartesianChartOptions;

        it('should hide bubble series from legend when showInLegend is false', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'Two series, only female series should be shown in legend' },
                series: [commonOptions.series[0], { ...commonOptions.series[1], showInLegend: false }],
            });

            chart = AgCharts.create(options);
            await compare();
        });

        it('should show bubble series in legend when showInLegend is true (default)', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'One series, only male series should be shown in legend' },
                series: [{ ...commonOptions.series[0], showInLegend: true }],
            });

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-16915 maxRenderedItems gate with invalid sizeKey values', () => {
        const buildData = (validCount: number, invalidCount: number) => [
            ...Array.from({ length: validCount }, (_, i) => ({ x: i, y: i, s: 1 + (i % 5) })),
            ...Array.from({ length: invalidCount }, (_, i) => ({ x: validCount + i, y: i, s: Number.NaN })),
        ];

        it('should not aggregate when renderable (non-NaN sizeKey) count is within maxRenderedItems', async () => {
            const options: AgCartesianChartOptions = {
                data: buildData(10, 10),
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', maxRenderedItems: 15 }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [number] for [BubbleSeries-1 / sizeValue] ignored:",
    "[NaN]",
  ],
]
`);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeUndefined();
        });

        it('should still aggregate when renderable count exceeds maxRenderedItems', async () => {
            const options: AgCartesianChartOptions = {
                data: buildData(20, 0),
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', maxRenderedItems: 15 }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeDefined();
        });

        it('should not aggregate when renderable (non-missing sizeKey) count is within maxRenderedItems', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    ...Array.from({ length: 10 }, (_, i) => ({ x: i, y: i, s: 1 + (i % 5) })),
                    ...Array.from({ length: 10 }, (_, i) => ({ x: 10 + i, y: i })),
                ],
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', maxRenderedItems: 15 }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeUndefined();
        });
    });

    describe('AG-18035 aggregation with a degenerate axis domain', () => {
        it('should aggregate a scatter series whose datums all share one x value', async () => {
            const datumCount = 1000;
            const options: AgCartesianChartOptions = {
                data: Array.from({ length: datumCount }, (_, i) => ({ x: 5, y: i })),
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', maxRenderedItems: 200 }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeDefined();
            const renderedCount = series.contextNodeData?.nodeData?.length ?? 0;
            expect(renderedCount).toBeGreaterThan(0);
            expect(renderedCount).toBeLessThan(datumCount / 2);
        });
    });

    describe('aggregation on a reversed axis', () => {
        const aggregatedOptions = (reverse: boolean): AgCartesianChartOptions => ({
            data: Array.from({ length: 300 }, (_, i) => ({ x: i, y: (i * 7) % 100, s: 1 + (i % 5) })),
            series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', maxRenderedItems: 200 }],
            axes: {
                x: { type: 'number', position: 'bottom', reverse },
                y: { type: 'number', position: 'left' },
            },
            legend: { enabled: false },
        });

        it('should render the same markers with a sizeKey when the x-axis is reversed and maxRenderedItems is exceeded', async () => {
            chart = AgCharts.create(prepareTestOptions(aggregatedOptions(false)));
            await waitForChartStability(chart);
            const expected = getAggregatedMarkerXValues(chart);
            expect(expected.length).toBeGreaterThan(0);
            expect(expected.length).toBeLessThan(300);

            await chart.update(prepareTestOptions(aggregatedOptions(true)));
            await waitForChartStability(chart);
            expect(getAggregatedMarkerXValues(chart)).toEqual(expected);
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { He_V: 10, He_P: 95, He_m: 2, Ne_V: 10, Ne_P: 90, Ne_m: 10, Ar_V: 10, Ar_P: 80, Ar_m: 18 },
                    { He_V: 15, He_P: 81, He_m: 2, Ne_V: 15, Ne_P: 80, Ne_m: 10, Ar_V: 15, Ar_P: 60, Ar_m: 18 },
                    { He_V: 20, He_P: 68, He_m: 2, Ne_V: 20, Ne_P: 70, Ne_m: 10, Ar_V: 20, Ar_P: 40, Ar_m: 18 },
                ],
                series: [
                    { type: 'bubble', xKey: 'He_V', yKey: 'He_P', sizeKey: 'He_m', maxSize: 20, yName: 'Helium' },
                    { type: 'bubble', xKey: 'Ne_V', yKey: 'Ne_P', sizeKey: 'Ne_m', maxSize: 20, yName: 'Neon' },
                    { type: 'bubble', xKey: 'Ar_V', yKey: 'Ar_P', sizeKey: 'Ar_m', maxSize: 20, yName: 'Argon' },
                ],
            },
        });
    });

    describe('AG-17005 data-selection', () => {
        const markerData = [
            { x: 10, y: 20, size: 5 },
            { x: 20, y: 10, size: 8 },
            { x: 30, y: 40, size: 3 },
            { x: 40, y: 30, size: 6 },
            { x: 50, y: 50, size: 10 },
            { x: 60, y: 15, size: 4 },
            { x: 70, y: 35, size: 7 },
            { x: 80, y: 25, size: 9 },
            { x: 90, y: 45, size: 2 },
            { x: 15, y: 55, size: 11 },
        ];

        it('should render bubble series with selection option enabled without errors', async () => {
            const options: AgCartesianChartOptions = {
                data: markerData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        minSize: 6,
                        maxSize: 30,
                        selection: {
                            enabled: true,
                            selectedItem: { fill: 'lime', stroke: 'darkgreen', strokeWidth: 3 },
                            unselectedItem: { fillOpacity: 0.2 },
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

        it('should render scatter series with selection option enabled without errors', async () => {
            const options: AgCartesianChartOptions = {
                data: markerData,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        size: 20,
                        selection: {
                            enabled: true,
                            selectedItem: { fill: 'orange', stroke: 'darkorange', strokeWidth: 2 },
                            unselectedItem: { fillOpacity: 0.15 },
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

        it('should expose a bucket-lookup index set when bubble series aggregation is active', async () => {
            const options: AgCartesianChartOptions = {
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i % 5, s: 1 + (i % 3) })),
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', maxRenderedItems: 10 }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeDefined();

            const bucketLookup = series.ensureBucketLookupFeature();
            expect(bucketLookup).toBeDefined();
            const aggregateIndexSet = series.aggregateIndexSet!;
            const [primaryDatumIndex] = [...aggregateIndexSet.entries()].find(([, idx]) => idx.length > 1)!;
            expect(bucketLookup!.getIndexSet(primaryDatumIndex)).toBeDefined();
        });

        it('should return an undefined index set on scatter when aggregation is not active', async () => {
            const options: AgCartesianChartOptions = {
                data: Array.from({ length: 5 }, (_, i) => ({ x: i, y: i })),
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                legend: { enabled: false },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeUndefined();
            expect(series.ensureBucketLookupFeature()?.getIndexSet(0)).toBeUndefined();
        });
    });

    describe('AG-17481 size scaling', () => {
        const nodeSizes = (c: AgChartInstance) =>
            (deproxy(c).series[0] as unknown as { getNodeData(): Array<{ point: { size: number } }> })
                .getNodeData()
                .map((d) => d.point.size);

        const createBubble = async (seriesOverrides: object) => {
            const options = {
                data: [
                    { x: 1, y: 1, s: 0 },
                    { x: 2, y: 2, s: 50 },
                    { x: 3, y: 3, s: 200 },
                ],
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', ...seriesOverrides }],
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            } as AgCartesianChartOptions;
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        };

        it('clamps out-of-domain values to [minSize, maxSize] (AC3, AC4)', async () => {
            await createBubble({ minSize: 10, maxSize: 30, sizeDomain: [0, 100] });
            // s=0 -> minSize; s=50 -> midpoint; s=200 (above the domain) -> maxSize.
            expect(nodeSizes(chart)).toEqual([10, 20, 30]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('reverses the mapping and clamps with a reversed sizeDomain (AC5, AC6)', async () => {
            await createBubble({ minSize: 10, maxSize: 30, sizeDomain: [100, 0] });
            // reversed: s=0 -> maxSize; s=50 -> midpoint; s=200 (above the domain) -> minSize.
            expect(nodeSizes(chart)).toEqual([30, 20, 10]);
        });

        it('renders the range midpoint, not NaN, when the size domain collapses to a single value', async () => {
            const options = {
                // Every sizeKey value is identical, so the size domain has zero width.
                data: [
                    { x: 1, y: 1, s: 5 },
                    { x: 2, y: 2, s: 5 },
                    { x: 3, y: 3, s: 5 },
                ],
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's', minSize: 10, maxSize: 30 }],
                legend: { enabled: false },
                axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            } as AgCartesianChartOptions;
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            // Zero-width domains resolve to the range midpoint (10 + 30) / 2, never NaN/Infinity.
            expect(nodeSizes(chart)).toEqual([20, 20, 20]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('clamps the upper bound up to minSize when only minSize is set, without warning (AC8, AC9)', async () => {
            // Default maxSize is 30; minSize 40 is authoritative so both resolve to 40.
            await createBubble({ minSize: 40, sizeDomain: [0, 100] });
            expect(nodeSizes(chart)).toEqual([40, 40, 40]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('clamps to minSize when only maxSize is set below the default minSize, without warning (AC10)', async () => {
            // Default minSize is 7; maxSize 5 is below it, so the authoritative minSize wins and both resolve to 7.
            await createBubble({ maxSize: 5, sizeDomain: [0, 100] });
            expect(nodeSizes(chart)).toEqual([7, 7, 7]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('warns and reverts to theme defaults when both bounds are inverted (AC7)', async () => {
            await createBubble({ minSize: 30, maxSize: 5, sizeDomain: [0, 100] });
            // Reverted to theme defaults [7, 30]: s=0 -> 7, s=50 -> 18.5, s=200 -> 30.
            expect(nodeSizes(chart)).toEqual([7, 18.5, 30]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - series[0].minSize (30) cannot be greater than maxSize (5), ignoring both.",
                ],
              ]
            `);
        });

        it('rejects a sizeDomain that is not a 2-element array and falls back to the data domain', async () => {
            await createBubble({ sizeDomain: [5] });
            // The malformed sizeDomain is dropped, so the data-derived domain [0, 200] and theme
            // defaults [7, 30] apply: s=0 -> 7, s=50 -> 12.75, s=200 -> 30 (no NaN).
            expect(nodeSizes(chart)).toEqual([7, 12.75, 30]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].sizeDomain\` cannot be set to \`[5]\`; expecting a number or bigint array and an array of exactly 2 items, ignoring.",
                ],
              ]
            `);
        });

        it('rejects bigint size bounds and reverts to theme defaults', async () => {
            await createBubble({ minSize: 30n, maxSize: 5n, sizeDomain: [0, 100] });
            // minSize/maxSize are pixel sizes validated as finite numbers, so bigints are rejected by
            // option validation before the inverted-bounds check; both fall back to theme defaults [7, 30].
            expect(nodeSizes(chart)).toEqual([7, 18.5, 30]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].minSize\` cannot be set to \`30\`; expecting a number greater than or equal to 0, ignoring.",
                ],
                [
                  "AG Charts - Option \`series[0].maxSize\` cannot be set to \`5\`; expecting a number greater than or equal to 0, ignoring.",
                ],
              ]
            `);
        });

        it('rejects the removed size and domain options (AC1, AC2)', async () => {
            await createBubble({ size: 10, domain: [0, 100] });
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Unknown option \`series[0].size\`; Did you mean \`sizeDomain\`, \`minSize\`, \`maxSize\` or \`sizeName\`? Ignoring.",
                ],
                [
                  "AG Charts - Unknown option \`series[0].domain\`; Did you mean \`sizeDomain\`? Ignoring.",
                ],
              ]
            `);
        });

        it('leaves the Scatter Series API unchanged: size accepted, minSize rejected (TC1)', async () => {
            const options = {
                data: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 12, minSize: 5 } as object],
                legend: { enabled: false },
            } as AgCartesianChartOptions;
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // `size` is honoured (fixed marker size); `minSize` is rejected as an unknown option.
            expect(nodeSizes(chart)).toEqual([12, 12]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Unknown option \`series[0].minSize\`, ignoring.",
                ],
              ]
            `);
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a bubble series with out-of-safe-range bigint x, y and size values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: BIG, y: BIG, size: BIG },
                        { x: BIG * 2n, y: NEG_BIG, size: BIG * 2n },
                        { x: NEG_BIG, y: BIG * 2n, size: BIG * 3n },
                    ],
                    series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' }],
                    axes: { x: { type: 'number' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a bubble series with ISO-8601 datetime-string x values on a time axis', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { time: '2024-01-15T09:00:00Z', y: 12, size: 4 },
                        { time: '2024-01-15T10:30:00Z', y: 15, size: 8 },
                        { time: '2024-01-15T11:45:00Z', y: 11, size: 6 },
                    ],
                    series: [{ type: 'bubble', xKey: 'time', yKey: 'y', sizeKey: 'size' }],
                    axes: { x: { type: 'time' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    // Above AGGREGATION_THRESHOLD, a bigint series must render identically to its Number baseline.
    describe('bigint high-volume aggregation invariance (AG-16608)', () => {
        const N = HIGH_VOLUME_COUNT;

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint bubble series identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createChart,
                    magnitudePair(
                        {
                            series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' }],
                            axes: STRIPPED_NUMBER_AXES,
                        },
                        (toValue) =>
                            Array.from({ length: N }, (_, i) => ({ x: toValue(i + 1), y: toValue(sig(i)), size: 5 })),
                        scaleToBigIntFinite
                    )
                );
            }
        );

        it('renders high-volume ISO-string x identically to numeric epoch x on a time axis', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                isoEpochPair(
                    { series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' }], axes: STRIPPED_TIME_AXES },
                    N,
                    (x, i) => ({ x, y: Math.sin(i / 10), size: 5 })
                )
            );
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        // Size is not scaled: marker radius is screen-space and must stay constant across magnitudes.
        const points = (xy: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            xy.map(([x, y]) => ({ x: toValue(x), y: toValue(y), size: 5 }));

        it('positions a bubble series identically when x/y scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' }], axes: STRIPPED_NUMBER_AXES },
                    points([
                        [1, 3],
                        [2, 4],
                        [3, 5],
                    ])
                )
            );
        });
    });

    describe('AG-18413 empty-string keys', () => {
        type NodeDatum = { point: { size: number }; label?: { text?: string } };
        const nodeData = (c: AgChartInstance) =>
            (deproxy(c).series[0] as unknown as { getNodeData(): NodeDatum[] }).getNodeData();
        const nodeSizes = (c: AgChartInstance) => nodeData(c).map((d) => d.point.size);
        const labelTexts = (c: AgChartInstance) => nodeData(c).map((d) => d.label?.text);

        const bubbleOptions = (seriesOverrides: object) => {
            const options = {
                data: [
                    { x: 1, y: 1, s: 10, l: 'a' },
                    { x: 2, y: 2, s: 20, l: 'b' },
                    { x: 3, y: 3, s: 30, l: 'c' },
                ],
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', ...seriesOverrides }],
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            } as AgCartesianChartOptions;
            prepareTestOptions(options);
            return options;
        };

        const createBubble = async (seriesOverrides: object) => {
            chart = AgCharts.create(bubbleOptions(seriesOverrides));
            await waitForChartStability(chart);
        };

        it('renders default-size markers when sizeKey is an empty string (TC1)', async () => {
            await createBubble({ sizeKey: '' });

            expect(nodeSizes(chart)).toEqual([7, 7, 7]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('keeps rendering when a sizeKey-less series is updated in place (TC1)', async () => {
            await createBubble({ sizeKey: '' });

            await chart.update(bubbleOptions({ sizeKey: '' }));
            await waitForChartStability(chart);

            expect(nodeSizes(chart)).toEqual([7, 7, 7]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('treats an empty labelKey as an omitted labelKey (TC3)', async () => {
            await createBubble({ sizeKey: 's', labelKey: '' });
            const emptyKeySizes = nodeSizes(chart);
            const emptyKeyLabels = labelTexts(chart);

            chart.destroy();
            await createBubble({ sizeKey: 's' });

            expect(emptyKeySizes).toEqual(nodeSizes(chart));
            expect(emptyKeyLabels).toEqual(labelTexts(chart));
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('falls back to the sizeKey value for label text when labels are enabled and labelKey is empty (TC3)', async () => {
            await createBubble({ sizeKey: 's', labelKey: '', label: { enabled: true } });
            const emptyKeyLabels = labelTexts(chart);

            chart.destroy();
            await createBubble({ sizeKey: 's', label: { enabled: true } });

            expect(emptyKeyLabels).toEqual(labelTexts(chart));
            expect(emptyKeyLabels).toEqual(['10', '20', '30']);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
});

describe('BubbleSeries bigint size domain (AG-16608)', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const buildOptions = (sizeDomain: [number, number] | [bigint, bigint]): AgCartesianChartOptions => ({
        data: [
            { x: 0, y: 10, size: 20 },
            { x: 1, y: 60, size: 45 },
            { x: 2, y: 35, size: 80 },
        ],
        series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', sizeDomain } as never],
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        },
    });

    it('renders a bigint sizeDomain identically to numbers', async () => {
        await expectPixelIdenticalAcrossUpdate(ctx, createChart, buildOptions([0, 100]), buildOptions([0n, 100n]));
    });
});

describe('BubbleSeries undefined size value emits no warning on visible-range computation (AG-17575)', () => {
    setupMockConsole();
    setupMockCanvas();

    it('skips undefined sizes gracefully when sizing a datum for the visible range', async () => {
        const validCount = 10;
        const options: AgCartesianChartOptions = {
            data: [
                ...Array.from({ length: validCount }, (_, i) => ({ x: i, y: i, s: 1 + (i % 5) })),
                ...Array.from({ length: 10 }, (_, i) => ({ x: validCount + i, y: i })),
            ],
            series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's' }],
            legend: { enabled: false },
        };
        prepareTestOptions(options);
        const chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const series = deproxy(chart).series[0] as unknown as {
            xCoordinateRange(xValue: number, pixelSize: number, index: number): [number, number];
        };
        // The visible-range scan sizes each datum via xCoordinateRange; the missing-size rows
        // start at validCount.
        series.xCoordinateRange(validCount, 0, validCount);

        expectWarningsCalls().toMatchInlineSnapshot(`[]`);

        chart.destroy();
    });
});
