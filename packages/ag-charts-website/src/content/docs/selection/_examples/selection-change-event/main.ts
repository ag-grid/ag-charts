import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { QuarterDatum, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions<QuarterDatum> = {
    container: document.getElementById('myChart'),
    title: { text: 'Open the console to see selection changes' },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue ($m)',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    listeners: {
        selectionChange: (event) => {
            console.log('selectionChange', {
                source: event.source,
                added: event.added.map((item) => item.datum?.quarter),
                removed: event.removed.map((item) => item.datum?.quarter),
            });
        },
    },
};

AgCharts.create(options);
