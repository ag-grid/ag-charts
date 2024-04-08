import { AgCharts } from './agCharts';
import { BarSeriesModule } from './defs/barSeriesModule';
import { ModuleRegistry } from './modules/moduleRegistry';

export const moduleRegistry = new ModuleRegistry();

moduleRegistry.registerModules(BarSeriesModule);

AgCharts.create({
    container: document.getElementById('container')!,
    data: [{}],
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
