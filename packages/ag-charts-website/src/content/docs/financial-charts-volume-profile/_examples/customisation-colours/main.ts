import { AgCharts, AgVolumeProfileChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgVolumeProfileChartOptions = {
    container: document.getElementById('myChart'),
    data: getVolumeProfile(),
    title: { text: 'Acme Inc.' },
    upKey: 'upVolume',
    downKey: 'downVolume',
    theme: {
        palette: {
            up: { fill: '#F2C12E', stroke: '#B8901A' },
            down: { fill: '#2E6BF2', stroke: '#1A45A8' },
        },
    },
};

AgCharts.createVolumeProfileChart(options);
