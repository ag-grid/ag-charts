import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_FONT_FAMILY, DEFAULT_INVERTED_LABEL_COLOUR },
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const RADIAL_BAR_SERIES_THEME = {
    series: {
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_INVERTED_LABEL_COLOUR,
        },
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
