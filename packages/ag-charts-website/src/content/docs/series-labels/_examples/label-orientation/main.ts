import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartLabelOrientation } from 'ag-charts-types';

import { DataType, data } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Profit Change ($m)' },
    data,
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'profitChange',
            label: {
                enabled: true,
                placement: 'inside-end',
                orientation: 'horizontal',
                wrapping: 'never',
                formatter: (params) => `$${params.value}m profit${params.datum.note ? ` (${params.datum.note})` : ''}`,
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    data: [{ label: 'Profit Change', value: `$${datum.profitChange}m` }],
                }),
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Profit Change ($m)' } },
    },
};

const chart = AgCharts.create(options);

function setOrientation(orientation: string) {
    const series = options.series![0] as AgBarSeriesOptions<DataType>;
    const orientations = orientation.split(/,\s*/g) as AgChartLabelOrientation[];
    series.label!.orientation = orientations.length > 1 ? orientations : orientations[0];
    chart.update(options);
}
