import { AgCartesianChartOptions, AgChartLegendItemTooltipRendererParams, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'naturalGas', yName: 'Natural Gas' },
        { type: 'bar', xKey: 'quarter', yKey: 'coal', yName: 'Coal' },
        { type: 'bar', xKey: 'quarter', yKey: 'primaryOil', yName: 'Primary Oil' },
        { type: 'bar', xKey: 'quarter', yKey: 'petroleum', yName: 'Petroleum' },
        { type: 'bar', xKey: 'quarter', yKey: 'manufacturedFuels', yName: 'Manufactured Fuels' },
    ],
    legend: {
        item: {
            label: {
                maxLength: 10,
            },
            tooltip: {
                visible: 'auto',
            },
        },
    },
};

const chart = AgCharts.create(options);

function setTooltipMode(value: string) {
    switch (value) {
        case 'auto':
            options.legend = {
                item: { label: { maxLength: 10 }, tooltip: { visible: 'auto' } },
            };
            break;
        case 'always':
            options.legend = {
                item: { label: { maxLength: 10 }, tooltip: { visible: 'always' } },
            };
            break;
        case 'never':
            options.legend = {
                item: { label: { maxLength: 10 }, tooltip: { visible: 'never' } },
            };
            break;
        case 'custom-text':
            options.legend = {
                item: { label: { maxLength: 10 }, tooltip: { text: 'Click to toggle series visibility' } },
            };
            break;
        case 'renderer':
            options.legend = {
                item: {
                    label: { maxLength: 10 },
                    tooltip: {
                        renderer: ({ text, enabled }: AgChartLegendItemTooltipRendererParams) => {
                            const status = enabled ? 'Visible' : 'Hidden';
                            return `<b>${text}</b><br/><em>${status}</em>`;
                        },
                    },
                },
            };
            break;
    }
    chart.update(options);
}
