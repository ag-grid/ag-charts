import { AgCartesianChartOptions, AgCategoryAxisOptions, AgCharts, TextWrap } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const separators: Record<string, string> = { spaces: ' ', none: '', zwsp: '\u200B', nbsp: '\u00A0' };

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [{ type: 'bar', xKey: 'name', yKey: 'value' }],
    axes: {
        x: {
            type: 'category',
            label: { autoRotate: false, wrapping: 'on-space', maxWidth: 100, maxHeight: 60 },
        },
        y: { type: 'number' },
    },
};

const chart = AgCharts.create(options);

function update() {
    const read = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
    const separator = separators[read('separator-select')];
    const axis = options.axes!.x! as AgCategoryAxisOptions;

    options.data = getData(separator);
    axis.label!.wrapping = read('wrap-select') as TextWrap;
    axis.label!.maxWidth = Number(read('max-width-range'));
    axis.label!.maxHeight = Number(read('max-height-range'));

    chart.update(options);
}
