import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
type Key = keyof Omit<(typeof data)[number], 'department'>;

const options: AgChartOptions = {
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
            xKey: 'department',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            formatter: ({ datum, yHighKey }) => {
                return {
                    fillOpacity: getOpacity(datum[0][yHighKey], yHighKey as Key, 0.4, 1),
                };
            },
            label: {
                placement: 'outside',
                color: 'rgb(118,118,118)',
                formatter: ({ value }) => `£${value / 1000}K`,
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
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
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
};

function getOpacity(value: number, key: Key, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: Key) {
    const min = Math.min(...data.map((d) => d[key]));
    const max = Math.max(...data.map((d) => d[key]));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

AgEnterpriseCharts.create(options);
