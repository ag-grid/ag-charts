import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, BandHighlightModule, ContextMenuModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const timeDurationFormatter = (time: number) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
};

const options: AgChartOptions<DataType> = {
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
                                data: [{ label: yName!, value: timeDurationFormatter(datum[yKey]) }],
                            };
                        },
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
        fontStyle: 'italic',
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
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Age (years)',
            },
            bandHighlight: {
                enabled: true,
            },
            label: {
                minSpacing: 30,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                ],
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Time Spent (hours)',
            },
            max: 540,
            nice: false,
            interval: { values: [0, 180, 360, 540] },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
    formatter: {
        y: (params) => {
            const value = params.value as number;
            if (params.source === 'axis-label') {
                return `${Math.floor(value / 60)}h`;
            }
            return timeDurationFormatter(value);
        },
    },
    tooltip: {
        mode: 'shared',
    },
};

AgCharts.create(options);
