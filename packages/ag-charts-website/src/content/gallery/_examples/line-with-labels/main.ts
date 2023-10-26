import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgEnterpriseCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${hours > 0 ? hours + 'h' : ''} ${minutes + 'm'}`;
};


const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Eating Hours In A Day',
    },
    subtitle: {
        text: 'Hours spent per day eating and drinking by age group',
    },
    footnote: {
        text: 'Source: American Time Use Survey (2012-2022)',
    },
    series: Object.entries(getData()).map(([ageGroup, data]) => ({
        data,
        type: 'line',
        xKey: 'year',
        yKey: 'estimate',
        yName: ageGroup,
        label: {
            enabled: true,
            formatter:({ value }) => `${Math.floor(value) * 60 + Math.round((value % 1) * 60)}m`
        },
        marker: {
            size: 10
        }
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            tick: {
                enabled: false
            },
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false
             },
            nice: false,
            min: 2011.5,
            max: 2022.5,

        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Time',
            },
            gridLine: {
               enabled: false
            },
            tick: {
                size: 20,
                interval: 0.5,
            },
            line: {
                width: 1,
            },
            label: {
                formatter: ({ value }) => formatTime(value),
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0.75,
                    strokeOpacity: 0.5,
                    lineDash: [6, 4],
                    label: {
                        text: '>Year',
                        fontSize: 13,
                        padding: 0,
                        position: 'right'
                    }
                }
             ]
        },
    ],
    seriesArea: {
        padding: {
            left: 10,
            bottom: 10
        }
    },
};

AgEnterpriseCharts.create(options);
