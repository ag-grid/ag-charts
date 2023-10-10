import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly Average Temperatures with Error Bars (Celsius)',
    },
    series: [
        {
            data: getData(),
            xKey: 'month',
            yKey: 'temperature',
            errorBar:  {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                stroke: 'orange',
                cap: {
                     strokeWidth: 4,
                },
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function line() {
    for (const opt of options.series ?? []) {
        opt.type = 'line';
    }
    AgEnterpriseCharts.update(chart, options);
}

function bar() {
    for (const opt of options.series ?? []) {
        opt.type = 'bar';
    }
    AgEnterpriseCharts.update(chart, options);
}
