// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Default Highlight Multiple Series Markers',
    },
    animation: {
        enabled: true,
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            yName: 'Petrol',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            yName: 'Diesel',
        },
    ],
};

AgCharts.create(options);
