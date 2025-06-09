import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'CUSTOMER JOURNEY',
        spacing: 20,
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            direction: 'horizontal',
            dropOff: {
                enabled: false,
            },
            spacingRatio: 0,
            strokeWidth: 10,
            strokeOpacity: 0,
            itemStyler: ({ datum, valueKey, stroke }) => ({
                fill: stroke,
                fillOpacity: getOpacity(datum, valueKey, 0.4, 1),
            }),
            stageLabel: {
                placement: 'before',
            },
        },
    ],
    formatter: {
        y: '#{,.0f}',
    },
};

function getOpacity(datum: DataType, key: keyof DataType, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    const value = Number(datum[key]);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: keyof DataType) {
    const min = Math.min(...data.map((d) => Number(d[key])));
    const max = Math.max(...data.map((d) => Number(d[key])));
    return [min, max];
}

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

AgCharts.create(options);
