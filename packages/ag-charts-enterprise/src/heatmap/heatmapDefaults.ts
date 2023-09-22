import type { AgCartesianChartOptions } from 'ag-charts-community';

export const HEATMAP_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'left',
            paddingInner: 0,
            paddingOuter: 0,
        },
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0,
            paddingOuter: 0,
        },
    ],
    gradientLegend: {
        enabled: true,
    },
};
