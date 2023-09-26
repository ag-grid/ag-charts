import { _Theme } from 'ag-charts-community';
const { CATEGORY, NUMBER, LEFT, BOTTOM } = _Theme;

export const RANGE_BAR_DEFAULTS = {
    axes: [
        {
            type: CATEGORY,
            position: LEFT,
        },
        {
            type: NUMBER,
            position: BOTTOM,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    ],
};
