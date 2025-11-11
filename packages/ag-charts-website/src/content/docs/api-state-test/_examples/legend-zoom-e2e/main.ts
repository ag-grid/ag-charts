import { AgCartesianChartOptions, AgChartState, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Total Visitors to Tate Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    data: getData(),
    animation: {
        enabled: false,
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            id: 'tate-modern',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            id: 'tate-britain',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            yName: 'Tate Liverpool',
            id: 'tate-liverpool',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            yName: 'Tate St Ives',
            id: 'tate-st-ives',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

let chart = AgCharts.create(options);
let state: AgChartState = { version: '11.0.0' };

function reload() {
    chart.destroy();
    chart = AgCharts.create(options);
}

function saveState() {
    const newState = chart.getState();
    state = newState;
    console.log('Saved', state);
}

function restoreState() {
    chart.setState(state).then(() => {
        console.log(`Restored`, state);
    });
}
