import { BubbleSeriesModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
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
        size: 20,
        maxSize: 60,
        domain: [2000000, 1200000000],
        label: {
            formatter: ({ datum }) => `${datum.ranking}. ${datum.title}`,
        },
    })),
    axes: {
        x: {
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
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'IMDb Rating →',
            },
            gridLine: {
                enabled: false,
            },
        },
    },
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
