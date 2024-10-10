import { AgCharts, AgSparklineOptions } from 'ag-charts-community';
import { time } from 'ag-charts-community';

import { data } from './data';

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    width: 400,
    height: 50,
    data: data,
    type: 'line',
    xKey: 'date',
    yKey: 'price',
    xAxis: {
        type: 'time',
        interval: {
            step: time.month,
        },
        gridLine: {
            enabled: true,
        },
    },
    yAxis: {
        min: 125,
        max: 150,
    },
};

AgCharts.__createSparkline(options);
