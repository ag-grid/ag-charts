import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesStylerParams,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    Padding,
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
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import { type MockBarStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type { CartesianOrPolarTestCase, SceneFrameInvariant, SceneNodeExpectation } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    PATTERN_SNAPSHOT_DEFAULTS,
    type SceneGeometrySample,
    axisReflowSpec,
    cartesianChartAssertions,
    clickAction,
    compareImageSnapshot,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
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
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'bar'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['bar'] }),
        ...extra,
    };
};

const EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    ...mixinReversedAxesCases({
        COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['bar'] }),
        },
        COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['bar'] }),
        },
        STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['bar'] }),
        },
        BAR_TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.BAR_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'unit-time' }, seriesTypes: ['bar'] }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_NORMALISED_SINGLE_BAR_COLUMN_NUMBER_Y_AXIS: {
            options: {
                ...examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
                series: [
                    {
                        ...(examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS.series?.[0] as AgBarSeriesOptions),
                        type: 'bar',
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 1),
            }),
        },
        UNSTACKED_NORMALISED_SINGLE_BAR_COLUMN_NUMBER_Y_AXIS: {
            options: {
                ...examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
                series: [
                    {
                        ...(examples.STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS.series?.[0] as AgBarSeriesOptions),
                        type: 'bar',
                        stacked: false,
                        normalizedTo: 100,
                    },
                ],
            } satisfies AgCartesianChartOptions,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 1),
            }),
        },
        STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS: {
            options: examples.STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        COLUMN_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        COLUMN_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        COLUMN_SINGLE_DATE_CATEGORY_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_CATEGORY_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
        },
        COLUMN_SINGLE_DATE_TIME_AXIS: {
            options: examples.COLUMN_SINGLE_DATE_TIME_AXIS,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['bar'] }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 5),
            }),
        },
        GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 2),
            }),
        },
        STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 2),
            }),
        },
        STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: {
            options: examples.STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: {
            options: examples.GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
        },
        STACKED_COLUMN_PATTERN_FILL: {
            options: examples.STACKED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
        GROUPED_COLUMN_SMALL_PATTERN_FILL: {
            options: examples.GROUPED_COLUMN_SMALL_PATTERN_FILL,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 4),
            }),
            imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
        },
    }),
    BAR_NULL_CATEGORY_KEY: {
        options: examples.BAR_NULL_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
        warnings: [['AG Charts - invalid value of type [object] for [BarSeries-1 / xValue] ignored:', '[null]']],
    },
    BAR_NULL_CATEGORY_KEY_ALLOWED: {
        options: examples.BAR_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
    },
    BAR_UNDEFINED_CATEGORY_KEY: {
        options: examples.BAR_UNDEFINED_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
        warnings: [
            ['AG Charts - invalid value of type [undefined] for [BarSeries-1 / xValue] ignored:', '[undefined]'],
        ],
    },
    BAR_UNDEFINED_CATEGORY_KEY_ALLOWED: {
        options: examples.BAR_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
    },
    BAR_NULL_AND_UNDEFINED_KEYS: {
        options: examples.BAR_NULL_AND_UNDEFINED_KEYS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
    },
};

