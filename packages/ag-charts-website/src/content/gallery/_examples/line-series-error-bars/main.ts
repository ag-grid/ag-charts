import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Average Temperatures',
    },
    series: [
        {
            type: 'line',
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
