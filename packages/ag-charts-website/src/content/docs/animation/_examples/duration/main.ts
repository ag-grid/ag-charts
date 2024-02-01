import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
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

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
    },
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

const lineOptions: AgChartOptions = {
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

const areaOptions: AgChartOptions = {
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

const donutOptions: AgChartOptions = {
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
};

const chart = AgCharts.create(options);

function changeSeriesBar() {
    AgCharts.updateDelta(chart, options);
}

function changeSeriesLine() {
    AgCharts.updateDelta(chart, lineOptions);
}

function changeSeriesArea() {
    AgCharts.updateDelta(chart, areaOptions);
}

function changeSeriesDonut() {
    AgCharts.updateDelta(chart, donutOptions);
}

function changeDuration(duration: number) {
    AgCharts.updateDelta(chart, { animation: { duration } });
}
