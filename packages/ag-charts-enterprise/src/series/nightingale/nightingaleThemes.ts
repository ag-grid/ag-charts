import { _Theme } from 'ag-charts-community';

export const NIGHTINGALE_SERIES_THEME = {
    series: {
        strokeWidth: 1,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
        },
    },
    axes: {
        [_Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: _Theme.POLAR_AXIS_SHAPE.CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        [_Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: _Theme.POLAR_AXIS_SHAPE.CIRCLE,
        },
    },
};
