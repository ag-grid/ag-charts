import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 50,
    scale: {
        min: 0,
        max: 100,
    },
    targets: [
        {
            value: 25,
            shape: 'triangle',
            placement: 'inside',
            spacing: 5,
            size: 10,
        },
        {
            value: 75,
            shape: 'triangle',
            placement: 'outside',
            spacing: 5,
            size: 10,
            rotation: 180,
        },
        {
            value: 90,
            shape: 'circle',
            placement: 'middle',
            size: 10,
        },
    ],
};

AgCharts.createGauge(options);
