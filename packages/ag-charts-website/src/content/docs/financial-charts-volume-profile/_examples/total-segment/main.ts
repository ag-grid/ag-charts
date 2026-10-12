import { AgCharts, AgVolumeProfileChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getRegularVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgVolumeProfileChartOptions = {
    container: document.getElementById('myChart'),
    data: getRegularVolumeProfile(),
    title: { text: 'Acme Inc.' },
    upKey: 'upVolume',
    downKey: 'downVolume',
    tickSize: 5,
    totalSegment: { enabled: true },
};

AgCharts.createVolumeProfileChart(options);
