import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

const data = [
    { asset: 'Stocks', amount: 60000 },
    { asset: 'Bonds', amount: 40000 },
    { asset: 'Cash', amount: 7000 },
    { asset: 'Real Estate', amount: 5000 },
    { asset: 'Commodities', amount: 3000 },
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data,
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

const chart = AgCharts.create(options);
