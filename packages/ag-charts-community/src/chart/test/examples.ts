import type { InternalAgPatternColor } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgGaugeOptions,
    AgHierarchyChartOptions,
    AgPatternName,
    AgPolarChartOptions,
} from 'ag-charts-types';

import {
    DATA_APPLE_REVENUE_BY_PRODUCT,
    DATA_BROWSER_MARKET_SHARE,
    DATA_BROWSER_MARKET_SHARE_MISSING_FIRST_Y,
    DATA_BROWSER_MARKET_SHARE_MISSING_X,
    DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    DATA_MEAN_SEA_LEVEL,
    DATA_MISSING_X,
    DATA_REVENUE,
    DATA_SINGLE_DATUM_TIME_SENSOR,
    DATA_TIME_MISSING_X,
    DATA_TIME_SENSOR,
    DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY,
    DATA_VISITORS,
} from './data';
import { loadExampleOptions } from './load-example';

export const DOCS_EXAMPLES = {
    '100--stacked-area': loadExampleOptions('100--stacked-area'),
    '100--stacked-bar': loadExampleOptions('100--stacked-bar'),
    '100--stacked-column': loadExampleOptions('100--stacked-column'),
    'area-with-negative-values': loadExampleOptions('area-with-negative-values'),
    'bar-with-labels': loadExampleOptions('bar-with-labels'),
    'bubble-with-categories': loadExampleOptions('bubble-with-categories'),
    'bubble-with-negative-values': loadExampleOptions('bubble-with-negative-values'),
    'chart-customisation': loadExampleOptions('chart-customisation'),
    'column-with-negative-values': loadExampleOptions('column-with-negative-values'),
    'combination-of-different-series-types': loadExampleOptions('combination-of-different-series-types'),
    'cross-lines': loadExampleOptions('cross-lines'),
    'custom-marker-shapes': loadExampleOptions('custom-marker-shapes'),
    'custom-tooltips': loadExampleOptions('custom-tooltips'),
    'grouped-bar': loadExampleOptions('grouped-bar'),
    'grouped-column': loadExampleOptions('grouped-column'),
    'grouped-category': loadExampleOptions('grouped-category'),
    'histogram-with-specified-bins': loadExampleOptions('histogram-with-specified-bins'),
    'line-with-gaps': loadExampleOptions('line-with-gaps'),
    'log-axis': loadExampleOptions('log-axis'),
    'per-marker-customisation': loadExampleOptions('per-marker-customisation'),
    'pie-in-a-donut': loadExampleOptions('pie-in-a-donut'),
    'pie-with-variable-radius': loadExampleOptions('pie-with-variable-radius'),
    'simple-area': loadExampleOptions('simple-area'),
    'simple-bar': loadExampleOptions('simple-bar'),
    'simple-bubble': loadExampleOptions('simple-bubble'),
    'simple-column': loadExampleOptions('simple-column'),
    'simple-donut': loadExampleOptions('simple-donut'),
    'simple-histogram': loadExampleOptions('simple-histogram'),
    'simple-line': loadExampleOptions('simple-line'),
    'simple-pie': loadExampleOptions('simple-pie'),
    'simple-scatter': loadExampleOptions('simple-scatter'),
    'simple-sunburst': loadExampleOptions('simple-sunburst'),
    'simple-sankey': loadExampleOptions('simple-sankey'),
    'simple-chord': loadExampleOptions('simple-chord'),
    'simple-radial-gauge': loadExampleOptions('simple-radial-gauge'),
    'simple-linear-gauge': loadExampleOptions('simple-linear-gauge'),
    'stacked-area': loadExampleOptions('stacked-area'),
    'stacked-bar': loadExampleOptions('stacked-bar'),
    'stacked-column': loadExampleOptions('stacked-column'),
    'time-axis-with-irregular-intervals': loadExampleOptions('time-axis-with-irregular-intervals'),
    'treemap-with-color-range': loadExampleOptions('treemap-with-color-range'),
    'xy-histogram-with-mean-aggregation': loadExampleOptions('xy-histogram-with-mean-aggregation'),
};

export const GROUPED_CATEGORY_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['grouped-category'];
export const BAR_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-bar'];
export const GROUPED_BAR_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['grouped-bar'];
export const STACKED_BAR_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['stacked-bar'];
export const ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['100--stacked-bar'];
export const BAR_CHART_WITH_LABELS_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['bar-with-labels'];
export const SIMPLE_COLUMN_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-column'];
export const GROUPED_COLUMN_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['grouped-column'];
export const STACKED_COLUMN_GRAPH_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['stacked-column'];
export const ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['100--stacked-column'];
export const COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['column-with-negative-values'];
export const SIMPLE_PIE_CHART_EXAMPLE: AgPolarChartOptions = DOCS_EXAMPLES['simple-pie'];
export const SIMPLE_DONUT_CHART_EXAMPLE: AgPolarChartOptions = DOCS_EXAMPLES['simple-donut'];
export const PIE_IN_A_DONUT: AgPolarChartOptions = DOCS_EXAMPLES['pie-in-a-donut'];
export const SIMPLE_LINE_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-line'];
export const LINE_GRAPH_WITH_GAPS_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['line-with-gaps'];
export const SIMPLE_SCATTER_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-scatter'];
export const BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['bubble-with-negative-values'];
export const BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['bubble-with-categories'];
export const SIMPLE_AREA_GRAPH_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-area'];
export const STACKED_AREA_GRAPH_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['stacked-area'];
export const ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['100--stacked-area'];
export const AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['area-with-negative-values'];
export const SIMPLE_SUNBURST_EXAMPLE: AgPolarChartOptions = DOCS_EXAMPLES['simple-sunburst'];
export const SIMPLE_SANKEY_EXAMPLE: AgPolarChartOptions = DOCS_EXAMPLES['simple-sankey'];
export const SIMPLE_CHORD_EXAMPLE: AgPolarChartOptions = DOCS_EXAMPLES['simple-chord'];
export const SIMPLE_RADIAL_GAUGE_EXAMPLE: AgGaugeOptions = DOCS_EXAMPLES['simple-radial-gauge'];
export const SIMPLE_LINEAR_GAUGE_EXAMPLE: AgGaugeOptions = DOCS_EXAMPLES['simple-linear-gauge'];
export const TREEMAP_WITH_COLOR_RANGE_EXAMPLE: AgHierarchyChartOptions = DOCS_EXAMPLES['treemap-with-color-range'];
export const SIMPLE_HISTOGRAM_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-histogram'];
export const HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['histogram-with-specified-bins'];
export const XY_HISTOGRAM_WITH_MEAN_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['xy-histogram-with-mean-aggregation'];
export const CROSS_LINES_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['cross-lines'];

export const GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY,
    axes: {
        x: { type: 'grouped-category', position: 'bottom' },
        y: { type: 'number', position: 'left', label: { formatter: usdFormatter } },
    },
    series: [
        {
            xKey: 'grouping',
            xName: 'Group',
            yKey: 'totalWinnings',
            yName: 'Total Winnings',
            showInLegend: false,
            grouped: true,
            type: 'bar',
        },
    ],
    title: {
        text: 'Total Winnings by Country & Game',
    },
};

function usdFormatter({ value }: { value: number }) {
    const absolute = Math.abs(value);
    let standardised = '';

    if (absolute < 1e3) {
        standardised = String(absolute);
    }
    if (absolute >= 1e3 && absolute < 1e6) {
        standardised = '$' + +(absolute / 1e3).toFixed(1) + 'K';
    }
    if (absolute >= 1e6 && absolute < 1e9) {
        standardised = '$' + +(absolute / 1e6).toFixed(1) + 'M';
    }
    if (absolute >= 1e9 && absolute < 1e12) {
        standardised = '$' + +(absolute / 1e9).toFixed(1) + 'B';
    }
    if (absolute >= 1e12) {
        standardised = '$' + +(absolute / 1e12).toFixed(1) + 'T';
    }
    return value < 0 ? '-' + standardised : standardised;
}

