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
            type: 'map-shape-accessory',
        },
        {
            type: 'map-shape',
            data: gmt,
            idKey: 'name',
            legendItemName: 'Greenwich Mean Time',
        },
        {
            type: 'map-shape',
            data: cet,
            idKey: 'name',
            legendItemName: 'Central European Time',
            visible: false,
        },
        {
            type: 'map-shape',
            data: eet,
            idKey: 'name',
            legendItemName: 'Eastern European Time',
            visible: false,
        },
        {
            type: 'map-shape',
            data: msk,
            idKey: 'name',
            legendItemName: 'Moscow Standard Time',
            visible: false,
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
