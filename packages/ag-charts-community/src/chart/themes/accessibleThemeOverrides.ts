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
    'squares',
    'criss-cross',
    'triangles',
    'diamonds',
];

const POLKA_DOTS: Partial<AgPatternColor> = { width: 8, height: 8, strokeWidth: 0 };

const TINT_OPACITY = 0.2;

/**
 * The first series is a solid colour, the second a tint of its colour, and each later one a tint overlaid with
 * a pattern in its colour. The tint is a pattern that draws nothing, so lines and markers keep the solid colour.
 */
function accessiblePatternFills(colors: string[]): Array<string | AgPatternColor> {
    return colors.map((color, index) => {
        if (index === 0) return color;

        const tint: AgPatternColor = {
            type: 'pattern',
            fill: color,
            fillOpacity: 0,
            stroke: color,
            strokeWidth: 0,
            backgroundFill: color,
            backgroundFillOpacity: TINT_OPACITY,
        };
        if (index === 1) return tint;

        const pattern = ACCESSIBLE_PATTERNS[(index - 2) % ACCESSIBLE_PATTERNS.length];
        return {
            ...tint,
            pattern,
            fillOpacity: 1,
            strokeWidth: 1,
            strokeOpacity: 1,
            ...(pattern === 'polka-dots' ? POLKA_DOTS : undefined),
        };
    });
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

const NAVIGATOR_HANDLE = { width: CONTROL_TARGET_SIZE, height: CONTROL_TARGET_SIZE };

// Outlines each filled shape in its series colour, which meets 3:1 against the background.
const STROKE = { strokeWidth: 1 };

const GAUGE_BAR_STROKE: Operation = { $ref: 'foregroundColor' };

// These series stroke in the chart background colour to separate shapes, which leaves no outline against it.
const PALETTE_STROKE: Operation = { $palette: 'stroke' };
const BACKGROUND_STROKE: Operation = { $ref: 'chartBackgroundColor' };
const MAP_PALETTE_STROKE: Operation = { $mapPalette: 'stroke' };
const SERIES_STROKE = { ...STROKE, stroke: PALETTE_STROKE };
const MAP_SERIES_STROKE = { ...STROKE, stroke: MAP_PALETTE_STROKE };

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
    line: { series: { marker: CYCLED_MARKER } },
    area: { series: { ...STROKE, marker: CYCLED_MARKER } },
    scatter: { series: CYCLED_MARKER },
    bubble: { series: CYCLED_MARKER },
    'range-area': { series: { marker: CYCLED_MARKER } },
    'radar-line': { series: { marker: CYCLED_MARKER } },
    'radar-area': { series: { marker: CYCLED_MARKER } },
    bar: { series: STROKE },
    'range-bar': { series: STROKE },
    waterfall: { series: { item: { positive: STROKE, negative: STROKE, total: STROKE } } },
    heatmap: { series: { ...STROKE, stroke: BACKGROUND_STROKE } },
    nightingale: { series: SERIES_STROKE },
    'map-shape': { series: MAP_SERIES_STROKE },
    pie: { series: STROKE },
    donut: { series: STROKE },
    'radial-bar': { series: STROKE },
    'radial-column': { series: STROKE },
    treemap: { series: { tile: STROKE } },
    sunburst: { series: STROKE },
    sankey: { series: { node: STROKE, link: STROKE } },
    chord: { series: { node: STROKE, link: STROKE } },
    funnel: { series: STROKE },
    'cone-funnel': { series: STROKE },
    pyramid: { series: STROKE },
    'radial-gauge': { bar: { ...STROKE, stroke: GAUGE_BAR_STROKE } },
    'linear-gauge': { bar: { ...STROKE, stroke: GAUGE_BAR_STROKE } },
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
