import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    NEAREST_TOOLTIP_THEME,
    POLAR_AXIS_TYPE,
    SAFE_STROKE_FILL_OPERATION,
    SERIES_SELECTION_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    fillThemeTemplate,
    mergeDefaults,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

const BASE_RADAR_SERIES_THEME: ExtensibleSeriesTheme<'radar-line' | 'radar-area'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        ...STROKE_STYLE_THEME_DEFAULTS,
        connectMissingData: false,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            color: { $ref: 'textColor' },
        },
        marker: {
            enabled: true,
            shadow: SHADOW_THEME_DEFAULTS,
            fill: fillThemeTemplate(FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS),
            stroke: { $palette: 'stroke' },
            fillOpacity: 1,
            shape: 'circle',
            size: 6,
            ...STROKE_STYLE_THEME_DEFAULTS,
            strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
        },
        highlight: { ...MARKER_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
        tooltip: NEAREST_TOOLTIP_THEME,
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            label: {
                spacing: 10,
            },
        },
    },
};

export const RADAR_LINE_SERIES_THEME: ExtensibleSeriesTheme<'radar-line'> = mergeDefaults(
    {
        series: {
            stroke: SAFE_STROKE_FILL_OPERATION,
            strokeWidth: 2,
        },
    },
    BASE_RADAR_SERIES_THEME
);

export const RADAR_AREA_SERIES_THEME: ExtensibleSeriesTheme<'radar-area'> = mergeDefaults(
    {
        series: {
            fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
            stroke: { $palette: 'stroke' },
            fillOpacity: 0.8,
            strokeWidth: 2,
            shadow: SHADOW_THEME_DEFAULTS,
            marker: {
                enabled: false,
            },
        },
    },
    BASE_RADAR_SERIES_THEME
);
