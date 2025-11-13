import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { energyMix } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: energyMix,
    title: {
        text: 'Sunburst Highlight States',
    },
    subtitle: {
        text: 'Branch-sensitive styling',
    },
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'value',
            highlight: {
                highlightedItem: { stroke: 'green' },
                highlightedBranch: { strokeWidth: 2 },
                unhighlightedItem: { opacity: 0.5 },
                unhighlightedBranch: { opacity: 0.1 },
            },
        },
    ],
};

AgCharts.create(options);
