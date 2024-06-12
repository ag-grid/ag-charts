import { AgChartOptions, AgChartState, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'Candlestick Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
        },
    ],
    annotations: {
        enabled: true,
    },
    toolbar: {
        annotations: {
            enabled: true,
        },
        annotationOptions: {
            enabled: true,
        },
    },
    tooltip: { enabled: false },
};

const chart = AgCharts.create(options);

let state: AgChartState = {
    version: '10.0.0',
    annotations: [
        {
            type: 'parallel-channel',
            height: 11.832460732985055,
            middle: {
                strokeWidth: 1,
                lineDash: [6, 5],
            },
            background: {
                fill: '#5090dc',
                fillOpacity: 0.2,
            },
            start: {
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 18:55:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39838.53403141361,
            },
            end: {
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:08:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39816.64921465969,
            },
            handle: {
                fill: 'white',
            },
            stroke: '#2b5c95',
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
