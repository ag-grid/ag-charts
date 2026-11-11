import { drawMarkerUnitPolygon, getSequentialColors, mergeDefaultsShallowOperations } from 'ag-charts-core';
import type {
    AgChartAllThemeParams,
    AgChartTheme,
    AgMarkerShape,
    AgMarkerShapeFn,
    AgPatternColor,
    AgPatternName,
    AgThemeOverrides,
    Operation,
    WithThemeParams,
} from 'ag-charts-types';

import type { DefaultColors } from './defaultColors';

const triangleDown: AgMarkerShapeFn = (params) => {
    drawMarkerUnitPolygon(params, [
        [0, 0.13],
        [1, 0.13],
        [0.5, 1],
    ]);
};

const hourglass: AgMarkerShapeFn = (params) => {
    drawMarkerUnitPolygon(params, [
        [0, 0],
        [1, 0],
        [0.5, 0.5],
        [1, 1],
        [0, 1],
        [0.5, 0.5],
    ]);
};

const ACCESSIBLE_MARKER_SHAPES: AgMarkerShape[] = [
    'circle',
    'square',
    'triangle',
    'diamond',
    'cross',
    'star',
    'plus',
    'heart',
    triangleDown,
    hourglass,
];

const ACCESSIBLE_LINE_DASHES: number[][] = [
    [0],
    [6, 4],
    [2, 3],
    [10, 3, 2, 3],
    [14, 4],
    [10, 3, 2, 3, 2, 3],
    [2, 7],
    [18, 4, 4, 4],
    [8, 3, 8, 3, 2, 3],
    [4, 2],
];

const ACCESSIBLE_PATTERNS: AgPatternName[] = [
    'forward-slanted-lines',
    'polka-dots',
    'waves',
    'backward-slanted-lines',
    'zig-zag',
    'vertical-lines',
    'horizontal-lines',
    'circles',
    'criss-cross',
    // 'squares',
    // 'triangles',
    // 'diamonds',
];

// Patterns have no dash option, so dashed lines are a custom path sized to the 10px tile.
const PATTERN_STYLES: Partial<Record<AgPatternName, Partial<AgPatternColor>>> = {
    'polka-dots': { width: 8, height: 8, strokeWidth: 0 },
    waves: { width: 14 },
    'vertical-lines': { width: 10, height: 10, path: 'M4.5 0V5' },
    'horizontal-lines': { width: 10, height: 10, path: 'M0 4.5H5' },
    circles: { fillOpacity: 0 },
};

const TINT_OPACITY = 0.2;

/** The first series is a solid colour and each later one a tint of its colour overlaid with a pattern in its colour. */
function accessiblePatternFills(colors: string[]): Array<string | AgPatternColor> {
    return colors.map((color, index) =>
        index === 0 ? color : patternedFill(color, ACCESSIBLE_PATTERNS[(index - 1) % ACCESSIBLE_PATTERNS.length])
    );
}

function patternedFill<C extends string | Operation>(color: C, pattern: AgPatternName) {
    return {
        type: 'pattern' as const,
        pattern,
        fill: color,
        fillOpacity: 1,
        stroke: color,
        strokeWidth: 1,
        strokeOpacity: 1,
        backgroundFill: color,
        backgroundFillOpacity: TINT_OPACITY,
        ...PATTERN_STYLES[pattern],
    };
}

export function accessiblePalette(
    colors: Record<string, string>
): Pick<
    DefaultColors,
    'fills' | 'paletteFills' | 'fillsFallback' | 'markerShapes' | 'lineDashes' | 'sequentialColors'
> {
    const fills = Object.values(colors);
    return {
        fills: colors,
        paletteFills: accessiblePatternFills(fills),
        fillsFallback: fills,
        markerShapes: ACCESSIBLE_MARKER_SHAPES,
        lineDashes: ACCESSIBLE_LINE_DASHES,
        sequentialColors: getSequentialColors(colors),
    };
}

const CONTROL_TARGET_SIZE = 44;

