// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { getData } from './data';
import type { DatumType } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Net migration',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'Year',
            yKey: 'Spain',
        },
        {
            type: 'line',
            xKey: 'Year',
            yKey: 'UK',
        },
        {
            type: 'line',
            xKey: 'Year',
            yKey: 'Ireland',
        },
        {
            type: 'line',
            xKey: 'Year',
            yKey: 'France',
        },
        {
            type: 'line',
            xKey: 'Year',
            yKey: 'Germany',
        },
    ],
};

const chart = AgCharts.create(options);

let country = 'Spain';
let year = '2010';
let frozen = false;

function onCountryChange(value: string): void {
    country = value;
}

function onYearChange(value: string): void {
    year = value;
}

function onFreezeChange(checked: boolean): void {
    frozen = checked;
}

function onGetState(): void {
    setTimeout(() => console.log(chart.getState()), 1000);
}
