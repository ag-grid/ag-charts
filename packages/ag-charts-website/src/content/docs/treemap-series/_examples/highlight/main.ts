import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { salesPerformance } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: salesPerformance,
    title: {
        text: 'Sales Highlighting',
    },
    subtitle: {
        text: 'Branch-aware highlight states',
    },
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'value',
            group: {
                highlight: {
                    highlightedItem: { stroke: 'lightgreen', strokeWidth: 4 },
                    unhighlightedItem: { opacity: 0.1 },
                },
            },
            tile: {
                highlight: {
                    highlightedItem: { stroke: 'green' },
                    highlightedBranch: { strokeWidth: 2 },
                    unhighlightedBranch: { fill: 'grey' },
                },
            },
        },
    ],
};

AgCharts.create(options);
