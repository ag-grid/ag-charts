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
            min: new Date('2024-01-01'),
            max: new Date('2024-07-01'),
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
    navigator: {
        min: 0.95,
        max: 1.0,
    },
};

AgCharts.create(options);
