import { _Theme } from 'ag-charts-community';

export const RADIAL_BAR_SERIES_THEME = {
    series: {
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INVERTED_LABEL_COLOUR,
        },
    },
    axes: {
        [_Theme.POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    },
};
