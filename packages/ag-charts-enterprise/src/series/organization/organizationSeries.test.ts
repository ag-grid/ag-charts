import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgChartOptions,
    AgOrganizationSeriesOptionsNodeImagePosition,
    AgStandaloneChartOptions,
    TextAlign,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartTestCase,
    type SceneGeometrySample,
    clickAction,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    doubleClickAction,
    dragAction,
    expectSceneSamplesMatch,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    standaloneChartAssertions,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Caster } from 'ag-charts-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { OrganizationNodeTag } from './organizationNode';
import { OrganizationSeries } from './organizationSeries';

const SIMPLE_ORG_CHART: AgChartOptions & { series: { type: 'organization' }[] } = {
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
            type: 'organization' as const,
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

const NUMERIC_ID_ORG_CHART: AgChartOptions = {
    data: [
        { id: 1, name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        { id: 2, name: 'Bob Smith', job: 'Chief Technology Officer', location: 'London', parentId: 1 },
        { id: 3, name: 'Carol Wu', job: 'Chief Financial Officer', location: 'London', parentId: 1 },
        { id: 4, name: 'Dave Jones', job: 'Developer', location: 'New York', parentId: 2 },
        { id: 5, name: 'Eve Park', job: 'Quality Assurance', location: 'London', parentId: 2 },
        { id: 6, name: 'Frank Cash', job: 'Accountant', location: 'London', parentId: 3 },
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
                    expander: {
                        text: {
                            showAllChildren: true,
                            showDirectChildren: true,
                        },
                    },
                },
            },
        },
    },
};

