import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgLinearGaugeOptions,
    AllGaugeModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'horizontal',
    container: document.getElementById('myChart'),
    value: 80,
    thickness: 100,
    bar: {
        thickness: 50,
    },
    scale: {
        min: 0,
        max: 100,
    },
};

AgCharts.createGauge(options);
