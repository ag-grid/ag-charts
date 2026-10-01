import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData, getIrregularVolumeProfile, getRegularVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

let tickSizeEnabled = false;
let tickSize = 2.5;

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    volumeProfile: {
        data: getRegularVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
        placement: 'left',
        widthRatio: 0.2,
    },
};

const chart = AgCharts.createFinancialChart(options);

function changeData(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.volumeProfile!.data = value === 'irregular' ? getIrregularVolumeProfile() : getRegularVolumeProfile();
    chart.update(options);
}

function toggleTickSize(event: Event) {
    tickSizeEnabled = (event.target as HTMLInputElement).value === 'on';
    updateTickSize();
}

function changeTickSize(event: Event) {
    tickSize = Number((event.target as HTMLInputElement).value);
    updateTickSize();
}

/** inScope */
function updateTickSize() {
    options.tickSize = tickSizeEnabled ? tickSize : undefined;
    chart.update(options);
}