// Wide + tall layout that overflows the 800x600 mock canvas on both axes. Required for tests
// that exercise non-fit zoom behaviour — content that already fits is held at the native-pixel cap,
// so SIMPLE_ORG_CHART can't drive centre-on-active or off-isotropic input.
const OVERFLOWING_ORG_CHART: AgChartOptions = {
    data: (() => {
        const data: { id: string; name: string; job: string; location: string; parentId: string | null }[] = [
            { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        ];
        for (let i = 0; i < 8; i++) {
            const vp = `vp-${i}`;
            data.push({ id: vp, name: `VP ${i}`, job: 'Vice President', location: 'London', parentId: 'ceo' });
            for (let j = 0; j < 8; j++) {
                const leaf = `leaf-${i}-${j}`;
                data.push({ id: leaf, name: `Lead ${i}.${j}`, job: 'Team Lead', location: 'London', parentId: vp });
            }
        }
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

// Tall + narrow layout: contentBBox fits the canvas horizontally but overflows vertically.
// Used by the series-area clipping test so y-only zoom + vertical pan produces an unmistakable
// "card cut off at the title boundary" demonstration with readable cards.
const TALL_ORG_CHART: AgChartOptions = {
    data: (() => {
        const data: { id: string; name: string; job: string; location: string; parentId: string | null }[] = [
            { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        ];
        const branches = 3;
        const chainDepth = 12;
        for (let i = 0; i < branches; i++) {
            const vp = `vp-${i}`;
            data.push({ id: vp, name: `VP ${i}`, job: 'Vice President', location: 'London', parentId: 'ceo' });
            let parent: string = vp;
            for (let k = 0; k < chainDepth; k++) {
                const id = `chain-${i}-${k}`;
                data.push({
                    id,
                    name: `Lead ${i}.${k}`,
                    job: 'Senior Developer',
                    location: 'London',
                    parentId: parent,
                });
                parent = id;
            }
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

// Square-aspect overflow: contentBBox aspect ratio matches the 800×600 canvas so fitX ≈ fitY,
// AND content is densely distributed across both axes (not just one corner). Each leaf has its
// own chain hanging below, so the middle-x/middle-y region of contentBBox actually contains
// nodes — without that, zoom-centred snapshots land in blank whitespace.
//
// Both axes derive their window size from one shared scale, taken from the least-zoomed axis. If one
// axis overflows much more than the other (as in OVERFLOWING_ORG_CHART, which is very wide but only
// modestly tall), that axis dominates and the requested zoom on the other is widened to match. Tests
// asserting symmetric x/y zoom behaviour need fits that are comparable on both axes.
const SQUARE_OVERFLOW_ORG_CHART: AgChartOptions = {
    data: (() => {
        const data: { id: string; name: string; job: string; location: string; parentId: string | null }[] = [
            { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        ];
        const vpCount = 4;
        const leavesPerVp = 4;
        const chainDepth = 20;
        for (let i = 0; i < vpCount; i++) {
            const vp = `vp-${i}`;
            data.push({ id: vp, name: `VP ${i}`, job: 'Vice President', location: 'London', parentId: 'ceo' });
            for (let j = 0; j < leavesPerVp; j++) {
                const leaf = `leaf-${i}-${j}`;
                data.push({ id: leaf, name: `Lead ${i}.${j}`, job: 'Team Lead', location: 'London', parentId: vp });
                let parent: string = leaf;
                for (let k = 0; k < chainDepth; k++) {
                    const id = `chain-${i}-${j}-${k}`;
                    data.push({
                        id,
                        name: `${i}.${j}.${k}`,
                        job: 'Senior Developer',
                        location: 'London',
                        parentId: parent,
                    });
                    parent = id;
                }
            }
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

const TEAM_DIRECTORY_ORG_CHART: AgChartOptions = {
    data: [
        { id: 'Ashley Rivers', parentId: null, job: 'CEO', status: 'In Office' },
        { id: 'Joseph Howe', parentId: 'Ashley Rivers', job: 'CTO', status: 'Hybrid' },
        { id: 'Jeffrey Brown', parentId: 'Joseph Howe', job: 'Engineering Lead', status: 'In Office' },
        { id: 'Melissa Vazquez', parentId: 'Jeffrey Brown', job: 'Software Engineer', status: 'Hybrid' },
        { id: 'John Thomas', parentId: 'Jeffrey Brown', job: 'Software Engineer', status: 'Hybrid' },
        { id: 'Susan Hernandez', parentId: 'Jeffrey Brown', job: 'Dev Ops', status: 'In Office' },
        { id: 'Aisha Khan', parentId: 'Jeffrey Brown', job: 'Software Engineer', status: 'Remote' },
        { id: 'Justin Contreras', parentId: 'Joseph Howe', job: 'Engineering Lead', status: 'In Office' },
        { id: 'Rachel Ibarra', parentId: 'Justin Contreras', job: 'Software Engineer', status: 'Remote' },
        { id: 'John Gomez', parentId: 'Justin Contreras', job: 'Software Engineer', status: 'In Office' },
        { id: 'Sam Carter', parentId: 'Justin Contreras', job: 'QA Engineer', status: 'Hybrid' },
        { id: 'Priya Nair', parentId: 'Joseph Howe', job: 'Data Lead', status: 'In Office' },
        { id: 'Lena Fischer', parentId: 'Priya Nair', job: 'Data Scientist', status: 'Remote' },
        { id: 'Mark Daniels', parentId: 'Priya Nair', job: 'Data Engineer', status: 'Hybrid' },
        { id: 'Gary Garcia', parentId: 'Ashley Rivers', job: 'CPO', status: 'In Office' },
        { id: 'Lawrence Martinez', parentId: 'Gary Garcia', job: 'Product Manager', status: 'Hybrid' },
        { id: 'Tom Whitfield', parentId: 'Lawrence Martinez', job: 'Product Analyst', status: 'In Office' },
        { id: 'Olivia Bennett', parentId: 'Lawrence Martinez', job: 'UX Researcher', status: 'Hybrid' },
        { id: 'Devin Pittman', parentId: 'Gary Garcia', job: 'Design Lead', status: 'In Office' },
        { id: 'Emily Barajas', parentId: 'Devin Pittman', job: 'Visual Designer', status: 'Hybrid' },
        { id: 'Noah Kim', parentId: 'Devin Pittman', job: 'Product Designer', status: 'Remote' },
        { id: 'Eric Jensen', parentId: 'Ashley Rivers', job: 'CFO/COO', status: 'Remote' },
        { id: 'Hannah Lee', parentId: 'Eric Jensen', job: 'Finance Manager', status: 'In Office' },
        { id: 'Carlos Mendez', parentId: 'Hannah Lee', job: 'Accountant', status: 'Hybrid' },
        { id: 'Grace Liu', parentId: 'Hannah Lee', job: 'Financial Analyst', status: 'Remote' },
        { id: 'Cynthia Frank', parentId: 'Eric Jensen', job: 'Operations Manager', status: 'In Office' },
        { id: 'Sofia Russo', parentId: 'Cynthia Frank', job: 'Operations Coordinator', status: 'Hybrid' },
    ],
    initialState: {
        collapsed: [
            'Jeffrey Brown',
            'Justin Contreras',
            'Priya Nair',
            'Lawrence Martinez',
            'Devin Pittman',
            'Hannah Lee',
            'Cynthia Frank',
        ],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                title: { key: 'id' },
                subtitle: { key: 'job' },
                labels: [{ key: 'status' }],
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
            expander: {
                text: {
                    formatter: ({ allChildren, directChildren }) => {
                        return `${allChildren} (${directChildren})`;
                    },
                },
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

function createTextImageExample(
    textAlign: TextAlign,
    imagePosition: AgOrganizationSeriesOptionsNodeImagePosition,
    imageCornerRadius?: number
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
                        ...(imageCornerRadius == null ? {} : { cornerRadius: imageCornerRadius }),
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
    SIMPLE_ORG_CHART_RTL: {
        options: { ...SIMPLE_ORG_CHART, enableRtl: true },
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
        options: createTextImageExample('center', 'top', 20),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_BOTTOM: {
        options: createTextImageExample('left', 'bottom', 20),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_LEFT: {
        options: createTextImageExample('left', 'left', 20),
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    IMAGE_CIRCLE_RIGHT: {
        options: createTextImageExample('right', 'right', 20),
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
    TEXT_TIER_BACKING_BOX_LARGE_PADDING: {
        // Regression for AG-17193 pt2: with sizable padding (>>0) the text-box layout
        // must reserve the full padded bounds so siblings don't overlap each other or
        // the card edges. Mirrors the QA repro at plnkr.co/edit/64pDpFemUqydBOhJ.
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
                            fill: 'dodgerblue',
                            fillOpacity: 0.15,
                            stroke: 'dodgerblue',
                            strokeWidth: 1,
                            strokeOpacity: 0.8,
                            cornerRadius: 6,
                            padding: 20,
                            fontWeight: 'bold',
                        },
                        subtitle: {
                            key: 'job',
                            fill: 'seagreen',
                            fillOpacity: 0.12,
                            stroke: 'seagreen',
                            strokeWidth: 1,
                            strokeOpacity: 0.6,
                            cornerRadius: 4,
                            padding: 20,
                        },
                        labels: [
                            {
                                key: 'location',
                                fill: 'tomato',
                                fillOpacity: 0.18,
                                stroke: 'tomato',
                                strokeWidth: 1,
                                strokeOpacity: 0.7,
                                cornerRadius: 8,
                                padding: 30,
                                fontSize: 11,
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
    NODE_TEXT_FORMATTER_USES_IS_COLLAPSED: {
        // Title/subtitle/label formatters receive `isCollapsed` and can append a marker —
        // verifies the param reaches the formatter callback for all three text tiers.
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
                            formatter: ({ isCollapsed, value }: { isCollapsed: boolean; value: string }) =>
                                isCollapsed ? `${value} (collapsed)` : value,
                        },
                        subtitle: {
                            key: 'job',
                            formatter: ({ isCollapsed, value }: { isCollapsed: boolean; value: string }) =>
                                isCollapsed ? `${value} +` : value,
                        },
                        labels: [
                            {
                                key: 'location',
                                formatter: ({ isCollapsed, value }: { isCollapsed: boolean; value: string }) =>
                                    isCollapsed ? `${value} *` : value,
                            },
                        ],
                    },
                },
            ],
        } as any,
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
    DIRECTION_HORIZONTAL: {
        options: {
            ...SIMPLE_ORG_CHART,
            theme: { overrides: { organization: { series: { direction: 'horizontal' } } } },
        },
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    EXPANDER_ALL_AND_DIRECT_CHILDREN: {
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    ...SIMPLE_ORG_CHART.series[0],
                    expander: {
                        text: {
                            showDirectChildren: true,
                            showAllChildren: true,
                        },
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    EXPANDER_NO_CHILDREN: {
        options: {
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    ...SIMPLE_ORG_CHART.series[0],
                    expander: {
                        text: {
                            showDirectChildren: false,
                            showAllChildren: false,
                        },
                    },
                },
            ],
        } as any,
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    DIRECTION_HORIZONTAL_IMAGE_TOP: {
        options: {
            ...createTextImageExample('center', 'top'),
            theme: { overrides: { organization: { series: { direction: 'horizontal' } } } },
        },
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    DIRECTION_HORIZONTAL_IMAGE_RIGHT: {
        options: {
            ...createTextImageExample('left', 'right'),
            theme: { overrides: { organization: { series: { direction: 'horizontal' } } } },
        },
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    DIRECTION_HORIZONTAL_REVERSE: {
        options: {
            ...SIMPLE_ORG_CHART,
            theme: { overrides: { organization: { series: { direction: 'horizontal', reverse: true } } } },
        },
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
    DIRECTION_VERTICAL_REVERSE: {
        options: {
            ...SIMPLE_ORG_CHART,
            theme: { overrides: { organization: { series: { direction: 'vertical', reverse: true } } } },
        },
        assertions: standaloneChartAssertions({ seriesTypes: ['organization'] }),
    },
};

describe('OrganizationSeries', () => {
    setupMockConsole();
    let chart: any;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    function getZoomRatios(c: any) {
        return c.getState()?.zoom as
            | { ratioX?: { start?: number; end?: number }; ratioY?: { start?: number; end?: number } }
            | undefined;
    }

    // Drives ZoomManager directly to bypass the memento path's theme-template projection
    // (`keepAspectRatio`, `autoScaling`) — tests below assert exact zoom states. Use
    // `chart.setState({zoom: ...})` to exercise the full state-restore pipeline.
    function setZoom(c: any, xMin: number, xMax: number, yMin: number, yMax: number) {
        deproxy(c).ctx.zoomManager?.updateZoom(
            { source: 'state-change', sourceDetail: 'unspecified' },
            { x: { min: xMin, max: xMax }, y: { min: yMin, max: yMax } }
        );
    }

    type Node<T = unknown> = _ModuleSupport.Node<T>;

    /** Every descendant of `node` (including itself) tagged `searchTag`, in DFS/paint order. */
    function findAllDescendantsByTag(node: Node, searchTag: number): Node[] {
        const found: Node[] = node.tag === searchTag ? [node] : [];
        if (node instanceof _ModuleSupport.Group) {
            for (const child of node.children()) {
                found.push(...findAllDescendantsByTag(child, searchTag));
            }
        }
        return found;
    }

    function findCardNode(itemId: string): Node {
        const nodes = new Caster(deproxy(chart).series[0])
            .cast(OrganizationSeries)
            .accessProperty('datumSelection')
            .cast(_ModuleSupport.Selection)
            .value.nodes();
        const card = nodes.find((node: Node<any>) => node.datum?.itemId === itemId);
        expect(card).toBeDefined();
        return card!;
    }

    /** The first scene node tagged `tag` within the card for `itemId` (the expander's own pill `Rect`). */
    function findTaggedNode(itemId: string, tag: OrganizationNodeTag): Node {
        const target = findAllDescendantsByTag(findCardNode(itemId), tag)[0];
        expect(target).toBeDefined();
        return target;
    }

    /** Canvas-space centre of the scene node tagged `tag` within the card for `itemId`. */
    function centreOf(itemId: string, tag: OrganizationNodeTag): { x: number; y: number } {
        return _ModuleSupport.Transformable.toCanvas(findTaggedNode(itemId, tag)).computeCenter();
    }

    async function clickItem(itemId: string, tag: OrganizationNodeTag, opts?: { ctrlKey: boolean }): Promise<void> {
        const expander = centreOf(itemId, tag);
        await clickAction(expander.x, expander.y, opts)(chart);
        await waitForChartStability(chart);
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

    describe('node.itemStyler dimension params', () => {
        const createWithNodeStyler = (node: Record<string, unknown>) => {
            const captured: any[] = [];
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                            ...node,
                            itemStyler: (params: any) => {
                                captured.push(params);
                                return undefined;
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            return { options, captured };
        };

        it('AG-17992 passes undefined, not NaN/Infinity, for unconstrained width/height/maxWidth/maxHeight', async () => {
            const { options, captured } = createWithNodeStyler({});

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(captured.length).toBeGreaterThan(0);
            for (const params of captured) {
                expect(params.width).toBeUndefined();
                expect(params.height).toBeUndefined();
                expect(params.maxWidth).toBeUndefined();
                expect(params.maxHeight).toBeUndefined();
            }
        });

        it('AG-17992 reflects configured width/maxHeight and leaves the unset dimensions undefined', async () => {
            const { options, captured } = createWithNodeStyler({ width: 200, maxHeight: 150 });

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(captured.length).toBeGreaterThan(0);
            for (const params of captured) {
                expect(params.width).toBe(200);
                expect(params.maxHeight).toBe(150);
                expect(params.height).toBeUndefined();
                expect(params.maxWidth).toBeUndefined();
            }
        });
    });

    describe('expander chevron', () => {
        it('should render a point-down chevron when a node is expanded', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render a point-up chevron when a node is collapsed', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await chart.setState({ version: '13.3.0', collapsed: ['cto'] });
            await compare();
        });
    });

    describe('numeric ids', () => {
        const renderedItemIds = (c: any): number[] => {
            const ids: number[] = [];
            (deproxy(c).series[0] as any).datumSelection.each((_node: any, datum: any) => {
                if (!datum.collapsedByAncestor) {
                    ids.push(datum.itemId);
                }
            });
            return ids.sort((a, b) => a - b);
        };

        it('should accept a numeric id in initialState.collapsed and collapse that node', async () => {
            const options: AgChartOptions = {
                ...NUMERIC_ID_ORG_CHART,
                initialState: { collapsed: [2] },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Node 2 (Bob) is collapsed, so its children (4, 5) are not rendered. setupMockConsole's
            // afterEach fails the test on any console warning, covering the string-array validator warning.
            expect(renderedItemIds(chart)).toEqual([1, 2, 3, 6]);
        });

        it('should round-trip a numeric collapsed id through setState', async () => {
            const options: AgChartOptions = { ...NUMERIC_ID_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await chart.setState({ version: '13.3.0', collapsed: [2] });
            await waitForChartStability(chart);
            expect(renderedItemIds(chart)).toEqual([1, 2, 3, 6]);

            await chart.setState({ version: '13.3.0', collapsed: [] });
            await waitForChartStability(chart);
            expect(renderedItemIds(chart)).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it('should toggle a numeric-id node via collapseItem then expandItem', async () => {
            const options: AgChartOptions = { ...NUMERIC_ID_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const { collapsedManager } = series.ctx;

            series.collapseItem(2);
            expect(collapsedManager.isCollapsed(2)).toBe(true);

            // Expand must target node 2 by id, not misread the numeric id as a datumSelection index.
            series.expandItem(2);
            expect(collapsedManager.isCollapsed(2)).toBe(false);
        });

        it('should resolve a numeric id to the matching node, not a positional index', async () => {
            const options: AgChartOptions = { ...NUMERIC_ID_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const node = series.findNodeDatum(2);
            expect(node?.itemId).toBe(2);
            expect(node?.datum?.name).toBe('Bob Smith');
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

            it('should not leak labels onto sparse-tier nodes after collapse reuses scene nodes', async () => {
                // AG-17246 regression: collapsing nodes forces Selection reuse; a scene node
                // whose previous datum had labels retains that text unless trailing nodes are trimmed.
                const options: AgChartOptions = {
                    data: [
                        { id: 'henry7', name: 'Henry VII', reign: 'King 1485 - 1509', parentId: null },
                        { id: 'henry8', name: 'Henry VIII', reign: 'King 1509 - 1547', parentId: 'henry7' },
                        { id: 'margaret', name: 'Margaret Tudor', reign: 'Queen of Scots', parentId: 'henry7' },
                        { id: 'mary1', name: 'Mary I', reign: 'Queen 1553 - 1558', parentId: 'henry8' },
                        { id: 'elizabeth1', name: 'Elizabeth I', reign: 'Queen 1558 - 1603', parentId: 'henry8' },
                        { id: 'frances', name: 'Frances Brandon', parentId: 'margaret' },
                        { id: 'jane', name: 'Lady Jane Grey', parentId: 'frances' },
                    ],
                    series: [
                        {
                            type: 'organization',
                            idKey: 'id',
                            parentIdKey: 'parentId',
                            node: {
                                title: { key: 'name' },
                                labels: [{ key: 'reign' }],
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await chart.setState({ version: '13.3.0', collapsed: ['henry8'] });
                await waitForChartStability(chart);

                // Assert rendered labels match each node's source datum (pinpoints the mismatch
                // more precisely than a snapshot).
                const series = deproxy(chart).series[0] as any;
                const expectedReign: Record<string, string | undefined> = {
                    henry7: 'King 1485 - 1509',
                    henry8: 'King 1509 - 1547',
                    margaret: 'Queen of Scots',
                    frances: undefined,
                    jane: undefined,
                };
                const collapsedNodeIds = series.datumSelection
                    .nodes()
                    .filter((node: any) => node.datum.collapsedByAncestor)
                    .map((node: any) => node.datum.itemId);
                expect(collapsedNodeIds).toEqual(['mary1', 'elizabeth1']);
                series.datumSelection.each((node: any, datum: any) => {
                    if (datum.collapsedByAncestor) return;
                    const renderedTexts: string[] = (node.labelNodes ?? [])
                        .filter((n: any) => n != null)
                        .map((n: any) => n.text);
                    const expected = expectedReign[datum.itemId];
                    if (expected === undefined) {
                        expect(renderedTexts).toEqual([]);
                    } else {
                        expect(renderedTexts).toEqual([expected]);
                    }
                });
            });

            it('AG-17250 should keep node bbox stable across repeated programmatic toggles', async () => {
                // Card height must not grow on each expand/collapse cycle.
                const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                const series = deproxy(chart).series[0] as any;
                const captureBBoxes = () => {
                    const bboxes: { itemId: string; width: number; height: number }[] = [];
                    series.datumSelection.each((node: any, datum: any) => {
                        const card = node.getShapeBBox();
                        if (card) {
                            bboxes.push({ itemId: datum.itemId, width: card.width, height: card.height });
                        }
                    });
                    return bboxes;
                };

                const initial = captureBBoxes();
                expect(initial.length).toBeGreaterThan(0);

                for (let i = 0; i < 3; i++) {
                    await chart.setState({ version: '13.3.0', collapsed: ['cto'] });
                    await waitForChartStability(chart);
                    await chart.setState({ version: '13.3.0', collapsed: [] });
                    await waitForChartStability(chart);
                }

                expect(captureBBoxes()).toEqual(initial);
            });

            it('should respect text-tier itemStyler `enabled: false` (AG-17243)', async () => {
                // Auto-enable must not overwrite a styler's `enabled: false`.
                const options: AgChartOptions = {
                    ...SIMPLE_ORG_CHART,
                    initialState: { collapsed: ['cto'] },
                    series: [
                        {
                            type: 'organization',
                            idKey: 'id',
                            parentIdKey: 'parentId',
                            node: {
                                title: { key: 'name' },
                                subtitle: {
                                    key: 'job',
                                    itemStyler: ({ isCollapsed }: { isCollapsed: boolean }) =>
                                        isCollapsed ? { enabled: false } : undefined,
                                },
                                labels: [
                                    {
                                        key: 'location',
                                        itemStyler: ({ isCollapsed }: { isCollapsed: boolean }) =>
                                            isCollapsed ? { enabled: false } : undefined,
                                    },
                                ],
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);
                chart = AgCharts.create(options);
                await compare();
            });

            it('should re-evaluate isCollapsed-aware itemStylers across collapse/expand toggles', async () => {
                // The styler flips fill on `isCollapsed`; snapshotting after each toggle
                // catches a stale-cache regression where `isCollapsed` is omitted from the key.
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

        const linkVisibility = (c: any): Record<string, boolean> => {
            const out: Record<string, boolean> = {};
            (deproxy(c).series[0] as any).linkSelection.each((node: any, datum: any) => {
                out[`${String(datum.from.value)}->${String(datum.to.value)}`] = node.visible;
            });
            return out;
        };

        it('resolves a link parent by node-selection index, not data order, when collapsing', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series: any = deproxy(chart).series[0];
            const nodeData = series.contextNodeData.nodeData;
            const cfoVertex = series.graph.findVertexById('cfo');

            // Node-selection order and graph datumIndex only diverge when render order differs from data
            // order; pin the divergence so a reordered fixture fails loudly instead of silently passing.
            expect(nodeData.map((d: any) => d.itemId)).toEqual(['ceo', 'cto', 'dev', 'qa', 'cfo', 'acc']);
            expect(series.getNodeDatumIndex(cfoVertex)).toBe(4);
            expect(series.graph.findNeighbourValue(cfoVertex, 'datumIndex')).toBe(2);
            expect(nodeData[2].itemId).toBe('dev');

            expect(linkVisibility(chart)).toEqual({
                'root->ceo': true,
                'ceo->cto': true,
                'cto->dev': true,
                'cto->qa': true,
                'ceo->cfo': true,
                'cfo->acc': true,
            });

            await clickItem('cfo', OrganizationNodeTag.Expander);

            expect(linkVisibility(chart)).toEqual({
                'root->ceo': true,
                'ceo->cto': true,
                'cto->dev': true,
                'cto->qa': true,
                'ceo->cfo': true,
                'cfo->acc': false,
            });
        });

        it('does not hide a link whose parent is uncollapsed but shares a graph datumIndex with a collapsed node', async () => {
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                data: [
                    ...new Caster(SIMPLE_ORG_CHART.data).assertNonNullish().value,
                    { id: 'intern', name: 'Grace Lee', job: 'Intern', location: 'London', parentId: 'dev' },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series: any = deproxy(chart).series[0];
            expect(series.contextNodeData.nodeData.map((d: any) => d.itemId)).toEqual([
                'ceo',
                'cto',
                'dev',
                'intern',
                'qa',
                'cfo',
                'acc',
            ]);

            await clickItem('dev', OrganizationNodeTag.Expander);

            expect(linkVisibility(chart)).toEqual({
                'root->ceo': true,
                'ceo->cto': true,
                'ceo->cfo': true,
                'cto->dev': true,
                'cto->qa': true,
                'dev->intern': false,
                'cfo->acc': true,
            });
        });
    });

    describe('theme defaults', () => {
        it('should apply default highlight stroke when a node is hovered', async () => {
            // AG-17192 regression. cornerRadius=0 lets JSDOM bbox-hit-test the rect (see
            // .claude/rules/testing.md); without the theme stroke default the hovered node
            // would render identical to its neighbours.
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

            // Root card centre on the 800x600 mock canvas (card spans ~x=357-523, ~y=112-202).
            await hoverAction(440, 155)(chart);
            await compare();
        });
    });

    describe('expander hoverStyle', () => {
        // node.cornerRadius=0 makes both the card and pill Rects bbox-hittable in JSDOM (see
        // .claude/rules/testing.md); expander.cornerRadius defaults to `../node/cornerRadius`.
        const buildOptions = (
            expanderOverrides?: Record<string, unknown>,
            nodeOverrides: Record<string, unknown> = {}
        ): AgChartOptions => ({
            ...SIMPLE_ORG_CHART,
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: { title: { key: 'name' }, subtitle: { key: 'job' }, cornerRadius: 0, ...nodeOverrides },
                    ...(expanderOverrides ? { expander: expanderOverrides } : {}),
                },
            ],
        });

        /** The expander pill's own `Rect` scene node for the card belonging to `itemId`. */
        function expanderShapeNode(itemId: string): _ModuleSupport.Rect {
            return new Caster(findTaggedNode(itemId, OrganizationNodeTag.Expander)).cast(_ModuleSupport.Rect).value;
        }

        /** The expander's child-count `Text` node — also tagged Expander, alongside the pill `Rect`. */
        function expanderCountTextNode(itemId: string): _ModuleSupport.Text {
            const candidates = findAllDescendantsByTag(findCardNode(itemId), OrganizationNodeTag.Expander);
            const textNode = candidates.find((node) => node instanceof _ModuleSupport.Text);
            expect(textNode).toBeDefined();
            return new Caster(textNode).cast(_ModuleSupport.Text).value;
        }

        async function hoverItem(itemId: string, tag: OrganizationNodeTag): Promise<void> {
            const { x, y } = centreOf(itemId, tag);
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);
        }

        it('applies the configured hoverStyle fill/stroke to the expander pill while hovered', async () => {
            const options = buildOptions({ hoverStyle: { fill: '#ff00ff', stroke: '#00ffff' } });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhovered = expanderShapeNode('cfo');
            const unhoveredFill = unhovered.fill;
            const unhoveredStroke = unhovered.stroke;
            const unhoveredStrokeWidth = unhovered.strokeWidth;

            await hoverItem('cfo', OrganizationNodeTag.Expander);

            const hovered = expanderShapeNode('cfo');
            expect(hovered.fill).toBe('#ff00ff');
            expect(hovered.stroke).toBe('#00ffff');
            expect(hovered.fill).not.toBe(unhoveredFill);
            expect(hovered.stroke).not.toBe(unhoveredStroke);
            // Properties hoverStyle doesn't override must survive unchanged, not fall through to a
            // scene-node default (e.g. `strokeWidth ?? 0`).
            expect(hovered.strokeWidth).toBe(unhoveredStrokeWidth);
        });

        it('leaves the expander pill at its un-hovered style when the card, not the pill, is hovered', async () => {
            const options = buildOptions({ hoverStyle: { fill: '#ff00ff', stroke: '#00ffff' } });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhovered = expanderShapeNode('cfo');
            const unhoveredFill = unhovered.fill;
            const unhoveredStroke = unhovered.stroke;

            await hoverItem('cfo', OrganizationNodeTag.Card);

            const afterCardHover = expanderShapeNode('cfo');
            expect(afterCardHover.fill).toBe(unhoveredFill);
            expect(afterCardHover.stroke).toBe(unhoveredStroke);
            expect(afterCardHover.fill).not.toBe('#ff00ff');
        });

        it('applies hoverStyle to the expander pill independently of node.clickToExpand', async () => {
            const options = buildOptions(
                { hoverStyle: { fill: '#ff00ff', stroke: '#00ffff' } },
                { clickToExpand: true }
            );
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhovered = expanderShapeNode('cfo');
            const unhoveredFill = unhovered.fill;
            const unhoveredStroke = unhovered.stroke;

            await hoverItem('cfo', OrganizationNodeTag.Expander);

            const hovered = expanderShapeNode('cfo');
            expect(hovered.fill).toBe('#ff00ff');
            expect(hovered.stroke).toBe('#00ffff');
            expect(hovered.fill).not.toBe(unhoveredFill);
            expect(hovered.stroke).not.toBe(unhoveredStroke);
        });

        it('applies hoverStyle over itemStyler output while hovered, reverting once the pointer moves off the pill', async () => {
            const options = buildOptions({
                itemStyler: ({ datum }: { datum: any }) =>
                    datum.job === 'Chief Financial Officer' ? { fill: '#123456' } : undefined,
                hoverStyle: { fill: '#ff00ff' },
            });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(expanderShapeNode('cfo').fill).toBe('#123456');

            await hoverItem('cfo', OrganizationNodeTag.Expander);
            expect(expanderShapeNode('cfo').fill).toBe('#ff00ff');

            await hoverItem('cfo', OrganizationNodeTag.Card);
            expect(expanderShapeNode('cfo').fill).toBe('#123456');
        });

        it('resolves a real, distinct default hover fill for the expander pill when no hoverStyle is configured', async () => {
            const options = buildOptions();
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhoveredFill = expanderShapeNode('cfo').fill;
            expect(typeof unhoveredFill).toBe('string');

            await hoverItem('cfo', OrganizationNodeTag.Expander);

            const hoveredFill = expanderShapeNode('cfo').fill;
            expect(typeof hoveredFill).toBe('string');
            expect(hoveredFill).not.toBe(unhoveredFill);
        });

        it('requests exactly one series update for a card-to-pill move, and none for a repeat hover at the same point', async () => {
            const options = buildOptions({ hoverStyle: { fill: '#ff00ff' } });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const cardCentre = centreOf('cfo', OrganizationNodeTag.Card);
            const pillCentre = centreOf('cfo', OrganizationNodeTag.Expander);

            await hoverAction(cardCentre.x, cardCentre.y)(chart);
            await waitForChartStability(chart);

            const emitSpy = vi.spyOn(deproxy(chart).ctx.eventsHub, 'emit');
            const requestUpdateCount = () =>
                emitSpy.mock.calls.filter(([event]) => event === 'chart:request-update').length;

            await hoverAction(pillCentre.x, pillCentre.y)(chart);
            await waitForChartStability(chart);
            expect(requestUpdateCount()).toBe(1);

            emitSpy.mockClear();
            await hoverAction(pillCentre.x, pillCentre.y)(chart);
            await waitForChartStability(chart);
            expect(requestUpdateCount()).toBe(0);

            emitSpy.mockRestore();
        });

        it('applies hoverStyle text.color/fontWeight to the expander count text while hovered, reverting once unhovered', async () => {
            const options = buildOptions({ hoverStyle: { text: { color: '#334455', fontWeight: 'bold' } } });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhovered = expanderCountTextNode('cfo');
            const unhoveredColor = unhovered.fill;
            const unhoveredFontWeight = unhovered.fontWeight;
            const unhoveredFontSize = unhovered.fontSize;

            await hoverItem('cfo', OrganizationNodeTag.Expander);

            const hovered = expanderCountTextNode('cfo');
            expect(hovered.fill).toBe('#334455');
            expect(hovered.fontWeight).toBe('bold');
            expect(hovered.fill).not.toBe(unhoveredColor);
            expect(hovered.fontWeight).not.toBe(unhoveredFontWeight);
            // hoverStyle.text has no fontSize, so it must fall through untouched.
            expect(hovered.fontSize).toBe(unhoveredFontSize);

            await hoverItem('cfo', OrganizationNodeTag.Card);

            const afterUnhover = expanderCountTextNode('cfo');
            expect(afterUnhover.fill).toBe(unhoveredColor);
            expect(afterUnhover.fontWeight).toBe(unhoveredFontWeight);
        });

        it('reverts the expander pill hover style once the pointer leaves the series area entirely', async () => {
            const options = buildOptions({ hoverStyle: { fill: '#ff00ff', stroke: '#00ffff' } });
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const unhoveredFill = expanderShapeNode('cfo').fill;
            const unhoveredStroke = expanderShapeNode('cfo').stroke;

            await hoverItem('cfo', OrganizationNodeTag.Expander);
            expect(expanderShapeNode('cfo').fill).toBe('#ff00ff');
            expect(expanderShapeNode('cfo').stroke).toBe('#00ffff');

            // (2, 2) must stay outside the series rect (default chart padding is 20px) for the
            // leave below to be a real mouseleave rather than another move-off-pill.
            const seriesRect = new Caster(deproxy(chart))
                .accessProperty('seriesAreaManager')
                .accessProperty('seriesRect')
                .cast(_ModuleSupport.BBox).value;
            expect(seriesRect.containsPoint(2, 2)).toBe(false);

            // Outside the series rect, so the bubble chain drops the series-area element and a real
            // 'mouseleave' fires on it. The clear is debounced by `highlightManager.unhighlightDelay`
            // (100ms), so advance real time past it.
            await hoverAction(2, 2)(chart);
            await waitForChartStability(chart, deproxy(chart).ctx.highlightManager.unhighlightDelay + 50);

            expect(expanderShapeNode('cfo').fill).toBe(unhoveredFill);
            expect(expanderShapeNode('cfo').stroke).toBe(unhoveredStroke);
        });
    });

    describe('node labels', () => {
        it('should render when a labels-array entry has `enabled: false` (AG-17252)', async () => {
            // A disabled label entry must be skipped silently, not crash `dataModel`.
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location', enabled: false }, { key: 'tenure' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('series-area clipping', () => {
        it('should clip dragged content to the series area so nodes do not bleed into the title', async () => {
            // AG-17233 regression. TALL_ORG_CHART fits the canvas horizontally but overflows
            // vertically, so zooming in and dragging upward lands an upper card directly on the
            // series-area top boundary. The clip-rect must cut the card off at that boundary instead
            // of letting it bleed into the title above. Both axes share one scale, so the window is
            // narrowed on x as well as y.
            const options: AgChartOptions = {
                ...TALL_ORG_CHART,
                title: { text: 'Organisation Chart', fontSize: 18 },
                subtitle: { text: 'Reporting structure' },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.4, 0.6, 0.41, 0.61);
            await waitForChartStability(chart);

            // Drag content up far enough that an upper card straddles the title boundary —
            // the clip-rect must cut it at the series-area top instead of letting it bleed
            // into the title. AG-17233's bug was a missing clip-rect during pan.
            await dragAction({ x: 400, y: 580 }, { x: 400, y: 50 })(chart);

            await compare();
        });
    });

    describe('drag-to-select hit-testing', () => {
        it('should hit-test against the card only, excluding the expander pill overhang', async () => {
            // Default direction ('vertical' → 'down') puts the expander pill at the bottom of each
            // parent card, overhanging below it. A drag-rect touching only that overhang must not
            // pick the node; only overlap with the card itself counts.
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;

            // A parent node has an expander, so its full bbox overhangs its card (shape) bbox.
            let target: { datumIndex: number; cardBox: any; fullBox: any } | undefined;
            series.datumSelection.each((node: any, datum: any) => {
                if (target || datum.collapsedByAncestor) return;
                const cardBox = _ModuleSupport.Transformable.toCanvas(node, node.getShapeBBox());
                const fullBox = _ModuleSupport.Transformable.toCanvas(node, node.getFullBBox());
                if (fullBox.height > cardBox.height + 1) {
                    target = { datumIndex: datum.datumIndex, cardBox, fullBox };
                }
            });

            expect(target).toBeDefined();
            const { datumIndex, cardBox, fullBox } = target!;

            const cardBottom = cardBox.y + cardBox.height;
            const overhang = fullBox.y + fullBox.height - cardBottom;
            expect(overhang).toBeGreaterThan(1);

            const pickedIndices = (box: any) =>
                new Set<number>([...series.pickNodesInBBox(box)].map((d: any) => d.datumIndex));

            // A rect covering only the expander overhang strip below the card must not pick the node.
            const expanderOnly = { x: fullBox.x, y: cardBottom + 0.5, width: fullBox.width, height: overhang - 0.5 };
            expect(pickedIndices(expanderOnly).has(datumIndex)).toBe(false);

            // Control: a rect over the card interior does pick the node.
            const cardInterior = {
                x: cardBox.x + cardBox.width / 2,
                y: cardBox.y + cardBox.height / 2,
                width: 1,
                height: 1,
            };
            expect(pickedIndices(cardInterior).has(datumIndex)).toBe(true);
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
            // innerSpacing=20, outerSpacing=40: cousin gap (D↔E) must exceed sibling gaps.
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
                    { id: 'g', name: 'Parent G', job: 'Manager', parentId: 'root' },
                    { id: 'h', name: 'Child H', job: 'Report', parentId: 'g' },
                    { id: 'i', name: 'Child I', job: 'Report', parentId: 'h' },
                    { id: 'j', name: 'Child J', job: 'Report', parentId: 'i' },
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

        it('should wrap text within card bounds when node.maxWidth is set', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        id: 'root',
                        name: 'Alexandra Winterbottom-Richardson',
                        job: 'Senior Vice President of Global Operations and Strategic Initiatives',
                        location: 'San Francisco, California',
                        parentId: null,
                    },
                    {
                        id: 'child',
                        name: 'Bartholomew Fitzpatrick',
                        job: 'Regional Director of Business Development',
                        location: 'New York',
                        parentId: 'root',
                    },
                ],
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxWidth: 180,
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        const LONG_LABEL_DATA = [
            {
                id: 'ceo',
                name: 'Alexandra Winterbottom-Richardson',
                job: 'Chief Technology Officer of Global Operations',
                location: 'San Francisco, California',
                parentId: null,
            },
            {
                id: 'cto',
                name: 'Bartholomew Fitzpatrick',
                job: 'Senior Vice President of Strategic Initiatives',
                location: 'New York, New York',
                parentId: 'ceo',
            },
            {
                id: 'coo',
                name: 'Charlotte Featherington-Smythe',
                job: 'Operations Manager for International Markets',
                location: 'London, United Kingdom',
                parentId: 'ceo',
            },
        ];

        it('AG-17253 should wrap long labels with explicit narrow maxWidth and wrapping: always', async () => {
            const options: AgChartOptions = {
                data: LONG_LABEL_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxWidth: 140,
                            title: { key: 'name', wrapping: 'always' },
                            subtitle: { key: 'job', wrapping: 'always' },
                            labels: [{ key: 'location', wrapping: 'always' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-17253 should truncate long labels with explicit narrow maxWidth and overflowStrategy: ellipsis', async () => {
            const options: AgChartOptions = {
                data: LONG_LABEL_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxWidth: 140,
                            title: { key: 'name', wrapping: 'never', overflowStrategy: 'ellipsis' },
                            subtitle: { key: 'job', wrapping: 'never', overflowStrategy: 'ellipsis' },
                            labels: [{ key: 'location', wrapping: 'never', overflowStrategy: 'ellipsis' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        // AG-17253 pt2 follow-up (David Glickman QA) — clamping the card via `maxWidth`/
        // `maxHeight` left children drawing outside the card. Mirrors three plunker repros:
        //   plnkr.co/edit/0maSWVkHxeSLQ5Fb  (narrow width + theme-default top image)
        //   plnkr.co/edit/jxPaPCmKEyWoTi3b  (narrow height, text-only)
        //   plnkr.co/edit/oq0FP2LDZkapxUO4  (narrow height + image left)
        //   plnkr.co/edit/qA05jRd478qdnhDe  (narrow width + height)
        const OVERFLOW_DATA = [
            {
                id: 'ceo',
                name: 'Alice Chen',
                job: 'Chief Executive Officer',
                location: 'London',
                avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
                parentId: null,
            },
            {
                id: 'cto',
                name: 'Bob Smith',
                job: 'Chief Technology Officer',
                location: 'London',
                avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
                parentId: 'ceo',
            },
            {
                id: 'cfo',
                name: 'Carol Wu',
                job: 'Chief Financial Officer',
                location: 'New York',
                avatar: `${process.cwd()}/packages/ag-charts-website/public/example-assets/docs-images/brandColorsTile.png`,
                parentId: 'ceo',
            },
        ];

        it('AG-17253 pt2 should clip image overflow when card narrower than image width', async () => {
            // maxWidth (30) is well under image.width (50); image must not poke out the card sides.
            const options: AgChartOptions = {
                data: OVERFLOW_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxWidth: 30,
                            image: { key: 'avatar', position: 'top' },
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-17253 pt2 should clip vertical overflow when card shorter than content (text-only)', async () => {
            // maxHeight (50) cannot fit title + subtitle + label; trailing tiers must be cut at
            // the card edge instead of bleeding onto the link/child rows below.
            const options: AgChartOptions = {
                data: OVERFLOW_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxHeight: 50,
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-17253 pt2 should clip vertical overflow with image-left layout', async () => {
            // image-left forces the card to be at least image.height tall (50); maxHeight=50 then
            // leaves zero room for text. Text must be clipped at the card edge.
            const options: AgChartOptions = {
                data: OVERFLOW_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxHeight: 50,
                            image: { key: 'avatar', position: 'left' },
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('AG-17253 pt2 should clip overflow when both maxWidth and maxHeight are narrow', async () => {
            // 50x50 card with theme-default top image (50x50): image fills the card and text has
            // no space; both image bleed (rounded corners clipping) and text overflow must be
            // contained.
            const options: AgChartOptions = {
                data: OVERFLOW_DATA,
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: {
                            maxWidth: 50,
                            maxHeight: 50,
                            image: { key: 'avatar', position: 'top' },
                            title: { key: 'name' },
                            subtitle: { key: 'job' },
                            labels: [{ key: 'location' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('viewportGroup zoom transform', () => {
        // The windows below must be narrower than the content-fits floor, otherwise they request a
        // zoom further out than allowed and are refused outright, leaving the initial view.
        it('should render zoomed-in centred (x/y: 0.4–0.6)', async () => {
            // SQUARE_OVERFLOW_ORG_CHART is required: with comparable fitX and fitY the requested
            // xRange and yRange survive being reduced to one shared scale. SIMPLE_ORG_CHART would snap
            // zoom back to fit, and the wide-only OVERFLOWING_ORG_CHART would widen yRange.
            const options: AgChartOptions = { ...SQUARE_OVERFLOW_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.4, 0.6, 0.4, 0.6);
            await compare();
        });

        it('should render zoomed-in off-centre (x/y: 0.51–0.59)', async () => {
            // A viewport's worth of padding sits on each side, so this fixture's content only spans
            // ratios ~0.375–0.625. Framing off-centre while still filling the viewport with content
            // therefore needs a deeper zoom than the centred case, and a window kept inside that span.
            const options: AgChartOptions = { ...SQUARE_OVERFLOW_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.51, 0.59, 0.51, 0.59);
            await compare();
        });
    });

    // OVERFLOWING_ORG_CHART throughout: the content has to overflow the viewport for centring to have
    // anywhere to move the view to.
    describe('pan-to-active', () => {
        it('should pan to active item after setState when the node is outside the zoom window', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            await chart.setState({
                version: '13.3.0',
                zoom: { ratioX: { start: 0, end: 0.2 }, ratioY: { start: 0, end: 1 } },
                active: { activeItem: { type: 'series-node', seriesId, itemId: 'leaf-7-7' } },
            });
            await waitForChartStability(chart);

            const ratioX = getZoomRatios(chart)?.ratioX;
            expect(ratioX?.start).toBeDefined();
            expect(ratioX?.end).toBeDefined();

            // Centring on the node wins over the window requested in the same call, whose centre is 0.1.
            expect(Math.abs(((ratioX?.start ?? 0) + (ratioX?.end ?? 0)) / 2 - 0.1)).toBeGreaterThan(0.01);

            await compare();
        });

        it('should pan to the active item even when it is already within the zoom window', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            await chart.setState({
                version: '13.3.0',
                zoom: { ratioX: { start: 0.8, end: 1 }, ratioY: { start: 0, end: 1 } },
                active: { activeItem: { type: 'series-node', seriesId, itemId: 'leaf-7-4' } },
            });
            await waitForChartStability(chart);

            const ratioX = getZoomRatios(chart)?.ratioX;
            expect(ratioX?.start).toBeDefined();
            expect(ratioX?.end).toBeDefined();

            // A node already inside the window is centred too, rather than left where it sits: the
            // requested window is centred on 0.9.
            expect(Math.abs(((ratioX?.start ?? 0) + (ratioX?.end ?? 0)) / 2 - 0.9)).toBeGreaterThan(0.01);
        });

        it('should NOT pan when active item changes via hover (user-interaction source)', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            setZoom(chart, 0.8, 1, 0, 1);
            await waitForChartStability(chart);

            const ratiosBefore = getZoomRatios(chart);

            // `activeManager.update` is the canonical hover simulation — JSDOM canvas
            // hit-testing is stubbed so DOM events can't drive picking (testing.md).
            const seriesId = deproxy(chart).series[0].id;
            deproxy(chart).ctx.activeManager.update({ type: 'series-node', seriesId, itemId: 'leaf-7-4' }, undefined);
            await waitForChartStability(chart);

            const ratiosAfter = getZoomRatios(chart);
            expect(ratiosAfter?.ratioX?.start).toBeCloseTo(ratiosBefore?.ratioX?.start ?? 0.8, 6);
            expect(ratiosAfter?.ratioX?.end).toBeCloseTo(ratiosBefore?.ratioX?.end ?? 1, 6);
            expect(ratiosAfter?.ratioY?.start).toBeCloseTo(ratiosBefore?.ratioY?.start ?? 0, 6);
            expect(ratiosAfter?.ratioY?.end).toBeCloseTo(ratiosBefore?.ratioY?.end ?? 1, 6);
        });
    });

    describe('keyboard navigation', () => {
        // Same `(otherIndexDelta, datumIndexDelta)` deltas the seriesAreaManager dispatches for
        // arrow keys.
        const ARROW_UP = { datumIndexDelta: 0, otherIndexDelta: -1 };
        const ARROW_DOWN = { datumIndexDelta: 0, otherIndexDelta: 1 };
        const ARROW_LEFT = { datumIndexDelta: -1, otherIndexDelta: 0 };
        const ARROW_RIGHT = { datumIndexDelta: 1, otherIndexDelta: 0 };

        async function setupChart() {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return deproxy(chart).series[0] as any;
        }

        function press(series: any, key: typeof ARROW_DOWN, datumIndex: number, otherIndex = 0) {
            return series.pickFocus({
                datumIndex: datumIndex + key.datumIndexDelta,
                datumIndexDelta: key.datumIndexDelta,
                otherIndex: otherIndex + key.otherIndexDelta,
                otherIndexDelta: key.otherIndexDelta,
            });
        }

        it('ArrowDown moves from the root to its first child', async () => {
            const series = await setupChart();
            const pick = press(series, ARROW_DOWN, 0, 0);
            expect(pick?.datum.itemId).toBe('cto');
            expect(pick?.otherIndex).toBe(2);
        });

        it('ArrowDown into a leaf is a no-op', async () => {
            const series = await setupChart();
            // dev is at nodeData[2], depth 3, leaf.
            expect(press(series, ARROW_DOWN, 2, 3)).toBeUndefined();
        });

        it('ArrowUp moves from a child to its parent', async () => {
            const series = await setupChart();
            // cfo (datumIndex 4, depth 2) → ceo (datumIndex 0, depth 1).
            const pick = press(series, ARROW_UP, 4, 2);
            expect(pick?.datum.itemId).toBe('ceo');
            expect(pick?.otherIndex).toBe(1);
        });

        it('ArrowUp at the top tier is a no-op', async () => {
            const series = await setupChart();
            expect(press(series, ARROW_UP, 0, 1)).toBeUndefined();
        });

        it('ArrowRight moves to the next sibling', async () => {
            const series = await setupChart();
            // cto (datumIndex 1) → cfo (datumIndex 4).
            const pick = press(series, ARROW_RIGHT, 1, 2);
            expect(pick?.datum.itemId).toBe('cfo');
        });

        it('ArrowLeft moves to the previous sibling', async () => {
            const series = await setupChart();
            // qa (datumIndex 3) → dev (datumIndex 2).
            const pick = press(series, ARROW_LEFT, 3, 3);
            expect(pick?.datum.itemId).toBe('dev');
        });

        it('ArrowRight at the last sibling clamps (no wrap)', async () => {
            const series = await setupChart();
            // qa is the last sibling under cto; ArrowRight should stay on qa.
            const pick = press(series, ARROW_RIGHT, 3, 3);
            expect(pick?.datum.itemId).toBe('qa');
        });

        it('ArrowDown into a collapsed node auto-expands to first child', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART, initialState: { collapsed: ['cto'] } };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const series = deproxy(chart).series[0] as any;
            const pick = press(series, ARROW_DOWN, 1, 2);
            expect(pick?.datum.itemId).toBe('dev');
        });

        // Follows the same DOM chain a screen reader would: the visible swap-chain announcer
        // (`aria-hidden="false"`) labelled by a hidden `<div>` carrying the message.
        function readLiveAnnouncement(): string {
            const announcer = document.querySelector<HTMLElement>('.ag-charts-swapchain[aria-hidden="false"]');
            const labelId = announcer?.getAttribute('aria-labelledby');
            const label = labelId ? document.getElementById(labelId) : null;
            return label?.textContent ?? '';
        }

        function pressArrowOnSeriesArea(key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
            const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area');
            if (!seriesArea) throw new Error('series-area element not found');
            seriesArea.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
        }

        function pressKeyOnSeriesArea(key: string, code: string) {
            const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area');
            if (!seriesArea) throw new Error('series-area element not found');
            seriesArea.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
        }

        async function setupChartWithClickToExpand(clickToExpand: boolean) {
            const baseSeries = (SIMPLE_ORG_CHART.series as any)[0];
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                series: [{ ...baseSeries, node: { ...baseSeries.node, clickToExpand } }],
            };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return deproxy(chart).ctx.collapsedManager;
        }

        it('announces a parent node identity-first with level, position, and expanded state', async () => {
            await setupChart();
            // Default focus sits on the root (ceo); ArrowDown moves to its first child (cto).
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            // Identity-first ordering matches WAI-ARIA tree conventions: name before metadata.
            expect(readLiveAnnouncement()).toBe(
                'Bob Smith, Chief Technology Officer, London, level 2, 1 of 2, expanded, 2 children. Press ALT UP to collapse this node. Press Space or Enter to expand or collapse this node'
            );
        });

        it('omits collapsed-state from a leaf announcement', async () => {
            await setupChart();
            // ArrowDown twice: ceo → cto → dev (a leaf at depth 3).
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            const announcement = readLiveAnnouncement();
            expect(announcement).toBe('Dave Jones, Developer, New York, level 3, 1 of 2');
            // Guard against the empty-collapsedState stutter VoiceOver caught before the
            // leaf/parent locale-key split.
            expect(announcement).not.toContain(',,');
            expect(announcement).not.toContain(', ,');
        });

        it('uses the singular template when a parent has exactly one child', async () => {
            await setupChart();
            // ceo → cto → ArrowRight → cfo (Carol Wu, parent of acc — exactly one child).
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            pressArrowOnSeriesArea('ArrowRight');
            await waitForChartStability(chart);
            expect(readLiveAnnouncement()).toBe(
                'Carol Wu, Chief Financial Officer, London, level 2, 2 of 2, expanded, 1 child. Press ALT UP to collapse this node. Press Space or Enter to expand or collapse this node'
            );
        });

        it('reports collapsed parents in the live announcement', async () => {
            const options: AgChartOptions = { ...SIMPLE_ORG_CHART, initialState: { collapsed: ['cto'] } };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            expect(readLiveAnnouncement()).toBe(
                'Bob Smith, Chief Technology Officer, London, level 2, 1 of 2, collapsed, 2 children. Press ALT DOWN to expand this node. Press Space or Enter to expand or collapse this node'
            );
        });

        // AG-17263 regression: Alt+Up/Down keybindings were added but Enter/Space toggling was lost.
        // With clickToExpand enabled (the default) Enter/Space must still expand/collapse the node.
        it('Enter toggles the focused parent node when clickToExpand is enabled', async () => {
            const collapsedManager = await setupChartWithClickToExpand(true);
            // ceo → cto (a parent node).
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(false);

            pressKeyOnSeriesArea('Enter', 'Enter');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(true);

            pressKeyOnSeriesArea('Enter', 'Enter');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(false);
        });

        it('Space toggles the focused parent node when clickToExpand is enabled', async () => {
            const collapsedManager = await setupChartWithClickToExpand(true);
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(false);

            pressKeyOnSeriesArea(' ', 'Space');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(true);
        });

        it('Enter does not toggle a node when clickToExpand is disabled', async () => {
            const collapsedManager = await setupChartWithClickToExpand(false);
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            expect(collapsedManager.isCollapsed('cto')).toBe(false);

            pressKeyOnSeriesArea('Enter', 'Enter');
            await waitForChartStability(chart);
            // clickToExpand off → Enter/Space are inert; use Alt+Up/Down instead.
            expect(collapsedManager.isCollapsed('cto')).toBe(false);
        });

        it('omits the Enter/Space instruction from announcements when clickToExpand is disabled', async () => {
            await setupChartWithClickToExpand(false);
            pressArrowOnSeriesArea('ArrowDown');
            await waitForChartStability(chart);
            const announcement = readLiveAnnouncement();
            expect(announcement).toContain('Press ALT UP to collapse this node');
            expect(announcement).not.toContain('Press Space or Enter');
        });
    });

    // AG-17947: expanding/collapsing is a distinct interaction from activating a node, so a pointer
    // event on the expander pill must neither reach the user's node click/double-click listeners nor
    // change the data selection.
    describe('AG-17947 expander clicks do not activate the node', () => {
        type Fn = ReturnType<(typeof vi)['fn']>;
        type CollapsedManager = ReturnType<typeof deproxy>['ctx']['collapsedManager'];
        let seriesNodeClick: Fn;
        let seriesNodeDoubleClick: Fn;
        let chartSeriesNodeClick: Fn;
        let collapsedManager: CollapsedManager;

        async function setupChart(opts: { clickToExpand: boolean; selection?: boolean }) {
            const { selection, ...nodeOpts } = opts;
            seriesNodeClick = vi.fn();
            seriesNodeDoubleClick = vi.fn();
            chartSeriesNodeClick = vi.fn();
            const baseSeries = new Caster(SIMPLE_ORG_CHART.series).assertNonNullish().value[0];
            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                series: [
                    {
                        ...baseSeries,
                        node: { ...baseSeries.node, ...nodeOpts },
                        listeners: { seriesNodeClick, seriesNodeDoubleClick },
                    },
                ],
                listeners: { seriesNodeClick: chartSeriesNodeClick },
                ...(selection && { selection: { enabled: true, enableClick: true } }),
            };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            collapsedManager = deproxy(chart).ctx.collapsedManager;
        }

        async function doubleClickItem(itemId: string, tag: OrganizationNodeTag): Promise<void> {
            const expander = centreOf(itemId, tag);
            await doubleClickAction(expander.x, expander.y)(chart);
            await waitForChartStability(chart);
        }

        describe('clickToExpand: false', () => {
            beforeEach(async () => {
                await setupChart({ clickToExpand: false });
            });

            it('collapses and expands on expander clicks without firing seriesNodeClick', async () => {
                await clickItem('cto', OrganizationNodeTag.Expander);
                expect(collapsedManager.isCollapsed('cto')).toBe(true);

                await clickItem('cto', OrganizationNodeTag.Expander);
                expect(collapsedManager.isCollapsed('cto')).toBe(false);

                expect(seriesNodeClick).not.toHaveBeenCalled();
                expect(chartSeriesNodeClick).not.toHaveBeenCalled();
            });

            it('does not fire seriesNodeDoubleClick when the expander is double-clicked', async () => {
                await doubleClickItem('cto', OrganizationNodeTag.Expander);
                expect(seriesNodeDoubleClick).not.toHaveBeenCalled();
            });

            it('still fires seriesNodeClick when the card body is clicked', async () => {
                await clickItem('cto', OrganizationNodeTag.Card);
                expect(seriesNodeClick).toHaveBeenCalledTimes(1);
                expect(seriesNodeClick.mock.calls[0][0]).toMatchObject({ itemId: 'cto' });
                expect(chartSeriesNodeClick).toHaveBeenCalledTimes(1);
            });

            it('still fires seriesNodeDoubleClick when the card body is double-clicked', async () => {
                await doubleClickItem('cto', OrganizationNodeTag.Card);
                expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(1);
                expect(seriesNodeDoubleClick.mock.calls[0][0]).toMatchObject({ itemId: 'cto' });
            });
        });

        // `clickToExpand` widens the toggle to the whole card, but only the expander is exempt from
        // node events — a card-body click must both toggle and fire seriesNodeClick.
        describe('clickToExpand: true', () => {
            beforeEach(async () => {
                await setupChart({ clickToExpand: true });
            });

            it('fires seriesNodeClick for a card-body click even when clickToExpand toggles the node', async () => {
                await clickItem('cto', OrganizationNodeTag.Card);
                expect(collapsedManager.isCollapsed('cto')).toBe(true);
                expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            });

            it('suppresses seriesNodeClick for an expander click even when clickToExpand is enabled', async () => {
                await clickItem('cto', OrganizationNodeTag.Expander);
                expect(collapsedManager.isCollapsed('cto')).toBe(true);
                expect(seriesNodeClick).not.toHaveBeenCalled();
            });
        });

        // Collapsing to declutter a large chart is the most natural way to combine the two features,
        // so an expander click must leave the selection alone in both directions — including the
        // selection of nodes the collapse hides.
        describe('data selection', () => {
            const nodeIds = new Caster(SIMPLE_ORG_CHART.data).assertNonNullish().value.map((datum) => datum.id);

            beforeEach(async () => {
                await setupChart({ clickToExpand: false, selection: true });
            });

            function dataSet() {
                return new Caster(deproxy(chart).series[0].data).assertNonNullish().value;
            }

            // Selection is keyed by DataSet item id; translating via each node's data row lets the
            // expectations — and any failure message — speak in org node ids.
            function selectedNodeIds(): string[] {
                const ds = dataSet();
                const byItemId = new Map(nodeIds.map((id, index) => [ds.getItemIdFromIndex(index), id]));
                return [...chart.getSelection()]
                    .map((item: { itemId: string | number }) => String(byItemId.get(item.itemId) ?? item.itemId))
                    .sort((a, b) => a.localeCompare(b));
            }

            async function setSelectedNodes(...ids: string[]): Promise<void> {
                const { id: seriesId } = deproxy(chart).series[0];
                chart.setSelection(
                    ids.map((nodeId) => ({ seriesId, itemId: dataSet().getItemIdFromIndex(nodeIds.indexOf(nodeId)) }))
                );
                await waitForChartStability(chart);
            }

            it('leaves the selection untouched when an expander is clicked', async () => {
                await clickItem('ceo', OrganizationNodeTag.Card);
                await clickItem('cfo', OrganizationNodeTag.Card, { ctrlKey: true });
                expect(selectedNodeIds()).toEqual(['ceo', 'cfo']);

                await clickItem('cto', OrganizationNodeTag.Expander);

                expect(collapsedManager.isCollapsed('cto')).toBe(true);
                expect(selectedNodeIds()).toEqual(['ceo', 'cfo']);
            });

            // Clicking a card makes it the active item, whose ancestors are reopened by design — so
            // seed the selection through the API to keep `cto` collapsed.
            it('keeps nodes selected once a collapse has hidden them', async () => {
                await setSelectedNodes('dev', 'qa');
                expect(selectedNodeIds()).toEqual(['dev', 'qa']);

                await clickItem('cto', OrganizationNodeTag.Expander);

                expect(collapsedManager.isCollapsed('cto')).toBe(true);
                expect(selectedNodeIds()).toEqual(['dev', 'qa']);
            });

            it('does not select a node when its own expander is clicked', async () => {
                await clickItem('cto', OrganizationNodeTag.Expander);
                expect(collapsedManager.isCollapsed('cto')).toBe(true);
                expect(selectedNodeIds()).toEqual([]);
            });

            it('does not change collapse state when a card is clicked', async () => {
                await clickItem('cto', OrganizationNodeTag.Card);
                expect(selectedNodeIds()).toEqual(['cto']);
                expect(collapsedManager.isCollapsed('cto')).toBe(false);
            });
        });
    });

    describe('AG-17239 native pixel floor', () => {
        it('should not pan when a zoom request asks to zoom in past the 1:1 floor', async () => {
            const options: AgChartOptions = { ...SQUARE_OVERFLOW_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Land at the 1:1 floor (both axes saturate at fitX/fitY).
            setZoom(chart, 0.45, 0.55, 0.45, 0.55);
            await waitForChartStability(chart);
            const flooredState = (deproxy(chart) as any).ctx.chartState.getValue('zoom');
            expect(flooredState).toBeDefined();

            // Further zoom-in with an off-centre mid must not translate the window.
            setZoom(chart, 0.3, 0.4, 0.3, 0.4);
            await waitForChartStability(chart);
            const afterState = (deproxy(chart) as any).ctx.chartState.getValue('zoom');
            expect(afterState).toEqual(flooredState);
        });

        it('should not pan when only one axis requests further zoom-in past the floor', async () => {
            const options: AgChartOptions = { ...SQUARE_OVERFLOW_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            setZoom(chart, 0.45, 0.55, 0.45, 0.55);
            await waitForChartStability(chart);
            const flooredState = (deproxy(chart) as any).ctx.chartState.getValue('zoom');

            // Shrink x only, leave y at the floored range. Off-isotropic input would otherwise
            // land at floor (t = 1) with the new x mid, leaking through `clampMid`.
            setZoom(chart, 0.3, 0.35, flooredState.y.min, flooredState.y.max);
            await waitForChartStability(chart);
            const afterState = (deproxy(chart) as any).ctx.chartState.getValue('zoom');
            expect(afterState).toEqual(flooredState);
        });
    });

    // Expanding or collapsing reflows the tree around the interacted node, which without any
    // correction moves that node — far enough, on this data, to carry it clean out of the viewport.
    describe('AG-17206 keep the interacted node fully visible', () => {
        async function createChart() {
            const options: AgChartOptions = { ...TEAM_DIRECTORY_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        }

        // Holds the window size and moves only the midpoint, as a drag does: a request that also
        // resizes the window is refused outright while the chart sits at a zoom limit.
        async function panToOrigin() {
            const ratios = getZoomRatios(chart);
            const xSize = (ratios?.ratioX?.end ?? 0) - (ratios?.ratioX?.start ?? 0);
            const ySize = (ratios?.ratioY?.end ?? 0) - (ratios?.ratioY?.start ?? 0);
            expect(xSize).toBeGreaterThan(0);
            expect(ySize).toBeGreaterThan(0);

            setZoom(chart, 0, xSize, 0, ySize);
            await waitForChartStability(chart);
        }

        it('should hold a node in place when collapsing would carry it off-screen', async () => {
            await createChart();

            await clickItem('Joseph Howe', OrganizationNodeTag.Expander);
            // Guards the snapshot against a click that missed the expander entirely.
            expect(deproxy(chart).ctx.collapsedManager.isCollapsed('Joseph Howe')).toBe(true);

            await compare();
        });

        it('should hold a node in place when expanding would clip it', async () => {
            await createChart();
            setZoom(chart, 0.3, 0.7, 0.3, 0.7);
            await waitForChartStability(chart);
            await panToOrigin();

            await clickItem('Justin Contreras', OrganizationNodeTag.Expander);
            expect(deproxy(chart).ctx.collapsedManager.isCollapsed('Justin Contreras')).toBe(false);

            await compare();
        });

        it('should not move an interacted node that is already fully visible', async () => {
            // The reflow moves the node in content space whether or not it was at risk of clipping, so
            // holding its place on screen is a stronger requirement than simply not panning. Gary Garcia
            // stays where he was; the tree rearranges around him. Note his card is redrawn larger,
            // because shrinking the content raises the content-fits floor and so zooms in about him.
            await createChart();

            await clickItem('Gary Garcia', OrganizationNodeTag.Expander);
            // Guards the snapshot against a click that missed the expander entirely.
            expect(deproxy(chart).ctx.collapsedManager.isCollapsed('Gary Garcia')).toBe(true);

            await compare();
        });
    });

    describe('aspect-ratio guard', () => {
        it('should project off-isotropic zoom state onto the isotropic line', async () => {
            const options: AgChartOptions = { ...OVERFLOWING_ORG_CHART };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Off-isotropic request (x=0.2 wide, y=0.1 wide) centred at 0.5,0.5. Both are inside the
            // content-fits floor, so the request is applied and y is widened to match x's scale.
            setZoom(chart, 0.4, 0.6, 0.45, 0.55);
            await waitForChartStability(chart);

            // This fixture renders very little ink at fit scale, so the image alone is weak evidence:
            // assert the normalisation on the state as well.
            const ratios = getZoomRatios(chart);
            const xSize = (ratios?.ratioX?.end ?? 0) - (ratios?.ratioX?.start ?? 0);
            const ySize = (ratios?.ratioY?.end ?? 0) - (ratios?.ratioY?.start ?? 0);
            expect(xSize).toBeCloseTo(0.2, 3);
            expect(ySize).toBeCloseTo(0.346, 3);

            await compareImageSnapshot(chart, ctx);
        });
    });

    describe('pan headroom', () => {
        // Projects the content bounds through the viewport transform, so the assertions below are in
        // the same space a user sees: pixels within the series area.
        function getContentEdges(c: any) {
            const series = deproxy(c).series[0] as any;
            const { seriesRect, viewportGroup } = series;
            const contentBBox = series.layout.getContentBBox();

            return {
                centreX: seriesRect.width / 2,
                centreY: seriesRect.height / 2,
                left: contentBBox.x * viewportGroup.scalingX + viewportGroup.translationX,
                right: (contentBBox.x + contentBBox.width) * viewportGroup.scalingX + viewportGroup.translationX,
                top: contentBBox.y * viewportGroup.scalingY + viewportGroup.translationY,
                bottom: (contentBBox.y + contentBBox.height) * viewportGroup.scalingY + viewportGroup.translationY,
            };
        }

        // Content that already fits gets the same headroom as content that overflows: the viewport
        // never scales up past native size, so its reach is wider than the fit scale suggests.
        const FIXTURES: [string, AgChartOptions][] = [
            ['overflowing content', SQUARE_OVERFLOW_ORG_CHART],
            ['content that fits the viewport', SIMPLE_ORG_CHART],
        ];

        // Holds the window size and moves only its midpoint, as a drag does. A request that also
        // resizes the window is refused outright once the chart sits at a zoom limit — which is
        // always the case for content that fits, since it never scales up past native size.
        async function createPanned(fixture: AgChartOptions, toFarEnd: boolean) {
            const options: AgChartOptions = { ...fixture };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const ratios = getZoomRatios(chart);
            const xSize = (ratios?.ratioX?.end ?? 0) - (ratios?.ratioX?.start ?? 0);
            const ySize = (ratios?.ratioY?.end ?? 0) - (ratios?.ratioY?.start ?? 0);
            expect(xSize).toBeGreaterThan(0);
            expect(ySize).toBeGreaterThan(0);

            const xMin = toFarEnd ? 1 - xSize : 0;
            const yMin = toFarEnd ? 1 - ySize : 0;

            setZoom(chart, xMin, xMin + xSize, yMin, yMin + ySize);
            await waitForChartStability(chart);

            return getContentEdges(chart);
        }

        // Zoom y is published y-up, so the y-max end of the range is the top of the content.
        it.each(FIXTURES)('stops at the content top-left panning to the far end, %s', async (_name, fixture) => {
            const edges = await createPanned(fixture, true);

            expect(edges.right).toBeCloseTo(edges.centreX, 0);
            expect(edges.top).toBeCloseTo(edges.centreY, 0);
        });

        it.each(FIXTURES)('stops at the content bottom-right panning to the near end, %s', async (_name, fixture) => {
            const edges = await createPanned(fixture, false);

            expect(edges.left).toBeCloseTo(edges.centreX, 0);
            expect(edges.bottom).toBeCloseTo(edges.centreY, 0);
        });
    });

    describe('collapsedChange event', () => {
        it('should trigger the collapsedChange event on setState', async () => {
            let source;
            let collapsed;

            const options: AgChartOptions = {
                ...SIMPLE_ORG_CHART,
                listeners: {
                    collapsedChange: (event) => {
                        collapsed = event.collapsed;
                        source = event.source;
                    },
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(collapsed).toEqual(undefined);
            expect(source).toEqual(undefined);

            await chart.setState({ version: '14.1.0', collapsed: ['cto'] });
            await waitForChartStability(chart);

            expect(collapsed).toEqual([{ datum: options.data![1], itemId: 'cto' }]);
            expect(source).toEqual('api-call');
        });
    });

    // Organization extends the network series base and never drives the animation manager, so node
    // cards and links never tween. Pinned by a minimal guard rather than a trajectory suite, since
    // there is no motion to describe.
    describe('does not animate', () => {
        const frames = spyOnAnimationFrames();

        const cardKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/(rect|path)\[/.test(k));

        it('update data: node cards snap to their new layout without tweening', async () => {
            const options: AgChartOptions = {
                data: [
                    { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', parentId: null },
                    { id: 'cto', name: 'Bob Smith', job: 'Chief Technology Officer', parentId: 'ceo' },
                    { id: 'cfo', name: 'Carol Wu', job: 'Chief Financial Officer', parentId: 'ceo' },
                ],
                series: [
                    {
                        type: 'organization',
                        idKey: 'id',
                        parentIdKey: 'parentId',
                        node: { title: { key: 'name' }, subtitle: { key: 'job' } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            const sampler = createSceneGeometrySampler(chart);
            const { before, trajectory, after } = await frames.captureSnap(chart, sampler, () =>
                chart.updateDelta({
                    data: [
                        { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', parentId: null },
                        { id: 'cto', name: 'Bob Smith', job: 'Chief Technology Officer', parentId: 'ceo' },
                        { id: 'cfo', name: 'Carol Wu', job: 'Chief Financial Officer', parentId: 'ceo' },
                        { id: 'dev', name: 'Dave Jones', job: 'Developer', parentId: 'cto' },
                    ],
                })
            );

            // Anti-vacuity: the extra report adds a card (and its link), so the tree genuinely changed —
            // a constant trajectory over it is a real snap, not a pin over an unchanged scene.
            const beforeCount = cardKeys(before).length;
            const afterCount = cardKeys(after).length;
            expect(beforeCount).toBeGreaterThan(0);
            expect(afterCount).toBeGreaterThan(beforeCount);
            // The full new layout is present on the first captured frame (nothing grows/fades in).
            expect(cardKeys(trajectory[0]).length).toBe(afterCount);
            // Whole-scene constancy from the first frame proves the snap. expectNoAnimation is unusable
            // here: the vertical step-connector links have a degenerate x-extent, so their sampled
            // top-station values are non-finite, which its finiteness check rejects. expectSceneSamplesMatch
            // compares those NaN stations by identity (NaN matches NaN), so it still fails on any tween
            // while tolerating the intrinsic degenerate geometry.
            for (const frame of trajectory) {
                expectSceneSamplesMatch(frame, trajectory[0]);
            }
        });
    });
});
