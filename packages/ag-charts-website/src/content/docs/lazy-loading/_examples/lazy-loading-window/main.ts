import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getCoarseAndFineData, getCoarseData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: (({ axes }: any) => {
        const timeAxis = axes ? axes.find((a: any) => a.type === 'time') : undefined;
        if (!timeAxis) return getCoarseData();
        return getCoarseAndFineData(timeAxis.min, timeAxis.max);
    }) as any,
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
            yName: 'Price',
        },
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'quantity',
            yName: 'Quantity',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            keys: ['price'],
        },
        {
            type: 'number',
            position: 'right',
            keys: ['quantity'],
            max: 100,
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
    zoom: {
        enabled: true,
        axes: 'x',
        anchorPointX: 'pointer',
        minVisibleItemsX: 1,
    },
};

AgCharts.create(options);
