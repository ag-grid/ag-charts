import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight } from './data';

type DataType = { height: number; weight: number; age: number; name: string };

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by gender',
    },
    seriesArea: {
        border: {
            stroke: '#333333',
        },
        cornerRadius: 4,
        padding: 0,
    },
    legend: {
        position: { placement: 'top-right', floating: true, xOffset: -20, yOffset: 15 },
        fill: '#f6f6f6',
        border: {
            stroke: '#dddddd',
        },
        padding: 10,
        item: {
            label: {
                color: '#333333',
            },
        },
    },
    series: [
        {
            type: 'bubble',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            labelName: 'Name',
            label: {
                cornerRadius: 4,
                fill: '#badaff',
                padding: { top: 4, right: 6, bottom: 2, left: 6 },
                border: {
                    stroke: '#73A6E3',
                    strokeWidth: 2,
                },
            },
        },
        {
            type: 'bubble',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            labelName: 'Name',
            label: {
                cornerRadius: 4,
                fill: '#fcc992',
                padding: { top: 4, right: 6, bottom: 2, left: 6 },
                border: {
                    stroke: '#FCA441',
                    strokeWidth: 2,
                },
            },
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
                color: '#333333',
                fill: '#e0e0e0',
                cornerRadius: 16,
                padding: { top: 4, right: 6, bottom: 2, left: 6 },
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
                color: '#333333',
                fill: '#e0e0e0',
                cornerRadius: 16,
                padding: { top: 4, right: 6, bottom: 4, left: 6 },
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    ],
};

AgCharts.create(options);
