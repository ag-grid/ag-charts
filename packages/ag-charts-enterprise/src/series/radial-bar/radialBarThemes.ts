import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_CONIC_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    POLAR_AXIS_TYPE,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const RADIAL_BAR_SERIES_THEME: ExtensibleSeriesTheme<'radial-bar'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_CONIC_SERIES_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        fillOpacity: 1,
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        tooltip: { interaction: { enabled: false } },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    axes: {
        [POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    },
};
