import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
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

function setSpacing(spacing: boolean) {
    if (spacing) {
        options.segmentation = { spacing: 2 };
    } else {
        options.segmentation = {};
    }
    chart.update(options);
}
