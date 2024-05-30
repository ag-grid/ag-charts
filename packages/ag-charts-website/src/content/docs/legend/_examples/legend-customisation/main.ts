import { AgCartesianChartOptions, AgChartLegendPosition, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),

    data: getData(),

    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'naturalGas',
            yName: 'Natural gas',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'coal',
            yName: 'Coal',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'primaryOil',
            yName: 'Primary oil',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petroleum',
            yName: 'Petroleum',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'manufacturedFuels',
            yName: 'Manufactured fuels',
        },
    ],
    legend: {
        item: {
            showSeriesStroke: true,
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
            line: {
                strokeWidth: 4,
                length: 15,
            },
        },
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
