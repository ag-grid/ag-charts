import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { AgChartOptions } from './agChartOptions';
import { AgChart } from './agChartV2';
import { Chart } from './chart';
import {
    waitForChartStability,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    deproxy,
    prepareTestOptions,
} from './test/utils';
import * as examples from './test/examples';
import { HierarchyChart } from './hierarchyChart';
import { TreemapSeries } from './series/hierarchy/treemapSeries';

expect.extend({ toMatchImageSnapshot });

describe('HierarchyChart', () => {
    let chart: HierarchyChart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (chart: Chart) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Series Highlighting', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        const SIMPLIFIED_EXAMPLE = {
            ...examples.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE,
            data: {
                ...examples.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.data,
                children: examples.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.data.children.slice(0, 1),
            },
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareTestOptions(options);

            chart = deproxy(AgChart.create(options)) as HierarchyChart;
            await compare(chart);
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareTestOptions(options);

            chart = deproxy(AgChart.create(options)) as HierarchyChart;
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as TreemapSeries;
            let node = seriesImpl['dataRoot'];
            const childIndexes = [...childAtDepth];
            while (depth > 0 && node) {
                node = node.children![childIndexes.shift() ?? 0];
                depth--;
            }

            const highlightManager = (chart as any).highlightManager;
            highlightManager.updateHighlight(chart.id, node as any);
            await compare(chart);
        });
    });
});
