import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    bar: {
        colorRange: ['#E84118', '#9C88FF', '#00A8FF'],
    },
    sectorSpacing: 2,
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