export const INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions & { mode: string } = {
    mode: 'integrated',
    data: [
        {
            'ag-Grid-AutoColumn-country': { value: ['Enchanted Kingdom of Celestria', '2008'] },
            gold: 8,
            silver: 0,
            bronze: 0,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Enchanted Kingdom of Celestria', '2008'] },
            gold: 1,
            silver: 2,
            bronze: 3,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Enchanted Kingdom of Celestria', '2008'] },
            gold: 8,
            silver: 0,
            bronze: 0,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Enchanted Kingdom of Celestria', '2008'] },
            gold: 1,
            silver: 2,
            bronze: 3,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Whimsical Wonderland of Dreamlandia'] },
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Whimsical Wonderland of Dreamlandia', '2004'] },
            gold: 6,
            silver: 0,
            bronze: 2,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Whimsical Wonderland of Dreamlandia', '2004'] },
            gold: 6,
            silver: 0,
            bronze: 2,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Eternal Empire of Nebulon'] },
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Eternal Empire of Nebulon', '2012'] },
            gold: 4,
            silver: 2,
            bronze: 0,
        },
        {
            'ag-Grid-AutoColumn-country': { value: ['Eternal Empire of Nebulon', '2012'] },
            gold: 4,
            silver: 2,
            bronze: 0,
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn-country',
            xName: 'Country',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn-country',
            xName: 'Country',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn-country',
            xName: 'Country',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

export const INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE: AgCartesianChartOptions & {
    mode: string;
} = {
    ...INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE,
    navigator: {
        enabled: true,
        height: 10,
        miniChart: { enabled: true },
    },
};

export const INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions & { mode: string } = {
    mode: 'integrated',
    data: [
        {
            'ag-Grid-AutoColumn': ['United States'],
            '2000_gold': 130,
            '2000_silver': 61,
            '2000_bronze': 52,
            '2002_gold': 11,
            '2002_silver': 58,
            '2002_bronze': 15,
            '2004_gold': 118,
            '2004_silver': 75,
            '2004_bronze': 72,
            '2006_gold': 9,
            '2006_silver': 11,
            '2006_bronze': 32,
            '2008_gold': 127,
            '2008_silver': 109,
            '2008_bronze': 81,
            '2010_gold': 12,
            '2010_silver': 63,
            '2010_bronze': 22,
            '2012_gold': 145,
            '2012_silver': 63,
            '2012_bronze': 46,
        },
        {
            'ag-Grid-AutoColumn': ['Russia'],
            '2000_gold': 66,
            '2000_silver': 67,
            '2000_bronze': 54,
            '2002_gold': 6,
            '2002_silver': 5,
            '2002_bronze': 27,
            '2004_gold': 47,
            '2004_silver': 47,
            '2004_bronze': 97,
            '2006_gold': 16,
            '2006_silver': 12,
            '2006_bronze': 13,
            '2008_gold': 43,
            '2008_silver': 46,
            '2008_bronze': 57,
            '2010_gold': 6,
            '2010_silver': 5,
            '2010_bronze': 14,
            '2012_gold': 50,
            '2012_silver': 39,
            '2012_bronze': 51,
        },
        {
            'ag-Grid-AutoColumn': ['Australia'],
            '2000_gold': 60,
            '2000_silver': 69,
            '2000_bronze': 54,
            '2002_gold': 2,
            '2002_silver': 0,
            '2002_bronze': 0,
            '2004_gold': 49,
            '2004_silver': 77,
            '2004_bronze': 30,
            '2006_gold': 1,
            '2006_silver': 0,
            '2006_bronze': 1,
            '2008_gold': 31,
            '2008_silver': 42,
            '2008_bronze': 76,
            '2010_gold': 2,
            '2010_silver': 1,
            '2010_bronze': 0,
            '2012_gold': 18,
            '2012_silver': 37,
            '2012_bronze': 59,
        },
        {
            'ag-Grid-AutoColumn': ['Canada'],
            '2000_gold': 4,
            '2000_silver': 4,
            '2000_bronze': 23,
            '2002_gold': 52,
            '2002_silver': 7,
            '2002_bronze': 15,
            '2004_gold': 3,
            '2004_silver': 10,
            '2004_bronze': 4,
            '2006_gold': 30,
            '2006_silver': 28,
            '2006_bronze': 11,
            '2008_gold': 11,
            '2008_silver': 13,
            '2008_bronze': 10,
            '2010_gold': 67,
            '2010_silver': 15,
            '2010_bronze': 8,
            '2012_gold': 1,
            '2012_silver': 21,
            '2012_bronze': 33,
        },
        {
            'ag-Grid-AutoColumn': ['Norway'],
            '2000_gold': 20,
            '2000_silver': 4,
            '2000_bronze': 19,
            '2002_gold': 23,
            '2002_silver': 11,
            '2002_bronze': 7,
            '2004_gold': 5,
            '2004_silver': 0,
            '2004_bronze': 2,
            '2006_gold': 2,
            '2006_silver': 9,
            '2006_bronze': 12,
            '2008_gold': 16,
            '2008_silver': 5,
            '2008_bronze': 1,
            '2010_gold': 16,
            '2010_silver': 14,
            '2010_bronze': 9,
            '2012_gold': 15,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['China'],
            '2000_gold': 39,
            '2000_silver': 23,
            '2000_bronze': 17,
            '2002_gold': 2,
            '2002_silver': 5,
            '2002_bronze': 9,
            '2004_gold': 52,
            '2004_silver': 27,
            '2004_bronze': 15,
            '2006_gold': 2,
            '2006_silver': 5,
            '2006_bronze': 6,
            '2008_gold': 74,
            '2008_silver': 53,
            '2008_bronze': 57,
            '2010_gold': 9,
            '2010_silver': 3,
            '2010_bronze': 7,
            '2012_gold': 56,
            '2012_silver': 40,
            '2012_bronze': 29,
        },
        {
            'ag-Grid-AutoColumn': ['Zimbabwe'],
            '2004_gold': 1,
            '2004_silver': 1,
            '2004_bronze': 1,
            '2008_gold': 1,
            '2008_silver': 3,
            '2008_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Netherlands'],
            '2000_gold': 27,
            '2000_silver': 29,
            '2000_bronze': 23,
            '2002_gold': 3,
            '2002_silver': 5,
            '2002_bronze': 0,
            '2004_gold': 4,
            '2004_silver': 51,
            '2004_bronze': 22,
            '2006_gold': 3,
            '2006_silver': 2,
            '2006_bronze': 8,
            '2008_gold': 39,
            '2008_silver': 18,
            '2008_bronze': 4,
            '2010_gold': 4,
            '2010_silver': 1,
            '2010_bronze': 6,
            '2012_gold': 21,
            '2012_silver': 29,
            '2012_bronze': 19,
        },
        {
            'ag-Grid-AutoColumn': ['South Korea'],
            '2000_gold': 12,
            '2000_silver': 26,
            '2000_bronze': 35,
            '2002_gold': 5,
            '2002_silver': 2,
            '2002_bronze': 0,
            '2004_gold': 14,
            '2004_silver': 28,
            '2004_bronze': 10,
            '2006_gold': 14,
            '2006_silver': 3,
            '2006_bronze': 2,
            '2008_gold': 41,
            '2008_silver': 11,
            '2008_bronze': 26,
            '2010_gold': 6,
            '2010_silver': 10,
            '2010_bronze': 2,
            '2012_gold': 18,
            '2012_silver': 13,
            '2012_bronze': 30,
        },
        {
            'ag-Grid-AutoColumn': ['Croatia'],
            '2000_gold': 1,
            '2000_silver': 0,
            '2000_bronze': 9,
            '2002_gold': 3,
            '2002_silver': 1,
            '2002_bronze': 0,
            '2004_gold': 15,
            '2004_silver': 3,
            '2004_bronze': 3,
            '2006_gold': 1,
            '2006_silver': 2,
            '2006_bronze': 0,
            '2008_gold': 0,
            '2008_silver': 2,
            '2008_bronze': 3,
            '2010_gold': 0,
            '2010_silver': 2,
            '2010_bronze': 1,
            '2012_gold': 15,
            '2012_silver': 4,
            '2012_bronze': 16,
        },
        {
            'ag-Grid-AutoColumn': ['France'],
            '2000_gold': 22,
            '2000_silver': 30,
            '2000_bronze': 14,
            '2002_gold': 5,
            '2002_silver': 5,
            '2002_bronze': 5,
            '2004_gold': 21,
            '2004_silver': 10,
            '2004_bronze': 22,
            '2006_gold': 3,
            '2006_silver': 2,
            '2006_bronze': 10,
            '2008_gold': 25,
            '2008_silver': 24,
            '2008_bronze': 28,
            '2010_gold': 2,
            '2010_silver': 6,
            '2010_bronze': 6,
            '2012_gold': 30,
            '2012_silver': 30,
            '2012_bronze': 18,
        },
        {
            'ag-Grid-AutoColumn': ['Japan'],
            '2000_gold': 5,
            '2000_silver': 31,
            '2000_bronze': 8,
            '2002_gold': 0,
            '2002_silver': 1,
            '2002_bronze': 1,
            '2004_gold': 21,
            '2004_silver': 20,
            '2004_bronze': 52,
            '2006_gold': 1,
            '2006_silver': 0,
            '2006_bronze': 0,
            '2008_gold': 23,
            '2008_silver': 11,
            '2008_bronze': 17,
            '2010_gold': 0,
            '2010_silver': 5,
            '2010_bronze': 2,
            '2012_gold': 7,
            '2012_silver': 44,
            '2012_bronze': 33,
        },
        {
            'ag-Grid-AutoColumn': ['Hungary'],
            '2000_gold': 25,
            '2000_silver': 24,
            '2000_bronze': 4,
            '2004_gold': 24,
            '2004_silver': 12,
            '2004_bronze': 4,
            '2008_gold': 16,
            '2008_silver': 8,
            '2008_bronze': 3,
            '2012_gold': 12,
            '2012_silver': 8,
            '2012_bronze': 5,
        },
        {
            'ag-Grid-AutoColumn': ['Germany'],
            '2000_gold': 31,
            '2000_silver': 23,
            '2000_bronze': 64,
            '2002_gold': 26,
            '2002_silver': 23,
            '2002_bronze': 12,
            '2004_gold': 41,
            '2004_silver': 45,
            '2004_bronze': 63,
            '2006_gold': 23,
            '2006_silver': 25,
            '2006_bronze': 6,
            '2008_gold': 42,
            '2008_silver': 16,
            '2008_bronze': 41,
            '2010_gold': 15,
            '2010_silver': 24,
            '2010_bronze': 15,
            '2012_gold': 45,
            '2012_silver': 27,
            '2012_bronze': 22,
        },
        {
            'ag-Grid-AutoColumn': ['Poland'],
            '2000_gold': 7,
            '2000_silver': 10,
            '2000_bronze': 7,
            '2002_gold': 0,
            '2002_silver': 1,
            '2002_bronze': 1,
            '2004_gold': 4,
            '2004_silver': 2,
            '2004_bronze': 6,
            '2006_gold': 0,
            '2006_silver': 1,
            '2006_bronze': 1,
            '2008_gold': 6,
            '2008_silver': 13,
            '2008_bronze': 1,
            '2010_gold': 1,
            '2010_silver': 3,
            '2010_bronze': 4,
            '2012_gold': 2,
            '2012_silver': 2,
            '2012_bronze': 8,
        },
        {
            'ag-Grid-AutoColumn': ['South Africa'],
            '2000_gold': 0,
            '2000_silver': 2,
            '2000_bronze': 3,
            '2004_gold': 4,
            '2004_silver': 3,
            '2004_bronze': 3,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 0,
            '2012_gold': 6,
            '2012_silver': 2,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Sweden'],
            '2000_gold': 4,
            '2000_silver': 20,
            '2000_bronze': 8,
            '2002_gold': 0,
            '2002_silver': 2,
            '2002_bronze': 24,
            '2004_gold': 5,
            '2004_silver': 5,
            '2004_bronze': 2,
            '2006_gold': 35,
            '2006_silver': 21,
            '2006_bronze': 8,
            '2008_gold': 0,
            '2008_silver': 5,
            '2008_bronze': 2,
            '2010_gold': 11,
            '2010_silver': 3,
            '2010_bronze': 4,
            '2012_gold': 2,
            '2012_silver': 17,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Ukraine'],
            '2000_gold': 3,
            '2000_silver': 20,
            '2000_bronze': 12,
            '2004_gold': 9,
            '2004_silver': 8,
            '2004_bronze': 31,
            '2006_gold': 0,
            '2006_silver': 0,
            '2006_bronze': 3,
            '2008_gold': 10,
            '2008_silver': 5,
            '2008_bronze': 16,
            '2012_gold': 9,
            '2012_silver': 5,
            '2012_bronze': 12,
        },
        {
            'ag-Grid-AutoColumn': ['Italy'],
            '2000_gold': 22,
            '2000_silver': 14,
            '2000_bronze': 29,
            '2002_gold': 4,
            '2002_silver': 11,
            '2002_bronze': 6,
            '2004_gold': 24,
            '2004_silver': 41,
            '2004_bronze': 39,
            '2006_gold': 11,
            '2006_silver': 0,
            '2006_bronze': 14,
            '2008_gold': 8,
            '2008_silver': 14,
            '2008_bronze': 21,
            '2010_gold': 1,
            '2010_silver': 1,
            '2010_bronze': 3,
            '2012_gold': 16,
            '2012_silver': 22,
            '2012_bronze': 30,
        },
        {
            'ag-Grid-AutoColumn': ['Czech Republic'],
            '2000_gold': 2,
            '2000_silver': 3,
            '2000_bronze': 4,
            '2002_gold': 1,
            '2002_silver': 2,
            '2002_bronze': 0,
            '2004_gold': 1,
            '2004_silver': 6,
            '2004_bronze': 5,
            '2006_gold': 1,
            '2006_silver': 2,
            '2006_bronze': 24,
            '2008_gold': 3,
            '2008_silver': 4,
            '2008_bronze': 0,
            '2010_gold': 2,
            '2010_silver': 0,
            '2010_bronze': 7,
            '2012_gold': 4,
            '2012_silver': 4,
            '2012_bronze': 6,
        },
        {
            'ag-Grid-AutoColumn': ['Austria'],
            '2000_gold': 3,
            '2000_silver': 1,
            '2000_bronze': 0,
            '2002_gold': 3,
            '2002_silver': 4,
            '2002_bronze': 13,
            '2004_gold': 3,
            '2004_silver': 4,
            '2004_bronze': 1,
            '2006_gold': 16,
            '2006_silver': 7,
            '2006_bronze': 7,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 2,
            '2010_gold': 11,
            '2010_silver': 9,
            '2010_bronze': 6,
        },
        {
            'ag-Grid-AutoColumn': ['Finland'],
            '2000_gold': 3,
            '2000_silver': 1,
            '2000_bronze': 1,
            '2002_gold': 7,
            '2002_silver': 5,
            '2002_bronze': 1,
            '2004_gold': 0,
            '2004_silver': 2,
            '2004_bronze': 0,
            '2006_gold': 0,
            '2006_silver': 34,
            '2006_bronze': 7,
            '2008_gold': 1,
            '2008_silver': 2,
            '2008_bronze': 2,
            '2010_gold': 0,
            '2010_silver': 1,
            '2010_bronze': 46,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Romania'],
            '2000_gold': 27,
            '2000_silver': 6,
            '2000_bronze': 13,
            '2004_gold': 23,
            '2004_silver': 5,
            '2004_bronze': 11,
            '2008_gold': 5,
            '2008_silver': 1,
            '2008_bronze': 16,
            '2012_gold': 2,
            '2012_silver': 8,
            '2012_bronze': 6,
        },
        {
            'ag-Grid-AutoColumn': ['Great Britain'],
            '2000_gold': 22,
            '2000_silver': 20,
            '2000_bronze': 12,
            '2002_gold': 5,
            '2002_silver': 0,
            '2002_bronze': 1,
            '2004_gold': 17,
            '2004_silver': 25,
            '2004_bronze': 15,
            '2006_gold': 0,
            '2006_silver': 1,
            '2006_bronze': 0,
            '2008_gold': 31,
            '2008_silver': 25,
            '2008_bronze': 21,
            '2010_gold': 1,
            '2010_silver': 0,
            '2010_bronze': 0,
            '2012_gold': 48,
            '2012_silver': 30,
            '2012_bronze': 48,
        },
        {
            'ag-Grid-AutoColumn': ['Jamaica'],
            '2000_gold': 0,
            '2000_silver': 20,
            '2000_bronze': 3,
            '2004_gold': 6,
            '2004_silver': 1,
            '2004_bronze': 6,
            '2008_gold': 10,
            '2008_silver': 3,
            '2008_bronze': 6,
            '2012_gold': 8,
            '2012_silver': 9,
            '2012_bronze': 8,
        },
        {
            'ag-Grid-AutoColumn': ['Singapore'],
            '2008_gold': 0,
            '2008_silver': 3,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Belarus'],
            '2000_gold': 3,
            '2000_silver': 8,
            '2000_bronze': 11,
            '2002_gold': 0,
            '2002_silver': 0,
            '2002_bronze': 1,
            '2004_gold': 2,
            '2004_silver': 6,
            '2004_bronze': 9,
            '2006_gold': 0,
            '2006_silver': 1,
            '2006_bronze': 0,
            '2008_gold': 8,
            '2008_silver': 5,
            '2008_bronze': 17,
            '2010_gold': 1,
            '2010_silver': 1,
            '2010_bronze': 1,
            '2012_gold': 3,
            '2012_silver': 12,
            '2012_bronze': 8,
        },
        {
            'ag-Grid-AutoColumn': ['Chile'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 17,
            '2004_gold': 3,
            '2004_silver': 0,
            '2004_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Spain'],
            '2000_gold': 3,
            '2000_silver': 19,
            '2000_bronze': 20,
            '2004_gold': 4,
            '2004_silver': 17,
            '2004_bronze': 8,
            '2008_gold': 7,
            '2008_silver': 47,
            '2008_bronze': 16,
            '2012_gold': 5,
            '2012_silver': 33,
            '2012_bronze': 26,
        },
        {
            'ag-Grid-AutoColumn': ['Tunisia'],
            '2008_gold': 1,
            '2008_silver': 0,
            '2008_bronze': 0,
            '2012_gold': 1,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Brazil'],
            '2000_gold': 0,
            '2000_silver': 12,
            '2000_bronze': 36,
            '2004_gold': 18,
            '2004_silver': 19,
            '2004_bronze': 3,
            '2008_gold': 14,
            '2008_silver': 34,
            '2008_bronze': 26,
            '2012_gold': 14,
            '2012_silver': 34,
            '2012_bronze': 11,
        },
        {
            'ag-Grid-AutoColumn': ['Slovakia'],
            '2000_gold': 2,
            '2000_silver': 3,
            '2000_bronze': 1,
            '2004_gold': 3,
            '2004_silver': 2,
            '2004_bronze': 5,
            '2006_gold': 0,
            '2006_silver': 1,
            '2006_bronze': 0,
            '2008_gold': 4,
            '2008_silver': 5,
            '2008_bronze': 1,
            '2010_gold': 1,
            '2010_silver': 1,
            '2010_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Costa Rica'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Bulgaria'],
            '2000_gold': 5,
            '2000_silver': 6,
            '2000_bronze': 2,
            '2002_gold': 0,
            '2002_silver': 1,
            '2002_bronze': 2,
            '2004_gold': 2,
            '2004_silver': 1,
            '2004_bronze': 14,
            '2006_gold': 0,
            '2006_silver': 1,
            '2006_bronze': 0,
            '2008_gold': 1,
            '2008_silver': 1,
            '2008_bronze': 3,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Switzerland'],
            '2000_gold': 1,
            '2000_silver': 11,
            '2000_bronze': 2,
            '2002_gold': 3,
            '2002_silver': 7,
            '2002_bronze': 14,
            '2004_gold': 1,
            '2004_silver': 2,
            '2004_bronze': 4,
            '2006_gold': 5,
            '2006_silver': 7,
            '2006_bronze': 9,
            '2008_gold': 3,
            '2008_silver': 1,
            '2008_bronze': 7,
            '2010_gold': 6,
            '2010_silver': 0,
            '2010_bronze': 6,
            '2012_gold': 2,
            '2012_silver': 2,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['New Zealand'],
            '2000_gold': 1,
            '2000_silver': 0,
            '2000_bronze': 3,
            '2004_gold': 4,
            '2004_silver': 2,
            '2004_bronze': 0,
            '2008_gold': 4,
            '2008_silver': 2,
            '2008_bronze': 9,
            '2012_gold': 9,
            '2012_silver': 3,
            '2012_bronze': 15,
        },
        {
            'ag-Grid-AutoColumn': ['Estonia'],
            '2000_gold': 1,
            '2000_silver': 0,
            '2000_bronze': 2,
            '2002_gold': 1,
            '2002_silver': 1,
            '2002_bronze': 1,
            '2004_gold': 0,
            '2004_silver': 1,
            '2004_bronze': 2,
            '2006_gold': 3,
            '2006_silver': 0,
            '2006_bronze': 0,
            '2008_gold': 1,
            '2008_silver': 2,
            '2008_bronze': 0,
            '2010_gold': 0,
            '2010_silver': 1,
            '2010_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Kenya'],
            '2000_gold': 2,
            '2000_silver': 3,
            '2000_bronze': 2,
            '2004_gold': 1,
            '2004_silver': 4,
            '2004_bronze': 2,
            '2008_gold': 6,
            '2008_silver': 4,
            '2008_bronze': 4,
            '2012_gold': 2,
            '2012_silver': 4,
            '2012_bronze': 5,
        },
        {
            'ag-Grid-AutoColumn': ['Ethiopia'],
            '2000_gold': 4,
            '2000_silver': 1,
            '2000_bronze': 3,
            '2004_gold': 2,
            '2004_silver': 3,
            '2004_bronze': 2,
            '2008_gold': 4,
            '2008_silver': 1,
            '2008_bronze': 2,
            '2012_gold': 3,
            '2012_silver': 1,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Trinidad and Tobago'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 1,
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 6,
            '2008_bronze': 0,
            '2012_gold': 1,
            '2012_silver': 0,
            '2012_bronze': 9,
        },
        {
            'ag-Grid-AutoColumn': ['Turkey'],
            '2000_gold': 3,
            '2000_silver': 0,
            '2000_bronze': 2,
            '2004_gold': 3,
            '2004_silver': 3,
            '2004_bronze': 4,
            '2008_gold': 1,
            '2008_silver': 4,
            '2008_bronze': 3,
            '2012_gold': 2,
            '2012_silver': 2,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Morocco'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 4,
            '2004_gold': 2,
            '2004_silver': 1,
            '2004_bronze': 0,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Bahamas'],
            '2000_gold': 6,
            '2000_silver': 0,
            '2000_bronze': 5,
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 6,
            '2008_bronze': 1,
            '2012_gold': 4,
            '2012_silver': 0,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Slovenia'],
            '2000_gold': 3,
            '2000_silver': 0,
            '2000_bronze': 0,
            '2002_gold': 0,
            '2002_silver': 0,
            '2002_bronze': 4,
            '2004_gold': 0,
            '2004_silver': 2,
            '2004_bronze': 3,
            '2008_gold': 1,
            '2008_silver': 2,
            '2008_bronze': 2,
            '2010_gold': 0,
            '2010_silver': 2,
            '2010_bronze': 1,
            '2012_gold': 1,
            '2012_silver': 1,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Armenia'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 6,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Azerbaijan'],
            '2000_gold': 2,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 4,
            '2008_gold': 1,
            '2008_silver': 2,
            '2008_bronze': 4,
            '2012_gold': 2,
            '2012_silver': 2,
            '2012_bronze': 6,
        },
        {
            'ag-Grid-AutoColumn': ['India'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2004_gold': 0,
            '2004_silver': 1,
            '2004_bronze': 0,
            '2008_gold': 1,
            '2008_silver': 0,
            '2008_bronze': 2,
            '2012_gold': 0,
            '2012_silver': 2,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Puerto Rico'],
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Egypt'],
            '2004_gold': 1,
            '2004_silver': 1,
            '2004_bronze': 3,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 2,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Kazakhstan'],
            '2000_gold': 3,
            '2000_silver': 4,
            '2000_bronze': 0,
            '2004_gold': 1,
            '2004_silver': 4,
            '2004_bronze': 3,
            '2008_gold': 2,
            '2008_silver': 4,
            '2008_bronze': 7,
            '2010_gold': 0,
            '2010_silver': 1,
            '2010_bronze': 0,
            '2012_gold': 7,
            '2012_silver': 1,
            '2012_bronze': 5,
        },
        {
            'ag-Grid-AutoColumn': ['Iran'],
            '2000_gold': 3,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2004_gold': 2,
            '2004_silver': 2,
            '2004_bronze': 2,
            '2008_gold': 1,
            '2008_silver': 0,
            '2008_bronze': 1,
            '2012_gold': 4,
            '2012_silver': 5,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Georgia'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 6,
            '2004_gold': 2,
            '2004_silver': 2,
            '2004_bronze': 0,
            '2008_gold': 3,
            '2008_silver': 0,
            '2008_bronze': 3,
            '2012_gold': 1,
            '2012_silver': 3,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Lithuania'],
            '2000_gold': 2,
            '2000_silver': 0,
            '2000_bronze': 15,
            '2004_gold': 1,
            '2004_silver': 2,
            '2004_bronze': 0,
            '2008_gold': 0,
            '2008_silver': 2,
            '2008_bronze': 3,
            '2012_gold': 2,
            '2012_silver': 1,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Cuba'],
            '2000_gold': 18,
            '2000_silver': 35,
            '2000_bronze': 12,
            '2004_gold': 32,
            '2004_silver': 8,
            '2004_bronze': 22,
            '2008_gold': 2,
            '2008_silver': 34,
            '2008_bronze': 11,
            '2012_gold': 5,
            '2012_silver': 3,
            '2012_bronze': 6,
        },
        {
            'ag-Grid-AutoColumn': ['Colombia'],
            '2000_gold': 1,
            '2000_silver': 0,
            '2000_bronze': 0,
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 2,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 1,
            '2012_gold': 1,
            '2012_silver': 3,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Mongolia'],
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 1,
            '2008_gold': 2,
            '2008_silver': 2,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 2,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Uzbekistan'],
            '2000_gold': 1,
            '2000_silver': 1,
            '2000_bronze': 2,
            '2004_gold': 2,
            '2004_silver': 1,
            '2004_bronze': 2,
            '2008_gold': 1,
            '2008_silver': 2,
            '2008_bronze': 3,
            '2012_gold': 1,
            '2012_silver': 0,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['North Korea'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 3,
            '2004_gold': 0,
            '2004_silver': 4,
            '2004_bronze': 1,
            '2008_gold': 2,
            '2008_silver': 1,
            '2008_bronze': 3,
            '2012_gold': 4,
            '2012_silver': 0,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Tajikistan'],
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Kyrgyzstan'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Greece'],
            '2000_gold': 4,
            '2000_silver': 6,
            '2000_bronze': 8,
            '2004_gold': 8,
            '2004_silver': 18,
            '2004_bronze': 5,
            '2008_gold': 0,
            '2008_silver': 3,
            '2008_bronze': 4,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Macedonia'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Moldova'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Chinese Taipei'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 4,
            '2004_gold': 2,
            '2004_silver': 4,
            '2004_bronze': 3,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 4,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Indonesia'],
            '2000_gold': 2,
            '2000_silver': 4,
            '2000_bronze': 2,
            '2004_gold': 1,
            '2004_silver': 1,
            '2004_bronze': 3,
            '2008_gold': 2,
            '2008_silver': 2,
            '2008_bronze': 3,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Thailand'],
            '2000_gold': 1,
            '2000_silver': 0,
            '2000_bronze': 2,
            '2004_gold': 3,
            '2004_silver': 1,
            '2004_bronze': 4,
            '2008_gold': 2,
            '2008_silver': 2,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 2,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Vietnam'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 0,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Latvia'],
            '2000_gold': 1,
            '2000_silver': 1,
            '2000_bronze': 1,
            '2004_gold': 0,
            '2004_silver': 4,
            '2004_bronze': 0,
            '2006_gold': 0,
            '2006_silver': 0,
            '2006_bronze': 1,
            '2008_gold': 1,
            '2008_silver': 1,
            '2008_bronze': 1,
            '2010_gold': 0,
            '2010_silver': 3,
            '2010_bronze': 0,
            '2012_gold': 1,
            '2012_silver': 0,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Venezuela'],
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 2,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
            '2012_gold': 1,
            '2012_silver': 0,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Mexico'],
            '2000_gold': 1,
            '2000_silver': 2,
            '2000_bronze': 3,
            '2004_gold': 0,
            '2004_silver': 3,
            '2004_bronze': 1,
            '2008_gold': 2,
            '2008_silver': 0,
            '2008_bronze': 2,
            '2012_gold': 16,
            '2012_silver': 5,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Nigeria'],
            '2000_gold': 6,
            '2000_silver': 2,
            '2000_bronze': 0,
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 8,
            '2008_gold': 0,
            '2008_silver': 16,
            '2008_bronze': 7,
        },
        {
            'ag-Grid-AutoColumn': ['Qatar'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Serbia'],
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 14,
            '2012_gold': 1,
            '2012_silver': 1,
            '2012_bronze': 14,
        },
        {
            'ag-Grid-AutoColumn': ['Serbia and Montenegro'],
            '2000_gold': 11,
            '2000_silver': 1,
            '2000_bronze': 13,
            '2004_gold': 0,
            '2004_silver': 13,
            '2004_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Hong Kong'],
            '2004_gold': 0,
            '2004_silver': 2,
            '2004_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Denmark'],
            '2000_gold': 18,
            '2000_silver': 3,
            '2000_bronze': 4,
            '2004_gold': 19,
            '2004_silver': 0,
            '2004_bronze': 10,
            '2008_gold': 6,
            '2008_silver': 7,
            '2008_bronze': 6,
            '2012_gold': 3,
            '2012_silver': 5,
            '2012_bronze': 8,
        },
        {
            'ag-Grid-AutoColumn': ['Portugal'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 2,
            '2004_gold': 0,
            '2004_silver': 2,
            '2004_bronze': 1,
            '2008_gold': 1,
            '2008_silver': 1,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 2,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Argentina'],
            '2000_gold': 0,
            '2000_silver': 17,
            '2000_bronze': 3,
            '2004_gold': 28,
            '2004_silver': 0,
            '2004_bronze': 21,
            '2008_gold': 20,
            '2008_silver': 0,
            '2008_bronze': 31,
            '2012_gold': 1,
            '2012_silver': 17,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Afghanistan'],
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Gabon'],
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Dominican Republic'],
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 0,
            '2008_gold': 1,
            '2008_silver': 1,
            '2008_bronze': 0,
            '2012_gold': 1,
            '2012_silver': 1,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Belgium'],
            '2000_gold': 0,
            '2000_silver': 3,
            '2000_bronze': 4,
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 2,
            '2008_gold': 1,
            '2008_silver': 4,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 2,
        },
        {
            'ag-Grid-AutoColumn': ['Kuwait'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['United Arab Emirates'],
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Cyprus'],
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Israel'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Algeria'],
            '2000_gold': 1,
            '2000_silver': 1,
            '2000_bronze': 3,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 1,
            '2012_gold': 1,
            '2012_silver': 0,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Montenegro'],
            '2012_gold': 0,
            '2012_silver': 14,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Iceland'],
            '2000_gold': 0,
            '2000_silver': 0,
            '2000_bronze': 1,
            '2008_gold': 0,
            '2008_silver': 14,
            '2008_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Paraguay'],
            '2004_gold': 0,
            '2004_silver': 17,
            '2004_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Cameroon'],
            '2000_gold': 18,
            '2000_silver': 0,
            '2000_bronze': 0,
            '2004_gold': 1,
            '2004_silver': 0,
            '2004_bronze': 0,
            '2008_gold': 1,
            '2008_silver': 0,
            '2008_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Saudi Arabia'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 1,
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 4,
        },
        {
            'ag-Grid-AutoColumn': ['Ireland'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 0,
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 2,
            '2012_gold': 1,
            '2012_silver': 1,
            '2012_bronze': 3,
        },
        {
            'ag-Grid-AutoColumn': ['Malaysia'],
            '2008_gold': 0,
            '2008_silver': 1,
            '2008_bronze': 0,
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Uruguay'],
            '2000_gold': 0,
            '2000_silver': 1,
            '2000_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Togo'],
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Mauritius'],
            '2008_gold': 0,
            '2008_silver': 0,
            '2008_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Syria'],
            '2004_gold': 0,
            '2004_silver': 0,
            '2004_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': ['Botswana'],
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Guatemala'],
            '2012_gold': 0,
            '2012_silver': 1,
            '2012_bronze': 0,
        },
        {
            'ag-Grid-AutoColumn': ['Bahrain'],
            '2012_gold': 0,
            '2012_silver': 0,
            '2012_bronze': 1,
        },
        {
            'ag-Grid-AutoColumn': [''],
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
            label: { avoidCollisions: false },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2000_gold',
            yName: '2000 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2000_silver',
            yName: '2000 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2000_bronze',
            yName: '2000 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2002_gold',
            yName: '2002 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2002_silver',
            yName: '2002 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2002_bronze',
            yName: '2002 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2004_gold',
            yName: '2004 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2004_silver',
            yName: '2004 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2004_bronze',
            yName: '2004 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2006_gold',
            yName: '2006 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2006_silver',
            yName: '2006 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2006_bronze',
            yName: '2006 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2008_gold',
            yName: '2008 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2008_silver',
            yName: '2008 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2008_bronze',
            yName: '2008 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2010_gold',
            yName: '2010 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2010_silver',
            yName: '2010 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2010_bronze',
            yName: '2010 - Bronze',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2012_gold',
            yName: '2012 - Gold',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2012_silver',
            yName: '2012 - Silver',
        },
        {
            type: 'bar',
            direction: 'vertical',
            stacked: false,
            xKey: 'ag-Grid-AutoColumn',
            xName: 'Group',
            yKey: '2012_bronze',
            yName: '2012 - Bronze',
        },
    ],
};

