import type { AgCartesianChartOptions } from 'ag-charts-community';

export const BOX_PLOT_SERIES_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'category',
            position: 'left',
        },
    ],
};
