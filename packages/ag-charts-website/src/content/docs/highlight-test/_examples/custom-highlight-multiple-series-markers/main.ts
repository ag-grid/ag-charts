// @ag-skip-fws
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Default Highlight Multiple Series Markers',
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
