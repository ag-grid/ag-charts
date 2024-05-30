import { AgCartesianChartOptions, AgChartLegendPosition, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),

    data: getData(),

    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'naturalGas',
            yName: 'Natural gas',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'coal',
            yName: 'Coal',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'primaryOil',
            yName: 'Primary oil',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'petroleum',
            yName: 'Petroleum',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'manufacturedFuels',
            yName: 'Manufactured fuels',
        },
    ],
    legend: {
        position: 'right',
    },
};

const chart = AgCharts.create(options);

function updateLegendPosition(value: AgChartLegendPosition) {
    options.legend!.position = value;
    chart.update(options);
}

function setLegendEnabled(enabled: boolean) {
    options.legend!.enabled = enabled;
    chart.update(options);
}
