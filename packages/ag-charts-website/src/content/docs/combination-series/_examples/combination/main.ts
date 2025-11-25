import {
    AgBarSeriesOptions,
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgLineSeriesOptions,
} from 'ag-charts-community';
import {
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    LegendModule,
]);
const WOMEN: AgBarSeriesOptions = {
    type: 'bar',
    xKey: 'year',
    yKey: 'women',
    yName: 'Women',
    grouped: true,
};

const MEN: AgBarSeriesOptions = {
    type: 'bar',
    xKey: 'year',
    yKey: 'men',
    yName: 'Men',
    grouped: true,
};

const PORTIONS: AgLineSeriesOptions = {
    type: 'line',
    xKey: 'year',
    yKey: 'portions',
    yName: 'Portions',
    yKeyAxis: 'ySecondary',
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
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};

const chart = AgCharts.create(options);

function barLine() {
    options.series = BAR_AND_LINE;
    chart.update(options);
}

function areaBar() {
    options.series = AREA_AND_BAR;
    chart.update(options);
}
