import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    direction: 'horizontal',
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
