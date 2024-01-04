import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const WATERFALL_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
};
