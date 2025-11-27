import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgLinearGaugeOptions, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ZoomModule]);
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
