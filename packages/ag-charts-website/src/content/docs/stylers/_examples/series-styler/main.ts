import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Revenue & Growth vs Benchmark' },
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    styler: (params) => {
                        if (params.yKey.includes('benchmark')) {
                            return { fill: 'lightgray' };
                        }
                        return { fill: '#5090DC' };
                    },
                },
            },
            line: {
                series: {
                    marker: { enabled: false },
                    strokeWidth: 4,
                    styler: (params) => {
                        if (params.yKey.includes('benchmark')) {
                            return { stroke: 'lightgray' };
                        }
                        return { stroke: '#5090DC' };
                    },
                },
            },
        },
    },
    series: [
        { type: 'bar', xKey: 'year', yKey: 'revenue', yName: 'Revenue' },
        { type: 'bar', xKey: 'year', yKey: 'revenue_benchmark', yName: 'Revenue Benchmark' },

        { type: 'line', xKey: 'year', yKey: 'growth', yName: 'Growth', yKeyAxis: 'ySecondary' },
        { type: 'line', xKey: 'year', yKey: 'growth_benchmark', yName: 'Growth Benchmark', yKeyAxis: 'ySecondary' },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Revenue (M)' },
            max: 500,
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: { text: 'Growth Rate (%)' },
            nice: false,
            max: 0.5,
            min: -0.5,
            label: { formatter: ({ value }) => `${(value * 100).toFixed(0)}%` },
        },
    },
};

AgCharts.create(options);