export const AREA_MISSING_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            marker: {
                size: 5,
            },
        },
    ],
    title: {
        text: 'Internet Explorer Market Share',
    },
    subtitle: {
        text: '2009-2019 (aka "good times")',
    },
};

export const STACKED_AREA_MISSING_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_BROWSER_MARKET_SHARE,
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'firefox',
            yName: 'Firefox',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
            marker: {
                enabled: true,
            },
        },
    ],
    title: {
        text: 'Browser Wars',
    },
    subtitle: {
        text: '2009-2019',
    },
};

export const STACKED_AREA_MISSING_Y_DATA_PER_SERIES_EXAMPLE: AgCartesianChartOptions = {
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            stacked: true,
            marker: {
                enabled: true,
            },
            data: DATA_BROWSER_MARKET_SHARE,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'firefox',
            yName: 'Firefox',
            stacked: true,
            marker: {
                enabled: true,
            },
            data: DATA_BROWSER_MARKET_SHARE,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
            marker: {
                enabled: true,
            },
            data: DATA_BROWSER_MARKET_SHARE,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
            marker: {
                enabled: true,
            },
            data: DATA_BROWSER_MARKET_SHARE,
        },
    ],
    title: {
        text: 'Browser Wars',
    },
    subtitle: {
        text: '2009-2019',
    },
};

