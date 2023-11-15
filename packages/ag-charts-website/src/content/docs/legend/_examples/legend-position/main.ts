import { AgChartLegendPosition, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
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

var chart = AgCharts.create(options);

function updateLegendPosition(value: AgChartLegendPosition) {
    options.legend!.position = value;
    AgCharts.update(chart, options);
}

function setLegendEnabled(enabled: boolean) {
    options.legend!.enabled = enabled;
    AgCharts.update(chart, options);
}
