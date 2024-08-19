import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData1, getData2 } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData1(),
    series: [
        {
            type: 'area',
            xKey: 'category',
            yKey: 'iphone',
            strokeWidth: 3,
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);

function data1() {
    options.data = getData1();
    chart.update(options);
}

function data2() {
    options.data = getData2();
    chart.update(options);
}
