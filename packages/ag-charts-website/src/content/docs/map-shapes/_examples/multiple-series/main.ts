import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { central, eastern, mountain, pacific } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across America',
    },
    topology,
    series: [
        {
            type: 'map-shape',
            data: pacific,
            idKey: 'name',
            title: 'Pacific',
        },
        {
            type: 'map-shape',
            data: mountain,
            idKey: 'name',
            title: 'Mountain',
        },
        {
            type: 'map-shape',
            data: central,
            idKey: 'name',
            title: 'Central',
        },
        {
            type: 'map-shape',
            data: eastern,
            idKey: 'name',
            title: 'Eastern',
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
