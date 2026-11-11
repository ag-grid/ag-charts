import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgChartInstance,
    AgChartOptions,
    AgGaugeOptions,
    AgHeatmapSeriesOptions,
    AgLinearGaugeOptions,
    AgMapShapeSeriesOptions,
    AgOrganizationSeriesOptions,
    AgRadialGaugeOptions,
    AgSunburstSeriesOptions,
    AgTreemapSeriesOptions,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    expectWarningsCalls,
    findAxis,
    getSeriesOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import ukTopology from './series/map-test/ukTopology.json';
import { getNavigator } from './test/featureAccessors';
import { createEnterpriseChart, prepareEnterpriseTestOptions } from './test/utils';

const HIERARCHY_DATA = [
    {
        name: 'Root',
        children: [
            { name: 'Leaf A', size: 10 },
            { name: 'Leaf B', size: 20 },
        ],
    },
];
const GRID_DATA = [
    { x: 'a', y: 'p', v: 1 },
    { x: 'b', y: 'q', v: 2 },
];
const ORGANIZATION_DATA = [
    { id: 'ceo', name: 'Alice Chen', job: 'CEO' },
    { id: 'cto', name: 'Bob Smith', job: 'CTO', parentId: 'ceo' },
];
const STAGE_DATA = [
    { group: 'Visits', value: 100 },
    { group: 'Sign-ups', value: 40 },
];
const LINE_DATA = [
    { month: 'Jan', value: 10 },
    { month: 'Feb', value: 30 },
];

const heatmap = (series: object = {}): object => ({
    data: GRID_DATA,
    series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'v', ...series }],
});
const treemap = (series: object = {}): object => ({
    data: HIERARCHY_DATA,
    series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size', ...series }],
});
const sunburst = (series: object = {}): object => ({
    data: HIERARCHY_DATA,
    series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', ...series }],
});
const organization = (series: object = {}): object => ({
    data: ORGANIZATION_DATA,
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: { title: { key: 'name' }, subtitle: { key: 'job' } },
            ...series,
        },
    ],
});
const mapShape = (series: object = {}): object => ({
    topology: ukTopology,
    series: [
        {
            type: 'map-shape',
            data: [{ name: 'England', label: 'England' }],
            idKey: 'name',
            labelKey: 'label',
            ...series,
        },
    ],
});
const coneFunnel = (series: object = {}): object => ({
    data: STAGE_DATA,
    series: [{ type: 'cone-funnel', stageKey: 'group', valueKey: 'value', ...series }],
});
const linearGauge = (options: object = {}): object => ({
    type: 'linear-gauge',
    value: 50,
    scale: { min: 0, max: 100 },
    ...options,
});
const radialGauge = (options: object = {}): object => ({
    type: 'radial-gauge',
    value: 50,
    scale: { min: 0, max: 100 },
    ...options,
});
const cartesian = (options: object = {}): object => ({
    data: LINE_DATA,
    series: [{ type: 'line', xKey: 'month', yKey: 'value' }],
    ...options,
});
const lineCrossLineChart = (axis: 'x' | 'y', label: object): object => {
    const crossLine = { type: 'line', value: axis === 'y' ? 20 : 'Feb', label: { text: 'Target', ...label } };
    return cartesian({
        axes: {
            x: { type: 'category', position: 'bottom', ...(axis === 'x' ? { crossLines: [crossLine] } : {}) },
            y: { type: 'number', position: 'left', ...(axis === 'y' ? { crossLines: [crossLine] } : {}) },
        },
    });
};
const axisChart = (axis: object, theme?: object): object =>
    cartesian({
        axes: { x: { type: 'category', position: 'bottom', ...axis }, y: { type: 'number', position: 'left' } },
        ...(theme == null ? {} : { theme }),
    });
const navigatorChart = (navigator: object = {}, theme?: object): object =>
    cartesian({ navigator: { enabled: true, ...navigator }, ...(theme == null ? {} : { theme }) });

const unknown = (path: string) => `Unknown option \`${path}\``;
const OVERFLOW_STRATEGY = 'hide';

