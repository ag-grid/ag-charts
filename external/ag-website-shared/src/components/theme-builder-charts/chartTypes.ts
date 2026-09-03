import type { IconName } from '@ag-website-shared/components/icon/Icon';
import { type PersistentAtom, atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgFinancialChartOptions,
} from 'ag-charts-community';
import { useAtom } from 'jotai';

import { type ChartFeatureId, type ChartFeatures, DEFAULT_CHART_FEATURES, isFeatureActive } from './chartFeatures';
import {
    CANDLESTICK_DATA,
    DEFAULT_SERIES_COUNT,
    PREVIEW_DATA,
    SERIES_COUNT_OPTIONS,
    THUMBNAIL_DATA,
    THUMBNAIL_SERIES_KEYS,
    seriesFor,
    totalsFor,
} from './previewData';

/** Either shape the preview can hand to `useChart`. */
export type PreviewChartOptions = AgChartOptions | AgFinancialChartOptions;

/**
 * An AG Charts preset a preview type is built through, named as AG Charts names
 * it: the same string reaches `ModuleRegistry` as the preset module's name, so
 * a test can check the registered bundles answer for every type that asks.
 */
export type PreviewPreset = 'price-volume';

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
    /**
     * The same icon the docs menu gives this series, so the control names a
     * chart the way the rest of the site already names it.
     */
    icon: IconName;
    /**
     * What the count control is called for this type - a donut has slices.
     * Absent where there is nothing to count, which hides the control rather
     * than leaving one that does nothing.
     */
    countLabel?: string;
    /**
     * The features this type can show. A feature missing here is one this chart
     * has no surface for, so the popup leaves it out rather than offering a
     * checkbox that changes nothing.
     */
    features: ChartFeatureId[];
    /**
     * Which factory builds it. The price-volume preset assembles the navigator,
     * range buttons, status bar and drawing tools that a hand-built chart would
     * have to wire up one at a time - and it is fixed at creation, so a pane
     * switching in or out of it remounts rather than updates.
     */
    preset?: PreviewPreset;
    /** The main preview: the full chart, titled and with a legend. */
    buildOptions: (seriesCount: number, features: ChartFeatures) => PreviewChartOptions;
};

/**
 * The chart every preset card draws, whichever types the two panes are showing.
 *
 * Bars, and only bars. A card's job is to separate one theme from another at a
 * glance, and a row of cards can only do that if they are all the same chart -
 * a reader comparing twelve themes should be reading twelve palettes, not
 * re-reading one shape. Bars carry the most of a theme in the least space:
 * every palette slot as a filled block, plus the axes, the grid lines and the
 * background behind them.
 *
 * Built from its own data rather than a shrunk copy of the preview, and fixed
 * at eight series whatever the count control says: the stock palettes only
 * diverge a few slots in, so at a user-chosen count of two, Default, Material
 * and Vivid would be indistinguishable again. The cards are swatches of the
 * theme, not previews of the user's data.
 */
export const THUMBNAIL_OPTIONS: AgChartOptions = {
    // Fewer columns than the data carries: eight grouped bars across six
    // columns would be hair-thin at card size.
    data: THUMBNAIL_DATA.slice(0, 3),
    series: THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'bar', xKey: 'period', yKey: key })),
    axes: {
        x: { type: 'category', position: 'bottom', label: { enabled: false } },
        // `nice: false` because with no labels there are only a couple of ticks,
        // and rounding the domain out to the next tick leaves the plot half empty.
        y: { type: 'number', position: 'left', label: { enabled: false }, nice: false },
    },
    legend: { enabled: false },
};

const TITLE = { text: 'Quarterly Revenue by Country' };
const SUBTITLE = { text: 'Figures in millions (USD)' };
const LEGEND = { position: 'bottom' as const };

const CARTESIAN_AXES = {
    x: { type: 'category' as const, position: 'bottom' as const },
    y: { type: 'number' as const, position: 'left' as const, title: { text: 'Revenue' } },
};

/** The features every chart here can show, whatever shape it is. */
const COMMON_FEATURES: ChartFeatureId[] = ['seriesStrokes', 'legend', 'contextMenu'];

const CARTESIAN_FEATURES: ChartFeatureId[] = ['seriesStrokes', 'legend', 'crosshairs', 'contextMenu'];

/**
 * A width for the series outline, so the palette's strokes are drawn at all.
 *
 * They are not, otherwise: AG Charts resolves a series' `strokeWidth` to zero
 * unless the chart sets a stroke of its own, so a palette can carry a stroke for
 * every slot and show none of them. That leaves half the palette editor changing
 * colours the user cannot see, which is what this answers.
 *
 * The widths are AG Charts' own - what it picks the moment a chart does set a
 * stroke - so the preview shows the colour as a real chart would draw it rather
 * than an outline thickened to make a point.
 */
const SHAPE_STROKE_WIDTH = 2;

/** Markers are 7px across, so AG Charts rings them at one rather than two. */
const MARKER_STROKE_WIDTH = 1;

