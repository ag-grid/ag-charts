import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    sectorSpacing: 2,
    cornerRadius: 99,
    cornerMode: 'container',
};

const chart = AgCharts.createGauge(options);

function setSegments(segments: number | undefined) {
    if (segments !== undefined) {
        options.segments = segments;
    } else {
        delete options.segments;
    }
    chart.update(options);
}

function setCornerMode(cornerMode: 'container' | 'item') {
    options.cornerMode = cornerMode;
    chart.update(options);
}
