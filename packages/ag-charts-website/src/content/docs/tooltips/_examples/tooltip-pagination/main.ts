import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { BubbleSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Most Populous Cities',
    },
    footnote: {
        text: 'Source: Simple Maps',
    },
    series: [
        {
            type: 'bubble',
            title: 'Most populous cities',
            xKey: 'lon',
            xName: 'Longitude',
            yKey: 'lat',
            yName: 'Latitude',
            sizeKey: 'population',
            sizeName: 'Population',
            labelKey: 'city',
            labelName: 'City',
            maxSize: 50,
            tooltip: {
                renderer: ({ datum }) => ({ title: datum.city }),
            },
        },
    ],
    tooltip: {
        pagination: true,
    },
};

AgCharts.create(options);
