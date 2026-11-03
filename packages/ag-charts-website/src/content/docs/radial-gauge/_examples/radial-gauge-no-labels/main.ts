import { AgCharts, AgRadialGaugeOptions, ModuleRegistry, RadialGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([RadialGaugeModule]);

const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 80,
    scale: {
        min: 0,
        max: 100,
        label: { enabled: false },
    },
    label: { enabled: false },
};

AgCharts.createGauge(options);
