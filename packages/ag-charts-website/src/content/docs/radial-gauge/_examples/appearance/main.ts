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
        enabled: true,
        interval: {
            count: 4,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);
