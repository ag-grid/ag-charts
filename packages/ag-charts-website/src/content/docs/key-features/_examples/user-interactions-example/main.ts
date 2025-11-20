import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Renewable Fuel Sources`,
    },
    subtitle: {
        text: `Kilotonnes of Oil Equivalent`,
    },
    tooltip: { mode: 'shared' },
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 5,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                    interpolation: {
                        type: 'smooth',
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
            min: new Date(2000, 0, 1),
            max: new Date(2022, 0, 1),
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: `ktoe`,
            },
            label: {
                formatter: (params) => `${params.value / 1000}K`,
            },
        },
    },
};

const chart = AgCharts.create(options);
