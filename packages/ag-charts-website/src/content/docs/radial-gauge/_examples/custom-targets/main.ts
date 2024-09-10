import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 50,
    scale: {
        min: 0,
        max: 100,
    },
    targets: [
        {
            value: 30,
            shape: 'triangle',
            placement: 'outside',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
        },
        {
            value: 75,
            placement: 'inside',
            shape: 'triangle',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
        },
        {
            value: 90,
            placement: 'middle',
            shape: 'circle',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
        },
    ],
};

AgCharts.createGauge(options);
