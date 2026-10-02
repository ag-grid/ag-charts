import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const highlightedItemShadow = {
    enabled: true,
    color: 'rgba(0, 0, 0, 0.5)',
    xOffset: 3,
    yOffset: 3,
    blur: 8,
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'productA',
            yName: 'Product A',
            highlight: { highlightedItem: { shadow: highlightedItemShadow } },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'productB',
            yName: 'Product B',
            highlight: { highlightedItem: { shadow: highlightedItemShadow } },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'productC',
            yName: 'Product C',
            highlight: { highlightedItem: { shadow: highlightedItemShadow } },
        },
    ],
};

const chart = AgCharts.create(options);

function setHighlightShadow(event: Event) {
    const enabled = (event.target as HTMLInputElement).value === 'true';
    options.series!.forEach((series) => {
        (series as AgBarSeriesOptions).highlight = {
            highlightedItem: { shadow: { ...highlightedItemShadow, enabled } },
        };
    });
    chart.update(options);
}
