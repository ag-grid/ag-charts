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
        enabled: true,
        snap: true,
        stroke: _Theme.DEFAULT_MUTED_LABEL_COLOUR,
        strokeWidth: 1,
        strokeOpacity: 1,
        lineDash: [5, 6],
        lineDashOffset: 0,
        label: {
            enabled: true,
        },
    },
};
