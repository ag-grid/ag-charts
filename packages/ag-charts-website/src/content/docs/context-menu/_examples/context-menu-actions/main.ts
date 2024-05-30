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
                    window.alert('Hello, world!');
                },
            },
        ],
        extraNodeActions: [
            {
                label: 'Say hello to a node',
                action: ({ datum }) => {
                    if (datum) {
                        window.alert(`Hello, ${datum.month}!`);
                    } else {
                        window.alert('Hello, world!');
                    }
                },
            },
        ],
        extraLegendItemActions: [
            {
                label: 'Say hello to a legend item',
                action: ({ itemId }) => {
                    if (itemId) {
                        window.alert(`Hello, ${itemId}!`);
                    } else {
                        window.alert('Hello, world!');
                    }
                },
            },
        ],
    },
    data: [
        {
            month: 'Jun',
            sweaters: 50,
        },
        {
            month: 'Jul',
            sweaters: 70,
        },
        {
            month: 'Aug',
            sweaters: 60,
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
    ],
};

AgCharts.create(options);
