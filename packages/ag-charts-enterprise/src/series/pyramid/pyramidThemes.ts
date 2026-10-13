import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    cycledFillThemeTemplate,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const PYRAMID_SERIES_THEME: ExtensibleSeriesTheme<'pyramid'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical',
        fillOpacity: 1,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        ...STROKE_STYLE_THEME_DEFAULTS,
        spacing: 2,
        tooltip: SERIES_TOOLTIP_THEME,
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                { $palette: 'fills' },
                cycledFillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
            ],
        },
        strokes: {
            $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
        },
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            padding: 8,
            spacing: 8,
            collision: {
                threshold: 4,
                alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
                // A value label must avoid the neighbouring stages; its own stage is excluded separately.
                ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
            },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('inside'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('outside'),
            placement: 'inside-center',
        },
        stageLabel: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            color: { $ref: 'textColor' },
            spacing: 12,
        },
        shadow: SHADOW_THEME_DEFAULTS,
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            unhighlightedItem: {
                opacity: 0.4,
            },
        },
    },
};
