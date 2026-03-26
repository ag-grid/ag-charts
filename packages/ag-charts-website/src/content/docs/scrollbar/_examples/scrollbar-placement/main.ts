import {
    AgCartesianChartOptions,
    AgCharts,
    AgScrollbarPlacement,
    BarSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, ScrollbarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            width: 12,
        },
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            width: 12,
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            title: {
                text: 'Date',
            },
            tick: { enabled: false },
            interval: { maxSpacing: 200 },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => `${params.value / 1000}k`,
            },
        },
    },
    scrollbar: {
        enabled: true,
        placement: 'inner',
        spacing: 0,
        tickSpacing: 0,
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function setPlacement(value: AgScrollbarPlacement) {
    options.scrollbar!.placement = value;
    chart.update(options);
}

function setSpacing(event: any) {
    const value = +event.target.value;
    options.scrollbar!.spacing = value;
    chart.update(options);
    document.getElementById('spacingValue')!.innerHTML = String(value);
}

function setTickSpacing(event: any) {
    const value = +event.target.value;
    options.scrollbar!.tickSpacing = value;
    chart.update(options);
    document.getElementById('tickSpacingValue')!.innerHTML = String(value);
}

function setTicksEnabled(enabled: boolean) {
    (options.axes as any).x.tick.enabled = enabled;
    chart.update(options);
}
