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

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Revenue' },
    subtitle: { text: 'Click or drag to select' },
    footnote: { text: 'No items selected' },
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
            highlight: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    listeners: {
        selectionChange: () => {
            updateFootnote();
        },
    },
};

const chart = AgCharts.create(options);

function updateFootnote() {
    const count = Array.from(chart.getSelection()).length;
    options.footnote = {
        text: count === 0 ? 'No items selected' : `${count} item${count === 1 ? '' : 's'} selected`,
    };
    chart.update(options);
}
