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
    dragAction,
    extractImageData,
    hoverAction,
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

const segmentTitleFormatter = ({ value }: { value: any }) => {
    const parts = String(value).split(' ');
    return [
        { text: parts[0] + ' ', color: 'red' },
        { text: parts.slice(1).join(' '), color: 'blue' },
    ];
};

function createSegmentAlignmentExample(textAlign: TextAlign, mode: 'property' | 'itemStyler'): any {
    const align = mode === 'property' ? { textAlign } : { itemStyler: () => ({ textAlign }) };
    return {
        ...SIMPLE_ORG_CHART,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                node: {
                    title: { key: 'name', formatter: segmentTitleFormatter, ...align },
                    subtitle: { key: 'job', ...align },
                    labels: [{ key: 'location', ...align }],
                },
            },
        ],
    };
}

interface StandaloneTestCase extends ChartTestCase {
    options: AgStandaloneChartOptions;
}

function createExpanderHeightExample(height: number): any {
    return {
        ...SIMPLE_ORG_CHART,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                expander: { height },
                node: {
                    title: { key: 'name' },
                    subtitle: { key: 'job' },
                    labels: [{ key: 'location' }],
                },
            },
        ],
    };
}

function createExpanderSpacingExample(expanderHeight: number, expanderSpacing: number): any {
    return {
        ...SIMPLE_ORG_CHART,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                expander: { height: expanderHeight, spacing: expanderSpacing },
                node: {
                    title: { key: 'name' },
                    subtitle: { key: 'job' },
                    labels: [{ key: 'location' }],
                },
            },
        ],
    };
}

