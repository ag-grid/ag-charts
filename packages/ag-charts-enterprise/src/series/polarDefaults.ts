import { _Theme } from 'ag-charts-community';
const { POLAR_AXIS_TYPES } = _Theme;

export const POLAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES.ANGLE_CATEGORY,
        },
        {
            type: POLAR_AXIS_TYPES.RADIUS_NUMBER,
        },
    ],
};
