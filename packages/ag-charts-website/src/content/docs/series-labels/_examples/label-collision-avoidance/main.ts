import { AgCartesianChartOptions, AgCharts, AgScatterSeriesOptions, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';

import { DataType, data } from './data';

ModuleRegistry.registerModules([ScatterSeriesModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Weather Station Locations' },
    data,
    series: [
        {
            type: 'scatter',
            xKey: 'x',
            yKey: 'y',
            labelKey: 'city',
            label: {
                enabled: true,
                placement: ['top', 'bottom', 'left', 'right'],
                collision: {
                    threshold: 4,
                },
            },
        },
    ],
    axes: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
};

const chart = AgCharts.create(options);

function avoidanceChange(event: Event) {
    const enabled = (event.target as HTMLSelectElement).value === 'enabled';
    const series = options.series![0] as AgScatterSeriesOptions<DataType>;
    series.label!.collision!.threshold = enabled ? 4 : -1;
    chart.update(options);
}
