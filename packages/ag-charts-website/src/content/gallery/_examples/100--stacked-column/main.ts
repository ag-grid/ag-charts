import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Ethnic Diversity of School Pupils',
    },
    footnote: {
        text: 'Source: Department for Education',
    },
    series: [
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'white',
            yName: 'White',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'mixed',
            yName: 'Mixed',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'asian',
            yName: 'Asian',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'black',
            yName: 'Black',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'chinese',
            yName: 'Chinese',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'type',
            yKey: 'other',
            yName: 'Other',
            normalizedTo: 100,
            stacked: true,
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
            label: {
                format: '#{.0f}%',
            },
        },
    ],
};

AgCharts.create(options);
