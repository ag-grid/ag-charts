import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const firstOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('first'),
    title: { text: 'Speed' },
    value: 90,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    appearance: 'segmented',
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 120,
        step: 10,
    },
    secondaryLabel: {
        text: 'mph',
    },
    targets: [{ value: 70, shape: 'triangle', radiusRatio: 0.7, sizeRatio: 0.1, fill: '#8883' }],
    colorStops: [{ color: '#4cd137' }, { color: '#fbc531' }, { color: '#e84118' }],
};

AgCharts.createGauge(firstOptions);

const secondOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('second'),
    title: { text: 'RPM' },
    value: 6.5,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    appearance: 'segmented',
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 8,
    },
    bar: {
        enabled: false,
    },
    needle: {
        enabled: true,
    },
    colorStops: [
        { color: '#7f8fa6', stop: 6 },
        { color: '#e84118', stop: 6.001 },
    ],
};

AgCharts.createGauge(secondOptions);

const thirdOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('third'),
    title: { text: 'PSI' },
    value: 75,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    appearance: 'segmented',
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 100,
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    },
    bar: {
        enabled: false,
    },
    needle: {
        enabled: true,
    },
    colorStops: [
        { color: '#e84118', stop: 40 },
        { color: '#fbc531', stop: 50 },
        { color: '#4cd137', stop: 60 },
        { color: '#fbc531', stop: 70 },
        { color: '#e84118', stop: 80 },
    ],
};

AgCharts.createGauge(thirdOptions);

const fourthOptions: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('fourth'),
    title: { text: 'Fuel' },
    value: 15,
    startAngle: 180 + 45,
    endAngle: 360 + 180 - 45,
    appearance: 'continuous',
    scale: {
        min: 0,
        max: 50,
        step: 5,
    },
    secondaryLabel: {
        text: 'litres',
    },
    colorStops: [{ color: '#e84118' }, { color: '#fbc531' }, { color: '#4cd137' }],
};

AgCharts.createGauge(fourthOptions);
