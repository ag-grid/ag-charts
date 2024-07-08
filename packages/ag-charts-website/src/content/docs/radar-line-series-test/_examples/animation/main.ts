import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData1, getData2 } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),

    data: getData1(),
    series: [
        {
            type: 'radar-line',
            angleKey: 'category',
            radiusKey: 'iphone',
        },
        {
            type: 'radar-line',
            angleKey: 'category',
            radiusKey: 'mac',
        },
    ],
    legend: {},
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
