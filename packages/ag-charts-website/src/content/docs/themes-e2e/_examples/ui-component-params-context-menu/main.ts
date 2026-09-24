// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        params: {
            menuSeparatorColor: '#0000ff',
        },
    },
    data: [
        { month: 'Jan', revenue: 120 },
        { month: 'Feb', revenue: 150 },
        { month: 'Mar', revenue: 180 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'revenue' }],
    contextMenu: {
        items: ['download', 'separator', { label: 'Custom action', action: () => {} }],
    },
};

AgCharts.create(options);
