import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData, getVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    navigator: false, // disabled by default!
    toolbar: true,
    rangeButtons: true,
    volume: true,
    statusBar: true,
    zoom: true,
    volumeProfile: {
        enabled: false,
        data: getVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
    },
};

const chart = AgCharts.createFinancialChart(options);

function toggleFeature(
    type: 'navigator' | 'toolbar' | 'rangeButtons' | 'volume' | 'statusBar' | 'zoom',
    enabled: boolean
) {
    options[type] = enabled;
    chart.update(options);
}

function toggleVolumeProfile(enabled: boolean) {
    options.volumeProfile!.enabled = enabled;
    chart.update(options);
}
