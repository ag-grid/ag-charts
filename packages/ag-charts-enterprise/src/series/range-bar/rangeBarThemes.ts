import { type AgChartThemeOverrides, type WithThemeParams } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
    undocumentedThemeOptions,
} from 'ag-charts-core';

export const RANGE_BAR_SERIES_THEME: WithThemeParams<AgChartThemeOverrides['range-bar']> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical' as const,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            spacing: 6,
            padding: 6,
            collision: {
                threshold: 4,
                alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
                ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
            },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            placement: 'inside',
        },
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
