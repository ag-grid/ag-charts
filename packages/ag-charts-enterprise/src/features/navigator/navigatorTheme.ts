import { type AgMiniChartSeriesOptions, type AgNavigatorOptions, type WithThemeParams } from 'ag-charts-community';
import { FONT_SIZE_RATIO } from 'ag-charts-core';

import {
    barIgnoredMiniChartProperties,
    boxPlotIngnoredMiniChartProperties,
    bubbleIgnoredMiniChartProperties,
    commonIgnoredMiniChartProperties,
    heatmapIgnoredMiniChartProperties,
    histogramIgnoredMiniChartProperties,
    lineIgnoredMiniChartProperties,
    rangeAreaIgnoredMiniChartProperties,
    rangeBarIgnoredMiniChartProperties,
    scatterIgnoredMiniChartProperties,
    waterfallIgnoredMiniChartProperties,
} from './navigatorOptionsDefs';

const validMiniChartSeriesTypes: AgMiniChartSeriesOptions['type'][] = [
    'area',
    'bar',
    'bubble',
    'candlestick',
    'heatmap',
    'histogram',
    'line',
    'ohlc',
    'range-area',
    'range-bar',
    'scatter',
    'waterfall',
];

// TODO: This is deeply hacky. The priceVolume preset area series is mapped to a line series with various additional
// options that need to be omitted. This needs some kind of remap operation that takes the union of options between
// the two series instead of a simple omit list.
const priceVolumePresetIgnoredMiniChartProperties = [
    'itemStyler',
    'simpleItemStyler',
    'direction',
    'fill',
    'fillGradientDefaults',
    'fillPatternDefaults',
    'fillImageDefaults',
    'fillOpacity',
    'shadow',
    'focusPriority',
    'highlight',
    'lineDash',
    'lineDashOffset',
    'strokeWidth',
];

function miniChartSeriesTheme(seriesPath: object, typePath: object) {
    return {
        $merge: [
            {
                $switch: [
                    typePath,
                    {},
                    [
                        ['area', 'line', 'range-area'],
                        {
                            marker: {
                                enabled: {
                                    $isUserOption: [
                                        '/series/$index/marker/enabled',
                                        { $path: ['/series/$index/marker/enabled', false] },
                                        false,
                                    ],
                                },
                            },
                        },
                    ],
                ],
            },
            {
                $omit: [
                    {
                        $switch: [
                            typePath,
                            commonIgnoredMiniChartProperties,
                            ['bar', barIgnoredMiniChartProperties],
                            ['box-plot', boxPlotIngnoredMiniChartProperties],
                            ['bubble', bubbleIgnoredMiniChartProperties],
                            ['heatmap', heatmapIgnoredMiniChartProperties],
                            ['histogram', histogramIgnoredMiniChartProperties],
                            [
                                'line',
                                [...lineIgnoredMiniChartProperties, ...priceVolumePresetIgnoredMiniChartProperties],
                            ],
                            ['range-area', rangeAreaIgnoredMiniChartProperties],
                            ['range-bar', rangeBarIgnoredMiniChartProperties],
                            ['scatter', scatterIgnoredMiniChartProperties],
                            ['waterfall', waterfallIgnoredMiniChartProperties],
                        ],
                    },
                    seriesPath,
                ],
            },
        ],
    };
}

export const NAVIGATOR_THEME: WithThemeParams<AgNavigatorOptions> = {
    enabled: false,
    height: { $if: [{ $path: './miniChart/enabled' }, 40, 18] },
    cornerRadius: 4,
    mask: {
        fill: { $ref: 'foregroundColor' },
        fillOpacity: 0.1,
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
    },
    minHandle: {
        fill: { $ref: 'chartBackgroundColor' },
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
        width: 12,
        height: 24,
        cornerRadius: 4,
    },
    maxHandle: {
        fill: { $ref: 'chartBackgroundColor' },
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
        width: 12,
        height: 24,
        cornerRadius: 4,
    },
    miniChart: {
        enabled: false,
        label: {
            color: { $ref: 'textColor' },
            fontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
            fontFamily: { $ref: 'fontFamily' } as any,
            fontWeight: { $ref: 'fontWeight' },
            spacing: 5,
        },
        padding: {
            top: 0,
            bottom: 0,
        },
        series: {
            $apply: [
                miniChartSeriesTheme(
                    { $path: '/series/$index' },
                    {
                        $path: [
                            '/navigator/miniChart/series/$index/type',
                            { $path: ['type', { $path: '/series/$index/type' }] },
                        ],
                    }
                ),
                {
                    // TODO: this should be a $switch but switches can not resolve the case value yet
                    $if: [
                        {
                            $or: validMiniChartSeriesTypes.map((type) => ({
                                $eq: [{ $path: '/series/0/type' }, type],
                            })),
                        },
                        {
                            $map: [
                                miniChartSeriesTheme({ $value: '$1' }, { $path: '/series/$index/type' }),
                                { $path: '/series' },
                            ],
                        },
                        undefined,
                    ],
                },
            ],
        } as any,
    },
};
