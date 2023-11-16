import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

function formatSize(value: number) {
    const e = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
    const prefix = ['B', 'KB', 'MB', 'GB'][e];
    return `${Math.round(value / Math.pow(1024, e))}${prefix}`;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'size',
            sizeKey: 'size',
            colorKey: 'numberFiles',
            colorRange: ['#81C784', '#E57373'],
            fills: ['#424242', '#455A64'],
            strokes: ['#212121', '#37474F'],
            group: {
                label: {
                    fontSize: 18,
                    color: 'white',
                    spacing: 5,
                },
                padding: 10,
            },
            tile: {
                label: {
                    fontSize: 32,
                    minimumFontSize: 18,
                    spacing: 12,
                },
                secondaryLabel: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    formatter: (params) => formatSize(params.datum.size),
                },
                stroke: 'rgba(0, 0, 0, 0.4)',
                padding: 10,
            },
            tileSpacing: 5,
            highlightStyle: {
                group: {
                    label: {
                        color: 'white',
                    },
                },
            },
            tooltip: {
                renderer: (params) => {
                    const { size, numberFiles } = params.datum;
                    return size != null && numberFiles != null
                        ? { content: `${numberFiles} files, ${formatSize(size)}` }
                        : { content: '' };
                },
            },
        },
    ],
    title: {
        text: 'My Computer',
    },
    subtitle: {
        text: 'Disk Size',
    },
};

AgCharts.create(options);
