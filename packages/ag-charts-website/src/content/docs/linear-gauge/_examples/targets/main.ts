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