function createTextImageExample(
    textAlign: TextAlign,
    imagePosition: AgOrganizationSeriesOptionsNodeImagePosition,
    imageShape?: 'circle' | 'square'
): any {
    return {
        ...SIMPLE_ORG_CHART,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                node: {
                    image: {
                        position: imagePosition,
                        key: 'avatar',
                        ...(imageShape == null ? {} : { shape: imageShape }),
                    },
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
    IMAGE_CIRCLE_TOP: {
        // Verifies `shape: 'circle'` clips the image to a circle (width === height) when the
        // image sits above the text tiers.
        options: createTextImageExample('center', 'top', 'circle'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_BOTTOM: {
        options: createTextImageExample('left', 'bottom', 'circle'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_LEFT: {
        options: createTextImageExample('left', 'left', 'circle'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_RIGHT: {
        options: createTextImageExample('right', 'right', 'circle'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_LEFT_ALIGNED: {
        options: createSegmentAlignmentExample('left', 'property'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_RIGHT_ALIGNED: {
        options: createSegmentAlignmentExample('right', 'property'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_CENTER_ALIGNED: {
        options: createSegmentAlignmentExample('center', 'property'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_LEFT_ALIGNED_VIA_ITEM_STYLER: {
        options: createSegmentAlignmentExample('left', 'itemStyler'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_CENTER_ALIGNED_VIA_ITEM_STYLER: {
        options: createSegmentAlignmentExample('center', 'itemStyler'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_PER_DATUM_ALIGNMENT_VIA_ITEM_STYLER: {
        // Confirms cached per-datum styles aren't shared between OrganizationNodes:
        // each row gets a different alignment based on its job.
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        title: {
                            key: 'name',
                            itemStyler: ({ datum }: { datum: any }) => {
                                if (datum.job === 'Chief Executive Officer') return { textAlign: 'left' };
                                if (datum.job === 'Chief Technology Officer') return { textAlign: 'center' };
                                return { textAlign: 'right' };
                            },
                        },
                        subtitle: { key: 'job' },
                        labels: [{ key: 'location' }],
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    SEGMENT_TITLE_RIGHT_ALIGNED_VIA_ITEM_STYLER: {
        options: createSegmentAlignmentExample('right', 'itemStyler'),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_TIER_BACKING_BOX: {
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        title: {
                            key: 'name',
                            fill: '#fff1e5',
                            stroke: '#006f9b',
                            strokeWidth: 1,
                            cornerRadius: 4,
                            padding: 4,
                        },
                        subtitle: {
                            key: 'job',
                            fill: '#e0e8ff',
                            cornerRadius: 8,
                            padding: 6,
                        },
                        labels: [
                            {
                                key: 'location',
                                stroke: '#999',
                                strokeWidth: 1,
                                cornerRadius: 2,
                                padding: 2,
                            },
                        ],
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_TIER_BACKING_BOX_VIA_ITEM_STYLER: {
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        title: {
                            key: 'name',
                            itemStyler: ({ datum }: { datum: any }) =>
                                datum.job === 'Chief Executive Officer'
                                    ? { fill: '#ffd700', cornerRadius: 12, padding: 6 }
                                    : { fill: '#e0e8ff', cornerRadius: 4, padding: 4 },
                        },
                        subtitle: { key: 'job' },
                        labels: [{ key: 'location' }],
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    NODE_ITEM_STYLER_USES_IS_COLLAPSED: {
        // 'cto' is collapsed via initialState; node.itemStyler returns a distinct fill/stroke
        // when isCollapsed is true. Verifies the param is plumbed through and reflects the
        // current collapsed state per node.
        options: {
            ...SIMPLE_ORG_CHART,
            initialState: { collapsed: ['cto'] },
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        itemStyler: ({ isCollapsed }: { isCollapsed: boolean }) =>
                            isCollapsed
                                ? { fill: '#fff1e5', stroke: '#ff7faa', strokeWidth: 2, lineDash: [4, 2] }
                                : undefined,
                        title: { key: 'name' },
                        subtitle: { key: 'job' },
                        labels: [{ key: 'location' }],
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_TIER_ITEM_STYLER_USES_IS_COLLAPSED: {
        // Same setup but the styler lives on the title tier — confirms isCollapsed reaches
        // text-tier itemStyler params, not just node-level.
        options: {
            ...SIMPLE_ORG_CHART,
            initialState: { collapsed: ['cto'] },
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        title: {
                            key: 'name',
                            itemStyler: ({ isCollapsed }: { isCollapsed: boolean }) =>
                                isCollapsed ? { color: '#ff7faa', fontStyle: 'italic' } : undefined,
                        },
                        subtitle: { key: 'job' },
                        labels: [{ key: 'location' }],
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    EXPANDER_HEIGHT_SHORT: {
        // Layout reserves and renders the pill at exactly the configured height; verifies all
        // three `networkTreeLayout` consumers (link-draw start/elbow, child-group offset) shrink
        // in step so children sit closer to the parent without elbow misalignment.
        options: createExpanderHeightExample(16),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    EXPANDER_HEIGHT_TALL: {
        // Inverse of EXPANDER_HEIGHT_SHORT: a taller pill expands the parent–child gap and the
        // count text remains vertically centred against the rendered pill height (not a constant).
        options: createExpanderHeightExample(32),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    TEXT_TIER_BACKING_BOX_PARTIAL_OVERRIDE: {
        // property-level supplies stroke + cornerRadius + padding; itemStyler adds fill conditionally.
        // Verifies merge: defaults + property + itemStyler accumulate correctly per datum.
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: {
                        title: {
                            key: 'name',
                            stroke: '#006f9b',
                            strokeWidth: 1,
                            cornerRadius: 4,
                            padding: 4,
                            itemStyler: ({ datum }: { datum: any }) =>
                                datum.job === 'Chief Executive Officer' ? { fill: '#ffd700' } : undefined,
                        },
                        subtitle: { key: 'job' },
                        labels: [{ key: 'location' }],
                    },
                },
            ],
        } as any,
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

    describe('expander chevron', () => {
        it('should render a point-down chevron when a node is expanded', async () => {
            // Baseline: no initialState collapse — cto and cfo are expanded and their
            // expander pills should show a downward-pointing chevron.
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render a point-up chevron when a node is collapsed', async () => {
            // cto is collapsed via setState; its expander pill must switch to an
            // upward-pointing chevron to signal that clicking will expand.
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await chart.setState({ version: '13.3.0', collapsed: ['cto'] });
            await compare();
        });
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

            it('should re-evaluate isCollapsed-aware itemStylers across collapse/expand toggles', async () => {
                // Guards against the styler-cache returning stale `isCollapsed` after a
                // setState collapse/expand toggle. The styler flips fill based on
                // `isCollapsed`; if the cache key omitted that signal, the post-toggle
                // snapshot would carry over the pre-toggle styling.
                //
                // Snapshots after each setState so the test fails distinctively whether the
                // styler ignores `isCollapsed` (snap 1 wrong), or reads stale cache after
                // expand (snap 2 wrong).
                const options: AgChartOptions = {
                    ...SIMPLE_ORG_CHART,
                    series: [
                        {
                            type: 'organization',
                            idKey: 'id',
                            parentIdKey: 'parentId',
                            node: {
                                itemStyler: ({ isCollapsed }: { isCollapsed: boolean }) =>
                                    isCollapsed ? { fill: '#fff1e5', stroke: '#ff7faa', strokeWidth: 2 } : undefined,
                                title: { key: 'name' },
                                subtitle: { key: 'job' },
                                labels: [{ key: 'location' }],
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await chart.setState({ version: '13.3.0', collapsed: ['cto'] });
                await compare();
                await chart.setState({ version: '13.3.0', collapsed: [] });
                await compare();
            });
        });
    });

    describe('theme defaults', () => {
        it('should apply Figma-aligned theme defaults', async () => {
            // Guards the defaults pass: padding 8, spacing 4, image circle, verticalSpacing 52.
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should apply default highlight stroke when a node is hovered', async () => {
            // Regression test for AG-17192. Theme defaults add a stronger stroke and
            // strokeWidth on `highlight.highlightedItem`; without the default the highlighted
            // node would render identical to its neighbours.
            //
            // The chart overrides `node.cornerRadius` to 0 so the JSDOM mock canvas can
            // hit-test the node rect — `Rect.updatePath()` only installs a bbox-based
            // hit-tester for unrounded rects (per .claude/rules/testing.md).
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                theme: {
                    overrides: {
                        organization: { series: { node: { cornerRadius: 0 } } },
                    },
                },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Root card (Alice Chen) sits centred across the top of the 800x600 mock
            // canvas. Hover its approximate centre to trigger the highlight pipeline
            // through the public pointer-event path.
            await hoverAction(400, 65)(chart);
            await compare();
        });
    });

    describe('series-area clipping', () => {
        it('should clip dragged content to the series area so nodes do not bleed into the title', async () => {
            // Regression test for AG-17233. Chart has a title which shrinks the series-area
            // rect; a large upward drag would otherwise pull node cards into the title
            // region. With clipping, nodes are cropped at the series-area boundary instead.
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                title: { text: 'Organisation Chart', fontSize: 18 },
                subtitle: { text: 'Reporting structure' },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // 800x600 mock canvas. Drag upward from below the centre to above it —
            // far enough that without clipping the top row of cards would overlap the
            // chart title.
            await dragAction({ x: 400, y: 500 }, { x: 400, y: 100 })(chart);

            await compare();
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

        it('should use outerSpacing for cousin gaps and innerSpacing for sibling gaps', async () => {
            // 2-level tree: two parents (A, B) each with two leaf children (C/D and E/F).
            // With innerSpacing=20 and outerSpacing=40, the gap between D and E (cousins)
            // must be larger than the gap between C and D (siblings) or E and F (siblings).
            // The snapshot captures the layout; the test name documents the intent so a
            // regression is immediately identifiable.
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                data: [
                    { id: 'root', name: 'Root', job: 'Root', parentId: null },
                    { id: 'a', name: 'Parent A', job: 'Manager', parentId: 'root' },
                    { id: 'b', name: 'Parent B', job: 'Manager', parentId: 'root' },
                    { id: 'c', name: 'Child C', job: 'Report', parentId: 'a' },
                    { id: 'd', name: 'Child D', job: 'Report', parentId: 'a' },
                    { id: 'e', name: 'Child E', job: 'Report', parentId: 'b' },
                    { id: 'f', name: 'Child F', job: 'Report', parentId: 'b' },
                ],
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        innerSpacing: 20,
                        outerSpacing: 40,
                        node: { title: { key: 'name' }, subtitle: { key: 'job' } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should not overlap last label with expander pill at default spacing', async () => {
            // Regression for the overlap introduced by node.padding shrinking from 16 to 8.
            // With expander.height=24 and expander.spacing=4 the effective bottom padding
            // becomes max(8, 12+4)=16, giving 4 px clearance between the last label bottom
            // and the pill top.  The snapshot documents non-overlap.
            const options: AgChartOptions = createExpanderSpacingExample(24, 4) as AgChartOptions;
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should leave card layout unchanged when expander is short enough', async () => {
            // When height=8 and spacing=0 the Math.max computation yields max(8, 4+0)=8,
            // equal to node.padding — parent-card bottom padding is identical to that of a
            // leaf card, so no extra space is reserved.  Snapshot documents this invariance.
            const options: AgChartOptions = createExpanderSpacingExample(8, 0) as AgChartOptions;
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });
});
