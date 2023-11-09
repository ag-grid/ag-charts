import { AgChart, AgChartOptions } from 'ag-charts-community';

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
            angleKey: 'amount',
            calloutLabelKey: 'asset',
            sectorLabelKey: 'amount',
            sectorLabel: {
                color: 'white',
                fontWeight: 'bold',
                formatter: ({ value }) => `$${(value / 1000).toFixed(0)}K`,
            },
        },
    ],
};

AgChart.create(options);
