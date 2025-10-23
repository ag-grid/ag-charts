import {
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgCartesianChartOptions,
    AgCharts,
    AgContextMenuItem,
} from 'ag-charts-enterprise';

import type { DatumType } from './data';
import { getPersistentMutableData } from './data';

const markingStyle: AgBarSeriesStyle = {
    stroke: 'red',
    strokeWidth: 4,
    fillOpacity: 1,
};

const DIFF_SERIES_ID = 'diff-series';

interface BarChartOptions extends Omit<AgCartesianChartOptions<DatumType>, 'series'> {
    series: AgBarSeriesOptions[];
}

const options: BarChartOptions = {
    container: document.getElementById('myChart'),
    data: getPersistentMutableData(),
    title: {
        text: 'Dynamic Context Menu',
    },
    subtitle: {
        text: 'Right-Click on a Series Node or Legend Item',
    },
    series: [
        { type: 'bar', xKey: 'category', yKey: 'apples', yName: 'Apples', id: 'apples', fill: '#cceeff' },
        { type: 'bar', xKey: 'category', yKey: 'oranges', yName: 'Oranges', id: 'oranges', fill: '#ffe6cc' },
        { type: 'bar', xKey: 'category', yKey: 'pears', yName: 'Pears', id: 'pears', fill: '#ddffcc' },
    ],
    theme: {
        overrides: {
            bar: {
                series: {
                    strokeWidth: 1,
                    fillOpacity: 0.75,
                    itemStyler: ({ yKey, datum }) => (datum.marked[yKey] ? markingStyle : undefined),
                },
            },
        },
    },
    contextMenu: {
        getItems: (params): AgContextMenuItem[] | undefined => {
            const menuItems: AgContextMenuItem[] = ['download', 'separator'];

            if (params.showOn === 'series-node') {
                const { xKey, yKey } = params;
                if (!xKey || !yKey) return;
                const data = getPersistentMutableData();
                const pX = params.datum[xKey];
                const pY = params.datum[yKey];
                for (const datum of data) {
                    if (datum[xKey] === pX && datum[yKey] === pY) {
                        const isMarked = datum.marked[yKey] ?? false;
                        const name = `"${datum.category} - ${yKey}"`;
                        menuItems.push(
                            {
                                type: 'action',
                                showOn: 'series-node',
                                label: 'Compare with...',
                                items:
                                    // Create a submenu item for each comparable series:
                                    options.series
                                        ?.filter((s) => s.id !== params.seriesId && s.id !== DIFF_SERIES_ID)
                                        .map((s) => ({
                                            type: 'action' as const,
                                            label: s.yName ?? s.yKey,
                                            action: () => createDiffSeries(params.seriesId!, s.id!),
                                        })) ?? [],
                            },
                            {
                                type: 'action',
                                showOn: 'series-node',
                                label: isMarked ? `Unmark ${name}` : `Mark ${name}`,
                                action: () => updateMarking(datum, yKey, !isMarked),
                            }
                        );
                    }
                }
            }

            if (params.showOn === 'legend-item') {
                menuItems.push(
                    // Custom implementation of 'toggle-series-visibility':
                    {
                        type: 'action',
                        showOn: 'legend-item',
                        label: params.visible ? `Hide ${params.text}` : `Show ${params.text}`,
                        action: () => updateVisibility(params.seriesId, !params.visible),
                    },
                    'toggle-other-series'
                );
            }

            const hasDiffSeries = options.series?.some((s) => s.id === DIFF_SERIES_ID);
            if (hasDiffSeries) {
                menuItems.push('separator', {
                    type: 'action',
                    showOn: 'always',
                    label: 'Remove Diff',
                    action: removeDiffSeries,
                });
            }

            return menuItems;
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

function createDiffSeries(baseSeriesId: string, compareToId: string) {
    const data = getPersistentMutableData();
    const baseSeries = options.series?.find((s) => s.id === baseSeriesId);
    const compareToSeries = options.series?.find((s) => s.id === compareToId);
    if (!baseSeries || !compareToSeries) return;

    const getDatumTypeYKey = (series: AgBarSeriesOptions) => {
        const { yKey } = series;
        if (yKey === 'apples' || yKey === 'oranges' || yKey === 'pears') return yKey;
    };
    const baseKey = getDatumTypeYKey(baseSeries);
    const compareKey = getDatumTypeYKey(compareToSeries);
    if (!baseKey || !compareKey) return;

    const diffData = data.map((d) => ({
        category: d.category,
        diff: d[baseKey] - d[compareKey],
    }));

    removeDiffSeries();
    options.series!.push({
        type: 'bar',
        id: DIFF_SERIES_ID,
        xKey: 'category',
        yKey: 'diff',
        yName: `Diff (${baseKey} - ${compareKey})`,
        data: diffData,
        fill: 'gray',
        stroke: 'black',
    });
    chart.updateDelta(options);
}

function removeDiffSeries() {
    const before = options.series!.length;
    options.series = options.series!.filter((s) => s.id !== DIFF_SERIES_ID);
    if (options.series!.length !== before) {
        chart.updateDelta(options);
    }
}
