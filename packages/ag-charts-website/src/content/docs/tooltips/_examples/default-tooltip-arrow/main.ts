import { AgCartesianChartOptions, AgChart } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            stacked: true,
            yKey: 'value1',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            stacked: true,
            yKey: 'hats_made',
            yName: 'Hats Made',
        },
    ],
    tooltip: {
        showArrow: true,
    },
};

const chart = AgChart.create(options);

function toggleTooltipArrow() {
    options.tooltip!.showArrow = !options.tooltip!.showArrow;
    AgChart.update(chart, options);
}
