import { _Theme } from 'ag-charts-community';

export const AXIS_CROSSHAIR_THEME = {
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
    category: {
        crosshair: {
            enabled: false,
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
    },
};