export const STACKED_AREA_MISSING_FIRST_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_BROWSER_MARKET_SHARE_MISSING_FIRST_Y,
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
        },
    ],
};

export const AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_MISSING_X,
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const STACKED_AREA_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_MISSING_X,
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            stacked: true,
            marker: {
                size: 5,
            },
        },
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y2',
            stacked: true,
            marker: {
                size: 5,
            },
        },
    ],
};

export const STACKED_AREA_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y1',
            stacked: true,
            marker: {
                size: 5,
            },
        },
        {
            type: 'area',
            xKey: 'x',
            yKey: 'y2',
            stacked: true,
            marker: {
                size: 5,
            },
        },
    ],
};

const colorStops = [
    {
        stop: 0.2,
        color: 'orange',
    },
    {
        stop: 0.5,
        color: 'red',
    },
    {
        stop: 0.8,
        color: 'blue',
    },
];

export const AREA_SERIES_PATTERN_FILL: AgCartesianChartOptions = {
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'iphone',
            strokeWidth: 1,
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

function setPattern(
    options: AgCartesianChartOptions,
    pattern?: AgPatternName,
    path?: string,
    fillOptions?: Omit<InternalAgPatternColor, 'type'>
): AgCartesianChartOptions {
    return {
        ...options,
        theme: {
            overrides: {
                area: {
                    series: {
                        fill: {
                            type: 'pattern',
                            pattern,
                            path,
                            ...fillOptions,
                        },
                    },
                },
            },
        },
    };
}

export const AREA_SERIES_DEFAULT_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL);
export const AREA_SERIES_VERTICAL_LINES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'vertical-lines');
export const AREA_SERIES_HORIZONTAL_LINES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'horizontal-lines');
export const AREA_SERIES_FORWARD_SLANTED_LINES_PATTERN_FILL = setPattern(
    AREA_SERIES_PATTERN_FILL,
    'forward-slanted-lines'
);
export const AREA_SERIES_BACKWARD_SLANTED_LINES_PATTERN_FILL = setPattern(
    AREA_SERIES_PATTERN_FILL,
    'backward-slanted-lines'
);
export const AREA_SERIES_CIRCLES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'circles');
export const AREA_SERIES_SQUARES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'squares');
export const AREA_SERIES_TRIANGLES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'triangles');
export const AREA_SERIES_DIAMONDS_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'diamonds');
export const AREA_SERIES_STARS_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'stars');
export const AREA_SERIES_HEARTS_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'hearts');
export const AREA_SERIES_CROSSES_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'crosses');
export const AREA_SERIES_CUSTOM_SVG_PATH_PATTERN_FILL = setPattern(
    AREA_SERIES_PATTERN_FILL,
    undefined,
    'M 21.1841 20 C 21.5411 19.8697 21.9037 19.7359 22.2724 19.5983 C 22.6346 19.4632 23.8705 19 24.0399 18.9367 C 33.6397 15.3476 39.6469 14 50 14 C 60.2711 14 65.3618 15.2218 74.6286 18.9285 C 75.5844 19.3108 76.4979 19.6675 77.3788 20 L 83.604 20 C 81.0931 19.2694 78.465 18.309 75.3714 17.0715 C 65.8882 13.2782 60.5622 12 50 12 C 39.3741 12 33.1448 13.3974 23.3395 17.0633 C 23.1689 17.1271 21.9339 17.59 21.5733 17.7245 C 19.0985 18.6479 16.9127 19.3995 14.8494 20 L 21.1841 20 L 21.1841 20 Z M 21.1841 0 C 13.2575 2.89195 8.07673 4 7.87150e-14 4 L 7.81597e-14 4 L 0 2 C 5.74392 2 9.9514 1.42564 14.8494 1.40166e-15 L 21.1841 6.93889e-17 L 21.1841 0 Z M 77.3788 2.21706e-12 C 85.2386 2.96643 90.5023 4 100 4 L 100 2 C 93.1577 2 88.6144 1.45781 83.604 1.04805e-13 L 77.3788 0 L 77.3788 2.21706e-12 Z M 7.87150e-14 14 C 8.4405 14 13.7183 12.7899 22.2724 9.59833 C 22.6346 9.46317 23.8705 9 24.0399 8.93668 C 33.6397 5.34755 39.6469 4 50 4 C 60.2711 4 65.3618 5.22177 74.6286 8.92848 C 84.1118 12.7218 89.4378 14 100 14 L 100 12 C 89.7289 12 84.6382 10.7782 75.3714 7.07152 C 65.8882 3.27823 60.5622 2 50 2 C 39.3741 2 33.1448 3.39739 23.3395 7.06332 C 23.1689 7.12712 21.9339 7.58996 21.5733 7.7245 C 13.2235 10.8398 8.16351 12 0 12 L 7.81597e-14 14 L 7.87150e-14 14 L 7.87150e-14 14 Z',
    { width: 100, height: 20 }
);

