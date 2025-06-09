import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Salary Ranges By Department',
    },
    subtitle: {
        text: 'Low and High Salary Brackets Across Various Departments',
    },
    series: [
        {
            type: 'range-bar',
            yName: 'Salary Range',
            xKey: 'department',
            xName: 'Department',
            yLowKey: 'low',
            yLowName: 'Low',
            yHighKey: 'high',
            yHighName: 'High',
            cornerRadius: 5,
            itemStyler: ({ datum, yHighKey }) => {
                return {
                    fillOpacity: getOpacity(datum, yHighKey, 0.4, 1),
                };
            },
            label: {
                placement: 'outside',
                color: 'rgb(118,118,118)',
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0.5,
        },
        {
            type: 'number',
            position: 'right',
            gridLine: {
                style: [
                    {
                        stroke: 'rgb(216,216,216)',
                        lineDash: [2, 2],
                    },
                ],
            },
        },
    ],
    seriesArea: {
        padding: {
            right: 25,
        },
    },
    formatter: {
        y: (params) =>
            (params.value as number).toLocaleString('en-GB', {
                style: 'currency',
                currency: 'GBP',
                notation: 'compact',
                compactDisplay: 'short',
            }),
    },
};

function getOpacity(datum: DataType, key: keyof DataType, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    const value = Number(datum[key]);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: keyof DataType) {
    const min = Math.min(...data.map((d) => Number(d[key])));
    const max = Math.max(...data.map((d) => Number(d[key])));
    return [min, max];
}

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

AgCharts.create(options);
