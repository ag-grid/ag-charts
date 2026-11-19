import {
    type AgMiniChartSeriesOptions,
    type AgNavigatorHandleOptions,
    type AgNavigatorOptions,
    type WithThemeParams,
} from 'ag-charts-community';
import {
    FONT_SIZE_RATIO,
    lineDashThemeDefault,
    themeBorderColor,
    themeBorderWidth,
    themeLineHeight,
} from 'ag-charts-core';

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
    'glow',
    'highlight',
    'lineDash',
    'lineDashOffset',
    'strokeWidth',
];

// Not in the shared ignore lists: those drive the options defs, so `series[]` would reject `shadow` and `glow`.
function omitInheritedShadow(ignoredProperties: readonly string[]) {
    return [...ignoredProperties, 'shadow', 'glow'];
}

/**
 * Where each mini-chart series type takes a `lineDash`, as paths from the series (`''` is the series' own). The main
 * series theme is copied over as a whole, so these locations hold no `$applyLineDash` default of their own: without one
 * a name is left unresolved or, where the copy supplies an array, dropped.
 */
const miniChartLineDashLocations: Record<string, string[]> = {
    line: ['', 'marker'],
    area: ['', 'marker'],
    bar: [''],
    scatter: [''],
    bubble: [''],
    histogram: [''],
    waterfall: ['item.positive', 'item.negative', 'item.total', 'line'],
    'range-bar': [''],
    'range-area': ['', 'marker', 'item.low', 'item.high', 'item.low.marker', 'item.high.marker'],
    candlestick: ['item.up', 'item.down', 'item.up.wick', 'item.down.wick'],
    ohlc: ['item.up', 'item.down'],
    hlc: ['marker', 'item.high', 'item.low', 'item.close', 'item.high.marker', 'item.low.marker', 'item.close.marker'],
};

// A wick scales by its own width, else its item's, as in the main series theme.
const WICK_STROKE_WIDTH: Parameters<typeof lineDashThemeDefault>[1] = {
    $path: ['./strokeWidth', { $path: '../strokeWidth' }],
};

// A mini-chart line or area takes no dash from the main series (the price volume preset maps an area to a line).
const MINI_CHART_TYPES_WITHOUT_MAIN_DASH = new Set(['line', 'area']);

/**
 * The `lineDash` defaults of a mini-chart series type, each with the main series' value as its default, so a name
 * resolves by the width of the mini-chart series and an unset option still follows the main series.
 */
function miniChartLineDashTheme(type: string, locations: string[]) {
    const theme: Record<string, any> = {};
    for (const location of locations) {
        const keys = location === '' ? [] : location.split('.');
        const inherited =
            location === '' && MINI_CHART_TYPES_WITHOUT_MAIN_DASH.has(type)
                ? undefined
                : { $path: `/series/$index/${[...keys, 'lineDash'].join('/')}` };
        const strokeWidth = keys.at(-1) === 'wick' ? WICK_STROKE_WIDTH : undefined;

        let node = theme;
        for (const key of keys) node = node[key] ??= {};
        node.lineDash = lineDashThemeDefault(inherited, strokeWidth);
    }
    return theme;
}

const miniChartMarkerTheme = {
    // `$omit` only drops top-level keys and the first grafted value for a key wins, so the nested marker shadow and
    // glow are switched off here rather than alongside the omit.
    shadow: { enabled: false },
    glow: { enabled: false },
    enabled: {
        $isUserOption: ['/series/$index/marker/enabled', { $path: ['/series/$index/marker/enabled', false] }, false],
    },
};

/** `resolveLineDash` is for the series that the user sets here, as the main series that the others copy resolved its names. */
function miniChartSeriesTheme(seriesPath: object, typePath: object, resolveLineDash = false) {
    return {
        $merge: [
            ...(resolveLineDash
                ? [
                      {
                          $applySwitch: [
                              typePath,
                              {},
                              ...Object.keys(miniChartLineDashLocations).map((type) => [
                                  type,
                                  miniChartLineDashTheme(type, miniChartLineDashLocations[type]),
                              ]),
                          ],
                      },
                  ]
                : []),
            {
                $switch: [
                    typePath,
                    {},
                    [['area', 'line'], { marker: miniChartMarkerTheme }],
                    // Waterfall keeps its shadows and glows under `item.*`, which `$omit` does not reach.
                    [
                        'waterfall',
                        {
                            item: {
                                positive: { shadow: { enabled: false }, glow: { enabled: false } },
                                negative: { shadow: { enabled: false }, glow: { enabled: false } },
                                total: { shadow: { enabled: false }, glow: { enabled: false } },
                            },
                        },
                    ],
                    [
                        'range-area',
                        {
                            marker: miniChartMarkerTheme,
                            // The item markers take their shadow and glow from the main series via `$path`, not by copying it.
                            item: {
                                low: { marker: { shadow: { enabled: false }, glow: { enabled: false } } },
                                high: { marker: { shadow: { enabled: false }, glow: { enabled: false } } },
                            },
                        },
                    ],
                    [
                        'hlc',
                        {
                            marker: miniChartMarkerTheme,
                            item: {
                                high: { marker: { shadow: { enabled: false }, glow: { enabled: false } } },
                                low: { marker: { shadow: { enabled: false }, glow: { enabled: false } } },
                                close: { marker: { shadow: { enabled: false }, glow: { enabled: false } } },
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
                            // `priceVolumePresetIgnoredMiniChartProperties` already includes `shadow` and `glow`.
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
    strokeWidth: themeBorderWidth('navigatorHandleBorder'),
    width: 12,
    height: 24,
    cornerRadius: { $ref: 'navigatorHandleBorderRadius' },
};

export const NAVIGATOR_THEME: WithThemeParams<AgNavigatorOptions> = {
    enabled: false,
    height: { $if: [{ $path: './miniChart/enabled' }, 40, 18] },
    spacing: 10,
    cornerRadius: { $ref: 'navigatorTrackBorderRadius' },
    track: {
        fill: { $ref: 'navigatorTrackBackgroundColor' },
        fillOpacity: 0.1,
        stroke: themeBorderColor('navigatorTrackBorder'),
        strokeWidth: themeBorderWidth('navigatorTrackBorder'),
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
            lineHeight: themeLineHeight('lineHeight'),
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
                    },
                    true
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
