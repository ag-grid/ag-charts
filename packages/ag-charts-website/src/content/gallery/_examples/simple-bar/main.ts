import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: 'ag-default',
    title: {
        text: 'Total Visitors to Museums and Galleries',
        fontSize: 20,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
        fontSize: 12,
        fontStyle: 'italic',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            cornerRadius: 4,
            strokeWidth: 1,
            label: {
                enabled: true,
                placement: 'inside-center',
                fontSize: 14,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
                rotation: 0,
            },
            gridLine: {
                enabled: false,
            },
            bandHighlight: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors (Millions)',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
                formatter: (params) => {
                    const value = params.value as number;
                    return `${Math.round(value / 1_000_000)}M`;
                },
            },
            gridLine: {
                style: [
                    {
                        lineDash: [2, 3],
                        strokeWidth: 1,
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    ],
    formatter: {
        y(params) {
            const value = params.value as number;
            const millions = value / 1_000_000;
            const accuracy = ['series-label', 'axis-label'].includes(params.source) ? 0 : 1;
            return `${millions.toFixed(accuracy)}M`;
        },
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
