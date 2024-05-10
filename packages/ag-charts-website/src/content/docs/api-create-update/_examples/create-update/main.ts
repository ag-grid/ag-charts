import { AgAreaSeriesOptions, AgChartLegendPosition, AgChartOptions, AgCharts } from 'ag-charts-community';

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

const options: AgChartOptions = {
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
};

const chart = AgCharts.create(options);

function reverseSeries() {
    options.series = series.reverse();
    AgCharts.update(chart, options);
}

function swapTitles() {
    const oldTitle = options.title;
    options.title = options.subtitle;
    options.subtitle = oldTitle;

    AgCharts.update(chart, options);
}

function rotateLegend() {
    const currentIdx = positions.indexOf(legend.position ?? 'top');
    legend.position = positions[(currentIdx + 1) % positions.length];

    options.legend = legend;
    AgCharts.update(chart, options);
}
