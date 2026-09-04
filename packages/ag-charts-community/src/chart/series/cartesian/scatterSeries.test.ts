import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgPatternName,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptions,
    AgScatterSeriesStylerParams,
    AgScatterSeriesStylerResult,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    BIG,
    NEG_BIG,
    STRIPPED_NUMBER_AXES,
    expectPixelIdenticalAcrossMagnitude,
    magnitudePair,
} from '../../test/bigintExamples';
import * as examples from '../../test/examples';
import { type MockScatterStyler, newFreezableMock } from '../../test/freezableMock';
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
    hoverAction,
    looserSnapshotDefaults,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from '../../test/utils';

describe('ScatterSeries', () => {
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
                    type: 'scatter',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    size: 50,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.SCATTER_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [ScatterSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.SCATTER_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 10 },
                    { x: undefined, y: 20 },
                    { x: 'B', y: 15 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [ScatterSeries-1 / xValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 10 },
                    { x: undefined, y: 20 },
                    { x: 'B', y: 15 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', allowNullKeys: true } as any],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 10 },
                    { x: null, y: 20 },
                    { x: undefined, y: 30 },
                    { x: 'B', y: 15 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', allowNullKeys: true } as any],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('gradient fill', () => {
        it('should render scatter series with a vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.07, 5));
        });

        it('should render scatter series with a horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.07));
        });

        it('should render scatter series with a series bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a series bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                            bounds: 'series',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                    },
                },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with an axes bound vertical linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'axis',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                        min: 100,
                        max: 500,
                    },
                },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with an axes bound horizontal linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            rotation: 90,
                            bounds: 'axis',
                        },
                        size: 20,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
                axes: {
                    y: {
                        position: 'left',
                        type: 'number',
                        min: 60,
                        max: 100,
                    },
                    x: {
                        position: 'bottom',
                        type: 'number',
                    },
                },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a default radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                        },
                        size: 30,
                        strokeWidth: 0,
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a series bound radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
                            gradient: 'radial',
                            bounds: 'series',
                        },
                        size: 30,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render scatter series with a radial gradient fill', async () => {
            const options: AgChartOptions = {
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'gradient',
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
                        size: 30,
                        strokeWidth: 0,
                    } as AgScatterSeriesOptions,
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
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
                ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'weight',
                        yKey: 'height',
                        fill: {
                            type: 'pattern',
                            pattern,
                        },
                        size: 20,
                        stroke: 'orange',
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(looserSnapshotDefaults(0.1, 40));
        });
    });

    it('should render scatter series with reversed axes', async () => {
        const options: AgChartOptions = {
            ...examples.SIMPLE_SCATTER_CHART_EXAMPLE,
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
        await compare(PATTERN_SNAPSHOT_DEFAULTS);
    });

    // One CASE per control on the scatter-series-test page (Randomise / Add / Remove), plus the initial
    // load. Scatter is marker-only, so every CASE asserts over `series[0]/marker[*]` and its labels.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        // Pinned x/y domains make every data mutation below provably non-scale-affecting, so the markers
        // are the only scene change.
        const scatterOptions = (
            data: Array<{ x: number; y: number }>,
            seriesOverrides: object = {}
        ): AgCartesianChartOptions =>
            prepareTestOptions({
                data,
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 20, ...seriesOverrides }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 6 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            });

        const DATA = [
            { x: 1, y: 40 },
            { x: 2, y: 120 },
            { x: 3, y: 80 },
            { x: 4, y: 160 },
            { x: 5, y: 60 },
        ];
        const MOVED = [
            { x: 1, y: 150 },
            { x: 2, y: 50 },
            { x: 3, y: 170 },
            { x: 4, y: 30 },
            { x: 5, y: 110 },
        ];

        const markerKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/marker\[/.test(k));
        const markerCount = (sample: SceneGeometrySample) => markerKeys(sample).length;

        // Scatter skips the animation batch on every data update (only the initial load animates), so
        // updates SNAP.
        const captureSnap = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // Markers scale in from zero size during the `initial` phase — their bbox edges slide out from the
        // fixed scaling centre — while the labels fade in during `trailing`; marker opacity holds at 1.
        it('initial load: markers scale in and labels fade in', async () => {
            chart = AgCharts.create(scatterOptions(DATA, { labelKey: 'x', label: { enabled: true } }));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // Anti-vacuity: every marker starts collapsed but fully opaque (a scale-in, not a fade) and
            // every label starts hidden, so neither `increases` can pass vacuously.
            for (const key of markerKeys(trajectory[0])) {
                expect(trajectory[0].get(key)!.width, `${key} width @ frame 0`).toBeLessThanOrEqual(0.001);
                expect(trajectory[0].get(key)!.opacity, `${key} opacity @ frame 0`).toBeGreaterThanOrEqual(0.99);
            }
            for (const key of [...trajectory[0].keys()].filter((k) => /^series\[0\]\/labels\/text\[.+\]$/.test(k))) {
                expect(trajectory[0].get(key)!.opacity, `${key} opacity @ frame 0`).toBeLessThanOrEqual(0.001);
            }
            expectSceneTrajectory(trajectory, {
                'series[0]/marker[*]': {
                    width: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    height: { during: 'initial', expect: ['increases', 'progresses', 'bounded'] },
                    x: { during: 'initial', expect: ['decreases', 'bounded'] },
                    y: { during: 'initial', expect: ['decreases', 'bounded'] },
                    opacity: 'constant',
                },
                'series[0]/labels/text[*]': {
                    opacity: { during: 'trailing', expect: ['increases', 'bounded'], settlesAt: 1 },
                },
            });
        });

        // "Randomise" — every y-value changes. Scatter skips the batch, so the markers snap to their
        // new heights; the captured trajectory is constant from the first frame.
        it('update data: markers snap to their new positions without tweening', async () => {
            const { before, trajectory, after } = await captureSnap(scatterOptions(DATA), () =>
                chart.updateDelta({ data: MOVED })
            );
            // Anti-vacuity: the update genuinely moved the markers (constancy would pass vacuously if
            // nothing changed) — a marker's settled y differs from its pre-update y by a wide margin.
            const dy = Math.abs(after.get('series[0]/marker[1]')!.y - before.get('series[0]/marker[1]')!.y);
            expect(dy, 'marker[1] y shift').toBeGreaterThan(50);
            expectNoAnimation(trajectory);
        });

        // "Add" — a new datum. Scatter skips the batch, so the entrant appears at full size on the
        // first captured frame (no scale-in) and the survivors are untouched.
        it('add point: the new marker appears at full size without animating', async () => {
            const { before, trajectory, after } = await captureSnap(scatterOptions(DATA), () =>
                chart.updateDelta({ data: [...DATA, { x: 0.5, y: 100 }] })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(6);
            // Anti-vacuity: the entrant is already at full size on frame 0 — contrast the initial load,
            // where a marker scales in from zero — proving add does not animate.
            expect(trajectory[0].get('series[0]/marker[0.5]')!.width, 'entrant width @ frame 0').toBeGreaterThan(15);
            expectNoAnimation(trajectory);
        });

        // "Remove" — drop two data points. Scatter skips the batch, so the dropped markers leave the
        // scene at once (no fade-out) and the survivors are untouched.
        it('remove points: dropped markers leave the scene at once', async () => {
            const { before, trajectory, after } = await captureSnap(scatterOptions(DATA), () =>
                chart.updateDelta({ data: DATA.slice(0, 3) })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(3);
            // Anti-vacuity: the dropped markers are already gone on frame 0 (a fade-out would keep them
            // present, collapsing over the trajectory) — proving remove does not animate.
            expect(markerCount(trajectory[0])).toBe(3);
            expectNoAnimation(trajectory);
        });

        // The animated route must settle at exactly the pixels a snapped render produces. One chart per
        // test — the mock canvas only snapshots the first chart created.
        it('sanity: update data endpoints match static renders', async () => {
            const options = scatterOptions(DATA);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: MOVED,
            });
        });

        it('sanity: add point endpoints match static renders', async () => {
            const options = scatterOptions(DATA);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: [...DATA, { x: 0.5, y: 100 }],
            });
        });
    });

    describe('AG-11673 styler', () => {
        type D = { height: number; weight: number; age: number; name: string };
        type C = unknown;
        type M = MockScatterStyler<D, C>;
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
                (params: AgScatterSeriesStylerParams<D, C>): AgScatterSeriesStylerResult | undefined => {
                    // FIXME: there's no `params.title` value
                    if (params.seriesId === 'ScatterSeries-1') {
                        return {
                            fill: {
                                type: 'gradient',
                                colorStops: [{ color: 'dodgerblue', stop: 0.1 }, { color: 'lightcyan' }],
                            },
                            stroke: 'lime', // not ignored (but no effect)
                        };
                    } else if (params.seriesId === 'ScatterSeries-2') {
                        return { shape: 'heart', fill: 'fuchsia', lineDash: [5, 3] };
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
                                type: 'scatter',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
                                context: c1,

                                styler: styler.frozen,
                                shape: 'star', // not ignored
                                strokeWidth: 0, // not ignored
                                fill: 'magenta', // ignored
                            },
                            {
                                type: 'scatter',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
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
                                type: 'scatter',
                                title: 'Male',
                                data: maleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
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
                                type: 'scatter',
                                title: 'Female',
                                data: femaleHeightWeight,
                                xKey: 'height',
                                yKey: 'weight',
                                size: 30,
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
                const itemStyler = (params: AgScatterSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
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
                            type: 'scatter',
                            title: 'Male',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 30,

                            styler: styler.frozen,
                            itemStyler,
                            shape: 'star', // not ignored
                            strokeWidth: 0, // not ignored
                            fill: 'magenta', // ignored
                        },
                        {
                            type: 'scatter',
                            title: 'Female',
                            data: femaleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 30,

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
        describe('size', () => {
            beforeEach(async () => {
                const opts: AgCartesianChartOptions<D, C> = {
                    series: [
                        {
                            type: 'scatter',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 4,
                            styler: () => {
                                return { size: 45 };
                            },
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
                const itemStyler = (params: AgScatterSeriesItemStylerParams<D, C>): AgSeriesMarkerStyle => {
                    return { size: params.datum.weight > 75 ? 60 : 10 };
                };
                const opts: AgCartesianChartOptions<D, C> = {
                    series: [
                        {
                            type: 'scatter',
                            data: maleHeightWeight,
                            xKey: 'height',
                            yKey: 'weight',
                            size: 20,
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
        });
    });

    describe('showInLegend', () => {
        const commonOptions = {
            series: [
                {
                    type: 'scatter',
                    data: [{ x: 10, y: 20 }],
                    xKey: 'x',
                    yKey: 'y',
                    title: 'Male',
                },
                {
                    type: 'scatter',
                    data: [{ x: 20, y: 20 }],
                    xKey: 'x',
                    yKey: 'y',
                    title: 'Female',
                },
            ],
            legend: {},
        } satisfies AgCartesianChartOptions;

        it('should hide scatter series from legend when showInLegend is false', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'Two series, only female series should be shown in legend' },
                series: [commonOptions.series[0], { ...commonOptions.series[1], showInLegend: false }],
            });

            chart = AgCharts.create(options);
            await compare();
        });

        it('should show scatter series in legend when showInLegend is true (default)', async () => {
            const options = prepareTestOptions({
                ...commonOptions,
                title: { text: 'One series, only male series should be shown in legend' },
                series: [{ ...commonOptions.series[0], showInLegend: true }],
            });

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('predict axes', () => {
        it('number', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: 1,
                        iphone: 140,
                    },
                    {
                        quarter: 2,
                        iphone: 124,
                    },
                    {
                        quarter: 3,
                        iphone: 112,
                    },
                    {
                        quarter: 4,
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('category', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('time', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        quarter: new Date('2018-01-01'),
                        iphone: 140,
                    },
                    {
                        quarter: new Date('2018-04-01'),
                        iphone: 124,
                    },
                    {
                        quarter: new Date('2018-07-01'),
                        iphone: 112,
                    },
                    {
                        quarter: new Date('2018-10-01'),
                        iphone: 118,
                    },
                ],
                series: [{ type: 'scatter', xKey: 'quarter', yKey: 'iphone' }],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { He_V: 10, He_P: 95, Ne_V: 10, Ne_P: 90, Ar_V: 10, Ar_P: 80 },
                    { He_V: 15, He_P: 81, Ne_V: 15, Ne_P: 80, Ar_V: 15, Ar_P: 60 },
                    { He_V: 20, He_P: 68, Ne_V: 20, Ne_P: 70, Ar_V: 20, Ar_P: 40 },
                ],
                series: [
                    { type: 'scatter', xKey: 'He_V', yKey: 'He_P', yName: 'Helium' },
                    { type: 'scatter', xKey: 'Ne_V', yKey: 'Ne_P', yName: 'Neon' },
                    { type: 'scatter', xKey: 'Ar_V', yKey: 'Ar_P', yName: 'Argon' },
                ],
            },
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a scatter series with out-of-safe-range bigint x and y values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: BIG, y: BIG },
                        { x: BIG * 2n, y: NEG_BIG },
                        { x: NEG_BIG, y: BIG * 2n },
                    ],
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                    axes: { x: { type: 'number' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a scatter series with ISO-8601 datetime-string x values on a time axis', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { time: '2024-01-15T09:00:00Z', y: 12 },
                        { time: '2024-01-15T10:30:00Z', y: 15 },
                        { time: '2024-01-15T11:45:00Z', y: 11 },
                    ],
                    series: [{ type: 'scatter', xKey: 'time', yKey: 'y' }],
                    axes: { x: { type: 'time' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const points = (xy: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            xy.map(([x, y]) => ({ x: toValue(x), y: toValue(y) }));

        it('positions a scatter series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    points([
                        [1, 3],
                        [2, 4],
                        [3, 5],
                    ])
                )
            );
        });

        it('positions a straddling-zero scatter series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    points([
                        [-3, 4],
                        [2, -5],
                        [4, 3],
                    ])
                )
            );
        });
    });

    describe('aggregation on a reversed axis', () => {
        const aggregatedOptions = (reverse: { x?: boolean; y?: boolean } = {}): AgCartesianChartOptions => ({
            data: Array.from({ length: 300 }, (_, i) => ({ x: i, y: (i * 7) % 100 })),
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y', maxRenderedItems: 200 }],
            axes: {
                x: { type: 'number', position: 'bottom', reverse: reverse.x ?? false },
                y: { type: 'number', position: 'left', reverse: reverse.y ?? false },
            },
            legend: { enabled: false },
        });

        const expectSameMarkersWhenReversed = async (reverse: { x?: boolean; y?: boolean }) => {
            chart = AgCharts.create(prepareTestOptions(aggregatedOptions()));
            await waitForChartStability(chart);
            const expected = getAggregatedMarkerXValues(chart);
            expect(expected.length).toBeGreaterThan(0);
            expect(expected.length).toBeLessThan(300);

            await chart.update(prepareTestOptions(aggregatedOptions(reverse)));
            await waitForChartStability(chart);
            expect(getAggregatedMarkerXValues(chart)).toEqual(expected);
        };

        it('should render the same markers when the x-axis is reversed and maxRenderedItems is exceeded', async () => {
            await expectSameMarkersWhenReversed({ x: true });
        });

        it('should render the same markers when the y-axis is reversed and maxRenderedItems is exceeded', async () => {
            await expectSameMarkersWhenReversed({ y: true });
        });

        it('should render the same markers when both axes are reversed and maxRenderedItems is exceeded', async () => {
            await expectSameMarkersWhenReversed({ x: true, y: true });
        });
    });
    describe('AG-18413 a key naming no column', () => {
        const nodeData = (c: AgChartInstance) =>
            (deproxy(c).series[0] as unknown as { getNodeData(): unknown[] }).getNodeData();

        const createScatter = async (seriesOverrides: object) => {
            const options = {
                data: [
                    { x: 1, y: 10, l: 'a' },
                    { x: 2, y: 20, l: 'b' },
                    { x: 3, y: 30, l: 'c' },
                ],
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', ...seriesOverrides }],
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

        it.each([
            ['an empty labelKey (TC3)', { labelKey: '', label: { enabled: true } }, `''`],
            ['an unmatched labelKey', { labelKey: 'nope', label: { enabled: true } }, `'nope'`],
        ] as [string, object, string][])('renders nothing and warns for %s', async (_name, overrides, key) => {
            await createScatter(overrides);

            expect(nodeData(chart)).toEqual([]);
            expect(deproxy(chart).series[0].hasData).toBe(false);
            expectWarningsCalls().toEqual([
                [`AG Charts - the key ${key} was not found in any data element for ScatterSeries-1.`],
            ]);
        });

        it('keeps the series populated for a labelKey that does name a column', async () => {
            await createScatter({ labelKey: 'l', label: { enabled: true } });

            expect(nodeData(chart)).toHaveLength(3);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
});
