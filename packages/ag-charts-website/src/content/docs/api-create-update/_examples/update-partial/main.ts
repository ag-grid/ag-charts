import { AgAreaSeriesOptions, AgChartLegendPosition, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function buildSeries(name: string): AgAreaSeriesOptions {
    return {
        type: 'area',
        xKey: 'year',
        yKey: name.toLowerCase(),
        yName: name,
        fillOpacity: 0.5,
    };
}

const series = [buildSeries('IE'), buildSeries('Chrome'), buildSeries('Firefox'), buildSeries('Safari')];

const positions: AgChartLegendPosition[] = ['left', 'top', 'right', 'bottom'];
const legend = {
    position: positions[1],
};

let chart = AgCharts.create({
    container: document.getElementById('myChart'),
    title: {
        text: 'Browser Usage Statistics',
    },
    subtitle: {
        text: '2009-2019',
    },
    data: getData(),
    series,
    legend,
});

function reverseSeries() {
    const series = chart.getOptions().series as AgAreaSeriesOptions[];
    series!.reverse();

    AgCharts.updateDelta(chart, { series });
}

function swapTitles() {
    const { title, subtitle } = chart.getOptions();

    AgCharts.updateDelta(chart, { title: subtitle, subtitle: title });
}

function rotateLegend() {
    const position = chart.getOptions().legend!.position;

    const currentIdx = positions.indexOf(position || 'top');
    const newPosition = positions[(currentIdx + 1) % positions.length];

    AgCharts.updateDelta(chart, { legend: { position: newPosition } });
}

function changeTheme() {
    AgCharts.updateDelta(chart, {
        theme: { overrides: { area: { series: { marker: { enabled: true } } } } },
    });
}
