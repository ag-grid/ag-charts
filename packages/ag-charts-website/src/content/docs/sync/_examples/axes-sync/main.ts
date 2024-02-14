import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { marketingCampaigns, productLaunches } from './data';

const options: AgCartesianChartOptions = {
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'quarterlyRevenue',
        },
    ],
    tooltip: {
        enabled: false,
    },
    sync: {
        axes: 'y',
        nodeInteraction: false,
    },
};

const chart1 = AgCharts.create({
    ...options,
    container: document.getElementById('myChart1'),
    title: {
        text: 'Quarterly Revenue vs. Product Launches',
    },
    subtitle: {
        text: 'Evaluating Revenue Impact of New Products Over 5 Years',
    },
    data: productLaunches,
});

const chart2 = AgCharts.create({
    ...options,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Quarterly Revenue vs. Marketing Campaigns',
    },
    subtitle: {
        text: 'Assessing the Effectiveness of Marketing Efforts',
    },
    data: marketingCampaigns,
});
