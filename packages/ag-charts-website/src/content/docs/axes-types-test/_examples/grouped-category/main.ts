import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Total Winnings by Country & Game',
    },
    data: [
        {
            grouping: ['Argentina', 'Blood Bowl'],
            totalWinnings: 557754,
        },
        {
            grouping: ['Argentina', 'Cross and Circle'],
            totalWinnings: 289890,
        },
        {
            grouping: ['Belgium', 'Isola'],
            totalWinnings: 506858,
        },
        {
            grouping: ['Brazil', 'Game of the Generals'],
            totalWinnings: 607503,
        },
        {
            grouping: ['Colombia', 'Abalone'],
            totalWinnings: 508537,
        },
        {
            grouping: ['Colombia', 'Hare and Hounds'],
            totalWinnings: 574681,
        },
        {
            grouping: ['France', 'Agon'],
            totalWinnings: 507707,
        },
        {
            grouping: ['France', 'Battleship'],
            totalWinnings: 564090,
        },
        {
            grouping: ['France', 'Blood Bowl'],
            totalWinnings: 624867,
        },
        {
            grouping: ['France', 'Bul'],
            totalWinnings: 675005,
        },
        {
            grouping: ['France', 'Checkers'],
            totalWinnings: 494472,
        },
        {
            grouping: ['France', 'Kalah'],
            totalWinnings: 605384,
        },
    ],
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
            title: {
                text: 'Axis title',
            },
            tick: {
                stroke: 'blue',
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Axis title',
            },
        },
    ],
    series: [
        {
            xKey: 'grouping',
            xName: 'Group',
            yKey: 'totalWinnings',
            yName: 'Total Winnings',
            showInLegend: false,
            grouped: true,
            type: 'bar',
        },
    ],
};

const chart = AgCharts.create(options);
