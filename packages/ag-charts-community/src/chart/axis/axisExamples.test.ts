import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { AgChartOptions, AgCartesianAxisType, AgCartesianAxisPosition } from '../agChartOptions';
import { AgChart } from '../agChartV2';
import { Chart } from '../chart';
import { ChartUpdateType } from '../chartUpdateType';
import { ChartAxis } from '../chartAxis';
import * as axesExamples from '../test/examples-axes';
import * as examples from '../test/examples';
import {
    waitForChartStability,
    cartesianChartAssertions,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    toMatchImage,
    deproxy,
    repeat,
    prepareTestOptions,
} from '../test/utils';
import { ChartAxisDirection } from '../chartAxisDirection';

expect.extend({ toMatchImageSnapshot, toMatchImage });

function applyRotation<T>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: opts['axes']?.map((axis) => ({ ...axis, label: { ...axis.label, rotation } })) || undefined,
    };
}

function applyAxesFlip<T>(opts: T): T {
    const positionFlip = (position: AgCartesianAxisPosition) => {
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
        axes: opts['axes']?.map((axis) => ({ ...axis, position: positionFlip(axis.position) })) || undefined,
    };
}

type TestCase = {
    options: AgChartOptions;
    assertions: (chart: Chart) => Promise<void>;
    extraScreenshotActions?: (chart: Chart) => Promise<void>;
    compare?: AgCartesianAxisType[];
};
const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        BASIC_CATEGORY_AXIS: {
            options: axesExamples.CATEGORY_AXIS_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
        },
        BASIC_CATEGORY_UNIFORM_AXIS: {
            options: axesExamples.CATEGORY_AXIS_UNIFORM_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
        },
        GROUPED_CATEGORY_AXIS: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['groupedCategory', 'number'], seriesTypes: ['column'] }),
        },
        BASIC_TIME_AXIS: {
            options: axesExamples.TIME_AXIS_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
        },
        BASIC_TIME_MIN_MAX_DATE_AXIS: {
            options: axesExamples.TIME_AXIS_MIN_MAX_DATE_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
            compare: ['time'],
        },
        BASIC_TIME_MIN_MAX_NUMBER_AXIS: {
            options: axesExamples.TIME_AXIS_MIN_MAX_NUMBER_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line'] }),
            compare: ['time'],
        },
        NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE: {
            options: axesExamples.NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE,
            assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['line'] }),
        },
    }),
    NUMBER_AXIS_LOG2_EXAMPLE: {
        options: axesExamples.NUMBER_AXIS_LOG2_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
        compare: ['log'],
    },
    NUMBER_AXIS_LOG10_EXAMPLE: {
        options: axesExamples.NUMBER_AXIS_LOG10_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
        compare: ['log'],
    },
};

const EXAMPLES_NO_SERIES: Record<string, TestCase> = {
    NUMBER_AXIS_NO_SERIES: {
        options: axesExamples.NUMBER_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    TIME_AXIS_NO_SERIES: {
        options: axesExamples.TIME_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: ['time', 'number'],
            seriesTypes: repeat('line', 4),
        }),
    },
    TIME_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.TIME_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({
            axisTypes: ['time', 'number'],
            seriesTypes: repeat('line', 4),
        }),
    },
    COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES: {
        options: axesExamples.COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number', 'number'],
            seriesTypes: ['column', 'line'],
        }),
    },
    COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN: {
        options: axesExamples.COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number', 'number'],
            seriesTypes: ['column', 'line'],
        }),
    },
    AREA_CHART_NO_SERIES: {
        options: axesExamples.AREA_CHART_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: ['time', 'number'],
            seriesTypes: ['area'],
        }),
    },
    AREA_CHART_STACKED_NORMALISED_NO_SERIES: {
        options: axesExamples.AREA_CHART_STACKED_NORMALISED_NO_SERIES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: ['area'],
        }),
    },
};

const EXAMPLES_TICK_VALUES: Record<string, TestCase> = {
    NUMBER_AXIS_TICK_VALUES: {
        options: axesExamples.NUMBER_AXIS_TICK_VALUES,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    TIME_AXIS_TICK_VALUES: {
        options: axesExamples.TIME_AXIS_TICK_VALUES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 4) }),
    },
    LOG_AXIS_TICK_VALUES: {
        options: axesExamples.LOG_AXIS_TICK_VALUES,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'log'], seriesTypes: ['line'] }),
    },
    CATEGORY_AXIS_TICK_VALUES: {
        options: axesExamples.CATEGORY_AXIS_TICK_VALUES,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['column'] }),
    },
};

