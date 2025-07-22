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
                cornerRadius: 2,
                color: '#333333',
                fill: '#f6f6f6',
                padding: { top: 4, right: 6, bottom: 2, left: 6 },
                border: {
                    stroke: '#dddddd',
                    strokeWidth: 1,
                },
                itemStyler: (params) => {
                    if (params.datum.name !== 'Donovan') return;
                    return {
                        color: 'white',
                        fontWeight: 'bold',
                        fill: '#5090dc',
                        border: {
                            stroke: '#2b5c95',
                        },
                    };
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
                cornerRadius: 2,
                color: '#333333',
                fill: '#f6f6f6',
                padding: { top: 4, right: 6, bottom: 2, left: 6 },
                border: {
                    stroke: '#dddddd',
                    strokeWidth: 1,
                },
                itemStyler: (params) => {
                    if (params.datum.name !== 'Luna') return;
                    return {
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fill: '#ffa03a',
                        border: {
                            stroke: '#cc6f10',
                        },
                    };
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
