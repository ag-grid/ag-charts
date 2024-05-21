import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Global Migrations between Continents',
    },
    data: [
        { fromId: 'Asia', toId: 'Europe', size: 20 },
        { fromId: 'Asia', toId: 'Americas', size: 19 },
        { fromId: 'Asia', toId: 'Africa', size: 4 },
        { fromId: 'Asia', toId: 'Oceania', size: 8 },
        { fromId: 'Europe', toId: 'Asia', size: 5 },
        { fromId: 'Europe', toId: 'Americas', size: 5 },
        { fromId: 'Europe', toId: 'Africa', size: 3 },
        { fromId: 'Europe', toId: 'Oceania', size: 2 },
        { fromId: 'Americas', toId: 'Asia', size: 4 },
        { fromId: 'Americas', toId: 'Europe', size: 5 },
        { fromId: 'Americas', toId: 'Africa', size: 11 },
        { fromId: 'Americas', toId: 'Oceania', size: 6 },
        { fromId: 'Africa', toId: 'Asia', size: 3 },
        { fromId: 'Africa', toId: 'Europe', size: 9 },
        { fromId: 'Africa', toId: 'Americas', size: 3 },
        { fromId: 'Oceania', toId: 'Asia', size: 1 },
        { fromId: 'Oceania', toId: 'Europe', size: 1 },
        { fromId: 'Oceania', toId: 'Americas', size: 1 },
    ],
    series: [
        {
            type: 'chord',
            fromIdKey: 'fromId',
            toIdKey: 'toId',
            sizeKey: 'size',
        },
    ],
};

AgCharts.create(options);