const EXAMPLES_TICK_SPACING: Record<string, TestCase> = {
    AXIS_TICK_MIN_SPACING: {
        options: axesExamples.AXIS_TICK_MIN_SPACING,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 4) }),
    },
    AXIS_TICK_MAX_SPACING: {
        options: axesExamples.AXIS_TICK_MAX_SPACING,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    AXIS_TICK_MIN_MAX_SPACING: {
        options: axesExamples.AXIS_TICK_MIN_MAX_SPACING,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['column'] }),
    },
};

const EXAMPLES_CLIPPING: Record<string, TestCase> = {
    ...mixinDerivedCases({
        GRDILINE_TICKLINE_CLIPPING: {
            options: axesExamples.GRDILINE_TICKLINE_CLIPPING,
            assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['column'] }),
        },
        GROUPED_CATEGORY_AXIS_GRDILINE_TICKLINE_CLIPPING: {
            options: axesExamples.GROUPED_CATEGORY_AXIS_GRDILINE_TICKLINE_CLIPPING,
            assertions: cartesianChartAssertions({
                axisTypes: ['groupedCategory', 'number'],
                seriesTypes: ['column'],
            }),
        },
    }),
};

function switchToColumn<T>(opts: T): T {
    return {
        ...opts,
        series: opts['series']?.map((s) => ({ ...s, type: 'column' })),
        axes: opts['axes']?.map((a) => ({ ...a, position: a.position === 'left' ? 'bottom' : 'left' })),
    };
}

function applyAutoWrapping<T>(opts: T, maxWidth?: number): T {
    return {
        ...opts,
        axes:
            opts['axes']?.map((axis) => ({
                ...axis,
                label: { ...axis.label, autoWrap: true, maxWidth, autoRotate: false, rotation: 0 },
            })) || undefined,
    };
}

const EXAMPLES_LABEL_AUTO_WRAPPING: Record<string, TestCase> = {
    BAR_CHART_EXAMPLE: {
        options: applyAutoWrapping(examples.BAR_CHART_EXAMPLE, 150),
        assertions: cartesianChartAssertions(),
    },
    GROUPED_BAR_CHART_EXAMPLE: {
        options: applyAutoWrapping(examples.GROUPED_BAR_CHART_EXAMPLE),
        assertions: cartesianChartAssertions(),
    },
    STACKED_BAR_CHART_EXAMPLE: {
        options: applyAutoWrapping(examples.STACKED_BAR_CHART_EXAMPLE, 150),
        assertions: cartesianChartAssertions(),
    },
    ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: {
        options: applyAutoWrapping(examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE, 100),
        assertions: cartesianChartAssertions(),
    },
    BAR_CHART_WITH_LABELS_EXAMPLE: {
        options: applyAutoWrapping(examples.BAR_CHART_WITH_LABELS_EXAMPLE),
        assertions: cartesianChartAssertions(),
    },
    COLUMN_CHART_EXAMPLE: {
        options: applyAutoWrapping(switchToColumn(examples.BAR_CHART_EXAMPLE)),
        assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
    },
    GROUPED_COLUMN_CHART_EXAMPLE: {
        options: applyAutoWrapping(switchToColumn(examples.GROUPED_BAR_CHART_EXAMPLE)),
        assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
    },
    STACKED_COLUMN_CHART_EXAMPLE: {
        options: applyAutoWrapping(switchToColumn(examples.STACKED_BAR_CHART_EXAMPLE)),
        assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
    },
    ONE_HUNDRED_PERCENT_STACKED_COLUMN_EXAMPLE: {
        options: applyAutoWrapping(switchToColumn(examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE)),
        assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
    },
    COLUMN_CHART_WITH_LABELS_EXAMPLE: {
        options: applyAutoWrapping(switchToColumn(examples.BAR_CHART_WITH_LABELS_EXAMPLE)),
        assertions: cartesianChartAssertions({ seriesTypes: ['column'] }),
    },
    SIMPLE_LINE_CHART_EXAMPLE: {
        options: applyAutoWrapping(examples.SIMPLE_LINE_CHART_EXAMPLE, 80),
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line', 'line'] }),
    },
};

