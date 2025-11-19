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
                    return coal > nuclear ? { fill: '#f44', size: 15 } : { fill, size };
                },
            },
            label: {
                itemStyler: ({ datum: { coal, nuclear } }) => {
                    if (coal > nuclear) {
                        return { fontSize: 12, border: { stroke: '#f44' }, padding: 2 };
                    }
                    return { fontSize: 8 };
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
            itemStyler: ({ datum, fill, highlightState }) => {
                return {
                    fill: datum.month === 'Jul' ? (highlightState === 'highlighted-item' ? 'lime' : '#f44') : fill,
                };
            },
            label: {
                itemStyler: ({ datum: { month } }) => {
                    return { color: month !== 'Jul' ? 'transparent' : undefined };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            interval: { step: 0.2 },
            gridLine: {
                enabled: false,
            },
            max: 2,
            label: {
                format: '#{.1f}%',
                fontWeight: 600,
                itemStyler: (params) => {
                    return {
                        color: lerpColor(params.value, '#00b347', '#cc2900'),
                    };
                },
            },
            title: {
                text: 'Normalized Percentage Energy',
            },
        },
    },
};

AgCharts.create(options);
