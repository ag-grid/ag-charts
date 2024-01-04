import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const BOX_PLOT_SERIES_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
            crosshair: {
                snap: false,
            },
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    ],
};
