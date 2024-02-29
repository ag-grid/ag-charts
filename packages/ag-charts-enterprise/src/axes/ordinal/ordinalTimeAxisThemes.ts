import { _Theme } from 'ag-charts-community';

export const ORDINAL_TIME_AXIS_THEME = {
    __extends__: _Theme.EXTENDS_AXES_DEFAULTS,
    groupPaddingInner: 0.1,
    label: {
        autoRotate: true,
    },
    gridLine: {
        __extends__: _Theme.EXTENDS_AXES_GRID_LINE_DEFAULTS,
        enabled: false,
    },
};
