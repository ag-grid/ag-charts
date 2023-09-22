import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Imported Banana Prices',
    },
    footnote: {
        text: 'Source: Department for Environment, Food and Rural Affairs',
    },
    series: [
        {
            type: 'line',
            xKey: 'week',
            yKey: 'belize',
            yName: 'Belize',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'cameroon',
            yName: 'Cameroon',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'columbia',
            yName: 'Columbia',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'costaRica',
            yName: 'Costa Rica',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'dominicanRepublic',
            yName: 'Dominican Republic',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ecuador',
            yName: 'Ecuador',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ghana',
            yName: 'Ghana',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'honduras',
            yName: 'Honduras',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ivoryCoast',
            yName: 'Ivory Coast',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'jamaica',
            yName: 'Jamaica',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'mexico',
            yName: 'Mexico',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'panama',
            yName: 'Panama',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'windwardIsles',
            yName: 'Windward Isles',
            marker: {
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'guatemala',
            yName: 'Guatemala',
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'nicaragua',
            yName: 'Nicaragua',
            marker: {
                fill: '#ffffff',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'brazil',
            yName: 'Brazil',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week',
            },
            label: {
                formatter: (params) => (params.index % 3 ? '' : params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: '£ per kg',
            },
            nice: false,
            min: 0.2,
            max: 1,
        },
    ],
};

AgEnterpriseCharts.create(options);
