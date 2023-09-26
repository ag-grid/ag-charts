import { _Theme } from 'ag-charts-community';
const { POLAR_AXIS_TYPES, CIRCLE } = _Theme;
export const RADIAL_COLUMN_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES.ANGLE_CATEGORY,
            shape: CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPES.RADIUS_NUMBER,
            shape: CIRCLE,
            innerRadiusRatio: 0.5,
        },
    ],
};
