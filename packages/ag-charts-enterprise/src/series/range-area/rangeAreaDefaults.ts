import { _Theme } from 'ag-charts-community';
const { CATEGORY, NUMBER, LEFT, BOTTOM } = _Theme;

export const RANGE_AREA_DEFAULTS = {
    axes: [
        {
            type: NUMBER,
            position: LEFT,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: CATEGORY,
            position: BOTTOM,
        },
    ],
};