describe('removed deprecated options', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const render = async (options: object) => {
        if ((options as { type?: string }).type?.endsWith('-gauge')) {
            prepareEnterpriseTestOptions(options as AgGaugeOptions);
            chart = AgCharts.createGauge(options as AgGaugeOptions);
            await waitForChartStability(chart);
        } else {
            chart = await createEnterpriseChart(options as AgChartOptions);
        }
        return chart;
    };

    describe('are reported as unknown or invalid and the chart still renders', () => {
        const rows: [name: string, options: object, warning: string][] = [
            [
                'organization verticalSpacing',
                organization({ verticalSpacing: 80 }),
                unknown('series[0].verticalSpacing'),
            ],
            ['heatmap textAlign', heatmap({ textAlign: 'left' }), unknown('series[0].textAlign')],
            ['heatmap verticalAlign', heatmap({ verticalAlign: 'top' }), unknown('series[0].verticalAlign')],
            [
                'cone funnel label placement before',
                coneFunnel({ label: { placement: 'before' } }),
                '`series[0].label.placement` cannot be set to `"before"`',
            ],
            [
                'heatmap label overflowStrategy',
                heatmap({ label: { overflowStrategy: OVERFLOW_STRATEGY } }),
                unknown('series[0].label.overflowStrategy'),
            ],
            [
                'treemap tile label overflowStrategy',
                treemap({ tile: { label: { overflowStrategy: OVERFLOW_STRATEGY } } }),
                unknown('series[0].tile.label.overflowStrategy'),
            ],
            [
                'sunburst label overflowStrategy',
                sunburst({ label: { overflowStrategy: OVERFLOW_STRATEGY } }),
                unknown('series[0].label.overflowStrategy'),
            ],
            [
                'organization node title overflowStrategy',
                organization({
                    node: { title: { key: 'name', overflowStrategy: OVERFLOW_STRATEGY } },
                }),
                unknown('series[0].node.title.overflowStrategy'),
            ],
            [
                'map shape label overflowStrategy',
                mapShape({ label: { overflowStrategy: OVERFLOW_STRATEGY } }),
                unknown('series[0].label.overflowStrategy'),
            ],
            [
                'linear gauge label overflowStrategy',
                linearGauge({ label: { enabled: true, overflowStrategy: OVERFLOW_STRATEGY } }),
                unknown('[type=linear-gauge]label.overflowStrategy'),
            ],
            [
                'radial gauge label overflowStrategy',
                radialGauge({ label: { overflowStrategy: OVERFLOW_STRATEGY } }),
                unknown('[type=radial-gauge]label.overflowStrategy'),
            ],
            [
                'organization text itemStyler overflowStrategy',
                organization({
                    node: {
                        title: { key: 'name', itemStyler: () => ({ overflowStrategy: OVERFLOW_STRATEGY }) },
                    },
                }),
                'returned an unknown property `series[0].node.title.itemStyler.overflowStrategy`',
            ],
            ['treemap tile textAlign', treemap({ tile: { textAlign: 'left' } }), unknown('series[0].tile.textAlign')],
            [
                'treemap tile verticalAlign',
                treemap({ tile: { verticalAlign: 'top' } }),
                unknown('series[0].tile.verticalAlign'),
            ],
            [
                'treemap group textAlign',
                treemap({ group: { textAlign: 'center' } }),
                unknown('series[0].group.textAlign'),
            ],
            ['navigator mask', navigatorChart({ mask: { fill: 'blue' } }), unknown('navigator.mask')],
            [
                'navigator mask theme override',
                navigatorChart({}, { overrides: { common: { navigator: { mask: { fill: 'blue' } } } } }),
                unknown('theme.overrides.common.navigator.mask'),
            ],
            [
                'cross line label position',
                lineCrossLineChart('y', { position: 'top' }),
                unknown('axes.y.crossLines[0][type=line].label.position'),
            ],
            ['axis line width', axisChart({ line: { width: 3 } }), unknown('axes.x.line.width')],
            [
                'axis line width theme override',
                axisChart({}, { overrides: { common: { axes: { category: { line: { width: 3 } } } } } }),
                unknown('theme.overrides.common.axes.category.line.width'),
            ],
            [
                'linear gauge label avoidCollisions',
                linearGauge({ label: { enabled: true, avoidCollisions: false } }),
                unknown('[type=linear-gauge]label.avoidCollisions'),
            ],
            [
                'horizontal cross line inside-top placement',
                lineCrossLineChart('y', { placement: 'inside-top' }),
                'Placement `inside-top` does not apply to a line cross line on a y axis and is ignored',
            ],
            [
                'vertical cross line inside-left placement',
                lineCrossLineChart('x', { placement: 'inside-left' }),
                'Placement `inside-left` does not apply to a line cross line on an x axis and is ignored',
            ],
            [
                'vertical cross line top-left placement',
                lineCrossLineChart('x', { placement: 'top-left' }),
                'Placement `top-left` does not apply to a line cross line on an x axis and is ignored',
            ],
        ];

        it.each(rows)('%s', async (_name, options, warning) => {
            await render(options);

            expectWarningsCalls().toEqual([[expect.stringContaining(warning)]]);
        });
    });

    describe('leave the resolved defaults unchanged', () => {
        it('resolves the navigator track from the theme', async () => {
            await render(navigatorChart());
            const { fillOpacity } = getNavigator(chart!).track;

            expect(fillOpacity).toBe(0.1);
        });

        it('resolves the navigator track from the track theme params', async () => {
            await render(
                navigatorChart(
                    {},
                    {
                        params: {
                            navigatorTrackBackgroundColor: 'red',
                            navigatorTrackBorder: { color: 'blue', width: 3 },
                        },
                    }
                )
            );
            const { fill, stroke, strokeWidth } = getNavigator(chart!).track;

            expect([fill, stroke, strokeWidth]).toEqual(['red', 'blue', 3]);
        });

        it('resolves the axis line width from the axisLineWidth param', async () => {
            await render(axisChart({}));
            expect(findAxis(chart!, 'bottom').options.line.strokeWidth).toBe(1);

            chart!.destroy();
            await render(axisChart({}, { params: { axisLineWidth: 4 } }));
            expect(findAxis(chart!, 'bottom').options.line.strokeWidth).toBe(4);
        });

        it('resolves the organization depthSpacing', async () => {
            await render(organization());

            expect(getSeriesOptions<AgOrganizationSeriesOptions>(chart!).depthSpacing).toBe(52);
        });

        it('resolves the heatmap label alignment', async () => {
            await render(heatmap());
            const { label } = getSeriesOptions<AgHeatmapSeriesOptions>(chart!);

            expect([label?.textAlign, label?.verticalAlign]).toEqual(['center', 'middle']);
        });

        it('resolves the treemap tile and group label alignment', async () => {
            await render(treemap());
            const { tile, group } = getSeriesOptions<AgTreemapSeriesOptions>(chart!);

            expect([tile?.label?.textAlign, tile?.label?.verticalAlign, group?.label?.textAlign]).toEqual([
                'center',
                'middle',
                'left',
            ]);
        });

        it.each<
            [name: string, options: object, read: (chart: AgChartInstance) => boolean | undefined, truncate: boolean]
        >([
            ['heatmap', heatmap(), (c) => getSeriesOptions<AgHeatmapSeriesOptions>(c).label?.truncate, false],
            ['treemap', treemap(), (c) => getSeriesOptions<AgTreemapSeriesOptions>(c).tile?.label?.truncate, true],
            ['sunburst', sunburst(), (c) => getSeriesOptions<AgSunburstSeriesOptions>(c).label?.truncate, true],
            [
                'linear gauge',
                linearGauge({ label: { enabled: true } }),
                (c) => getSeriesOptions<AgLinearGaugeOptions>(c).label?.truncate,
                false,
            ],
            ['radial gauge', radialGauge(), (c) => getSeriesOptions<AgRadialGaugeOptions>(c).label?.truncate, false],
            [
                'organization node title',
                organization(),
                (c) => getSeriesOptions<AgOrganizationSeriesOptions>(c).node?.title?.truncate,
                true,
            ],
            ['map shape', mapShape(), (c) => getSeriesOptions<AgMapShapeSeriesOptions>(c).label?.truncate, true],
        ])('resolves %s label truncate to its default', async (_name, options, read, truncate) => {
            await render(options);

            expect(read(chart!)).toBe(truncate);
        });
    });
});
