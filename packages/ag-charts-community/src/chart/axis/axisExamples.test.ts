import { afterEach, describe, expect, it } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type {
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { ChartUpdateType } from '../chartUpdateType';
import * as examples from '../test/examples';
import * as axesExamples from '../test/examples-axes';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    createChart,
    deproxy,
    extractImageData,
    repeat,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { CartesianTestCase, ChartOrProxy } from '../test/utils';

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, label: { ...axis.label, rotation } })),
    };
}

function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, position: positionFlip(axis.position) })),
    };
}

type TestCase = CartesianTestCase & {
    compare?: AgCartesianAxisType[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        BASIC_CATEGORY_AXIS: {
            options: axesExamples.CATEGORY_AXIS_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 3) }),
        },
        BASIC_CATEGORY_UNIFORM_AXIS: {
            options: axesExamples.CATEGORY_AXIS_UNIFORM_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ seriesTypes: ['bar'] }),
        },
        BASIC_TIME_AXIS: {
            options: axesExamples.TIME_AXIS_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
        },
        BASIC_TIME_MIN_MAX_DATE_AXIS: {
            options: axesExamples.TIME_AXIS_MIN_MAX_DATE_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
            compare: ['unit-time'],
        },
        BASIC_TIME_MIN_MAX_NUMBER_AXIS: {
            options: axesExamples.TIME_AXIS_MIN_MAX_NUMBER_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'unit-time', y: 'number' }, seriesTypes: ['line'] }),
            compare: ['unit-time'],
        },
        NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'number', y: 'number' },
                seriesTypes: ['line'],
            }),
        },
    }),
};

const EXAMPLES_NO_SERIES: Record<string, TestCase> = {
    NUMBER_AXIS_NO_SERIES: {
        options: axesExamples.NUMBER_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
    },
    NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
    },
    TIME_AXIS_NO_SERIES: {
        options: axesExamples.TIME_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'time', y: 'number' },
            seriesTypes: repeat('line', 4),
        }),
    },
    TIME_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.TIME_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'time', y: 'number' },
            seriesTypes: repeat('line', 4),
        }),
    },
    COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES: {
        options: axesExamples.COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    COMBO_SERIES_AREA_PADDING: {
        options: axesExamples.COMBO_SERIES_AREA_PADDING,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    COMBO_SERIES_AREA_PADDING_WITHOUT_TITLES: {
        options: axesExamples.COMBO_SERIES_AREA_PADDING_WITHOUT_TITLES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS: {
        options: axesExamples.COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS_OR_TITLES: {
        options: axesExamples.COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS_OR_TITLES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number', ySecondary: 'number' },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    AREA_CHART_NO_SERIES: {
        options: axesExamples.AREA_CHART_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('area', 6),
        }),
    },
    AREA_CHART_STACKED_NORMALISED_NO_SERIES: {
        options: axesExamples.AREA_CHART_STACKED_NORMALISED_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('area', 7),
        }),
    },
};

const EXAMPLES_TICK_VALUES: Record<string, TestCase> = {
    ...mixinReversedAxesCases({
        NUMBER_AXIS_TICK_VALUES: {
            options: axesExamples.NUMBER_AXIS_TICK_VALUES,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
        },
        TIME_AXIS_TICK_VALUES: {
            options: axesExamples.TIME_AXIS_TICK_VALUES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'time', y: 'number' },
                seriesTypes: repeat('line', 4),
            }),
        },
        CATEGORY_AXIS_TICK_VALUES: {
            options: axesExamples.CATEGORY_AXIS_TICK_VALUES,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 7),
            }),
        },
    }),
};

const EXAMPLES_TICK_SPACING: Record<string, TestCase> = {
    ...mixinReversedAxesCases({
        AXIS_TICK_MIN_SPACING: {
            options: axesExamples.AXIS_TICK_MIN_SPACING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'time', y: 'number' },
                seriesTypes: repeat('line', 4),
            }),
        },
        AXIS_TICK_MAX_SPACING: {
            options: axesExamples.AXIS_TICK_MAX_SPACING,
            assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
        },
        AXIS_TICK_MIN_MAX_SPACING: {
            options: axesExamples.AXIS_TICK_MIN_MAX_SPACING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 7),
            }),
        },
    }),
};

const EXAMPLES_CLIPPING: Record<string, TestCase> = {
    ...mixinDerivedCases({
        GRIDLINE_TICKLINE_CLIPPING: {
            options: axesExamples.GRIDLINE_TICKLINE_CLIPPING,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
        },
    }),
};

