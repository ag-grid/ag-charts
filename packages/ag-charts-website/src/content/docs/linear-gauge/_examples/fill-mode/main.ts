import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCharts, AgLinearGaugeOptions, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ZoomModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    direction: 'horizontal',
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    bar: {
        fills: [{ color: '#00a8ff' }, { color: '#9c88ff' }, { color: '#e84118' }],
        fillMode: 'discrete',
    },
};

const chart = AgCharts.createGauge(options);

function setFillMode(fillMode: 'continuous' | 'discrete') {
    options.bar!.fillMode = fillMode;
    chart.update(options);
}
