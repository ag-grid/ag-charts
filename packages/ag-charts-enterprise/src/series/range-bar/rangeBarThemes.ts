import { type AgChartThemeOverrides, type WithThemeParams } from 'ag-charts-community';
import {
    BAR_LABEL_COLLISION_THEME,
    CARTESIAN_AXIS_TYPE,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FONT_THEME_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    fillThemeTemplate,
} from 'ag-charts-core';

export const RANGE_BAR_SERIES_THEME: WithThemeParams<AgChartThemeOverrides['range-bar']> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical' as const,
        fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            ...FONT_THEME_DEFAULTS,
            spacing: 6,
            padding: 6,
            collision: BAR_LABEL_COLLISION_THEME,
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            placement: 'inside',
        },
        shadow: SHADOW_THEME_DEFAULTS,
        tooltip: { interaction: { enabled: false } },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
