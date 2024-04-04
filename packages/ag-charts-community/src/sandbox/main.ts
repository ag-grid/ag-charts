import { AgCharts } from './agCharts';

AgCharts.create({
    data: [],
    axes: [
        {
            type: 'category',
        },
    ],
    series: [
        {
            type: 'line',
        },
        {
            type: 'area',
        },
    ],
});
