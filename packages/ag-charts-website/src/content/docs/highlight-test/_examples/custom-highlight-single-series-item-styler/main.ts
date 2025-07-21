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
                    marker: {
                        itemStyler({ highlighted }) {
                            return {
                                size: highlighted ? 15 : 25,
                                shape: highlighted ? 'star' : 'circle',
                                fillOpacity: highlighted ? 0.5 : 1,
                            };
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
    ],
};

AgCharts.create(options);
