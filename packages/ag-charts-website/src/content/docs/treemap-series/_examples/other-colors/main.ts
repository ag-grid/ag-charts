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
            strokes: [
                '#D84315',
                '#EF6C00',
                '#FF8F00',
                '#F9A825',
                '#9E9D24',
                '#558B2F',
                '#2E7D32',
                '#00695C',
                '#00838F',
                '#0277BD',
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
