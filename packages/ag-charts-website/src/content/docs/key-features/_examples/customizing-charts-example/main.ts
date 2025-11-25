import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable Fuel Sources`,
    },
    subtitle: {
        text: `Kilotonnes of Oil Equivalent`,
    },
    theme: {
        overrides: {
            common: {
                title: {
                    fontSize: 22,
                    color: '#444444',
                },
            },
            bar: {
                series: {
                    label: {
                        enabled: true,
                        fontSize: 14,
                        placement: 'outside-end',
                    },
                    strokeWidth: 1,
                },
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
            fill: { type: 'gradient' },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
            fill: { type: 'pattern' },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
            fill: {
                type: 'image',
                url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="192" height="144" viewBox="0 0 64 48" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2; fill: white;"><path d="M58 10H41l-8 8h25v-8Z"/><path d="M43 30v-8H29l-8 8h22Z"/><path d="M13 38.01l4-4.01h14v8H13v-3.99Z"/><path d="M41 10l-4 4H11V6h30v4Z"/><path d="M16 26h9l8-8H16v8Z"/><path d="M6 37.988h7.012L21 30H6.008v8Z"/></svg>',
                width: 64,
                height: 48,
                backgroundFill: '#004290',
            },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
            fill: { type: 'gradient' },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
            fill: { type: 'pattern' },
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom', paddingOuter: 0 },
        y: { type: 'number', position: 'left' },
    },
    legend: {
        fill: '#f6f6f6',
        border: {
            stroke: '#dddddd',
        },
        padding: 10,
        item: {
            label: {
                color: '#333333',
            },
        },
    },
};

const chart = AgCharts.create(options);
