import { AgCartesianChartOptions, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import type { DatumType } from './data';
import { getData } from './data';

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'category', yKey: 'apples', yName: 'Apples', id: 'apples' },
        { type: 'bar', xKey: 'category', yKey: 'oranges', yName: 'Oranges', id: 'oranges' },
        { type: 'bar', xKey: 'category', yKey: 'pears', yName: 'Pears', id: 'pears' },
    ],
    theme: {
        overrides: {
            bar: {
                series: {
                    itemStyler: ({ yKey, datum, fill }) => (datum.marked[yKey] ? { fill: 'red' } : { fill }),
                },
            },
        },
    },
    contextMenu: {
        getItems: (params) => {
            if (params.showOn === 'legend-item') {
                return [
                    'download',
                    'separator',
                    // Custom implementation of 'toggle-series-visibility':
                    {
                        type: 'action',
                        showOn: 'legend-item',
                        label: params.visible ? `Hide ${params.text}` : `Show ${params.text}`,
                        action: () => updateVisibility(params.seriesId, !params.visible),
                    },
                    'toggle-other-series',
                ];
            }
        },
    },
};

const chart = AgCharts.create(options);

function updateVisibility(seriesId: string, visible: boolean) {
    for (const series of options.series!) {
        if (series.id === seriesId) {
            series.visible = visible;
        }
    }
    chart.updateDelta(options);
}
