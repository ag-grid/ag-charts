import {
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { RangeAreaSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    ZoomModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Area Markers and Labels',
    },
    seriesArea: {
        padding: {
            left: 30,
            right: 30,
        },
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: {
                size: 7,
            },
            label: {
                padding: 17,
                formatter: ({ itemType, value }) => {
                    return `${itemType === 'low' ? 'L' : 'H'}: ${value.toFixed(0)}`;
                },
            },
        },
    ],
};

AgCharts.create(options);
