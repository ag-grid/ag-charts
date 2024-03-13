import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cet, eet, gmt, msk } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across Europe',
    },
    topology,
    series: [
        {
            type: 'map-shape',
            data: gmt,
            idKey: 'name',
            title: 'Greenwich Mean Time',
        },
        {
            type: 'map-shape',
            data: cet,
            idKey: 'name',
            title: 'Central European Time',
        },
        {
            type: 'map-shape',
            data: eet,
            idKey: 'name',
            title: 'Eastern European Time',
        },
        {
            type: 'map-shape',
            data: msk,
            idKey: 'name',
            title: 'Moscow Standard Time',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
