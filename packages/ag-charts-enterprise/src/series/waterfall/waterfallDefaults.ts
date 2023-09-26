import { _Theme } from 'ag-charts-community';
const { CATEGORY, NUMBER, LEFT, BOTTOM } = _Theme;

export const WATERFALL_DEFAULTS = {
    axes: [
        {
            type: CATEGORY,
            position: LEFT,
        },
        {
            type: NUMBER,
            position: BOTTOM,
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
};
