import { AgCharts } from './agCharts';
import { BarSeriesModule } from './defs/barSeriesModule';
import { ModuleRegistry } from './modules/moduleRegistry';

export const moduleRegistry = new ModuleRegistry();

moduleRegistry.registerModules(BarSeriesModule);

const chart = AgCharts.create({
    container: document.getElementById('container')!,
    data: [{ test: true }],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    series: [
        {
            type: 'bar',
        },
        // {
        //     type: 'area',
        // },
    ],
});

chart.update({});