export const AREA_SERIES_CUSTOMISED_PATTERN_FILL = setPattern(AREA_SERIES_PATTERN_FILL, 'circles', undefined, {
    width: 20,
    height: 20,
    fill: 'cyan',
    stroke: 'yellow',
    strokeWidth: 2,
    padding: 4,
    backgroundFill: 'black',
    backgroundFillOpacity: 0.4,
    fillOpacity: 0.9,
});

export const AREA_SERIES_VERTICAL_GRADIENT_FILL: AgCartesianChartOptions = {
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    theme: {
        overrides: {
            area: {
                series: {
                    fill: {
                        type: 'gradient',
                        colorStops,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'iphone',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const AREA_SERIES_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    theme: {
        overrides: {
            area: {
                series: {
                    fill: {
                        type: 'gradient',
                        rotation: 90,
                        colorStops,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'iphone',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const AREA_SERIES_DEFAULT_GRADIENT_FILL: AgCartesianChartOptions = {
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    theme: {
        overrides: {
            area: {
                series: {
                    fill: {
                        type: 'gradient',
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'iphone',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const AREA_SERIES_GRADIENT_FILL_AXES_BOUNDS: AgCartesianChartOptions = {
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    theme: {
        overrides: {
            area: {
                series: {
                    fill: {
                        type: 'gradient',
                        rotation: 90,
                        /* @ts-expect-error internal config option */
                        bounds: 'axis',
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'iphone',
        },
        {
            type: 'area',
            xKey: 'quarter',
            yKey: 'wearables',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const NORMALISED_STACKED_AREA: AgCartesianChartOptions = {
    data: DATA_BROWSER_MARKET_SHARE_MISSING_X,
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'ie',
            marker: {
                size: 5,
            },
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'firefox',
            marker: {
                size: 5,
            },
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'safari',
            marker: {
                size: 5,
            },
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'chrome',
            marker: {
                size: 5,
            },
            normalizedTo: 100,
            stacked: true,
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            data: DATA_TIME_SENSOR,
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
            type: 'line',
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_NUMBER_X_AXIS_TIME_Y_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'unit-time', position: 'left' },
    },
    series: [
        {
            type: 'line',
            data: DATA_TIME_SENSOR,
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
            type: 'line',
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_MISSING_Y_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_INTERNET_EXPLORER_MARKET_SHARE_BAD_Y_VALUE,
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            marker: {
                size: 5,
            },
        },
    ],
    title: {
        text: 'Internet Explorer Market Share',
    },
    subtitle: {
        text: '2009-2019 (aka "good times")',
    },
};

export const LINE_NUMBER_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_MISSING_X,
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const LINE_TIME_X_AXIS_MISSING_X_DATA_EXAMPLE: AgCartesianChartOptions = {
    data: DATA_TIME_MISSING_X,
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y1',
            marker: {
                size: 5,
            },
        },
    ],
};

export const LINE_NUMBER_AXES_0_X_DOMAIN: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
            type: 'line',
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const LINE_NUMBER_AXES_0_Y_DOMAIN: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'line',
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
            type: 'line',
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
        },
    ],
    legend: {
        position: 'right',
    },
};

export const AREA_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            data: DATA_TIME_SENSOR,
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
            marker: {
                size: 10,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
            marker: {
                size: 10,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

export const AREA_NUMBER_X_AXIS_TIME_Y_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'unit-time', position: 'left' },
    },
    series: [
        {
            data: DATA_TIME_SENSOR,
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR,
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

export const AREA_NUMBER_AXES_0_X_DOMAIN: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            xKey: 'time',
            yKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'right',
    },
};

export const AREA_NUMBER_AXES_0_Y_DOMAIN: AgCartesianChartOptions = {
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
            marker: {
                enabled: true,
            },
        },
        {
            data: DATA_SINGLE_DATUM_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            type: 'area',
            yKey: 'time',
            xKey: 'sensor',
            yName: 'External',
            marker: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'right',
    },
};

export const INVALID_AXIS_LABEL_FORMAT: AgCartesianChartOptions = {
    data: DATA_TIME_SENSOR,
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'sensor',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            interval: {
                maxSpacing: 20,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_POSITION_TOP_NUMBER_Y_AXIS_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'top',
            label: {
                format: '%Y',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            interval: {
                maxSpacing: 20,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS_POSITION_RIGHT_LABELS: AgCartesianChartOptions = {
    data: DATA_VISITORS,
    padding: {
        right: 400,
        bottom: 200,
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        y: {
            type: 'number',
            position: 'right',
            interval: {
                maxSpacing: 20,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
        },
    ],
};

export const LINE_STACKED_DATA_PER_SERIES: AgCartesianChartOptions = {
    series: [
        {
            data: [
                {
                    step: 1,
                    sensor: 25,
                },
                {
                    step: 2,
                    sensor: 24,
                },
                {
                    step: 3,
                    sensor: 24,
                },
                {
                    step: 4,
                    sensor: 23,
                },
            ],
            type: 'line',
            stacked: true,
            xKey: 'step',
            yKey: 'sensor',
            yName: 'Lounge',
        },
        {
            data: [
                {
                    step: 1,
                    sensor: 21,
                },
                {
                    step: 2,
                    sensor: 22,
                },
                {
                    step: 3,
                    sensor: 22,
                },
                {
                    step: 4,
                    sensor: 22,
                },
            ],
            type: 'line',
            stacked: true,
            xKey: 'step',
            yKey: 'sensor',
            yName: 'Office',
        },
    ],
};

export const LINE_STACKED_MISSING_DATA: AgCartesianChartOptions = {
    data: [
        { month: 'Jan', subscriptions: 222, services: 250, products: 200 },
        { month: 'Feb', subscriptions: 240, services: 255, products: 210 },
        { month: 'Mar', subscriptions: 280, services: 245, products: null },
        { month: 'Apr', subscriptions: 300, services: 260, products: 205 },
        { month: 'May', subscriptions: 350, services: 235, products: 215 },
        { month: 'Jun', subscriptions: 420, services: Infinity, products: 200 },
        { month: 'Jul', subscriptions: 300, services: 255, products: undefined },
        { month: 'Aug', subscriptions: 270, services: 305, products: 210 },
        { month: 'Sep', subscriptions: 260, services: 280, products: 250 },
        { month: 'Oct', subscriptions: 385, services: 250, products: Number.NaN },
        { month: 'Nov', subscriptions: 320, services: 265, products: 215 },
        { month: 'Dec', subscriptions: 330, services: 255, products: 220 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            stacked: true,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            stacked: true,
        },
    ],
};

export const COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'mm',
            showInLegend: false,
        },
    ],
    axes: {
        x: {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

export const COLUMN_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_REVENUE,
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const STACKED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
        },
    ],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const STACKED_COLUMN_PATTERN_FILL: AgCartesianChartOptions = {
    theme: {
        overrides: {
            bar: {
                series: {
                    fill: { type: 'pattern', pattern: 'backward-slanted-lines' },
                },
            },
        },
    },
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
    ],
    axes: {
        y: { type: 'number', position: 'left' },
        x: { type: 'category', position: 'bottom' },
    },
};

export const GROUPED_COLUMN_SMALL_PATTERN_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_PATTERN_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    fill: {
                        type: 'pattern',
                        pattern: 'circles',
                        width: 2,
                        height: 2,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            strokeWidth: 1,
            stroke: 'black',
        },
    ],
};

export const GROUPED_COLUMN_PATTERN_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_PATTERN_FILL,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            strokeWidth: 1,
            stroke: 'black',
        },
    ],
};

export const STACKED_COLUMN_GRADIENT_FILL: AgCartesianChartOptions = {
    theme: {
        overrides: {
            bar: {
                series: {
                    fill: { type: 'gradient' },
                },
            },
        },
    },
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            strokeWidth: 1,
            stroke: 'black',
        },
    ],
    axes: {
        y: { type: 'number', position: 'left' },
        x: { type: 'category', position: 'bottom' },
    },
};

export const STACKED_COLUMN_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    fill: { type: 'gradient', rotation: 90 },
                },
            },
        },
    },
};

export const STACKED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', bounds: 'series' },
                },
            },
        },
    },
};

