import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'GDP Growth (1995–2024)' },
    subtitle: { text: 'Trillions USD' },
    contextMenu: {
        items: [
            'download',
            {
                showOn: 'series-area',
                label: 'Zoom Controls',
                items: ['zoom-to-cursor', 'pan-to-cursor'],
            },
            {
                showOn: 'legend-item',
                label: 'Legend Controls',
                items: ['toggle-series-visibility', 'toggle-other-series'],
            },
            'separator',
            {
                label: 'Debug Console',
                items: [
                    {
                        showOn: 'always',
                        label: `On 'always'`,
                        action: (param) => console.log('always:', JSON.stringify(param)),
                    },
                    {
                        showOn: 'series-area',
                        label: `On 'series-area'`,
                        action: (param) => console.log('series-area:', JSON.stringify(param)),
                    },
                    {
                        showOn: 'series-node',
                        label: `On 'series-node'`,
                        action: (param) => console.log('series-node:', JSON.stringify(param)),
                    },
                    {
                        showOn: 'legend-item',
                        label: `On 'legend-item'`,
                        action: (param) => console.log('legend-item:', JSON.stringify(param)),
                    },
                ],
            },
        ],
    },
    data: getData(),
    legend: { position: 'left' },
    zoom: { enabled: true },
    series: [
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'USA' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'EU' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'China' },
        { type: 'line', marker: { size: 14 }, tooltip: { range: 'exact' }, xKey: 'year', yKey: 'India' },
    ],
    axes: [
        { type: 'number', position: 'left', title: { text: 'GDP (Trillions USD)' } },
        { type: 'category', position: 'bottom', title: { text: 'Year' } },
    ],
};

AgCharts.create(options);
