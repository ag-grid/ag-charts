import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function getColor(params: { yKey: string }): string | undefined {
    if (params.yKey.includes('AcmeCorp')) return 'skyblue';
    if (params.yKey.includes('BetaTech')) return 'seagreen';
    if (params.yKey.includes('CypherSoft')) return 'lightgray';
    return undefined;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Company Revenue and Growth Rate' },
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    styler: (params) => {
                        return { fill: getColor(params) };
                    },
                },
            },
            line: {
                series: {
                    styler: (params) => {
                        const color = getColor(params);
                        return { stroke: color, marker: { fill: color } };
                    },
                },
            },
        },
    },
    series: [
        // Revenue bars
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'AcmeCorp_revenue',
            yName: 'AcmeCorp Revenue',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'BetaTech_revenue',
            yName: 'BetaTech Revenue',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'CypherSoft_revenue',
            yName: 'CypherSoft Revenue',
        },

        // Growth rate lines
        {
            type: 'line',
            xKey: 'year',
            yKey: 'AcmeCorp_growth',
            yName: 'AcmeCorp Growth',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'BetaTech_growth',
            yName: 'BetaTech Growth',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'CypherSoft_growth',
            yName: 'CypherSoft Growth',
        },
    ],
    axes: [
        { type: 'category', position: 'bottom' },
        {
            type: 'number',
            position: 'left',
            title: { text: 'Revenue (M)' },
            max: 500,
            keys: ['AcmeCorp_revenue', 'BetaTech_revenue', 'CypherSoft_revenue'],
        },
        {
            type: 'number',
            position: 'right',
            title: { text: 'Growth Rate (%)' },
            nice: false,
            max: 0.5,
            min: -0.5,
            keys: ['AcmeCorp_growth', 'BetaTech_growth', 'CypherSoft_growth'],
            label: { formatter: ({ value }) => `${(value * 100).toFixed(0)}%` },
        },
    ],
};

AgCharts.create(options);
