import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'animal',
            xName: 'Animal',
            yKey: 'lifespan',
            yName: 'Lifespan',
            fill: {
                type: 'gradient',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function defaultGradient() {
    (options.series![0] as AgBarSeriesOptions).fill = {
        type: 'gradient',
    };
    chart.update(options);
}

function gradientColorStops() {
    (options.series![0] as AgBarSeriesOptions).fill = {
        type: 'gradient',
        colorStops: [
            { color: '#70C1FF', stop: 0.1 },
            { color: '#FFD86F', stop: 0.3 },
            { color: '#FF9A60', stop: 0.5 },
            { color: '#D16BA5' },
        ],
    };
    chart.update(options);
}
