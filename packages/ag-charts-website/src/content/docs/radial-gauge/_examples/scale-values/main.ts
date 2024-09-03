import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    appearance: 'segmented',
    scale: {
        min: 0,
        max: 100,
        fills: [
            { color: '#E84118' },
            { color: '#FBC531', stop: 35 },
            { color: '#4CD137', stop: 45 },
            { color: '#FBC531', stop: 55 },
            { color: '#E84118', stop: 65 },
        ],
    },
};

AgCharts.createGauge(options);
