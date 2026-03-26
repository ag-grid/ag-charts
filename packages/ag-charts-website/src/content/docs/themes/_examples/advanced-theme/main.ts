import { AgChartOptions, AgChartTheme, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    PieSeriesModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    PieSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
]);
const myTheme: AgChartTheme = {
    palette: {
        fills: ['#006f9b', '#ff7faa', '#00994d', '#ff8833', '#00a0dd'],
        strokes: ['#003f58', '#934962', '#004a25', '#914d1d', '#006288'],
    },
    params: {
        foregroundColor: '#262a33',
        backgroundColor: '#fff1e5',
        accentColor: '#0d7680',
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        tooltipBackgroundColor: '#fff7ef',
        tooltipTextColor: '#262a33',
    },
    overrides: {
        common: {
            title: {
                fontSize: 24,
            },
            padding: {
                left: 70,
                right: 70,
            },
            axes: {
                category: {
                    line: {
                        width: 4,
                    },
                },
                number: {
                    line: {
                        width: 2,
                    },
                },
            },
        },
        line: {
            series: {
                marker: {
                    shape: 'circle',
                },
            },
        },
        bar: {
            series: {
                label: {
                    enabled: true,
                    color: 'white',
                },
            },
        },
        pie: {
            padding: {
                top: 40,
                bottom: 40,
            },
            legend: {
                position: 'left',
            },
            series: {
                calloutLabel: {
                    enabled: true,
                },
                calloutLine: {
                    colors: ['#881008'],
                },
            },
        },
    },
};

const options: AgChartOptions = {
    theme: myTheme,
    container: document.getElementById('myChart'),
    title: {
        text: 'Multi-Type Chart Theme',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'label',
            yKey: 'v1',
            stacked: true,
            yName: 'Reliability',
        },
        {
            type: 'bar',
            xKey: 'label',
            yKey: 'v2',
            stacked: true,
            yName: 'Ease of use',
        },
        {
            type: 'bar',
            xKey: 'label',
            yKey: 'v3',
            stacked: true,
            yName: 'Performance',
        },
        {
            type: 'line',
            xKey: 'label',
            yKey: 'v4',
            yName: 'Price',
        },
    ],
};

const chart = AgCharts.create(options as AgChartOptions);

function applyOptions(type: 'bar' | 'pie') {
    if (type === 'pie') {
        options.series = [
            {
                type: 'pie',
                angleKey: 'v4',
                calloutLabelKey: 'label',
            },
        ];
    } else {
        const names = ['Reliability', 'Ease of use', 'Performance', 'Price'];
        options.series = [
            ...names.map((yName, idx) => ({
                type: idx <= 2 ? ('bar' as const) : ('line' as const),
                xKey: 'label',
                yKey: `v${idx + 1}`,
                stacked: idx <= 2,
                yName,
            })),
        ];
    }

    chart.update(options);
}
