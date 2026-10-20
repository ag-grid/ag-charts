import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HlcSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HlcSeriesModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    subtitle: {
        text: 'Daily High, Low and Close Prices',
    },
    footnote: {
        text: '1 Aug 2023 - 1 Nov 2023',
    },
    series: [
        {
            type: 'hlc',
            xKey: 'date',
            xName: 'Date',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
        },
    ],
};

AgCharts.create(options);
