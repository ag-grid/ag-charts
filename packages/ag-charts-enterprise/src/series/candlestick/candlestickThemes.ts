import { type AgCandlestickSeriesItemOptions, type WithThemeParams } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

function itemTheme(key: 'up' | 'down'): WithThemeParams<AgCandlestickSeriesItemOptions> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        key === 'up' ? 'transparent' : { $palette: 'fill' },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
            ],
        },
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $palette: 'stroke' },
                { $palette: `${key}.stroke` },
            ],
        },
        strokeWidth: 1,
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
    };
}

export const CANDLESTICK_SERIES_THEME: ExtensibleSeriesTheme<'candlestick'> = {
    series: {
        ...SERIES_INTERACTION_THEME_DEFAULTS,
        item: {
            up: itemTheme('up'),
            down: itemTheme('down'),
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
            interaction: { enabled: false },
        },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    animation: { enabled: false },
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
