import { _Theme } from 'ag-charts-community';
const { ANGLE_CATEGORY, RADIUS_NUMBER } = _Theme;

export const POLAR_DEFAULTS = {
    axes: [
        {
            type: ANGLE_CATEGORY,
        },
        {
            type: RADIUS_NUMBER,
        },
    ],
};
