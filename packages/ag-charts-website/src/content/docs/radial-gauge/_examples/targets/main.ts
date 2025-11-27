import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgRadialGaugeOptions,
    AllGaugeModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
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
