import {
    AreaSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';
import { NavigatorModule, ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    LegendModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Navigator Styling',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            fill: '#c16068',
            stroke: '#874349',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            fill: '#a2bf8a',
            stroke: '#718661',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            fill: '#ebcc87',
            stroke: '#a48f5f',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            fill: '#80a0c3',
            stroke: '#5a7088',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                maxSpacing: 200,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
    legend: {
        enabled: false,
    },
    navigator: {
        height: 50,
        cornerRadius: 10,
        mask: {
            fill: 'red',
            strokeWidth: 2,
            fillOpacity: 0.3,
        },
        minHandle: {
            fill: 'yellow',
            stroke: 'blue',
            width: 16,
            height: 30,
            strokeWidth: 2,
        },
        maxHandle: {
            fill: 'lime',
            stroke: 'black',
        },
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.2, end: 0.7 },
        },
    },
};

const chart = AgCharts.create(options);
