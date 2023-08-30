import type { AgCartesianChartOptions } from 'ag-charts-community';

export const RANGE_BAR_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    ],
};
