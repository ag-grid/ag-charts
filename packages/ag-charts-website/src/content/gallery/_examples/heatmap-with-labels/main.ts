import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, ModuleRegistry } from 'ag-charts-community';
import { GradientLegendModule, HeatmapSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue per Quarter',
    },
    subtitle: {
        text: '£ million',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'revenue',
            colorName: 'Revenue',

            label: {
                enabled: true,
                formatter: ({ value }: { value: number }) => `£${value.toFixed(1)}m`,
            },
        },
    ],
    axes: {
        y: {
            position: 'right',
            type: 'category',
            tick: {
                size: 20,
            },
        },
        x: {
            position: 'bottom',
            type: 'category',
            line: {
                enabled: false,
            },
        },
    },
    gradientLegend: {
        scale: {
            label: {
                formatter: ({ value }: { value: number | string }) => `£${Number(value).toFixed(0)}m`,
            },
        },
        gradient: {
            thickness: 15,
            preferredLength: 400,
        },
    },
};

AgCharts.create(options);
