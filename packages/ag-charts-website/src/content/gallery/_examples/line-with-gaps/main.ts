import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BandHighlightModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BandHighlightModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
        duration: 800,
    },
    title: {
        text: 'Imported Banana Prices by Country',
    },
    footnote: {
        text: 'Source: Department for Environment, Food and Rural Affairs',
        fontStyle: 'italic',
    },
    legend: {
        position: {
            placement: 'top',
        },
    },
    tooltip: {
        mode: 'shared',
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10,
            yOffset: -10,
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'week',
            yKey: 'belize',
            yName: 'Belize',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'cameroon',
            yName: 'Cameroon',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'columbia',
            yName: 'Colombia',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'costaRica',
            yName: 'Costa Rica',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'dominicanRepublic',
            yName: 'Dominican Republic',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ecuador',
            yName: 'Ecuador',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'honduras',
            yName: 'Honduras',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ivoryCoast',
            yName: 'Ivory Coast',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'panama',
            yName: 'Panama',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'nicaragua',
            yName: 'Nicaragua',
            strokeWidth: 2.5,
            marker: {
                size: 7,
                strokeWidth: 2,
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week of Year',
            },
            label: {
                autoRotate: false,
                minSpacing: 70,
                formatter: (params) => {
                    return `Week ${params.value}`;
                },
            },
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Price (£ per kg)',
            },
            label: {
                formatter: (params) => `£${params.value.toFixed(2)}`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
