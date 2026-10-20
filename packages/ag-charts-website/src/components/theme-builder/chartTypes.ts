import type { IconName } from '@ag-website-shared/components/icon/Icon';
import { type PersistentAtom, atomWithJSONStorage } from '@ag-website-shared/theming/JSONStorage';
import { useAtom } from 'jotai';

import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgContextMenuItem,
} from 'ag-charts-community';

import { type ChartFeatureId, type ChartFeatures, DEFAULT_CHART_FEATURES, isFeatureActive } from './chartFeatures';
import {
    CANDLESTICK_DATA,
    DEFAULT_SERIES_COUNT,
    PREVIEW_DATA,
    SERIES_COUNT_OPTIONS,
    THUMBNAIL_DATA,
    THUMBNAIL_LINE_KEY,
    THUMBNAIL_SERIES_KEYS,
    seriesFor,
    totalsFor,
} from './previewData';

/**
 * A stable id for the nth series of a preview. Set by hand because the panel
 * names a series back to the chart through `setState`, and AG Charts' generated
 * ids are documented as liable to change between releases.
 */
const previewSeriesId = (index: number) => `preview-series-${index}`;

/** A datum the preview can ask the chart to open a tooltip on. */
export type PreviewTooltipTarget = { seriesId: string; itemId: number };

/** Q2 of the first series: left of centre, so the tooltip opens over the chart. */
const CARTESIAN_TOOLTIP_TARGET: PreviewTooltipTarget = { seriesId: previewSeriesId(0), itemId: 1 };

/** Left of centre for the same reason, at the default (unzoomed) range. */
const CANDLESTICK_TOOLTIP_TARGET: PreviewTooltipTarget = {
    seriesId: previewSeriesId(0),
    itemId: Math.floor(CANDLESTICK_DATA.length * 0.4),
};

/**
 * A chart type the preview can be switched to. Each entry builds its whole
 * options object rather than patching a shared base, `axes` on a donut being a
 * type error rather than an ignored key.
 */
export type PreviewChartType = {
    id: string;
    label: string;
    /** The same icon the docs menu gives this series. */
    icon: IconName;
    /** What the count control is called - a donut has slices. Absent hides it. */
    countLabel?: string;
    /** The features this type has a surface for; the popup leaves out the rest. */
    features: ChartFeatureId[];
    /** The datum whose tooltip is held open while the tooltip params are edited. */
    tooltipTarget?: PreviewTooltipTarget;
    /** The main preview: the full chart, titled and with a legend. */
    buildOptions: (seriesCount: number, features: ChartFeatures, showZoomButtons?: boolean) => AgChartOptions;
};

/**
 * The chart every preset card draws, so a row of cards reads as a row of
 * palettes rather than of shapes. Eight bar series, the stock palettes only
 * diverging a few slots in, and a line in the ninth.
 */
export const THUMBNAIL_OPTIONS: AgChartOptions = {
    data: THUMBNAIL_DATA,
    series: [
        // Stacked, as each month has one bar and grouping would leave it an eighth of the band.
        ...THUMBNAIL_SERIES_KEYS.map((key) => ({ type: 'bar' as const, xKey: 'month', yKey: key, stacked: true })),
        { type: 'line', xKey: 'month', yKey: THUMBNAIL_LINE_KEY },
    ],
    // Text, so a preset's typography shows on its card.
    title: { text: 'Monthly Revenue' },
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    legend: { enabled: false },
    // A preset's padding is sized for a full chart and swamps one at card size.
    padding: 8,
};

const TITLE = { text: 'Quarterly Revenue by Country' };
const SUBTITLE = { text: 'Figures in millions (USD)' };
const LEGEND = { position: 'bottom' as const };

const CARTESIAN_AXES = {
    x: { type: 'category' as const, position: 'bottom' as const },
    y: { type: 'number' as const, position: 'left' as const, title: { text: 'Revenue' } },
};

/** The features every chart here can show, whatever shape it is. */
const COMMON_FEATURES: ChartFeatureId[] = ['seriesStrokes', 'legend', 'tooltip', 'contextMenu'];

