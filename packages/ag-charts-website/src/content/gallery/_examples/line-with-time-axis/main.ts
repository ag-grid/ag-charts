import {
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    BandHighlightModule,
    CrosshairModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable Fuel Sources`,
    },
    subtitle: {
        text: `Kilotonnes of Oil Equivalent`,
    },
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    lineDash: [12, 3],
                    interpolation: {
                        type: 'step',
                        position: 'middle',
                    },
                    marker: {
                        enabled: false,
                    },
                },
            },
        },
    },
    tooltip: {
        enabled: true,
        mode: 'shared',
        position: {
            anchorTo: 'pointer',
            placement: ['top-left', 'bottom-left', 'top-right', 'bottom-right'],
        },
    },
    legend: {
        position: {
            placement: 'left-top',
            floating: true,
            xOffset: 20,
            yOffset: 20,
        },
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        cornerRadius: 8,
        padding: 12,
        item: {
            marker: { size: 12 },
            paddingX: 8,
            paddingY: 4,
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
            interval: {
                step: { unit: 'year', step: 5 },
            },
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2020, 0, 1),
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: 'COVID-19 START',
                        padding: 10,
                    },
                },
            ],
            bandHighlight: {
                enabled: true,
            },
            crosshair: {
                enabled: true,
                strokeWidth: 0,
            },
        },
        y: {
            position: 'right',
            type: 'number',
            title: {
                text: `ktoe`,
            },
            gridLine: {
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
        },
    },
    formatter: {
        y: (params) => `${(params.value as number) / 1000}K`,
    },
    zoom: {
        enabled: true,
        enableAxisDragging: true,
    },
};

AgCharts.create(options);