const INVALID_DATA_EXAMPLES: Record<string, CartesianOrPolarTestCase> = {
    COLUMN_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('BarSeries', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await compareImageSnapshot(chart, ctx, defaults);
    };

    describe('#create', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        test('no data', async () => {
            chart = AgCharts.create(prepareTestOptions({ data: [], series: [{ type: 'bar', xKey: 'x', yKey: 'y' }] }));
            await compare();
        });

        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                if (example.warnings) {
                    for (const [index, message] of example.warnings.entries()) {
                        expect(console.warn).toHaveBeenNthCalledWith(
                            index + 1,
                            ...(Array.isArray(message) ? message : [message])
                        );
                    }
                }
                if (!example.warnings?.length) {
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
                await compare(example.imageSnapshotDefaults);

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare(example.imageSnapshotDefaults);
                }
            }
        );

        it('should handle missing values in stacked bar charts without rendering spurious bars', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                        mac: 20,
                        ipad: 14,
                        wearables: 12,
                        services: 30,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                        mac: 20,
                        ipad: 18,
                        wearables: 14,
                        services: null, // Missing value - should not render a bar
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        wearables: null, // Missing value - should not render a bar
                        services: 36,
                    },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', yName: 'iPad', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', yName: 'Wearables', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services', stacked: true },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Visual snapshot to ensure no spurious bars are rendered
            await compare();
        });

        it('should handle missing properties in stacked bar charts without rendering spurious bars', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                        mac: 20,
                        ipad: 14,
                        wearables: 12,
                        services: 30,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                        mac: 20,
                        ipad: 18,
                        wearables: 14,
                        // services: null, // Missing property - should not render a bar
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        // wearables: null, // Missing property - should not render a bar
                        services: 36,
                    },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', yName: 'iPad', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', yName: 'Wearables', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services', stacked: true },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Visual snapshot to ensure no spurious bars are rendered
            await compare();
        });
    });

    // Initial-load reveals and data add/remove animations are pinned per-frame by the trajectory
    // CASEs ('standalone: initial load', the integrated initial-load variants, spike CASE 2, and
    // 'remove data') in the suites below.

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        // Update-animation trajectories are pinned by spike CASE 1 and the 'sanity: randomise'
        // endpoint guard; no per-ratio snapshots remain for the plain update.

        // Re-add paint fidelity only (palette and label pixels are invisible to the geometry
        // sampler): CASE 10 pins the full toggle trajectory, so just a mid-flight and settled
        // frame of the re-add leg are snapshotted.
        for (const ratio of [1.5, 2]) {
            it(`for BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgChartOptions = { ...examples.BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 };
                prepareTestOptions(options);
                const optionsSeries = options.series;
                const reducedSeries = [...(optionsSeries?.slice(0, 2) ?? [])];

                if (ratio > 1) {
                    options.series = reducedSeries;
                }

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                const testRatio = ratio > 1 ? ratio - 1 : ratio;
                animate(1200, testRatio);

                if (ratio > 1) {
                    options.series = optionsSeries;
                } else {
                    options.series = reducedSeries;
                }

                await chart.update(options);

                await waitForChartStability(chart);
                await compare();
            });
        }
    });

    // SPIKE: frame-trajectory invariant tests. Instead of pixel-comparing frozen ratios, step the
    // animation frame-by-frame and assert structural invariants over the whole trajectory (monotonicity,
    // dimension isolation, bounds, progression, endpoints). See spyOnAnimationFrames in chart/test/utils.ts.
    describe('animation frame-trajectory (spike)', () => {
        const frames = spyOnAnimationFrames();

        // The pinned 0-100 y-domain makes data updates within it provably non-scale-affecting.
        const columnOptions = (data: Array<{ x: string; y: number }>): AgChartOptions => {
            const options: AgChartOptions = {
                data,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 100 },
                },
            };
            return prepareTestOptions(options);
        };

        // CASE 1 — non-scale-affecting data update on a vertical (column) series. The changed bar should
        // grow/shrink in one dimension only, while sibling bars and the changed bar's x/width stay put.
        it('CASE 1: column data-update animates height only, monotonically, without disturbing siblings', async () => {
            chart = AgCharts.create(
                columnOptions([
                    { x: 'A', y: 100 },
                    { x: 'B', y: 40 },
                    { x: 'C', y: 70 },
                ])
            );
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            const before = sampleScene();
            expect([...before.keys()].filter((k) => k.startsWith('series[0]/rect'))).toHaveLength(3);

            await chart.updateDelta({
                data: [
                    { x: 'A', y: 100 },
                    { x: 'B', y: 20 },
                    { x: 'C', y: 70 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();

            // Endpoints: first frame is the before-state, last frame is the after-state.
            expectSceneSamplesMatch(trajectory[0], before);
            expectSceneSamplesMatch(trajectory.at(-1)!, after);

            // Bar B shrinks in height only (top edge rises, x/width/opacity implicitly constant);
            // EVERYTHING else in the scene — sibling bars, both axes, gridlines, labels — must not move.
            expectSceneTrajectory(trajectory, {
                'series[0]/rect[B]': {
                    height: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                    y: { during: 'update', expect: ['increases', 'bounded'] },
                },
            });
        });

        // CASE 2 — add + remove. The entering bar grows in from height 0; the leaving bar collapses to 0.
        // Adding/removing a category rebalances the sibling bands and the category axis, so sibling/axis
        // horizontal movement is expected — but sibling HEIGHTS and the whole value axis must not move.
        it('CASE 2: added bar grows in and removed bar collapses, monotonically', async () => {
            // ADD: A,B,C -> A,B,C,D.
            chart = AgCharts.create(
                columnOptions([
                    { x: 'A', y: 100 },
                    { x: 'B', y: 40 },
                    { x: 'C', y: 70 },
                ])
            );
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            await chart.updateDelta({
                data: [
                    { x: 'A', y: 100 },
                    { x: 'B', y: 40 },
                    { x: 'C', y: 70 },
                    { x: 'D', y: 50 },
                ],
            });
            const addTrajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const added = sampleScene();
            expect([...added.keys()].filter((k) => k.startsWith('series[0]/rect'))).toHaveLength(4);

            // Adding D narrows every band, so existing bars shift LEFT (x decreases) and narrow (width
            // decreases) during the update phase; D's own band position never moves — it only grows in
            // vertically during the add phase. The axis rebalances with the bands: labels/ticks may only
            // shift left, and D's entering label/tick may only fade in during the add/remove windows.
            // 'progresses' on the band rebalance guards against the update snapping in a single frame.
            const shiftLeftAndNarrow = {
                x: { during: 'update', expect: ['decreases', 'progresses'] },
                width: { during: 'update', expect: ['decreases', 'progresses'] },
            } as const;
            expectSceneTrajectory(addTrajectory, {
                'series[0]/rect[D]': {
                    height: { during: 'add', expect: ['increases', 'progresses', 'bounded'] },
                    y: { during: 'add', expect: ['decreases', 'bounded'] },
                },
                'series[0]/rect[A]': shiftLeftAndNarrow,
                'series[0]/rect[B]': shiftLeftAndNarrow,
                'series[0]/rect[C]': shiftLeftAndNarrow,
                ...axisReflowSpec('bottom', { shift: 'left' }),
            });
            expect(addTrajectory[0].get('series[0]/rect[D]')?.height ?? 0).toBeLessThanOrEqual(0.001);

            // REMOVE: A,B,C,D -> A,B,C. D collapses to 0 and leaves the scene.
            await chart.updateDelta({
                data: [
                    { x: 'A', y: 100 },
                    { x: 'B', y: 40 },
                    { x: 'C', y: 70 },
                ],
            });
            const removeTrajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            expect([...sampleScene().keys()].filter((k) => k.startsWith('series[0]/rect'))).toHaveLength(3);

            // Removing D widens every band: the mirror image of the add — bars shift RIGHT and widen
            // during the update phase while D collapses during the remove phase, and the axis
            // labels/ticks shift right with the bands (D's label/tick fade out and leave).
            const shiftRightAndWiden = {
                x: { during: 'update', expect: ['increases', 'progresses'] },
                width: { during: 'update', expect: ['increases', 'progresses'] },
            } as const;
            expectSceneTrajectory(removeTrajectory, {
                'series[0]/rect[D]': {
                    height: { during: 'remove', expect: ['decreases', 'progresses'] },
                    y: { during: 'remove', expect: 'increases' },
                },
                'series[0]/rect[A]': shiftRightAndWiden,
                'series[0]/rect[B]': shiftRightAndWiden,
                'series[0]/rect[C]': shiftRightAndWiden,
                ...axisReflowSpec('bottom', { shift: 'right' }),
            });
            expect(removeTrajectory[0].get('series[0]/rect[D]')!.height).toBeGreaterThan(1);
            expect(removeTrajectory.at(-1)!.get('series[0]/rect[D]')?.height ?? 0).toBeLessThanOrEqual(0.001);
        });

        // CASE 5 — scale-affecting update (the LIMIT case). Growing one datum beyond the domain rescales
        // every bar via the shared y-scale AND reflows the layout: as the tick labels grow (70 -> 200) the
        // y-axis gutter widens, shifting and narrowing every bar horizontally. So geometric dimension
        // ISOLATION does not hold here (not even x/width) — but every movement is still directionally
        // constrained: monotonic heights/positions, one-way reflow shifts, and fade-in/out tick swaps.
        it('CASE 5: scale-affecting update rescales all bars monotonically (isolation does not hold)', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 50 },
                    { x: 'B', y: 40 },
                    { x: 'C', y: 70 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                // No pinned max — the domain grows with the data, rescaling every bar.
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0 },
                },
            };
            chart = AgCharts.create(prepareTestOptions(options));
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            const before = sampleScene();

            await chart.updateDelta({
                data: [
                    { x: 'A', y: 50 },
                    { x: 'B', y: 200 },
                    { x: 'C', y: 70 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();

            // Endpoint equality holds for the bars only: the domain change churns axis tick-label nodes
            // (new ticks fade in mid-animation, stale ones are garbage-collected after it), so whole-scene
            // equality is not a valid invariant for a scale-affecting update.
            const rectsOf = (sample: SceneGeometrySample) =>
                new Map([...sample].filter(([key]) => key.startsWith('series[0]/rect')));
            expectSceneSamplesMatch(rectsOf(trajectory[0]), rectsOf(before));
            expectSceneSamplesMatch(rectsOf(trajectory.at(-1)!), rectsOf(after));

            // The grown bar B rises; the fixed-value bars A and C shrink as the domain expands beneath
            // them. The wider tick labels (70 -> 200) widen the y-axis gutter, which shifts both axes'
            // sub-groups right and narrows the plot, compressing bars/ticks/labels leftwards. The domain
            // growth also swaps the y tick set: old ticks/labels/gridlines fade out and leave the scene
            // while the new set fades in.
            const rescales = (heightDirection: 'increases' | 'decreases') =>
                ({
                    height: { during: 'update', expect: [heightDirection, 'progresses'] },
                    y: { during: 'update', expect: heightDirection === 'increases' ? 'decreases' : 'increases' },
                    x: { during: 'update', expect: 'decreases' },
                    width: { during: 'update', expect: 'decreases' },
                }) as const;
            expectSceneTrajectory(trajectory, {
                'series[0]/rect[B]': rescales('increases'),
                'series[0]/rect[A]': rescales('decreases'),
                'series[0]/rect[C]': rescales('decreases'),
                ...axisReflowSpec('bottom', { shift: 'left', translate: 'right' }),
                ...axisReflowSpec('left', { shift: 'up', translate: 'right', plotEdge: 'shrinks', grid: true }),
            });
        });

        // The stacked layers must tile contiguously on EVERY frame — a cross-node invariant that
        // only `frameInvariants` can express.
        it('CASE 10 (CRT-950): stacked layers stay contiguous while a sibling series is removed and re-added', async () => {
            const stackedContiguous: SceneFrameInvariant = {
                name: 'stack tiles contiguously',
                check: (frame) => {
                    const iphone = frame.get("series[0]/rect[Q1'18]");
                    const mac = frame.get("series[1]/rect[Q1'18]");
                    if (iphone == null || mac == null) return undefined;
                    const gap = Math.abs(mac.x - (iphone.x + iphone.width));
                    return gap > 1
                        ? `mac near edge (${mac.x.toFixed(2)}) != iphone far edge (${(iphone.x + iphone.width).toFixed(2)})`
                        : undefined;
                },
            };
            const bandReflow = (height: 'increases' | 'decreases') =>
                ({
                    'series[*]/rect[*]': {
                        height: { during: 'update', expect: [height, 'bounded'] },
                        width: { during: 'update', expect: 'bounded' },
                        x: { during: 'update', expect: 'bounded' },
                        y: { during: 'update', expect: 'bounded' },
                        // A re-added series' bars fade in at full size rather than growing.
                        opacity: {
                            during: ['update', 'add', 'trailing'],
                            expect: ['increases', 'bounded'],
                            settlesAt: 1,
                        },
                    },
                    'series[*]/labels/text[*]': {
                        opacity: {
                            during: ['update', 'add', 'trailing'],
                            expect: ['increases', 'bounded'],
                            settlesAt: 1,
                        },
                        x: { during: 'update', expect: 'bounded' },
                        y: { during: 'update', expect: 'bounded' },
                    },
                }) as const;

            const options: AgChartOptions = { ...examples.BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 };
            prepareTestOptions(options);
            const allSeries = options.series!;
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            // A removed series leaves chart.series immediately, so its exit is invisible to the sampler.
            await chart.update({ ...options, series: allSeries.slice(0, 2) });
            const removeTrajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(removeTrajectory, bandReflow('increases'), {
                frameInvariants: [stackedContiguous],
            });

            await chart.update({ ...options, series: allSeries });
            const addTrajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(addTrajectory, bandReflow('decreases'), {
                frameInvariants: [stackedContiguous],
            });
        });
    });

    // One CASE per control on the bar-series-test page, in standalone and integrated modes.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        const groupedSeries = (): NonNullable<AgCartesianChartOptions['series']> => [
            { type: 'bar', xKey: 'quarter', yKey: 'iphone' },
            { type: 'bar', xKey: 'quarter', yKey: 'mac' },
            { type: 'bar', xKey: 'quarter', yKey: 'services' },
        ];
        // The pinned 0-160 y-domain makes the data updates below provably non-scale-affecting.
        const groupedOptions = (mode?: 'integrated'): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data: [
                    { quarter: 'Q1', iphone: 140, mac: 16, services: 20 },
                    { quarter: 'Q2', iphone: 124, mac: 20, services: 30 },
                ],
                series: groupedSeries(),
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 160 },
                },
            };
            if (mode != null) {
                (options as AgChartOptions & { mode: string }).mode = mode;
            }
            return prepareTestOptions(options);
        };

        const rectCount = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/rect/.test(k)).length;

        const groupedCategoryOptions = () => {
            const options: AgChartOptions = { ...examples.INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE };
            return prepareTestOptions(options);
        };

        // The initial-load reveal: bars grow from the baseline along the value axis while their
        // bands land immediately (the crisp-pixel snap moves band coords by <1px, so 'bounded').
        const revealFromBaseline = (
            dim: 'height' | 'width',
            { progresses = true }: { progresses?: boolean } = {}
        ): Record<string, SceneNodeExpectation> => {
            const grow = {
                during: 'initial',
                expect: progresses
                    ? (['increases', 'progresses', 'bounded'] as const)
                    : (['increases', 'bounded'] as const),
            } as const;
            const holds = { during: ['initial', 'trailing'], expect: 'bounded' } as const;
            return {
                'series[*]/rect[*]':
                    dim === 'height'
                        ? {
                              height: grow,
                              y: { during: 'initial', expect: ['decreases', 'bounded'] },
                              x: holds,
                              width: holds,
                          }
                        : { width: grow, x: holds, y: holds, height: holds },
            };
        };

        const expectStartsCollapsed = (frame: SceneGeometrySample, key: string, dim: 'height' | 'width') => {
            const node = frame.get(key);
            expect(node, key).toBeDefined();
            expect(node![dim]).toBeLessThanOrEqual(0.1);
        };

        // Anti-vacuous guard for snap tests: the change must actually have landed in the scene.
        const expectSceneShifted = (before: SceneGeometrySample, after: SceneGeometrySample) => {
            const shifted = [...after].some(([key, props]) => {
                const prev = before.get(key);
                return (
                    prev != null &&
                    ['x', 'y', 'width', 'height'].some(
                        (p) => prev[p] != null && props[p] != null && Math.abs(props[p] - prev[p]) > 1
                    )
                );
            });
            expect(shifted).toBe(true);
        };

        // "Remove Series" — only the survivors' reflow is observable (the removed series' exit is not).
        it('remove series: surviving bars widen monotonically into the vacated band', async () => {
            const options = groupedOptions();
            const allSeries = options.series!;
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);

            const { trajectory, before, after } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.update({ ...options, series: allSeries.slice(0, 2) })
            );
            expect(rectCount(before)).toBe(6);
            expect(rectCount(after)).toBe(4);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': {
                    width: { during: 'update', expect: ['increases', 'progresses'] },
                    height: { during: 'update', expect: 'bounded' },
                    y: { during: 'update', expect: 'bounded' },
                    x: { during: 'update', expect: 'bounded' },
                },
            });
        });

        // "Add Series" — survivors narrow; the entering series fades in at full size.
        it('add series: existing bars narrow and entering bars fade in at full size', async () => {
            const options = groupedOptions();
            const allSeries = options.series!;
            options.series = allSeries.slice(0, 2);
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);

            const { trajectory, after } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.update({ ...options, series: allSeries })
            );
            expect(rectCount(after)).toBe(6);
            // The settling crisp-pixel snap moves heights by <1px, so 'bounded' rather than 'constant'.
            const narrow = {
                width: { during: 'update', expect: ['decreases', 'progresses'] },
                x: { during: 'update', expect: 'bounded' },
                height: { during: ['update', 'trailing'], expect: 'bounded' },
                y: { during: ['update', 'trailing'], expect: 'bounded' },
            } as const;
            expectSceneTrajectory(trajectory, {
                'series[0]/rect[*]': narrow,
                'series[1]/rect[*]': narrow,
                // The entering series spawns directly at its final band geometry and only fades in.
                'series[2]/rect[*]': {
                    width: { during: ['update', 'trailing'], expect: 'bounded' },
                    x: { during: ['update', 'trailing'], expect: 'bounded' },
                    height: { during: ['update', 'trailing'], expect: 'bounded' },
                    y: { during: ['update', 'trailing'], expect: 'bounded' },
                    opacity: {
                        during: ['update', 'add', 'trailing'],
                        expect: ['increases', 'progresses', 'bounded'],
                        settlesAt: 1,
                    },
                },
            });
            expect(trajectory[0].get('series[2]/rect[Q1]')?.opacity ?? 1).toBeLessThanOrEqual(0.001);
        });

        // "Randomise" — bars tween height only; bands and axes hold because the domain is pinned.
        it('randomise: all bars tween height only, monotonically toward their new values', async () => {
            const options = groupedOptions();
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);

            const { trajectory } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.updateDelta({
                    data: [
                        { quarter: 'Q1', iphone: 100, mac: 40, services: 60 },
                        { quarter: 'Q2', iphone: 150, mac: 10, services: 15 },
                    ],
                })
            );
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': {
                    height: { during: 'update', expect: ['monotonic', 'progresses', 'bounded'] },
                    y: { during: 'update', expect: ['monotonic', 'bounded'] },
                },
            });
        });

        // "Remove Data" — leaving bars collapse while the surviving band widens to fill the axis.
        it('remove data: last category collapses and the surviving band widens', async () => {
            const options = groupedOptions();
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);

            const { trajectory, after } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.updateDelta({ data: [{ quarter: 'Q1', iphone: 140, mac: 16, services: 20 }] })
            );
            expect(rectCount(after)).toBe(3);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[Q2]': {
                    height: { during: 'remove', expect: ['decreases', 'progresses'] },
                    y: { during: 'remove', expect: 'increases' },
                },
                'series[*]/rect[Q1]': {
                    width: { during: 'update', expect: ['increases', 'progresses'] },
                    x: { during: 'update', expect: 'bounded' },
                    height: { during: 'update', expect: 'bounded' },
                    y: { during: 'update', expect: 'bounded' },
                },
                // The surviving band recentres on the axis, so Q1's tick/label move right.
                ...axisReflowSpec('bottom', { shift: 'right' }),
            });
        });

        // A grouping switch re-creates the series (no grouped<->stacked morph exists), so it
        // replays the initial-load reveal.
        it('grouped -> stacked -> grouped: switch re-creates series with an initial-load reveal', async () => {
            // Re-created series bump the sampler's duplicate-key suffix (rect[Q1#2]) — match by prefix.
            const tileKey = (sample: SceneGeometrySample, i: number, quarter: string) => {
                const pattern = new RegExp(`^series\\[${i}\\]/rect\\[${quarter}(#\\d+)?\\]$`);
                const matches = [...sample.keys()].filter((k) => pattern.test(k));
                expect(matches, `series[${i}]/rect[${quarter}]`).toHaveLength(1);
                return sample.get(matches[0])!;
            };

            const options = groupedOptions();
            const allSeries = options.series! as AgBarSeriesOptions[];
            chart = AgCharts.create(options);
            const sampleScene = createSceneGeometrySampler(chart);

            // Mutated in place: fresh series objects would diff as removed+added, not a grouping change.
            for (const s of allSeries) s.stacked = true;
            const { trajectory: toStacked, after: stacked } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.update({ ...options, series: allSeries })
            );
            expectSceneTrajectory(toStacked, revealFromBaseline('height'));
            expectStartsCollapsed(toStacked[0], 'series[0]/rect[Q1#2]', 'height');
            for (const quarter of ['Q1', 'Q2']) {
                const [s0, s1, s2] = [0, 1, 2].map((i) => tileKey(stacked, i, quarter));
                // Stacked layers share the band x and tile bottom-up from the baseline.
                expect(Math.abs(s1.x - s0.x), quarter).toBeLessThanOrEqual(1);
                expect(Math.abs(s2.x - s0.x), quarter).toBeLessThanOrEqual(1);
                expect(Math.abs(s1.y + s1.height - s0.y), quarter).toBeLessThanOrEqual(1);
                expect(Math.abs(s2.y + s2.height - s1.y), quarter).toBeLessThanOrEqual(1);
            }

            for (const s of allSeries) delete s.stacked;
            const { trajectory: toGrouped, after: grouped } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.update({ ...options, series: allSeries })
            );
            expectSceneTrajectory(toGrouped, revealFromBaseline('height'));
            for (const quarter of ['Q1', 'Q2']) {
                const [s0, s1, s2] = [0, 1, 2].map((i) => tileKey(grouped, i, quarter));
                // Grouped bars partition the band left-to-right without overlap.
                expect(s1.x, quarter).toBeGreaterThanOrEqual(s0.x + s0.width - 1);
                expect(s2.x, quarter).toBeGreaterThanOrEqual(s1.x + s1.width - 1);
            }
        });

        // A direction flip re-creates the series: widths re-reveal from the left baseline.
        it('switch direction: bars re-reveal along the new value axis', async () => {
            const options = groupedOptions();
            // Default axes: explicit positions cannot follow the direction flip.
            delete options.axes;
            const allSeries = options.series! as AgBarSeriesOptions[];
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            for (const s of allSeries) s.direction = 'horizontal';
            const { trajectory } = await frames.captureUpdate(chart, sampleScene, () =>
                chart.update({ ...options, series: allSeries })
            );
            expectSceneTrajectory(trajectory, revealFromBaseline('width'));
            expectStartsCollapsed(trajectory[0], 'series[0]/rect[Q1#2]', 'width');
        });

        // Integrated mode: initial load must animate exactly as standalone does.
        it('integrated mode: initial load reveals bars from the baseline', async () => {
            chart = AgCharts.create(groupedOptions('integrated'));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(trajectory, revealFromBaseline('height'));
            expectStartsCollapsed(trajectory[0], 'series[0]/rect[Q1]', 'height');
        });

        // Integrated chart-type switches call resetAnimations() first: bars must re-grow from the
        // baseline instead of tweening from their old heights.
        it('integrated mode: resetAnimations before a data update replays the initial reveal', async () => {
            const options = groupedOptions('integrated');
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            // Not captureUpdate: the reset snaps survivors to the baseline before frame 0.
            chart.resetAnimations();
            await chart.updateDelta({
                data: [
                    { quarter: 'Q1', iphone: 100, mac: 40, services: 60 },
                    { quarter: 'Q2', iphone: 150, mac: 10, services: 15 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(trajectory, revealFromBaseline('height'));
            // Without the reset this would tween from the old height (140-worth of pixels).
            expectStartsCollapsed(trajectory[0], 'series[0]/rect[Q1]', 'height');
        });

        // A legend move must always snap: the product skips the batch when the layout rect changes.
        it('integrated mode: legend move snaps without tweening', async () => {
            const options = groupedOptions('integrated');
            options.legend = { position: 'bottom' };
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            // Not captureUpdate: a skipped batch lands the whole change before frame 0.
            const before = sampleScene();
            chart.skipAnimations();
            await chart.update({ ...options, legend: { position: 'right' } });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);
            expectSceneShifted(before, trajectory.at(-1)!);
        });

        // The create-time reveal in standalone mode (the integrated variants below re-run it via
        // resetAnimations; this pins the plain first render).
        it('standalone: initial load reveals bars from the baseline', async () => {
            chart = AgCharts.create(groupedOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(trajectory, revealFromBaseline('height'));
            expectStartsCollapsed(trajectory[0], 'series[0]/rect[Q1]', 'height');
        });

        // The grouped-category axis is what AG Grid integrated charts use for row groups.
        it('integrated mode: grouped-category chart reveals bars from the baseline on initial load', async () => {
            chart = AgCharts.create(groupedCategoryOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(trajectory, revealFromBaseline('height', { progresses: false }));
        });

        // Standalone has no skipAnimations() call — the layout-rect-change skip must cover it.
        it('standalone: legend move snaps without tweening', async () => {
            const options = groupedOptions();
            options.legend = { position: 'bottom' };
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const before = sampleScene();
            await chart.update({ ...options, legend: { position: 'right' } });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);
            expectSceneShifted(before, trajectory.at(-1)!);
        });

        // "Change Theme" — a restyle, not a data change: like the legend move it must snap.
        it('standalone: theme change snaps without tweening', async () => {
            const options = groupedOptions();
            options.theme = 'ag-default';
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const fillOf = () => (deproxy(chart).series[0] as any).properties.fill;
            const fillBefore = fillOf();
            await chart.update({ ...options, theme: 'ag-sheets' });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);
            // The sampler reads geometry only, so the palette swap is the change-landed signal.
            expect(fillOf()).not.toBe(fillBefore);
        });

        // Grouped-category data updates snap (no tween runs); the contract is post-snap alignment
        // of labels and bars within the reflowed bands.
        it('integrated mode: grouped-category remove data snaps with labels aligned to their bands', async () => {
            chart = AgCharts.create(groupedCategoryOptions());
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const data = examples.INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE.data!;
            const before = sampleScene();
            await chart.updateDelta({ data: data.slice(0, 7) });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);

            const after = trajectory.at(-1)!;
            // The removed group's separator nodes linger zero-width; the visible contract is its
            // labels leave.
            const labelKeys = (sample: SceneGeometrySample) =>
                [...sample.keys()].filter((key) => key.startsWith('axis[bottom]/text['));
            expect(labelKeys(before).some((k) => k.includes('Nebulon'))).toBe(true);
            expect(labelKeys(after).some((k) => k.includes('Nebulon'))).toBe(false);
            expect(rectCount(after)).toBeLessThan(rectCount(before));

            // The grid band rects give the reflowed category bands.
            const bands = [...after]
                .filter(([key]) => /^axis\[bottom\]\/grid\/rect\[\d+___.+\]$/.test(key))
                .map(([, state]) => state as { x: number; width: number });
            expect(bands.length).toBeGreaterThan(0);
            const labelXs = [...after]
                .filter(([key]) => /^axis\[bottom\]\/text\[\d{4}(_\d+)?\]$/.test(key))
                .map(([, state]) => (state as { x: number }).x);
            expect(labelXs.length).toBeGreaterThan(0);
            for (const labelX of labelXs) {
                const distances = bands.map((b) => Math.abs(b.x + b.width / 2 - labelX));
                expect(Math.min(...distances), `label at x=${labelX}`).toBeLessThanOrEqual(1);
            }
            for (const [key, state] of after) {
                if (!/^series\[\d+\]\/rect\[/.test(key)) continue;
                const { x, width } = state as { x: number; width: number };
                const cx = x + width / 2;
                expect(
                    bands.some((b) => cx >= b.x - 0.5 && cx <= b.x + b.width + 0.5),
                    `${key} centre ${cx} outside all bands`
                ).toBe(true);
            }
        });

        // A series toggle snaps structurally at frame 0 (the labels group flips visible, re-entering
        // rects arrive from a null-x placeholder), which trips captureUpdate's whole-scene start
        // anchor — so the toggle CASEs hand-roll the capture, keeping only the end anchor (as the
        // line suite's captureFrom does).
        const captureToggle = (create: AgCartesianChartOptions, action: () => Promise<void> | void) => {
            chart = AgCharts.create(create);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // Survivors of a series toggle re-share the category band: width tweens during update while
        // the value dimension holds (bounded absorbs the crisp-pixel settle).
        const survivorBands = (width: 'increases' | 'decreases'): SceneNodeExpectation =>
            ({
                width: { during: 'update', expect: [width, 'progresses'] },
                x: { during: 'update', expect: 'bounded' },
                height: 'bounded',
                y: 'bounded',
            }) as const;

        // "Toggle series off" — a two-beat exit: the toggled-off bars first collapse to the baseline
        // (remove phase, their band frozen), THEN the survivors widen into the vacated band (update
        // phase). Contrast with the stacked CRT-1040 toggle below, which coordinates in one beat.
        it('legend hide: toggled-off bars collapse to the baseline before survivors widen', async () => {
            const options = groupedOptions();
            const { trajectory, after } = await captureToggle(options, () =>
                chart.update({
                    ...options,
                    series: options.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
                })
            );
            // Anti-vacuity: the toggled-off bar starts at full height and must genuinely collapse.
            expect(trajectory[0].get('series[1]/rect[Q1]')!.height).toBeGreaterThan(40);
            expectSceneTrajectory(trajectory, {
                'series[1]/rect[*]': {
                    height: { during: 'remove', expect: ['decreases', 'bounded'], settlesAt: 0 },
                    y: { during: 'remove', expect: ['increases', 'bounded'] },
                },
                'series[0]/rect[*]': survivorBands('increases'),
                'series[2]/rect[*]': survivorBands('increases'),
            });
            expect(after.get('series[1]/rect[Q1]')!.height).toBe(0);
        });

        // "Toggle series back on" — the exit in reverse: survivors narrow to re-make room (update
        // phase), then the re-shown bars grow back from the baseline (add phase) — a grow, not a fade.
        it('legend show: survivors narrow before the re-shown bars grow from the baseline', async () => {
            const options = groupedOptions();
            const hidden = {
                ...options,
                series: options.series!.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
            };
            const { trajectory, after } = await captureToggle(hidden, () => chart.update(options));
            expectStartsCollapsed(trajectory[0], 'series[1]/rect[Q1]', 'height');
            expectSceneTrajectory(trajectory, {
                'series[1]/rect[*]': {
                    height: { during: 'add', expect: ['increases', 'bounded'] },
                    y: { during: 'add', expect: ['decreases', 'bounded'] },
                },
                'series[0]/rect[*]': survivorBands('decreases'),
                'series[2]/rect[*]': survivorBands('decreases'),
            });
            expect(after.get('series[1]/rect[Q1]')!.height).toBeGreaterThan(40);
        });

        // CRT-1040: a stacked legend toggle must animate as ONE coordinated update — the toggled-off
        // layer collapses at the baseline while the survivors slide down into its place, tiling
        // contiguously on every frame. The historic bug left the invisible series without nodeData, so
        // it ran the desynchronised remove/add phases instead; the `during: 'update'` windows are the
        // regression detector.
        it('CRT-1040 stacked toggle: survivors slide in the coordinated update phase, tiling contiguously', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { category: 'A', v1: 10, v2: 20, v3: 15 },
                    { category: 'B', v1: 30, v2: 40, v3: 25 },
                    { category: 'C', v1: 20, v2: 10, v3: 35 },
                ],
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'v1', stacked: true },
                    { type: 'bar', xKey: 'category', yKey: 'v2', stacked: true },
                    { type: 'bar', xKey: 'category', yKey: 'v3', stacked: true },
                ],
                // Pinned so the toggle is non-scale-affecting: survivors slide, nothing rescales.
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 110 },
                },
            };
            prepareTestOptions(options);
            const { trajectory, after } = await captureToggle(options, () =>
                chart.update({
                    ...options,
                    series: options.series!.map((s, i) => (i === 0 ? { ...s, visible: false } : s)),
                })
            );
            const slideDown: SceneNodeExpectation = {
                y: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                height: { during: 'update', expect: 'bounded' },
                x: { during: 'update', expect: 'bounded' },
                width: { during: 'update', expect: 'bounded' },
            };
            const stackedContiguous: SceneFrameInvariant = {
                name: 'stack tiles contiguously above the collapsing layer',
                check: (frame) => {
                    for (const cat of ['A', 'B', 'C']) {
                        const [v1, v2, v3] = [0, 1, 2].map((i) => frame.get(`series[${i}]/rect[${cat}]`));
                        if (v1 == null || v2 == null || v3 == null) return `missing rects for category ${cat}`;
                        const gaps = [Math.abs(v2.y + v2.height - v1.y), Math.abs(v3.y + v3.height - v2.y)];
                        if (gaps.some((gap) => gap > 1)) {
                            return `stack gap at category ${cat}: [${gaps.map((g) => g.toFixed(2)).join(', ')}]`;
                        }
                    }
                    return undefined;
                },
            };
            expect(trajectory[0].get('series[0]/rect[A]')!.height).toBeGreaterThan(40);
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/rect[*]': {
                        height: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        y: { during: 'update', expect: ['increases', 'bounded'] },
                    },
                    'series[1]/rect[*]': slideDown,
                    'series[2]/rect[*]': slideDown,
                },
                { frameInvariants: [stackedContiguous] }
            );
            expect(after.get('series[0]/rect[A]')!.height).toBe(0);
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped
        // render of the same options produces (see expectAnimatedEndpointsMatchStatic).
        it('sanity: randomise endpoints match static renders', async () => {
            const options = groupedOptions();
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: [
                    { quarter: 'Q1', iphone: 70, mac: 40, services: 110 },
                    { quarter: 'Q2', iphone: 90, mac: 140, services: 15 },
                ],
            });
        });

        it('sanity: remove series endpoints match static renders', async () => {
            const options = groupedOptions();
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                series: options.series!.slice(0, 2),
            });
        });

        it('sanity: series re-add endpoints match static renders', async () => {
            const full = prepareTestOptions({ ...examples.BAR_STACKED_AND_GROUPED_NUMBER_CRT_950 });
            const reduced = { ...full, series: full.series!.slice(0, 2) };
            chart = AgCharts.create(reduced);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, reduced, full);
        });

        // Meta-tests: the endpoint guard must fail loudly in both comparison directions.
        describe('endpoint sanity guard validation', () => {
            it('rejects when a static render diverges from the animated settle', async () => {
                const options = groupedOptions();
                chart = AgCharts.create(options);
                const divergedStart = {
                    ...options,
                    data: options.data!.map((d) => ({ ...d, iphone: d.iphone / 2 })),
                };
                const grownEnd = {
                    ...options,
                    data: [...options.data!, { quarter: 'Q3', iphone: 80, mac: 40, services: 50 }],
                };
                await expect(
                    expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, divergedStart, grownEnd, {
                        writeDiff: false,
                    })
                ).rejects.toThrow(/pixels different/);
            });

            it('rejects a transition that changes no pixels', async () => {
                const options = groupedOptions();
                chart = AgCharts.create(options);
                await expect(
                    expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, { ...options })
                ).rejects.toThrow(/pixels different/);
            });
        });
    });

    // Legend toggle animations are pinned per-frame by the 'legend hide'/'legend show' trajectory
    // CASEs in 'animation -test page actions'.

    // CRT-1040: Invisible stacked series must still populate nodeData so animation uses the
    // coordinated 'update' phase rather than the out-of-sync 'remove'/'add' phases.
    describe('stacked bar legend toggle nodeData (CRT-1040)', () => {
        const animate = spyOnAnimationManager();

        it('should populate nodeData for invisible stacked series after legend toggle', async () => {
            animate(1200, 1);

            const options: AgChartOptions = {
                data: [
                    { category: 'A', v1: 10, v2: 20 },
                    { category: 'B', v1: 30, v2: 40 },
                ],
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'v1', stacked: true },
                    { type: 'bar', xKey: 'category', yKey: 'v2', stacked: true },
                ],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Toggle second series invisible (simulates legend click)
            animate(1200, 0.5);
            (options.series![1] as AgBarSeriesOptions).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const invisibleSeries = chartInstance.series[1] as any;
            const nodeData = invisibleSeries.contextNodeData?.nodeData;

            expect(nodeData).toHaveLength(2);
            for (const datum of nodeData!) {
                expect(datum.yValue).toBe(0);
            }
        });

        // The coordinated-toggle animation itself is pinned per-frame by the 'CRT-1040 stacked
        // toggle' trajectory CASE in 'animation -test page actions'.
    });

    describe('invalid data domain', () => {
        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                expectWarningsCalls().toEqual([
                    [
                        'AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
                    ],
                ]);
            }
        );

        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
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

                expectWarningsCalls().toEqual([
                    [
                        'AG Charts - The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.',
                    ],
                ]);
            }
        );
    });

    describe('label placement', () => {
        describe.each(['inside-start', 'inside-end', 'outside-start', 'outside-end'] as const)(
            'renders label placement %s',
            (placement) => {
                it.each(['horizontal', 'vertical'] as const)('direction %s', async (direction) => {
                    const options: AgChartOptions = {
                        data: [
                            { x: 'a', y: 100 },
                            { x: 'b', y: -100 },
                            { x: 'c', y: 200 },
                            { x: 'd', y: -200 },
                        ],
                        series: [
                            {
                                type: 'bar',
                                direction,
                                xKey: 'x',
                                yKey: 'y',
                                label: {
                                    placement,
                                    spacing: 10,
                                    color: 'black',
                                },
                            },
                        ],
                    };

                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await compare();
                });
            }
        );
    });

    describe('label placement cascade', () => {
        // A placement array cascades per datum (inside-center-h → inside-center-v → outside-end-h →
        // outside-end-v). Small bars can't fit the label inside and fall through to outside; large
        // bars keep it inside — so a single render exercises both the fit and the fallback paths.
        const cascadeOptions = (direction: 'horizontal' | 'vertical'): AgChartOptions => ({
            data: [
                { x: 'a', y: 100 },
                { x: 'b', y: -100 },
                { x: 'c', y: 12 },
                { x: 'd', y: -8 },
            ],
            series: [
                {
                    type: 'bar',
                    direction,
                    xKey: 'x',
                    yKey: 'y',
                    label: {
                        placement: ['inside-center', 'outside-end'],
                        orientation: ['horizontal', 'vertical'],
                        formatter: () => 'Category label',
                        color: 'black',
                    },
                },
            ],
        });

        it.each(['horizontal', 'vertical'] as const)(
            'cascades a long label across placement/orientation candidates (%s bars)',
            async (direction) => {
                const options = cascadeOptions(direction);
                prepareTestOptions(options);
                chart = AgCharts.create(options);
                await compare();
            }
        );
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: (params) => {
                            if (params.first) return { fill: 'red' };
                            if (params.min) return { fill: 'yellow' };
                            if (params.max) return { fill: 'green' };
                            if (params.last) return { fill: 'blue' };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('complex fills', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                    { x: 'e', y: 150 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: (params) => {
                            if (params.first) return { fill: { type: 'gradient' } };
                            if (params.min) return { fill: { type: 'pattern' } };
                            if (params.max) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.last) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                            return { fill: { type: 'gradient' } };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('complex fills over default fill', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                    { x: 'e', y: 150 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        fill: 'red',
                        itemStyler: (params) => {
                            if (params.first) return { fill: { type: 'gradient' } };
                            if (params.min) return { fill: { type: 'pattern' } };
                            if (params.max) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.last) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                            return { fill: { type: 'gradient' } };
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-8290', () => {
        async function testCase(labelOpts: { placement: AgBarSeriesLabelPlacement; spacing?: number }, name: string) {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: '1', y: 140 },
                        { x: '2', y: 124 },
                        { x: '3', y: 112 },
                        { x: '4', y: 118 },
                    ],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { ...labelOpts } }],
                })
            );
            await compare({ failureThreshold: 0, failureThresholdType: 'percent', customSnapshotIdentifier: name });
        }
        describe('spacing sets the gap between the bar and the label', () => {
            test('inside-start', async () => {
                await testCase({ placement: 'inside-start', spacing: 30 }, 'AG-8290-bar-label-spacing-inside-start');
            });
            test('inside-end', async () => {
                await testCase({ placement: 'inside-end', spacing: 30 }, 'AG-8290-bar-label-spacing-inside-end');
            });
            test('outside-start', async () => {
                await testCase({ placement: 'outside-start', spacing: 30 }, 'AG-8290-bar-label-spacing-outside-start');
            });
            test('outside-end', async () => {
                await testCase({ placement: 'outside-end', spacing: 30 }, 'AG-8290-bar-label-spacing-outside-end');
            });
        });
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { year: '2016', visitors: 46636720, status: 1 },
            { year: '2017', visitors: 48772922, status: 1 },
            { year: '2018', visitors: 50800193, status: 1 },
            { year: '2019', visitors: 48023342, status: 2 },
            { year: '2022', visitors: 49441678, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { year: '2023', visitors: 50368190, status: 1 },
        ];

        const DATA2 = [
            { year: '2020', visitors: 48772922, status: 2 },
            { year: '2021', visitors: 47155093, status: 1 },
            { year: '2022', visitors: 48772982, status: 2 },
        ];

        const EXAMPLE_OPTIONS: AgCartesianChartOptions<
            { year: string; visitors: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'bar',
                    xKey: 'year',
                    yKey: 'visitors',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...EXAMPLE_OPTIONS };
            prepareTestOptions(options);

            chart = AgCharts.create(options) as AgChartInstance;
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockBarStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgBarSeriesStylerParams<D, C>): AgBarSeriesStyle | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            fill: 'cyan',
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses')
                        return {
                            fill: 'magenta',
                            fillOpacity: 0.5,
                            cornerRadius: 15,
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
                            { type: 'bar', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'bar', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
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
                const itemStyler = (params: AgBarSeriesItemStylerParams<D, C>): AgBarSeriesStyle => {
                    if (params.xValue === 'February') {
                        if (params.yKey === 'sales') {
                            return { fill: 'gold', cornerRadius: 0 };
                        } else {
                            return { fill: 'grey', cornerRadius: 0 };
                        }
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                fill: 'lime', // ignored
                                cornerRadius: 45, // ignored only for February
                                itemStyler,
                                styler: styler.frozen,
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
                                fill: 'olive', // ignored
                                stroke: 'navy', // not ignored
                                strokeWidth: 3, // not ignored
                                itemStyler,
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
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: () => {
                                    return { fill: { type: 'pattern' } };
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
        describe('stroke-strokeWidth-defaults', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                styler: () => {
                                    // check that default `strokeWidth: 2` is resolved.
                                    return { stroke: 'lime' };
                                },
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: () => {
                                    // check that theme-default `stroke` is resolved.
                                    return { strokeWidth: 4 };
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
        describe('highlights', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data,
                        series: [
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'sales',
                                highlight: { highlightedSeries: { fill: 'yellow' } },
                                styler: styler.frozen,
                            },
                            {
                                type: 'bar',
                                xKey: 'month',
                                yKey: 'expenses',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 300, y: 150 } as const;
            const series0datum0 = { x: 133, y: 333 } as const;
            const series0datum2 = { x: 620, y: 333 } as const;
            const series1datum0 = { x: 222, y: 400 } as const;
            const legendItem0 = { x: 360, y: 570 } as const;
            const legendItem1 = { x: 440, y: 570 } as const;

            describe('single', () => {
                async function testHover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                }
                test('miss', async () => testHover(miss));
                test('series[0].datum[0]', async () => testHover(series0datum0));
                test('series[0].datum[2]', async () => testHover(series0datum2));
                test('series[1].datum[0]', async () => testHover(series1datum0));
                test('legendItem[0]', async () => testHover(legendItem0));
                test('legendItem[1]', async () => testHover(legendItem1));
            });
            describe('sequenced', () => {
                async function hover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    // Flush pending delayed unhighlights so each captured styler-call set is deterministic.
                    await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
                }
                function popCalls() {
                    const result = [...styler.mock.mock.calls];
                    styler.mock.mockClear();
                    return result;
                }
                test('1', async () => {
                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum2);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series1datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem1);
                    expect(popCalls()).toMatchSnapshot();
                });
            });
        });
    });

    describe('segmentation', () => {
        it('should render bar series with segmentation styling on x-axis', async () => {
            const options: AgCartesianChartOptions = {
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'C', fill: 'red', stroke: 'darkred', strokeWidth: 2 },
                                { start: 'C', stop: 'E', fill: 'blue', stroke: 'darkblue', strokeWidth: 2 },
                                { start: 'E', fill: 'green', stroke: 'darkgreen', strokeWidth: 2 },
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

        it('should render bar series with segmentation styling on y-axis', async () => {
            const options: AgCartesianChartOptions = {
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
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 10,
                                    stop: 20,
                                    fill: 'orange',
                                    stroke: 'darkorange',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 20,
                                    stop: 30,
                                    fill: 'purple',
                                    stroke: 'indigo',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 30,
                                    fill: 'cyan',
                                    stroke: 'teal',
                                    strokeWidth: 1,
                                },
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

        it('should render grouped bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y1: 100, y2: 150 },
                    { x: 'Q2', y1: 200, y2: 180 },
                    { x: 'Q3', y1: 150, y2: 220 },
                    { x: 'Q4', y1: 250, y2: 200 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 100, stop: 200, fill: 'lightcoral', stroke: 'red', strokeWidth: 1 },
                                { start: 200, fill: 'lightblue', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 150, stop: 200, fill: 'lightgreen', stroke: 'green', strokeWidth: 1 },
                                { start: 200, fill: 'lightyellow', stroke: 'gold', strokeWidth: 1 },
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

        it('should render stacked bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y1: 50, y2: 30 },
                    { x: 'Q2', y1: 70, y2: 40 },
                    { x: 'Q3', y1: 60, y2: 50 },
                    { x: 'Q4', y1: 80, y2: 35 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q3',
                                    fill: 'pink',
                                    stroke: 'red',
                                    strokeWidth: 1,
                                },
                                { start: 'Q3', fill: 'purple', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Q1',
                                    stop: 'Q2',
                                    fill: 'green',
                                    stroke: 'green',
                                    strokeWidth: 1,
                                },
                                {
                                    start: 'Q2',
                                    fill: 'lavender',
                                    stroke: 'purple',
                                    strokeWidth: 1,
                                },
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

        it('should render horizontal bar series with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Category A', y: 100 },
                    { x: 'Category B', y: 150 },
                    { x: 'Category C', y: 120 },
                    { x: 'Category D', y: 180 },
                ],
                series: [
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 100, stop: 140, fill: 'gold', stroke: 'orange', strokeWidth: 2 },
                                { start: 140, fill: 'mediumpurple', stroke: 'purple', strokeWidth: 2 },
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'left' },
                    y: { type: 'number', position: 'bottom' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bar series with pattern fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y: 25 },
                    { x: 'B', y: 35 },
                    { x: 'C', y: 30 },
                    { x: 'D', y: 40 },
                    { x: 'E', y: 45 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 25,
                                    stop: 35,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'forward-slanted-lines',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 35,
                                    stop: 42,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'squares',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 42,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'stars',
                                    },
                                    stroke: 'green',
                                    strokeWidth: 2,
                                },
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render Apple revenue by product with gradient fill segmentation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                    {
                        quarter: "Q2'18",
                        iphone: 124,
                        mac: 20,
                        ipad: 14,
                        wearables: 12,
                        services: 30,
                    },
                    {
                        quarter: "Q3'18",
                        iphone: 112,
                        mac: 20,
                        ipad: 18,
                        wearables: 14,
                        services: 36,
                    },
                    {
                        quarter: "Q4'18",
                        iphone: 118,
                        mac: 24,
                        ipad: 14,
                        wearables: 14,
                        services: 36,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        fill: { type: 'gradient' },
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 50,
                                    stop: 100,
                                    fillOpacity: 0.8,
                                },
                                {
                                    start: 100,
                                    fillOpacity: 0.5,
                                },
                            ],
                        },
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render Apple revenue single quarter bar chart with segmentation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    {
                        quarter: "Q1'18",
                        iphone: 140,
                        mac: 16,
                        ipad: 14,
                        wearables: 12,
                        services: 20,
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        fill: { type: 'gradient' },
                        strokeWidth: 10,
                        stroke: 'yellow',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 100,
                                    fillOpacity: 0.6,
                                },
                            ],
                        },
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render bar series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 150 },
                    { x: 'Q2', y: 200 },
                    { x: 'Q3', y: 180 },
                    { x: 'Q4', y: 220 },
                    { x: 'Q5', y: 250 },
                    { x: 'Q6', y: 275 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', stop: 'Q2', fill: 'crimson', stroke: 'darkred', strokeWidth: 2 },
                                { stop: 'Q4', fill: 'royalblue', stroke: 'darkblue', strokeWidth: 3 }, // Missing start - should use 'Q2'
                                { stop: 'Q6', fill: 'forestgreen', stroke: 'darkgreen', strokeWidth: 2 }, // Missing start - should use 'Q4'
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

        it('should render bar series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 100 },
                    { x: 'Feb', y: 120 },
                    { x: 'Mar', y: 110 },
                    { x: 'Apr', y: 140 },
                    { x: 'May', y: 160 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Jan', fill: '#ff6b6b', stroke: '#e55555', strokeWidth: 2 }, // Missing stop - should use 'Feb'
                                { start: 'Feb', fill: '#4ecdc4', stroke: '#3db5ac', strokeWidth: 2 }, // Missing stop - should use 'May'
                                { start: 'May', stop: 'May', fill: '#45b7d1', stroke: '#3a9bc1', strokeWidth: 2 },
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

        it('should render bar series with Y-axis segmentation and missing values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Product A', y: 50 },
                    { x: 'Product B', y: 150 },
                    { x: 'Product C', y: 250 },
                    { x: 'Product D', y: 350 },
                    { x: 'Product E', y: 450 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 0, stop: 200, fill: 'orange', stroke: 'darkorange', strokeWidth: 1 },
                                { stop: 400, fill: 'purple', stroke: 'darkmagenta', strokeWidth: 2 }, // Missing start - should use 200
                                { start: 400, fill: 'gold', stroke: 'darkgoldenrod', strokeWidth: 1 }, // Missing stop - should extend to max
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

        it('should render bar series with complex missing values pattern', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Week 1', y: 80 },
                    { x: 'Week 2', y: 120 },
                    { x: 'Week 3', y: 100 },
                    { x: 'Week 4', y: 140 },
                    { x: 'Week 5', y: 160 },
                    { x: 'Week 6', y: 180 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Week 1',
                                    stop: 'Week 2',
                                    fill: 'lightcoral',
                                    stroke: 'indianred',
                                    strokeWidth: 2,
                                },
                                { fill: 'lightblue', stroke: 'steelblue', strokeWidth: 2 }, // Missing both start/stop - should bridge from 'Week 2' to 'Week 4'
                                { start: 'Week 4', fill: 'lightgreen', stroke: 'forestgreen', strokeWidth: 2 }, // Missing stop - should extend to end
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

        it('should render horizontal bar series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Alpha', y: 85 },
                    { x: 'Beta', y: 125 },
                    { x: 'Gamma', y: 105 },
                    { x: 'Delta', y: 145 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        direction: 'horizontal',
                        segmentation: {
                            key: 'y',
                            segments: [
                                { start: 80, stop: 110, fill: 'mediumorchid', stroke: 'darkorchid', strokeWidth: 2 },
                                { stop: 150, fill: 'mediumseagreen', stroke: 'seagreen', strokeWidth: 2 }, // Missing start - should use 110
                            ],
                        },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'left' },
                    y: { type: 'number', position: 'bottom' },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render grouped bar series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'A', y1: 30, y2: 50 },
                    { x: 'B', y1: 40, y2: 60 },
                    { x: 'C', y1: 35, y2: 55 },
                    { x: 'D', y1: 45, y2: 65 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', stop: 'B', fill: 'tomato', stroke: 'darkred', strokeWidth: 1 },
                                { stop: 'D', fill: 'dodgerblue', stroke: 'darkblue', strokeWidth: 1 }, // Missing start - should use 'B'
                            ],
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y2',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'A', fill: 'limegreen', stroke: 'darkgreen', strokeWidth: 1 }, // Missing stop - should extend to end
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
    });

    describe('cutout drawing mode', () => {
        it('should render bar series with cutout highlight drawing mode', async () => {
            const highlight = {
                highlightedItem: {
                    fillOpacity: 0.1,
                    stroke: 'black',
                    fill: 'black',
                },
            };
            const options: AgCartesianChartOptions = {
                data: [
                    { quarter: 'Q1', sales: 120, expenses: 80 },
                    { quarter: 'Q2', sales: 100, expenses: 70 },
                    { quarter: 'Q3', sales: 140, expenses: 90 },
                    { quarter: 'Q4', sales: 160, expenses: 110 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'sales',
                        yName: 'Sales',
                        highlight,
                    },
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'expenses',
                        yName: 'Expenses',
                        highlight,
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
            await hoverAction(135, 330)(chart);
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
                    { type: 'bar', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'bar', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'bar', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });

    describe('horizontal bar with property-based formatter', () => {
        it('should apply correct formatter to axis labels based on series orientation', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: "Apple's Revenue by Product Category",
                },
                subtitle: {
                    text: 'In Billion U.S. Dollars',
                },
                data: [
                    { quarter: 'Q1', iphone: 140.01 },
                    { quarter: 'Q2', iphone: 124.32 },
                    { quarter: 'Q3', iphone: 112.12 },
                    { quarter: 'Q4', iphone: 96.39 },
                ],
                series: [
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                    },
                ],
                formatter: {
                    x: ({ value }) => `x${value}x`,
                    y: ({ value }) => `y${value}y`,
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await compare();
        });

        it('should apply correct formatter in combo chart with horizontal bars and line series', async () => {
            const options: AgCartesianChartOptions = {
                title: {
                    text: 'Revenue and Growth',
                },
                data: [
                    { quarter: 'Q1', revenue: 140.01, growth: 15.5 },
                    { quarter: 'Q2', revenue: 124.32, growth: 12.3 },
                    { quarter: 'Q3', revenue: 112.12, growth: 8.7 },
                    { quarter: 'Q4', revenue: 96.39, growth: 5.2 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'growth',
                        yKey: 'quarter',
                        yName: 'Growth %',
                    },
                    {
                        type: 'bar',
                        direction: 'horizontal',
                        xKey: 'quarter',
                        yKey: 'revenue',
                        yName: 'Revenue',
                    },
                ],
                formatter: {
                    x: ({ value }) => `x${value}x`,
                    y: ({ value }) => `y${value}y`,
                },
                axes: {
                    x: {
                        type: 'number',
                    },
                    y: {
                        type: 'category',
                    },
                },
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await compare();
        });
    });

    describe('incremental updates with aggregation', () => {
        it('should enable incremental updates when aggregation is active', async () => {
            // Create data with >1000 points to trigger aggregation (MAX_ANIMATABLE_NODES = 1000)
            const largeData = Array.from({ length: 1500 }, (_, i) => ({
                x: i,
                y: Math.random() * 100,
            }));

            const options: AgChartOptions = {
                data: largeData,
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                    },
                ],
            };

            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Get initial node data references
            const chartInstance = deproxy(chart);
            const series = chartInstance.series[0] as any;
            const initialNodeData = series.contextNodeData?.nodeData;
            expect(initialNodeData).toBeDefined();
            expect(initialNodeData!.length).toBeGreaterThan(0);

            // Store references to some nodes
            const firstNode = initialNodeData![0];
            const middleNode = initialNodeData![Math.floor(initialNodeData!.length / 2)];

            // Update data (same structure, different values) - this should trigger incremental update
            const updatedData = largeData.map((d) => ({
                ...d,
                y: d.y * 1.1, // Slight change to values
            }));

            await chart.update({
                ...options,
                data: updatedData,
            });
            await waitForChartStability(chart);

            // Verify nodes were reused (same object references)
            const updatedChartInstance = deproxy(chart);
            const updatedSeries = updatedChartInstance.series[0] as any;
            const updatedNodeData = updatedSeries.contextNodeData?.nodeData;
            expect(updatedNodeData).toBeDefined();
            expect(updatedNodeData!.length).toBe(initialNodeData!.length);

            // With aggregation active, incremental updates should reuse node objects
            // Check that at least some nodes are reused (they should be the same references)
            expect(updatedNodeData![0]).toBe(firstNode);
            expect(updatedNodeData![Math.floor(updatedNodeData!.length / 2)]).toBe(middleNode);

            chart.destroy();
        });
    });

    describe('fixed width', () => {
        const data = [
            { quarter: "Q1'18", iphone: 40, mac: 16, ipad: 14, wearables: 12 },
            { quarter: "Q2'18", iphone: 24, mac: 20, ipad: 14, wearables: 12 },
            { quarter: "Q3'18", iphone: 12, mac: 20, ipad: 18, wearables: 14 },
            { quarter: "Q4'18", iphone: 18, mac: 24, ipad: 14, wearables: 14 },
        ];

        const zeroPadding = { paddingInner: 0, paddingOuter: 0, groupPaddingInner: 0 };

        const cases: [string, any, any][] = [
            ['single series', [{ type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 }], zeroPadding],
            [
                'grouped series',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with groupPaddingInner',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                { ...zeroPadding, groupPaddingInner: 0.5 },
            ],
            [
                'grouped series with unfixed width at start',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed width in middle',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20 },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed width at end',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                zeroPadding,
            ],
            [
                'grouped series with unfixed widths and groupPaddingInner',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                { ...zeroPadding, groupPaddingInner: 0.5 },
            ],
            [
                'grouped series with unfixed widths and default padding',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables' },
                ],
                {},
            ],
            [
                'stacked series',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30, stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20, stackGroup: 'two' },
                ],
                {},
            ],
            [
                'stacked series with unfixed widths',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 20, stackGroup: 'two' },
                ],
                {},
            ],
            [
                'stacked series with one unfixed width',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 10, stackGroup: 'one' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', stackGroup: 'two' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 30, stackGroup: 'two' },
                ],
                {},
            ],
            [
                'ungrouped series',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', grouped: false },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40, grouped: false },
                ],
                {},
            ],
            [
                'ungrouped series width ratio',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', grouped: false },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', widthRatio: 0.5, grouped: false },
                ],
                {},
            ],
            [
                'ungrouped series width and width ratio',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', grouped: false },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40, widthRatio: 0.5, grouped: false },
                ],
                {},
            ],
            [
                'grouped series width ratio',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', widthRatio: 0.5 },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad' },
                ],
                {},
            ],
            [
                'mixed grouped and ungrouped series width ratio',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', widthRatio: 0.75, grouped: false },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', stacked: true },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', widthRatio: 0.5, grouped: false },
                ],
                {},
            ],
            [
                'axis align start',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                { bandAlignment: 'start' },
            ],
            [
                'axis align center',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                { bandAlignment: 'center' },
            ],
            [
                'axis align end',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                {
                    bandAlignment: 'end',
                },
            ],
            [
                'axis align justify',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 40 },
                ],
                { bandAlignment: 'justify' },
            ],
            [
                'horizontal',
                [
                    { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 20, direction: 'horizontal' },
                    { type: 'bar', xKey: 'quarter', yKey: 'mac', direction: 'horizontal' },
                    { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 30, direction: 'horizontal' },
                    { type: 'bar', xKey: 'quarter', yKey: 'wearables', direction: 'horizontal' },
                ],
                { ...zeroPadding, groupPaddingInner: 0.5 },
            ],
        ];

        it.each(cases)('%s', async (_, seriesOptions, axisOptions) => {
            const options: AgCartesianChartOptions = {
                data: data,
                series: seriesOptions,
                axes: {
                    x: axisOptions,
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        it('changing width', async () => {
            const options: AgCartesianChartOptions = {
                data: data,
                series: [
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'iphone', width: 20 },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'mac' },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'ipad', width: 30 },
                    { type: 'bar' as const, xKey: 'quarter', yKey: 'wearables' },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            (options.series as any)[0].width = 40;
            await chart.update(options);
            await compare();
        });

        it('fits and clips when total fixed width exceeds the plot area', async () => {
            const fixedWidth = 60;
            const manyCategories = Array.from({ length: 20 }, (_, i) => ({
                quarter: `C${i}`,
                iphone: 10 + (i % 5),
            }));
            const options: AgCartesianChartOptions = {
                data: manyCategories,
                series: [{ type: 'bar', xKey: 'quarter', yKey: 'iphone', width: fixedWidth }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const instance = deproxy(chart);
            const categoryAxis = instance.axes.find((axis) => axis.type === 'category')!;

            // A narrowed visibleRange is what spreads the bands to their fixed width and clips; [0, 1] means neither happened.
            expect(categoryAxis.visibleRange[0]).toBe(0);
            expect(categoryAxis.visibleRange[1]).toBeLessThan(1);

            const nodeData = (instance.series[0] as any).contextNodeData?.nodeData as Array<{ width: number }>;
            expect(nodeData).toHaveLength(manyCategories.length);
            for (const datum of nodeData) {
                expect(datum.width).toBe(fixedWidth);
            }
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.BAR_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - invalid value of type [object] for [BarSeries-1 / xValue] ignored:",
                  "[null]",
                ],
              ]
            `);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BAR_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BAR_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.BAR_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should accept null category key in stacked bar when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.STACKED_BAR_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('nodeClick with null category', () => {
        it('should fire seriesNodeClick with null xValue datum', async () => {
            const clicks: Array<Record<string, unknown>> = [];
            const options: AgCartesianChartOptions = {
                data: [
                    { x: null, y: 10 },
                    { x: 'A', y: 20 },
                    { x: 'B', y: 15 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        allowNullKeys: true,
                        listeners: {
                            seriesNodeClick: (event: any) => {
                                clicks.push(event.datum);
                            },
                        },
                    } as any,
                ],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Click on the first bar (null category) - approximate center
            await clickAction(130, 300)(chart);
            await waitForChartStability(chart);

            expect(clicks.length).toBeGreaterThan(0);
            expect(clicks[0].x).toBeNull();
        });
    });

    describe('skip null bars', () => {
        const data = [
            { quarter: "Q1'24", software: 5100, hardware: 3400, services: 3500, investments: undefined },
            { quarter: "Q2'24", software: 5400, hardware: null, services: 3200, investments: 3100 },
            { quarter: "Q3'24", software: null, hardware: 3800, investments: 2500 },
            { quarter: "Q4'24", software: 5700, hardware: null, services: undefined, investments: null },
        ];

        const directions = ['horizontal', 'vertical'] as const;

        it.each(directions)('%s', async (direction) => {
            const options: AgCartesianChartOptions = {
                data,
                series: [
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'software' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'hardware' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'services' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'investments' },
                ],
                axes: {
                    [direction === 'horizontal' ? 'y' : 'x']: {
                        type: 'category',
                        skipNullBars: true,
                    },
                },
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it.each(directions)('per-series data arrays %s', async (direction) => {
            const options: AgCartesianChartOptions = {
                series: [
                    {
                        type: 'bar',
                        direction,
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q1'24", value: 5100 },
                            { quarter: "Q2'24", value: 5400 },
                            { quarter: "Q4'24", value: 5700 },
                        ],
                    },
                    {
                        type: 'bar',
                        direction,
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q2'24", value: 3400 },
                            { quarter: "Q3'24", value: 3800 },
                        ],
                    },
                    {
                        type: 'bar',
                        direction,
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q1'24", value: 3500 },
                            { quarter: "Q3'24", value: 2500 },
                            { quarter: "Q4'24", value: 3100 },
                        ],
                    },
                ],
                axes: {
                    [direction === 'horizontal' ? 'y' : 'x']: {
                        type: 'category',
                        skipNullBars: true,
                    },
                },
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('per-series data arrays render identically to equivalent shared-data nulls', async () => {
            const axes: AgCartesianChartOptions['axes'] = {
                x: { type: 'category', skipNullBars: true },
                y: { type: 'number' },
            };
            const perSeriesData: AgCartesianChartOptions = {
                legend: { enabled: false },
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q1'24", value: 5100 },
                            { quarter: "Q2'24", value: 5400 },
                            { quarter: "Q3'24", value: 4900 },
                            { quarter: "Q4'24", value: 5700 },
                        ],
                    },
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q1'24", value: 3500 },
                            { quarter: "Q3'24", value: 2500 },
                        ],
                    },
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'value',
                        data: [
                            { quarter: "Q2'24", value: 3400 },
                            { quarter: "Q4'24", value: 3100 },
                        ],
                    },
                ],
                axes,
            };
            const sharedDataNulls: AgCartesianChartOptions = {
                legend: { enabled: false },
                data: [
                    { quarter: "Q1'24", a: 5100, b: 3500, c: null },
                    { quarter: "Q2'24", a: 5400, b: null, c: 3400 },
                    { quarter: "Q3'24", a: 4900, b: 2500, c: null },
                    { quarter: "Q4'24", a: 5700, b: null, c: 3100 },
                ],
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'a' },
                    { type: 'bar', xKey: 'quarter', yKey: 'b' },
                    { type: 'bar', xKey: 'quarter', yKey: 'c' },
                ],
                axes,
            };

            await expectPixelIdenticalAcrossUpdate(ctx, createChart, perSeriesData, sharedDataNulls);
        });

        it.each(directions)('stacked %s', async (direction) => {
            const options: AgCartesianChartOptions = {
                data,
                series: [
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'software', stackGroup: 'one' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'hardware', stackGroup: 'one' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'services', stackGroup: 'two' },
                    { type: 'bar', direction, xKey: 'quarter', yKey: 'investments', stackGroup: 'two' },
                ],
                axes: {
                    [direction === 'horizontal' ? 'y' : 'x']: {
                        type: 'category',
                        skipNullBars: true,
                    },
                },
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('fixed width', async () => {
            const options: AgCartesianChartOptions = {
                data,
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'software' },
                    { type: 'bar', xKey: 'quarter', yKey: 'hardware', width: 10 },
                    { type: 'bar', xKey: 'quarter', yKey: 'services' },
                    { type: 'bar', xKey: 'quarter', yKey: 'investments', width: 50 },
                ],
                axes: {
                    x: {
                        type: 'category',
                        skipNullBars: true,
                    },
                },
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        describe('width ratio', () => {
            const groupings = ['grouped', 'ungrouped'] as const;

            it.each(groupings)('%s', async (grouping) => {
                const grouped = grouping === 'grouped';

                const options: AgCartesianChartOptions = {
                    data,
                    series: [
                        { type: 'bar', xKey: 'quarter', yKey: 'software', widthRatio: 0.3, grouped },
                        { type: 'bar', xKey: 'quarter', yKey: 'hardware', widthRatio: 0.7, grouped },
                        { type: 'bar', xKey: 'quarter', yKey: 'services' },
                        { type: 'bar', xKey: 'quarter', yKey: 'investments' },
                    ],
                    axes: {
                        x: {
                            type: 'category',
                            skipNullBars: true,
                        },
                    },
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        });
    });

    describe('crossfiltering', () => {
        const filterLargerData = [
            { x: 'A', y: 10, yFilter: 20 },
            { x: 'B', y: 5, yFilter: 15 },
        ];
        const filterSmallerData = [
            { x: 'A', y: 20, yFilter: 10 },
            { x: 'B', y: 15, yFilter: 5 },
        ];

        it('unstacked: yKey less than yFilterKey', async () => {
            // For unstacked bars, filterValidation is not used; phantom nodes always exist.
            // node.yValue is set to the filter value (yFilter > y in this case).
            const options = prepareTestOptions({
                data: filterLargerData,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', yFilterKey: 'yFilter' } as any],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('unstacked: yKey greater than yFilterKey', async () => {
            // For unstacked bars, filterValidation is not used; phantom nodes always exist.
            // node.yValue is set to the filter value (yFilter < y in this case).
            const options = prepareTestOptions({
                data: filterSmallerData,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', yFilterKey: 'yFilter' } as any],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('stacked: yKey less than yFilterKey', async () => {
            const stackData = [
                { x: 'A', y1: 10, y2: 5, yFilter1: 20, yFilter2: 8 },
                { x: 'B', y1: 8, y2: 7, yFilter1: 15, yFilter2: 12 },
            ];
            const options = prepareTestOptions({
                data: stackData,
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'y1', yFilterKey: 'yFilter1', stacked: true } as any,
                    { type: 'bar', xKey: 'x', yKey: 'y2', yFilterKey: 'yFilter2', stacked: true } as any,
                ],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });

        it('stacked: yKey greater than yFilterKey', async () => {
            const stackData = [
                { x: 'A', y1: 20, y2: 15, yFilter1: 10, yFilter2: 8 },
                { x: 'B', y1: 18, y2: 12, yFilter1: 9, yFilter2: 6 },
            ];
            const options = prepareTestOptions({
                data: stackData,
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'y1', yFilterKey: 'yFilter1', stacked: true } as any,
                    { type: 'bar', xKey: 'x', yKey: 'y2', yFilterKey: 'yFilter2', stacked: true } as any,
                ],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('AG-16933 reverse + bandAlignment', () => {
        it('should maintain reversed domain when processDomains is called multiple times', async () => {
            const options = prepareTestOptions({
                data: [
                    { category: 'A', value: 1 },
                    { category: 'B', value: 2 },
                    { category: 'C', value: 3 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom', reverse: true, bandAlignment: 'start' },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            } as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartObj = deproxy(chart);
            const categoryAxis = chartObj.axes.find((a: any) => a.type === 'category') as any;
            expect(categoryAxis.scale.domain).toEqual(['C', 'B', 'A']);

            // Simulate what happens when resize triggers PROCESS_DOMAIN:
            // processDomains() re-calls axis.processData() → axis.setDomains()
            (chartObj as any).processDomains();

            // Domain must remain reversed after the second processDomains() call
            expect(categoryAxis.dataDomain.domain).toEqual(['C', 'B', 'A']);
        });
    });

    describe('bigint values (AG-16608)', () => {
        const categoryNumberAxes = { x: { type: 'category' as const }, y: { type: 'number' as const } };

        it('renders a plain bar series with out-of-safe-range bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', y: BIG },
                        { x: 'b', y: BIG * 2n },
                        { x: 'c', y: NEG_BIG },
                    ],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a grouped bar series with bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'a', grouped: true },
                        { type: 'bar', xKey: 'x', yKey: 'b', grouped: true },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a stacked bar series with bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                        { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a 100%-stacked bar series with bigint values (normalizedTo degrades to Number)', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'a', stacked: true, normalizedTo: 100 },
                        { type: 'bar', xKey: 'x', yKey: 'b', stacked: true, normalizedTo: 100 },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('does not throw when a bigint series is stacked with a fractional Number series', async () => {
            // addAccumulated's BigInt() path would throw on a fractional Number; the mixed stack must degrade.
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: 1000n, b: 1.5 },
                        { x: 'b', a: 2000n, b: 2.5 },
                    ],
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                        { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await waitForChartStability(chart);
            expect(chart).toBeDefined();
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders a bar series with ISO-8601 datetime-string x values on a time axis', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { time: '2024-01-15T09:00:00Z', y: 12 },
                        { time: '2024-01-15T10:00:00Z', y: 15 },
                        { time: '2024-01-15T11:00:00Z', y: 11 },
                        { time: '2024-01-15T12:00:00Z', y: 18 },
                    ],
                    series: [{ type: 'bar', xKey: 'time', yKey: 'y' }],
                    // Bars need a banded time axis, so `unit-time` stands in for the continuous `time` type.
                    axes: { x: { type: 'unit-time' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    // Above AGGREGATION_THRESHOLD, a bigint series must render identically to its Number baseline.
    describe('bigint high-volume aggregation invariance (AG-16608)', () => {
        const N = HIGH_VOLUME_COUNT;

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint bar identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createChart,
                    magnitudePair(
                        { series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
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
                isoEpochPair({ series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], axes: STRIPPED_TIME_AXES }, N)
            );
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const single = (ys: number[]) => (toValue: (v: number) => number | bigint) =>
            ys.map((y, i) => ({ x: i + 1, y: toValue(y) }));
        const paired = (rows: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            rows.map(([a, b], i) => ({ x: i + 1, a: toValue(a), b: toValue(b) }));

        it('positions a non-stacked bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([3, 4, 5])
                )
            );
        });

        it('positions a straddling-zero bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([-3, 4, -5])
                )
            );
        });

        it('positions a grouped bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    {
                        series: [
                            { type: 'bar', xKey: 'x', yKey: 'a', grouped: true },
                            { type: 'bar', xKey: 'x', yKey: 'b', grouped: true },
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

        it('positions a stacked bar series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    {
                        series: [
                            { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                            { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
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

    describe('object-valued category data', () => {
        it('should resolve object-valued category data without a data-type warning', async () => {
            const category = (label: string) => ({ id: label, label, toString: () => label });
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: category('A'), y: 10 },
                        { x: category('B'), y: 20 },
                        { x: category('C'), y: 15 },
                    ],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                })
            );
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
        });
    });

    // AG-16608: the crosshair label reads `cumulativeValueExact` to keep full bigint precision; the
    // narrowed `cumulativeValue` is float64-rounded and used only for geometry/error-bar maths.
    describe('bigint cumulativeValueExact', () => {
        it('should retain the exact bigint plotted value alongside the narrowed cumulativeValue', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: BIG },
                    { x: 'B', y: BIG + 2n },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const nodeData = series.contextNodeData?.nodeData;

            expect(nodeData).toHaveLength(2);
            expect(nodeData[0].cumulativeValueExact).toBe(BIG);
            // Geometry value narrows to float64, losing the final digit.
            expect(nodeData[0].cumulativeValue).toBe(Number(BIG));
            expect(BigInt(nodeData[0].cumulativeValue)).not.toBe(BIG);
        });
    });

    describe('getLabelObstacles', () => {
        it('contributes a seriesItem rect obstacle per bar', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'A', y: 3 },
                    { x: 'B', y: 5 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const nodeData = series.contextNodeData?.nodeData as Array<{
                x: number;
                y: number;
                width: number;
                height: number;
            }>;
            const obstacles = series.getLabelObstacles();

            expect(nodeData).toHaveLength(2);
            expect(obstacles).toEqual(
                nodeData.map(({ x, y, width, height }) => ({
                    kind: 'rect',
                    box: { x, y, width, height },
                    category: 'seriesItem',
                }))
            );
        });
    });

    // A per-side `label.padding` object must offset a bar label away from the bar by the facing-side
    // padding, exactly as an equivalent scalar padding does — otherwise the label box overlaps the bar
    // instead of floating clear of it. The mixed positive/negative data exercises the facing-side flip
    // between upward and downward bars.
    describe('per-side padding offset', () => {
        const paddingData = [
            { cat: 'A', value: 60 },
            { cat: 'B', value: -40 },
            { cat: 'C', value: 70 },
        ];

        const visibleLabelPositions = async (
            padding: Padding,
            placement: 'outside-end' | 'outside-start',
            direction: 'vertical' | 'horizontal'
        ) => {
            const vertical = direction === 'vertical';
            const options: AgCartesianChartOptions = {
                data: paddingData,
                legend: { enabled: false },
                axes: {
                    x: { type: 'category', position: vertical ? 'bottom' : 'left' },
                    y: { type: 'number', position: vertical ? 'left' : 'bottom' },
                },
                series: [
                    {
                        type: 'bar',
                        direction,
                        xKey: 'cat',
                        yKey: 'value',
                        label: { enabled: true, placement, fill: '#eeeeee', padding },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const series = deproxy(chart).series[0] as any;
            const nodes = series.labelSelection.nodes().filter((node: any) => node.visible);
            expect(nodes.length).toBe(paddingData.length);
            return nodes.map((node: any) => ({ x: node.x as number, y: node.y as number }));
        };

        const expectPerSideMatchesScalar = async (
            placement: 'outside-end' | 'outside-start',
            direction: 'vertical' | 'horizontal',
            perSidePadding: Padding
        ) => {
            const scalar = await visibleLabelPositions(10, placement, direction);
            chart.destroy();
            const perSide = await visibleLabelPositions(perSidePadding, placement, direction);
            const axis = direction === 'vertical' ? 'y' : 'x';
            for (let i = 0; i < perSide.length; i++) {
                expect(perSide[i][axis]).toBeCloseTo(scalar[i][axis]);
            }
        };

        it('offsets vertical outside-end labels by the facing padding, matching scalar padding', async () => {
            await expectPerSideMatchesScalar('outside-end', 'vertical', { top: 10, bottom: 10, left: 0, right: 0 });
        });

        it('offsets vertical outside-start labels by the facing padding, matching scalar padding', async () => {
            await expectPerSideMatchesScalar('outside-start', 'vertical', { top: 10, bottom: 10, left: 0, right: 0 });
        });

        it('offsets horizontal outside-end labels by the facing padding, matching scalar padding', async () => {
            await expectPerSideMatchesScalar('outside-end', 'horizontal', { top: 0, bottom: 0, left: 10, right: 10 });
        });

        // A rotated label's box turns a quarter-turn about its own centre, so per-side padding must not
        // move the rendered text: the box-facing edge stays a constant gap from the bar (along-axis) and
        // the glyph stays centred on the bar (cross-axis), whatever the per-side padding distribution.
        // A naive "read the rotated facing side" fix gets both wrong for asymmetric padding.
        const rotatedLabelGeometry = async (padding: Padding) => {
            const p =
                typeof padding === 'number'
                    ? { top: padding, right: padding, bottom: padding, left: padding }
                    : padding;
            const options: AgCartesianChartOptions = {
                data: [{ cat: 'A', value: 60 }],
                legend: { enabled: false },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [
                    {
                        type: 'bar',
                        direction: 'vertical',
                        xKey: 'cat',
                        yKey: 'value',
                        label: {
                            enabled: true,
                            placement: 'outside-end',
                            fill: '#eeeeee',
                            padding,
                            orientation: 'vertical',
                        },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const series = deproxy(chart).series[0] as any;
            const node = series.labelSelection.nodes().find((n: any) => n.visible);
            const bar = series.contextNodeData?.nodeData?.[0];
            const box = node.getTextMeasureBBox();
            const r = node.rotation;
            // Box rotates about its centre; at ±90° its bar-facing (vertical) extent is the box width.
            const boxBottom = box.y + box.height / 2 + Math.abs(box.width / 2);
            // Final glyph centre = box centre − R(θ)·shift, shift = ((right−left)/2, (bottom−top)/2).
            const sx = ((p.right ?? 0) - (p.left ?? 0)) / 2;
            const sy = ((p.bottom ?? 0) - (p.top ?? 0)) / 2;
            const glyphX = box.x + box.width / 2 - (Math.cos(r) * sx - Math.sin(r) * sy);
            return { clearance: bar.y - boxBottom, glyphOffset: glyphX - (bar.x + bar.width / 2) };
        };

        it('keeps a rotated outside-end label clear of and centred on the bar for any per-side padding', async () => {
            const scalar = await rotatedLabelGeometry(10);
            chart.destroy();
            const wideLeft = await rotatedLabelGeometry({ top: 0, bottom: 0, left: 50, right: 10 });
            chart.destroy();
            const wideRight = await rotatedLabelGeometry({ top: 0, bottom: 0, left: 10, right: 50 });
            chart.destroy();
            const tallAsym = await rotatedLabelGeometry({ top: 40, bottom: 4, left: 50, right: 10 });
            for (const variant of [scalar, wideLeft, wideRight, tallAsym]) {
                // Clear of the bar by the same gap as scalar padding...
                expect(variant.clearance).toBeCloseTo(scalar.clearance, 0);
                // ...and the glyph stays centred on the bar regardless of padding distribution.
                expect(variant.glyphOffset).toBeCloseTo(0, 0);
            }
        });
    });
});
