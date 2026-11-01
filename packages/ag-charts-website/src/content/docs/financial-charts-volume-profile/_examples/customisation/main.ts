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
        placement: 'right',
        widthRatio: 0.5,
    },
};

const chart = AgCharts.createFinancialChart(options);

function changePlacement(event: Event) {
    options.volumeProfile!.placement = (event.target as HTMLInputElement).value as 'left' | 'right';
    chart.update(options);
}

function changeWidthRatio(event: Event) {
    options.volumeProfile!.widthRatio = Number((event.target as HTMLInputElement).value);
    chart.update(options);
}
