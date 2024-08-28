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
        label: {
            step: 10,
        },
        fills: [{ color: '#4cd137' }, { color: '#fbc531', stop: 65 }, { color: '#e84118', stop: 75 }],
    },
    secondaryLabel: {
        text: 'mph',
    },
    targets: [{ value: 70, shape: 'triangle', placement: 'inside', spacing: 5, fill: '#8883' }],
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
        fills: [{ color: '#7f8fa6' }, { color: '#e84118', stop: 6 }],
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
    appearance: 'segmented',
    sectorSpacing: 2,
    scale: {
        min: 0,
        max: 100,
        fills: [
            { color: '#e84118' },
            { color: '#fbc531', stop: 50 },
            { color: '#4cd137', stop: 60 },
            { color: '#fbc531', stop: 70 },
            { color: '#e84118', stop: 80 },
        ],
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
    appearance: 'continuous',
    scale: {
        min: 0,
        max: 50,
        label: {
            step: 5,
        },
        fills: [{ color: '#e84118' }, { color: '#fbc531' }, { color: '#4cd137' }],
    },
    secondaryLabel: {
        text: 'litres',
    },
};

AgCharts.createGauge(fourthOptions);
