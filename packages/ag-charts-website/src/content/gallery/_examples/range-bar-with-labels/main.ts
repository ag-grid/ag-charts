import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data: any[] = getData();

const options: AgCartesianChartOptions = {
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
                    fillOpacity: getOpacity(datum[yHighKey], yHighKey, 0.4, 1),
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

function getOpacity(value: number, key: string, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: string) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

AgCharts.create(options);
