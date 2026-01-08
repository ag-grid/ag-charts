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
const version = chart.getState().version;

type Country = keyof typeof SERIES_ID_MAP;
type Year = keyof typeof ITEM_ID_MAP;
let country: Country = 'Spain';
let year: Year = '2010';
let frozen = false;

const SERIES_ID_MAP = {
    Spain: 'LineSeries-1',
    UK: 'LineSeries-2',
    Ireland: 'LineSeries-3',
    France: 'LineSeries-4',
    Germany: 'LineSeries-5',
};
const ITEM_ID_MAP = {
    '2010': '0',
    '2011': '1',
    '2012': '2',
    '2013': '3',
    '2014': '4',
    '2015': '5',
    '2016': '6',
    '2017': '7',
    '2018': '8',
    '2019': '9',
    '2020': '10',
    '2021': '11',
    '2022': '12',
    '2023': '13',
    '2024': '14',
};

function onCountryChange(value: Country): void {
    country = value;
}

function onYearChange(value: Year): void {
    year = value;
}

function onFreezeChange(checked: boolean): void {
    frozen = checked;
}

function onSetState(): void {
    chart.setState({
        version,
        picked: {
            activeItem: {
                seriesId: SERIES_ID_MAP[country],
                itemId: ITEM_ID_MAP[year],
            },
            frozen,
        },
    });
}

function onGetState(): void {
    setTimeout(() => console.log(chart.getState()), 1000);
}
