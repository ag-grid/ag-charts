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
            stroke: '#999',
            strokeOpacity: 0.75,
            strokeWidth: 3,
        },
        cornerRadius: 8,
        padding: 0,
    },
    legend: {
        position: { placement: 'top-right', floating: true, xOffset: -20, yOffset: 15 },
        fill: '#999',
        fillOpacity: 0.15,
        border: {
            enabled: true,
            stroke: '#999',
            strokeOpacity: 0.5,
        },
        padding: 10,
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
                padding: { top: 4, right: 6, bottom: 0, left: 6 },
                border: {
                    enabled: true,
                    stroke: '#2c79d5',
                    strokeWidth: 1,
                },
                color: '#333',
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
                padding: { top: 4, right: 6, bottom: 0, left: 6 },
                border: {
                    enabled: true,
                    stroke: '#ea7e04',
                    strokeWidth: 1,
                },
                color: '#333',
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
                fill: '#999',
                fillOpacity: 0.2,
                cornerRadius: 16,
                padding: { top: 6, right: 8, bottom: 2, left: 8 },
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
                fill: '#999',
                fillOpacity: 0.2,
                cornerRadius: 16,
                padding: { top: 6, right: 8, bottom: 4, left: 8 },
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    ],
};

AgCharts.create(options);
