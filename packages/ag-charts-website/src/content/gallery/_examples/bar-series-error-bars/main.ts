import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Average Temperatures',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'temperature',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
            },
        },
    ],
};

AgCharts.create(options);
