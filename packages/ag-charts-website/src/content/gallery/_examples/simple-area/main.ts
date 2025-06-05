import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const shortDateFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
});

const longDateFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const options: AgChartOptions<DataType> = {
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
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Sign Ups',
            },
        },
    ],
    formatter: {
        x(params) {
            if (params.type !== 'date') return;
            const formatter = params.style === 'component' ? shortDateFormat : longDateFormat;
            return formatter
                .formatToParts(params.value)
                .map((part) => {
                    if (part.type !== 'day') return part.value;

                    const suffixes = ['st', 'nd', 'rd'];
                    const suffix = suffixes[Number(part.value) - 1] ?? 'th';
                    return `${part.value}${suffix}`;
                })
                .join('');
        },
    },
};

AgCharts.create(options);
