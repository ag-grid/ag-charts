import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgChartOptions,
    AgOrganizationSeriesOptionsNodeImagePosition,
    AgStandaloneChartOptions,
    TextAlign,
} from 'ag-charts-community';
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
            avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
            parentId: null,
        },
        {
            id: 'cto',
            name: 'Bob Smith',
            job: 'Chief Technology Officer',
            location: 'London',
            tenure: 2,
            avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
            parentId: 'ceo',
        },
        {
            id: 'cfo',
            name: 'Carol Wu',
            job: 'Chief Financial Officer',
            location: 'London',
            tenure: 3,
            avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
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
            node: {
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
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
                    if (params.fromDatum.job === 'Chief Technology Officer' && params.toDatum.job === 'Developer') {
                        return { stroke: '#00994d' };
                    } else if (params.fromDatum.job === 'Chief Executive Officer') {
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
                    } else if (params.depth === 3) {
                        return { fill: '#c1d9e3' };
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

const FORMATTERS: AgChartOptions = {
    ...SIMPLE_ORG_CHART,
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                title: {
                    key: 'name',
                    formatter: ({ value }) => {
                        if (value === 'Bob Smith') {
                            return [{ text: 'Bob' }, { text: ' "John" ', fontStyle: 'italic' }, { text: 'Smith' }];
                        }
                    },
                },
                subtitle: {
                    key: 'job',
                    formatter: ({ value }) => {
                        if (value === 'Quality Assurance') {
                            return [
                                { text: 'Quality', color: 'red', fontSize: 14, fontWeight: 'bold' },
                                { text: ' Assurance', color: 'green', fontStyle: 'italic' },
                            ];
                        }
                    },
                },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

interface StandaloneTestCase extends ChartTestCase {
    options: AgStandaloneChartOptions;
}

function createTextImageExample(
    textAlign: TextAlign,
    imagePosition: AgOrganizationSeriesOptionsNodeImagePosition
): any {
    return {
        ...SIMPLE_ORG_CHART,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                node: {
                    image: { position: imagePosition, key: 'avatar' },
                    title: { key: 'name', textAlign },
                    subtitle: { key: 'job', textAlign },
                    labels: [{ key: 'location', textAlign }],
                },
            },
        ],
    };
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
    FORMATTERS: {
        options: FORMATTERS,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_CENTER_IMAGE_TOP: {
        options: createTextImageExample('center', 'top'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_RIGHT_IMAGE_RIGHT: {
        options: createTextImageExample('right', 'right'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_CENTER_IMAGE_RIGHT: {
        options: createTextImageExample('center', 'right'),
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

    describe('expand collapse', () => {
        describe('initialState', () => {
            it('should not show collapsed nodes', async () => {
                const options: AgChartOptions = {
                    ...SIMPLE_ORG_CHART,
                    initialState: {
                        collapsed: ['cto'],
                    },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        });

        describe('setState', () => {
            it('should collapse nodes', async () => {
                const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await chart.setState({ version: '13.3.0', collapsed: ['cto'] });

                await compare();
            });

            it('should expand nodes', async () => {
                const options: AgChartOptions = {
                    ...SIMPLE_ORG_CHART,
                    initialState: {
                        collapsed: ['cto'],
                    },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await chart.setState({ version: '13.3.0', collapsed: [] });

                await compare();
            });

            it('should collapse and expand multiple states', async () => {
                const options: AgChartOptions = {
                    ...SIMPLE_ORG_CHART,
                    initialState: {
                        collapsed: ['cfo'],
                    },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await chart.setState({ version: '13.3.0', collapsed: ['cfo', 'cto'] });
                await chart.setState({ version: '13.3.0', collapsed: ['cfo'] });

                await compare();
            });
        });
    });

    describe('layout', () => {
        it('should not overlap younger siblings over older siblings with no children', async () => {
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                data: [
                    { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', parentId: null },
                    { id: 'cto', name: 'Bob Smith', job: 'Chief Technology Officer', parentId: 'ceo' },
                    { id: 'cfo', name: 'Carol Wu', job: 'Chief Financial Officer', parentId: 'ceo' },
                    { id: 'acc', name: 'Frank Cash', job: 'Accountant', parentId: 'cfo' },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });
});
