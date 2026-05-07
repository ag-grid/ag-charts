import {
    AgCartesianChartOptions,
    AgCharts,
    AgSelectionContainment,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Drag across the chart to select multiple bars' },
    selection: {
        enabled: true,
        enableDrag: true,
        containment: 'any',
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
};

const chart = AgCharts.create(options);

function setContainment(value: AgSelectionContainment) {
    options.selection = { ...options.selection, containment: value };
    chart.update(options);
}
