import { AreaSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { NavigatorModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, NavigatorModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Try dragging the Navigator's handles to zoom in",
    },
    subtitle: {
        text: 'or the area between them to pan around',
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
        enabled: true,
    },
};

const chart = AgCharts.create(options);

function toggleEnabled(value: boolean) {
    options.navigator!.enabled = value;
    chart.update(options);
}
