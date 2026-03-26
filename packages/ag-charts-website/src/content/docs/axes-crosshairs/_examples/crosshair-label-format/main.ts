import {
    AgCartesianChartOptions,
    AgCharts,
    AgUnitTimeAxisOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
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
            yKey: 'Small scale Hydro',
            yName: 'Small Scale Hydro',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            crosshair: {
                enabled: true,
            },
        },
        y: {
            position: 'right',
            type: 'number',
            title: {
                text: `kilotonnes of oil equivalent (ktoe)`,
            },
            line: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    },
    tooltip: {
        enabled: false,
    },
    formatter: {
        y: (params) => `${(params.value as number) / 1000}K`,
    },
};

const chart = AgCharts.create(options);

function crosshairLabelFormat() {
    const crosshair = options.axes!.x!.crosshair! as AgUnitTimeAxisOptions;
    crosshair.label = {
        format: `%d %b '%y`,
    };
    chart.update(options);
}

function axisLabelFormat() {
    const axesX = options.axes!.x! as AgUnitTimeAxisOptions;
    const crosshair = axesX.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete crosshair.label.format;
    }
    axesX.label = { format: `%b %Y` };
    chart.update(options);
}

function defaultFormat() {
    const axesX = options.axes!.x! as AgUnitTimeAxisOptions;
    const crosshair = axesX.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete crosshair.label.format;
    }
    if (axesX.label && axesX.label.format) {
        delete axesX.label!.format;
    }
    chart.update(options);
}
