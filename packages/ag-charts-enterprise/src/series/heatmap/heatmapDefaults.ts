import { _Theme } from 'ag-charts-community';
const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const HEATMAP_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
    gradientLegend: {
        enabled: true,
    },
};
