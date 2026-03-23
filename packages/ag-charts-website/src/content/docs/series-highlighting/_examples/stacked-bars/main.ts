import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Station Entries',
    },
    subtitle: {
        text: 'Victoria Line (2023)',
    },
    series: [
        { type: 'bar', xKey: 'station', yKey: 'early', yName: 'Early', stacked: true, normalizedTo: 100 },
        { type: 'bar', xKey: 'station', yKey: 'morningPeak', yName: 'Morning Peak', stacked: true, normalizedTo: 100 },
        { type: 'bar', xKey: 'station', yKey: 'interPeak', yName: 'Inter-peak', stacked: true, normalizedTo: 100 },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon Peak',
            stacked: true,
            normalizedTo: 100,
        },
        { type: 'bar', xKey: 'station', yKey: 'evening', yName: 'Evening', stacked: true, normalizedTo: 100 },
    ],
};

AgCharts.create(options);
