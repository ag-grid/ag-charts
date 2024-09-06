import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    segmentation: {
        interval: {
            values: [35, 45, 55, 65],
        },
    },
    bar: {
        fills: [
            { color: '#E84118', stop: 35 },
            { color: '#FBC531', stop: 45 },
            { color: '#4CD137', stop: 55 },
            { color: '#FBC531', stop: 65 },
            { color: '#E84118' },
        ],
        fillMode: 'discrete',
    },
};

AgCharts.createGauge(options);
