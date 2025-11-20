import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Product Sales Performance',
    },
    subtitle: {
        text: 'Q4 2025 Sales vs Target',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'sales',
            yName: 'Sales',
            label: {
                enabled: true,
                formatter: ({ value }) => {
                    return [
                        {
                            text: value.toString(),
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: 'white',
                        },
                        {
                            text: '\nunits',
                            fontSize: 11,
                            color: 'rgba(255, 255, 255, 0.8)',
                        },
                    ];
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => {
                    if (value === 0) return '0';
                    return [
                        {
                            text: value.toString(),
                            fontSize: 13,
                            fontWeight: 'bold',
                        },
                        {
                            text: ' units',
                            fontSize: 10,
                        },
                    ];
                },
            },
        },
    },
};

AgCharts.create(options);
