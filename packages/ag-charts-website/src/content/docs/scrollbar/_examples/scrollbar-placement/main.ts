import {
    AgCartesianChartOptions,
    AgCharts,
    AgScrollbarPlacement,
    BarSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
    LegendModule,
]);

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
};

const chart = AgCharts.create(options);

let placement: AgScrollbarPlacement = 'inner';
let ticksEnabled = false;

// tickSpacing only affects the layout when the scrollbar is placed 'inner' and axis ticks are enabled,
// so disable the control in every other case to make it clear it has no effect.
function updateTickSpacingEnabled() {
    const tickSpacingGroup = document.getElementById('tickSpacingGroup') as HTMLFieldSetElement;
    tickSpacingGroup.disabled = !(placement === 'inner' && ticksEnabled);
}

function setPlacement(value: AgScrollbarPlacement) {
    placement = value;
    options.scrollbar!.placement = value;
    chart.update(options);
    updateTickSpacingEnabled();
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
    ticksEnabled = enabled;
    (options.axes as any).x.tick.enabled = enabled;
    chart.update(options);
    updateTickSpacingEnabled();
}

updateTickSpacingEnabled();
