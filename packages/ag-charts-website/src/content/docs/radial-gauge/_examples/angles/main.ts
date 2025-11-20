import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';

import { AllGaugeModule } from 'ag-charts-enterprise';
ModuleRegistry.registerModules([AllGaugeModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
    },
    startAngle: -135,
    endAngle: 135,
};

AgCharts.createGauge(options);
