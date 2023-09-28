import { _Theme } from 'ag-charts-community';
const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const WATERFALL_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
};
