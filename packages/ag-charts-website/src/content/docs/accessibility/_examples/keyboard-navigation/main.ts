import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable sources used to generate electricity for transport fuels`,
    },
    data: getData(),
    animation: { enabled: false },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Small scale Hydro',
            yName: 'Small Scale Hydro',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Large scale Hydro',
            yName: 'Large Scale Hydro',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'category',
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: `kilotonnes of oil equivalent (ktoe)`,
            },
            label: {
                formatter: (params) => `${params.value / 1000}K`,
            },
        },
    },
    legend: {
        maxHeight: 40,
        maxWidth: 800,
    },
    listeners: {
        seriesNodeClick: (e) => {
            console.log(e.type, e.seriesId, e.datum[e.xKey!], e.datum[e.yKey!]);
        },
    },
};

const chart = AgCharts.create(options);
