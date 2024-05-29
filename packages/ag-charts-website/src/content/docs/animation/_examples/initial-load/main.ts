import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgChartInstance,
    AgChartOptions,
    AgCharts,
    AgPolarChartOptions,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');
const tooltip = {
    renderer: ({ title, datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
        title,
        content: `${datum[xKey]}: ${numFormatter.format(datum[yKey])}`,
    }),
};

const barOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            stacked: true,
            yName: 'Early',
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            tooltip,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

const lineOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'line',
            xKey: 'station',
            yKey: 'early',
            yName: 'Early',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            tooltip,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

const areaOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'area',
            xKey: 'station',
            yKey: 'early',
            stacked: true,
            yName: 'Early',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            tooltip,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

const donutOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'pie',
            title: {
                text: 'Morning Peak',
            },
            calloutLabelKey: 'station',
            legendItemKey: 'station',
            angleKey: 'morningPeak',
            outerRadiusRatio: 0.6,
        },
        {
            type: 'donut',
            title: {
                text: 'Afternoon Peak',
            },
            calloutLabelKey: 'station',
            legendItemKey: 'station',
            angleKey: 'afternoonPeak',
            innerRadiusRatio: 0.7,
            showInLegend: false,
        },
    ],
    axes: [],
};

let options: AgCartesianChartOptions | AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
    },
    ...barOptions,
};

const chart = AgCharts.create(options) as AgChartInstance<AgChartOptions>;

function changeSeriesBar() {
    options.series = barOptions.series;
    options.axes = barOptions.axes;
    chart.update(options);
}

function changeSeriesLine() {
    options.series = lineOptions.series;
    options.axes = lineOptions.axes;
    chart.update(options);
}

function changeSeriesArea() {
    options.series = areaOptions.series;
    options.axes = areaOptions.axes;
    chart.update(options);
}

function changeSeriesDonut() {
    options.series = donutOptions.series;
    options.axes = donutOptions.axes;
    chart.update(options);
}
