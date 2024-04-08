import { AgCharts } from './agCharts';
import { BarSeriesModule } from './defs/barSeriesModule';
import { ModuleRegistry } from './modules/moduleRegistry';

export const moduleRegistry = new ModuleRegistry();

moduleRegistry.registerModules(BarSeriesModule);

const chart = AgCharts.create({
    title: {
        text: 'Mean Sea Level (mm)',
    },

    container: document.getElementById('container')!,
    data: [{ test: true }],
    axes: [
        { type: 'number', position: 'bottom', nice: false },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'mm',
            showInLegend: false,
        },
    ],
});

chart.update({});
