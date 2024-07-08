import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

type YKey = keyof Omit<(typeof data)[number], 'type'>;

const data = getData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Weekly Earnings',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'earnings',
            cornerRadius: 4,
            errorBar: {
                yLowerKey: 'earningsLower',
                yUpperKey: 'earningsUpper',
            },
            label: {
                formatter: ({ value }) => `£${value.toFixed(0)}`,
            },
            itemStyler: ({ datum, yKey }) => ({
                fillOpacity: getOpacity(datum[yKey], yKey as YKey, 0.4, 1),
            }),
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: '£ / Week',
            },
        },
    ],
};

function getOpacity(value: number, key: YKey, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: YKey) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

AgCharts.create(options);
