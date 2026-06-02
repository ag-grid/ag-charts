import { AgCharts, AgRadialGaugeOptions, AllGaugeModule, AnimationModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule]);

// The gauge value and scale bounds are supplied as bigint, demonstrating the
// widened numeric value type. The label is shown at full precision; the bar fill
// is positioned from a ratio computed at high but finite precision.
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
