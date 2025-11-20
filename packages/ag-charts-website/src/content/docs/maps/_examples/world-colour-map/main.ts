import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { GradientLegendModule, MapShapeBackgroundSeriesModule, MapShapeSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';


ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, MapShapeBackgroundSeriesModule, MapShapeSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    topology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            title: 'Access to Clean Fuels',
            idKey: 'name',
            colorKey: 'value',
            colorName: '% of population',
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'right',
        gradient: {
            preferredLength: 200,
            thickness: 2,
        },
        scale: {
            label: {
                fontSize: 10,
                formatter: (p) => p.value + '%',
            },
        },
    },
};

AgCharts.create(options);
