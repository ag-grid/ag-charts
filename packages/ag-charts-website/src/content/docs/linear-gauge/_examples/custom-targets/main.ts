import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',    
    direction: 'horizontal',
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
            placement: 'before',
            fill: 'white',
            strokeWidth: 2,
            spacing: 8,
        },
        {
            value: 75,
            placement: 'after',
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
