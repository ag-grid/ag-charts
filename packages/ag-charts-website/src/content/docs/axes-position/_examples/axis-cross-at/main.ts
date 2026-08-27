import { AgCartesianAxisCrossAtPlacement, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-enterprise';
import { CrosshairModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CrosshairModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            common: {
                axes: {
                    number: {
                        line: {
                            enabled: true,
                            stroke: 'red',
                        },
                        tick: {
                            enabled: true,
                            size: 12,
                            stroke: 'red',
                        },
                        label: {
                            color: 'red',
                        },
                    },
                },
            },
        },
    },
    title: { text: 'Axes crossing at 0', fontWeight: 'bold' },
    data: getData(),
    axes: {
        x: {
            type: 'number',
            title: { text: 'X Axis' },
            crossAt: {
                value: 0,
            },
        },
        y: {
            type: 'number',
            title: { text: 'Y Axis' },
            crossAt: {
                value: 0,
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            yName: 'Function plot',
            strokeWidth: 3,
            marker: { size: 0 },
        },
    ],
};

const chart = AgCharts.create(options);

function setTitlePlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.titlePlacement = placement;
    options.axes!.y!.crossAt!.titlePlacement = placement;
    chart.update(options);
}

function setLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.labelPlacement = placement;
    options.axes!.y!.crossAt!.labelPlacement = placement;
    chart.update(options);
}

function setCrosshairLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axes!.x!.crossAt!.crosshairLabelPlacement = placement;
    options.axes!.y!.crossAt!.crosshairLabelPlacement = placement;
    chart.update(options);
}
