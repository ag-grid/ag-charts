import { type AgCandlestickSeriesItemOptions, type WithThemeParams } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    GLOW_THEME_DEFAULTS,
    ITEM_GLOW_BUCKETS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    NEAREST_TOOLTIP_THEME,
    SERIES_GLOW_BUCKETS,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    lineDashThemeDefault,
    withGlowThemeDefaults,
    withLineDashThemeDefaults,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

import { FINANCIAL_SERIES_AXES_THEME } from '../../features/crosshair/crosshairThemes';

/** The wick's `lineDash` falls back to the item's, and a name scales by the wick's width, else the item's. */
const WICK_LINE_DASH = lineDashThemeDefault(undefined, { $path: ['./strokeWidth', { $path: '../strokeWidth' }] });

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
        wick: { lineDash: WICK_LINE_DASH },
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
        shadow: SHADOW_THEME_DEFAULTS,
        glow: GLOW_THEME_DEFAULTS,
        tooltip: NEAREST_TOOLTIP_THEME,
        highlight: withLineDashThemeDefaults(
            withGlowThemeDefaults({ ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true }, SERIES_GLOW_BUCKETS),
            [...ITEM_GLOW_BUCKETS, ...SERIES_GLOW_BUCKETS],
            { within: 'wick', lineDash: WICK_LINE_DASH }
        ),
        selection: SERIES_SELECTION_THEME,
    },
    animation: { enabled: false },
    axes: FINANCIAL_SERIES_AXES_THEME,
};
