import { AgAreaSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, LegendModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Streaming Music Sales',
    },
    subtitle: {
        text: 'IN BILLIONS USD',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'sales',
            yName: 'Sales',
            strokeWidth: 1,
            fill: {
                type: 'pattern',
                path: 'M0,6 Q4,1 8,6 T16,6',
                width: 16,
                height: 10,
                strokeWidth: 1,
                fill: 'none',
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
    },
};

const chart = AgCharts.create(options);

function line() {
    (options.series![0] as AgAreaSeriesOptions).fill = {
        type: 'pattern',
        path: 'M0,6 Q4,1 8,6 T16,6',
        width: 16,
        height: 10,
        strokeWidth: 1,
        fill: 'none',
    };
    chart.update(options);
}

function shape() {
    (options.series![0] as AgAreaSeriesOptions).fill = {
        type: 'pattern',
        path: 'M7.83985 3.88382V16.6592C7.09646 15.9961 6.11687 15.5923 5.04461 15.5923C2.72664 15.5923 0.84082 17.4782 0.84082 19.7962C0.84082 22.1142 2.72664 24 5.04461 24C7.35971 24 9.24357 22.1189 9.24835 19.8049H9.24845V9.53787L21.7527 6.36814V13.2679C21.0093 12.6048 20.0297 12.201 18.9575 12.201C16.6394 12.201 14.7536 14.0868 14.7536 16.4048C14.7536 18.7228 16.6394 20.6086 18.9575 20.6086C21.2754 20.6086 23.1612 18.7228 23.1612 16.4048V0L7.83985 3.88382Z',
        width: 24,
        height: 24,
        strokeWidth: 0,
    };
    chart.update(options);
}
