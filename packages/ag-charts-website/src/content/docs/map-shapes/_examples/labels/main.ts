import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Population of America',
    },
    data,
    topology,
    series: [
        {
            type: 'map',
            idKey: 'name',
            labelKey: 'code',
        },
    ],
};

AgCharts.create(options);
