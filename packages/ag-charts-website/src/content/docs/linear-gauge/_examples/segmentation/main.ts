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
        enabled: true,
        interval: {
            count: 4,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setCount(count: number) {
    options.segmentation!.interval!.count = count;
    chart.update(options);
}
