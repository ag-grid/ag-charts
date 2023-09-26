import { _Theme } from 'ag-charts-community';
const { CATEGORY, NUMBER, LEFT, BOTTOM } = _Theme;

export const BOX_PLOT_SERIES_DEFAULTS = {
    axes: [
        {
            type: CATEGORY,
            position: LEFT,
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
        {
            type: NUMBER,
            position: BOTTOM,
            crosshair: {
                snap: false,
            },
        },
    ],
};
