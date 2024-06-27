import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'British Names',
    },
    footnote: {
        text: 'Source: Completely made up and random',
    },
    padding: {
        left: 35,
    },
    series: [
        {
            data: data.filter((d) => d.gender === 'Girl'),
            type: 'scatter',
            xKey: 'popularity',
            xName: 'Popularity',
            yKey: 'trend',
            labelKey: 'name',
            labelName: 'Name',
            yName: 'Girl Names',
            label: { enabled: true },
        },
        {
            data: data.filter((d) => d.gender === 'Boy'),
            type: 'scatter',
            xKey: 'popularity',
            xName: 'Popularity',
            yKey: 'trend',
            yName: 'Boy Names',
            labelKey: 'name',
            labelName: 'Name',
            label: { enabled: true },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
