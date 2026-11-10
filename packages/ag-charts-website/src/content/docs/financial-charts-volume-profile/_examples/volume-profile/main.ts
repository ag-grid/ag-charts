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
    },
};

AgCharts.createFinancialChart(options);
