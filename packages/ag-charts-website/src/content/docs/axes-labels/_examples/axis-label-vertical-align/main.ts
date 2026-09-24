import { AgCartesianChartOptions, AgCategoryAxisOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

type VerticalAlign = 'top' | 'middle' | 'bottom';

// The alignment each axis derives from its position, so the labels start unchanged.
const initialXVerticalAlign: VerticalAlign = 'top';
const initialYVerticalAlign: VerticalAlign = 'middle';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'region',
            yKey: 'revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                // Region names wrap onto a differing number of lines, so alignment matters here.
                wrapping: 'always',
                verticalAlign: initialXVerticalAlign,
            },
        } as AgCategoryAxisOptions,
        y: {
            type: 'number',
            label: {
                verticalAlign: initialYVerticalAlign,
                formatter: ({ value }) => `$${value.toLocaleString()}`,
            },
        },
    },
};

const chart = AgCharts.create(options);

function setXVerticalAlign(event: Event) {
    options.axes!.x!.label!.verticalAlign = (event.target as HTMLInputElement).value as VerticalAlign;
    chart.update(options);
}

function setYVerticalAlign(event: Event) {
    options.axes!.y!.label!.verticalAlign = (event.target as HTMLInputElement).value as VerticalAlign;
    chart.update(options);
}
