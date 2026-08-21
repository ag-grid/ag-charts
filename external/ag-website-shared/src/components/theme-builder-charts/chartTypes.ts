import { atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type { AgCartesianChartOptions, AgCartesianSeriesOptions, AgChartOptions } from 'ag-charts-community';
import { useAtom } from 'jotai';

import {
    DEFAULT_SERIES_COUNT,
    MAX_SERIES_COUNT,
    MIN_SERIES_COUNT,
    PREVIEW_DATA,
    THUMBNAIL_DATA,
    THUMBNAIL_SERIES_KEYS,
    THUMBNAIL_SLICES,
    seriesFor,
    totalsFor,
} from './previewData';

/**
 * The chart types the preview can be switched between.
 *
 * A theme is not only a bar chart: markers, area fills, callout labels and the
 * polar layouts each pick up different parts of it, and a param that looks
 * unimportant against bars (say `subtleTextColor`) is the whole story on a
 * donut. Switching type is the cheapest way to see that before committing to a
 * theme.
 *
 * Each entry builds its whole options object rather than patching a shared base
 * - cartesian and polar charts do not take the same shape, and `axes` on a donut
 * is a type error rather than an ignored key.
 */
export type PreviewChartType = {
    id: string;
    label: string;
    /** What the count control is called for this type - a donut has slices. */
    countLabel: string;
    /** The main preview: the full chart, titled and with a legend. */
    buildOptions: (seriesCount: number) => AgChartOptions;
    /**
     * The preset thumbnails, which take the same form so the cards predict what
     * the user is actually previewing - but built from their own data rather
     * than a shrunk copy of the preview.
     *
     * Fixed at eight series, deliberately, and NOT following the count control.
     * A thumbnail's job is to separate one theme from another, and the stock
     * palettes only diverge a few slots in - at a user-chosen count of two,
     * Default, Material and Vivid would be indistinguishable again. The cards
     * are swatches of the theme, not previews of the user's data.
     */
    thumbnailOptions: AgChartOptions;
};

const THUMBNAIL_AXES = {
    x: { type: 'category' as const, position: 'bottom' as const, label: { enabled: false } },
    // `nice: false` because with no labels there are only a couple of ticks, and
    // rounding the domain out to the next round tick leaves the plot half empty.
    y: { type: 'number' as const, position: 'left' as const, label: { enabled: false }, nice: false },
};

const THUMBNAIL_LEGEND = { enabled: false };

const TITLE = { text: 'Quarterly Revenue by Country' };
const SUBTITLE = { text: 'Figures in millions (USD)' };
const LEGEND = { position: 'bottom' as const };

const CARTESIAN_AXES = {
    x: { type: 'category' as const, position: 'bottom' as const },
    y: { type: 'number' as const, position: 'left' as const, title: { text: 'Revenue' } },
};

/**
 * Shared scaffolding for the four cartesian variants. Typed as cartesian rather
 * than as `AgChartOptions`, or the union stays unnarrowed and the axes fail to
 * type-check against the polar member.
 */
const cartesian = (
    seriesCount: number,
    series: (key: string, name: string) => AgCartesianSeriesOptions
): AgCartesianChartOptions => ({
    data: PREVIEW_DATA,
    title: TITLE,
    subtitle: SUBTITLE,
    series: seriesFor(seriesCount).map(({ key, name }) => series(key, name)),
    axes: CARTESIAN_AXES,
    legend: LEGEND,
});

export const PREVIEW_CHART_TYPES: PreviewChartType[] = [
    {
        id: 'bar',
        label: 'Bar',
        countLabel: 'Series',
        buildOptions: (count) =>
            cartesian(count, (key, name) => ({ type: 'bar', xKey: 'quarter', yKey: key, yName: name })),
        thumbnailOptions: {
            // Fewer columns than the stacked variants: eight grouped bars across
            // six columns would be hair-thin at card size.
            data: THUMBNAIL_DATA.slice(0, 3),
            series: THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'bar', xKey: 'period', yKey: key })),
            axes: THUMBNAIL_AXES,
            legend: THUMBNAIL_LEGEND,
        },
    },
    {
        id: 'stackedBar',
        label: 'Stacked Bar',
        countLabel: 'Series',
        buildOptions: (count) =>
            cartesian(count, (key, name) => ({ type: 'bar', xKey: 'quarter', yKey: key, yName: name, stacked: true })),
        thumbnailOptions: {
            data: THUMBNAIL_DATA,
            series: THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'bar', xKey: 'period', yKey: key, stacked: true })),
            axes: THUMBNAIL_AXES,
            legend: THUMBNAIL_LEGEND,
        },
    },
    {
        id: 'line',
        label: 'Line',
        countLabel: 'Series',
        buildOptions: (count) =>
            cartesian(count, (key, name) => ({ type: 'line', xKey: 'quarter', yKey: key, yName: name })),
        thumbnailOptions: {
            data: THUMBNAIL_DATA,
            series: THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'line', xKey: 'period', yKey: key })),
            axes: THUMBNAIL_AXES,
            legend: THUMBNAIL_LEGEND,
        },
    },
    {
        id: 'area',
        label: 'Area',
        countLabel: 'Series',
        buildOptions: (count) =>
            cartesian(count, (key, name) => ({ type: 'area', xKey: 'quarter', yKey: key, yName: name, stacked: true })),
        thumbnailOptions: {
            data: THUMBNAIL_DATA,
            series: THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'area', xKey: 'period', yKey: key, stacked: true })),
            axes: THUMBNAIL_AXES,
            legend: THUMBNAIL_LEGEND,
        },
    },
    {
        id: 'donut',
        label: 'Donut',
        countLabel: 'Slices',
        buildOptions: (count) => ({
            data: totalsFor(count),
            title: { text: 'Revenue by Country' },
            subtitle: { text: 'Full year, figures in millions (USD)' },
            series: [{ type: 'donut', angleKey: 'revenue', calloutLabelKey: 'country', innerRadiusRatio: 0.6 }],
            legend: LEGEND,
        }),
        thumbnailOptions: {
            data: THUMBNAIL_SLICES,
            // No `calloutLabelKey`: that is what draws the callout labels, and
            // there is no room for them on a card.
            series: [{ type: 'donut', angleKey: 'value', innerRadiusRatio: 0.6 }],
            legend: THUMBNAIL_LEGEND,
        },
    },
];

