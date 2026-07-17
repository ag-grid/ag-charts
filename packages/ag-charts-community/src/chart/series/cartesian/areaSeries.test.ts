import { classCast } from '_ag-charts-test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChartAxisDirection, deepClone } from 'ag-charts-core';
import type {
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesOptions,
    AgAreaSeriesStylerParams,
    AgAreaSeriesStylerResult,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorRepeat,
    AgImageFillFit,
    AgPatternName,
    AgSeriesMarkerStyle,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Transformable } from '../../../scene/transformable';
import { LegendMarkerLabel } from '../../legend/legendMarkerLabel';
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
import { CUSTOM_SVG_PATHS, INVALID_CUSTOM_SVG_PATHS } from '../../test/customSvgPaths';
import {
    DATA_FRACTIONAL_LOG_AXIS,
    DATA_INVALID_DOMAIN_LOG_AXIS,
    DATA_NEGATIVE_LOG_AXIS,
    DATA_POSITIVE_LOG_AXIS,
    DATA_ZERO_EXTENT_LOG_AXIS,
} from '../../test/data';
import * as examples from '../../test/examples';
import { type MockAreaStyler, newFreezableMock } from '../../test/freezableMock';
import { testLegendItemName } from '../../test/legendItemName';
import type {
    CartesianOrPolarTestCase,
    ChartTestCase,
    PhasedPropertyExpectation,
    SceneFrameInvariant,
    SceneGeometrySample,
    SceneNodeExpectation,
    ScenePropertyExpectation,
    TrajectoryExpectation,
} from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    axisReflowSpec,
    cartesianChartAssertions,
    clickAction,
    compareImageSnapshot,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectNoAnimation,
    expectProgresses,
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
    tapAction,
    waitForChartStability,
} from '../../test/utils';
import { AreaSeries } from './areaSeries';

const buildLogAxisTestCase = (
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase => {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, 'area'),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: ['area'] }),
        ...extra,
    };
};

const EXAMPLES: Record<
    string,
    CartesianOrPolarTestCase & { skip?: boolean; imageSnapshotDefaults?: typeof IMAGE_SNAPSHOT_DEFAULTS }
