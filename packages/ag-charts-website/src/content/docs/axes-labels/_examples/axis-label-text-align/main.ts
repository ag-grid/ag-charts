import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

type TextAlign = 'left' | 'center' | 'right';

const initialXTextAlign: TextAlign = 'center';
// 'left' is what a right-positioned vertical axis derives, so the labels start unchanged.
const initialYTextAlign: TextAlign = 'left';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                textAlign: initialXTextAlign,
            },
        },
        y: {
            type: 'number',
            position: 'right',
            label: {
                textAlign: initialYTextAlign,
                formatter: ({ value }) => `$${value.toLocaleString()}`,
            },
        } as AgNumberAxisOptions,
    },
};

const chart = AgCharts.create(options);

function setXTextAlign(event: Event) {
    options.axes!.x!.label!.textAlign = (event.target as HTMLInputElement).value as TextAlign;
    chart.update(options);
}

function setYTextAlign(event: Event) {
    options.axes!.y!.label!.textAlign = (event.target as HTMLInputElement).value as TextAlign;
    chart.update(options);
}
