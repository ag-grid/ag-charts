import { AgCharts, AgGaugeOptions } from 'ag-charts-community';

const options: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
        interval: {
            step: 10,
        },
    },
};

AgCharts.createGauge(options);
