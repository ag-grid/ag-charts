import {
    AgActiveChangeEvent,
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Energy Production by Source & Country',
    },
    subtitle: {
        text: 'Energy Production (TWh)',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'USACoal',
            yName: 'Coal - USA',
            legendItemName: 'Coal',
            stackGroup: 'usa',
            fill: '#5b5b5b',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'USAGas',
            yName: 'Natural Gas - USA',
            legendItemName: 'Natural Gas',
            stackGroup: 'usa',
            fill: '#f2a541',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'USARenewables',
            yName: 'Renewables - USA',
            legendItemName: 'Renewables',
            stackGroup: 'usa',
            fill: '#4caf50',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'USANuclear',
            yName: 'Nuclear - USA',
            legendItemName: 'Nuclear',
            stackGroup: 'usa',
            fill: '#6f7bd9',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'GermanyCoal',
            yName: 'Coal - Germany',
            legendItemName: 'Coal',
            stackGroup: 'germany',
            showInLegend: false,
            fill: '#5b5b5b',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'GermanyGas',
            yName: 'Natural Gas - Germany',
            legendItemName: 'Natural Gas',
            stackGroup: 'germany',
            showInLegend: false,
            fill: '#f2a541',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'GermanyRenewables',
            yName: 'Renewables - Germany',
            legendItemName: 'Renewables',
            stackGroup: 'germany',
            showInLegend: false,
            fill: '#4caf50',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'GermanyNuclear',
            yName: 'Nuclear - Germany',
            legendItemName: 'Nuclear',
            stackGroup: 'germany',
            showInLegend: false,
            fill: '#6f7bd9',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'ChinaCoal',
            yName: 'Coal - China',
            legendItemName: 'Coal',
            stackGroup: 'china',
            showInLegend: false,
            fill: '#5b5b5b',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'ChinaGas',
            yName: 'Natural Gas - China',
            legendItemName: 'Natural Gas',
            stackGroup: 'china',
            showInLegend: false,
            fill: '#f2a541',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'ChinaRenewables',
            yName: 'Renewables - China',
            legendItemName: 'Renewables',
            stackGroup: 'china',
            showInLegend: false,
            fill: '#4caf50',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'ChinaNuclear',
            yName: 'Nuclear - China',
            legendItemName: 'Nuclear',
            stackGroup: 'china',
            showInLegend: false,
            fill: '#6f7bd9',
        },
    ],
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<unknown>) => {
            if (ev.activeItem === undefined) {
                console.log(`[inactive], event:`, ev);
            } else {
                const { type: t, seriesId: s, itemId: i } = ev.activeItem;
                console.log(`[${t}], seriesId: ${s}, itemId: ${i}, event:`, ev);
            }
        },
    },
};

AgCharts.create(options);
