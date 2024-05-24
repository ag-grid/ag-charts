import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from '../../api/agChart';
import type { AgChartOptions } from '../../options/agChartOptions';
import type { Chart } from '../chart';
import type { TestCase } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    polarChartAssertions,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import * as examples from './test/examples';

const EXAMPLES: Record<string, TestCase> = {
    COLUMN_SERIES_LABELS: {
        options: examples.COLUMN_SERIES_LABELS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['bar'] }),
    },
    STACKED_COLUMN_SERIES_LABELS: {
        options: examples.STACKED_COLUMN_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('bar', 5),
        }),
    },
    GROUPED_COLUMN_SERIES_LABELS: {
        options: examples.GROUPED_COLUMN_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('bar', 5),
        }),
    },
    BAR_SERIES_LABELS: {
        options: examples.BAR_SERIES_LABELS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['bar'] }),
    },
    STACKED_BAR_SERIES_LABELS: {
        options: examples.STACKED_BAR_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('bar', 5),
        }),
    },
    GROUPED_BAR_SERIES_LABELS: {
        options: examples.GROUPED_BAR_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('bar', 5),
        }),
    },
    AREA_SERIES_LABELS: {
        options: examples.AREA_SERIES_LABELS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['area'] }),
    },
    STACKED_AREA_SERIES_LABELS: {
        options: examples.STACKED_AREA_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('area', 4),
        }),
    },
    GROUPED_AREA_SERIES_LABELS: {
        options: examples.GROUPED_AREA_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: repeat('area', 3),
        }),
    },
    LINE_SERIES_LABELS: {
        options: examples.LINE_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('line', 3),
        }),
    },
    SCATTER_SERIES_LABELS: {
        options: examples.SCATTER_SERIES_LABELS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    GROUPED_SCATTER_SERIES_LABELS: {
        options: examples.GROUPED_SCATTER_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['time', 'number'],
            seriesTypes: repeat('scatter', 4),
        }),
    },
    BUBBLE_SERIES_LABELS: {
        options: examples.BUBBLE_SERIES_LABELS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['bubble'] }),
    },
    GROUPED_BUBBLE_SERIES_LABELS: {
        options: examples.GROUPED_BUBBLE_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'number'],
            seriesTypes: repeat('bubble', 2),
        }),
    },
    PIE_SERIES_LABELS: {
        options: examples.PIE_SERIES_LABELS,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    DONUT_SERIES_LABELS: {
        options: examples.DONUT_SERIES_LABELS,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    GROUPED_DONUT_SERIES_LABELS: {
        options: examples.GROUPED_DONUT_SERIES_LABELS,
        assertions: polarChartAssertions({ seriesTypes: repeat('donut', 2) }),
    },
    LINE_COLUMN_COMBO_SERIES_LABELS: {
        options: examples.LINE_COLUMN_COMBO_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number', 'number'],
            seriesTypes: ['bar', 'bar', 'line'],
        }),
    },
    AREA_COLUMN_COMBO_SERIES_LABELS: {
        options: examples.AREA_COLUMN_COMBO_SERIES_LABELS,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number', 'number'],
            seriesTypes: ['area', 'bar', 'bar'],
        }),
    },
};

describe('series labels', () => {
    setupMockConsole();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options) as Chart;
                await compare();
            }
        );
    });
});
