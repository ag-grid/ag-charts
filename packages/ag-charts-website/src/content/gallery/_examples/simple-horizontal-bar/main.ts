import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataNumberKey, DataType, getData } from './data';

const data = getData();
const options: AgChartOptions<DataType> = {
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
                enabled: true,
            },
            itemStyler: ({ datum, yKey }) => ({
                fillOpacity: getOpacity(datum, yKey as DataNumberKey, 0.4, 1),
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
    formatter: {
        x: '£#{.0f}',
    },
};

function getOpacity(datum: DataType, key: DataNumberKey, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    const value = datum[key];
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: DataNumberKey) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

AgCharts.create(options);
