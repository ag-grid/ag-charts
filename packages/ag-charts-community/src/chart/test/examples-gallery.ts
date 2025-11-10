import type { AgChartOptions, AgGaugeOptions } from 'ag-charts-types';

import * as examples from './examples';
import {
    PATTERN_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    flowProportionChartAssertions,
    gaugeAssertions,
    hierarchyChartAssertions,
    polarChartAssertions,
    repeat,
} from './utils';
import type { ChartOrProxy, IMAGE_SNAPSHOT_DEFAULTS } from './utils';

interface BaseTestCase<Options extends AgChartOptions | AgGaugeOptions> {
    options: Options;
    assertions: (chart: ChartOrProxy<Options>) => void | Promise<void>;
    extraScreenshotActions?: (chart: ChartOrProxy<Options>) => Promise<void>;
    enterprise: boolean;
    imageSnapshotDefaults?: typeof IMAGE_SNAPSHOT_DEFAULTS;
}

export interface ChartTestCase extends BaseTestCase<AgChartOptions> {
    type?: 'chart';
}

export interface GaugeTestCase extends BaseTestCase<AgGaugeOptions> {
    type: 'gauge';
}

export type TestCase = ChartTestCase | GaugeTestCase;

export const COMMUNITY_AND_ENTERPRISE_EXAMPLES = {
    BAR_CHART_EXAMPLE: {
        options: examples.BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 1),
        }),
        enterprise: false,
    },
    GROUPED_BAR_CHART_EXAMPLE: {
        options: examples.GROUPED_BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 2),
        }),
        enterprise: false,
    },
    STACKED_BAR_CHART_EXAMPLE: {
        options: examples.STACKED_BAR_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 4),
        }),
        enterprise: false,
    },
    ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 3),
        }),
        enterprise: false,
    },
    BAR_CHART_WITH_LABELS_EXAMPLE: {
        options: examples.BAR_CHART_WITH_LABELS_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 1),
        }),
        enterprise: false,
    },
    SIMPLE_COLUMN_CHART_EXAMPLE: {
        options: examples.SIMPLE_COLUMN_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: ['bar'] }),
        enterprise: false,
    },
    GROUPED_COLUMN_EXAMPLE: {
        options: examples.GROUPED_COLUMN_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 7) }),
        enterprise: false,
    },
    STACKED_COLUMN_GRAPH_EXAMPLE: {
        options: examples.STACKED_COLUMN_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 5) }),
        enterprise: false,
    },
    ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 6) }),
        enterprise: false,
    },
    COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 2) }),
        enterprise: false,
    },
    SIMPLE_PIE_CHART_EXAMPLE: {
        options: examples.SIMPLE_PIE_CHART_EXAMPLE,
        assertions: polarChartAssertions(),
        enterprise: false,
    },
    SIMPLE_DONUT_CHART_EXAMPLE: {
        options: examples.SIMPLE_DONUT_CHART_EXAMPLE,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
        enterprise: false,
    },
    SIMPLE_LINE_CHART_EXAMPLE: {
        options: examples.SIMPLE_LINE_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: ['line', 'line'],
        }),
        enterprise: false,
    },
    LINE_GRAPH_WITH_GAPS_EXAMPLE: {
        options: examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('line', 16) }),
        enterprise: false,
    },
    SIMPLE_SCATTER_CHART_EXAMPLE: {
        options: examples.SIMPLE_SCATTER_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['scatter'] }),
        enterprise: false,
        imageSnapshotDefaults: PATTERN_SNAPSHOT_DEFAULTS,
    },
    BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['bubble'] }),
        enterprise: false,
    },
    BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'category' }, seriesTypes: ['bubble'] }),
        enterprise: false,
    },
    SIMPLE_AREA_GRAPH_EXAMPLE: {
        options: examples.SIMPLE_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('area', 4),
        }),
        enterprise: false,
    },
    STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.STACKED_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('area', 6),
        }),
        enterprise: false,
    },
    ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('area', 7) }),
        enterprise: false,
    },
    AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('area', 5) }),
        enterprise: false,
    },
    SIMPLE_SUNBURST_EXAMPLE: {
        options: examples.SIMPLE_SUNBURST_EXAMPLE,
        assertions: hierarchyChartAssertions({ seriesTypes: ['sunburst'] }),
        enterprise: true,
    },
    TREEMAP_WITH_COLOR_RANGE_EXAMPLE: {
        options: examples.TREEMAP_WITH_COLOR_RANGE_EXAMPLE,
        assertions: hierarchyChartAssertions({ seriesTypes: ['treemap'] }),
        enterprise: true,
    },
    SIMPLE_HISTOGRAM_CHART_EXAMPLE: {
        options: examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['histogram'] }),
        enterprise: true,
    },
    SIMPLE_SANKEY_EXAMPLE: {
        options: examples.SIMPLE_SANKEY_EXAMPLE,
        assertions: flowProportionChartAssertions({ seriesTypes: ['sankey'] }),
        enterprise: true,
    },
    SIMPLE_CHORD_EXAMPLE: {
        options: examples.SIMPLE_CHORD_EXAMPLE,
        assertions: flowProportionChartAssertions({ seriesTypes: ['chord'] }),
        enterprise: true,
    },
    HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE: {
        options: examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['histogram'] }),
        enterprise: true,
    },
    XY_HISTOGRAM_WITH_MEAN_EXAMPLE: {
        options: examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'number' }, seriesTypes: ['histogram'] }),
        enterprise: true,
    },
    GROUPED_CATEGORY_AXIS_EXAMPLE: {
        options: examples.GROUPED_CATEGORY_AXIS_EXAMPLE,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'grouped-category', y: 'number' },
            seriesTypes: ['bar'],
        }),
        enterprise: false,
    },
    CROSS_LINES_EXAMPLE: {
        options: examples.CROSS_LINES_EXAMPLE,
        assertions: cartesianChartAssertions({ seriesTypes: repeat('bar', 2) }),
        enterprise: false,
    },
    ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS: {
        options: examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'time', y: 'number' },
            seriesTypes: ['line', 'line', 'line', 'line'],
        }),
        enterprise: false,
    },
    SIMPLE_RADIAL_GAUGE_EXAMPLE: {
        type: 'gauge',
        options: examples.SIMPLE_RADIAL_GAUGE_EXAMPLE,
        assertions: gaugeAssertions(),
        enterprise: true,
    },
    SIMPLE_LINEAR_GAUGE_EXAMPLE: {
        type: 'gauge',
        options: examples.SIMPLE_LINEAR_GAUGE_EXAMPLE,
        assertions: gaugeAssertions(),
        enterprise: true,
    },
} satisfies Record<string, TestCase>;

export const EXAMPLES: Record<string, ChartTestCase> = Object.keys(COMMUNITY_AND_ENTERPRISE_EXAMPLES)
    .filter((k) => !(COMMUNITY_AND_ENTERPRISE_EXAMPLES as Record<string, TestCase>)[k].enterprise)
    .reduce<Record<string, ChartTestCase>>((pv, k) => {
        const testCase = (COMMUNITY_AND_ENTERPRISE_EXAMPLES as Record<string, TestCase>)[k];
        if (testCase.type !== 'gauge') {
            pv[k] = testCase;
        }
        return pv;
    }, {});
