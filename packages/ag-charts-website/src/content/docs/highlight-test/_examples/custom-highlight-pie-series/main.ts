// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Custom Highlight Pie Series',
    },
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
            calloutLabelKey: 'asset',
            sectorLabelKey: 'amount',
            sectorLabel: {
                color: 'black',
                fontWeight: 'bold',
                formatter: ({ value }) => `$${(value / 1000).toFixed(0)}K`,
            },
            fillOpacity: 0.4,
            strokeWidth: 2,
            highlight: {
                highlightedItem: {
                    fillOpacity: 0.4,
                },
            },
        },
    ],
};

AgCharts.create(options);
