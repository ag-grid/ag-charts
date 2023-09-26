import { _Theme } from 'ag-charts-community';
const { CATEGORY, LEFT, BOTTOM } = _Theme;

export const HEATMAP_DEFAULTS = {
    axes: [
        {
            type: CATEGORY,
            position: LEFT,
        },
        {
            type: CATEGORY,
            position: BOTTOM,
        },
    ],
    gradientLegend: {
        enabled: true,
    },
};
