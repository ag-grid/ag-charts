import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    StatusBarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, StatusBarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Quarterly Revenue and Costs' },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
            collector: ({ datum, values }) => [
                ...values,
                {
                    key: 'margin',
                    label: 'Margin',
                    value: (datum.revenue - datum.costs) / datum.revenue,
                    formattedValue: `${(((datum.revenue - datum.costs) / datum.revenue) * 100).toFixed(1)}%`,
                },
            ],
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'costs',
            yName: 'Costs',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    formatter: {
        y: ({ value }) => `$${value}K`,
    },
    statusBar: {
        enabled: true,
    },
};

AgCharts.create(options);
