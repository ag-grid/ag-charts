import { _Theme } from 'ag-charts-community';

const { POLAR_AXIS_TYPE } = _Theme;

export const POLAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPE.ANGLE_CATEGORY,
            label: {
                padding: 10,
            },
        },
        {
            type: POLAR_AXIS_TYPE.RADIUS_NUMBER,
        },
    ],
};
