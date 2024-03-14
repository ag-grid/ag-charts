import { AgChartOptions, AgCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

function formatNumber(value: number) {
    return `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    marker: {
                        size: 5,
                    },
                    tooltip: {
                        renderer: ({ title, datum, xKey, yKey, xName }: AgLineSeriesTooltipRendererParams) => ({
                            title,
                            content: `${xName} ${datum[xKey].toFixed(0)}: ${formatNumber(datum[yKey])}`,
                        }),
                    },
                },
            },
        },
    },
    title: {
        text: 'Time With Others On A Saturday',
    },
    subtitle: {
        text: 'Average hours spent per day socialising on the weekend',
    },
    footnote: {
        text: 'Source: American Time Use Survey 2022',
    },
    series: [
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentAlone',
            yName: 'Alone',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFriends',
            yName: 'With Friends',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithChildren',
            yName: 'With Children',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFamily',
            yName: 'With Family',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithPartner',
            yName: 'With Partner',
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithCoworkers',
            yName: 'With Coworkers',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Age',
            },
            nice: false,
            min: 15,
            max: 85,
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Time',
            },
            tick: {
                values: [0, 180, 360, 540],
            },
            label: {
                formatter: ({ value }) => `${Math.floor(value / 60)}h`,
            },
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${formatNumber(value)}</div>`,
                },
            },
        },
    ],
};

AgCharts.create(options);
