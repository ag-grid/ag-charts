import {
    AgCharts,
    AgRadialGaugeOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadialGaugeModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([RadialGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    needle: {
        enabled: true,
    },
    bar: {
        enabled: false,
    },
};

const chart = AgCharts.createGauge(options);

function setNeedleEnabled(event: Event) {
    options.needle!.enabled = (event.target as HTMLInputElement).value === 'true';
    chart.update(options);
}

function setBarEnabled(event: Event) {
    options.bar!.enabled = (event.target as HTMLInputElement).value === 'true';
    chart.update(options);
}
