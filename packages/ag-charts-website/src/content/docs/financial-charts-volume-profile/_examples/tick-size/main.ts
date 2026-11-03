import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData, getIrregularVolumeProfile, getRegularVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    volumeProfile: {
        data: getRegularVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
    },
};

const chart = AgCharts.createFinancialChart(options);

function changeData(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.volumeProfile!.data = value === 'irregular' ? getIrregularVolumeProfile() : getRegularVolumeProfile();
    chart.update(options);
}

function changeTickSize(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.tickSize = value === 'auto' ? undefined : Number(value);
    chart.update(options);
}
