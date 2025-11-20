import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(double click a column for details)',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'units',
            listeners: {
                seriesNodeDoubleClick: ({ datum }) => {
                    console.log(
                        'Cars sold in ' +
                            datum.month +
                            ': ' +
                            String(datum.units) +
                            '\n' +
                            listUnitsSoldByBrand(datum['brands'])
                    );
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);

function listUnitsSoldByBrand(brands: Record<string, number>) {
    var result = '';
    for (var key in brands) {
        result += key + ': ' + brands[key] + '\n';
    }
    return result;
}
