import { LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    RangeAreaSeriesModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    UnitTimeAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'London Property Average Price Range',
    },
    subtitle: {
        text: '2000 - 2020',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'flatsAndMaisonettes',
            yHighKey: 'terracedHouses',
            xName: 'Date',
            yName: 'Flats & Terraced',
            yLowName: 'Flats & Maisonettes',
            yHighName: 'Terraced',
        },
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'semiDetachedHouses',
            yHighKey: 'detachedHouses',
            xName: 'Date',
            yName: 'Semi-detached & Detached',
            yLowName: 'Semi-detached',
            yHighName: 'Detached',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Average Price',
            },
            label: {
                formatter: ({ value }) => `£${Number(value).toLocaleString()}`,
            },
        },
        x: {
            position: 'bottom',
            type: 'unit-time',
        },
    },
};

AgCharts.create(options);
