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
        {
            id: 'ceo',
            name: 'Alice Chen',
            job: 'Chief Executive Officer',
            location: 'London',
            tenure: 1,
            parentId: null,
        },
        {
            id: 'cto',
            name: 'Bob Smith',
            job: 'Chief Technology Officer',
            location: 'London',
            tenure: 2,
            parentId: 'ceo',
        },
        {
            id: 'cfo',
            name: 'Carol Wu',
            job: 'Chief Financial Officer',
            location: 'London',
            tenure: 3,
            parentId: 'ceo',
        },
        { id: 'dev', name: 'Dave Jones', job: 'Developer', location: 'New York', tenure: 2, parentId: 'cto' },
        { id: 'qa', name: 'Eve Park', job: 'Quality Assurance', location: 'London', tenure: 3, parentId: 'cto' },
        { id: 'acc', name: 'Frank Cash', job: 'Accountant', location: 'London', tenure: 4, parentId: 'cfo' },
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

const SIMPLE_ORG_CHART_THEMED: AgChartOptions = {
    ...SIMPLE_ORG_CHART,
    theme: {
        overrides: {
            organization: {
                series: {
                    link: { stroke: '#ff7faa', lineDash: [2, 4] },
                    node: {
                        fill: '#fff1e5',
                        stroke: '#006f9b',
                        lineDash: [8, 2],
                        cornerRadius: 30,
                        title: { color: '#006f9b' },
                        subtitle: { color: '#ff7faa', fontStyle: 'italic' },
                        labels: [{ color: '#00994d' }],
                    },
                },
            },
        },
    },
};

const LINKS_ROUNDED_INTERPOLATION: AgChartOptions = {
    ...SIMPLE_ORG_CHART,
    theme: {
        overrides: {
            organization: {
                series: {
                    link: { interpolation: { type: 'step', cornerRadius: 8 } },
                },
            },
        },
    },
};

const ITEM_STYLERS: AgChartOptions = {
    ...SIMPLE_ORG_CHART,
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            link: {
                itemStyler: (params: any) => {
                    if (params.from.job === 'Chief Technology Officer' && params.to.job === 'Developer') {
                        return { stroke: '#00994d' };
                    } else if (params.from.job === 'Chief Executive Officer') {
                        return {
                            stroke: '#006f9b',
                            strokeWidth: 4,
                            lineDash: [],
                            interpolation: {
                                type: 'step',
                                cornerRadius: 8,
                            },
                        };
                    }
                },
            },
            node: {
                itemStyler: (params: any) => {
                    if (params.datum.job === 'Chief Financial Officer') {
                        return {
                            fill: '#fff1e5',
                            stroke: '#006f9b',
                            lineDash: [8, 2],
                            cornerRadius: 30,
                        };
                    }
                },
                title: { key: 'name' },
                subtitle: {
                    key: 'job',
                    itemStyler: (params: any) => {
                        if (params.datum.job === 'Developer') {
                            return {
                                color: '#006f9b',
                                fontStyle: 'italic',
                            };
                        }
                    },
                },
                labels: [
                    { key: 'location' },
                    {
                        key: 'tenure',
                        itemStyler: (params: any) => {
                            if (params.datum.tenure > 2) {
                                return {
                                    color: '#ff7faa',
                                    fontWeight: 'bold',
                                };
                            }
                        },
                    },
                ],
            },
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
    SIMPLE_ORG_CHART_THEMED: {
        options: SIMPLE_ORG_CHART_THEMED,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    LINKS_ROUNDED_INTERPOLATION: {
        options: LINKS_ROUNDED_INTERPOLATION,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    ITEM_STYLERS: {
        options: ITEM_STYLERS,
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
