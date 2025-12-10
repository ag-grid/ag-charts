import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'GDP Growth (1995–2024)' },
    subtitle: { text: 'Trillions USD' },
    contextMenu: {
        items: [
            'download',
            {
                showOn: 'series-area',
                label: 'Zoom Controls',
                items: ['zoom-to-cursor', 'pan-to-cursor', 'reset-zoom'],
            },
            {
                showOn: 'legend-item',
                label: 'Legend Controls',
                items: ['toggle-series-visibility', 'toggle-other-series'],
            },
            'separator',
            {
                label: 'Debug Console',
                items: [
                    {
                        type: 'action',
                        showOn: 'always',
                        label: `On 'always'`,
                        action: () => console.log(`On 'always' clicked.`),
                    },
                    {
                        showOn: 'series-area',
                        label: `On 'series-area'`,
                        action: () => console.log(`On 'series-area' clicked.`),
                    },
                    {
                        showOn: 'series-node',
                        label: `On 'series-node'`,
                        action: ({ datum, xKey, yKey }) =>
                            console.log(`On 'series-node' clicked -`, yKey, datum[xKey!], datum[yKey!]),
                    },
                    {
                        showOn: 'legend-item',
                        label: `On 'legend-item'`,
                        action: ({ itemId }) => console.log(`On 'legend-item' clicked -`, itemId),
                    },
                ],
            },
        ],
    },
    data: getData(),
    legend: { position: 'left' },
    zoom: { enabled: true },
    series: [
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'USA' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'EU' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'China' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'India' },
    ],
    axes: {
        y: { type: 'number', title: { text: 'GDP (Trillions USD)' } },
        x: { type: 'category', title: { text: 'Year' }, label: { autoRotate: false } },
    },
};

AgCharts.create(options);
