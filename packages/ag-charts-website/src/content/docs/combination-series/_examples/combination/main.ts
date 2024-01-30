import {
    AgBarSeriesOptions,
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgLineSeriesOptions,
} from 'ag-charts-community';

import { getData } from './data';

function tooltipRenderer({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) {
    return { content: `${datum[xKey]}: ${datum[yKey]}%` };
}

const WOMEN: AgBarSeriesOptions = {
    type: 'bar',
    xKey: 'year',
    yKey: 'women',
    yName: 'Women',
    grouped: true,
    tooltip: {
        renderer: tooltipRenderer,
    },
};

const MEN: AgBarSeriesOptions = {
    type: 'bar',
    xKey: 'year',
    yKey: 'men',
    yName: 'Men',
    grouped: true,
    tooltip: {
        renderer: tooltipRenderer,
    },
};

const PORTIONS: AgLineSeriesOptions = {
    type: 'line',
    xKey: 'year',
    yKey: 'portions',
    yName: 'Portions',
    tooltip: {
        renderer: tooltipRenderer,
    },
};

const BAR_AND_LINE: AgCartesianSeriesOptions[] = [
    { ...WOMEN, type: 'bar' },
    { ...MEN, type: 'bar' },
    { ...PORTIONS, type: 'line' },
];

const AREA_AND_BAR: AgCartesianSeriesOptions[] = [
    { ...PORTIONS, type: 'area' },
    { ...WOMEN, type: 'bar' },
    { ...MEN, type: 'bar' },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Fruit & Vegetable Consumption',
    },
    series: BAR_AND_LINE,
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            // primary y axis
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        {
            // secondary y axis
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ] as AgCartesianAxisOptions[],
};

const chart = AgCharts.create(options);

function barLine() {
    options.series = BAR_AND_LINE;
    AgCharts.update(chart, options);
}

function areaBar() {
    options.series = AREA_AND_BAR;
    AgCharts.update(chart, options);
}
