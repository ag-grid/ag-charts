import { AgCharts, AgLinearGaugeOptions, ContextMenuModule } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'vertical',
    container: document.getElementById('myChart'),
    value: 80,
    thickness: 100,
    bar: {
        thickness: 50,
    },
    scale: {
        min: 0,
        max: 100,
    },
};

AgCharts.createGauge(options);
