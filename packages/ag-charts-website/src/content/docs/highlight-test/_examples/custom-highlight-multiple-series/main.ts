// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Custom Highlight Multiple Series',
    },
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 4,
                            fillOpacity: 0.8,
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
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
    ],
};

AgCharts.create(options);
