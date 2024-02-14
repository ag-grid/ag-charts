import type {
    AgCartesianChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import {
    DATA_APPLE_REVENUE_BY_PRODUCT,
    DATA_BROWSER_MARKET_SHARE,
    DATA_BROWSER_MARKET_SHARE_MISSING_FIRST_Y,
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
    'histogram-with-specified-bins': loadExampleOptions('histogram-with-specified-bins'),
    'line-with-gaps': loadExampleOptions('line-with-gaps'),
    'log-axis': loadExampleOptions('log-axis'),
    'per-marker-customisation': loadExampleOptions('per-marker-customisation'),
    'pie-in-a-donut': loadExampleOptions('pie-in-a-donut'),
    'pie-with-variable-radius': loadExampleOptions('pie-with-variable-radius'),
    'real-time-data-updates': loadExampleOptions('real-time-data-updates'),
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
    'stacked-area': loadExampleOptions('stacked-area'),
    'stacked-bar': loadExampleOptions('stacked-bar'),
    'stacked-column': loadExampleOptions('stacked-column'),
    'time-axis-with-irregular-intervals': loadExampleOptions('time-axis-with-irregular-intervals'),
    'treemap-with-color-range': loadExampleOptions('treemap-with-color-range'),
    'xy-histogram-with-mean-aggregation': loadExampleOptions('xy-histogram-with-mean-aggregation'),
};

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
export const PIE_WITH_VARIABLE_RADIUS: AgPolarChartOptions = DOCS_EXAMPLES['pie-with-variable-radius'];
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
export const TREEMAP_WITH_COLOR_RANGE_EXAMPLE: AgHierarchyChartOptions = DOCS_EXAMPLES['treemap-with-color-range'];
export const SIMPLE_HISTOGRAM_CHART_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['simple-histogram'];
export const HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['histogram-with-specified-bins'];
export const XY_HISTOGRAM_WITH_MEAN_EXAMPLE: AgCartesianChartOptions =
    DOCS_EXAMPLES['xy-histogram-with-mean-aggregation'];
export const CROSS_LINES_EXAMPLE: AgCartesianChartOptions = DOCS_EXAMPLES['cross-lines'];

export const GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions = {};
{
    const usdFormatter = ({ value }: { value: number }) => {
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
    };

    Object.assign(GROUPED_CATEGORY_AXIS_EXAMPLE, {
        data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY,
        axes: [
            { type: 'grouped-category', position: 'bottom' },
            { type: 'number', position: 'left', label: { formatter: usdFormatter } },
        ],
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
    });
}

const prepareIntegratedChartsData = (data: any[], ...fields: string[]) => {
    return data.map((d) => {
        const result = { ...d };

        for (const field of fields) {
            const fieldData = result[field];
            result[field] = {
                ...result[field],
                toString: () =>
                    fieldData.labels
                        .filter((s: string) => !!s)
                        .reverse()
                        .join(' - '),
            };
        }

        return result;
    });
};

export const INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions & { mode: string } = {
    mode: 'integrated',
    data: prepareIntegratedChartsData(
        [
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '', 'Enchanted Kingdom of Celestria'],
                },
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2008', 'Enchanted Kingdom of Celestria'],
                },
                gold: 8,
                silver: 0,
                bronze: 0,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2008', 'Enchanted Kingdom of Celestria'],
                },
                gold: 1,
                silver: 2,
                bronze: 3,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2008', 'Enchanted Kingdom of Celestria'],
                },
                gold: 8,
                silver: 0,
                bronze: 0,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2008', 'Enchanted Kingdom of Celestria'],
                },
                gold: 1,
                silver: 2,
                bronze: 3,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '', 'Whimsical Wonderland of Dreamlandia'],
                },
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2004', 'Whimsical Wonderland of Dreamlandia'],
                },
                gold: 6,
                silver: 0,
                bronze: 2,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2004', 'Whimsical Wonderland of Dreamlandia'],
                },
                gold: 6,
                silver: 0,
                bronze: 2,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '', 'Eternal Empire of Nebulon'],
                },
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2012', 'Eternal Empire of Nebulon'],
                },
                gold: 4,
                silver: 2,
                bronze: 0,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '2012', 'Eternal Empire of Nebulon'],
                },
                gold: 4,
                silver: 2,
                bronze: 0,
            },
            {
                'ag-Grid-AutoColumn-country': {
                    labels: ['', '', 'Mystical Realm of Eldoria'],
                },
            },
        ],
        'ag-Grid-AutoColumn-country'
    ),
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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

