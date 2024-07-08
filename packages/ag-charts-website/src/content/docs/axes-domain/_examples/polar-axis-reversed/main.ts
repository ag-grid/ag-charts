import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
    ],
    axes: [
        {
            type: 'angle-category',
            shape: 'circle',
        },
        {
            type: 'radius-number',
            shape: 'circle',
            reverse: true,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleAxisReverse() {
    const radiusNumberAxisOptions = options.axes![1];
    radiusNumberAxisOptions.reverse = !radiusNumberAxisOptions.reverse;
    chart.update(options);
}
