import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    title: { text: 'Speed' },
    value: 89,
    startAngle: 180 + 90,
    endAngle: 360 + 180,
    scale: {
        min: 0,
        max: 120,
        interval: {
            step: 10,
        },
        fillOpacity: 0.8,
    },
    segmentation: {
        interval: {
            values: [65, 75],
        },
    },
    bar: {
        fillOpacity: 0.6,
    },
    innerRadiusRatio: 0.9,
    secondaryLabel: {
        text: 'mph',
    },
    cornerRadius: 50,
    targets: [
        {
            value: 70,
            shape: 'triangle',
            placement: 'inside',
            spacing: 5,
            fill: '#8884',
            text: 'LIMIT',
            label: {
                color: '#8888',
                fontSize: 8,
                fontWeight: 'bold',
                spacing: 2,
            },
        },
    ],
};

AgCharts.createGauge(options);
