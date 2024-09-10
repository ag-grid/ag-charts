import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'horizontal',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    segmentation: {
        interval: {
            count: 25,
        },
        spacing: 2,
    },
    cornerRadius: 99,
    cornerMode: 'container',
};

const chart = AgCharts.createGauge(options);

function setCornerMode(cornerMode: 'container' | 'item') {
    options.cornerMode = cornerMode;
    chart.update(options);
}
