import { _Theme } from 'ag-charts-community';

export const ORDINAL_TIME_AXIS_THEME = {
    __extends__: _Theme.EXTENDS_AXES_DEFAULTS,
    groupPaddingInner: 0,
    label: {
        autoRotate: false,
    },
    gridLine: {
        __extends__: _Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS,
        enabled: false,
    },
    crosshair: {
        __extends__: _Theme.EXTENDS_AXES_CROSSHAIR_DEFAULTS,
    },
};
