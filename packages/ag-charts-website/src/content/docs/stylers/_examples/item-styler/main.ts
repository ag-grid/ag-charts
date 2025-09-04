import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType, data } from './data';

function lerpColor(t: number, color1: string, color2: string): string {
    const tt = Math.max(0, Math.min(1.5, t)) / 1.5;

    const hexToRgb = (hex: string) => {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    };

    const rgbToHex = (r: number, g: number, b: number) =>
        `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * tt);
    const g = Math.round(c1.g + (c2.g - c1.g) * tt);
    const b = Math.round(c1.b + (c2.b - c1.b) * tt);

    return rgbToHex(r, g, b);
}

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
        text: 'UK Energy Sources',
    },
    subtitle: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'coal',
            yName: 'Coal',
            marker: {
                itemStyler: ({ datum: { coal, nuclear }, fill, size }) => {
                    return coal > nuclear ? { fill: 'red', size: 15 } : { fill, size };
                },
            },
            label: {
                itemStyler: ({ datum: { coal, nuclear } }) => {
                    return { enabled: coal > nuclear };
                },
            },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'nuclear',
            yName: 'Nuclear',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'imported',
            yName: 'Imported',
            itemStyler: ({ datum, fill, highlighted }) => {
                return {
                    fill: datum.month === 'Jul' ? (highlighted ? 'lime' : 'red') : fill,
                };
            },
            label: {
                itemStyler: ({ datum: { month } }) => {
                    return { enabled: month === 'Jul' };
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                format: '#{.1f}%',
                itemStyler: (params) => {
                    return { color: lerpColor(Number.parseFloat(params.value), '#00b347', '#cc2900') };
                },
            },
            title: {
                text: 'Normalized Percentage Energy',
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
};

AgCharts.create(options);
