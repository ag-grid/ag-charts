import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
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
                count: 4,
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
