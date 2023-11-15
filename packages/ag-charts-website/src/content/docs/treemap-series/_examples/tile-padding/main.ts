import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function formatSize(value: number) {
    const e = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
    const prefix = ['B', 'KB', 'MB', 'GB'][e];
    return `${Math.round(value / Math.pow(1024, e))}${prefix}`;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            colorKey: 'size',
            colorRange: ['#241248', '#2a9850'],
            group: {
                label: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    spacing: 5,
                },
                textAlign: 'left',
                fill: '#241248',
                stroke: 'white',
                strokeWidth: 1,
                padding: 20,
            },
            tile: {
                label: {
                    fontSize: 24,
                    minimumFontSize: 9,
                    color: 'white',
                },
                stroke: 'white',
                padding: 10,
            },
            tileSpacing: 10,
            highlightStyle: {
                tile: {
                    stroke: 'white',
                    strokeWidth: 4,
                },
                group: {
                    stroke: 'white',
                    strokeWidth: 4,
                },
            },
            tooltip: {
                renderer: (params) => {
                    return params.depth === 2 ? { content: formatSize(params.datum.size) } : { content: '' };
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

AgEnterpriseCharts.create(options);
