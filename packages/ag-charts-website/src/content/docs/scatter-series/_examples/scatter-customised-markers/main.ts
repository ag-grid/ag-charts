import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight } from './height-weight-data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by Gender',
    },
    series: [
        {
            type: 'scatter',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            shape: 'square',
            fill: '#e36f6ab5',
            stroke: '#9f4e4a',
        },
        {
            type: 'scatter',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            fill: '#7b91deb5',
            stroke: '#56659b',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Height',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'cm';
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Weight',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    ],
};

AgCharts.create(options);
