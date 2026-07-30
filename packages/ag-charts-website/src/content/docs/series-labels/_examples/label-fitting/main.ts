import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { TextWrap } from 'ag-charts-types';

import { DataType, data } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Revenue by Leading Division' },
    data,
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            label: {
                enabled: true,
                placement: 'inside-end',
                formatter: (params) => `$${params.value}m ${params.datum.division}`,
                maxWidth: 70,
                maxHeight: 54,
                wrapping: 'on-space',
                truncate: true,
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Revenue ($m)' } },
    },
};

const chart = AgCharts.create(options);

function setMaxWidth(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('maxWidthValue')!.textContent = String(value);
    (options.series![0] as AgBarSeriesOptions<DataType>).label!.maxWidth = value;
    chart.update(options);
}

function setMaxHeight(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('maxHeightValue')!.textContent = String(value);
    (options.series![0] as AgBarSeriesOptions<DataType>).label!.maxHeight = value;
    chart.update(options);
}

function setWrapping(wrapping: string) {
    (options.series![0] as AgBarSeriesOptions<DataType>).label!.wrapping = wrapping as TextWrap;
    chart.update(options);
}

function setTruncate(value: string) {
    (options.series![0] as AgBarSeriesOptions<DataType>).label!.truncate = value === 'enabled';
    chart.update(options);
}
