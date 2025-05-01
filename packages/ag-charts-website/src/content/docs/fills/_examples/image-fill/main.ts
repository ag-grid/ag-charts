import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    title: {
        text: "World's tallest buildings",
    },
    subtitle: {
        text: 'Height in meters',
    },

    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'bank',
            yKey: 'height',
            yName: 'Height (m)',
            strokeWidth: 1,
            itemStyler: ({ datum }) => {
                return {
                    fill: {
                        type: 'image',
                        url: datum.logo,
                        fit: 'cover',
                    },
                };
            },
        },
    ],
};

const chart = AgCharts.create(options);
