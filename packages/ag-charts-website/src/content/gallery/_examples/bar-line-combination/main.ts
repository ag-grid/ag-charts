import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Cattle Holdings and Beef Exports (UK)',
    },
    footnote: {
        text: 'Source: Department for Environment, Food & Rural Affairs; Agriculture and Horticulture Development Board',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'male',
            yName: 'Male cattle',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'female',
            yName: 'Female cattle',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'exportedTonnes',
            yName: 'Beef exports',
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
            keys: ['male', 'female'],
            title: {
                text: 'Number of cattle',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'M';
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['exportedTonnes'],
            title: {
                text: 'Exports (tonnes)',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

AgCharts.create(options);