const shapeStroke = (features: ChartFeatures) =>
    isFeatureActive(features, 'seriesStrokes') ? { strokeWidth: SHAPE_STROKE_WIDTH } : {};

/**
 * A line series draws its line in the palette *fill*, so its stroke has nowhere
 * to go but the markers - which is also the only place a user would look for it.
 */
const markerStroke = (features: ChartFeatures) =>
    isFeatureActive(features, 'seriesStrokes') ? { marker: { strokeWidth: MARKER_STROKE_WIDTH } } : {};

/**
 * Crosshairs default on for continuous axes only, so a category x-axis has to
 * ask for one or the user gets half a crosshair and no x label - which is the
 * label carrying `crosshairLabelBackgroundColor`.
 */
const cartesianAxes = (features: ChartFeatures) => {
    const crosshair = { enabled: isFeatureActive(features, 'crosshairs') };
    return {
        x: { ...CARTESIAN_AXES.x, crosshair },
        y: { ...CARTESIAN_AXES.y, crosshair },
    };
};

/** Applied to every non-preset type, so one switch covers bars and donuts alike. */
const commonOptions = (features: ChartFeatures) => ({
    legend: { ...LEGEND, enabled: isFeatureActive(features, 'legend') },
    // Enabled by default once the module is registered, so this is as much about
    // being able to turn it off as on.
    contextMenu: { enabled: isFeatureActive(features, 'contextMenu') },
});

/**
 * Shared scaffolding for the four cartesian variants. Typed as cartesian rather
 * than as `AgChartOptions`, or the union stays unnarrowed and the axes fail to
 * type-check against the polar member.
 */
const cartesian = (
    seriesCount: number,
    features: ChartFeatures,
    series: (key: string, name: string) => AgCartesianSeriesOptions
): AgCartesianChartOptions => ({
    data: PREVIEW_DATA,
    title: TITLE,
    subtitle: SUBTITLE,
    series: seriesFor(seriesCount).map(({ key, name }) => series(key, name)),
    axes: cartesianAxes(features),
    ...commonOptions(features),
});

export const PREVIEW_CHART_TYPES: PreviewChartType[] = [
    {
        id: 'bar',
        label: 'Bar',
        icon: 'chartsColumn',
        countLabel: 'Series',
        features: CARTESIAN_FEATURES,
        buildOptions: (count, features) =>
            cartesian(count, features, (key, name) => ({
                type: 'bar',
                xKey: 'quarter',
                yKey: key,
                yName: name,
                ...shapeStroke(features),
            })),
    },
    {
        id: 'stackedBar',
        label: 'Stacked Bar',
        icon: 'chartsColumnStacked',
        countLabel: 'Series',
        features: CARTESIAN_FEATURES,
        buildOptions: (count, features) =>
            cartesian(count, features, (key, name) => ({
                type: 'bar',
                xKey: 'quarter',
                yKey: key,
                yName: name,
                stacked: true,
                ...shapeStroke(features),
            })),
    },
    {
        id: 'line',
        label: 'Line',
        icon: 'chartsLine',
        countLabel: 'Series',
        features: CARTESIAN_FEATURES,
        buildOptions: (count, features) =>
            cartesian(count, features, (key, name) => ({
                type: 'line',
                xKey: 'quarter',
                yKey: key,
                yName: name,
                ...markerStroke(features),
            })),
    },
    {
        id: 'area',
        label: 'Area',
        icon: 'chartsArea',
        countLabel: 'Series',
        features: CARTESIAN_FEATURES,
        buildOptions: (count, features) =>
            cartesian(count, features, (key, name) => ({
                type: 'area',
                xKey: 'quarter',
                yKey: key,
                yName: name,
                stacked: true,
                ...shapeStroke(features),
            })),
    },
    {
        id: 'donut',
        label: 'Donut',
        icon: 'chartsDonut',
        countLabel: 'Slices',
        // No crosshairs: they belong to an axis, and a donut has none.
        features: COMMON_FEATURES,
        buildOptions: (count, features) => ({
            data: totalsFor(count),
            title: { text: 'Revenue by Country' },
            subtitle: { text: 'Full year, figures in millions (USD)' },
            series: [
                {
                    type: 'donut',
                    angleKey: 'revenue',
                    calloutLabelKey: 'country',
                    innerRadiusRatio: 0.6,
                    ...shapeStroke(features),
                },
            ],
            ...commonOptions(features),
        }),
    },
    {
        id: 'candlestick',
        label: 'Candlestick',
        icon: 'chartsCandlestick',
        features: ['zoom', 'navigator', 'rangeButtons', 'toolbar', 'statusBar', 'volume'],
        preset: 'price-volume',
        /**
         * The one preview built for the chart's own UI rather than for its
         * series. Navigator, range buttons, drawing tools and status bar all
         * live on the chrome params, and this is the chart AG Charts ships them
         * for - a bar chart with a navigator under it would be a demonstration
         * of nothing.
         *
         * The count is ignored: there is one instrument, so `countLabel` is
         * absent and the control is hidden rather than left doing nothing.
         *
         * No series-strokes switch either, unlike every other type here. Two
         * years of daily candles come out a shade over one pixel wide, and below
         * three AG Charts draws the wick line alone - no body - so at the only
         * density this pane ever shows, the stroke is not an outline round the
         * candle, it is the candle. A switch for it could only blank the series.
         */
        buildOptions: (_count, features) => ({
            data: CANDLESTICK_DATA,
            title: { text: 'Acme Corp.' },
            navigator: isFeatureActive(features, 'navigator'),
            rangeButtons: isFeatureActive(features, 'rangeButtons'),
            statusBar: isFeatureActive(features, 'statusBar'),
            toolbar: isFeatureActive(features, 'toolbar'),
            volume: isFeatureActive(features, 'volume'),
            zoom: isFeatureActive(features, 'zoom'),
        }),
    },
];

