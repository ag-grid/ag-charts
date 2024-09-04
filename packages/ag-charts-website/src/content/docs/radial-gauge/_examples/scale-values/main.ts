import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    segments: [35, 45, 55, 65],
    bar: {
        colorRange: ['#E84118', '#FBC531', '#4CD137', '#FBC531', '#E84118'],
    },
};

AgCharts.createGauge(options);
