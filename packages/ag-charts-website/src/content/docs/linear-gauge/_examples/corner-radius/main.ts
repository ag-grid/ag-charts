import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'horizontal',
    container: document.getElementById('myChart'),
    padding: {
        left: 30,
        right: 30,
    },
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    cornerRadius: 99,
    cornerMode: 'container',
    segmentation: {
        enabled: false,
        interval: {
            count: 10,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setCornerMode(cornerMode: 'container' | 'item') {
    options.cornerMode = cornerMode;
    chart.update(options);
}

function setSegmentation(segmented: boolean) {
    options.segmentation!.enabled = segmented;
    chart.update(options);
}
