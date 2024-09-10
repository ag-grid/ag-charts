import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    bar: {
        fills: [{ color: '#E84118' }, { color: '#9C88FF' }, { color: '#00A8FF' }],
        fillMode: 'discrete',
    },
    segmentation: {
        interval: {
            count: 3,
        },
    },
};

const chart = AgCharts.createGauge(options);

function setFillMode(fillMode: 'discrete' | 'continuous') {
    delete options!.bar!.fill;
    options.bar!.fillMode = fillMode;
    chart.update(options);
}

function setSolidFill() {
    options!.bar!.fill = '#E84118';
    chart.update(options);
}
