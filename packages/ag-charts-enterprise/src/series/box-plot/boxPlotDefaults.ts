import type { AgCartesianChartOptions } from 'ag-charts-community';

export const BOX_PLOT_SERIES_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'bottom',
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
        {
            type: 'number',
            position: 'left',
            crosshair: {
                snap: false,
            },
        },
    ],
};
