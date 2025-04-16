import { AgCharts, AgPolarChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'bank',
            yKey: 'totalAssets',
            yName: 'Total Assets',
            strokeWidth: 1,
            itemStyler: ({ datum }) => {
                return {
                    fill: {
                        type: 'image',
                        url: datum.logo,
                        fit: 'contain', // cover, stretch
                        backgroundFill: 'pink',
                        repetition: 'no-repeat',
                    },
                };
            },
        },
    ],
};

const chart = AgCharts.create(options);
