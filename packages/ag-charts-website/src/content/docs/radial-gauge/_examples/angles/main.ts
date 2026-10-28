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
    startAngle: -135,
    endAngle: 135,
};

AgCharts.createGauge(options);
