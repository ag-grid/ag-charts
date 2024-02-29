import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cet, eet, gmt, msk } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across Europe',
    },
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            data: gmt,
            idKey: 'name',
            stroke: 'white',
            strokeWidth: 1,
            legendItemName: 'Greenwich Mean Time',
        },
        {
            // @ts-ignore
            type: 'map',
            topology,
            data: cet,
            idKey: 'name',
            stroke: 'white',
            strokeWidth: 1,
            legendItemName: 'Central European Time',
        },
        {
            // @ts-ignore
            type: 'map',
            topology,
            data: eet,
            idKey: 'name',
            stroke: 'white',
            strokeWidth: 1,
            legendItemName: 'Eastern European Time',
        },
        {
            // @ts-ignore
            type: 'map',
            topology,
            data: msk,
            idKey: 'name',
            stroke: 'white',
            strokeWidth: 1,
            legendItemName: 'Moscow Standard Time',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
