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
        fillMode: 'discrete',
    },
};

const chart = AgCharts.createGauge(options);

function setFillMode(fillMode: 'continuous' | 'discrete') {
    options.bar!.fillMode = fillMode;
    chart.update(options);
}
