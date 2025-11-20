import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { GradientLegendModule, TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, NumberAxisModule, TreemapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            colorKey: 'change',
            colorName: 'Change',
        },
    ],
    gradientLegend: {
        gradient: {
            thickness: 50,
            preferredLength: 400,
        },
    },
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
