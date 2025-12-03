// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
                        itemStyler({ highlightState }) {
                            const isHighlighted = highlightState === 'highlighted-item';
                            return {
                                size: isHighlighted ? 15 : 25,
                                shape: isHighlighted ? 'star' : 'circle',
                                fillOpacity: isHighlighted ? 0.5 : 1,
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
