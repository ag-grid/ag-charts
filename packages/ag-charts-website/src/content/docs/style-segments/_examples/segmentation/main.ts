import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';

import { DataType, data } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, LegendModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Performance Variance' },
    data,
    series: [
        {
            type: 'area',
            yKey: 'variance',
            xKey: 'date',
            interpolation: {
                type: 'smooth',
            },
            strokeWidth: 2,
            fillOpacity: 0.3,
            fill: 'green', //used for the series
            stroke: 'green', //used for the series
            segmentation: {
                key: 'y', //segment along the y axis
                segments: [
                    {
                        stop: 0, //domain min until 0
                        fill: 'red', //used for this segment
                        stroke: 'red', //used for this segment
                    },
                ],
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            paddingOuter: 0,
        },
        y: {
            type: 'number',
            title: { text: 'Variance ($)' },
        },
    },
};

const chart = AgCharts.create(options);
