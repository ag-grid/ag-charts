import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';

import { getData } from './data';

const timeDurationFormatter = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
};

const options = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    interpolation: { type: 'smooth' },
                    marker: {
                        enabled: false,
                    },
                    tooltip: {
                        renderer: ({ datum, yKey, yName, xKey }) => {
                            return {
                                heading: `${datum[xKey]} years`,
                                data: [{ label: yName, value: timeDurationFormatter(datum[yKey]) }],
                            };
                        },
                    },
                },
            },
        },
    },
    series: [
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
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
        y: {
            position: 'left',
            type: 'number',
            label: {
                enabled: false,
            },
            nice: false,
            interval: { values: [0, 180, 360, 540] },
            gridLine: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
    },
    tooltip: {
        mode: 'shared',
    },
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
