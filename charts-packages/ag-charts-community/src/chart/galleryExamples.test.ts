import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { AgChartOptions } from './agChartOptions';
import { AgChartV2 } from './agChartV2';
import { Chart } from './chart';
import * as examples from './test/examples';
import {
    repeat,
    waitForChartStability,
    cartesianChartAssertions,
    polarChartAssertions,
    hierarchyChartAssertions,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    toMatchImage,
    extractImageData,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
} from './test/utils';

expect.extend({ toMatchImageSnapshot, toMatchImage });

type TestCase = {
    options: AgChartOptions;
    assertions: (chart: Chart) => Promise<void>;
    extraScreenshotActions?: (chart: Chart) => Promise<void>;
};
const EXAMPLES: Record<string, TestCase> = {
    BAR_CHART_EXAMPLE: {
        options: examples.BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    GROUPED_BAR_CHART_EXAMPLE: {
        options: examples.GROUPED_BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    STACKED_BAR_CHART_EXAMPLE: {
        options: examples.STACKED_BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    BAR_CHART_WITH_LABELS_EXAMPLE: {
        options: examples.BAR_CHART_WITH_LABELS_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    SIMPLE_COLUMN_CHART_EXAMPLE: {
        options: examples.SIMPLE_COLUMN_CHART_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    GROUPED_COLUMN_EXAMPLE: {
        options: examples.GROUPED_COLUMN_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    STACKED_COLUMN_GRAPH_EXAMPLE: {
        options: examples.STACKED_COLUMN_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions(),
    },
    SIMPLE_PIE_CHART_EXAMPLE: {
        options: examples.SIMPLE_PIE_CHART_EXAMPLE,
        assertions: polarChartAssertions(),
    },
    SIMPLE_DOUGHNUT_CHART_EXAMPLE: {
        options: examples.SIMPLE_DOUGHNUT_CHART_EXAMPLE,
        assertions: polarChartAssertions(),
    },
    SIMPLE_LINE_CHART_EXAMPLE: {
        options: examples.SIMPLE_LINE_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['line', 'line'] }),
    },
    LINE_GRAPH_WITH_GAPS_EXAMPLE: {
        options: examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('line', 16) }),
    },
    SIMPLE_SCATTER_CHART_EXAMPLE: {
        options: examples.SIMPLE_SCATTER_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'category'], seriesTypes: ['scatter'] }),
    },
    SIMPLE_AREA_GRAPH_EXAMPLE: {
        options: examples.SIMPLE_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('area', 4) }),
    },
    STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.STACKED_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: ['area'] }),
    },
    ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: ['area'] }),
    },
    AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('area', 5) }),
    },
    MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE: {
        options: examples.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE,
        assertions: hierarchyChartAssertions(),
    },
    SIMPLE_HISTOGRAM_CHART_EXAMPLE: {
        options: examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
    },
    HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE: {
        options: examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
    },
    XY_HISTOGRAM_WITH_MEAN_EXAMPLE: {
        options: examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['histogram'] }),
    },
    GROUPED_CATEGORY_AXIS_EXAMPLE: {
        options: examples.GROUPED_CATEGORY_AXIS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['groupedCategory', 'number'], seriesTypes: ['bar'] }),
    },
};

describe('Gallery Examples', () => {
    describe('AgChartV2#create', () => {
        let ctx = setupMockCanvas();

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                const chart = AgChartV2.create<any>(options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                options.autoSize = false;
                options.width = CANVAS_WIDTH;
                options.height = CANVAS_HEIGHT;

                const chart = AgChartV2.create<any>(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('AgChartV2#update', () => {
        let ctx = setupMockCanvas();

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            describe(`for ${exampleName}`, () => {
                let chart: Chart;
                let options: AgChartOptions;

                beforeEach(async () => {
                    options = { ...example.options };
                    options.autoSize = false;
                    options.width = CANVAS_WIDTH;
                    options.height = CANVAS_HEIGHT;

                    chart = AgChartV2.create<any>(options);
                    await waitForChartStability(chart);
                });

                afterEach(() => {
                    chart.destroy();
                    chart = null;
                    options = null;
                });

                it(`it should update chart instance as expected`, async () => {
                    AgChartV2.update<any>(chart, options);
                    await waitForChartStability(chart);

                    await example.assertions(chart);
                });

                it(`it should render the same after update`, async () => {
                    const snapshot = async () => {
                        await waitForChartStability(chart);

                        return ctx.nodeCanvas.toBuffer('raw');
                    };

                    AgChartV2.update<any>(chart, options);

                    const before = await snapshot();
                    AgChartV2.update<any>(chart, options);
                    const after = await snapshot();

                    (expect(after) as any).toMatchImage(before);
                });
            });
        }
    });
});