export const DEFAULT_CHART_TYPE = PREVIEW_CHART_TYPES[0];

const chartTypeAtom = atomWithJSONStorage<string>('charts-preview-type', DEFAULT_CHART_TYPE.id);

export const usePreviewChartType = () => {
    const [id, setId] = useAtom(chartTypeAtom);
    const selected = PREVIEW_CHART_TYPES.find((type) => type.id === id) ?? DEFAULT_CHART_TYPE;
    return [selected, (type: PreviewChartType) => setId(type.id)] as const;
};

const seriesCountAtom = atomWithJSONStorage<number>('charts-preview-series-count', DEFAULT_SERIES_COUNT);

export const SERIES_COUNT_OPTIONS = Array.from(
    { length: MAX_SERIES_COUNT - MIN_SERIES_COUNT + 1 },
    (_, index) => MIN_SERIES_COUNT + index
);

export const usePreviewSeriesCount = () => {
    const [count, setCount] = useAtom(seriesCountAtom);
    // Clamped on read: the stored value outlives any change to the data, and a
    // count past the end of it would render fewer series than the label claims.
    const clamped = Math.min(Math.max(Math.round(count) || DEFAULT_SERIES_COUNT, MIN_SERIES_COUNT), MAX_SERIES_COUNT);
    return [clamped, setCount] as const;
};
