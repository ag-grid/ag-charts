import { AgCharts, AgVolumeProfileChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgVolumeProfileChartOptions = {
    container: document.getElementById('myChart'),
    data: getVolumeProfile(),
    title: { text: 'Acme Inc.' },
    upKey: 'upVolume',
    downKey: 'downVolume',
};

AgCharts.createVolumeProfileChart(options);
