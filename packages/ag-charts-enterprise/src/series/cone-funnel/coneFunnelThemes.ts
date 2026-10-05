import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS,
    FILL_PATTERN_SINGLE_DEFAULTS,
    FONT_THEME_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    NEAREST_TOOLTIP_THEME,
    SAFE_FILLS_OPERATION,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    cycledFillThemeTemplate,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const CONE_FUNNEL_SERIES_THEME: ExtensibleSeriesTheme<'cone-funnel'> = {
    series: {
        ...SERIES_INTERACTION_THEME_DEFAULTS,
        direction: 'vertical',
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                        { $palette: 'secondSequentialColors' },
                        SAFE_FILLS_OPERATION,
                    ],
                },
                cycledFillThemeTemplate(FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS, FILL_PATTERN_SINGLE_DEFAULTS),
            ],
        },
        strokes: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                        { $palette: 'secondSequentialColors' },
                        { $palette: 'strokes' },
                    ],
                },
            ],
        },
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        shadow: SHADOW_THEME_DEFAULTS,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            ...FONT_THEME_DEFAULTS,
            color: { $ref: 'textColor' },
            collision: {
                threshold: 4,
                alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
            },
            placement: 'start-center',
            spacing: 4,
        },
        tooltip: NEAREST_TOOLTIP_THEME,
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            highlightedItem: {
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
