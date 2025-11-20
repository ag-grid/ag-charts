import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry } from 'ag-charts-community';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Desktop Operating Systems',
    },
    series: [
        {
            type: 'bar',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                formatter: ({ value }) => (value === 'Windows' ? '== Windows ==' : value),
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => `${value * 100}%`,
            },
        },
    },
};

AgCharts.create(options);
