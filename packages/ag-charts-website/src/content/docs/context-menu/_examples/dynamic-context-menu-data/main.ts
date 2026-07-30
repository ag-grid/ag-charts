import {
    AgCharts,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';
import type {
    AgCartesianChartOptions,
    AgContextMenuGetItemsParams,
    AgContextMenuItem,
    AgLineSeriesOptions,
} from 'ag-charts-types';

ModuleRegistry.registerModules([
    LineSeriesModule,
    NumberAxisModule,
    CategoryAxisModule,
    LegendModule,
    ContextMenuModule,
]);

type DatumType = {
    year: string;
    usa: number | null;
    china: number | null;
    india: number | null;
};

const baseData: DatumType[] = [
    { year: '2015', usa: 2.9, china: 7.0, india: 8.0 },
    { year: '2016', usa: 1.8, china: 6.9, india: 8.3 },
    { year: '2017', usa: 2.0, china: 5.9, india: 6.0 },
    { year: '2018', usa: 3.0, china: 5.7, india: 5.6 },
    { year: '2019', usa: 3.2, china: 6.0, india: 3.4 },
    { year: '2020', usa: -2.2, china: 2.2, india: -5.8 },
    { year: '2021', usa: 5.8, china: 8.4, india: 9.7 },
    { year: '2022', usa: 1.9, china: 3.0, india: 7.0 },
    { year: '2023', usa: 2.5, china: 5.2, india: 8.2 },
    { year: '2024', usa: 2.8, china: 5.0, india: 6.5 },
];

// Default theme palette fills, in palette order, so the initial colours match the default theme.
const seriesMeta: { id: string; yKey: keyof DatumType; yName: string; color: string }[] = [
    { id: 'United States', yKey: 'usa', yName: 'United States', color: '#5090dc' },
    { id: 'China', yKey: 'china', yName: 'China', color: '#ffa03a' },
    { id: 'India', yKey: 'india', yName: 'India', color: '#459d55' },
];

const seriesColors: { label: string; value: string }[] = [
    { label: 'Blue', value: '#5090dc' },
    { label: 'Green', value: '#459d55' },
    { label: 'Orange', value: '#ffa03a' },
    { label: 'Purple', value: '#9669cb' },
    { label: 'Red', value: '#ef5452' },
];

const emphasisedPoints = new Set<string>();

function pointKey(seriesId: string, year: string) {
    return `${seriesId}::${year}`;
}

function colorSwatch(color: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="${color}"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createSeries(): AgLineSeriesOptions<DatumType>[] {
    return seriesMeta.map(
        ({ id, yKey, yName, color }): AgLineSeriesOptions<DatumType> => ({
            id,
            type: 'line',
            xKey: 'year',
            yKey,
            yName,
            // Assign an explicit colour per series so the palette isn't reassigned by position when a series is removed.
            stroke: color,
            marker: {
                enabled: true,
                fill: color,
                stroke: color,
                itemStyler: ({ seriesId, datum }) =>
                    emphasisedPoints.has(pointKey(seriesId, datum.year)) ? { size: 14 } : {},
            },
            label: {
                enabled: true,
                color: { ref: 'textColor', mix: 0.6, ontoColor: color },
                fill: { ref: 'chartBackgroundColor', mix: 0.8, ontoColor: color },
                border: {
                    enabled: true,
                    stroke: color,
                },
                padding: 4,
                placement: ['top', 'bottom', 'left', 'right'],
                collision: {
                    alwaysShow: true,
                },
                itemStyler: ({ seriesId, datum }) => ({
                    enabled: emphasisedPoints.has(pointKey(seriesId, datum.year)),
                }),
            },
        })
    );
}

let data: DatumType[] = baseData.map((datum) => ({ ...datum }));
let series: AgLineSeriesOptions<DatumType>[] = createSeries();

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Annual GDP Growth by Country',
    },
    subtitle: {
        text: 'Right-click a point or legend item to change the point or its series',
    },
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 2,
                        },
                        unhighlightedSeries: {
                            opacity: 1,
                        },
                    },
                },
            },
        },
    },
    data,
    series,
    contextMenu: { getItems: (params) => getItems(params) },
};

const chart = AgCharts.create(options);

/** inScope */
function getItems(params: AgContextMenuGetItemsParams<DatumType>): AgContextMenuItem<DatumType>[] | undefined {
    if (params.showOn === 'legend-item') {
        const { seriesId } = params;
        return [
            'toggle-series-visibility',
            {
                type: 'action',
                showOn: 'legend-item',
                label: `Remove "${seriesId}"`,
                action: () => removeSeries(seriesId),
            },
            {
                showOn: 'legend-item',
                label: `Colour "${seriesId}"`,
                items: seriesColors.map((color) => ({
                    type: 'action',
                    showOn: 'legend-item',
                    label: color.label,
                    iconUrl: colorSwatch(color.value),
                    action: () => colorSeries(seriesId, color.value),
                })),
            },
        ];
    }
    const result: AgContextMenuItem<DatumType>[] = [];
    for (const paramsEntry of params.allShowOnParams) {
        if (paramsEntry.showOn === 'series-node') {
            const { yKey, xKey, seriesId } = paramsEntry;
            // Series types without x/y keys (e.g. pie) cannot identify a data point this way.
            if (xKey == null || yKey == null) continue;
            const year = String(paramsEntry.datum[xKey]);
            const yKeyFormatting: Record<keyof DatumType, string | undefined> = {
                china: 'China',
                india: 'India',
                usa: 'USA',
                year: undefined,
            };
            const formattedDatum = `${yKeyFormatting[yKey]} ${year}`;
            const isEmphasised = emphasisedPoints.has(pointKey(seriesId, year));
            result.push(
                {
                    type: 'action',
                    showOn: 'series-node',
                    label: `${isEmphasised ? 'Remove Emphasis from' : 'Emphasise'} "${formattedDatum}" Point`,
                    action: () => toggleEmphasis(seriesId, year),
                },
                {
                    type: 'action',
                    showOn: 'series-node',
                    label: `Remove "${formattedDatum}" Point`,
                    action: () => removeDataPoint(year, yKey),
                }
            );
        }
    }
    return result;
}

/** inScope */
function syncOptions() {
    // Sync both data and series so every update reflects the full current state.
    options.data = data;
    options.series = series;
    chart.update(options);
}

/** inScope */
function toggleEmphasis(seriesId: string, year: string) {
    const key = pointKey(seriesId, year);
    if (emphasisedPoints.has(key)) {
        emphasisedPoints.delete(key);
    } else {
        emphasisedPoints.add(key);
    }
    // Reassign the data so the styler and label re-run with the updated emphasis set.
    data = data.map((datum) => ({ ...datum }));
    syncOptions();
}

/** inScope */
function removeDataPoint(year: string, yKey: keyof DatumType) {
    data = data.map((datum) => (datum.year === year ? { ...datum, [yKey]: null } : datum));
    syncOptions();
}

/** inScope */
function colorSeries(seriesId: string, color: string) {
    series = series.map((s) =>
        s.id === seriesId ? { ...s, stroke: color, marker: { ...s.marker, fill: color, stroke: color } } : s
    );
    syncOptions();
}

/** inScope */
function removeSeries(seriesId: string) {
    series = series.filter((s) => s.id !== seriesId);
    syncOptions();
}

function reset() {
    emphasisedPoints.clear();
    data = baseData.map((datum) => ({ ...datum }));
    series = createSeries();
    syncOptions();
}
