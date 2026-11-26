import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData, getVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    data: getData(),
    navigator: true,
    toolbar: true,
    statusBar: true,
    rangeButtons: true,
    volume: true,
    lastPriceLine: true,
    zoom: true,
    volumeProfile: {
        enabled: true,
        data: getVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
    },
};

AgCharts.createFinancialChart(options);
