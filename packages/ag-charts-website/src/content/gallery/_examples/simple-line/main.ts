import {
    AgCartesianSeriesTooltipRendererParams,
    AgEnterpriseCharts,
    AgChartOptions,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';
import { getData } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US');
const tooltip = {
    renderer: ({ title, xValue, yValue }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
        title,
        content: `${dateFormatter.format(xValue)}: ${yValue}`,
    }),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlightStyle: {
                        series: {
                            strokeWidth: 3,
                            dimOpacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    title: {
        text: 'Road fuel prices',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
            marker: {
                stroke: '#01c185',
                fill: '#01c185',
            },
            tooltip,
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            stroke: '#000000',
            marker: {
                stroke: '#000000',
                fill: '#000000',
            },
            tooltip,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            title: {
                text: 'Date',
            },
            label: {
                format: '%b',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price in pence',
            },
            label: {
                autoRotate: true,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
