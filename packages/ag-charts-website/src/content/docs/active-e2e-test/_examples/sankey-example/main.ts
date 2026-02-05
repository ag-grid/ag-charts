// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartOptions } from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { from: 'A', to: 'C', value: 10 },
        { from: 'A', to: 'D', value: 15 },
        { from: 'B', to: 'C', value: 20 },
        { from: 'B', to: 'E', value: 25 },
        { from: 'C', to: 'E', value: 30 },
    ],
    animation: { enabled: false },
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'value',
            label: { enabled: true },
        },
    ],
};

const chart = AgCharts.create(options);

// For e2e testing:
(window as any).agE2E = { chart };