export const INTEGRATED_CHARTS_OVERLAPPING_GROUPED_CATEGORY_AXIS_EXAMPLE: AgCartesianChartOptions & { mode: string } = {
    mode: 'integrated',
    data: prepareIntegratedChartsData(
        [
            {
                'ag-Grid-AutoColumn': {
                    labels: ['United States'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Russia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Australia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Canada'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Norway'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['China'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Zimbabwe'],
                },
                '2004_gold': 1,
                '2004_silver': 1,
                '2004_bronze': 1,
                '2008_gold': 1,
                '2008_silver': 3,
                '2008_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Netherlands'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['South Korea'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Croatia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['France'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Japan'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Hungary'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Germany'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Poland'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['South Africa'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Sweden'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Ukraine'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Italy'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Czech Republic'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Austria'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Finland'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Romania'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Great Britain'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Jamaica'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Singapore'],
                },
                '2008_gold': 0,
                '2008_silver': 3,
                '2008_bronze': 0,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 4,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Belarus'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Chile'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Spain'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Tunisia'],
                },
                '2008_gold': 1,
                '2008_silver': 0,
                '2008_bronze': 0,
                '2012_gold': 1,
                '2012_silver': 1,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Brazil'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Slovakia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Costa Rica'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 2,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Bulgaria'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Switzerland'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['New Zealand'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Estonia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Kenya'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Ethiopia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Trinidad and Tobago'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Turkey'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Morocco'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Bahamas'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Slovenia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Armenia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Azerbaijan'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['India'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Puerto Rico'],
                },
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Egypt'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Kazakhstan'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Iran'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Georgia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Lithuania'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Cuba'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Colombia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Mongolia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Uzbekistan'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['North Korea'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Tajikistan'],
                },
                '2008_gold': 0,
                '2008_silver': 1,
                '2008_bronze': 1,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Kyrgyzstan'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 1,
                '2008_gold': 0,
                '2008_silver': 1,
                '2008_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Greece'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Macedonia'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Moldova'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Chinese Taipei'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Indonesia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Thailand'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Vietnam'],
                },
                '2000_gold': 0,
                '2000_silver': 1,
                '2000_bronze': 0,
                '2008_gold': 0,
                '2008_silver': 1,
                '2008_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Latvia'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Venezuela'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Mexico'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Nigeria'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Qatar'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 1,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 2,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Serbia'],
                },
                '2008_gold': 0,
                '2008_silver': 1,
                '2008_bronze': 14,
                '2012_gold': 1,
                '2012_silver': 1,
                '2012_bronze': 14,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Serbia and Montenegro'],
                },
                '2000_gold': 11,
                '2000_silver': 1,
                '2000_bronze': 13,
                '2004_gold': 0,
                '2004_silver': 13,
                '2004_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Hong Kong'],
                },
                '2004_gold': 0,
                '2004_silver': 2,
                '2004_bronze': 0,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Denmark'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Portugal'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Argentina'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Afghanistan'],
                },
                '2008_gold': 0,
                '2008_silver': 0,
                '2008_bronze': 1,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Gabon'],
                },
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Dominican Republic'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Belgium'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Kuwait'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 1,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['United Arab Emirates'],
                },
                '2004_gold': 1,
                '2004_silver': 0,
                '2004_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Cyprus'],
                },
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Israel'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Algeria'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Montenegro'],
                },
                '2012_gold': 0,
                '2012_silver': 14,
                '2012_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Iceland'],
                },
                '2000_gold': 0,
                '2000_silver': 0,
                '2000_bronze': 1,
                '2008_gold': 0,
                '2008_silver': 14,
                '2008_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Paraguay'],
                },
                '2004_gold': 0,
                '2004_silver': 17,
                '2004_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Cameroon'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Saudi Arabia'],
                },
                '2000_gold': 0,
                '2000_silver': 1,
                '2000_bronze': 1,
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 4,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Ireland'],
                },
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
                'ag-Grid-AutoColumn': {
                    labels: ['Malaysia'],
                },
                '2008_gold': 0,
                '2008_silver': 1,
                '2008_bronze': 0,
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Uruguay'],
                },
                '2000_gold': 0,
                '2000_silver': 1,
                '2000_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Togo'],
                },
                '2008_gold': 0,
                '2008_silver': 0,
                '2008_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Mauritius'],
                },
                '2008_gold': 0,
                '2008_silver': 0,
                '2008_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Syria'],
                },
                '2004_gold': 0,
                '2004_silver': 0,
                '2004_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Botswana'],
                },
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Guatemala'],
                },
                '2012_gold': 0,
                '2012_silver': 1,
                '2012_bronze': 0,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: ['Bahrain'],
                },
                '2012_gold': 0,
                '2012_silver': 0,
                '2012_bronze': 1,
            },
            {
                'ag-Grid-AutoColumn': {
                    labels: [''],
                },
            },
        ],
        'ag-Grid-AutoColumn-country'
    ),
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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

export const LINE_TIME_X_AXIS_NUMBER_Y_AXIS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'time',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR,
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
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
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Internal',
        },
        {
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            data: DATA_TIME_SENSOR.map((datum) => {
                return { ...datum, time: 0 };
            }),
            yKey: 'time',
            xKey: 'sensor',
            yName: 'Internal',
        },
        {
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
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'time',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'left',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
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
    axes: [
        {
            type: 'time',
            position: 'top',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'left',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
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
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%Y',
            },
        },
        {
            type: 'number',
            position: 'right',
            tick: {
                maxSpacing: 20,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            showInLegend: false,
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
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'time',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'time',
            nice: false,
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
        },
    ],
};

export const COLUMN_SINGLE_DATE_CATEGORY_AXIS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            nice: false,
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
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
        axes: [
            {
                type: 'category',
                position: 'bottom',
            },
            {
                type: 'log',
                position: 'left',
            },
        ],
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
