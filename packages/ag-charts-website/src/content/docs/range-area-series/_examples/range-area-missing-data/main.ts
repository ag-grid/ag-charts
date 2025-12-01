import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
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
const options: AgCartesianChartOptions = {
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
            yHighKey: 'detachedHouses',
            connectMissingData: false,
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

const chart = AgCharts.create(options);

function toggleConnectMissingData() {
    options.series = (options.series as Array<AgRangeAreaSeriesOptions>).map((series) => ({
        ...series,
        connectMissingData: !series.connectMissingData,
    }));

    chart.update(options);
}

function reset() {
    options.data = getData();
    chart.update(options);
}
