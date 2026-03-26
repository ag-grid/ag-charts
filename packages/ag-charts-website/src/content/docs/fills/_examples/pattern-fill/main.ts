import { AgCharts, AgPolarChartOptions, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            radiusKey: 'radius',
            legendItemKey: 'name',
            strokeWidth: 1,
            fills: [
                {
                    type: 'pattern',
                    pattern: 'diamonds',
                },
                {
                    type: 'pattern',
                    pattern: 'hearts',
                },
                {
                    type: 'pattern',
                    pattern: 'squares',
                },
                {
                    type: 'pattern',
                    pattern: 'triangles',
                },
                {
                    type: 'pattern',
                    pattern: 'stars',
                },
            ],
        },
    ],
};

const chart = AgCharts.create(options);