function mixinDerivedCases(baseCases: Record<string, TestCase>): Record<string, TestCase> {
    const result = { ...baseCases };

    Object.entries(baseCases).forEach(([name, baseCase]) => {
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
    });

    return result;
}

function calculateAxisBBox(axis: ChartAxis<any>): { x: number; y: number; width: number; height: number } {
    const bbox = axis.computeBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

describe('Axis Examples', () => {
    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        expect(console.warn).not.toBeCalled();
        expect(console.error).not.toBeCalled();
    });

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            const options: AgChartOptions = example.options;
            chart = deproxy(AgChart.create(options));
            await waitForChartStability(chart);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const compare = async () => {
                await waitForChartStability(chart);

                for (const axis of chart.axes) {
                    if (example.compare != null && !example.compare.includes(axis.type as AgCartesianAxisType)) {
                        continue;
                    }

                    const axesBBox = calculateAxisBBox(axis);
                    const imageData = extractImageData({ ...ctx, bbox: axesBBox });

                    (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                }
            };

            const options: AgChartOptions = { ...example.options };
            prepareTestOptions(options);

            chart = deproxy(AgChart.create(options)) as Chart;
            await compare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare();
            }
        });
    }

    describe.skip('no series cases', () => {
        beforeEach(() => {
            // Increase timeout for legend toggle case.
            jest.setTimeout(10_000);
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES_NO_SERIES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = deproxy(AgChart.create(options)) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const newImageData = extractImageData({ ...ctx });
                    (expect(newImageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });

            it(`for ${exampleName} it should render identically after legend toggle`, async () => {
                const snapshot = async () => {
                    await waitForChartStability(chart);

                    return ctx.nodeCanvas?.toBuffer('raw');
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                const reference = await snapshot();

                chart.series.forEach((s) => {
                    s.toggleSeriesItem(s.getKeys(ChartAxisDirection.Y)[0], true);
                });
                chart.update(ChartUpdateType.FULL);

                const afterUpdate = await snapshot();
                (expect(afterUpdate) as any).not.toMatchImage(reference);

                chart.series.forEach((s) => {
                    s.toggleSeriesItem(s.getKeys(ChartAxisDirection.Y)[0], false);
                });
                chart.update(ChartUpdateType.FULL);

                const afterFinalUpdate = await snapshot();
                (expect(afterFinalUpdate) as any).toMatchImage(reference);
            });
        }
    });

    describe('toggle secondary axis series', () => {
        it(`for ADV_COMBINATION_SERIES_CHART_EXAMPLE it should render identically after legend toggle`, async () => {
            const snapshot = async () => {
                await waitForChartStability(chart);

                return ctx.nodeCanvas?.toBuffer('raw');
            };

            const options: AgChartOptions = { ...examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE };
            prepareTestOptions(options);

            chart = deproxy(AgChart.create(options)) as Chart;
            const reference = await snapshot();
            expect(chart.series[1].getKeys(ChartAxisDirection.Y)).toEqual(['exportedTonnes']);

            // Hide series bound to secondary axis.
            chart.series[1].toggleSeriesItem('exportedTonnes', false);
            chart.update(ChartUpdateType.FULL);

            const afterUpdate = await snapshot();
            (expect(afterUpdate) as any).not.toMatchImage(reference);

            // Show series bound to secondary axis.
            chart.series[1].toggleSeriesItem('exportedTonnes', true);
            chart.update(ChartUpdateType.FULL);

            const afterFinalUpdate = await snapshot();
            (expect(afterFinalUpdate) as any).toMatchImage(reference);
        });
    });

    describe('configured tick values cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_TICK_VALUES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = deproxy(AgChart.create(options)) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const newImageData = extractImageData({ ...ctx });
                    (expect(newImageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('configured tick spacing cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_TICK_SPACING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = deproxy(AgChart.create(options)) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const newImageData = extractImageData({ ...ctx });
                    (expect(newImageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('auto wrap axis labels cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_LABEL_AUTO_WRAPPING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = deproxy(AgChart.create(options)) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const newImageData = extractImageData({ ...ctx });
                    (expect(newImageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('grid and tick line clipping cases', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES_CLIPPING)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                chart = deproxy(AgChart.create(options)) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const newImageData = extractImageData({ ...ctx });
                    (expect(newImageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgChart.create(options)) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });
});