export const STACKED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', rotation: 90, bounds: 'series' },
                },
            },
        },
    },
};

export const STACKED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', bounds: 'axis' },
                },
            },
        },
    },
};

export const STACKED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', rotation: 90, bounds: 'axis' },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_GRADIENT_FILL: AgCartesianChartOptions = {
    ...STACKED_COLUMN_GRADIENT_FILL,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            strokeWidth: 1,
            stroke: 'black',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            strokeWidth: 1,
            stroke: 'black',
        },
    ],
};

export const GROUPED_COLUMN_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    fill: { type: 'gradient', rotation: 90 },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_SERIES_BOUND_VERTICAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', bounds: 'series' },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_SERIES_BOUND_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', rotation: 90, bounds: 'series' },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_AXES_BOUND_VERTICAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', bounds: 'axis' },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_AXES_BOUND_HORIZONTAL_GRADIENT_FILL: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_GRADIENT_FILL,
    theme: {
        overrides: {
            bar: {
                series: {
                    /* @ts-expect-error internal config option */
                    fill: { type: 'gradient', rotation: 90, bounds: 'axis' },
                },
            },
        },
    },
};

export const GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: {
        x: { type: 'number', nice: false, position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            data: DATA_APPLE_REVENUE_BY_PRODUCT,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                mac: d.iphone / 2,
            })),
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPad',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                iphone: d.iphone / 3,
            })),
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'Wearables',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                iphone: d.iphone / 4,
            })),
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                services: d.iphone / 5,
            })),
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: AgCartesianChartOptions = {
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    series: [
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'iPad',
            data: [
                { product: 'Air', value: 140 },
                { product: 'Pro', value: 90 },
            ],
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'MacBook',
            data: [
                { product: 'Air', value: 20 },
                { product: 'Pro 15"', value: 20 },
                { product: 'Pro 16"', value: 50 },
            ],
        },
    ],
};

