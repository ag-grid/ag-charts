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
            type: 'map',
            data: gmt,
            idKey: 'name',
            legendItemName: 'Greenwich Mean Time',
        },
        {
            type: 'map',
            data: cet,
            idKey: 'name',
            legendItemName: 'Central European Time',
        },
        {
            type: 'map',
            data: eet,
            idKey: 'name',
            legendItemName: 'Eastern European Time',
        },
        {
            type: 'map',
            data: msk,
            idKey: 'name',
            legendItemName: 'Moscow Standard Time',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
