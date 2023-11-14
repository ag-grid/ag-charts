import { AgChart, AgChartLegendPosition, AgChartOptions } from 'ag-charts-community';

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
        item: {
            label: {
                fontSize: 14,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontFamily: 'Papyrus',
                color: 'red',
                maxLength: 25,
            },
            marker: {
                size: 20,
                strokeWidth: 3,
                shape: 'diamond', // 'circle', 'square', 'cross', 'plus', 'triangle'
            },
        },
    },
};

var chart = AgChart.create(options);

function updateLegendPosition(value: AgChartLegendPosition) {
    options.legend!.position = value;
    AgChart.update(chart, options);
}

function setLegendEnabled(enabled: boolean) {
    options.legend!.enabled = enabled;
    AgChart.update(chart, options);
}
