import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    SunburstSeriesModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    SunburstSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'budget',
            sizeName: 'Budget',
            innerRadiusRatio: 0.4,
            innerCircle: {
                fill: 'white',
            },
            innerLabels: [
                {
                    text: 'Total Budget',
                    fontSize: 12,
                    color: 'gray',
                },
                {
                    text: '$1.3M',
                    fontSize: 24,
                    fontWeight: 'bold',
                    spacing: 6,
                },
            ],
        },
    ],
    title: {
        text: 'Company Budget Allocation',
    },
};

AgCharts.create(options);
