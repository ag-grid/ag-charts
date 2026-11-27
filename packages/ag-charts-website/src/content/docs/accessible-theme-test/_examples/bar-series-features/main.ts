import {
    AgCartesianChartOptions,
    AgCharts,
    BackgroundRegionsModule,
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrossLinesModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScrollbarModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BackgroundRegionsModule,
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrossLinesModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    NumberAxisModule,
    ScrollbarModule,
    SelectionModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Quarterly Revenue and Costs',
    },
    subtitle: {
        text: 'Cross lines, background regions, error bars, context menu, band highlight, data selection and horizontal scrollbar',
    },
    data: getData(),
    scrollbar: {
        enabled: true,
        vertical: {
            enabled: false,
        },
    },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    seriesArea: {
        backgroundRegions: [
            {
                yRange: { start: 60 },
                label: {
                    text: 'Stretch Target',
                },
            },
        ],
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue',
            width: 24,
            errorBar: {
                yLowerKey: 'revenueLower',
                yUpperKey: 'revenueUpper',
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'costs',
            yName: 'Costs',
            width: 24,
            errorBar: {
                yLowerKey: 'costsLower',
                yUpperKey: 'costsUpper',
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'range',
                    range: ["Q1'25", "Q2'25"],
                    label: {
                        text: 'Restructuring',
                    },
                },
            ],
        },
        y: {
            type: 'number',
            crosshair: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 50,
                    label: {
                        text: 'Target',
                    },
                },
            ],
        },
    },
};

AgCharts.create(options);
