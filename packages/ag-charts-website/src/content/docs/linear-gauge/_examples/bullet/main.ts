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
    thickness: 50,
    value: 50,
    scale: {
        min: 0,
        max: 100,
        fills: [{ color: '#A6A6A5' }, { color: '#BFBFBF' }, { color: '#D9D9D9' }],
        fillMode: 'discrete',
    },
    bar: {
        thickness: 25,
        fill: 'black',
    },
    targets: [
        {
            value: 60,
            shape: 'line',
            size: 20,
            placement: 'middle',
            strokeWidth: 2,
        },
    ],
};

AgCharts.createGauge(options);
