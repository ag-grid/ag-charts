import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        palette: {
            fills: ['#330066', '#99CCFF'],
            strokes: ['#330066', '#99CCFF'],
        },
        overrides: {
            bar: {
                legend: {
                    position: 'bottom',
                },
                axes: {
                    category: {
                        crossLines: {
                            fill: '#DFDFDF',
                            strokeWidth: 0,
                        },
                        gridLine: {
                            style: [],
                        },
                    },
                    number: {
                        tick: {},
                    },
                },
                series: {
                    highlightStyle: {
                        item: {
                            fill: 'rgb(40,40,40)',
                            strokeWidth: 0,
                        },
                        series: {
                            dimOpacity: 0.3,
                        },
                    },
                },
            },
        },
    },
    title: {
        text: 'Changes in Prison Population',
        fontSize: 18,
        spacing: 25,
    },
    footnote: {
        text: 'Source: Ministry of Justice, HM Prison Service, and Her Majesty’s Prison and Probation Service',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'menDelta',
            yName: 'Male',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'womenDelta',
            yName: 'Female',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            crossLines: [
                {
                    type: 'range',
                    range: ['Jan', 'Mar'],
                    fillOpacity: 0.3,
                    label: {
                        text: 'Q1',
                        position: 'insideTop',
                    },
                },
                {
                    type: 'range',
                    range: ['Apr', 'Jun'],
                    fill: 'transparent',
                    label: {
                        text: 'Q2',
                        position: 'insideTop',
                    },
                },
                {
                    type: 'range',
                    range: ['Jul', 'Sep'],
                    fillOpacity: 0.3,
                    label: {
                        text: 'Q3',
                        position: 'insideTop',
                    },
                },
                {
                    type: 'range',
                    range: ['Oct', 'Dec'],
                    fill: 'transparent',
                    label: {
                        text: 'Q4',
                        position: 'insideTop',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            crossLines: [
                {
                    type: 'line',
                    value: -321,
                    fill: '#330066',
                    fillOpacity: 0.1,
                    stroke: '#330066',
                    strokeOpacity: 0.3,
                    lineDash: [10, 2],
                    label: {
                        text: 'Peak Male Release',
                        padding: 10,
                        position: 'bottomRight',
                    },
                },
                {
                    type: 'range',
                    range: [-90, 65],
                    fill: '#330066',
                    fillOpacity: 0.1,
                    stroke: '#330066',
                    strokeOpacity: 0.2,
                    strokeWidth: 0,
                    label: {
                        text: 'Female Range',
                        padding: 10,
                        position: 'insideTopRight',
                    },
                },
            ],
        },
    ],
};

const chart = AgCharts.create(options);
