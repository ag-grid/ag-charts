// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Custom Highlight Multiple Series Markers',
    },
    animation: {
        enabled: true,
    },
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedItem: {
                            fillOpacity: 0.8,
                        },
                        highlightedSeries: {
                            strokeWidth: 4,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            yName: 'Petrol',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            yName: 'Diesel',
        },
    ],
};

AgCharts.create(options);
