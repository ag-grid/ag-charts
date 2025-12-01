import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    GroupedCategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    RangeAreaSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([GroupedCategoryAxisModule, LineSeriesModule, NumberAxisModule, RangeAreaSeriesModule]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: `Fuel Price Indices In The Domestic Sector`,
    },
    subtitle: {
        text: `Consumer prices index: gas and electricity components excluding tax, quarterly, United Kingdom`,
    },
    footnote: {
        text: `Data is available in current (cash) and real terms in 2010 prices. Real terms data has been deflated using the GDP (market prices) deflator.`,
    },
    theme: {
        overrides: {
            line: {
                series: {
                    marker: {
                        enabled: false,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'range-area',
            xKey: 'Year',
            xName: 'Year',
            yLowKey: 'Current Gas',
            yHighKey: 'Current Electricity',
            fillOpacity: 1,
            interpolation: {
                type: 'step',
            },
            marker: {
                size: 0,
                shape: 'square',
                strokeWidth: 1,
            },
        },
        {
            type: 'line',
            xKey: 'Year',
            xName: 'Year',
            yKey: 'Real Gas',
            yName: 'Real Gas',
            interpolation: {
                type: 'step',
            },
        },
        {
            type: 'line',
            xKey: 'Year',
            xName: 'Year',
            yKey: 'Real Electricity',
            yName: 'Real Electricity',
            interpolation: {
                type: 'step',
            },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
            depthOptions: [
                { label: { enabled: false } },
                {
                    label: {
                        rotation: 90,
                    },
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            interval: {
                values: [0, 150, 300],
            },
        },
    },
};

AgCharts.create(options);
