import type { AgCartesianChartOptions } from 'ag-charts-community';

export const RANGE_AREA_DEFAULTS: AgCartesianChartOptions = {
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
            groupPaddingInner: 0,
            paddingInner: 0.9,
            paddingOuter: 0.1,
        },
    ],
};
