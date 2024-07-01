import { AgChartState, AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
};

const chart = AgCharts.createFinancialChart(options);

let state: AgChartState = {
    version: '10.0.0',
    annotations: [
        {
            type: 'parallel-channel',
            height: 9.692307692304894,
            middle: { strokeWidth: 1, lineDash: [6, 5] },
            background: { fill: '#5090dc', fillOpacity: 0.2 },
            start: {
                x: { __type: 'date', value: 'Thu Mar 21 2024 18:45:00 GMT+0000 (Greenwich Mean Time)' },
                y: 39821.692307692305,
            },
            end: {
                x: { __type: 'date', value: 'Thu Mar 21 2024 18:55:00 GMT+0000 (Greenwich Mean Time)' },
                y: 39838.46153846154,
            },
            handle: { fill: 'white' },
            stroke: '#5090dc',
            strokeOpacity: 1,
            strokeWidth: 2,
        },
    ],
};

function saveAnnotations() {
    const newState = chart.getState();
    state = newState;
    console.log('Saved', state);
}

function restoreAnnotations() {
    chart.setState(state).then(() => {
        console.log(`Restored`, state);
    });
}