> = {
    ...mixinReversedAxesCases({
        AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        STACKED_AREA_MISSING_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_Y_DATA_WITH_INTERPOLATION_EXAMPLE: {
            options: {
                ...examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
                series: (examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE.series ?? []).map((series) => ({
                    ...series,
                    interpolation: { type: 'smooth' },
                })),
            },
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['area'] }),
            warnings: [
                ['AG Charts - invalid value of type [undefined] for [AreaSeries-1 / xValue] ignored:', '[undefined]'],
            ],
            skipWarningsReversed: false,
        },
        AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['area'] }),
            warnings: [['AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:', '[null]']],
            skipWarningsReversed: false,
        },
        STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [undefined] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[undefined]',
                ],
            ],
            skipWarningsReversed: false,
        },
        STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
            warnings: [
                [
                    'AG Charts - invalid value of type [object] for [AreaSeries-1,AreaSeries-2 / xValue] ignored:',
                    '[null]',
                ],
            ],
            skipWarningsReversed: false,
        },
        AREA__TIME_X_AXIS_NUMBER_Y_AXIS: {
            options: examples.AREA_TIME_X_AXIS_NUMBER_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'unit-time', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_X_AXIS_TIME_Y_AXIS: {
            options: examples.AREA_NUMBER_X_AXIS_TIME_Y_AXIS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'unit-time' },
                seriesTypes: repeat('area', 2),
            }),
            skip: true,
        },
        AREA_NUMBER_AXES_0_X_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_X_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_NUMBER_AXES_0_Y_DOMAIN: {
            options: examples.AREA_NUMBER_AXES_0_Y_DOMAIN,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        STACKED_AREA_STROKE_MARKER_LABEL_RENDERING: {
            options: {
                ...examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE,
                series: (examples.STACKED_AREA_MISSING_Y_DATA_EXAMPLE.series ?? []).map((s) => ({
                    ...s,
                    strokeWidth: 20,
                    marker: { size: 15 },
                    label: {},
                })),
            },
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE: {
            options: examples.STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
        AREA_CATEGORY_X_AXIS_POSITIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_POSITIVE_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_NEGATIVE_LOG_Y_AXIS: buildLogAxisTestCase(DATA_NEGATIVE_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_FRACTIONAL_LOG_Y_AXIS: buildLogAxisTestCase(DATA_FRACTIONAL_LOG_AXIS),
        AREA_CATEGORY_X_AXIS_ZERO_EXTENT_LOG_Y_AXIS: buildLogAxisTestCase(DATA_ZERO_EXTENT_LOG_AXIS, {
            warnings: [
                'AG Charts - The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.',
            ],
            skipWarningsReversed: false,
        }),
        NORMALISED_AREA_STACKED: {
            options: examples.NORMALISED_STACKED_AREA,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 4),
            }),
        },
        AREA_SERIES_VERTICAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_VERTICAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_HORIZONTAL_GRADIENT_FILL: {
            options: examples.AREA_SERIES_HORIZONTAL_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_DEFAULT_GRADIENT_FILL: {
            options: examples.AREA_SERIES_DEFAULT_GRADIENT_FILL,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        },
        AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS: {
            options: examples.AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('area', 2),
            }),
        },
    }),
    AREA_SERIES_DEFAULT_PATTERN_FILL: {
        options: examples.AREA_SERIES_DEFAULT_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_VERTICAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_VERTICAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL: {
        options: examples.AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CIRCLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CIRCLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_SQUARES_PATTERN_FILL: {
        options: examples.AREA_SERIES_SQUARES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_TRIANGLES_PATTERN_FILL: {
        options: examples.AREA_SERIES_TRIANGLES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_DIAMONDS_PATTERN_FILL: {
        options: examples.AREA_SERIES_DIAMONDS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_STARS_PATTERN_FILL: {
        options: examples.AREA_SERIES_STARS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_HEARTS_PATTERN_FILL: {
        options: examples.AREA_SERIES_HEARTS_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CROSSES_PATTERN_FILL: {
        options: examples.AREA_SERIES_CROSSES_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_SERIES_CUSTOMISED_PATTERN_FILL: {
        options: examples.AREA_SERIES_CUSTOMISED_PATTERN_FILL,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    AREA_NULL_CATEGORY_KEY: {
        options: examples.AREA_NULL_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        warnings: [['AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:', '[null]']],
    },
    AREA_NULL_CATEGORY_KEY_ALLOWED: {
        options: examples.AREA_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_UNDEFINED_CATEGORY_KEY: {
        options: examples.AREA_UNDEFINED_CATEGORY_KEY_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
        warnings: [
            ['AG Charts - invalid value of type [undefined] for [AreaSeries-1 / xValue] ignored:', '[undefined]'],
        ],
    },
    AREA_UNDEFINED_CATEGORY_KEY_ALLOWED: {
        options: examples.AREA_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    AREA_NULL_AND_UNDEFINED_KEYS: {
        options: examples.AREA_NULL_AND_UNDEFINED_KEYS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['area'] }),
    },
    STACKED_AREA_SERIES_STACK_GROUPS: {
        options: examples.STACKED_AREA_SERIES_STACK_GROUPS,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('area', 4),
        }),
    },
};

const INVALID_DATA_EXAMPLES: Record<string, ChartTestCase> = {
    AREA_CATEGORY_X_AXIS_INVALID_DOMAIN_LOG_Y_AXIS: buildLogAxisTestCase(DATA_INVALID_DOMAIN_LOG_AXIS),
};

describe('AreaSeries', () => {
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
        vi.resetAllMocks();
    });

    const ctx = setupMockCanvas();

    describe('#create', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        test('no data', async () => {
            chart = AgCharts.create(prepareTestOptions({ data: [], series: [{ type: 'area', xKey: 'x', yKey: 'y' }] }));
            await compare();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            if (example.skip === true) {
                // Support skipping.
                it.skip(`for ${exampleName} it should create chart instance as expected`, async () => {});
                // Support skipping.
                it.skip(`for ${exampleName} it should render to canvas as expected`, async () => {});
            } else {
                it(`for ${exampleName} it should create chart instance as expected`, async () => {
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
                });

                it(`for ${exampleName} it should render to canvas as expected`, async () => {
                    const options: AgChartOptions = { ...example.options };
                    prepareTestOptions(options);

                    chart = AgCharts.create(options);
                    await compare(example.imageSnapshotDefaults);

                    if (example.extraScreenshotActions) {
                        await example.extraScreenshotActions(chart);
                        await compare(example.imageSnapshotDefaults);
                    }
                });
            }
        }
    });

    // The initial-load reveal is pinned per-frame by the 'initial load: the stacked fills and strokes
    // swipe in while markers scale in' and 'integrated mode: initial load' trajectory CASEs in
    // 'animation -test page actions'.

    // Adding and removing points at both edges is pinned per-frame by the 'single add points
    // before/after' and 'single remove first/last point' trajectory CASEs in 'animation -test page
    // actions'.

    // Opening and closing a gap (data to/from undefined) is pinned per-frame by the 'single update to
    // undefined' and 'single update from undefined' trajectory CASEs in 'animation -test page actions'.

    // Legend hide/show is pinned per-frame by the 'legend hide' and 'legend show' trajectory CASEs in
    // 'animation -test page actions'.

    // One CASE per control on the area-series-test pages, in standalone and integrated modes. Area
    // paints TWO nodes per series — a fill polygon (in the background group) and a top-edge stroke — so
    // every path assertion resolves both keys and pins each. The initial reveal, grouping switches and
    // normalizedTo changes all re-run the clip-based swipe reveal (identical mechanism to the line
    // suite's easeOut reveal); data updates morph both paths per-station while the markers re-fade.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        // Stacked category fixture on a pinned value domain, matching the public animation docs' shape:
        // within [0, 200] the randomise/toggle updates below are provably non-scale-affecting, so the
        // stack animates in isolation.
        const stackedOptions = (mode?: 'integrated'): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data: [
                    { q: 'Q1', a: 40, b: 30, c: 20 },
                    { q: 'Q2', a: 60, b: 40, c: 25 },
                    { q: 'Q3', a: 50, b: 35, c: 30 },
                ],
                series: [
                    { type: 'area', xKey: 'q', yKey: 'a', stacked: true, marker: { enabled: true } },
                    { type: 'area', xKey: 'q', yKey: 'b', stacked: true, marker: { enabled: true } },
                    { type: 'area', xKey: 'q', yKey: 'c', stacked: true, marker: { enabled: true } },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            if (mode != null) (options as AgChartOptions & { mode: string }).mode = mode;
            return prepareTestOptions(options);
        };

        // A single non-stacked area on pinned x- AND y-domains: within [0, 10] × [0, 200] every point
        // mutation is provably non-scale-affecting, so the fill/stroke and markers animate in isolation.
        const singleOptions = (
            data: Array<{ x: number; y: number | undefined }>,
            mode?: 'integrated'
        ): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data,
                series: [{ type: 'area', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 10 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            if (mode != null) (options as AgChartOptions & { mode: string }).mode = mode;
            return prepareTestOptions(options);
        };

        const categoryOptions = (
            data: Array<{ x: string; y: number }>,
            mode?: 'integrated'
        ): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data,
                series: [{ type: 'area', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            if (mode != null) (options as AgChartOptions & { mode: string }).mode = mode;
            return prepareTestOptions(options);
        };

        // The fill renders in the series background group and the stroke in the content group; re-created
        // series (grouping/normalizedTo/direction switches) bump the sampler's duplicate suffix
        // (path[fill#2]), so both are matched by prefix.
        const fillKey = (sample: SceneGeometrySample, i = 0): string => {
            const keys = [...sample.keys()].filter((k) =>
                new RegExp(`^series\\[${i}\\]/background/path\\[fill`).test(k)
            );
            expect(keys, `series[${i}] fill`).toHaveLength(1);
            return keys[0];
        };
        const strokeKey = (sample: SceneGeometrySample, i = 0): string => {
            const keys = [...sample.keys()].filter((k) => new RegExp(`^series\\[${i}\\]/path\\[stroke`).test(k));
            expect(keys, `series[${i}] stroke`).toHaveLength(1);
            return keys[0];
        };
        const strokeKeysAll = (sample: SceneGeometrySample): string[] =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/path\[stroke/.test(k)).sort((a, b) => a.localeCompare(b));

        const markerCount = (sample: SceneGeometrySample, i = 0) =>
            [...sample.keys()].filter((k) => new RegExp(`^series\\[${i}\\]/marker\\[`).test(k)).length;

        const markerX = (sample: SceneGeometrySample, label: string, i = 0) => {
            const m = sample.get(`series[${i}]/marker[${label}]`);
            return m ? m.x + (m.translationX ?? 0) : undefined;
        };

        // Area markers re-map their local position the instant the data lands and only opacity re-fades;
        // category swaps snap them to their new bands. captureUpdate's whole-scene start anchor trips on
        // that frame-0 snap, so the CASEs hand-roll the capture (as the line suite's captureFrom does) and
        // pin only what genuinely tweens.
        const captureFrom = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

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

        // A data update re-fades every present marker (survivors and entrants) from opacity 0 during
        // add/trailing. Only anti-vacuous alongside a frame-0 expectMarkerStartsCollapsed guard.
        const fadeIn: PhasedPropertyExpectation = {
            during: ['add', 'trailing'],
            expect: ['increases', 'bounded'],
            settlesAt: 1,
        };
        // Markers re-map their local x/y the instant the data lands, so local position is left free;
        // translation must stay put (a fromToMotion regression would fly them across the plot).
        const markerPosition: Record<string, ScenePropertyExpectation> = {
            x: 'any',
            y: 'any',
            translationX: 'constant',
            translationY: 'constant',
        };
        const markersFadeIn: Record<string, SceneNodeExpectation> = {
            'series[*]/marker[*]': { opacity: fadeIn, ...markerPosition },
        };
        // Markers re-fade later during a structural toggle/remove — the window spans update/add/trailing.
        const markerRefade: SceneNodeExpectation = {
            opacity: { during: ['update', 'add', 'trailing'], expect: ['increases', 'bounded'], settlesAt: 1 },
            ...markerPosition,
        };
        // On the initial-load reveal the swipe scales the markers in from zero size (opacity stays 1),
        // staggered across the sweep, so width/height grow.
        const markersScaleIn: Record<string, SceneNodeExpectation> = {
            'series[*]/marker[*]': {
                width: ['increases', 'bounded'],
                height: ['increases', 'bounded'],
                ...markerPosition,
            },
        };

        // The clip-based reveal: both paths are drawn in full from the first frame (their vertices never
        // move) while a clip window sweeps left-to-right (clip:x grows across the plot). clip drops to 0
        // once the mask is removed at the end, so clip:x is only present during the sweep.
        const swipeReveal = (): SceneNodeExpectation => ({
            'top@0': 'constant',
            'top@1': 'constant',
            'top@2': 'constant',
            'top@3': 'constant',
            'top@4': 'constant',
            'clip:x': ['increases', 'progresses', 'bounded'],
            x: 'constant',
            y: 'constant',
            width: 'constant',
            height: 'constant',
            opacity: 'constant',
            subpaths: 'any',
            clip: 'any',
            'clip:y': 'any',
        });

        // Stacked area fills are contiguous bands: each layer's fill spans from its own stroke (top edge)
        // down to the layer below's stroke, and the bottom layer down to the baseline. The samplable
        // contract is that the per-station stroke tops never cross — layer k sits at or above layer k-1 on
        // every station of every frame. Layers whose station is non-finite (a legend-hidden layer once it
        // goes invisible) are skipped.
        const stackTopsOrdered: SceneFrameInvariant = {
            name: 'stacked area layers never invert',
            check: (frame) => {
                const keys = strokeKeysAll(frame);
                for (let s = 0; s <= 4; s++) {
                    let below: number | undefined;
                    for (const key of keys) {
                        const top = frame.get(key)?.[`top@${s}`];
                        if (top == null || !Number.isFinite(top)) continue;
                        if (below != null && top > below + 1) {
                            return `station ${s}: ${key} top ${top.toFixed(2)} sits below the layer under it (${below.toFixed(2)})`;
                        }
                        below = top;
                    }
                }
                return undefined;
            },
        };

        it('initial load: the stacked fills and strokes swipe in while markers scale in', async () => {
            chart = AgCharts.create(stackedOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            const fill0 = fillKey(trajectory.at(-1)!);
            expectSceneTrajectory(
                trajectory,
                {
                    'series[*]/background/path[*]': swipeReveal(),
                    'series[*]/path[stroke*]': swipeReveal(),
                    ...markersScaleIn,
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            // Anti-vacuity: the sweep starts collapsed (clip window at the left edge) and a marker at zero size.
            expect(trajectory[0].get(fill0)!['clip:x']).toBeLessThanOrEqual(0.1);
            expectMarkerStartsCollapsed(trajectory, 'Q3', 'width');
        });

        // "Update points" / "Randomise" — every value jitters within the pinned domain. Both paths morph
        // per-station during the update phase, the markers re-fade, and the stack stays contiguous.
        it('randomise: both paths morph per-station monotonically while the stack holds', async () => {
            const options = stackedOptions();
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            await chart.updateDelta({
                data: [
                    { q: 'Q1', a: 20, b: 60, c: 30 },
                    { q: 'Q2', a: 90, b: 25, c: 40 },
                    { q: 'Q3', a: 35, b: 70, c: 15 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            expectSceneSamplesMatch(trajectory.at(-1)!, sampleScene());
            const morphs = (during: 'update'): SceneNodeExpectation => ({
                x: { during, expect: 'constant' },
                width: { during, expect: 'constant' },
                y: 'any',
                height: 'any',
                subpaths: 'any',
                'top@0': { during, expect: ['monotonic', 'bounded'] },
                'top@1': { during, expect: ['monotonic', 'bounded'] },
                'top@2': { during, expect: ['monotonic', 'progresses', 'bounded'] },
                'top@3': { during, expect: ['monotonic', 'bounded'] },
                'top@4': { during, expect: ['monotonic', 'bounded'] },
            });
            expectSceneTrajectory(
                trajectory,
                {
                    'series[*]/background/path[*]': morphs('update'),
                    'series[*]/path[stroke]': morphs('update'),
                    'series[*]/marker[*]': { opacity: fadeIn, ...markerPosition },
                    ...axisReflowSpec('bottom', {}),
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            expectMarkerStartsCollapsed(trajectory, 'Q1');
        });

        // "Add Series" — a fourth layer would stack on top; here the third is added back. The entering
        // series spawns at its final band geometry and fades its fill, stroke and markers in (unlike line,
        // which snaps a new series in). The lower survivors are unaffected (their cumulative is unchanged).
        it('add series: the entering fill, stroke and markers fade in at full geometry', async () => {
            const options = stackedOptions();
            const all = options.series!;
            options.series = all.slice(0, 2);
            const { trajectory, after } = await captureFrom({ ...options } as AgCartesianChartOptions, () =>
                chart.update({ ...options, series: all })
            );
            const entFill = fillKey(after, 2);
            const entStroke = strokeKey(after, 2);
            const fadeUp: ScenePropertyExpectation = {
                during: ['add', 'trailing'],
                expect: ['increases', 'bounded'],
                settlesAt: 1,
            };
            expectSceneTrajectory(trajectory, {
                'series[2]/background/path[*]': { opacity: fadeUp, subpaths: 'any' },
                'series[2]/path[stroke]': { opacity: fadeUp, subpaths: 'any' },
                'series[2]/marker[*]': { opacity: fadeUp },
                // The lower survivors re-fade their markers but their bands are unchanged (only the fill's
                // drawn-subpath count flips as the new top layer joins).
                'series[0]/background/path[*]': { subpaths: 'any' },
                'series[1]/background/path[*]': { subpaths: 'any' },
                'series[0]/marker[*]': markerRefade,
                'series[1]/marker[*]': markerRefade,
                ...axisReflowSpec('bottom', {}),
            });
            // Anti-vacuity: the entrants genuinely start invisible.
            expectNodeStartsCollapsed(trajectory, entFill);
            expectNodeStartsCollapsed(trajectory, entStroke);
            expect(trajectory[0].get('series[2]/marker[Q1]')?.opacity ?? 1).toBeLessThanOrEqual(0.001);
        });

        // "Remove Series" — the top layer leaves; its nodes drop immediately (no fade-out to observe) and
        // the lower survivors are unchanged, so the honest invariant is that nothing animates.
        it('remove series: the top layer drops and nothing else animates', async () => {
            const options = stackedOptions();
            const all = options.series!;
            const { before, trajectory, after } = await captureFrom(options, () =>
                chart.update({ ...options, series: all.slice(0, 2) })
            );
            expect([...before.keys()].some((k) => k.startsWith('series[2]'))).toBe(true);
            expect([...after.keys()].some((k) => k.startsWith('series[2]'))).toBe(false);
            expect(trajectory.some((f) => [...f.keys()].some((k) => k.startsWith('series[2]')))).toBe(false);
            // The removed top layer leaves no motion behind; the survivors' bands hold (only their
            // markers re-fade).
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/background/path[*]': { subpaths: 'any' },
                    'series[1]/background/path[*]': { subpaths: 'any' },
                    'series[0]/marker[*]': markerRefade,
                    'series[1]/marker[*]': markerRefade,
                    ...axisReflowSpec('bottom', {}),
                },
                { frameInvariants: [stackTopsOrdered] }
            );
        });

        // "Toggle series off" (stacked) — a coordinated single-beat update: the toggled-off bottom layer's
        // fill collapses to the baseline while the survivors slide down into its place, tiling contiguously
        // every frame. The `during: 'update'` windows are the desync-regression detector (CRT-1040 analogue).
        it('legend hide: the toggled layer collapses as survivors slide down, staying contiguous', async () => {
            const options = stackedOptions();
            const { trajectory, after } = await captureFrom(options, () =>
                chart.update({
                    ...options,
                    series: options.series!.map((s, i) => (i === 0 ? { ...s, visible: false } : s)),
                })
            );
            const hiddenFill = fillKey(trajectory[0], 0);
            // Anti-vacuity: the toggled-off layer starts at full height and must genuinely collapse.
            expect(trajectory[0].get(hiddenFill)!.height).toBeGreaterThan(40);
            // The survivors genuinely tween (not snap): y/height/every top@N pass through several
            // intermediate frames rather than jumping straight to their resting value, so `progresses`
            // proves real sliding, not just a net direction.
            const slideDown: SceneNodeExpectation = {
                y: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                height: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                x: { during: 'update', expect: 'constant' },
                width: { during: 'update', expect: 'constant' },
                subpaths: 'any',
                'top@0': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@1': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@2': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@3': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@4': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/background/path[*]': {
                        height: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        y: { during: 'update', expect: ['increases', 'bounded'] },
                        subpaths: 'any',
                        visible: { during: 'update', expect: ['decreases', 'bounded'] },
                        'top@0': 'any',
                        'top@1': 'any',
                        'top@2': 'any',
                        'top@3': 'any',
                        'top@4': 'any',
                        x: 'any',
                        width: 'any',
                    },
                    // The stroke traces the same collapsing top edge as the background fill above, but
                    // (unlike the fill polygon) never splits into a second subpath, so every station holds
                    // its collapse cleanly and x/width stay pinned to the full plot width throughout.
                    'series[0]/path[stroke]': {
                        x: 'constant',
                        width: 'constant',
                        y: { during: 'update', expect: ['increases', 'bounded'] },
                        height: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        visible: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        'top@0': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@1': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@2': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@3': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@4': { during: 'update', expect: ['increases', 'bounded'] },
                        subpaths: 'any',
                    },
                    // The toggled-off layer's markers never render (visible stays 0 throughout); their
                    // opacity keeps re-fading internally regardless, so only that property is left free.
                    'series[0]/marker[*]': { opacity: 'any', visible: 'constant' },
                    'series[1]/background/path[*]': slideDown,
                    'series[1]/path[stroke]': slideDown,
                    'series[2]/background/path[*]': slideDown,
                    'series[2]/path[stroke]': slideDown,
                    'series[1]/marker[*]': markerRefade,
                    'series[2]/marker[*]': markerRefade,
                    ...axisReflowSpec('bottom', {}),
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            expect(after.get(fillKey(after, 0))!.visible).toBe(0);
        });

        // "Toggle series back on" (stacked) — the exit in reverse: the re-shown bottom layer grows from the
        // baseline while the survivors slide back up, again coordinated in the update phase.
        it('legend show: the re-shown layer grows as survivors slide back, staying contiguous', async () => {
            const options = stackedOptions();
            const hidden = {
                ...options,
                series: options.series!.map((s, i) => (i === 0 ? { ...s, visible: false } : s)),
            };
            const { trajectory, after } = await captureFrom(hidden, () => chart.update(options));
            const shownFill = fillKey(after, 0);
            // The mirror of "legend hide"'s slideDown: the two survivors slide back up as the re-shown
            // layer grows in beneath them. As there, every property tweens through several frames rather
            // than snapping, so `progresses` proves real sliding.
            const slideUp: SceneNodeExpectation = {
                y: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                height: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                x: { during: 'update', expect: 'constant' },
                width: { during: 'update', expect: 'constant' },
                subpaths: 'any',
                'top@0': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@1': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@2': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@3': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@4': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
            };
            // The re-shown layer's own growth, mirroring "legend hide"'s collapse in reverse. Unlike the
            // hide toggle, `visible` flips to 1 immediately (show-then-animate, not collapse-then-hide), so
            // it holds constant across the whole capture rather than transitioning mid-trajectory.
            const growFromBaseline: SceneNodeExpectation = {
                height: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                y: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                x: { during: 'update', expect: 'constant' },
                width: { during: 'update', expect: 'constant' },
                subpaths: 'any',
                'top@0': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@1': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@2': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@3': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                'top@4': { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/background/path[*]': growFromBaseline,
                    'series[0]/path[stroke]': growFromBaseline,
                    'series[0]/marker[*]': markerRefade,
                    'series[1]/background/path[*]': slideUp,
                    'series[2]/background/path[*]': slideUp,
                    'series[1]/path[stroke]': slideUp,
                    'series[2]/path[stroke]': slideUp,
                    'series[1]/marker[*]': markerRefade,
                    'series[2]/marker[*]': markerRefade,
                    ...axisReflowSpec('bottom', {}),
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            // The re-shown layer ends at full height.
            expect(after.get(shownFill)!.height).toBeGreaterThan(40);
        });

        // The pinned-extent single-series update spec: the fill/stroke keep their x-extent while the
        // top edge morphs per-station, and the stroke stays one connected subpath.
        const morphInPlace = (opts: { pinnedTops?: boolean } = {}): Record<string, ScenePropertyExpectation> => ({
            x: { during: 'update', expect: 'constant' },
            width: { during: 'update', expect: 'constant' },
            y: 'any',
            height: 'any',
            subpaths: 'any',
            'top@0': opts.pinnedTops ? 'constant' : { during: 'update', expect: ['monotonic', 'bounded'] },
            'top@1': { during: 'update', expect: ['monotonic', 'bounded'] },
            'top@2': { during: 'update', expect: ['monotonic', 'bounded'] },
            'top@3': { during: 'update', expect: ['monotonic', 'bounded'] },
            'top@4': opts.pinnedTops ? 'constant' : { during: 'update', expect: ['monotonic', 'bounded'] },
        });

        // Add/remove/reflow cases pin the fill and stroke to the x-extent motion they share — the left
        // edge (x) and total width step a known direction — and leave the interior (per-station tops and
        // the vertical bbox derived from them) free. `increasingExtent`/`decreasingExtent` bound a
        // monotonic edge to its endpoints and force a real tween (never a snap); `squeezing` is for an
        // edge that dips and returns to where it started (a shift, or a category reflow that redistributes
        // bands within a fixed plot width) so it cannot be endpoint-bounded, only proven to move.
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

        // "Update points" — every value jitters within the pinned domain. Both paths morph per-station
        // while the x-extent and axes hold, the stroke stays one subpath, and the markers re-fade.
        it('single update points: both paths morph per-station while the extent holds', async () => {
            const { before, trajectory } = await captureFrom(
                singleOptions([
                    { x: 0, y: 40 },
                    { x: 2, y: 120 },
                    { x: 4, y: 80 },
                    { x: 6, y: 160 },
                    { x: 8, y: 60 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 90 },
                            { x: 2, y: 50 },
                            { x: 4, y: 140 },
                            { x: 6, y: 70 },
                            { x: 8, y: 110 },
                        ],
                    })
            );
            const stroke0 = strokeKey(before);
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': morphInPlace(),
                'series[0]/path[stroke]': { ...morphInPlace(), subpaths: { during: 'update', expect: 'constant' } },
                'series[0]/marker[*]': { opacity: fadeIn, ...markerPosition },
            });
            // Anti-vacuity: the stroke really tweens through an intermediate at the middle station.
            expectProgresses(trajectory.map((f) => f.get(stroke0)!['top@2']));
            expectMarkerStartsCollapsed(trajectory, '2');
        });

        // "Add points after" — new points extend the path rightward within the pinned x-domain: the left
        // edge is anchored (x holds) while the width grows, and the new markers fade in.
        it('single add points after: the width grows and new markers fade in', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            const stroke0 = strokeKey(before);
            expect(after.get(stroke0)!.width).toBeGreaterThan(before.get(stroke0)!.width);
            // The new points widen the path from the right: the two stations nearest the anchored left
            // edge settle cleanly, but the station nearest the growing edge overshoots past its final
            // resting value before correcting, so it can only be proven to progress.
            const addAfterTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': squeezing,
                'top@4': decreasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', increasingExtent, 'any', [], addAfterTops),
                'series[0]/path[stroke]': extentMorph('constant', increasingExtent, 'constant', [], addAfterTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '5');
        });

        // "Add points before" — prepend points; the left edge steps OUT (bbox x decreases) as the width
        // grows, and the new leading markers fade in.
        it('single add points before: the left edge steps out as the width grows', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            expect(markerCount(after)).toBe(7);
            const stroke0 = strokeKey(before);
            expect(after.get(stroke0)!.x).toBeLessThan(before.get(stroke0)!.x);
            // The prepended points widen the path from the left: the station nearest the anchored right
            // edge legitimately vanishes as the new leading segment sweeps past it (degenerate), and the
            // station nearest the growing left edge overshoots past its final resting value, so it can
            // only be proven to progress.
            const addBeforeTops = {
                'top@0': decreasingExtent,
                'top@1': squeezing,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(
                    decreasingExtent,
                    increasingExtent,
                    'any',
                    [4],
                    addBeforeTops
                ),
                'series[0]/path[stroke]': extentMorph(
                    decreasingExtent,
                    increasingExtent,
                    'constant',
                    [4],
                    addBeforeTops
                ),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // "Remove points middle" — interior points leave; the endpoints (x-extent) are unchanged so the
        // width holds and the stroke stays connected, while the removed markers drop.
        it('single remove points middle: the extent holds while interior markers leave', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            const stroke0 = strokeKey(before);
            expect(after.get(stroke0)!.width).toBeCloseTo(before.get(stroke0)!.width, 0);
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    y: 'any',
                    height: 'any',
                    subpaths: 'any',
                    'top@0': 'constant',
                    'top@4': 'constant',
                    'top@1': decreasingExtent,
                    'top@2': increasingExtent,
                    'top@3': increasingExtent,
                },
                'series[0]/path[stroke]': {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    subpaths: { during: 'update', expect: 'constant' },
                    y: 'any',
                    height: 'any',
                    'top@0': 'constant',
                    'top@4': 'constant',
                    'top@1': decreasingExtent,
                    'top@2': increasingExtent,
                    'top@3': increasingExtent,
                },
                ...markersFadeIn,
            });
        });

        // "Remove the first point" — the leftmost point leaves, so the path's left edge steps IN: bbox x
        // increases while the width shrinks.
        it('single remove first point: the left edge steps in and the width shrinks', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            expect(markerCount(after)).toBe(4);
            const stroke0 = strokeKey(before);
            expect(after.get(stroke0)!.x).toBeGreaterThan(before.get(stroke0)!.x);
            expect(after.get(stroke0)!.width).toBeLessThan(before.get(stroke0)!.width);
            // The retained points keep their pixel positions, so every interior station morphs cleanly
            // to where the shrunk path now crosses it.
            const removeFirstTops = {
                'top@0': decreasingExtent,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(
                    increasingExtent,
                    decreasingExtent,
                    'any',
                    [],
                    removeFirstTops
                ),
                'series[0]/path[stroke]': extentMorph(
                    increasingExtent,
                    decreasingExtent,
                    'constant',
                    [],
                    removeFirstTops
                ),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '2');
        });

        // "Remove the last point" — the rightmost point leaves, so the right edge steps in: bbox x holds
        // (left edge anchored) while the width shrinks.
        it('single remove last point: the right edge steps in and the width shrinks', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            expect(markerCount(after)).toBe(4);
            const stroke0 = strokeKey(before);
            expect(after.get(stroke0)!.width).toBeLessThan(before.get(stroke0)!.width);
            // The retained points keep their pixel positions, so every interior station morphs cleanly
            // to where the shrunk path now crosses it.
            const removeLastTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
                'top@4': decreasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', decreasingExtent, 'any', [], removeLastTops),
                'series[0]/path[stroke]': extentMorph('constant', decreasingExtent, 'constant', [], removeLastTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // "Update points to undefined" — an interior value becoming undefined opens a gap. The STROKE
        // splits and its stations straddling the gap lose their crossing (degenerate); the FILL closes to
        // the baseline instead of splitting, so its gap stations dive downward. The gap marker leaves.
        it('single update to undefined: the stroke splits at the gap while the fill closes to the baseline', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
            const stroke0 = strokeKey(before);
            expect(before.get(stroke0)!.subpaths).toBe(1);
            expect(after.get(stroke0)!.subpaths).toBe(2);
            expectSceneTrajectory(trajectory, {
                'series[0]/path[stroke]': {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    y: 'any',
                    height: 'any',
                    subpaths: 'any',
                    'top@0': 'constant',
                    'top@1': 'constant',
                    'top@2': 'degenerate',
                    'top@3': 'degenerate',
                    'top@4': 'constant',
                },
                'series[0]/background/path[*]': {
                    x: { during: 'update', expect: 'constant' },
                    width: { during: 'update', expect: 'constant' },
                    y: 'any',
                    height: 'any',
                    subpaths: 'any',
                    'top@0': 'constant',
                    'top@1': 'constant',
                    'top@2': { during: 'update', expect: increasingExtent },
                    'top@3': { during: 'update', expect: increasingExtent },
                    'top@4': 'constant',
                },
                ...markersFadeIn,
            });
        });

        // "Update points to defined" — the reverse: an undefined interior value fills back in, so the
        // stroke re-joins (2 subpaths -> 1) and the returning marker fades in. The gap stations don't
        // animate FROM their true (non-finite) static geometry: the tween starts from a collapsed
        // placeholder shared by both stations, then morphs down to where the reconnected path settles.
        it('single update from undefined: the stroke re-joins as the gap closes', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: undefined },
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
                        ],
                    })
            );
            const stroke0 = strokeKey(before);
            expect(before.get(stroke0)!.subpaths).toBe(2);
            expect(after.get(stroke0)!.subpaths).toBe(1);
            expect(markerCount(after)).toBeGreaterThan(markerCount(before));
            const gapClosingTops = {
                'top@0': 'constant' as const,
                'top@1': 'constant' as const,
                'top@2': decreasingExtent,
                'top@3': decreasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'any', [], gapClosingTops),
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], gapClosingTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '2');
        });

        // The interior stations trace the same zigzag curve as it steps across the pinned domain: two
        // alternate rising and falling monotonically to their new resting value, while the far edge
        // (top@4) rides the structurally-changing station and legitimately goes non-finite mid-tween.
        const shiftTops = {
            'top@0': decreasingExtent,
            'top@1': increasingExtent,
            'top@2': decreasingExtent,
            'top@3': increasingExtent,
        };

        // "Shift left" — drop the first point, append one at the end: the left edge steps in (x increases)
        // while one marker leaves at the start and one enters at the end.
        it('single shift left: the left edge steps in as the first point leaves and one enters', async () => {
            const { trajectory, after } = await captureFrom(
                singleOptions([
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
            expect(markerCount(after)).toBe(5);
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(increasingExtent, squeezing, 'any', [4], shiftTops),
                'series[0]/path[stroke]': extentMorph(increasingExtent, squeezing, 'constant', [4], shiftTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '6');
        });

        // "Shift right" — prepend a point, drop the last: mirror of shift left, the left edge steps out.
        it('single shift right: the left edge steps out as a new first point enters and the last leaves', async () => {
            const { trajectory, after } = await captureFrom(
                singleOptions([
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
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(decreasingExtent, squeezing, 'any', [4], shiftTops),
                'series[0]/path[stroke]': extentMorph(decreasingExtent, squeezing, 'constant', [4], shiftTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
        });

        // "Add points middle" (continuous x-axis) — an interior point drops in between two existing ones.
        // On a pinned number axis every point maps to a fixed pixel, so the neighbours do NOT spread apart
        // (unlike a category reflow): the new point is woven in while the existing geometry holds. This
        // exercises the enter animation for a datum arriving in the interior rather than at an edge.
        it('single add points middle: an interior point weaves in without disturbing its neighbours', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
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
                            { x: 2, y: 120 },
                            { x: 4, y: 80 },
                            { x: 5, y: 100 },
                            { x: 6, y: 160 },
                            { x: 8, y: 60 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(5);
            expect(markerCount(after)).toBe(6);
            expect([...after.keys()]).toContain('series[0]/marker[5]');
            // The new point lands strictly between its neighbours.
            expect(markerX(after, '4')).toBeLessThan(markerX(after, '5')!);
            expect(markerX(after, '5')).toBeLessThan(markerX(after, '6')!);
            // Insertion-spread on a continuous axis: the existing points keep their exact pixel positions,
            // so the neighbours hold rather than moving away from the insertion.
            for (const n of ['0', '2', '4', '6', '8']) {
                expect(markerX(after, n), `marker ${n} present after`).toBeDefined();
                expect(Math.abs(markerX(after, n)! - markerX(before, n)!), `marker ${n} held`).toBeLessThanOrEqual(1);
            }
            // None of the five stations fall on the woven-in point, and the retained points don't move,
            // so every station is untouched by the insertion.
            const addMiddleTops = {
                'top@0': 'constant' as const,
                'top@1': 'constant' as const,
                'top@2': 'constant' as const,
                'top@3': 'constant' as const,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], addMiddleTops),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant', [], addMiddleTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '5');
        });

        // "Remove half" — a bulk update drops several interior points at once, exercising simultaneous
        // leave animations. The retained endpoints pin the extent, so the band holds its width and stays
        // one connected subpath while four markers leave together.
        it('single remove half: several interior points leave together while the extent holds', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                    { x: 3, y: 160 },
                    { x: 4, y: 60 },
                    { x: 5, y: 100 },
                    { x: 6, y: 140 },
                    { x: 7, y: 70 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 2, y: 80 },
                            { x: 5, y: 100 },
                            { x: 7, y: 70 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(8);
            expect(markerCount(after)).toBe(4);
            for (const gone of ['1', '3', '4', '6']) {
                expect([...after.keys()], `marker ${gone} removed`).not.toContain(`series[0]/marker[${gone}]`);
            }
            // The survivors keep their positions and the endpoints pin the extent.
            for (const kept of ['0', '2', '5', '7']) {
                expect(markerX(after, kept), `marker ${kept} present after`).toBeDefined();
                expect(
                    Math.abs(markerX(after, kept)! - markerX(before, kept)!),
                    `marker ${kept} held`
                ).toBeLessThanOrEqual(1);
            }
            // The retained endpoints anchor stations 0 and 4; the three interior stations all morph
            // toward the surviving neighbours in the same direction as the removed points drop out.
            const removeHalfTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': increasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], removeHalfTops),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant', [], removeHalfTops),
                ...markersFadeIn,
            });
        });

        // "Add double" — the bulk-insertion mirror: one update roughly doubles the point count by weaving
        // several new points into the interior, exercising simultaneous enter animations. The retained
        // endpoints pin the extent; the three new markers fade in together.
        it('single add double: several interior points enter together at a fixed extent', async () => {
            const { before, trajectory, after } = await captureFrom(
                singleOptions([
                    { x: 0, y: 40 },
                    { x: 2, y: 80 },
                    { x: 4, y: 60 },
                    { x: 6, y: 140 },
                ]),
                () =>
                    chart.updateDelta({
                        data: [
                            { x: 0, y: 40 },
                            { x: 1, y: 120 },
                            { x: 2, y: 80 },
                            { x: 3, y: 160 },
                            { x: 4, y: 60 },
                            { x: 5, y: 100 },
                            { x: 6, y: 140 },
                        ],
                    })
            );
            expect(markerCount(before)).toBe(4);
            expect(markerCount(after)).toBe(7);
            for (const added of ['1', '3', '5']) {
                expect([...after.keys()], `marker ${added} added`).toContain(`series[0]/marker[${added}]`);
            }
            // The originals keep their positions; the inserted points weave between them.
            for (const kept of ['0', '2', '4', '6']) {
                expect(markerX(after, kept), `marker ${kept} present after`).toBeDefined();
                expect(
                    Math.abs(markerX(after, kept)! - markerX(before, kept)!),
                    `marker ${kept} held`
                ).toBeLessThanOrEqual(1);
            }
            // Stations 0, 3 and 4 land exactly on retained points that don't move; stations 1 and 2 sit
            // between originals and morph toward the woven-in points.
            const addDoubleTops = {
                'top@0': 'constant' as const,
                'top@1': decreasingExtent,
                'top@2': decreasingExtent,
                'top@3': 'constant' as const,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], addDoubleTops),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant', [], addDoubleTops),
                ...markersFadeIn,
            });
            expectMarkerStartsCollapsed(trajectory, '1');
            expectMarkerStartsCollapsed(trajectory, '3');
            expectMarkerStartsCollapsed(trajectory, '5');
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

        // "Add End Week" — a new category appends; every band narrows and shifts left to make room, the
        // paths re-cover the reflowed bands, and the new marker fades in.
        it('category add end week: bands reflow left and the new marker fades in', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: [...WEEKS, { x: 'w12', y: 90 }] })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(8);
            // The left edge is pinned (station 0 holds); the interior widens towards the new right edge,
            // except the station nearest it, which overshoots past its resting value before correcting.
            const addEndWeekTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': increasingExtent,
                'top@3': squeezing,
                'top@4': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', squeezing, 'any', [], addEndWeekTops),
                'series[0]/path[stroke]': extentMorph('constant', squeezing, 'constant', [], addEndWeekTops),
                ...markersFadeIn,
                ...axisReflowSpec('bottom', { shift: 'left' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w12');
        });

        // "Add Start Week" — a new category prepends; bands reflow right and the new leading marker fades in.
        it('category add start week: bands reflow right and the leading marker fades in', async () => {
            const { trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: [{ x: 'w2', y: 90 }, ...WEEKS] })
            );
            expect(markerCount(after)).toBe(8);
            // The right edge is pinned (station 4 holds); the interior narrows away from the new left edge,
            // except the station nearest it, which dips past its resting value before correcting.
            const addStartWeekTops = {
                'top@0': decreasingExtent,
                'top@1': squeezing,
                'top@2': decreasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(squeezing, squeezing, 'any', [], addStartWeekTops),
                'series[0]/path[stroke]': extentMorph(squeezing, squeezing, 'constant', [], addStartWeekTops),
                ...markersFadeIn,
                ...axisReflowSpec('bottom', { shift: 'right' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w2');
        });

        // "Add Weeks 7+8" — the middle-insertion case: two categories drop into the interior gap between
        // w6 and w9 rather than at an edge, so the inserted markers land between their neighbours and the
        // categories to their right slide right to make room.
        it('category add middle weeks: inserted bands land between neighbours', async () => {
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
            expect([...after.keys()]).toContain('series[0]/marker[w7]');
            expect([...after.keys()]).toContain('series[0]/marker[w8]');
            // The inserted markers land in order within the vacated w6..w9 gap.
            expect(markerX(after, 'w6')).toBeLessThan(markerX(after, 'w7')!);
            expect(markerX(after, 'w7')).toBeLessThan(markerX(after, 'w8')!);
            expect(markerX(after, 'w8')).toBeLessThan(markerX(after, 'w9')!);
            // Insertion-spread: category bands snap to their reflowed positions at frame 0 (no per-frame
            // slide), so the spread is asserted across the settled endpoints. Neighbours left of the
            // insertion end further LEFT and those to the right end further RIGHT, the outer edges (w3, w11)
            // stay pinned, and the shift grows towards the gap as the bands redistribute across a fixed plot.
            const shift = (label: string) => markerX(after, label)! - markerX(before, label)!;
            expect(shift('w4')).toBeLessThan(0);
            expect(shift('w5')).toBeLessThan(shift('w4'));
            expect(shift('w6')).toBeLessThan(shift('w5'));
            expect(shift('w10')).toBeGreaterThan(0);
            expect(shift('w9')).toBeGreaterThan(shift('w10'));
            expect(Math.abs(shift('w3'))).toBeLessThanOrEqual(1);
            expect(Math.abs(shift('w11'))).toBeLessThanOrEqual(1);
            // Interior stations 1-3 fall between reflowed bands and tween smoothly toward their new resting
            // value as the paths re-cover the redistributed layout; the outer stations sit on the untouched
            // end categories (w3, w11) and hold.
            const addMiddleWeeksTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': increasingExtent,
                'top@3': increasingExtent,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], addMiddleWeeksTops),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant', [], addMiddleWeeksTops),
                ...markersFadeIn,
                'axis[bottom]/text[*]': {
                    opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
                    x: 'any',
                },
                'axis[bottom]/line[*]': {
                    opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
                    x1: 'any',
                    x2: 'any',
                },
            });
            expectMarkerStartsCollapsed(trajectory, 'w7');
        });

        // CRT-490 / AG-12655: reordering categories must not crash (the historic collapseSpan datumIndex
        // error) and the markers must re-map to the reshuffled bands. The capture running without a throw
        // is the no-crash guard; the ordering assertions are the re-map guard.
        it('CRT-490 category reorder: markers re-map to the reshuffled bands without crashing', async () => {
            const reordered = [WEEKS[3], WEEKS[0], WEEKS[5], WEEKS[1], WEEKS[6], WEEKS[2], WEEKS[4]];
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS), () =>
                chart.updateDelta({ data: reordered })
            );
            expect(markerCount(after)).toBe(markerCount(before));
            const order = reordered.map((d) => d.x);
            for (let i = 1; i < order.length; i++) {
                expect(markerX(after, order[i - 1])!).toBeLessThan(markerX(after, order[i])!);
            }
            // w6 moved from last to first, so it really shifted left.
            expect(markerX(after, 'w6')!).toBeLessThan(markerX(before, 'w6')!);
            // A reorder redraws the whole path in its new shape at once (no per-frame path tween — only
            // the markers re-fade into their remapped bands), so every station holds constant throughout.
            const reorderTops = {
                'top@0': 'constant' as const,
                'top@1': 'constant' as const,
                'top@2': 'constant' as const,
                'top@3': 'constant' as const,
                'top@4': 'constant' as const,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any', [], reorderTops),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant', [], reorderTops),
                ...markersFadeIn,
                ...axisReflowSpec('bottom', {}),
            });
        });

        // The swipe anti-vacuity for the re-reveal switches: some marker begins the sweep at zero size.
        const expectSomeMarkerCollapsed = (frame: SceneGeometrySample) => {
            const widths = [...frame]
                .filter(([k]) => /\/marker\[/.test(k))
                .map(([, p]) => p.width)
                .filter((w) => w != null);
            expect(Math.min(...widths), 'a marker starts the sweep at zero size').toBeLessThanOrEqual(0.1);
        };

        // The "stack -> group" toggle from the missing-data-area example: no grouped<->stacked morph
        // exists, so the switch re-creates the series and replays the initial-load swipe reveal. After it,
        // the areas are un-stacked (each fill reaches the shared baseline independently).
        it('stack -> group: the switch re-reveals via a swipe and un-stacks the fills', async () => {
            const options = stackedOptions();
            const all = options.series! as AgAreaSeriesOptions[];
            const { trajectory, after } = await captureFrom(options, () => {
                for (const s of all) delete s.stacked;
                return chart.update({ ...options, series: all });
            });
            const fill0 = fillKey(trajectory[0]);
            expectSceneTrajectory(trajectory, {
                'series[*]/background/path[*]': swipeReveal(),
                'series[*]/path[stroke*]': swipeReveal(),
                ...markersScaleIn,
            });
            expect(trajectory[0].get(fill0)!['clip:x']).toBeLessThanOrEqual(0.1);
            expectSomeMarkerCollapsed(trajectory[0]);
            // Un-stacked: every fill now reaches the same baseline (bottom edge coincident).
            const baselines = [0, 1, 2].map((i) => {
                const f = after.get(fillKey(after, i))!;
                return f.y + f.height;
            });
            expect(Math.abs(baselines[1] - baselines[0])).toBeLessThanOrEqual(1);
            expect(Math.abs(baselines[2] - baselines[0])).toBeLessThanOrEqual(1);
        });

        // "normalizedTo" — switching into normalized stacking re-creates the series (swipe reveal); the
        // top layer settles flat at the 100% line, proving the normalisation landed.
        it('normalizedTo: switching into normalised stacking re-reveals and flattens the top layer', async () => {
            const options = stackedOptions();
            const all = options.series! as AgAreaSeriesOptions[];
            const { trajectory, after } = await captureFrom(options, () => {
                for (const s of all) s.normalizedTo = 100;
                return chart.update({ ...options, series: all });
            });
            const fill0 = fillKey(trajectory[0]);
            expectSceneTrajectory(
                trajectory,
                {
                    'series[*]/background/path[*]': swipeReveal(),
                    'series[*]/path[stroke*]': swipeReveal(),
                    ...markersScaleIn,
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            expect(trajectory[0].get(fill0)!['clip:x']).toBeLessThanOrEqual(0.1);
            // The top layer's cumulative is the constant normalized total, so its top edge is flat.
            const topStroke = after.get(strokeKey(after, 2))!;
            expect(Math.abs(topStroke['top@0'] - topStroke['top@4'])).toBeLessThanOrEqual(1);
        });

        // "Data 1 / Data 2" (category-changes, smooth) — the whole category set swaps to a differing one.
        // The path morphs across frames (its bbox sweeps out and back) while the axis cross-fades the
        // outgoing and incoming label sets.
        it('category set swap: the smooth path morphs while the axis label set changes', async () => {
            // Pinned to cover both data sets' ranges so only the x-band remap animates (no y rescale).
            const swapOptions = (data: Array<{ category: string; iphone: number }>): AgCartesianChartOptions =>
                prepareTestOptions({
                    data,
                    series: [
                        {
                            type: 'area',
                            xKey: 'category',
                            yKey: 'iphone',
                            strokeWidth: 3,
                            interpolation: { type: 'smooth' },
                        },
                    ],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left', min: -100, max: 260 },
                    },
                });
            const d1 = [
                { category: 'cat 1', iphone: 181 },
                { category: 'cat 2', iphone: 67 },
                { category: 'cat 3', iphone: 192 },
                { category: 'cat 4', iphone: 14 },
            ];
            const d2 = [
                { category: 'cat 2', iphone: 118 },
                { category: 'cat 9', iphone: 185 },
                { category: 'cat 3', iphone: 165 },
                { category: 'cat 4', iphone: -55 },
            ];
            const { before, trajectory, after } = await captureFrom(swapOptions(d1), () =>
                chart.update(swapOptions(d2))
            );
            // The fill and stroke genuinely tween: their left edge sweeps out to an intermediate and back
            // (the smooth path morphs across the reshuffled categories) rather than snapping. The interior
            // stations mirror that dip-and-return, except the rightmost, which settles by rising cleanly.
            const swapTops = {
                'top@0': squeezing,
                'top@1': squeezing,
                'top@2': squeezing,
                'top@3': increasingExtent,
                'top@4': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph(squeezing, squeezing, 'any', [], swapTops),
                'series[0]/path[stroke]': extentMorph(squeezing, squeezing, 'constant', [], swapTops),
                'axis[bottom]/text[*]': {
                    opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
                    x: 'any',
                },
                'axis[bottom]/line[*]': {
                    opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
                    x1: 'any',
                    x2: 'any',
                },
            });
            // The label set swaps: cat 1 leaves, cat 9 arrives.
            expect([...before.keys()]).toContain('axis[bottom]/text[l:cat 1]');
            expect([...after.keys()]).not.toContain('axis[bottom]/text[l:cat 1]');
            expect([...after.keys()]).toContain('axis[bottom]/text[l:cat 9]');
        });

        // Integrated mode changes animation defaults, so the initial-load swipe reveal must still run.
        it('integrated mode: initial load reveals the stacked fills via a swipe', async () => {
            chart = AgCharts.create(stackedOptions('integrated'));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            const fill0 = fillKey(trajectory.at(-1)!);
            expectSceneTrajectory(
                trajectory,
                {
                    'series[*]/background/path[*]': swipeReveal(),
                    'series[*]/path[stroke*]': swipeReveal(),
                    ...markersScaleIn,
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            // Anti-vacuity: the sweep starts collapsed (clip window at the left edge) and a marker at zero size.
            expect(trajectory[0].get(fill0)!['clip:x']).toBeLessThanOrEqual(0.1);
            expectMarkerStartsCollapsed(trajectory, 'Q3', 'width');
        });

        // Integrated defaults must not suppress the entrance animation: adding an end week still fades the
        // new marker in.
        it('integrated mode: category add end week fades the new marker in', async () => {
            const { before, trajectory, after } = await captureFrom(categoryOptions(WEEKS, 'integrated'), () =>
                chart.updateDelta({ data: [...WEEKS, { x: 'w12', y: 90 }] })
            );
            expect(markerCount(before)).toBe(7);
            expect(markerCount(after)).toBe(8);
            // Mirrors the standalone "category add end week" CASE: the left edge is pinned, the interior
            // widens towards the new right edge, except the station nearest it, which overshoots past its
            // resting value before correcting.
            const addEndWeekTops = {
                'top@0': 'constant' as const,
                'top@1': increasingExtent,
                'top@2': increasingExtent,
                'top@3': squeezing,
                'top@4': increasingExtent,
            };
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', squeezing, 'any', [], addEndWeekTops),
                'series[0]/path[stroke]': extentMorph('constant', squeezing, 'constant', [], addEndWeekTops),
                ...markersFadeIn,
                ...axisReflowSpec('bottom', { shift: 'left' }),
            });
            expectMarkerStartsCollapsed(trajectory, 'w12');
        });

        // Integrated reorder mirrors the standalone case: the reshuffle lands under integrated defaults too.
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
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': extentMorph('constant', 'constant', 'any'),
                'series[0]/path[stroke]': extentMorph('constant', 'constant', 'constant'),
                ...markersFadeIn,
                ...axisReflowSpec('bottom', {}),
            });
        });

        // "Start ticking" — a point is appended on a timer while the previous append is still animating.
        // Each interrupting update must keep the stroke a single connected subpath and let the area keep
        // growing rightward, never leaving a broken or frozen path.
        it('ticking: appending points mid-animation keeps the stroke connected and growing', async () => {
            const data = [
                { x: 0, y: 40 },
                { x: 1, y: 120 },
                { x: 2, y: 80 },
                { x: 3, y: 160 },
                { x: 4, y: 60 },
            ];
            chart = AgCharts.create(singleOptions(data));
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
            const key = strokeKey(trajectory.at(-1)!);
            for (let i = 0; i < trajectory.length; i++) {
                expect(trajectory[i].get(key)?.subpaths, `frame ${i} subpaths`).toBe(1);
            }
            expect(markerCount(trajectory.at(-1)!)).toBeGreaterThan(markerCount(trajectory[0]));
            expect(trajectory.at(-1)!.get(key)!.width).toBeGreaterThan(trajectory[0].get(key)!.width);
        });

        // "Rapid Update" — a second data change lands before the first has finished. The batch must
        // abandon the first target and settle on the second: the final point count is the second update's
        // (3 -> 7), proving the interrupted first update (which shrank to 3) did not win.
        it('rapid update: an interrupting update settles on the final data, not the abandoned one', async () => {
            chart = AgCharts.create(
                singleOptions([
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
            for (let i = 0; i < trajectory.length; i++) {
                const frameKey = [...trajectory[i].keys()].find((k) => k.startsWith('series[0]/path[stroke'));
                if (frameKey != null) {
                    expect(trajectory[i].get(frameKey)!.subpaths, `frame ${i} subpaths`).toBe(1);
                }
            }
            await frames.runToEnd(chart);
            const after = sampleScene();
            expect(markerCount(after)).toBe(7);
            expect(after.get(strokeKey(after))!.subpaths).toBe(1);
        });

        // AG-12468 / AG-10542: a data update that flips the x-scale between category and continuous is not
        // path-comparable (areaUtil's prepareAreaPathAnimation returns undefined), so the batch must SNAP
        // rather than tween garbage between incompatible scales.
        it('AG-12468 scale-type change: a category->number x-scale flip snaps without tweening', async () => {
            const category: AgCartesianChartOptions = {
                data: [
                    { x: 'a', y: 40 },
                    { x: 'b', y: 120 },
                    { x: 'c', y: 80 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            const numeric: AgCartesianChartOptions = {
                ...category,
                data: [
                    { x: 0, y: 40 },
                    { x: 1, y: 120 },
                    { x: 2, y: 80 },
                ],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 0, max: 2 },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            prepareTestOptions(category);
            prepareTestOptions(numeric);
            chart = AgCharts.create(category);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            const before = sampleScene();
            await chart.update(numeric);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectNoAnimation(trajectory);
            // Anti-vacuity: the scale flip genuinely landed (the axis retyped from category to number).
            expect([...before.keys()]).toContain('axis[bottom]/text[l:a]');
            expect([...trajectory.at(-1)!.keys()]).toContain('axis[bottom]/text[l:0]');
        });

        // AG-10904: re-applying identical data is a no-op (prepareAreaPathAnimation reports 'no-op'), so no
        // motion may run — every geometry property holds constant. The fill's drawn-subpath count is
        // re-decomposed by the redraw (not motion), so it alone is exempt.
        it('AG-10904 no-op update: re-applying identical data produces no animation', async () => {
            const options = singleOptions([
                { x: 0, y: 40 },
                { x: 2, y: 120 },
                { x: 4, y: 80 },
                { x: 6, y: 160 },
                { x: 8, y: 60 },
            ]);
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            await chart.update({ ...options });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectSceneTrajectory(trajectory, {
                'series[0]/background/path[*]': { subpaths: 'any' },
            });
            // Anti-vacuity: the paths were genuinely present and drawn, not an empty scene.
            expect(trajectory[0].get(strokeKey(trajectory[0]))!.subpaths).toBe(1);
        });

        // CRT-823: a legend-hidden area series must stay visually inert while a visible sibling animates —
        // the historic bug ran the hidden series' update animation, briefly drawing it across the baseline.
        it('CRT-823 hidden series: a legend-hidden area stays inert while a sibling animates', async () => {
            const base = stackedOptions();
            const hidden: AgCartesianChartOptions = {
                ...base,
                series: base.series!.map((s, i) => (i === 2 ? { ...s, visible: false } : s)),
            };
            chart = AgCharts.create(hidden);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            await chart.updateDelta({
                data: [
                    { q: 'Q1', a: 90, b: 20, c: 30 },
                    { q: 'Q2', a: 20, b: 55, c: 25 },
                    { q: 'Q3', a: 70, b: 15, c: 40 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // The update triggered real motion on the visible series.
            expectMarkerStartsCollapsed(trajectory, 'Q1');
            // The hidden series[2] holds every tracked property constant across that same capture.
            const hiddenOnly = (s: SceneGeometrySample) => new Map([...s].filter(([k]) => k.startsWith('series[2]')));
            expect([...trajectory[0].keys()].some((k) => k.startsWith('series[2]'))).toBe(true);
            expectNoAnimation(trajectory.map(hiddenOnly));
        });

        // AG-16436: toggling series off until only one remains visible must still animate the survivor
        // coordinated in the update phase (the toggled layer collapses to the baseline, the survivor slides
        // down to become the sole layer) rather than desyncing or leaving garbage.
        it('AG-16436 toggle to last visible: the survivor slides to the baseline as the other collapses', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'a', v1: 40, v2: 30 },
                    { x: 'b', v1: 60, v2: 40 },
                    { x: 'c', v1: 50, v2: 35 },
                ],
                series: [
                    { type: 'area', xKey: 'x', yKey: 'v1', stacked: true, marker: { enabled: true } },
                    { type: 'area', xKey: 'x', yKey: 'v2', stacked: true, marker: { enabled: true } },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 200 },
                },
            };
            prepareTestOptions(options);
            const { trajectory, after } = await captureFrom(options, () =>
                chart.update({
                    ...options,
                    series: options.series!.map((s, i) => (i === 0 ? { ...s, visible: false } : s)),
                })
            );
            const bottomFill = fillKey(trajectory[0], 0);
            // Anti-vacuity: the toggled-off layer starts at full height and must genuinely collapse.
            expect(trajectory[0].get(bottomFill)!.height).toBeGreaterThan(40);
            // The survivors genuinely tween (not snap): y/height/every top@N pass through several
            // intermediate frames rather than jumping straight to their resting value, so `progresses`
            // proves real sliding, not just a net direction.
            const slideDown: SceneNodeExpectation = {
                y: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                height: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                x: { during: 'update', expect: 'constant' },
                width: { during: 'update', expect: 'constant' },
                subpaths: 'any',
                'top@0': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@1': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@2': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@3': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                'top@4': { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/background/path[*]': {
                        height: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        y: { during: 'update', expect: ['increases', 'bounded'] },
                        subpaths: 'any',
                        visible: { during: 'update', expect: ['decreases', 'bounded'] },
                        'top@0': 'any',
                        'top@1': 'any',
                        'top@2': 'any',
                        'top@3': 'any',
                        'top@4': 'any',
                        x: 'any',
                        width: 'any',
                    },
                    // The stroke traces the same collapsing top edge as the background fill above, but
                    // (unlike the fill polygon) never splits into a second subpath, so every station holds
                    // its collapse cleanly and x/width stay pinned to the full plot width throughout.
                    'series[0]/path[stroke]': {
                        x: 'constant',
                        width: 'constant',
                        y: { during: 'update', expect: ['increases', 'bounded'] },
                        height: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        visible: { during: 'update', expect: ['decreases', 'bounded'], settlesAt: 0 },
                        'top@0': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@1': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@2': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@3': { during: 'update', expect: ['increases', 'bounded'] },
                        'top@4': { during: 'update', expect: ['increases', 'bounded'] },
                        subpaths: 'any',
                    },
                    // The toggled-off layer's markers never render (visible stays 0 throughout); their
                    // opacity keeps re-fading internally regardless, so only that property is left free.
                    'series[0]/marker[*]': { opacity: 'any', visible: 'constant' },
                    'series[1]/background/path[*]': slideDown,
                    'series[1]/path[stroke]': slideDown,
                    'series[1]/marker[*]': markerRefade,
                    ...axisReflowSpec('bottom', {}),
                },
                { frameInvariants: [stackTopsOrdered] }
            );
            // The survivor ends as the sole layer anchored to the baseline.
            const survivorFill = after.get(fillKey(after, 1))!;
            expect(after.get(fillKey(after, 0))!.visible).toBe(0);
            expect(survivorFill.y + survivorFill.height).toBeGreaterThan(480);
        });

        // AG-12468: adding the first data via updateDelta onto an empty chart. With unpinned axes the
        // empty starting state has a non-finite (invalid) x-scale, which isScaleValid guards: the batch
        // must snap so the area is drawn at full geometry immediately. Without the guard the batch tweens
        // from that invalid scale and the fill is absent for the first half of the animation — the historic
        // "area doesn't render until a resize". (The type-flip half of the pair is covered above.)
        it('AG-12468 add initial data: the area snaps in at full geometry rather than tweening from an invalid scale', async () => {
            const empty = prepareTestOptions({
                data: [],
                series: [{ type: 'area', xKey: 'x', yKey: 'y', marker: { enabled: true } }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            } as AgCartesianChartOptions);
            chart = AgCharts.create(empty);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);
            await chart.updateDelta({
                data: [
                    { x: 0, y: 40 },
                    { x: 2, y: 120 },
                    { x: 4, y: 80 },
                    { x: 6, y: 160 },
                    { x: 8, y: 60 },
                ],
            });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();
            // Anti-vacuity: the update genuinely rendered a full-height area (the empty start had none).
            const finalHeight = after.get(fillKey(after))!.height;
            expect(finalHeight).toBeGreaterThan(400);
            // Every frame draws the fill at that final height — it never grows from the invalid scale.
            for (let i = 0; i < trajectory.length; i++) {
                const key = [...trajectory[i].keys()].find((k) => /^series\[0\]\/background\/path\[fill/.test(k));
                expect(key, `frame ${i} fill present`).toBeDefined();
                expect(Math.abs(trajectory[i].get(key!)!.height - finalHeight), `frame ${i} fill height`).toBeLessThan(
                    1
                );
            }
        });

        // AG-9954: the initial-load swipe glues the marker scale-in to the sweep edge — the leftmost marker
        // finishes scaling in before the rightmost even starts, in lock-step with the clip window's advance.
        it('AG-9954 reveal sync: markers scale in left-to-right in lock-step with the swipe', async () => {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            chart = AgCharts.create(
                categoryOptions([
                    { x: 'A', y: 40 },
                    { x: 'B', y: 120 },
                    { x: 'C', y: 80 },
                    { x: 'D', y: 160 },
                    { x: 'E', y: 60 },
                    { x: 'F', y: 100 },
                ])
            );
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene, { frames: 40 });
            const fill0 = fillKey(trajectory.at(-1)!);
            // The clip window sweeps across the plot; clip:x is present only while the mask is active, so
            // progression is asserted over the sweep frames.
            const clipXs = trajectory
                .map((f) => f.get(fill0)?.['clip:x'])
                .filter((v): v is number => v != null && Number.isFinite(v));
            expectProgresses(clipXs);
            const finalWidth = trajectory.at(-1)!.get('series[0]/marker[A]')!.width;
            expect(finalWidth).toBeGreaterThan(1);
            const firstFrameAbove = (label: string, fraction: number) =>
                trajectory.findIndex((f) => (f.get(`series[0]/marker[${label}]`)?.width ?? 0) > finalWidth * fraction);
            // Each marker begins scaling in no earlier than the one to its left.
            const starts = labels.map((l) => firstFrameAbove(l, 0.01));
            expectMonotonic(starts, 'increasing');
            // The leftmost finishes (>=90%) strictly before the rightmost even starts — this strictness is
            // what fails on a total snap (all indices would be 0).
            const leftmostDone = trajectory.findIndex(
                (f) => (f.get('series[0]/marker[A]')?.width ?? 0) >= finalWidth * 0.9
            );
            expect(leftmostDone).toBeGreaterThan(0);
            expect(starts.at(-1)!).toBeGreaterThan(0);
            expect(leftmostDone).toBeLessThan(starts.at(-1)!);
            // The sync itself: a marker must not begin scaling in ahead of the clip edge that reveals it.
            // At the frame each marker starts, the sweep (clip:x) has already reached that marker's band.
            // The historic desync (a non-inverse easing on the delay) pops mid-plot markers in early —
            // e.g. the second marker starting while the sweep is still ~100px short of it.
            const last = trajectory.at(-1)!;
            const SWEEP_LEAD_TOL = 40;
            let checked = 0;
            for (const l of labels) {
                const startFrame = firstFrameAbove(l, 0.01);
                const clipAtStart = trajectory[startFrame]?.get(fill0)?.['clip:x'];
                if (clipAtStart == null || !Number.isFinite(clipAtStart)) continue;
                const mx = markerX(last, l)!;
                expect(clipAtStart, `marker ${l} starts before the sweep reaches it`).toBeGreaterThanOrEqual(
                    mx - SWEEP_LEAD_TOL
                );
                checked++;
            }
            // Anti-vacuity: several markers were genuinely checked against a live sweep edge.
            expect(checked).toBeGreaterThanOrEqual(3);
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped
        // render of the same options produces (see expectAnimatedEndpointsMatchStatic).
        it('sanity: single update points endpoints match static renders', async () => {
            const options = singleOptions([
                { x: 0, y: 40 },
                { x: 2, y: 120 },
                { x: 4, y: 80 },
                { x: 6, y: 160 },
                { x: 8, y: 60 },
            ]);
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: [
                    { x: 0, y: 90 },
                    { x: 2, y: 50 },
                    { x: 4, y: 140 },
                    { x: 6, y: 70 },
                    { x: 8, y: 110 },
                ],
            });
        });

        it('sanity: add series endpoints match static renders', async () => {
            const full = stackedOptions();
            const before = { ...full, series: full.series!.slice(0, 2) };
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, full);
        });

        it('sanity: legend hide endpoints match static renders', async () => {
            const options = stackedOptions();
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                series: options.series!.map((s, i) => (i === 0 ? { ...s, visible: false } : s)),
            });
        });
    });

    describe('invalid data domain', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        it.each(Object.entries(INVALID_DATA_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
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

                expect(console.warn).toHaveBeenCalled();
            }
        );
    });

    describe('multiple overlapping areas', () => {
        beforeEach(() => {
            console.warn = vi.fn();
        });

        it('should render area series with the correct relative Z-index', async () => {
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
                    type: 'area',
                    xKey: `x${i}`,
                    yKey: `y${i}`,
                    strokeWidth: 2,
                })),
                legend: { enabled: false },
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    // AG-12350 - nodeClick triggered on legend item click.
    describe('nodeClick', () => {
        const clicks: string[] = [];
        const doubleClicks: string[] = [];
        const legendClicks: (string | number)[] = [];

        const nodeClickOptions: AgCartesianChartOptions = {
            data: [
                { asset: 'Stocks', amount: 5 },
                { asset: 'Cash', amount: 5 },
                { asset: 'Bonds', amount: 0 },
                { asset: 'Real Estate', amount: 5 },
                { asset: 'Commodities', amount: 5 },
            ],
            series: [
                {
                    type: 'area',
                    xKey: 'asset',
                    yKey: 'amount',
                    marker: { size: 5 },
                    listeners: {
                        seriesNodeClick: (event) => {
                            clicks.push(event.datum.asset);
                        },
                        seriesNodeDoubleClick: (event) => {
                            doubleClicks.push(event.datum.asset);
                        },
                    },
                },
            ],
            legend: {
                listeners: {
                    legendItemClick: (event) => {
                        legendClicks.push(event.itemId);
                    },
                },
            },
        };

        beforeEach(async () => {
            const options = { ...nodeClickOptions };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            clicks.splice(0, clicks.length);
            doubleClicks.splice(0, doubleClicks.length);
            legendClicks.splice(0, legendClicks.length);
        });

        function* iterAreaSectors(myChart: AgChartInstance) {
            const areaSeries = classCast(deproxy(myChart).series[0], AreaSeries);
            for (const nodeData of areaSeries.getNodeData() ?? []) {
                const { x = 0, y = 0 } = nodeData.point ?? {};
                yield Transformable.toCanvasPoint(areaSeries.contentGroup, x, y);
            }
        }

        function* iterLegendMarkerLabels(myChart: AgChartInstance) {
            for (const { legend } of deproxy(myChart).modulesManager.legends()) {
                const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
                for (const label of markerLabels) {
                    yield Transformable.toCanvas(label).computeCenter();
                }
            }
        }

        describe('should fire a nodeClick event for each node', () => {
            test('mouse', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                // Faulty because of AG-14228
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await tapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(clicks).toEqual(['Stocks', 'Cash', 'Bonds', 'Real Estate', 'Commodities']);
                expect(doubleClicks).toHaveLength(0);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should fire a nodeDoubleClick event for each node', () => {
            test('mouse', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleClickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterAreaSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleTapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toEqual(['Stocks', 'Cash', 'Bonds', 'Real Estate', 'Commodities']);
                expect(clicks).toHaveLength(10);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should not fire series events for legend clicks', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });

            afterEach(() => {
                expect(legendClicks).toEqual(['amount', 'amount']);
                expect(doubleClicks).toHaveLength(0);
                expect(clicks).toHaveLength(0);
            });
        });
    });

    describe('pattern fill', () => {
        const EXAMPLE = deepClone(examples.SIMPLE_AREA_GRAPH_EXAMPLE);

        if (EXAMPLE.series)
            for (const s of EXAMPLE.series) {
                (s as AgAreaSeriesOptions).normalizedTo = 100;
            }

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
            const series = EXAMPLE.series as AgAreaSeriesOptions[];
            const options: AgChartOptions = {
                ...EXAMPLE,
                series: series.map(
                    (s) =>
                        ({
                            ...s,
                            fill: {
                                type: 'pattern',
                                pattern,
                            },
                        }) as AgAreaSeriesOptions
                ),
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it.each(CUSTOM_SVG_PATHS)(
            'it should create a chart with custom svg pattern',
            async ({ path, width, height }) => {
                const series = EXAMPLE.series as AgAreaSeriesOptions[];

                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: series.map(
                        (s) =>
                            ({
                                ...s,
                                fill: {
                                    type: 'pattern',
                                    path,
                                    width,
                                    height,
                                    strokeWidth: 0,
                                },
                            }) as AgAreaSeriesOptions
                    ),
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);

                await waitForChartStability(chart);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(INVALID_CUSTOM_SVG_PATHS)(
            'it should create a chart with custom svg pattern',
            async ({ path, warningMessage }) => {
                const series = EXAMPLE.series as AgAreaSeriesOptions[];

                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: series.map(
                        (s) =>
                            ({
                                ...s,
                                fill: {
                                    type: 'pattern',
                                    path,
                                },
                            }) as AgAreaSeriesOptions
                    ),
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);

                await waitForChartStability(chart);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);

                expect(console.warn).toHaveBeenCalledWith(warningMessage);
            }
        );
    });

    describe('image fill', () => {
        const EXAMPLE = deepClone(examples.SIMPLE_AREA_GRAPH_EXAMPLE);

        it.each(['repeat', 'no-repeat'] as AgColorRepeat[])(
            'it should create a chart with repeat %s image',
            async (repetition) => {
                const series = (EXAMPLE.series as AgAreaSeriesOptions[])[0];
                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: [
                        {
                            ...series,
                            normalizedTo: 100,
                            fillOpacity: 1,
                            fill: {
                                type: 'image',
                                url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
                                width: 50,
                                height: 50,
                                repeat: repetition,
                            },
                        },
                    ] as AgAreaSeriesOptions[],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
            }
        );

        it.each(['contain', 'cover', 'stretch', 'none'] as AgImageFillFit[])(
            'it should create a chart with fit %s image',
            async (fit) => {
                const series = (EXAMPLE.series as AgAreaSeriesOptions[])[0];
                const options: AgChartOptions = {
                    ...EXAMPLE,
                    series: [
                        {
                            ...series,
                            normalizedTo: 100,
                            fillOpacity: 1,
                            fill: {
                                type: 'image',
                                url: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/ag-grid-logomark.png`,
                                fit,
                            },
                        },
                    ] as AgAreaSeriesOptions[],
                };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);
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
                        type: 'area',
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

        it('complex fills', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 100 },
                    { x: 'b', y: -100 },
                    { x: 'c', y: 200 },
                    { x: 'd', y: 100 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            size: 40,
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
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('CRT-859', () => {
        it('should render undefined points correctly', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: -6 },
                    { x: 1, y: 0 },
                    { x: 2, y: undefined },
                    { x: 3, y: -2 },
                    { x: 4, y: -6 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        strokeWidth: 2,
                        marker: {
                            enabled: true,
                        },
                    },
                ],
            };

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('Stacked cases', () => {
        const data = [
            { month: 'Jan', subscriptions: 222, services: 250, products: 200 },
            { month: 'Feb', subscriptions: 240, services: 255, products: 210 },
            { month: 'Mar', subscriptions: 280, services: 245, products: null },
            { month: 'Apr', subscriptions: 300, services: 260, products: 205 },
            { month: 'May', subscriptions: 350, services: 235, products: 215 },
            { month: 'Jun', subscriptions: 420, services: Infinity, products: 200 },
            { month: 'Jul', subscriptions: 300, services: 255, products: 100 },
            { month: 'Aug', subscriptions: 270, services: 305, products: 210 },
            { month: 'Sep', subscriptions: 260, services: 280, products: 250 },
            { month: 'Oct', subscriptions: 385, services: 250, products: Number.NaN },
            { month: 'Nov', subscriptions: 320, services: 265, products: 215 },
            { month: 'Dec', subscriptions: 330, services: 255, products: 220 },
        ];

        const createAreaExample = (overrides: Partial<AgAreaSeriesOptions> = {}): AgChartOptions => ({
            data,
            series: [
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'subscriptions',
                    yName: 'Subscriptions',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'smooth' },
                    marker: { enabled: true },
                    ...overrides,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'services',
                    yName: 'Services',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'step', position: 'middle' },
                    marker: { enabled: true },
                    ...overrides,
                },
                {
                    type: 'area',
                    xKey: 'month',
                    yKey: 'products',
                    yName: 'Products',
                    strokeWidth: 1,
                    stacked: true,
                    interpolation: { type: 'smooth' },
                    marker: { enabled: true },
                    ...overrides,
                },
            ],
        });

        it('handles multiple stacked areas', async () => {
            const options = createAreaExample({});

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('handles missing data', async () => {
            const options = createAreaExample({ connectMissingData: true });

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('AG-11673 styler', () => {
        type D = unknown;
        type C = unknown;
        type M = MockAreaStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        const data = [
            { month: 'January', sales: 1200, expenses: 800 },
            { month: 'February', sales: 1500, expenses: 950 },
            { month: 'March', sales: 1700, expenses: 1100 },
        ];
        beforeEach(() => {
            styler = newFreezableMock<D, C, M>(
                (params: AgAreaSeriesStylerParams<D, C>): AgAreaSeriesStylerResult | undefined => {
                    if (params.yKey === 'sales')
                        return {
                            marker: {
                                fill: 'cyan',
                                shape: 'triangle',
                                size: 50,
                            },
                            fill: 'skyblue',
                            fillOpacity: 0.7,
                            lineDash: [3, 3],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                        };
                    else if (params.yKey === 'expenses' || params.yKey === 'expenses2')
                        return {
                            marker: {
                                fill: 'magenta',
                                fillOpacity: 0.5,
                                shape: 'star',
                                size: 40,
                            },
                            fill: 'navy',
                            fillOpacity: 0.4,
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
                            { type: 'area', xKey: 'month', yKey: 'sales', styler: styler.frozen, context: c1 },
                            { type: 'area', xKey: 'month', yKey: 'expenses', styler: styler.frozen, context: c2 },
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
        describe('deriveMarkerEnabledFromStyler', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data: [
                            { month: 'January', sales: 1200, sales2: 2400, expenses: 800, expenses2: 400 },
                            { month: 'February', sales: 1500, sales2: 3000, expenses: 950, expenses2: 475 },
                            { month: 'March', sales: 1700, sales2: 3400, expenses: 1100, expenses2: 550 },
                        ],
                        series: [
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales',
                                // Do not draw markers, despite `styler` enabling markers.
                                marker: { enabled: false },
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales2',
                                // Draw default markers, despite `styler` not enabling markers.
                                marker: { enabled: true },
                                styler: () => undefined,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses',
                                // Draw markers, both `marker` and `styler` enable markers.
                                marker: { enabled: true },
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses2',
                                // Draw markers, despite the `marker.enabled: false` default.
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
        describe('fill gradient stars', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareTestOptions({
                        data: [
                            { x: '1', y: 1200 },
                            { x: '2', y: 1500 },
                            { x: '3', y: 1700 },
                        ],
                        legend: {},
                        series: [
                            {
                                type: 'area',
                                xKey: 'x',
                                yKey: 'y',
                                styler: () => {
                                    return {
                                        marker: {
                                            fill: {
                                                type: 'gradient',
                                                colorStops: [
                                                    { color: 'dodgerblue', stop: 0.1 },
                                                    { color: 'lightcyan' },
                                                ],
                                            },
                                            size: 75,
                                            shape: 'star',
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
                const itemStyler = (params: AgAreaSeriesMarkerItemStylerParams<D, C>): AgSeriesMarkerStyle => {
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
                                type: 'area',
                                xKey: 'month',
                                yKey: 'sales',
                                marker: {
                                    fill: 'lime', // ignored
                                    shape: 'square', // ignored
                                    strokeWidth: 3, // ignored only for February
                                    itemStyler,
                                },
                                fill: 'limegreen', // ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'area',
                                xKey: 'month',
                                yKey: 'expenses',
                                marker: {
                                    fill: 'olive', // ignored
                                    shape: 'square', // ignored
                                    itemStyler,
                                },
                                fill: 'olivedrab', // ignored
                                stroke: 'green', // ignored
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
    });

    describe('segmentation', () => {
        it('should render area series with segmentation styling on x-axis', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2, fill: 'rgba(255, 0, 0, 0.3)', stroke: 'red', strokeWidth: 2 },
                                { start: 2, stop: 4, fill: 'rgba(0, 0, 255, 0.3)', stroke: 'blue', strokeWidth: 3 },
                                { start: 4, fill: 'rgba(0, 255, 0, 0.3)', stroke: 'green', strokeWidth: 2 },
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

        it('should render area series with segmentation styling on y-axis', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 10,
                                    stop: 20,
                                    fill: 'rgba(255, 165, 0, 0.4)',
                                    stroke: 'orange',
                                    strokeWidth: 2,
                                    lineDash: [5, 5],
                                },
                                {
                                    start: 20,
                                    stop: 30,
                                    fill: 'rgba(128, 0, 128, 0.4)',
                                    stroke: 'purple',
                                    strokeWidth: 3,
                                },
                                {
                                    start: 30,
                                    fill: 'rgba(0, 255, 255, 0.4)',
                                    stroke: 'cyan',
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
            await compare();
        });

        it('should render stacked area series with segmentation', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y1',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 2.5, fill: 'rgba(255, 0, 0, 0.5)', stroke: 'red', strokeWidth: 1 },
                                { start: 2.5, fill: 'rgba(0, 0, 255, 0.5)', stroke: 'blue', strokeWidth: 1 },
                            ],
                        },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y2',
                        stacked: true,
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 0, stop: 3, fill: 'rgba(0, 255, 0, 0.4)', stroke: 'green', strokeWidth: 2 },
                                { start: 3, fill: 'rgba(128, 0, 128, 0.4)', stroke: 'purple', strokeWidth: 2 },
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

        it('should render area series with pattern fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'circles',
                                    },
                                    stroke: 'green',
                                    strokeWidth: 2,
                                },
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render area series with gradient fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    fill: {
                                        type: 'gradient',
                                    },
                                    stroke: 'green',
                                    strokeWidth: 2,
                                },
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render area series with inherited gradient fill segmentation', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 20 },
                    { x: 1, y: 30 },
                    { x: 2, y: 25 },
                    { x: 3, y: 35 },
                    { x: 4, y: 40 },
                    { x: 5, y: 45 },
                ],

                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        fill: {
                            type: 'gradient',
                        },
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 0,
                                    stop: 2,
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 2,
                                    stop: 4,
                                    stroke: 'blue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 4,
                                    stroke: 'green',
                                    strokeWidth: 2,
                                },
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
            await compare(PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should use cutout on dimmed non-highlight markers to mask the line for area', async () => {
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
                        type: 'area',
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

        it('should render area series with positive/negative segmentation', async () => {
            const options: AgChartOptions = {
                title: { text: 'Total PnL' },
                data: [
                    { key: '2019-04-05', pnl: 60 },
                    { key: '2019-04-10', pnl: -110 },
                    { key: '2019-04-15', pnl: -240 },
                    { key: '2019-04-18', pnl: -585 },
                    { key: '2019-04-21', pnl: -210 },
                    { key: '2019-04-24', pnl: -595 },
                    { key: '2020-03-17', pnl: -320 },
                    { key: '2020-03-18', pnl: -165 },
                    { key: '2020-03-19', pnl: -95 },
                    { key: '2020-03-20', pnl: 15 },
                    { key: '2020-03-26', pnl: 40 },
                    { key: '2020-04-05', pnl: 90 },
                    { key: '2020-04-12', pnl: 180 },
                    { key: '2020-04-19', pnl: 420 },
                    { key: '2020-05-03', pnl: 150 },
                    { key: '2020-05-22', pnl: 170 },
                ],
                series: [
                    {
                        type: 'area',
                        interpolation: {
                            type: 'smooth',
                        },
                        xKey: 'key',
                        xName: 'Date',
                        yKey: 'pnl',
                        yName: 'PnL',
                        marker: {
                            enabled: true,
                            itemStyler: ({ datum, yKey }) => {
                                const v = datum[yKey];
                                return {
                                    fill: v >= 0 ? 'green' : 'red',
                                    stroke: v >= 0 ? 'green' : 'red',
                                };
                            },
                        },
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 0,
                                    fill: 'green',
                                    fillOpacity: 0.2,
                                    stroke: 'green',
                                    strokeWidth: 3,
                                },
                                {
                                    stop: 0,
                                    fill: 'red',
                                    fillOpacity: 0.3,
                                    stroke: 'red',
                                    strokeWidth: 3,
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

        it('should render Apple revenue area chart with segmentation', async () => {
            const options: AgChartOptions = {
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
                        type: 'area',
                        xKey: 'quarter',
                        yKey: 'iphone',
                        yName: 'iPhone',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    stroke: 'red',
                                    strokeWidth: 25,
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

        it('should render area series with missing start values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Jan', y: 10 },
                    { x: 'Feb', y: 15 },
                    { x: 'Mar', y: 12 },
                    { x: 'Apr', y: 18 },
                    { x: 'May', y: 22 },
                    { x: 'Jun', y: 16 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Jan',
                                    stop: 'Feb',
                                    fill: 'rgba(255, 0, 0, 0.6)',
                                    stroke: 'red',
                                    strokeWidth: 2,
                                },
                                { stop: 'Apr', fill: 'rgba(0, 0, 255, 0.6)', stroke: 'blue', strokeWidth: 2 }, // Missing start - should use 'Feb'
                                { stop: 'Jun', fill: 'rgba(0, 255, 0, 0.6)', stroke: 'green', strokeWidth: 2 }, // Missing start - should use 'Apr'
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

        it('should render area series with missing stop values in segmentation', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Q1', y: 100 },
                    { x: 'Q2', y: 120 },
                    { x: 'Q3', y: 110 },
                    { x: 'Q4', y: 140 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 'Q1', fill: 'rgba(255, 100, 100, 0.7)', stroke: '#ff4444', strokeWidth: 3 }, // Missing stop - should use 'Q2'
                                { start: 'Q2', fill: 'rgba(100, 100, 255, 0.7)', stroke: '#4444ff', strokeWidth: 3 }, // Missing stop - should use 'Q4'
                                {
                                    start: 'Q4',
                                    stop: 'Q4',
                                    fill: 'rgba(100, 255, 100, 0.7)',
                                    stroke: '#44ff44',
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
            await compare();
        });

        it('should render area series with Y-axis segmentation and missing values', async () => {
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
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'y',
                            segments: [
                                {
                                    start: 0,
                                    stop: 20,
                                    fill: 'rgba(220, 20, 60, 0.5)',
                                    stroke: 'crimson',
                                    strokeWidth: 2,
                                },
                                { stop: 40, fill: 'rgba(0, 100, 200, 0.5)', stroke: 'mediumblue', strokeWidth: 2 }, // Missing start - should use 20
                                { start: 40, fill: 'rgba(34, 139, 34, 0.5)', stroke: 'forestgreen', strokeWidth: 2 }, // Missing stop - should extend to max
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

        it('should render stacked area series with missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y1: 10, y2: 5 },
                    { x: 2, y1: 15, y2: 8 },
                    { x: 3, y1: 12, y2: 6 },
                    { x: 4, y1: 18, y2: 10 },
                    { x: 5, y1: 22, y2: 12 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y1',
                        yName: 'Series 1',
                        stackGroup: 'stack1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { start: 1, stop: 2, fill: 'rgba(255, 0, 0, 0.7)', stroke: 'red' },
                                { fill: 'rgba(0, 255, 0, 0.7)', stroke: 'green' }, // Missing both - should bridge from 2 to 4
                                { start: 4, fill: 'rgba(0, 0, 255, 0.7)', stroke: 'blue' }, // Missing stop - should extend to end
                            ],
                        },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y2',
                        yName: 'Series 2',
                        stackGroup: 'stack1',
                        segmentation: {
                            key: 'x',
                            segments: [
                                { stop: 3, fill: 'rgba(255, 165, 0, 0.7)', stroke: 'orange' }, // Missing start - should start from beginning
                                { start: 3, fill: 'rgba(128, 0, 128, 0.7)', stroke: 'purple' }, // Missing stop - should extend to end
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

        it('should render area series with pattern fills and missing segmentation values', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 'Mon', y: 20 },
                    { x: 'Tue', y: 25 },
                    { x: 'Wed', y: 18 },
                    { x: 'Thu', y: 30 },
                    { x: 'Fri', y: 35 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        segmentation: {
                            key: 'x',
                            segments: [
                                {
                                    start: 'Mon',
                                    stop: 'Tue',
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'vertical-lines',
                                        stroke: 'darkred',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkred',
                                    strokeWidth: 2,
                                },
                                {
                                    stop: 'Thu', // Missing start - should use 'Tue'
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'horizontal-lines',
                                        stroke: 'darkblue',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkblue',
                                    strokeWidth: 2,
                                },
                                {
                                    start: 'Thu', // Missing stop - should extend to end
                                    fill: {
                                        type: 'pattern',
                                        pattern: 'circles',
                                        stroke: 'darkgreen',
                                        strokeWidth: 1,
                                    },
                                    stroke: 'darkgreen',
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
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
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
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
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
                series: [{ type: 'area', xKey: 'quarter', yKey: 'iphone' }],
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
                    { x: 'Start', s1: 0, s2: 0, s3: 0 },
                    { x: 'End', s1: 100, s2: 200, s3: 300 },
                ],
                series: [
                    { type: 'area', xKey: 'x', yKey: 's1', yName: 'series 1' },
                    { type: 'area', xKey: 'x', yKey: 's2', yName: 'series 2' },
                    { type: 'area', xKey: 'x', yKey: 's3', yName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = examples.AREA_NULL_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [AreaSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const options: AgChartOptions = examples.AREA_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('axis min/max clipping', () => {
        it('should clip area series when x-axis min/max is set', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 30 },
                    { x: 2, y: 10 },
                    { x: 3, y: 25 },
                    { x: 4, y: 15 },
                    { x: 5, y: 35 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 1, max: 4 },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();

            // Verify Y-domain is computed from all visible data within X range [1..4]
            // (visible y values: 30, 10, 25, 15; area baseline at 0),
            // not from a single point (the pre-fix bug).
            const { axes } = deproxy(chart);
            const yAxis = axes.find((a: any) => a.direction === ChartAxisDirection.Y);
            expect(yAxis!.dataDomain.domain).toEqual([0, 30]);
        });

        it('should clip area series when y-axis min/max is set', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 30 },
                    { x: 2, y: 10 },
                    { x: 3, y: 25 },
                    { x: 4, y: 15 },
                    { x: 5, y: 35 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', nice: false, min: 10, max: 25 },
                },
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
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
                series: [{ type: 'area', xKey: 'x', yKey: 'y', selectedKey: 'selected' } as any],
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

        it('extends the fill to the boundary when max is below the last data point', async () => {
            const options: AgCartesianChartOptions = {
                axes: {
                    x: { type: 'unit-time', position: 'bottom', max: new Date('2024-01-03') },
                    y: { type: 'number', position: 'left' },
                },
                series: [{ type: 'area', data, xKey: 'time', yKey: 'value' }],
            };
            prepareTestOptions(options);
            chart = AgCharts.create(options);

            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        const categoryNumberAxes = { x: { type: 'category' as const }, y: { type: 'number' as const } };

        it('renders a plain area series with out-of-safe-range bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', y: BIG },
                        { x: 'b', y: BIG * 2n },
                        { x: 'c', y: NEG_BIG },
                    ],
                    series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a stacked area series with bigint values', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'area', xKey: 'x', yKey: 'a', stacked: true },
                        { type: 'area', xKey: 'x', yKey: 'b', stacked: true },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });

        it('renders a 100%-stacked area series with bigint values (normalizedTo degrades to Number)', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { x: 'a', a: BIG, b: BIG * 2n },
                        { x: 'b', a: BIG * 3n, b: BIG },
                    ],
                    series: [
                        { type: 'area', xKey: 'x', yKey: 'a', stacked: true, normalizedTo: 100 },
                        { type: 'area', xKey: 'x', yKey: 'b', stacked: true, normalizedTo: 100 },
                    ],
                    axes: categoryNumberAxes,
                })
            );
            await compare();
        });
    });

    describe('ISO datetime (AG-16654)', () => {
        it('renders an area series with ISO-8601 datetime-string x values on a time axis', async () => {
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [
                        { time: '2024-01-15T09:00:00Z', y: 12 },
                        { time: '2024-01-15T10:00:00Z', y: 15 },
                        { time: '2024-01-15T11:00:00Z', y: 11 },
                        { time: '2024-01-15T12:00:00Z', y: 18 },
                    ],
                    series: [{ type: 'area', xKey: 'time', yKey: 'y' }],
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
            'renders a %s high-volume bigint area identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createChart,
                    magnitudePair(
                        { series: [{ type: 'area', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
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
                isoEpochPair({ series: [{ type: 'area', xKey: 'x', yKey: 'y' }], axes: STRIPPED_TIME_AXES }, N)
            );
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const single = (ys: number[]) => (toValue: (v: number) => number | bigint) =>
            ys.map((y, i) => ({ x: i + 1, y: toValue(y) }));
        const paired = (rows: Array<[number, number]>) => (toValue: (v: number) => number | bigint) =>
            rows.map(([a, b], i) => ({ x: i + 1, a: toValue(a), b: toValue(b) }));

        it('positions a non-stacked area series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'area', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([3, 4, 5])
                )
            );
        });

        it('positions a straddling-zero area series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    { series: [{ type: 'area', xKey: 'x', yKey: 'y' }], axes: STRIPPED_NUMBER_AXES },
                    single([-3, 4, -5])
                )
            );
        });

        it('positions a stacked area series identically when scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createChart,
                magnitudePair(
                    {
                        series: [
                            { type: 'area', xKey: 'x', yKey: 'a', stacked: true },
                            { type: 'area', xKey: 'x', yKey: 'b', stacked: true },
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
});
