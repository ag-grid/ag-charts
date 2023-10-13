import {
    AgBarSeriesOptions,
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgChart,
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

const COLUMN_AND_LINE: AgCartesianSeriesOptions[] = [
    { ...WOMEN, type: 'bar' },
    { ...MEN, type: 'bar' },
    { ...PORTIONS, type: 'line' },
];

const AREA_AND_COLUMN: AgCartesianSeriesOptions[] = [
    { ...PORTIONS, type: 'area' },
    { ...WOMEN, type: 'bar' },
    { ...MEN, type: 'bar' },
];

const options: AgCartesianChartOptions = {
    container: document.querySelector('#myChart') as HTMLElement,
    data: getData(),
    title: {
        text: 'Fruit & Vegetable Consumption',
    },
    series: COLUMN_AND_LINE,
    axes: [
        {
            type: 'category',
            position: "bottom",
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
            position: "right",
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ] as AgCartesianAxisOptions[],
};

var chart = AgChart.create(options);

function columnLine() {
    console.log('Column & Line', COLUMN_AND_LINE);
    options.series = COLUMN_AND_LINE;
    AgChart.update(chart, options);
}

function areaColumn() {
    console.log('Column & Area', AREA_AND_COLUMN);
    options.series = AREA_AND_COLUMN;
    AgChart.update(chart, options);
}
