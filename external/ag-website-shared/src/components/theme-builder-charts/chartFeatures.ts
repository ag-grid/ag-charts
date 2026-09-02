/**
 * The chart features the preview can turn on, and which of them each chart type
 * can actually show.
 *
 * These exist because most of what the editor panel themes has no surface in a
 * plain chart. Three whole groups of params - Chrome, Buttons & Inputs, Menus &
 * Panels - only reach the screen through a toolbar, a menu or a settings panel,
 * so without a way to summon those, half the tool edits values the user cannot
 * see. The palette has the same problem in miniature: a chart resolves its
 * series stroke width to zero unless asked, so the strokes column edits colours
 * that never appear. Every feature here is one that puts otherwise-invisible
 * values on screen.
 *
 * Deliberately not a list of everything a chart can do: a feature earns a place
 * only if switching it on changes something the editor panel can edit.
 */
export const CHART_FEATURE_IDS = [
    'seriesStrokes',
    'legend',
    'crosshairs',
    'contextMenu',
    'zoom',
    'navigator',
    'rangeButtons',
    'toolbar',
    'statusBar',
    'volume',
] as const;

export type ChartFeatureId = (typeof CHART_FEATURE_IDS)[number];

export type ChartFeatures = Partial<Record<ChartFeatureId, boolean>>;

export interface ChartFeatureConfig {
    id: ChartFeatureId;
    label: string;
    /** What it puts on screen, since half of these are invisible until used. */
    hint: string;
    /**
     * A feature this one cannot work without. The chart quietly ignores such a
     * feature when its requirement is off, which would leave a ticked checkbox
     * with nothing behind it - so the popup disables it and says why instead.
     */
    requires?: ChartFeatureId;
}

export const CHART_FEATURES: ChartFeatureConfig[] = [
    {
        id: 'seriesStrokes',
        label: 'Series Strokes',
        hint: 'Outlines each series in its palette stroke, which most charts hide by default',
    },
    { id: 'legend', label: 'Legend', hint: 'Series names, and its pager once they overflow' },
    { id: 'crosshairs', label: 'Crosshairs', hint: 'Axis labels on hover - hover the chart to see them' },
    { id: 'contextMenu', label: 'Context Menu', hint: 'Menu colours - right-click the chart to open it' },
    { id: 'zoom', label: 'Zoom', hint: 'Zoom buttons, and scrolling to zoom' },
    { id: 'navigator', label: 'Navigator', hint: 'The scrollbar and mini chart below the axis' },
    {
        id: 'rangeButtons',
        label: 'Range Buttons',
        hint: 'The 1M / 3M / 1Y row - chrome colours and fonts',
        // A range button sets a zoom, so the chart drops the row without one.
        requires: 'zoom',
    },
    { id: 'toolbar', label: 'Drawing Tools', hint: 'The annotation toolbar, its buttons and settings panel' },
    { id: 'statusBar', label: 'Status Bar', hint: 'The open / high / low / close readout above the chart' },
    { id: 'volume', label: 'Volume', hint: 'A second series and axis below the price' },
];

/**
 * On by default, because a feature nobody switches on is a param nobody sees.
 * Volume is the exception: it takes a fifth of the plot height for a series the
 * theme treats no differently from any other.
 *
 * That applies to series strokes with particular force - they are the one thing
 * here most charts will not draw on their own, so left off the palette's strokes
 * column would look broken rather than subtle. The cost is that the preview is
 * not what a plain chart of the same theme draws, which is what the hint on the
 * checkbox is for.
 */
export const DEFAULT_CHART_FEATURES: ChartFeatures = {
    seriesStrokes: true,
    legend: true,
    crosshairs: true,
    contextMenu: true,
    zoom: true,
    navigator: true,
    rangeButtons: true,
    toolbar: true,
    statusBar: true,
    volume: false,
};

const FEATURE_BY_ID: Record<ChartFeatureId, ChartFeatureConfig> = Object.fromEntries(
    CHART_FEATURES.map((feature) => [feature.id, feature])
) as Record<ChartFeatureId, ChartFeatureConfig>;

/** What the user last chose, for a record that may predate the feature. */
export const isFeatureEnabled = (features: ChartFeatures, id: ChartFeatureId): boolean =>
    features[id] ?? DEFAULT_CHART_FEATURES[id] ?? false;

/**
 * What the chart will actually show: chosen, and with anything it depends on
 * chosen too.
 *
 * The choice itself is kept either way rather than being written back as false,
 * so switching zoom off and on again returns the range buttons the user had.
 */
export const isFeatureActive = (features: ChartFeatures, id: ChartFeatureId): boolean => {
    const { requires } = FEATURE_BY_ID[id];
    return isFeatureEnabled(features, id) && (requires == null || isFeatureActive(features, requires));
};
