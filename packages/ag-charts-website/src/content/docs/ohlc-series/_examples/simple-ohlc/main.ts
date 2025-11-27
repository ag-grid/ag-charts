import { LegendModule, ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    OhlcSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    OhlcSeriesModule,
    TimeAxisModule,
    ContextMenuModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    subtitle: {
        text: 'Daily High and Low Prices',
    },
    footnote: {
        text: '1 Aug 2023 - 1 Nov 2023',
    },
    series: [
        {
            type: 'ohlc',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

AgCharts.create(options);
