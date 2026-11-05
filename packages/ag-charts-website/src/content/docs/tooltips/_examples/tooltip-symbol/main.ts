import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { getData } from './data';

let symbolEnabled = true;

function createRenderer(enabled: boolean) {
    return () => ({
        symbol: {
            marker: { enabled, shape: 'star' as const, fill: '#cc0000' },
            line: { enabled, stroke: '#ff6b00' },
        },
    });
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Monthly Temperatures' },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Temperature',
            tooltip: { renderer: createRenderer(true) },
        },
    ],
};

const chart = AgCharts.create(options);

function toggleSymbol() {
    symbolEnabled = !symbolEnabled;
    (options.series![0] as AgLineSeriesOptions).tooltip!.renderer = createRenderer(symbolEnabled);
    chart.update(options);
}
