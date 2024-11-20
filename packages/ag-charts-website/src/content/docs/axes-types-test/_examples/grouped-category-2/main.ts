import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Olympic Medal Counts by Region, Country, and City',
    },
    data: [
        { location: ['Europe', 'United Kingdom', 'London'], gold: 27, silver: 23, bronze: 17 },
        { location: ['Europe', 'United Kingdom', 'Manchester'], gold: 12, silver: 8, bronze: 10 },
        { location: ['Europe', 'Germany', 'Berlin'], gold: 17, silver: 10, bronze: 15 },
        { location: ['Asia', 'China', 'Beijing'], gold: 38, silver: 32, bronze: 18 },
        { location: ['Asia', 'China', 'Shanghai'], gold: 20, silver: 15, bronze: 12 },
        { location: ['Asia', 'Japan', 'Tokyo'], gold: 27, silver: 14, bronze: 17 },
        { location: ['North America', 'United States', 'Los Angeles'], gold: 46, silver: 37, bronze: 38 },
        { location: ['North America', 'United States', 'New York'], gold: 30, silver: 28, bronze: 25 },
        { location: ['North America', 'Canada', 'Toronto'], gold: 8, silver: 6, bronze: 10 },
        { location: ['South America', 'Brazil', 'Rio de Janeiro'], gold: 7, silver: 6, bronze: 6 },
        { location: ['Africa', 'South Africa', 'Cape Town'], gold: 4, silver: 4, bronze: 6 },
        { location: ['Oceania', 'Australia', 'Sydney'], gold: 17, silver: 7, bronze: 22 },
        { location: ['Oceania', 'New Zealand', 'Auckland'], gold: 10, silver: 5, bronze: 8 },
    ],
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
            label: {
                itemStyler: (params) => {
                    switch (params.depth) {
                        case 0:
                            return { fontSize: 10 };
                        case 1:
                            return { fontWeight: 'bold' };
                    }
                },
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const chart = AgCharts.create(options);
