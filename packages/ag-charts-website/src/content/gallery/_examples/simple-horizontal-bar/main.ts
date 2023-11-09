import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

type YKey = keyof  Omit<typeof data[number], 'type'>;

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
            errorBar: {
                yLowerKey: 'earningsLower',
                yUpperKey: 'earningsUpper',
            },
            label: {
                formatter: ({ value }) => `£${value.toFixed(0)}`,
            },
            formatter: ({ datum, yKey, fill = 'transparent' }) => ({
                fill: getColor(datum[yKey], yKey as YKey, fill, 0.4, 1),
            })
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

function getColor(value: number, key: YKey, fill: string, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    alpha = map(alpha, 0, 1, minOpacity, maxOpacity);
    const { r, g, b } = convertHexToRGB(fill) ?? { r: 0, g: 0, b: 0 };
    return `rgba(${r},${g},${b}, ${alpha})`;
}

function getDomain(key: YKey) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

function convertHexToRGB(hexColor: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);

    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : undefined;
}

AgEnterpriseCharts.create(options);
