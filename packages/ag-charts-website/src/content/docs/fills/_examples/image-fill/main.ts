import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
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
                    },
                };
            },
        },
    ],
};

const chart = AgCharts.create(options);
