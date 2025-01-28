import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE },
} = _ModuleSupport;

export const RADIAL_COLUMN_SERIES_THEME: _ModuleSupport.SeriesModule<'radial-column'>['themeTemplate'] = {
    series: {
        columnWidthRatio: 0.5,
        maxColumnWidthRatio: 0.5,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'foregroundColor' },
        },
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: POLAR_AXIS_SHAPE.CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                spacing: 10,
            },
        },
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: POLAR_AXIS_SHAPE.CIRCLE,
            innerRadiusRatio: 0.5,
        },
    },
};
