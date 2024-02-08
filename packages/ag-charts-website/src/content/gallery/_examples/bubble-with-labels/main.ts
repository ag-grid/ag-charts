import { AgBubbleSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip = {
    renderer: ({ datum, xName, yName, sizeName, xKey, yKey, sizeKey }: AgBubbleSeriesTooltipRendererParams<any>) => {
        return {
            content: `<b>${xName}:</b> ${datum[xKey]}<br/><b>${yName}: </b>${
                datum[yKey]
            }<br/><b>${sizeName}: </b>${datum[sizeKey].toLocaleString()}`,
        };
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The Best Movies of All Time',
    },
    subtitle: {
        text: 'Top 10 Highest Rated Movies On IMDb',
    },
    series: Object.entries(getData()).map(([genre, data]) => ({
        data,
        type: 'bubble',
        xKey: 'yearOfRelease',
        xName: 'Year',
        yKey: 'rating',
        yName: `${genre[0].toUpperCase()}${genre.slice(1)}`,
        sizeKey: 'boxOffice',
        sizeName: 'Box Office',
        marker: {
            size: 20,
            maxSize: 60,
            domain: [2000000, 1200000000],
        },
        label: {
            formatter: ({ datum: { ranking, title } }) => `${ranking}. ${title}`,
        },
        tooltip,
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Year',
            },
            gridLine: {
                enabled: false,
            },
            nice: false,
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'IMDb Rating →',
            },
            gridLine: {
                enabled: false,
            },
        },
    ],

    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
