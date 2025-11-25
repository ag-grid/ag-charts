import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgRadialGaugeOptions, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ZoomModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
};

AgCharts.createGauge(options);
