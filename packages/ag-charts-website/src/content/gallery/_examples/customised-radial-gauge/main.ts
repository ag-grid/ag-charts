import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const firstOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('first'),
    title: { text: 'Speed' },
    value: 90,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    segments: [65, 75],
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 120,
        interval: {
            step: 10,
        },
    },
    bar: {
        colorRange: ['#4cd137', '#fbc531', '#e84118'],
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
    segments: [6],
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 8,
        colorRange: ['#7f8fa6', '#e84118'],
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
    segments: [50, 60, 70, 80],
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 100,
        colorRange: ['#e84118', '#fbc531', '#4cd137', '#fbc531', '#e84118'],
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
        colorRange: ['#e84118', '#fbc531', '#4cd137'],
    },
    secondaryLabel: {
        text: 'litres',
    },
};

AgCharts.createGauge(fourthOptions);
