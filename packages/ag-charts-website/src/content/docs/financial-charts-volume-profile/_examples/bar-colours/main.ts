import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData, getVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    volumeProfile: {
        data: getVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
        up: { fill: '#F2C12E', stroke: '#B8901A' },
        down: { fill: '#2E6BF2', stroke: '#1A45A8' },
    },
};

AgCharts.createFinancialChart(options);