/** Zoom, scrollbar and navigator are cartesian-only in AG Charts. */
const CARTESIAN_FEATURES: ChartFeatureId[] = [...COMMON_FEATURES, 'crosshairs', 'zoom', 'scrollbar', 'navigator'];

/** Stand-ins, so the menu has rows enough to show its hover, disabled and separator styles. */
export const PREVIEW_MENU_EXTRA_ITEMS = [
    { label: 'Copy Value' },
    { label: 'Add Note' },
    { label: 'Export Data', enabled: false },
] satisfies AgContextMenuItem[];

/**
 * AG Charts resolves a series' `strokeWidth` to zero unless the chart sets a
 * stroke of its own, so without this a palette carries a stroke per slot and
 * draws none of them. The widths are AG Charts' own defaults.
 */
const SHAPE_STROKE_WIDTH = 2;

/** Markers are 7px across, so AG Charts rings them at one rather than two. */
const MARKER_STROKE_WIDTH = 1;

const shapeStroke = (features: ChartFeatures) =>
    isFeatureActive(features, 'seriesStrokes') ? { strokeWidth: SHAPE_STROKE_WIDTH } : {};

/** A line series draws its line in the palette *fill*, leaving only the markers. */
const markerStroke = (features: ChartFeatures) =>
    isFeatureActive(features, 'seriesStrokes') ? { marker: { strokeWidth: MARKER_STROKE_WIDTH } } : {};

/**
 * Crosshairs default on for continuous axes only, so a category x-axis must ask
 * for one or there is no x label to carry `crosshairLabelBackgroundColor`. Band
 * highlight follows the same switch so `bandHighlightColor` has a band to show.
 */
const cartesianAxes = (features: ChartFeatures) => {
    const crosshair = { enabled: isFeatureActive(features, 'crosshairs') };
    return {
        x: { ...CARTESIAN_AXES.x, crosshair, bandHighlight: crosshair },
        y: { ...CARTESIAN_AXES.y, crosshair },
    };
};

/** Applied to every type, so one switch covers bars and donuts alike. */
const commonOptions = (features: ChartFeatures) => ({
    legend: { ...LEGEND, enabled: isFeatureActive(features, 'legend') },
    tooltip: { enabled: isFeatureActive(features, 'tooltip') },
    contextMenu: {
        enabled: isFeatureActive(features, 'contextMenu'),
        items: ['defaults', 'separator', ...PREVIEW_MENU_EXTRA_ITEMS] satisfies AgContextMenuItem[],
    },
});

/** `showZoomButtons` draws them without waiting for a hover. */
const navigationOptions = (features: ChartFeatures, showZoomButtons?: boolean) => ({
    zoom: {
        enabled: isFeatureActive(features, 'zoom'),
        ...(showZoomButtons && { buttons: { visible: 'always' as const } }),
    },
    scrollbar: { enabled: isFeatureActive(features, 'scrollbar') },
    navigator: { enabled: isFeatureActive(features, 'navigator') },
});

/**
 * Shared scaffolding for the four cartesian variants. Typed as cartesian rather
 * than as `AgChartOptions`, or the union stays unnarrowed and the axes fail to
 * type-check against the polar member.
 */
const cartesian = (
    seriesCount: number,
    features: ChartFeatures,
    showZoomButtons: boolean | undefined,
    series: (key: string, name: string) => AgCartesianSeriesOptions
): AgCartesianChartOptions => ({
    data: PREVIEW_DATA,
    title: TITLE,
    subtitle: SUBTITLE,
    series: seriesFor(seriesCount).map(({ key, name }, index) => ({
        ...series(key, name),
        id: previewSeriesId(index),
    })),
    axes: cartesianAxes(features),
    ...navigationOptions(features, showZoomButtons),
    ...commonOptions(features),
});

