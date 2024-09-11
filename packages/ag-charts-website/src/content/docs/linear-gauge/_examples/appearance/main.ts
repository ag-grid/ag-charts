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
    segmentation: {
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setSpacing(spacing: number) {
    options.segmentation!.spacing = spacing;
    chart.update(options);
}