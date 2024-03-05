import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
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
    options.tooltip!.position!.type = 'top-right';
    options.tooltip!.position!.xOffset = -20;
    options.tooltip!.position!.yOffset = 0;
    AgCharts.update(chart, options);
}

function fixTooltipToPointer() {
    options.tooltip!.position!.type = 'pointer';
    options.tooltip!.position!.xOffset = 80;
    options.tooltip!.position!.yOffset = 80;
    AgCharts.update(chart, options);
}

function reset() {
    options.tooltip.position!.type = 'node';
    options.tooltip.position!.xOffset = 0;
    options.tooltip.position!.yOffset = 0;
    AgCharts.update(chart, options);
}
