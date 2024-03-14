import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatDate = (value: number | Date | undefined) => {
    return Intl.DateTimeFormat('en-GB').format(value);
};

const formatNumber = (value: number) => {
    return `$${Math.floor(value)}B`;
};

const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const date = formatDate(datum[xKey]);
        return {
            content: `${date}: ${formatNumber(datum[yKey])}`,
        };
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Streaming Music Sales',
    },
    subtitle: {
        text: 'IN BILLIONS USD',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'sales',
            yName: 'Sales',
            tooltip,
            label: {
                enabled: true,
                formatter: ({ xKey, yKey, datum }) => {
                    const dates = [
                        formatDate(new Date(2008, 9, 11)),
                        formatDate(new Date(2012, 9, 26)),
                        formatDate(new Date(2017, 0, 8)),
                        formatDate(new Date(2020, 10, 25)),
                        formatDate(new Date(2023, 0, 1)),
                    ];
                    return dates.includes(formatDate(datum[xKey])) ? formatNumber(datum[yKey]) : '';
                },
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                values: [new Date(2009, 0, 1), new Date(2013, 0, 1), new Date(2017, 0, 1), new Date(2021, 0, 1)],
            },
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${formatDate(value)}</div>`,
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => formatNumber(value),
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
