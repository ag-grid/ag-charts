import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';
import { AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, LegendModule]);
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
