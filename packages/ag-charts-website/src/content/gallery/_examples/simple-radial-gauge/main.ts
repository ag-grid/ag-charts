import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    segments: 10,
    scale: {
        min: 0,
        max: 100,
        interval: {
            step: 10,
        },
    },
};

AgCharts.createGauge(options);
