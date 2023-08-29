import type { AgCartesianChartOptions } from 'ag-charts-community';

export const WATERFALL_BAR_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
};
