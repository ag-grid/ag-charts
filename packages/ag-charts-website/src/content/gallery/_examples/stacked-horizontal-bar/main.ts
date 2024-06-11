import { AgBarSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data: any[] = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            bar: {
                series: {
                    stroke: 'transparent',
                    strokeWidth: 2,
                    cornerRadius: 6,
                    label: {
                        enabled: true,
                        formatter: ({ value }) => `${Math.abs(value)}`,
                    },
                    formatter: ({ datum, yKey }) => ({
                        fillOpacity: getOpacity(Math.abs(datum[yKey]), yKey, 0.4, 1),
                    }),
                    tooltip: {
                        renderer: ({ datum, xKey, yKey }: AgBarSeriesTooltipRendererParams) => ({
                            content: `${datum[xKey]}: ${Math.abs(datum[yKey])}`,
                        }),
                    },
                },
            },
        },
    },
    title: {
        text: 'All Games',
        spacing: 30,
    },
    footnote: {
        text: 'Number of Games Won and Lost by Year',
    },
    data,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'crWon',
            yName: 'Cristiano Ronaldo - Games Won',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'lmWon',
            yName: 'Lionel Messi - Games Won',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'kbWon',
            yName: 'Karim Benzema - Games Won',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'crLost',
            yName: 'Cristiano Ronaldo - Games Lost',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'lmLost',
            yName: 'Lionel Messi - Games Lost',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'kbLost',
            yName: 'Karim Benzema - Games Lost',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            interval: { values: [2013, 2023] },
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            min: -40,
            max: 60,
            interval: { values: [0] },
            label: {
                enabled: false,
            },
            tick: {
                size: 0,
            },
            gridLine: {
                width: 2,
            },
            crossLines: [
                {
                    type: 'range',
                    range: [0, -30],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'L O S S E S',
                        position: 'top',
                    },
                },
                {
                    type: 'range',
                    range: [0, 50],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'W I N S',
                        position: 'top',
                    },
                },
            ],
        },
    ],
    legend: {
        enabled: false,
    },
};

function getOpacity(value: number, key: string, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: string) {
    const min = Math.min(...data.map((d) => Math.abs(d[key])));
    const max = Math.max(...data.map((d) => Math.abs(d[key])));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

AgCharts.create(options);
