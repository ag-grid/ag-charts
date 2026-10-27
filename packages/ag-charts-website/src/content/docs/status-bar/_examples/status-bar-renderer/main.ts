import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    StatusBarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule, StatusBarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Average Monthly Temperatures' },
    series: [
        { type: 'line', xKey: 'month', yKey: 'london', yName: 'London' },
        { type: 'line', xKey: 'month', yKey: 'paris', yName: 'Paris' },
        { type: 'line', xKey: 'month', yKey: 'rome', yName: 'Rome' },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Average Temperature' } },
    },
    formatter: {
        y: ({ value }) => `${value}°C`,
    },
    statusBar: {
        enabled: true,
        renderer: ({ values, active }) => {
            const temperatures = values.map(({ value }) => Number(value));
            const average = temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;
            return [
                { label: active ? 'Month' : 'Latest', value: String(values[0]?.datum.month ?? '') },
                ...values.map(({ label, formattedValue, value }) => ({
                    label,
                    value: formattedValue ?? String(value),
                })),
                { label: 'Average', value: `${average.toFixed(1)}°C` },
            ];
        },
    },
};

AgCharts.create(options);
