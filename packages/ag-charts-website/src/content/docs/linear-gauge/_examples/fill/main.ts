import {
    AgCharts,
    AgLinearGaugeOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LinearGaugeModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([LinearGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    direction: 'horizontal',
    value: 80,
    scale: {
        min: 0,
        max: 100,
        fill: '#f5f6fa',
    },
    bar: {
        fill: '#4cd137',
    },
};

AgCharts.createGauge(options);
