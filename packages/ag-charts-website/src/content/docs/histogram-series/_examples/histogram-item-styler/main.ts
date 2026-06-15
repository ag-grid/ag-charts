import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    HistogramSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, HistogramSeriesModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Prize money distribution',
    },
    subtitle: {
        text: 'Age bands with more than ten participants are emphasised',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            yKey: 'winnings',
            yName: 'Winnings',
            itemStyler: ({ frequency, highlightState }) => {
                if (highlightState === 'highlighted-item') {
                    return { fill: 'orange' };
                }
                return { fillOpacity: frequency > 10 ? 1 : 0.4 };
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: { text: 'Age band (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            title: { text: 'Total winnings (USD)' },
        },
    },
};

AgCharts.create(options);
