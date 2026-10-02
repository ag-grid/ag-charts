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

// The mini chart strip is 40px high, so an inherited series shadow costs blur work for no visible benefit. This is kept
// out of the shared `*IgnoredMiniChartProperties` lists because those also drive the options defs and mirror the public
// `*IgnoredProperties` types, which would stop `navigator.miniChart.series[]` accepting an explicit `shadow`.
function omitInheritedShadow(ignoredProperties: readonly string[]) {
    return [...ignoredProperties, 'shadow'];
}

const miniChartMarkerTheme = {
    // `$omit` only drops top-level keys and the first grafted value for a key wins, so the nested marker shadow is
    // switched off here rather than alongside the omit.
    shadow: { enabled: false },
    enabled: {
        $isUserOption: ['/series/$index/marker/enabled', { $path: ['/series/$index/marker/enabled', false] }, false],
    },
};

function miniChartSeriesTheme(seriesPath: object, typePath: object) {
    return {
        $merge: [
            {
                $switch: [
                    typePath,
                    {},
                    [['area', 'line'], { marker: miniChartMarkerTheme }],
                    [
                        'range-area',
                        {
                            marker: miniChartMarkerTheme,
                            // The item markers take their shadow from the main series via `$path`, not by copying it.
                            item: {
                                low: { marker: { shadow: { enabled: false } } },
                                high: { marker: { shadow: { enabled: false } } },
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
                            omitInheritedShadow(commonIgnoredMiniChartProperties),
                            ['bar', omitInheritedShadow(barIgnoredMiniChartProperties)],
                            ['box-plot', omitInheritedShadow(boxPlotIngnoredMiniChartProperties)],
                            ['bubble', omitInheritedShadow(bubbleIgnoredMiniChartProperties)],
                            ['heatmap', omitInheritedShadow(heatmapIgnoredMiniChartProperties)],
                            ['histogram', omitInheritedShadow(histogramIgnoredMiniChartProperties)],
                            [
                                'line',
                                omitInheritedShadow([
                                    ...lineIgnoredMiniChartProperties,
                                    ...priceVolumePresetIgnoredMiniChartProperties,
                                ]),
                            ],
                            ['range-area', omitInheritedShadow(rangeAreaIgnoredMiniChartProperties)],
                            ['range-bar', omitInheritedShadow(rangeBarIgnoredMiniChartProperties)],
                            ['scatter', omitInheritedShadow(scatterIgnoredMiniChartProperties)],
                            ['waterfall', omitInheritedShadow(waterfallIgnoredMiniChartProperties)],
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
    spacing: 10,
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
        padding: { $applyPadding: 0 },
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
