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
    yKey: 'change',
    xAxis: {
        type: 'time',
        visible: true,
        stroke: '#66A4',
        strokeWidth: 1,
    },
    yAxis: {
        type: 'number',
        visible: false,
        min: -3,
        max: 3,
    },
};

AgCharts.__createSparkline(options);
