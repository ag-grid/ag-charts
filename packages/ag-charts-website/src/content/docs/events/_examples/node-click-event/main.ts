import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(click a column for details)',
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
                seriesNodeClick: (event) => console.log(makeMessage('[click]', event.datum)),
                seriesNodeDoubleClick: (event) => console.log(makeMessage('[double click]', event.datum)),
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

function makeMessage(header: string, datum: DataType) {
    const { brands, month, units } = datum;
    const buffer: string[] = [header, '\nCars sold in ', month, ': ', String(units), '\n'];
    for (const key in brands) {
        buffer.push(key, ': ', String(brands[key]), '\n');
    }
    return buffer.join('');
}
