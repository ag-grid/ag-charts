import { CategoryAxisModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, GradientLegendModule, HeatmapSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Weekly Step Count',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            xName: 'Month',
            yKey: 'week',
            yName: 'Week',
            colorKey: 'steps',
            colorName: 'Steps',
            strokeWidth: 1,
        },
    ],
    gradientLegend: {
        enabled: false,
    },
    axes: {
        y: {
            position: 'left',
            type: 'category',
            label: {
                enabled: false,
            },
        },
        x: {
            position: 'top',
            type: 'category',
            line: {
                enabled: false,
            },
        },
    },
};

AgCharts.create(options);
