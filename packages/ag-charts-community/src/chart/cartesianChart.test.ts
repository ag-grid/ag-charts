import { afterEach, describe, expect, it } from '@jest/globals';
import { fail } from 'assert';
import { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import { AgCharts } from '../api/agCharts';
import type { AgCartesianChartOptions, AgChartOptions } from '../options/agChartOptions';
import type { CartesianChart } from './cartesianChart';
import type { Chart } from './chart';
import type { SeriesNodeDataContext } from './series/series';
import * as examples from './test/examples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

export function getData(): any[] {
    return [
        {
            year: '2001',
            adults: 24,
            men: 22,
            women: 25,
            children: 13,
            portions: 3.4,
        },
        {
            year: '2003',
            adults: 24,
            men: 22,
            women: 26,
            children: 11,
            portions: 3.4,
        },
        {
            year: '2005',
            adults: 28,
            men: 26,
            women: 30,
            children: 17,
            portions: 3.7,
        },
        {
            year: '2007',
            adults: 29,
            men: 25,
            women: 31,
            children: 21,
            portions: 3.8,
        },
        {
            year: '2009',
            adults: 26,
            men: 25,
            women: 28,
            children: 21,
            portions: 3.5,
        },
        {
            year: '2011',
            adults: 27,
            men: 24,
            women: 29,
            children: 18,
            portions: 3.6,
        },
        {
            year: '2013',
            adults: 26,
            men: 25,
            women: 28,
            children: 16,
            portions: 3.6,
        },
        {
            year: '2015',
            adults: 26,
            men: 24,
            women: 27,
            children: 20,
            portions: 3.5,
        },
        {
            year: '2017',
            adults: 29,
            men: 26,
            women: 32,
            children: 18,
            portions: 3.8,
        },
    ];
}

const OPTIONS: AgCartesianChartOptions = {
    data: getData(),
    title: {
        text: 'Fruit & Vegetable Consumption',
        fontSize: 15,
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'adults',
            yName: 'Adults',
            stacked: true,
            strokeWidth: 10,
            normalizedTo: 32,
            marker: { enabled: true },
            label: { enabled: true },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'children',
            yName: 'Children',
            stacked: true,
            strokeWidth: 10,
            normalizedTo: 32,
            marker: { enabled: true },
            label: { enabled: true },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            strokeWidth: 3,
            marker: { enabled: true },
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            grouped: true,
            strokeWidth: 0,
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            grouped: true,
            strokeWidth: 0,
            label: { enabled: true },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [{ lineDash: [0] }],
            },
        },
        {
            // primary y axis
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: { text: 'Adults Who Eat 5 A Day (%)' },
            crossLines: [
                { type: 'range', strokeWidth: 10, stroke: 'red', range: [20, 30] },
                { type: 'line', strokeWidth: 5, stroke: 'red', lineDash: [8, 3], value: 15 },
            ],
        },
        {
            // secondary y axis
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: { text: 'Portions Consumed (Per Day)' },
        },
    ],
    legend: {
        position: 'bottom',
        item: { marker: { strokeWidth: 0 } },
    },
};

describe('CartesianChart', () => {
    setupMockConsole();

    let chart: CartesianChart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (chartInstance: Chart, options?: MatchImageSnapshotOptions) => {
        await waitForChartStability(chartInstance);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    describe.each([
        ['Series Highlighting', OPTIONS],
        ['Line Series Highlighting', examples.SIMPLE_LINE_CHART_EXAMPLE],
        ['Grouped Bar Series Highlighting', examples.GROUPED_BAR_CHART_EXAMPLE],
        ['Stacked Bar Series Highlighting', examples.STACKED_BAR_CHART_EXAMPLE],
        ['Stacked Area Series Highlighting', examples.STACKED_AREA_GRAPH_EXAMPLE],
        ['Area Series Highlighting', examples.AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE],
    ])(`%s`, (_name, tcOptions: AgCartesianChartOptions) => {
        const YKEYS =
            tcOptions.series?.reduce((r, s: any) => {
                return r.concat(s.yKey ? [s.yKey] : s.yKeys);
            }, []) ?? [];

        const buildChart = async (chartOptions: AgChartOptions, yKey: string) => {
            const options: AgChartOptions = { ...chartOptions };
            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options)) as CartesianChart;
            await waitForChartStability(chart);

            const seriesImpl = chart.series.find(
                (v) => v.properties.yKey === yKey || v.properties.yKeys?.some((s: unknown[]) => s.includes(yKey))
            );
            if (seriesImpl == null) fail('No seriesImpl found');

            const nodeData: SeriesNodeDataContext<never, never> = (seriesImpl as any)['contextNodeData']!;

            const highlightManager = chart.ctx.highlightManager;

            return { chart, nodeData, highlightManager };
        };

        it.each(YKEYS)(`should render series with yKey [%s] appropriately`, async (yKey) => {
            const { chart: testee, highlightManager, nodeData } = await buildChart({ ...tcOptions }, yKey);
            highlightManager.updateHighlight(testee.id, nodeData?.nodeData[3]);
            await compare(testee, {
                failureThreshold: 2,
                failureThresholdType: 'pixel',
            });
        });

        it('should correctly change highlighting state and reset', async () => {
            const { chart: testee, highlightManager, nodeData } = await buildChart({ ...tcOptions }, YKEYS[0]);

            const nodesToTest = nodeData?.nodeData?.slice(2, 4) ?? [];
            expect(nodesToTest).toHaveLength(2);

            for (const nodeDataItem of nodesToTest) {
                highlightManager.updateHighlight(testee.id, nodeDataItem);
                await compare(testee, {
                    failureThreshold: 2,
                    failureThresholdType: 'pixel',
                });
            }

            highlightManager.updateHighlight(testee.id);
            await compare(testee, {
                failureThreshold: 2,
                failureThresholdType: 'pixel',
            });
        });
    });

    describe('Small chart width', () => {
        it.each([80, 160, 240, 320, 400])('should render chart correctly at width [%s]', async (width) => {
            const options: AgCartesianChartOptions = {
                ...examples.SIMPLE_LINE_CHART_EXAMPLE,
                axes: [
                    {
                        type: 'time',
                        position: 'bottom',
                        title: {
                            text: 'Date',
                        },
                        maxSpacing: 80,
                    },
                    {
                        type: 'number',
                        position: 'left',
                        title: {
                            text: 'Price in pence',
                        },
                    },
                ],
                legend: {
                    position: 'right',
                },
            };

            prepareTestOptions(options);
            options.width = width ?? options.width;

            chart = deproxy(AgCharts.create(options)) as CartesianChart;
            await waitForChartStability(chart);
            await compare(chart);
        });
    });

    describe('Small chart height', () => {
        it.each([80, 160, 240, 320, 400])('should render chart correctly at height [%s]', async (height) => {
            const options: AgCartesianChartOptions = {
                ...examples.SIMPLE_LINE_CHART_EXAMPLE,
                legend: {
                    position: 'bottom',
                },
            };

            prepareTestOptions(options);
            options.height = height ?? options.height;

            chart = deproxy(AgCharts.create(options)) as CartesianChart;
            await waitForChartStability(chart);
            await compare(chart);
        });
    });
});