export const PREVIEW_CHART_TYPES: PreviewChartType[] = [
    {
        id: 'bar',
        label: 'Bar',
        icon: 'chartsColumn',
        countLabel: 'Series',
        features: CARTESIAN_FEATURES,
        tooltipTarget: CARTESIAN_TOOLTIP_TARGET,
        buildOptions: (count, features, showZoomButtons) =>
            cartesian(count, features, showZoomButtons, (key, name) => ({
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
        tooltipTarget: CARTESIAN_TOOLTIP_TARGET,
        buildOptions: (count, features, showZoomButtons) =>
            cartesian(count, features, showZoomButtons, (key, name) => ({
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
        tooltipTarget: CARTESIAN_TOOLTIP_TARGET,
        buildOptions: (count, features, showZoomButtons) =>
            cartesian(count, features, showZoomButtons, (key, name) => ({
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
        tooltipTarget: CARTESIAN_TOOLTIP_TARGET,
        buildOptions: (count, features, showZoomButtons) =>
            cartesian(count, features, showZoomButtons, (key, name) => ({
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
        // The second slice, for the same reason as the second quarter above.
        tooltipTarget: { seriesId: previewSeriesId(0), itemId: 1 },
        buildOptions: (count, features) => ({
            data: totalsFor(count),
            title: { text: 'Revenue by Country' },
            subtitle: { text: 'Full year, figures in millions (USD)' },
            series: [
                {
                    type: 'donut',
                    id: previewSeriesId(0),
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
        /**
         * No series-strokes switch: daily candles render barely a pixel wide,
         * below the three AG Charts needs to draw a body rather than a wick.
         */
        features: [...CARTESIAN_FEATURES.filter((id) => id !== 'seriesStrokes'), 'rangeButtons'],
        tooltipTarget: CANDLESTICK_TOOLTIP_TARGET,
        buildOptions: (_count, features, showZoomButtons) => {
            const crosshair = { enabled: isFeatureActive(features, 'crosshairs') };
            return {
                data: CANDLESTICK_DATA,
                title: { text: 'Acme Corp.' },
                series: [
                    {
                        type: 'candlestick',
                        id: previewSeriesId(0),
                        xKey: 'date',
                        openKey: 'open',
                        highKey: 'high',
                        lowKey: 'low',
                        closeKey: 'close',
                        yName: 'Share Price',
                    },
                ],
                axes: {
                    x: { type: 'ordinal-time', position: 'bottom', crosshair },
                    y: { type: 'number', position: 'right', crosshair },
                },
                ...navigationOptions(features, showZoomButtons),
                ranges: { enabled: isFeatureActive(features, 'rangeButtons') },
                ...commonOptions(features),
            };
        },
    },
];

const DEFAULT_CHART_TYPE = PREVIEW_CHART_TYPES[0];

/** The preview is two charts, each pane choosing its own type. */
export const PREVIEW_PANES = ['left', 'right'] as const;

export type PreviewPaneId = (typeof PREVIEW_PANES)[number];

/** Names the panes apart for screen readers, which otherwise hear one control twice. */
export const PREVIEW_PANE_LABELS: Record<PreviewPaneId, string> = {
    left: 'Left',
    right: 'Right',
};

/**
 * Bars answer for the palette, the axes and the text, and the candlestick pane
 * for the zoom, navigator and range-button chrome.
 */
export const DEFAULT_CHART_TYPE_IDS: Record<PreviewPaneId, string> = {
    left: 'bar',
    right: 'candlestick',
};

// Per pane, so a returning user finds the pairing they left.
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
 * Snapped rather than clamped: the offered counts are sparse, and a stored value
 * between two of them would leave the control showing a count it cannot reselect.
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
 * Per pane like the type, since which features mean anything is decided by the
 * chart showing them - a pane on bars has no navigator to toggle.
 */
const chartFeatureAtoms: Record<PreviewPaneId, PersistentAtom<ChartFeatures>> = {
    left: atomWithJSONStorage<ChartFeatures>('charts-preview-features-left', DEFAULT_CHART_FEATURES),
    right: atomWithJSONStorage<ChartFeatures>('charts-preview-features-right', DEFAULT_CHART_FEATURES),
};

export const usePreviewFeatures = (pane: PreviewPaneId) => useAtom(chartFeatureAtoms[pane]);
