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

// Not in the shared ignore lists: those drive the options defs, so `series[]` would reject `shadow`, `glow` and `gap`.
function omitInheritedStyling(ignoredProperties: readonly string[]) {
    return [...ignoredProperties, 'shadow', 'glow', 'gap'];
}

/**
 * The `strokeWidth` that a stock dash name scales by: the one set on the mini-chart series, else `fallback`. The type's
 * default is only filled in after theming, so each fallback mirrors the default of its series theme.
 *
 * A width that the series copies from the main series is not seen here, so a name on such a series scales by the
 * default. A line or an area, the usual mini-chart series, copies none.
 */
type StrokeWidth = NonNullable<Parameters<typeof lineDashThemeDefault>[1]>;

const strokeWidthOr = (fallback: number | StrokeWidth): StrokeWidth => ({ $path: ['./strokeWidth', fallback] });

const DEFAULT_STROKE_WIDTH = strokeWidthOr(2);
// A wick scales by its item's width, as in the main series theme; a whisker by its box plot's.
const WICK_STROKE_WIDTH = strokeWidthOr({ $path: '../strokeWidth' });
const WHISKER_STROKE_WIDTH = strokeWidthOr({ $path: ['../strokeWidth', 2] });

/**
 * Where each mini-chart series type takes a `lineDash`: `own` is the series' own and `nested` are paths from the series,
 * each scaling by the sibling `strokeWidth` unless it names a fallback.
 *
 * The main series theme is copied over as a whole, so these locations hold no `$applyLineDash` default of their own:
 * without one a name is left unresolved or, where the copy supplies an array, dropped.
 */
const miniChartLineDashLocations: Record<
    string,
    { own?: true | StrokeWidth; nested?: Array<string | [path: string, strokeWidth: StrokeWidth]> }
> = {
    line: { own: DEFAULT_STROKE_WIDTH, nested: ['marker'] },
    area: { own: true, nested: ['marker'] },
    bar: { own: true },
    'box-plot': { own: DEFAULT_STROKE_WIDTH, nested: [['whisker', WHISKER_STROKE_WIDTH]] },
    scatter: { own: true },
    bubble: { own: true },
    histogram: { own: true },
    waterfall: {
        nested: ['item.positive', 'item.negative', 'item.total', ['line', DEFAULT_STROKE_WIDTH]],
    },
    'range-bar': { own: true },
    'range-area': {
        own: true,
        nested: [
            ['marker', DEFAULT_STROKE_WIDTH],
            'item.low',
            'item.high',
            ['item.low.marker', DEFAULT_STROKE_WIDTH],
            ['item.high.marker', DEFAULT_STROKE_WIDTH],
        ],
    },
    candlestick: {
        nested: ['item.up', 'item.down', ['item.up.wick', WICK_STROKE_WIDTH], ['item.down.wick', WICK_STROKE_WIDTH]],
    },
    ohlc: { nested: ['item.up', 'item.down'] },
    hlc: {
        nested: [
            ['marker', DEFAULT_STROKE_WIDTH],
            ['item.high', DEFAULT_STROKE_WIDTH],
            ['item.low', DEFAULT_STROKE_WIDTH],
            ['item.close', DEFAULT_STROKE_WIDTH],
            ['item.high.marker', DEFAULT_STROKE_WIDTH],
            ['item.low.marker', DEFAULT_STROKE_WIDTH],
            ['item.close.marker', DEFAULT_STROKE_WIDTH],
        ],
    },
};

// A mini-chart line or area takes no dash from the main series (the price volume preset maps an area to a line).
const MINI_CHART_TYPES_WITHOUT_MAIN_DASH = new Set(['line', 'area']);

/**
 * The `lineDash` defaults of a mini-chart series type, each with the main series' value as its default, so a name
 * resolves by the width of the mini-chart series and an unset option still follows the main series.
 */
function miniChartLineDashTheme(type: string, { own, nested = [] }: (typeof miniChartLineDashLocations)[string]) {
    const theme: Record<string, any> = {};
    if (own != null) {
        const inherited = MINI_CHART_TYPES_WITHOUT_MAIN_DASH.has(type)
            ? undefined
            : { $path: '/series/$index/lineDash' };
        theme.lineDash = lineDashThemeDefault(inherited, own === true ? undefined : own);
    }
    for (const entry of nested) {
        const [location, strokeWidth] = typeof entry === 'string' ? [entry, undefined] : entry;
        const keys = location.split('.');
        const inherited = { $path: `/series/$index/${[...keys, 'lineDash'].join('/')}` };

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
                            omitInheritedStyling(commonIgnoredMiniChartProperties),
                            ['bar', omitInheritedStyling(barIgnoredMiniChartProperties)],
                            ['box-plot', omitInheritedStyling(boxPlotIngnoredMiniChartProperties)],
                            ['bubble', omitInheritedStyling(bubbleIgnoredMiniChartProperties)],
                            ['heatmap', omitInheritedStyling(heatmapIgnoredMiniChartProperties)],
                            ['histogram', omitInheritedStyling(histogramIgnoredMiniChartProperties)],
                            ['hlc', omitInheritedStyling(hlcIgnoredMiniChartProperties)],
                            // `priceVolumePresetIgnoredMiniChartProperties` already includes `shadow` and `glow`.
                            [
                                'line',
                                [...lineIgnoredMiniChartProperties, ...priceVolumePresetIgnoredMiniChartProperties],
                            ],
                            ['range-area', omitInheritedStyling(rangeAreaIgnoredMiniChartProperties)],
                            ['range-bar', omitInheritedStyling(rangeBarIgnoredMiniChartProperties)],
                            ['scatter', omitInheritedStyling(scatterIgnoredMiniChartProperties)],
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
