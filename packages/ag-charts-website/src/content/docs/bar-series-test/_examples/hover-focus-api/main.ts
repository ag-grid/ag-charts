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
            type: 'bar',
            xKey: 'Year',
            yKey: 'Spain',
        },
        {
            type: 'bar',
            xKey: 'Year',
            yKey: 'UK',
        },
        {
            type: 'bar',
            xKey: 'Year',
            yKey: 'Ireland',
        },
        {
            type: 'bar',
            xKey: 'Year',
            yKey: 'France',
        },
        {
            type: 'bar',
            xKey: 'Year',
            yKey: 'Germany',
        },
    ],
};

const chart = AgCharts.create(options);

let country = 'Spain';
let year = '2010';

function updateCountry(value: string): void {
    country = value;
}

function updateYear(value: string): void {
    year = value;
}

function freezeHoverFocus(): void {}

function unfreezeHoverFocus(): void {}

function logState(): void {
    setTimeout(() => console.log(chart.getState()), 1000);
}
