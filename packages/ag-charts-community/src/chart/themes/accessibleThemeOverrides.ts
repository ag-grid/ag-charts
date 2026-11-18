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
    [0], // Solid
    [2, 3], // Dot
    [6, 4], // Dash
    [6, 3, 2, 3], // DashDot
    [14, 4], // LongDash
    [14, 3, 2, 3], // LongDashDot
    [14, 4, 2, 4, 2, 4], // LongDashDotDot
    [6, 3, 2, 3, 2, 3], //DashDotDot
    [6, 4, 14, 4], // *DashLongDash
    [14, 3, 6, 3, 6, 3], // *LongDashDashDash
];

const ACCESSIBLE_PATTERNS: AgPatternName[] = [
    'forward-slanted-lines',
    'vertical-lines',
    'polka-dots',
    'backward-slanted-lines',
    'horizontal-lines',
    'waves',
    'zig-zag',
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

const CONTROL_TARGET_SIZE = 24;

const SOLID_MARKER_FILL: Operation = {
    $if: [{ $isPattern: { $palette: 'fill' } }, { $palette: 'fillFallback' }, { $palette: 'fill' }],
};

const CYCLED_MARKER_SHAPE: Operation = { $palette: 'markerShape' };

// 2px larger than each series' default marker size.
const MARKER_SIZE = 9;
const SMALL_MARKER_SIZE = 8;

const CYCLED_MARKER = { shape: CYCLED_MARKER_SHAPE, fill: SOLID_MARKER_FILL };
const SCATTER_MARKER = { ...CYCLED_MARKER, fillOpacity: TINT_OPACITY, size: MARKER_SIZE };

// The first series is a solid colour, so it is drawn as a tint to match the patterned series' background.
function patternFill(fill: Operation) {
    const fillOpacity: Operation = { $if: [{ $isPattern: fill }, 1, TINT_OPACITY] };
    return { fill, fillOpacity };
}
const PATTERN_FILL = patternFill({ $palette: 'fill' });
const HAS_COLOR_KEY: Operation = { $path: './colorKey' };
const MAP_PALETTE_FILL = patternFill({ $mapPalette: 'fill' });
// A colour scale fill is solid, as it encodes the value.
const MAP_FILL_OPACITY: Operation = { $if: [HAS_COLOR_KEY, 1, MAP_PALETTE_FILL.fillOpacity] };
const MAP_PATTERN_FILL = { ...MAP_PALETTE_FILL, fillOpacity: MAP_FILL_OPACITY };

// With markers off, the marker fill only styles the legend item, which then matches the area.
function areaLegendMarker(markersEnabled: Operation) {
    const fill: Operation = { $if: [markersEnabled, SOLID_MARKER_FILL, { $path: '../fill' }] };
    const fillOpacity: Operation = { $if: [markersEnabled, 1, { $path: '../fillOpacity' }] };
    return { ...CYCLED_MARKER, fill, fillOpacity, size: SMALL_MARKER_SIZE };
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
// A colour scale fills each shape by value, so a series-colour outline would misrepresent it.
const MAP_SHAPE_STROKE: Operation = { $if: [HAS_COLOR_KEY, BACKGROUND_STROKE, MAP_PALETTE_STROKE] };
const MAP_SERIES_STROKE = { ...STROKE, stroke: MAP_SHAPE_STROKE };

// Series label inside the shape, so the label colour must meet 3:1 against the shape fill, which is a tint of the series colour.
const SERIES_LABEL_INSIDE_FILL = {
    color: { $ref: 'textColor' },
    fill: { $ref: 'chartBackgroundColor' },
    fillOpacity: 0.8,
    padding: 4,
} as const;

const ACCESSIBLE_THEME_OVERRIDES: WithThemeParams<AgThemeOverrides> = {
    common: {
        legend: {
            pagination: {
                marker: { size: CONTROL_TARGET_SIZE },
                inactiveStyle: {
                    fill: { $ref: 'buttonDisabledTextColor' },
                    stroke: { $ref: 'buttonDisabledTextColor' },
                },
            },
        },
        navigator: { minHandle: NAVIGATOR_HANDLE, maxHandle: NAVIGATOR_HANDLE },
        scrollbar: { thumb: { minSize: CONTROL_TARGET_SIZE } },
        zoom: { buttons: { visible: 'always', buttonSize: CONTROL_TARGET_SIZE } },
        ranges: {
            buttonSize: CONTROL_TARGET_SIZE,
            button: {
                active: {
                    stroke: { $ref: 'accentColor' },
                    fill: { $ref: 'accentColor' },
                    textColor: { $ref: 'backgroundColor' },
                },
            },
        },
        chartToolbar: { buttonSize: CONTROL_TARGET_SIZE },
        // align with current default of 34px
        annotations: { toolbar: { buttonSize: 34 } },
        loadGoogleFonts: true,
    },
    line: {
        series: { marker: { enabled: false, ...CYCLED_MARKER, size: MARKER_SIZE }, strokeWidth: 2 },
        legend: { item: { line: { length: 48 }, marker: { size: 12 } } },
    },
    area: {
        series: { ...STROKE, ...PATTERN_FILL, marker: { ...CYCLED_MARKER, size: MARKER_SIZE } },
        legend: { item: { showSeriesStroke: false, marker: { shape: 'square', ...STROKE } } },
    },
    scatter: { series: SCATTER_MARKER },
    bubble: { series: { ...PATTERN_FILL, minSize: MARKER_SIZE } },
    'box-plot': { series: PATTERN_FILL },
    'range-area': {
        series: { ...PATTERN_FILL, marker: RANGE_AREA_MARKER, ...STROKE },
        legend: { item: { showSeriesStroke: false, marker: { shape: 'square', ...STROKE } } },
    },
    'radar-line': { series: { marker: { ...CYCLED_MARKER, size: SMALL_MARKER_SIZE } } },
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
    'map-marker': { series: { ...MAP_PATTERN_FILL, size: MARKER_SIZE } },
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
    hlc: { series: { marker: { size: SMALL_MARKER_SIZE } } },
    ohlc: { series: { item: { up: { strokeWidth: 2 }, down: { strokeWidth: 2 } } } },
    candlestick: { series: { item: { up: { strokeWidth: 2 }, down: { strokeWidth: 2, fillOpacity: TINT_OPACITY } } } },
};

export function withAccessibleOverrides(options: AgChartTheme): AgChartTheme {
    return { ...options, overrides: mergeDefaultsShallowOperations(options.overrides, ACCESSIBLE_THEME_OVERRIDES) };
}

const SEPARATOR_PRIMARY: Operation = { $foregroundBackgroundMix: 0.8 };
const SEPARATOR_SECONDARY: Operation = { $foregroundBackgroundMix: 0.5 };
const SEPARATOR_TERTIARY: Operation = { $foregroundBackgroundMix: 0.2 };
const CONTROL_BORDER_WIDTH = 2;
const BORDER_RADIUS = 0;

interface AccessibleColors {
    accentColor: string;
    foregroundColor: string;
    backgroundColor?: string;
    subtleTextMix: number;
}

export function accessibleThemeParameters({
    accentColor,
    foregroundColor,
    backgroundColor,
    subtleTextMix,
}: AccessibleColors) {
    const backgroundMix = 1 - subtleTextMix;
    return {
        accentColor,
        axisLineColor: SEPARATOR_SECONDARY,
        // axisLineWidth: CONTROL_BORDER_WIDTH,
        gridLineColor: SEPARATOR_TERTIARY,
        foregroundColor,
        ...(backgroundColor == null ? {} : { backgroundColor }),
        fontFamily: [
            { googleFont: 'Atkinson Hyperlegible Next' },
            '-apple-system',
            'system-ui',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'sans-serif',
        ],
        titleFontSize: 20,
        fontSize: 14,
        borderColor: SEPARATOR_SECONDARY,
        borderRadius: BORDER_RADIUS,
        chromeBackgroundColor: { $foregroundBackgroundMix: 0.025 },
        focusShadow: '0 0 0 3px color-mix(in srgb, var(--ag-charts-accent-color) 75%, transparent)',
        subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'chartBackgroundColor' }, backgroundMix] },
        chromeSubtleTextColor: { $mix: [{ $ref: 'chromeTextColor' }, { $ref: 'backgroundColor' }, backgroundMix] },
        inputPlaceholderTextColor: { $ref: 'subtleTextColor' },
        inputBorder: { color: SEPARATOR_PRIMARY, width: CONTROL_BORDER_WIDTH },
        buttonBorder: { color: SEPARATOR_PRIMARY, width: CONTROL_BORDER_WIDTH },
        buttonActiveBorder: { color: { $ref: 'accentColor' }, width: CONTROL_BORDER_WIDTH },
        buttonTextColor: { $ref: 'foregroundColor' },
        buttonActiveTextColor: { $ref: 'buttonTextColor' },
        buttonDisabledBackgroundColor: { $foregroundBackgroundMix: 0.1 },
        buttonDisabledBorder: false,
        buttonDisabledTextColor: SEPARATOR_SECONDARY,
        legendMarkerSize: 18,
        // legendItemVerticalPadding: 4,
        scrollbarThickness: 24,
        scrollbarTrackBorderRadius: BORDER_RADIUS,
        scrollbarTrackBackgroundColor: { $ref: 'backgroundColor' },
        scrollbarTrackBorder: { color: SEPARATOR_PRIMARY, width: CONTROL_BORDER_WIDTH },
        scrollbarThumbBorderRadius: BORDER_RADIUS,
        scrollbarThumbBorder: { color: SEPARATOR_PRIMARY, width: CONTROL_BORDER_WIDTH },
        scrollbarThumbBackgroundColor: { $ref: 'subtleTextColor' },
        scrollbarThumbHoverBackgroundColor: { $ref: 'foregroundColor' },
        seriesLabelInsideTextColor: { $ref: 'textColor' },
        seriesLabelInsideBackgroundColor: { $ref: 'chartBackgroundColor' },
        seriesLabelFontSize: 16,
        axisLabelColor: { $ref: 'subtleTextColor' },
        // axisLabelFontSize: 14,
        axisTitleColor: { $ref: 'subtleTextColor' },
        // axisTitleFontSize: 14,
        axisTitleFontWeight: 500,
        navigatorHandleBorder: { color: SEPARATOR_PRIMARY, width: CONTROL_BORDER_WIDTH },
        // TODO: request new parameter: tooltipLabelFontSize
        // tooltipLabelFontSize: 16,
    } satisfies Partial<WithThemeParams<AgChartAllThemeParams>>;
}
