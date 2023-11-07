import { AgChartOptions, AgEnterpriseCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip = {
    renderer: ({ title, datum, xKey, yKey, xName, yName }: AgLineSeriesTooltipRendererParams) => ({
        title,
        content: `${xName} ${datum[xKey].toFixed(0)}: ${Math.floor(datum[yKey] / 60)}h ${Math.round(
            datum[yKey] % 60
        )}m`,
    }),
};

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
            tooltip,
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFriends',
            yName: 'With Friends',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithChildren',
            yName: 'With Children',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithFamily',
            yName: 'With Family',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithPartner',
            yName: 'With Partner',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'age',
            xName: 'Age',
            yKey: 'timeSpentWithCoworkers',
            yName: 'With Coworkers',
            tooltip,
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
        },
    ],
};

AgEnterpriseCharts.create(options);
