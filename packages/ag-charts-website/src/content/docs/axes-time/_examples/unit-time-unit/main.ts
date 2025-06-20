import { AgCartesianChartOptions, AgCharts, AgUnitTimeAxisThemeOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions & { axes: AgUnitTimeAxisThemeOptions[] } = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Influenza Cases',
    },
    subtitle: {
        text: 'Recorded Data for 2024',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'total_cases',
            yName: 'Total Cases',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'hospitalizations',
            yName: 'Hospitalizations',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'deaths',
            yName: 'Deaths',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            unit: {
                unit: 'day',
                step: 7,
                epoch: new Date(2024, 0, 1),
            },
        },
        {
            type: 'number',
        },
    ],
    zoom: {
        enabled: true,
    },
    navigator: {
        enabled: true,
    },
    tooltip: {
        mode: 'shared',
    },
};

const chart = AgCharts.create(options);
