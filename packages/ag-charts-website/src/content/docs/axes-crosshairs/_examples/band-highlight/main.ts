import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BandHighlightModule,
    ContextMenuModule,
    CrosshairModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BandHighlightModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `United Kingdom Population`,
    },
    series: [
        {
            type: 'line',
            yKey: 'population',
            xKey: 'year',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            crosshair: {
                enabled: false,
            },
        },
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
            bandHighlight: {
                enabled: true,
            },
        },
    },
    formatter: {
        y: ({ value }) => {
            return `${Number(value).toLocaleString('en-GB', {
                notation: 'compact',
                maximumFractionDigits: 1,
            })}`;
        },
    },
};

AgCharts.create(options);
