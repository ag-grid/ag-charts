import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    appearance: 'segmented',
    sectorSpacing: 2,
};

const chart = AgCharts.createGauge(options);

function setAppearance(appearance: 'segmented' | 'continuous') {
    options.appearance = appearance;
    chart.update(options);
}

function setSectorSpacing(sectorSpacing: number) {
    options.sectorSpacing = sectorSpacing;
    chart.update(options);
}
