import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

let symbolEnabled = true;

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
            tooltip: {
                renderer: () => {
                    return {
                        symbol: {
                            marker: {
                                enabled: symbolEnabled,
                                shape: 'star',
                                fill: '#cc0000',
                            },
                            line: {
                                enabled: symbolEnabled,
                                stroke: '#ff6b00',
                            },
                        },
                    };
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);

function toggleSymbol() {
    symbolEnabled = !symbolEnabled;
    chart.update(options);
}
