import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    colorStops: [
        { color: '#FFBA7D', stop: 50 },
        { color: '#FFA04C', stop: 60 },
        { color: '#FE871E', stop: 70 },
        { color: '#E96F03', stop: 80 },
        { color: '#D76500', stop: 90 },
    ],
};

AgCharts.createGauge(options);
