import { AgCharts } from 'ag-charts-enterprise';

import { marketingCampaigns, productLaunches } from './data';

const chart1 = AgCharts.create({
    container: document.getElementById('myChart1'),
    title: {
        text: 'Quarterly Revenue vs. Product Launches',
    },
    subtitle: {
        text: 'Evaluating Revenue Impact of New Products Over 5 Years',
    },
    data: productLaunches,
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'quarterlyRevenue',
        },
    ],
    sync: {
        axes: 'y',
    },
});

const chart2 = AgCharts.create({
    container: document.getElementById('myChart2'),
    title: {
        text: 'Quarterly Revenue vs. Marketing Campaigns',
    },
    subtitle: {
        text: 'Assessing the Effectiveness of Marketing Efforts',
    },
    data: marketingCampaigns,
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'quarterlyRevenue',
        },
    ],
    sync: {
        axes: 'y',
    },
});
