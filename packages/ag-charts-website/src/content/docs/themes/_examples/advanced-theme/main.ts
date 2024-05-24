import { AgChartOptions, AgChartTheme, AgCharts } from 'ag-charts-community';

import { getData } from './data';

var myTheme: AgChartTheme = {
    baseTheme: 'ag-default',
    palette: {
        fills: ['#5C2983', '#0076C5', '#21B372', '#FDDE02', '#F76700', '#D30018'],
        strokes: ['gray'],
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
                        color: 'gray',
                    },
                    tick: {
                        color: 'gray',
                    },
                },
                number: {
                    line: {
                        color: 'gray',
                    },
                    tick: {
                        color: 'gray',
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
                    colors: ['gray'],
                },
            },
        },
    },
};

var options: AgChartOptions = {
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

const chart = AgCharts.create(options);

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
