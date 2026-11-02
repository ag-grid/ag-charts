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
    up: { fill: '#2e7d32', stroke: '#1b5e20' },
    down: { fill: '#ef6c00', stroke: '#e65100' },
};

AgCharts.createVolumeProfileChart(options);
