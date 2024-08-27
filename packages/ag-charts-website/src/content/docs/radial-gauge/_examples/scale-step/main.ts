import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    appearance: 'segmented',
    scale: {
        min: 0,
        max: 100,
        step: 10,
    },
};

const chart = AgCharts.createGauge(options);

function setStep(step: number) {
    options.scale!.step = step;
    chart.update(options);
}
