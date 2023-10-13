import { _Theme } from 'ag-charts-community';

export const ANGLE_AXIS_THEME = {
    __extends__: _Theme.EXTENDS_AXES_DEFAULTS,
    gridLine: {
        enabled: false,
        __extends__: _Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS,
    },
};
