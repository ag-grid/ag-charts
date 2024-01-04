import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const RANGE_BAR_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    ],
};
