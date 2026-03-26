import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'World Population Over Time',
    },
    subtitle: {
        text: 'log scale',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'population',
        },
    ],
    axes: {
        y: {
            type: 'log',
            title: {
                text: 'Population',
            },
            label: {
                format: ',.0f',
            },
        },
        x: {
            type: 'number',
            title: {
                text: 'Year',
            },
        },
    },
    annotations: {
        enabled: true,
    },
};

AgCharts.create(options);
