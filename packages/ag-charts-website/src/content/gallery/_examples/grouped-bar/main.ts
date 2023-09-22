import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Annual Growth in Pay',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'total',
            yName: 'Annual growth in total pay',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'regular',
            yName: 'Annual growth in regular pay',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: '%',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
