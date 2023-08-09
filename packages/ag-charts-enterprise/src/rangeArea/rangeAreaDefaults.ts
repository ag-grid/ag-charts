import type { AgCartesianChartOptions } from 'ag-charts-community';

export const RANGE_AREA_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
};
