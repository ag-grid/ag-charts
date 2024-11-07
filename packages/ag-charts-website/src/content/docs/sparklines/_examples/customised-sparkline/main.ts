import { AgCharts, AgSparklineOptions } from 'ag-charts-community';

import { data } from './data';

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    width: 400,
    height: 50,
    data: data,
    type: 'bar',
    xKey: 'date',
    yKey: 'price',
    fill: '#5C6BC0',
    cornerRadius: 3,
};

AgCharts.__createSparkline(options);
