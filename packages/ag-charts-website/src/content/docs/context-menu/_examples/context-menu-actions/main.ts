import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sweaters made',
    },
    legend: {},
    contextMenu: {
        extraActions: [
            {
                label: 'Say hello',
                action: () => {
                    window.alert('Hello world!');
                },
            },
        ],
        extraNodeActions: [
            {
                label: 'Say hello to a node',
                action: ({ datum, yKey }) => {
                    window.alert(`Hello ${yKey} in ${datum.month}!`);
                },
            },
        ],
        extraLegendItemActions: [
            {
                label: 'Say hello to a legend item',
                action: ({ itemId }) => {
                    window.alert(`Hello ${itemId}!`);
                },
            },
        ],
    },
    data: [
        {
            month: 'Jun',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Jul',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Aug',
            sweaters: 60,
            hats: 30,
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'hats',
            yName: 'Hats Made',
        },
    ],
};

AgCharts.create(options);
