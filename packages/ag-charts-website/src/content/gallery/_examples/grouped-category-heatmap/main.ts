import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    GradientLegendModule,
    GroupedCategoryAxisModule,
    HeatmapSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    GradientLegendModule,
    GroupedCategoryAxisModule,
    HeatmapSeriesModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Mean Temperature by City and Quarter',
    },
    subtitle: {
        text: '2021-2022 Climate Data',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'period',
            xName: 'Period',
            yKey: 'city',
            yName: 'City',
            colorKey: 'temperature',
            colorName: 'Temperature',
            colorRange: ['lightblue', 'lightyellow', 'orange', 'red'],
            tooltip: {
                renderer: ({ datum, xKey, yKey, colorKey }) => {
                    const [year, quarter] = datum[xKey];
                    const temp = colorKey ? datum[colorKey] : 0;
                    return {
                        title: `${datum[yKey]} ${quarter} ${year}`,
                        data: [{ label: 'Temperature', value: `${temp.toFixed(1)}°C` }],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            depthOptions: [{}, { label: { fontWeight: 'bold' } }],
        },
        y: {
            type: 'category',
        },
    },
    gradientLegend: {
        enabled: true,
        gradient: {
            thickness: 15,
            preferredLength: 300,
        },
    },
};

AgCharts.create(options);
