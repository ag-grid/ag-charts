import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'asset',
            angleKey: 'amount',
            innerRadiusRatio: 0.9,
            innerLabels: [
                {
                    text: 'Total Investment',
                    fontWeight: 'bold',
                },
                {
                    text: '$100,000',
                    margin: 4,
                    fontSize: 48,
                    color: 'green',
                },
            ],
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

AgCharts.create(options);