const SOLID_MARKER_FILL: Operation = {
    $if: [{ $isPattern: { $palette: 'fill' } }, { $palette: 'fillFallback' }, { $palette: 'fill' }],
};

const CYCLED_MARKER_SHAPE: Operation = { $palette: 'markerShape' };

const CYCLED_MARKER = { shape: CYCLED_MARKER_SHAPE, fill: SOLID_MARKER_FILL };
const SCATTER_MARKER = { ...CYCLED_MARKER, fillOpacity: TINT_OPACITY };

// The first series is a solid colour, so it is drawn as a tint to match the patterned series' background.
function patternFill(fill: Operation) {
    const fillOpacity: Operation = { $if: [{ $isPattern: fill }, 1, TINT_OPACITY] };
    return { fill, fillOpacity };
}
const PATTERN_FILL = patternFill({ $palette: 'fill' });
const MAP_PATTERN_FILL = patternFill({ $mapPalette: 'fill' });

// With markers off, the marker fill only styles the legend item, which then matches the area.
function areaLegendMarker(markersEnabled: Operation) {
    const fill: Operation = { $if: [markersEnabled, SOLID_MARKER_FILL, { $path: '../fill' }] };
    const fillOpacity: Operation = { $if: [markersEnabled, 1, { $path: '../fillOpacity' }] };
    return { ...CYCLED_MARKER, fill, fillOpacity };
}
const RADAR_AREA_MARKER = areaLegendMarker({ $path: './enabled' });
const RANGE_AREA_MARKER = areaLegendMarker({
    $or: [{ $path: '../item/low/marker/enabled' }, { $path: '../item/high/marker/enabled' }],
});

const NAVIGATOR_HANDLE = { width: CONTROL_TARGET_SIZE, height: CONTROL_TARGET_SIZE };

// Outlines each filled shape in its series colour, which meets 3:1 against the background.
const STROKE = { strokeWidth: 1 };

const GAUGE_BAR_STROKE: Operation = { $ref: 'foregroundColor' };

const NEUTRAL_FILL: Operation = { $palette: 'neutral.fill' };

// These series stroke in the chart background colour to separate shapes, which leaves no outline against it.
const PALETTE_STROKE: Operation = { $palette: 'stroke' };
const BACKGROUND_STROKE: Operation = { $ref: 'chartBackgroundColor' };
const MAP_PALETTE_STROKE: Operation = { $mapPalette: 'stroke' };
const SERIES_STROKE = { ...STROKE, stroke: PALETTE_STROKE };
const MAP_SERIES_STROKE = { ...STROKE, stroke: MAP_PALETTE_STROKE };

// Series label inside the shape, so the label colour must meet 3:1 against the shape fill, which is a tint of the series colour.
const SERIES_LABEL_INSIDE_FILL = {
    color: { $ref: 'textColor' },
    fill: { $ref: 'chartBackgroundColor' },
    fillOpacity: 0.8,
    padding: 4,
} as const;

