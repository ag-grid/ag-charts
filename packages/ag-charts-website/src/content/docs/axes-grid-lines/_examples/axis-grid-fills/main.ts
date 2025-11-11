import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Most Common Girls' First Names In English",
    },
    subtitle: {
        text: 'over the past 100 years',
    },
    data: [
        { name: 'Mary', count: 234000 },
        { name: 'Patricia', count: 211000 },
        { name: 'Jennifer', count: 178000 },
        { name: 'Elizabeth', count: 153000 },
        { name: 'Linda', count: 123000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'name',
            yKey: 'count',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [
                    {
                        fill: '#999',
                        fillOpacity: 0.1,
                        strokeWidth: 0,
                    },
                    {},
                ],
            },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

AgCharts.create(options);
