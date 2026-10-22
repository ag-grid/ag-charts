// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    AnnotationsModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrossLinesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    ScrollbarModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AnnotationsModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrossLinesModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    ScrollbarModule,
    ZoomModule,
]);

// Every interactive chart feature that renders DOM is switched on here so the axe scan covers it on load.
const onClick = () => {};

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    title: { text: 'Regional Sales and Performance', listeners: { click: onClick } },
    subtitle: { text: '(units sold and financial indicators, by month)', listeners: { click: onClick } },
    footnote: { text: 'Source: internal test data', listeners: { click: onClick } },
    data: getData(),
    series: [
        { type: 'bar', xKey: 'month', yKey: 'north', yName: 'North' },
        { type: 'bar', xKey: 'month', yKey: 'south', yName: 'South' },
        { type: 'bar', xKey: 'month', yKey: 'east', yName: 'East' },
        { type: 'bar', xKey: 'month', yKey: 'west', yName: 'West' },
        { type: 'line', xKey: 'month', yKey: 'revenue', yName: 'Revenue', yKeyAxis: 'ySecondary' },
        { type: 'line', xKey: 'month', yKey: 'margin', yName: 'Margin', yKeyAxis: 'ySecondary' },
        { type: 'line', xKey: 'month', yKey: 'returns', yName: 'Returns', yKeyAxis: 'ySecondary' },
        { type: 'line', xKey: 'month', yKey: 'growth', yName: 'Growth', yKeyAxis: 'ySecondary' },
    ],
    axes: {
        x: {
            type: 'category',
            title: { text: 'Month' },
            crossLines: [
                {
                    id: 'mid-year',
                    type: 'line',
                    value: 'Jun',
                    label: { text: 'Mid-year' },
                    listeners: { click: onClick },
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Units Sold' },
            crossLines: [
                { id: 'target', type: 'line', value: 45, label: { text: 'Target' }, listeners: { click: onClick } },
            ],
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: { text: 'Financial Indicators' },
        },
    },
    legend: { maxHeight: 40, maxWidth: 400 },
    scrollbar: {
        enabled: true,
        horizontal: { visible: 'always' },
        vertical: { visible: 'always' },
    },
    zoom: { enabled: true, buttons: { visible: 'always' } },
    navigator: { enabled: true, miniChart: { enabled: true } },
    contextMenu: { enabled: true },
    annotations: { enabled: true, axesButtons: { enabled: true, axes: 'xy' } },
    // One annotation per family the toolbar can create, so their on-load DOM is scanned as well.
    initialState: {
        annotations: [
            { type: 'line', start: { x: 'Jan', y: 36 }, end: { x: 'Dec', y: 58 } },
            { type: 'horizontal-line', value: 50, lineStyle: 'dotted' },
            { type: 'vertical-line', value: 'Sep', lineStyle: 'dotted' },
            {
                type: 'parallel-channel',
                height: 8,
                start: { x: 'Feb', y: 28 },
                end: { x: 'May', y: 40 },
            },
            { type: 'comment', x: 'Mar', y: 66, text: 'Strong spring', fontSize: 12 },
            { type: 'text', x: 'Jan', y: 12, text: 'Mid-year dip', fontSize: 12 },
            { type: 'note', x: 'Nov', y: 62, text: 'Year-end push', fontSize: 12 },
            {
                type: 'callout',
                start: { x: 'Aug', y: 10 },
                end: { x: 'Oct', y: 22 },
                text: 'Q4 target',
                fontSize: 12,
            },
        ],
    },
};

AgCharts.create(options);
