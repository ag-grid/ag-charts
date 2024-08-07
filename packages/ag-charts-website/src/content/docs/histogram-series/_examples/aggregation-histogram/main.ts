import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
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
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: { text: 'Age band (years)' },
            interval: { step: 2 },
        },
        {
            type: 'number',
            position: 'left',
            title: { text: 'Total winnings (USD)' },
        },
    ],
};

const chart = AgCharts.create(options);

function changeAggregation(aggType: string) {
    options.series![0].aggregation = aggType;
    options.axes[1].title.text = aggType == 'count' ? 'Number of winners' : 'Total winnings (USD)';
    chart.update(options);
}
