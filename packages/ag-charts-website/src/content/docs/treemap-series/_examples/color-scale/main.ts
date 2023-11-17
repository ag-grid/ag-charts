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
            sizeKey: 'size',
            colorKey: 'numberFiles',
            colorRange: ['rgb(63, 145, 79)', 'rgb(253, 149, 63)'],
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
