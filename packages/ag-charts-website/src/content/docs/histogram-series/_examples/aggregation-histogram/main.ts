import { HistogramSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AgHistogramSeriesOptions } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
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
            position: 'bottom',
            title: { text: 'Age band (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            position: 'left',
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
