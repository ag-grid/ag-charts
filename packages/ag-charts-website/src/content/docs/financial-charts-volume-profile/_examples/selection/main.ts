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
    selection: { enabled: true, enableDrag: true },
};

const chart = AgCharts.createVolumeProfileChart(options);

function changeClickMode(event: Event) {
    options.selection = {
        ...options.selection,
        clickMode: (event.target as HTMLInputElement).value as 'single' | 'multiple',
    };
    chart.update(options);
}
