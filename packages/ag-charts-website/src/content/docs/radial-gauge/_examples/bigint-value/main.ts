import { AgCharts, AgRadialGaugeOptions, AllGaugeModule, AnimationModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule]);

// The gauge value and scale bounds are supplied as bigint, demonstrating the
// widened numeric value type. Values are interpreted at full integer precision.
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 7_400_000_000n,
    scale: {
        min: 0n,
        max: 10_000_000_000n,
    },
};

AgCharts.createGauge(options);
