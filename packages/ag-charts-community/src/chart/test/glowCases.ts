import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { CATEGORY_DATA, HISTOGRAM_DATA, XY_DATA } from './shadowFixtures';

type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

/** What a series is given to cast: where it reads each of them from is the case's own. */
export interface GlowPlacement {
    shadow?: object;
    glow?: object;
    itemStyler?: (params: any) => object;
}

/** One series type, and where it reads its `shadow`, `glow` and `itemStyler` from. */
export interface GlowSeriesCase {
    name: string;
    /** The series type, which a theme override is keyed by. */
    type: string;
    data: object[];
    /** The options of the series that place nothing. */
    base: object;
    /** The options that place the shadow, glow and item styler, as a series and a theme override both read them. */
    place: (placement: GlowPlacement) => object;
    /** The series has a datum to hover, and options to set on a highlight state. */
    hoverable?: boolean;
    /** The series has a `shadow` and no `glow` where this case places it. */
    seriesShadowOnly?: boolean;
    /**
     * A highlight state of the series reaches parts that the `itemStyler` of this placement does not: a sankey or chord
     * `unhighlightedItem` glow is cast by the links as well as the nodes, a node's styler by the nodes alone.
     */
    reachesOtherParts?: boolean;
    /** The `highlight` of the series has `highlightedItem` and `unhighlightedItem`, and no states of the series as a whole. */
    itemHighlightOnly?: boolean;
    /** The chart takes no other series beside this one, so no other series is unhighlighted while it is hovered. */
    singleSeries?: boolean;
    /** The series takes no `itemStyler` where this case places it. */
    noItemStyler?: boolean;
    /** The datum to hover where it is not the first of the series' node data. */
    hoverDatum?: (chart: AgChartInstance) => object | undefined;
    /** Options of the chart that the series needs, beyond its data. */
    chartOptions?: object;
}

/** A series with its `shadow`, `glow` and `itemStyler` set, and a `highlight` if it has one. */
export function glowSeries(
    { base, place }: GlowSeriesCase,
    placement: GlowPlacement,
    highlight?: object
): AnySeriesOptions {
    return { ...base, ...place(placement), ...(highlight ? { highlight } : {}) } as AnySeriesOptions;
}

/** The chart options that set the same shadow and glow through the theme, and not on the series. */
export function glowThemeOptions(testCase: GlowSeriesCase, placement: GlowPlacement, highlight?: object) {
    return {
        theme: {
            overrides: {
                [testCase.type]: { series: { ...testCase.place(placement), ...(highlight ? { highlight } : {}) } },
            },
        },
    };
}

export const onSeries = ({ shadow, glow, itemStyler }: GlowPlacement) => ({ shadow, glow, itemStyler });

export const onMarker = ({ shadow, glow, itemStyler }: GlowPlacement) => ({
    marker: { enabled: true, shadow, glow, itemStyler },
});

export const COMMUNITY_GLOW_SERIES: GlowSeriesCase[] = [
    {
        name: 'bar',
        type: 'bar',
        data: CATEGORY_DATA,
        hoverable: true,
        base: { type: 'bar', xKey: 'category', yKey: 'value' },
        place: onSeries,
    },
    {
        name: 'histogram',
        type: 'histogram',
        data: HISTOGRAM_DATA,
        hoverable: true,
        base: {
            type: 'histogram',
            xKey: 'x',
            bins: [
                [0, 2],
                [2, 4],
                [4, 6],
                [6, 8],
            ],
        },
        place: onSeries,
    },
    {
        name: 'scatter',
        type: 'scatter',
        data: XY_DATA,
        hoverable: true,
        base: { type: 'scatter', xKey: 'x', yKey: 'y' },
        place: onSeries,
    },
    {
        name: 'bubble',
        type: 'bubble',
        data: XY_DATA,
        hoverable: true,
        base: { type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' },
        place: onSeries,
    },
    {
        name: 'line markers',
        type: 'line',
        data: XY_DATA,
        hoverable: true,
        base: { type: 'line', xKey: 'x', yKey: 'y' },
        place: onMarker,
    },
    {
        name: 'area markers',
        type: 'area',
        data: XY_DATA,
        hoverable: true,
        base: { type: 'area', xKey: 'x', yKey: 'y' },
        place: onMarker,
    },
    {
        name: 'area fill',
        type: 'area',
        data: XY_DATA,
        seriesShadowOnly: true,
        noItemStyler: true,
        base: { type: 'area', xKey: 'x', yKey: 'y' },
        place: ({ shadow }) => ({ shadow }),
    },
    {
        name: 'pie',
        type: 'pie',
        data: CATEGORY_DATA,
        hoverable: true,
        base: { type: 'pie', angleKey: 'value' },
        place: onSeries,
    },
    {
        name: 'donut',
        type: 'donut',
        data: CATEGORY_DATA,
        hoverable: true,
        base: { type: 'donut', angleKey: 'value' },
        place: onSeries,
    },
];
