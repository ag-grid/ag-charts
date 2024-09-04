import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
        fills: [{ color: '#E84118' }, { color: '#9C88FF' }, { color: '#00A8FF' }],
    },
    sectorSpacing: 2,
};

const chart = AgCharts.createGauge(options);

function setAppearance(appearance: 'segmented' | 'continuous') {
    options.appearance = appearance;
    chart.update(options);
}
