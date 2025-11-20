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
            preferredLength: 200,
        },
        scale: {
            label: {
                fontSize: 20,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontFamily: 'serif',
                color: 'red',
            },
            padding: 20,
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
