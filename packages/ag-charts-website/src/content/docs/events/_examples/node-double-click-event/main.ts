import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(double click a column for details)',
    },
    data: [
        { month: 'March', units: 25, brands: { BMW: 10, Toyota: 15 } },
        { month: 'April', units: 27, brands: { Ford: 17, BMW: 10 } },
        { month: 'May', units: 42, brands: { Nissan: 20, Toyota: 22 } },
    ],
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
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

const chart = AgCharts.create(options);

function listUnitsSoldByBrand(brands: Record<string, number>) {
    var result = '';
    for (var key in brands) {
        result += key + ': ' + brands[key] + '\n';
    }
    return result;
}
