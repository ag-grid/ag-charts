import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';

import { AllGaugeModule } from 'ag-charts-enterprise';
ModuleRegistry.registerModules([AllGaugeModule]);
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
