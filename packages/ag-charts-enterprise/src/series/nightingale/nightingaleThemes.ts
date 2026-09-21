import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_RADIAL_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    POLAR_AXIS_SHAPE,
    POLAR_AXIS_TYPE,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const NIGHTINGALE_SERIES_THEME: ExtensibleSeriesTheme<'nightingale'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_RADIAL_SERIES_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: {
            $if: [{ $eq: [{ $palette: 'type' }, 'inbuilt'] }, { $ref: 'chartBackgroundColor' }, { $palette: 'stroke' }],
        },
        fillOpacity: 1,
        strokeWidth: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        tooltip: { interaction: { enabled: false } },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: false },
        selection: SERIES_SELECTION_THEME,
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: { $findFirstSiblingNotOperation: POLAR_AXIS_SHAPE.CIRCLE },
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                spacing: 10,
            },
        },
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: { $findFirstSiblingNotOperation: POLAR_AXIS_SHAPE.CIRCLE },
        },
    },
};
