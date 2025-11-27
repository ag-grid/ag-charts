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

function setNeedleEnabled(enabled: boolean) {
    options.needle!.enabled = enabled;
    chart.update(options);
}

function setBarEnabled(enabled: boolean) {
    options.bar!.enabled = enabled;
    chart.update(options);
}
