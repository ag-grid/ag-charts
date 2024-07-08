import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
    ],
    tooltip: {
        position: {},
    },
};

const chart = AgCharts.create(options);

function fixTooltipToTopRight() {
    options.tooltip = {
        position: {
            type: 'top-right',
            xOffset: -20,
            yOffset: 0,
        },
    };
    chart.update(options);
}

function fixTooltipToPointer() {
    options.tooltip = {
        position: {
            type: 'pointer',
            xOffset: 80,
            yOffset: 8,
        },
    };
    chart.update(options);
}

function reset() {
    options.tooltip = {
        position: {
            type: 'node',
            xOffset: 0,
            yOffset: 0,
        },
    };
    chart.update(options);
}