const EXAMPLES_LAYOUT: Record<string, TestCase> = {
    COMBO_SERIES_COMPLEX_LAYOUT: {
        options: axesExamples.COMBO_SERIES_COMPLEX_LAYOUT,
        assertions: cartesianChartAssertions({
            axisTypes: {
                x: 'category',
                y: 'number',
                ySecondary: 'number',
                yStart1: 'number',
                yStart2: 'number',
                yEnd1: 'number',
                yEnd2: 'number',
            },
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
};

function mixinDerivedCases(baseCases: Record<string, TestCase>): Record<string, TestCase> {
    const result = { ...baseCases };

    for (const [name, baseCase] of Object.entries(baseCases)) {
        // Add manual rotation.
        result[name + '_MANUAL_ROTATION'] = {
            ...baseCase,
            options: applyRotation(baseCase.options, -30),
        };

        // Add flipped axes.
        result[name + '_FLIP'] = {
            ...baseCase,
            options: applyAxesFlip(baseCase.options),
        };

        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

function mixinReversedAxesCases(baseCases: Record<string, TestCase>): Record<string, TestCase> {
    const result = { ...baseCases };

    for (const [name, baseCase] of Object.entries(baseCases)) {
        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

function calculateAxisBBox(axis: ChartAxis): { x: number; y: number; width: number; height: number } {
    const bbox = axis.getBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

describe('Axis Examples', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const snapshot = async () => {
        await waitForChartStability(chart);
        return ctx.snapshot();
    };

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const newImageData = extractImageData(ctx);
        expect(newImageData).toMatchImageSnapshot(defaults);
    };

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const axisCompare = () => {
                for (const axis of deproxy(chart).axes) {
                    if (example.compare != null && !example.compare.includes(axis.type as AgCartesianAxisType)) {
                        continue;
                    }

                    const axesBBox = calculateAxisBBox(axis);
                    const imageData = extractImageData({ ...ctx, bbox: axesBBox });

                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            };

            chart = await createChart(example.options);
            axisCompare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                axisCompare();
            }
        });
    }

    describe('no series cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_NO_SERIES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });

            it(`for ${exampleName} it should render identically after legend toggle`, async () => {
                chart = await createChart({ ...example.options, legend: { enabled: true } });
                const reference = await snapshot();

                for (const s of chart.series) {
                    const itemId = s.getKeys(ChartAxisDirection.Y)[0];
                    (s as any).toggleSeriesItem(true, 'category', itemId, undefined);
                }
                chart.update(ChartUpdateType.FULL);

                const afterUpdate = await snapshot();
                expect(afterUpdate).not.toMatchImage(reference);

                for (const s of chart.series) {
                    const itemId = s.getKeys(ChartAxisDirection.Y)[0];
                    (s as any).toggleSeriesItem(false, 'category', itemId, undefined);
                }
                chart.update(ChartUpdateType.FULL);

                const afterFinalUpdate = await snapshot();
                expect(afterFinalUpdate).toMatchImage(reference);
            }, 15_000);
        }
    });

    describe('toggle secondary axis series', () => {
        it(`for ADV_COMBINATION_SERIES_CHART_EXAMPLE it should render identically after legend toggle`, async () => {
            chart = await createChart({ ...examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE, legend: { enabled: true } });
            const reference = await snapshot();

            const secondarySeries = chart.series[2] as any;

            expect(secondarySeries.getKeys(ChartAxisDirection.Y)).toEqual(['exportedTonnes']);

            // Hide series bound to secondary axis.
            secondarySeries.toggleSeriesItem(false, 'category', undefined);
            chart.update(ChartUpdateType.FULL);

            const afterUpdate = await snapshot();
            (expect(afterUpdate) as any).not.toMatchImage(reference);

            // Show series bound to secondary axis.
            secondarySeries.toggleSeriesItem(true, 'category', undefined);
            chart.update(ChartUpdateType.FULL);

            const afterFinalUpdate = await snapshot();
            expect(afterFinalUpdate).toMatchImage(reference);
        });

        it(`for ADV_COMBINATION_SERIES_CHART_EXAMPLE it should render identically after legend toggle with reversed axes`, async () => {
            chart = await createChart({
                ...reverseAxes(examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE, true),
                legend: { enabled: true },
            });

            const reference = await snapshot();

            const secondarySeries = chart.series[2] as any;
            expect(secondarySeries.getKeys(ChartAxisDirection.Y)).toEqual(['exportedTonnes']);

            // Hide series bound to secondary axis.
            secondarySeries.toggleSeriesItem(false, 'category', undefined);
            chart.update(ChartUpdateType.FULL);

            const afterUpdate = await snapshot();
            (expect(afterUpdate) as any).not.toMatchImage(reference);

            // Show series bound to secondary axis.
            secondarySeries.toggleSeriesItem(true, 'category', undefined);
            chart.update(ChartUpdateType.FULL);

            const afterFinalUpdate = await snapshot();
            expect(afterFinalUpdate).toMatchImage(reference);

            await compare();
        });
    });

    describe('configured tick values cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_TICK_VALUES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare(PATTERN_SNAPSHOT_DEFAULTS);
                }
            });
        }
    });

    describe('configured tick spacing cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_TICK_SPACING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare(PATTERN_SNAPSHOT_DEFAULTS);

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare(PATTERN_SNAPSHOT_DEFAULTS);
                }
            });
        }
    });

    describe('grid and tick line clipping cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_CLIPPING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('AG-10654', () => {
        it('should render secondary category axis', async () => {
            chart = await createChart({
                data: [
                    { quarter: 'Q1', quarter2: 'Q21', petrol: 200, diesel: 100 },
                    { quarter: 'Q2', quarter2: 'Q22', petrol: 300, diesel: 130 },
                    { quarter: 'Q3', quarter2: 'Q23', petrol: 350, diesel: 160 },
                    { quarter: 'Q4', quarter2: 'Q24', petrol: 400, diesel: 200 },
                ],
                series: [
                    { type: 'line', xKey: 'quarter', yKey: 'petrol' },
                    { type: 'line', xKey: 'quarter2', yKey: 'diesel', xKeyAxis: 'secondaryX' },
                ],
                axes: {
                    x: { type: 'category', position: 'top' },
                    secondaryX: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            });
            await compare();
        });
    });

    describe('complex layout cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_LAYOUT)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart = await createChart(example.options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                chart = await createChart(example.options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('empty data', () => {
        it.each(['number', 'time', 'unit-time'] as const)(`should render empty %s axis`, async (axisType) => {
            chart = await createChart({
                data: [],
                axes: {
                    y: { type: 'number', position: 'left' },
                    x: { type: axisType, position: 'bottom', min: 1 },
                },
            });
            await compare();
        });
    });
});
