import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const HEATMAP_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
        },
    ],
    gradientLegend: {
        enabled: true,
    },
};