const ACCESSIBLE_THEME_OVERRIDES: WithThemeParams<AgThemeOverrides> = {
    common: {
        legend: { pagination: { marker: { size: 24 } } },
        navigator: { minHandle: NAVIGATOR_HANDLE, maxHandle: NAVIGATOR_HANDLE },
        scrollbar: { thumb: { minSize: CONTROL_TARGET_SIZE } },
        zoom: { buttons: { visible: 'always', buttonSize: CONTROL_TARGET_SIZE } },
        ranges: { buttonSize: CONTROL_TARGET_SIZE },
        chartToolbar: { buttonSize: CONTROL_TARGET_SIZE },
        annotations: { toolbar: { buttonSize: CONTROL_TARGET_SIZE } },
    },
    line: {
        series: { marker: { enabled: false, ...CYCLED_MARKER }, strokeWidth: 2 },
        legend: { item: { line: { length: 48 }, marker: { size: 12 } } },
    },
    area: {
        series: { ...STROKE, ...PATTERN_FILL, marker: CYCLED_MARKER },
        legend: { item: { showSeriesStroke: false, marker: { shape: 'square', ...STROKE } } },
    },
    scatter: { series: SCATTER_MARKER },
    bubble: { series: PATTERN_FILL },
    'box-plot': { series: PATTERN_FILL },
    'range-area': {
        series: { ...PATTERN_FILL, marker: RANGE_AREA_MARKER, ...STROKE },
        legend: { item: { showSeriesStroke: false, marker: { shape: 'square', ...STROKE } } },
    },
    'radar-line': { series: { marker: CYCLED_MARKER } },
    'radar-area': {
        series: { ...PATTERN_FILL, marker: RADAR_AREA_MARKER, ...STROKE },
        legend: { item: { showSeriesStroke: false, marker: { shape: 'square', ...STROKE } } },
    },
    bar: { series: STROKE },
    'range-bar': { series: STROKE },
    waterfall: {
        series: {
            item: {
                positive: STROKE,
                negative: { fillOpacity: TINT_OPACITY, ...STROKE },
                total: { ...STROKE, fill: patternedFill(NEUTRAL_FILL, ACCESSIBLE_PATTERNS[0]) },
            },
            line: { strokeWidth: 1 },
        },
    },
    heatmap: { series: { ...STROKE, stroke: BACKGROUND_STROKE } },
    nightingale: { series: SERIES_STROKE },
    'map-shape': { series: { ...MAP_SERIES_STROKE, ...MAP_PATTERN_FILL } },
    'map-marker': { series: MAP_PATTERN_FILL },
    pie: { series: STROKE },
    donut: { series: STROKE },
    'radial-bar': { series: STROKE },
    'radial-column': { series: STROKE },
    treemap: {
        series: {
            tile: {
                label: SERIES_LABEL_INSIDE_FILL,
                secondaryLabel: SERIES_LABEL_INSIDE_FILL,
                ...STROKE,
            },
        },
    },
    sunburst: { series: { ...STROKE, label: SERIES_LABEL_INSIDE_FILL, secondaryLabel: SERIES_LABEL_INSIDE_FILL } },
    sankey: { series: { node: STROKE, link: STROKE } },
    chord: { series: { node: STROKE, link: STROKE } },
    funnel: { series: STROKE },
    'cone-funnel': { series: STROKE },
    pyramid: { series: STROKE },
    'radial-gauge': { bar: { ...STROKE, stroke: GAUGE_BAR_STROKE } },
    'linear-gauge': { bar: { ...STROKE, stroke: GAUGE_BAR_STROKE } },
    ohlc: { series: { item: { up: { strokeWidth: 2 }, down: { strokeWidth: 2 } } } },
    candlestick: { series: { item: { up: { strokeWidth: 2 }, down: { strokeWidth: 2, fillOpacity: TINT_OPACITY } } } },
};

export function withAccessibleOverrides(options: AgChartTheme): AgChartTheme {
    return { ...options, overrides: mergeDefaultsShallowOperations(options.overrides, ACCESSIBLE_THEME_OVERRIDES) };
}

export function accessibleThemeParameters(accentColor: string) {
    return {
        accentColor,
        focusShadow: '0 0 0 3px var(--ag-charts-accent-color)',
        subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'chartBackgroundColor' }, 0.2] },
        chromeSubtleTextColor: { $mix: [{ $ref: 'chromeTextColor' }, { $ref: 'backgroundColor' }, 0.2] },
        inputPlaceholderTextColor: { $mix: [{ $ref: 'inputTextColor' }, { $ref: 'inputBackgroundColor' }, 0.2] },
        buttonActiveTextColor: { $ref: 'buttonTextColor' },
        legendMarkerSize: 16,
        legendItemVerticalPadding: 14,
        scrollbarThickness: 24,
        seriesLabelInsideTextColor: { $ref: 'textColor' },
        seriesLabelInsideBackgroundColor: { $ref: 'chartBackgroundColor' },
    } satisfies Partial<WithThemeParams<AgChartAllThemeParams>>;
}
