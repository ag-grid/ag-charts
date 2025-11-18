import AgCharts from 'ag-charts-community';
import type { AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Annual Attendees by Gender' },
    data: [
        { year: '2021', women: 25, men: 20 },
        { year: '2022', women: 28, men: 22 },
        { year: '2023', women: 32, men: 24 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
        },
    ],
};

AgCharts.create(options);
