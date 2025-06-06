import { AgChartOptions, AgCharts } from 'ag-charts-community';

interface DataType {
    month: string;
    units: number;
    brands: {
        [key: string]: number;
    };
}

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
                seriesNodeClick: (event: any) => console.log(makeMessage('[click]', event, event.datum)),
                seriesNodeDoubleClick: (event: any) => console.log(makeMessage('[double click]', event, event.datum)),
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

function makeMessage(header: string, event: any, datum: DataType) {
    const brands = datum.brands;
    const buffer: string[] = [header, '\nCars sold in ', datum[event.xKey], ': ', String(datum[event.yKey]), '\n'];
    for (var key in brands) {
        buffer.push(key, ': ', String(brands[key]), '\n');
    }
    return buffer.join('');
}
