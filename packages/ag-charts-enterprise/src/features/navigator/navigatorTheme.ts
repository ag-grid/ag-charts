import {
    type AgMiniChartSeriesOptions,
    type AgNavigatorHandleOptions,
    type AgNavigatorOptions,
    type WithThemeParams,
} from 'ag-charts-community';
import { FONT_SIZE_RATIO, themeBorderColor, themeBorderWidth } from 'ag-charts-core';

import {
    barIgnoredMiniChartProperties,
    boxPlotIngnoredMiniChartProperties,
    bubbleIgnoredMiniChartProperties,
    commonIgnoredMiniChartProperties,
    heatmapIgnoredMiniChartProperties,
    histogramIgnoredMiniChartProperties,
    hlcIgnoredMiniChartProperties,
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
    'hlc',
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

// Not in the shared ignore lists: those drive the options defs, so `series[]` would reject `shadow`.
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
                    // Waterfall keeps its shadows under `item.*`, which `$omit` does not reach.
                    [
                        'waterfall',
                        {
                            item: {
                                positive: { shadow: { enabled: false } },
                                negative: { shadow: { enabled: false } },
                                total: { shadow: { enabled: false } },
                            },
                        },
                    ],
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
                    [
                        'hlc',
                        {
                            marker: miniChartMarkerTheme,
                            item: {
                                high: { marker: { shadow: { enabled: false } } },
                                low: { marker: { shadow: { enabled: false } } },
                                close: { marker: { shadow: { enabled: false } } },
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
                            ['hlc', omitInheritedShadow(hlcIgnoredMiniChartProperties)],
                            // `priceVolumePresetIgnoredMiniChartProperties` already includes `shadow`.
                            [
                                'line',
                                [...lineIgnoredMiniChartProperties, ...priceVolumePresetIgnoredMiniChartProperties],
                            ],
                            ['range-area', omitInheritedShadow(rangeAreaIgnoredMiniChartProperties)],
                            ['range-bar', omitInheritedShadow(rangeBarIgnoredMiniChartProperties)],
                            ['scatter', omitInheritedShadow(scatterIgnoredMiniChartProperties)],
                            ['waterfall', waterfallIgnoredMiniChartProperties],
                        ],
                    },
                    seriesPath,
                ],
            },
        ],
    };
}

const NAVIGATOR_HANDLE_THEME: WithThemeParams<AgNavigatorHandleOptions> = {
    fill: { $ref: 'navigatorHandleBackgroundColor' },
    stroke: themeBorderColor('navigatorHandleBorder'),
    strokeWidth: themeBorderWidth('navigatorHandleBorder', { on: 1 }),
    width: 12,
    height: 24,
    cornerRadius: { $ref: 'navigatorHandleBorderRadius' },
};

export const NAVIGATOR_THEME: WithThemeParams<AgNavigatorOptions> = {
    enabled: false,
    height: { $if: [{ $path: './miniChart/enabled' }, 40, 18] },
    spacing: 10,
    cornerRadius: { $ref: 'navigatorTrackBorderRadius' },
    // Deprecated `mask` seeds `track`, so either name works and an explicit `track` wins. The track params live here
    // rather than on `track` so that a user `mask` still overrides them.
    mask: {
        fill: { $ref: 'navigatorTrackBackgroundColor' },
        fillOpacity: 0.1,
        stroke: themeBorderColor('navigatorTrackBorder'),
        strokeWidth: themeBorderWidth('navigatorTrackBorder', { on: 1 }),
    },
    track: {
        fill: { $path: '../mask/fill' },
        fillOpacity: { $path: '../mask/fillOpacity' },
        stroke: { $path: '../mask/stroke' },
        strokeWidth: { $path: '../mask/strokeWidth' },
    },
    // Transparent by default so the selected range looks as it did before `thumb` existed.
    thumb: {
        fill: { $ref: 'navigatorThumbBackgroundColor' },
        fillOpacity: 1,
    },
    minHandle: NAVIGATOR_HANDLE_THEME,
    maxHandle: NAVIGATOR_HANDLE_THEME,
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
