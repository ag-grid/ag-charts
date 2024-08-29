import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 50,
    scale: {
        min: 0,
        max: 100,
    },
    target: {
        shape: 'triangle',
        placement: 'outside',
        fill: 'white',
        strokeWidth: 2,
        spacing: 8,
    },
    targets: [
        {
            value: 30,
        },
        {
            value: 75,
            placement: 'inside',
        },
        {
            value: 90,
            placement: 'middle',
            shape: 'circle',
        },
    ],
};

AgCharts.createGauge(options);
