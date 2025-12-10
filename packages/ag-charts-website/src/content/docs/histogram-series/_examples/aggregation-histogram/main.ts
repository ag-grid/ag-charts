import {
    AgCartesianChartOptions,
    AgCharts,
    AgHistogramSeriesOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Prize money distribution',
    },
    subtitle: {
        text: 'Total winnings by participant age',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            yKey: 'winnings',
            yName: 'Winnings',
            aggregation: 'sum', //default
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

const chart = AgCharts.create(options);

function changeAggregation(aggType: 'count' | 'sum' | 'mean') {
    (options.series![0] as AgHistogramSeriesOptions).aggregation = aggType;
    options.axes!.y!.title!.text = aggType == 'count' ? 'Number of winners' : 'Total winnings (USD)';
    chart.update(options);
}
