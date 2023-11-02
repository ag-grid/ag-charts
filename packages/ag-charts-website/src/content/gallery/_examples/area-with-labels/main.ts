import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatDate = (value:  number | Date | undefined) => {
    return Intl.DateTimeFormat('en-GB').format(value);
};
const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const date = formatDate(datum[xKey]);
        return {
            content: `${date}: $${Math.round(datum[yKey])}B`,
        };
    },
};

const options: AgChartOptions =  {
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
                    return dates.includes(formatDate(datum[xKey])) ? `$${Math.round(datum[yKey])}B` : '';
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
                values: [
                    new Date(2009, 0, 1),
                    new Date(2013, 0, 1),
                    new Date(2017, 0, 1),
                    new Date(2021, 0, 1),
                ],
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => `$${value}B`,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
