import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    // @ts-expect-error
    segmentation: {
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setSpacing(spacing: number) {
    // @ts-expect-error
    options.segmentation!.spacing = spacing;
    chart.update(options);
}
