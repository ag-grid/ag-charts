import {
    FILL_GRADIENT_RADIAL_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    POLAR_AXIS_SHAPE,
    POLAR_AXIS_TYPE,
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

// Sector strokes default to chartBackgroundColor ('white' in light-mode).
// We want selected sectors to use the theme/palette stroke on the background color.
const NIGHTINGALE_SELECTION_THEME: typeof SERIES_SELECTION_THEME = {
    ...SERIES_SELECTION_THEME,
    selectedItem: {
        ...SERIES_SELECTION_THEME.selectedItem,
        stroke: { $palette: 'stroke' },
    },
};

export const NIGHTINGALE_SERIES_THEME: ExtensibleTheme<'nightingale'> = {
    series: {
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
        strokeWidth: 1,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: false },
        selection: NIGHTINGALE_SELECTION_THEME,
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
