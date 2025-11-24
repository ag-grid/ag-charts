import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { HeatmapSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, HeatmapSeriesModule, LegendModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            xName: 'Month',
            yKey: 'year',
            yName: 'Year',
            colorKey: 'temperature',
            colorName: 'Temperature',
            label: {
                enabled: true,
                formatter: ({ datum: { temperature } }) => `${temperature.toFixed(0)}°C`,
            },
        },
    ],
};

const chart = AgCharts.create(options);
