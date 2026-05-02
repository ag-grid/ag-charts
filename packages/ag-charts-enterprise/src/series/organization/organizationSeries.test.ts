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
    deproxy,
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

/**
 * A chart whose laid-out content exceeds the 800x600 mock canvas in both axes. Used by tests
 * that need a "real" zoom-in scenario — with the `s ≤ 1` native-pixel cap, content that fits
 * inside the viewport cannot be zoomed past native, so SIMPLE_ORG_CHART is unusable for any
 * test that asserts non-fit zoom behaviour (pan-to-active, off-isotropic projection, etc.).
 *
 * Layout: a single chain of 7 levels under the CEO at the leftmost VP, plus 7 sibling VPs
 * to widen things out. Both `fitX` and `fitY` end up well below 1, so the projection logic's
 * `targetT * fit ≤ 1` constraint is exercised without saturating to `{0..1, 0..1}` on either axis.
 */
const OVERFLOWING_ORG_CHART: AgChartOptions = {
    data: (() => {
        const data: { id: string; name: string; job: string; location: string; parentId: string | null }[] = [
            { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        ];
        // 8 VPs as direct children of the CEO.
        for (let i = 0; i < 8; i++) {
            const vp = `vp-${i}`;
            data.push({ id: vp, name: `VP ${i}`, job: 'Vice President', location: 'London', parentId: 'ceo' });
            // Each VP has 8 team leads — wide horizontal fan-out to push fitX well below 1.
            for (let j = 0; j < 8; j++) {
                const leaf = `leaf-${i}-${j}`;
                data.push({ id: leaf, name: `Lead ${i}.${j}`, job: 'Team Lead', location: 'London', parentId: vp });
            }
        }
        // Add a tall chain hanging off `leaf-0-0` to push fitY well below 1 too.
        let parent = 'leaf-0-0';
        for (let k = 0; k < 6; k++) {
            const id = `chain-${k}`;
            data.push({ id, name: `Chain ${k}`, job: 'Senior Developer', location: 'London', parentId: parent });
            parent = id;
        }
        return data;
    })(),
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

    function getZoomRatios(c: any) {
        return c.getState()?.zoom as
            | { ratioX?: { start?: number; end?: number }; ratioY?: { start?: number; end?: number } }
            | undefined;
    }

    // The `setZoom` helper drives the ZoomManager directly to bypass the memento path's
    // theme-template projection (`keepAspectRatio`, `autoScaling`). These tests assert the
    // renderer / floor math at exact zoom states; theme projection would re-write the input
    // before the code under test sees it. For tests that exercise the full state-restore
    // pipeline, use `chart.setState({zoom: ...})` instead.
    function setZoom(c: any, xMin: number, xMax: number, yMin: number, yMax: number) {
        deproxy(c).ctx.zoomManager?.updateZoom(
            { source: 'state-change', sourceDetail: 'unspecified' },
            { x: { min: xMin, max: xMax }, y: { min: yMin, max: yMax } }
        );
    }

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
            //
            // Phase 3 (AG-17179) note: pan ownership has moved to the Zoom feature, which
            // skips panning when both axes are at full range {0,1}. Zoom in first via the
            // ZoomManager so the subsequent drag pans content. The clip-rect on the
            // series-area is what's being verified here, not the pan mechanism.
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                title: { text: 'Organisation Chart', fontSize: 18 },
                subtitle: { text: 'Reporting structure' },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            deproxy(chart).ctx.zoomManager?.updateZoom(
                { source: 'state-change', sourceDetail: 'unspecified' },
                { x: { min: 0.25, max: 0.75 }, y: { min: 0.25, max: 0.75 } }
            );
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

    describe('viewportGroup zoom transform', () => {
        it('should render 2× zoomed-in centred (x: 0.25–0.75, y: 0.25–0.75)', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.25, 0.75, 0.25, 0.75);
            await compare();
        });

        it('should render 2× zoomed-in top-right quadrant (x: 0.5–1.0, y: 0.5–1.0)', async () => {
            // Y is cartesian (y-up): yStart=0.5, yEnd=1 ⇒ top half of content visible.
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.5, 1, 0.5, 1);
            await compare();
        });
    });

    describe('pan-to-active (Phase 5)', () => {
        // OVERFLOWING_ORG_CHART is required: SIMPLE_ORG_CHART fits at native size so the
        // `s ≤ 1` cap snaps any sub-window back to fit and `panToBBox` is never called.
        it('should pan to active item after setState when the node is outside the zoom window', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // panToBBox is internal — spying directly is the only way to assert "was/wasn't called".
            const zoomManager = deproxy(chart).ctx.zoomManager;
            const panSpy = zoomManager ? jest.spyOn(zoomManager, 'panToBBox') : undefined;

            const seriesId = deproxy(chart).series[0].id;
            // `leaf-7-7` is rightmost-of-rightmost: off-screen for any left-anchored sub-window.
            await chart.setState({
                version: '13.3.0',
                zoom: { ratioX: { start: 0, end: 0.2 }, ratioY: { start: 0, end: 1 } },
                active: { activeItem: { type: 'series-node', seriesId, itemId: 'leaf-7-7' } },
            });
            await waitForChartStability(chart);

            expect(panSpy).toHaveBeenCalled();
            panSpy?.mockRestore();

            await compare();
        });

        it('should NOT pan when the active node is already within the zoom window', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const zoomManager = deproxy(chart).ctx.zoomManager;
            const panSpy = zoomManager ? jest.spyOn(zoomManager, 'panToBBox') : undefined;

            const seriesId = deproxy(chart).series[0].id;
            // `leaf-7-4` is on the rightmost slice — already visible.
            await chart.setState({
                version: '13.3.0',
                zoom: { ratioX: { start: 0.8, end: 1 }, ratioY: { start: 0, end: 1 } },
                active: { activeItem: { type: 'series-node', seriesId, itemId: 'leaf-7-4' } },
            });
            await waitForChartStability(chart);

            expect(panSpy).not.toHaveBeenCalled();
            panSpy?.mockRestore();
        });

        it('should NOT pan when active item changes via hover (user-interaction source)', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            setZoom(chart, 0.8, 1, 0, 1);
            await waitForChartStability(chart);

            // Spy after the initial zoom so we only observe pan calls caused by the hover.
            const zoomManager = deproxy(chart).ctx.zoomManager;
            const panSpy = zoomManager ? jest.spyOn(zoomManager, 'panToBBox') : undefined;
            const ratiosBefore = getZoomRatios(chart);

            // No public API simulates hover without firing `active:load-memento` (and JSDOM
            // canvas hit-testing is stubbed, so DOM-driven hover doesn't reach picking either).
            // `activeManager.update` is the canonical hover simulation — the test exists to
            // prove the source-gate works, so this internal call is unavoidable here.
            const seriesId = deproxy(chart).series[0].id;
            deproxy(chart).ctx.activeManager.update({ type: 'series-node', seriesId, itemId: 'leaf-7-4' }, undefined);
            await waitForChartStability(chart);

            expect(panSpy).not.toHaveBeenCalled();
            panSpy?.mockRestore();

            const ratiosAfter = getZoomRatios(chart);
            expect(ratiosAfter?.ratioX?.start).toBeCloseTo(ratiosBefore?.ratioX?.start ?? 0.8, 6);
            expect(ratiosAfter?.ratioX?.end).toBeCloseTo(ratiosBefore?.ratioX?.end ?? 1, 6);
            expect(ratiosAfter?.ratioY?.start).toBeCloseTo(ratiosBefore?.ratioY?.start ?? 0, 6);
            expect(ratiosAfter?.ratioY?.end).toBeCloseTo(ratiosBefore?.ratioY?.end ?? 1, 6);
        });
    });

    describe('aspect-ratio guard (Phase 4)', () => {
        it('should project off-isotropic zoom state onto the isotropic line', async () => {
            // OVERFLOWING_ORG_CHART has fitX ≠ fitY and both ≪ 1, so the projection is
            // observable without saturating to `{0..1, 0..1}`. The snapshot validates the
            // post-projection render — drift would change the visible content area.
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Off-isotropic request: x window 0.6 wide, y window 0.2 wide. Centred at 0.5,0.5.
            setZoom(chart, 0.2, 0.8, 0.4, 0.6);
            await waitForChartStability(chart);

            const imageData = extractImageData(ctx);
            expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });
});
