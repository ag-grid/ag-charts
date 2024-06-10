import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        palette: {
            fills: ['#3d7ab0', '#b03d65', '#80b03d'],
            strokes: ['#3d7ab0', '#b03d65', '#80b03d'],
        },
        overrides: {
            line: { series: { strokeWidth: 5, marker: { enabled: false } } },
        },
    },
    background: {
        fill: '#ecf2f9',
    },
    padding: {
        top: 10,
        bottom: 30,
        left: 10,
        right: 10,
    },
    title: {
        text: 'Marriage Statistics (Northern Ireland)',
        fontFamily: 'Georgia, Times New Roman, Times, Serif',
        fontSize: 22,
        color: '#162c53',
        spacing: 25,
    },
    footnote: {
        text: 'Source: Northern Ireland Statistics and Research Agency',
        fontSize: 10,
        color: '#3f7cbf',
        fontStyle: 'italic',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'marriages',
            yName: 'Marriages',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'civilPartnerships',
            yName: 'Civil partnerships',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'divorces',
            yName: 'Divorces',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'top',
            interval: { step: time.year.every(10) },
            tick: {
                width: 3,
                stroke: '#3f7cbf',
            },
            nice: false,
            label: {
                rotation: -30,
                color: '#3f7cbf',
                fontWeight: 'bold',
                fontSize: 14,
                fontFamily: 'Impact, Charcoal, Sans-Serif',
            },
            line: {
                stroke: '#3f7cbf',
            },
            gridLine: {
                style: [
                    { stroke: '#c1d832', lineDash: [6, 3] },
                    { stroke: '#162c53', lineDash: [10, 5] },
                ],
            },
        },
        {
            type: 'number',
            position: 'right',
            tick: {
                size: 10,
            },
            nice: false,
            label: {
                color: '#3f7cbf',
                fontWeight: 'bold',
                fontSize: 14,
                fontFamily: 'Impact, Charcoal, Sans-Serif',
            },
            title: {
                enabled: true,
                text: 'Total number',
                color: '#162c53',
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontSize: 16,
                fontFamily: 'Georgia, Times New Roman, Times, Serif',
            },
            line: {
                stroke: '#326baf',
            },
        },
    ],
    legend: {
        item: {
            marker: {
                strokeWidth: 0,
                padding: 10,
                shape: 'diamond',
                size: 20,
            },
            paddingX: 40,
            label: {
                fontWeight: 600,
                color: '#3f7cbf',
                fontSize: 14,
                fontFamily: 'Georgia, Times New Roman, Times, Serif',
            },
        },
        spacing: 10,
    },
};

AgCharts.create(options);
