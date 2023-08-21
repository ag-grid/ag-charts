import type { AgCartesianChartOptions } from 'ag-charts-community';

export const RANGE_COLUMN_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'left',
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
};

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