const DEFAULT_CHART_TYPE = PREVIEW_CHART_TYPES[0];

/**
 * The preview is two charts, not one, and each pane chooses its own type.
 *
 * A theme is judged by comparison, and comparing two shapes of chart from memory
 * - switch to donut, remember what the bars did - is exactly the comparison a
 * user is worst at. Side by side, a param that decides nothing on bars and
 * everything on a donut shows both facts at once.
 */
export const PREVIEW_PANES = ['left', 'right'] as const;

export type PreviewPaneId = (typeof PREVIEW_PANES)[number];

/** Names the panes apart for screen readers, which otherwise hear one control twice. */
export const PREVIEW_PANE_LABELS: Record<PreviewPaneId, string> = {
    left: 'Left',
    right: 'Right',
};

/**
 * A plain chart and a chart made mostly of UI, because those are the two halves
 * of what the editor panel edits. Bars answer for the palette, the axes and the
 * text; the candlestick pane is the only place a navigator, a toolbar or a range
 * button appears, and those carry three whole groups of params that are
 * otherwise invisible.
 *
 * It costs the polar preview a default slot - a donut is one click away - and
 * that trade is deliberate: a donut differs from bars in shape, where the
 * candlestick differs in which params it can show at all.
 *
 * Guarded by a test, since an id that no longer exists would quietly collapse
 * both panes onto the same default.
 */
export const DEFAULT_CHART_TYPE_IDS: Record<PreviewPaneId, string> = {
    left: 'bar',
    right: 'candlestick',
};

// Stored per pane, so a returning user finds the pairing they left, not just
// the chart they last touched.
const chartTypeAtoms: Record<PreviewPaneId, PersistentAtom<string>> = {
    left: atomWithJSONStorage<string>('charts-preview-type-left', DEFAULT_CHART_TYPE_IDS.left),
    right: atomWithJSONStorage<string>('charts-preview-type-right', DEFAULT_CHART_TYPE_IDS.right),
};

export const usePreviewChartType = (pane: PreviewPaneId) => {
    const [id, setId] = useAtom(chartTypeAtoms[pane]);
    const selected = PREVIEW_CHART_TYPES.find((type) => type.id === id) ?? DEFAULT_CHART_TYPE;
    return [selected, (type: PreviewChartType) => setId(type.id)] as const;
};

const seriesCountAtoms: Record<PreviewPaneId, PersistentAtom<number>> = {
    left: atomWithJSONStorage<number>('charts-preview-series-count-left', DEFAULT_SERIES_COUNT),
    right: atomWithJSONStorage<number>('charts-preview-series-count-right', DEFAULT_SERIES_COUNT),
};

/**
 * Snapped rather than clamped, because the offered counts are sparse: a stored
 * value outlives the scale that produced it, and one landing between two options
 * would leave the control displaying a count it has no way to select again.
 */
export const snapSeriesCount = (count: number) =>
    Number.isFinite(count)
        ? SERIES_COUNT_OPTIONS.reduce((best, option) =>
              Math.abs(option - count) < Math.abs(best - count) ? option : best
          )
        : DEFAULT_SERIES_COUNT;

export const usePreviewSeriesCount = (pane: PreviewPaneId) => {
    const [count, setCount] = useAtom(seriesCountAtoms[pane]);
    return [snapSeriesCount(count), setCount] as const;
};

/**
 * Features are per pane for the same reason the type is: which of them mean
 * anything is decided entirely by the chart showing them, and a pane on bars has
 * no navigator to toggle. Shared state would put six dead checkboxes in front of
 * whichever pane was not the financial one.
 */
const chartFeatureAtoms: Record<PreviewPaneId, PersistentAtom<ChartFeatures>> = {
    left: atomWithJSONStorage<ChartFeatures>('charts-preview-features-left', DEFAULT_CHART_FEATURES),
    right: atomWithJSONStorage<ChartFeatures>('charts-preview-features-right', DEFAULT_CHART_FEATURES),
};

export const usePreviewFeatures = (pane: PreviewPaneId) => useAtom(chartFeatureAtoms[pane]);
