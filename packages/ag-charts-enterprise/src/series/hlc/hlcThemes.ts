import { type AgChartThemeOverrides, type WithThemeParams } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    type NonNullablePath,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
    interpolationThemeTemplate,
} from 'ag-charts-core';

type HlcItemOptions = NonNullablePath<AgChartThemeOverrides, 'hlc', 'series', 'item'>;
type HlcItemMarkerOptions = NonNullable<NonNullable<HlcItemOptions['close']>['marker']>;

/** The palette stroke for an item: its `up`/`down`/`altNeutral` colour, or the series colour for an indexed palette. */
function paletteStroke(
    key: 'up' | 'down' | 'altNeutral'
): WithThemeParams<NonNullable<HlcItemOptions['close']>>['stroke'] {
    return {
        $if: [{ $eq: [{ $palette: 'type' }, 'user-indexed'] }, { $palette: 'stroke' }, { $palette: `${key}.stroke` }],
    };
}

/**
 * An item's markers inherit the series-level `marker` options. Unset colours fall back to the item's own
 * stroke, so each value's markers match its line.
 */
const HLC_ITEM_MARKER: WithThemeParams<HlcItemMarkerOptions> = {
    enabled: { $path: '/series/$index/marker/enabled' },
    fill: {
        $isUserOption: [
            '/series/$index/marker/fill',
            {
                $if: [
                    {
                        $or: [
                            { $isGradient: { $path: '/series/$index/marker/fill' } },
                            { $isImage: { $path: '/series/$index/marker/fill' } },
                            { $isPattern: { $path: '/series/$index/marker/fill' } },
                        ],
                    },
                    {
                        $merge: [
                            { $path: '/series/$index/marker/fill' },
                            {
                                $applySwitch: [
                                    { $path: 'type' },
                                    undefined, // default case shouldn't be hit because of $if
                                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                                    ['image', FILL_IMAGE_DEFAULTS],
                                    ['pattern', FILL_PATTERN_DEFAULTS],
                                ],
                            },
                        ],
                    },
                    { $path: '/series/$index/marker/fill' },
                ],
            },
            {
                $applySwitch: [
                    { $path: 'type' },
                    { $path: '../stroke' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
        ],
    },
    fillOpacity: { $path: '/series/$index/marker/fillOpacity' },
    lineDash: { $path: '/series/$index/marker/lineDash' },
    lineDashOffset: { $path: '/series/$index/marker/lineDashOffset' },
    shape: { $path: '/series/$index/marker/shape' },
    size: { $path: ['/series/$index/marker/size', 6] },
    stroke: { $path: ['/series/$index/marker/stroke', { $path: '../stroke' }] },
    strokeOpacity: { $path: '/series/$index/marker/strokeOpacity' },
    strokeWidth: { $path: ['/series/$index/marker/strokeWidth', 2] },
};

function bandTheme(key: 'up' | 'down'): WithThemeParams<HlcItemOptions['high']> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'fill' },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
            ],
        },
        fillOpacity: 0.3,
        stroke: paletteStroke(key),
        strokeWidth: 2,
        ...STROKE_STYLE_THEME_DEFAULTS,
        marker: HLC_ITEM_MARKER,
    };
}

export const HLC_SERIES_THEME: WithThemeParams<AgChartThemeOverrides['hlc']> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        marker: {
            enabled: false,
            shape: 'circle',
            size: 6,
            fillOpacity: 1,
            strokeWidth: 2,
            ...STROKE_STYLE_THEME_DEFAULTS,
        },
        nodeClickRange: { $if: [{ $path: '/selection/enabled' }, 10, 'nearest'] },
        item: {
            // The band from close to high is the rise above close, so it takes the `up` colour.
            high: bandTheme('up'),
            low: bandTheme('down'),
            close: {
                stroke: paletteStroke('altNeutral'),
                strokeWidth: 2,
                ...STROKE_STYLE_THEME_DEFAULTS,
                marker: HLC_ITEM_MARKER,
            },
        },
        connectMissingData: false,
        interpolation: interpolationThemeTemplate(),
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
            interaction: { enabled: false },
        },
        highlight: { ...MARKER_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0,
            crosshair: {
                enabled: true,
            },
        },
    },
};
