import { AgBarSeriesStyle, AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import type { DatumType } from './data';
import { getPersistentMutableData } from './data';

const markingStyle: AgBarSeriesStyle = {
    stroke: 'red',
    strokeWidth: 3,
};

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    data: getPersistentMutableData(),
    series: [
        { type: 'bar', xKey: 'category', yKey: 'apples', yName: 'Apples', id: 'apples' },
        { type: 'bar', xKey: 'category', yKey: 'oranges', yName: 'Oranges', id: 'oranges' },
        { type: 'bar', xKey: 'category', yKey: 'pears', yName: 'Pears', id: 'pears' },
    ],
    theme: {
        overrides: {
            bar: {
                series: {
                    itemStyler: ({ yKey, datum }) => (datum.marked[yKey] ? markingStyle : undefined),
                },
            },
        },
    },
    contextMenu: {
        getItems: (params) => {
            if (params.showOn === 'series-node') {
                const data = getPersistentMutableData();
                const pX = params.datum[params.xKey];
                const pY = params.datum[params.yKey];
                for (const datum of data) {
                    if (datum[params.xKey] === pX && datum[params.yKey] === pY) {
                        const isMarked = datum.marked[params.yKey] ?? false;
                        const name = `"${datum.category} - ${params.yKey}"`;
                        return [
                            'download',
                            'separator',
                            {
                                type: 'action',
                                showOn: 'series-node',
                                label: isMarked ? `Unmark ${name}` : `Mark ${name}`,
                                action: () => updateMarking(datum, params.yKey, !isMarked),
                            },
                        ];
                    }
                }
            }
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

function updateMarking(changedDatum: DatumType, yKey: string, marked: boolean) {
    const newData = getPersistentMutableData();
    for (const datum of newData) {
        if (datum.category === changedDatum.category) {
            datum.marked[yKey] = marked;
            break;
        }
    }
    options.data = newData;
    chart.updateDelta(options);
}

function updateVisibility(seriesId: string, visible: boolean) {
    for (const series of options.series!) {
        if (series.id === seriesId) {
            series.visible = visible;
        }
    }
    chart.updateDelta(options);
}
