import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
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
        y: {
            type: 'number',
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
