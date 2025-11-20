import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { BandHighlightModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([BandHighlightModule, BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Ad Campaign Impact',
    },
    subtitle: {
        text: 'Yearly Percentage Change in Advertisement Engagement (2018 to 2023)',
    },
    formatter: {
        y: ({ value }) => `${(Number(value) * 100).toFixed(1)}%`,
    },
    tooltip: {
        mode: 'shared',
        position: {
            xOffset: -30,
            yOffset: -75,
            anchorTo: 'chart',
            placement: ['bottom-right'],
        },
    },
    theme: {
        overrides: {
            line: {
                series: {
                    marker: {
                        enabled: false,
                    },
                    lineDash: [5, 8],
                },
            },
            bar: {
                series: {
                    fillOpacity: 0.9,
                },
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'desktop',
            yName: 'Desktop',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'phone',
            yName: 'Phone',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tv',
            yName: 'TV',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tablet',
            yName: 'Tablet',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'radio',
            yName: 'Radio',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'billboard',
            yName: 'Billboard',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'top',
            paddingInner: 0.4,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            interval: { values: [0] },
            label: {
                enabled: false,
            },
            gridLine: {
                width: 2,
            },
            crosshair: {
                enabled: false,
            },
        },
    },
    legend: {
        item: {
            marker: {
                shape: 'circle',
            },
        },
    },
};

AgCharts.create(options);
