import {
    CARTESIAN_AXIS_TYPE,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    GLOW_THEME_DEFAULTS,
    ITEM_GLOW_BUCKETS,
    SAFE_FILL_OPERATION,
    SEGMENTATION_DEFAULTS,
    SERIES_GLOW_BUCKETS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    UNSET_LINE_DASH_THEME_DEFAULT,
    fillThemeTemplate,
    withGlowThemeDefaults,
    withLineDashThemeDefaults,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const BOX_PLOT_SERIES_THEME: ExtensibleSeriesTheme<'box-plot'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical',
        fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS, {
            $if: [
                {
                    $or: [
                        { $isGradient: { $palette: 'fill' } },
                        { $isPattern: { $palette: 'fill' } },
                        { $isImage: { $palette: 'fill' } },
                    ],
                },
                { $palette: 'fill' },
                { $mix: [SAFE_FILL_OPERATION, { $ref: 'chartBackgroundColor' }, 0.7] },
            ],
        }),
        stroke: { $palette: 'stroke' },
        strokeWidth: 2,
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        shadow: SHADOW_THEME_DEFAULTS,
        glow: GLOW_THEME_DEFAULTS,
        cap: { lengthRatio: 0.5 },
        whisker: { lineDash: UNSET_LINE_DASH_THEME_DEFAULT },
        tooltip: SERIES_TOOLTIP_THEME,
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            bringToFront: true,
            ...withLineDashThemeDefaults(
                withGlowThemeDefaults(
                    {
                        unhighlightedItem: {
                            opacity: 0.5,
                        },
                        unhighlightedSeries: { opacity: 0.1 },
                    },
                    SERIES_GLOW_BUCKETS
                ),
                [...ITEM_GLOW_BUCKETS, ...SERIES_GLOW_BUCKETS],
                { within: 'whisker' }
            ),
        },
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    },
};
