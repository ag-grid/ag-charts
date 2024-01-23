import { _Theme } from 'ag-charts-community';

const { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE } = _Theme;
export const RADIAL_COLUMN_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPE.ANGLE_CATEGORY,
            shape: POLAR_AXIS_SHAPE.CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPE.RADIUS_NUMBER,
            shape: POLAR_AXIS_SHAPE.CIRCLE,
            innerRadiusRatio: 0.5,
        },
    ],
};