export const STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: AgCartesianChartOptions = {
    ...GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES,
    series: GROUPED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES.series?.map((s) => ({ ...s, stacked: true })),
};

export const STACKED_NORMALIZED_COLUMN_CATEGORY_DATA_PER_SERIES_DIFFERENT_CATEGORIES: AgCartesianChartOptions = {
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    series: [
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'iPad - Retail',
            data: [
                { product: 'Air', value: 400 },
                { product: 'Pro', value: 280 },
            ],
            stackGroup: 'ipad',
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'iPad - Student',
            data: [
                { product: 'Air', value: 140 },
                { product: 'Pro', value: 90 },
            ],
            stackGroup: 'ipad',
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'MacBook - Retail',
            data: [
                { product: 'Air', value: 205 },
                { product: 'Pro 15"', value: 195 },
                { product: 'Pro 16"', value: 500 },
            ],
            stackGroup: 'macbook',
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'MacBook - Student',
            data: [
                { product: 'Air', value: 20 },
                { product: 'Pro 16"', value: 50 },
            ],
            stackGroup: 'macbook',
            normalizedTo: 100,
        },
    ],
};

export const STACKED_COLUMN_CATEGORY_DATA_PER_SERIES: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            data: DATA_APPLE_REVENUE_BY_PRODUCT,
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                mac: d.iphone / 2,
            })),
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                ipad: d.iphone / 3,
            })),
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                wearables: d.iphone / 4,
            })),
            stackGroup: 'other',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                services: d.iphone / 5,
            })),
            stackGroup: 'other',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const STACKED_COLUMN_CATEGORY_DATA_PER_SERIES_CLASHING: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            data: DATA_APPLE_REVENUE_BY_PRODUCT,
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'Mac',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                iphone: d.iphone / 2,
            })),
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                ipad: d.iphone / 3,
            })),
            stackGroup: 'devices',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                wearables: d.iphone / 4,
            })),
            stackGroup: 'other',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Services',
            data: DATA_APPLE_REVENUE_BY_PRODUCT.map((d) => ({
                ...d,
                wearables: d.iphone / 5,
            })),
            stackGroup: 'other',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'time',
            yKey: 'mm',
            showInLegend: false,
        },
    ],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const BAR_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_REVENUE,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        y: { type: 'unit-time', position: 'left' },
        x: { type: 'number', position: 'bottom' },
    },
};

