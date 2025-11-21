import {
    AgCartesianChartOptions,
    AgChartLegendClickEvent,
    AgChartLegendDoubleClickEvent,
    AgCharts,
} from 'ag-charts-community';

let options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        {
            quarter: 'Q1',
            petrol: 200,
            diesel: 100,
        },
        {
            quarter: 'Q2',
            petrol: 300,
            diesel: 130,
        },
        {
            quarter: 'Q3',
            petrol: 350,
            diesel: 160,
        },
        {
            quarter: 'Q4',
            petrol: 400,
            diesel: 200,
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
        },
    ],

    legend: {
        listeners: {
            legendItemClick: ({ seriesId, itemId }: AgChartLegendClickEvent) => {
                console.log(`Click - seriesId: ${seriesId}, itemId: ${itemId}`);
            },
            legendItemDoubleClick: ({ seriesId, itemId }: AgChartLegendDoubleClickEvent) => {
                console.log(`Double Click - seriesId: ${seriesId}, itemId: ${itemId}`);
            },
        },
    },
};

AgCharts.create(options);
