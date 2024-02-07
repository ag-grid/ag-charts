import { _Theme } from 'ag-charts-community';

export const RADIAL_COLUMN_SERIES_THEME = {
    series: {
        __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
        columnWidthRatio: 0.5,
        maxColumnWidthRatio: 0.5,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
            __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
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
            innerRadiusRatio: 0.5,
        },
    },
};
