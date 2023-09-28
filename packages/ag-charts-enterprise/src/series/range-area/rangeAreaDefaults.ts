import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const RANGE_AREA_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
};
