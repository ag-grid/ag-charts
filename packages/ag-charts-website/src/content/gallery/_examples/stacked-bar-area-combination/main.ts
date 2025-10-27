import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

type ValueKey = keyof Omit<(typeof data)[number], 'year'>;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Music Revenue Trends, 1975–2024',
    },
    subtitle: {
        text: 'The Evolution of Music Formats',
    },
    footnote: {
        text: 'Data represents global music revenue (in millions of USD) by format, based on historical trends and estimates.',
    },
    theme: {
        overrides: {
            bar: {
                series: {
                    itemStyler: ({ datum, yKey }) => ({
                        fillOpacity: getOpacity(Math.abs(datum[yKey]), yKey as ValueKey, 0.4, 1),
                    }),
                },
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'cassette',
            yName: 'Cassette',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'cd',
            yName: 'CD',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ringtones',
            yName: 'Ringtones',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'streaming',
            yName: 'Streaming',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'digitalDownloads',
            yName: 'Digital Downloads',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'minidisc',
            yName: 'Mini Disc',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'vinyl',
            yName: 'Vinyl',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'concertTicketSales',
            yName: 'Concert Ticket Sales',
            interpolation: {
                type: 'step',
            },
            fillOpacity: 0.3,
            strokeOpacity: 0.6,
            strokeWidth: 2,
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => value.toLocaleString(),
            },
            interval: {
                step: 4000,
            },
            tick: {
                enabled: true,
            },
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            min: new Date(1974, 0, 0),
            max: new Date(2024, 12, 0),
            tick: {
                enabled: true,
            },
            gridLine: {
                enabled: true,
            },
            interval: { step: { unit: 'year', step: 4 } },
        },
    },
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);

function getOpacity(value: number, key: ValueKey, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: ValueKey) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};
