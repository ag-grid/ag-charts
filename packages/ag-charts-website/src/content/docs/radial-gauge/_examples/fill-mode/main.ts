import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    bar: {
        fills: [{ color: '#00a8ff' }, { color: '#9c88ff' }, { color: '#e84118' }],
        fillMode: 'discrete',
    },
};

const chart = AgCharts.createGauge(options);

function setFillMode(fillMode: 'continuous' | 'discrete') {
    options.bar!.fillMode = fillMode;
    chart.update(options);
}
