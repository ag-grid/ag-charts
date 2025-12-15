import {
    FILL_GRADIENT_CONIC_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    POLAR_AXIS_TYPE,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

export const RADIAL_BAR_SERIES_THEME: ExtensibleTheme<'radial-bar'> = {
    series: {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_CONIC_SERIES_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        highlight: MULTI_SERIES_HIGHLIGHT_STYLE,
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
