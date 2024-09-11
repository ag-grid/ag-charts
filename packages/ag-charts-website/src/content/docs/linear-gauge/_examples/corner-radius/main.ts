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
};

const chart = AgCharts.createGauge(options);

function setCornerMode(cornerMode: 'container' | 'item') {
    options.cornerMode = cornerMode;
    chart.update(options);
}

function setSegmentation(segmented: boolean) {
    if (segmented) {
        options.segmentation = {
            interval: {
                count: 25,
            },
            spacing: 2,
        };
    } else {
        options.segmentation = {
            interval: {},
        };
    }
    chart.update(options);
}
