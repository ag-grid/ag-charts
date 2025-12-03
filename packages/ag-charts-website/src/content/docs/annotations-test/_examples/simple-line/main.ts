import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Annual Fuel Expenditure',
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
    annotations: {
        enabled: true,
    },
};

AgCharts.create(options);
