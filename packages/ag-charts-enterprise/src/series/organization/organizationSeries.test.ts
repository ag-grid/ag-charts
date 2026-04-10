import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions, AgStandaloneChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    ChartTestCase,
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    standaloneChartAssertions,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const SIMPLE_ORG_CHART: AgChartOptions = {
    data: [
        { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        { id: 'cto', name: 'Bob Smith', job: 'Chief Technology Officer', location: 'London', parentId: 'ceo' },
        { id: 'cfo', name: 'Carol Wu', job: 'Chief Financial Officer', location: 'London', parentId: 'ceo' },
        { id: 'dev', name: 'Dave Jones', job: 'Developer', location: 'New York', parentId: 'cto' },
        { id: 'qa', name: 'Eve Park', job: 'Quality Assurance', location: 'London', parentId: 'cto' },
        { id: 'acc', name: 'Frank Cash', job: 'Accountant', location: 'London', parentId: 'cfo' },
    ],
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: { title: { key: 'name' }, subtitle: { key: 'job' }, labels: [{ key: 'location' }] },
        },
    ],
};

interface StandaloneTestCase extends ChartTestCase {
    options: AgStandaloneChartOptions;
}

const EXAMPLES: Record<string, StandaloneTestCase> = {
    SIMPLE_ORG_CHART: {
        options: SIMPLE_ORG_CHART,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
};

describe('OrganizationSeries', () => {
    setupMockConsole();
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
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

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
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });
});
