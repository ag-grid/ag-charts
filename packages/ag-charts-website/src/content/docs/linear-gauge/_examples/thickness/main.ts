import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';
import { AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, LegendModule]);
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
