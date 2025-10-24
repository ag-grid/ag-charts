import { _ModuleSupport } from 'ag-charts-community';
import type { ExtensibleTheme } from 'ag-charts-types';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
    FILL_GRADIENT_CONIC_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
} = _ModuleSupport;

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
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        highlight: _ModuleSupport.multiSeriesHighlightStyle(),
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