export const BAR_STACKED_AND_GROUPED_NUMBER_CRT_950: AgCartesianChartOptions = {
    data: [
        {
            quarter: "Q1'18",
            iphone: 140,
            mac: 100,
            wearables: 12,
        },
    ],
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            stackGroup: 'Devices',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stackGroup: 'Devices',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            label: {
                color: 'white',
            },
        },
    ],
    legend: {},
};

export const COLUMN_SINGLE_DATE_CATEGORY_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'bar',
            grouped: false,
            xKey: 'Created',
            yKey: 'IncidentID',
            yName: 'Incident ID',
            strokeWidth: 1,
            fillOpacity: 0.33,
        },
    ],
    data: [
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 3,
        },
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 4,
        },
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 5,
        },
    ],
};

export const COLUMN_SINGLE_DATE_TIME_AXIS: AgCartesianChartOptions = {
    axes: {
        x: { type: 'unit-time', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            type: 'bar',
            grouped: false,
            xKey: 'Created',
            yKey: 'IncidentID',
            yName: 'Incident ID',
            strokeWidth: 1,
            fillOpacity: 0.33,
        },
    ],
    data: [
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 3,
        },
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 4,
        },
        {
            Created: new Date('2023-06-09T13:36:28.668Z'),
            IncidentID: 5,
        },
    ],
};

export const STACKED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
        },
    ],
    axes: {
        x: { type: 'number', nice: false, position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const STACKED_BAR_NUMBER_X_AXIS_NEGATIVE_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_BROWSER_MARKET_SHARE,
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ie',
            yName: 'IE',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'firefox',
            yName: 'FireFox',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'safari',
            yName: 'Safari',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'chrome',
            yName: 'Chrome',
            stacked: true,
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const GROUPED_BAR_NUMBER_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

export const TRUNCATED_LEGEND_ITEMS: AgCartesianChartOptions = {
    title: {
        text: "Apple's revenue by product category",
    },
    subtitle: {
        text: 'in billion U.S. dollars',
    },
    data: DATA_APPLE_REVENUE_BY_PRODUCT,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'wearables',
            yName: 'Wearables long legend item text',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'iphone',
            yKey: 'services',
            yName: 'Services another long legend item text',
        },
    ],
    legend: {
        position: 'left',
        item: {
            paddingY: 15,
            maxWidth: 100,
        },
    },
};

export const CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS = (
    data: any[],
    seriesType: 'line' | 'bar' | 'area' | 'scatter' | 'histogram'
): AgCartesianChartOptions => {
    return {
        data,
        series: [
            {
                type: seriesType,
                xKey: 'os',
                yKey: 'share',
            },
        ],
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'log', position: 'left' },
        },
    };
};

// START ADVANCED EXAMPLES =========================================================================

export const ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS: AgCartesianChartOptions =
    DOCS_EXAMPLES['time-axis-with-irregular-intervals'];
export const LOG_AXIS_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['log-axis'];
export const ADV_COMBINATION_SERIES_CHART_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['combination-of-different-series-types'];
export const ADV_CHART_CUSTOMISATION: AgCartesianChartOptions = DOCS_EXAMPLES['chart-customisation'];
export const ADV_CUSTOM_MARKER_SHAPES_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['custom-marker-shapes'];
export const ADV_CUSTOM_TOOLTIPS_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['custom-tooltips'];
export const ADV_PER_MARKER_CUSTOMISATION: AgCartesianChartOptions = DOCS_EXAMPLES['per-marker-customisation'];
