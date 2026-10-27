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
    value: 50,
    scale: {
        min: 0,
        max: 100,
    },
    targets: [
        {
            value: 70,
            text: 'Average',
        },
    ],
};

AgCharts.createGauge(options);
