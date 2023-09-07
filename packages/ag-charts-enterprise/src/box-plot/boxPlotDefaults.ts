import type { AgCartesianChartOptions } from 'ag-charts-community';

export const BOX_PLOT_SERIES_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'left',
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            crosshair: {
                snap: false,
            },
        },
    ],
};
