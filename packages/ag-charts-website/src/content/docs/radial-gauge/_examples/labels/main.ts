import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
        label: {
            enabled: false,
        },
    },
    label: {
        formatter({ value }) {
            return `${value.toFixed(0)}%`;
        },
    },
    secondaryLabel: {
        text: 'Test Score',
    },
};

AgCharts.createGauge(options);
