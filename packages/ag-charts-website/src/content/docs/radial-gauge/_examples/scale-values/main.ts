import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 95,
    appearance: 'segmented',
    scale: {
        min: 0,
        max: 100,
        values: [50, 60, 70, 80, 90],
    },
    colorStops: [
        { color: '#fc5c65' },
        { color: '#fd9644', stop: 50 },
        { color: '#fed330', stop: 60 },
        { color: '#26de81', stop: 70 },
        { color: '#fed330', stop: 80 },
        { color: '#fd9644', stop: 90 },
    ],
};

AgCharts.createGauge(options);
