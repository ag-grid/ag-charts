import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import {
    waitForChartStability,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    extractImageData,
    deproxy,
    GALLERY_EXAMPLES,
    TREEMAP_SERIES_LABELS,
    hierarchyChartAssertions,
} from 'ag-charts-community-test';
import type { AgChartOptions } from 'ag-charts-community';

import type { TreemapSeries } from './treemapSeries';
import { AgEnterpriseCharts } from '../main';
import { prepareEnterpriseTestOptions } from '../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('HierarchyChart', () => {
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
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
            ...GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options,
            data: {
                ...GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options.data,
                children: GALLERY_EXAMPLES.MARKET_INDEX_TREEMAP_GRAPH_EXAMPLE.options.data.children.slice(0, 1),
            },
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgEnterpriseCharts.create(options));
            await compare();
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgEnterpriseCharts.create(options));
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
            await compare();
        });
    });

    describe('Series Labels', () => {
        const examples = {
            TREEMAP_SERIES_LABELS: {
                options: TREEMAP_SERIES_LABELS,
                assertions: hierarchyChartAssertions({ seriesTypes: ['treemap'] }),
            },
        };

        for (const [exampleName, example] of Object.entries(examples)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
                await compare();
            });
        }
    });
});
