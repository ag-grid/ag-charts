import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            sizeKey: 'total',
            sizeName: 'Total',
            fills: [
                '#F4511E',
                '#FB8C00',
                '#FFB300',
                '#FDD835',
                '#C0CA33',
                '#7CB342',
                '#43A047',
                '#00897B',
                '#00ACC1',
                '#039BE5',
            ],
            strokes: [
                '#E64A19',
                '#F57C00',
                '#FFA000',
                '#FBC02D',
                '#AFB42B',
                '#689F38',
                '#388E3C',
                '#00796B',
                '#0097A7',
                '#0288D1',
            ],
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
