import { AgCharts, AgVolumeProfileChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getIrregularVolumeProfile, getRegularVolumeProfile } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

let tickSizeEnabled = false;
let tickSize = 2.5;

const options: AgVolumeProfileChartOptions = {
    container: document.getElementById('myChart'),
    data: getRegularVolumeProfile(),
    title: { text: 'Acme Inc.' },
    upKey: 'upVolume',
    downKey: 'downVolume',
};

const chart = AgCharts.createVolumeProfileChart(options);

function changeData(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.data = value === 'irregular' ? getIrregularVolumeProfile() : getRegularVolumeProfile();
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
