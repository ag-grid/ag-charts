import {
    AgChartOptions,
    AgCharts,
    GradientLegendModule,
    ModuleRegistry,
    SunburstSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([GradientLegendModule, SunburstSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            colorKey: 'gdpChange',
            colorName: 'Change',
            colorScale: {
                fills: [{ color: 'tomato' }, { color: 'lightyellow', stop: 0 }, { color: 'seagreen' }],
            },
        },
    ],
    gradientLegend: {
        enabled: true,
    },
    title: {
        text: 'Top 10 Countries by GDP',
    },
    subtitle: {
        text: '2023 — Year-on-year change',
    },
};

AgCharts.create(options);
