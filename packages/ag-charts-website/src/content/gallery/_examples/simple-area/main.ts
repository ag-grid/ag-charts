import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'User Engagement Trends',
    },
    footnote: {
        text: 'Daily new signups for May 1–14, 2025',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'newSignups',
            yName: 'Sign Ups',
            fillOpacity: 1,
            fill: {
                type: 'image',
                url: '${baseWWWUrl}/example-assets/docs-images/tile.png',
                width: 50,
                height: 50,
                repeat: 'repeat',
                backgroundFillOpacity: 0.3,
            },
            interpolation: {
                type: 'smooth',
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            unit: 'day',
            label: {
                formatter: ({ value }) => {
                    const day = value.getDate();
                    const suffixes = ['st', 'nd', 'rd'];
                    const suffix = suffixes[day - 1] ?? 'th';

                    return `${day}${suffix} May`;
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Sign Ups',
            },
        },
    ],
};

AgCharts.create(options);
