import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

type ValueKey = keyof Omit<(typeof data)[number], 'group'>;

const data = getData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            funnel: {
                axes: {
                    category: {
                        line: {
                            enabled: true,
                        },
                    },
                },
            },
        },
    },
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
                fillOpacity: getOpacity(datum[valueKey], valueKey as ValueKey, 0.4, 1),
            }),
            label: {
                formatter({ value }) {
                    return value.toLocaleString();
                },
            },
            stageLabel: {
                placement: 'before',
            },
        },
    ],
};

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

AgCharts.create(options);
