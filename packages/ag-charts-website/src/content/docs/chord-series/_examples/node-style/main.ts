import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { from: 'Asia', to: 'Europe', size: 20 },
        { from: 'Asia', to: 'Americas', size: 19 },
        { from: 'Asia', to: 'Africa', size: 4 },
        { from: 'Asia', to: 'Oceania', size: 8 },
        { from: 'Europe', to: 'Asia', size: 5 },
        { from: 'Europe', to: 'Americas', size: 5 },
        { from: 'Europe', to: 'Africa', size: 3 },
        { from: 'Europe', to: 'Oceania', size: 2 },
        { from: 'Americas', to: 'Asia', size: 4 },
        { from: 'Americas', to: 'Europe', size: 5 },
        { from: 'Americas', to: 'Africa', size: 11 },
        { from: 'Americas', to: 'Oceania', size: 6 },
        { from: 'Africa', to: 'Asia', size: 3 },
        { from: 'Africa', to: 'Europe', size: 9 },
        { from: 'Africa', to: 'Americas', size: 3 },
        { from: 'Oceania', to: 'Asia', size: 1 },
        { from: 'Oceania', to: 'Europe', size: 1 },
        { from: 'Oceania', to: 'Americas', size: 1 },
    ],
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: {
                fill: '#34495e',
                stroke: '#2c3e50',
                strokeWidth: 2,
            },
        },
    ],
};

AgCharts.create(options);
