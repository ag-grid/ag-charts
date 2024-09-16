import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const firstOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('first'),
    title: { text: 'Speed' },
    value: 90,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    scale: {
        min: 0,
        max: 120,
        interval: {
            step: 10,
        },
    },
    segmentation: {
        enabled: true,
        interval: {
            values: [65, 75],
        },
        spacing: 2,
    },
    bar: {
        fills: [{ color: '#4cd137', stop: 65 }, { color: '#fbc531', stop: 75 }, { color: '#e84118' }],
        fillMode: 'discrete',
    },
    secondaryLabel: {
        text: 'mph',
    },
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

AgCharts.createGauge(firstOptions);

const secondOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('second'),
    title: { text: 'RPM' },
    value: 6.5,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    segmentation: {
        enabled: true,
        interval: {
            step: 1,
        },
        spacing: 2,
    },
    scale: {
        min: 0,
        max: 8,
        fills: [{ color: '#7f8fa6', stop: 6.25 }, { color: '#e84118' }],
        fillMode: 'discrete',
    },
    bar: {
        enabled: false,
    },
    needle: {
        enabled: true,
    },
};

AgCharts.createGauge(secondOptions);

const thirdOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('third'),
    title: { text: 'PSI' },
    value: 75,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    segmentation: {
        enabled: true,
        interval: {
            values: [50, 60, 70, 80],
        },
        spacing: 2,
    },
    scale: {
        min: 0,
        max: 100,
        fills: [
            { color: '#e84118', stop: 50 },
            { color: '#fbc531', stop: 60 },
            { color: '#4cd137', stop: 70 },
            { color: '#fbc531', stop: 80 },
            { color: '#e84118' },
        ],
        fillMode: 'discrete',
    },
    bar: {
        enabled: false,
    },
    needle: {
        enabled: true,
    },
};

AgCharts.createGauge(thirdOptions);

const fourthOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('fourth'),
    title: { text: 'Fuel' },
    value: 15,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    scale: {
        min: 0,
        max: 50,
        interval: {
            step: 5,
        },
    },
    bar: {
        fills: [{ color: '#e84118' }, { color: '#fbc531' }, { color: '#4cd137' }],
    },
    secondaryLabel: {
        text: 'litres',
    },
};

AgCharts.createGauge(fourthOptions);
