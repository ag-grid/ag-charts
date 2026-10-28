import type { Group, Shape } from 'ag-charts-core';
import type { AgDropShadowOptions, AgGlowOptions, AgMarkerShapeFn } from 'ag-charts-types';

/** The shadow the marker shadow tests turn on. */
export const MARKER_SHADOW: AgDropShadowOptions = { enabled: true, fill: '#000000', xOffset: 4, yOffset: 4, blur: 6 };

/** The series-level shadow the highlight tests turn on. */
export const SERIES_SHADOW: AgDropShadowOptions = {
    enabled: true,
    fill: '#112233',
    xOffset: 4,
    yOffset: 4,
    blur: 6,
};

/** The glow the highlight tests turn on, distinct from `SERIES_SHADOW` in every field. */
export const HIGHLIGHT_GLOW: AgGlowOptions = { enabled: true, fill: '#00aa00', fillOpacity: 1, blur: 3, spread: 2 };

/** The shadow a glow casts: the same blurred silhouette as a shadow, centred on the item. */
export const glowShadow = (glow: AgGlowOptions) => ({ ...glow, xOffset: 0, yOffset: 0 });

export const XY_DATA = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
export const CATEGORY_DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
export const HISTOGRAM_DATA = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

/** The shapes of class `kind` under `root`, in scene order. */
export function shapesOf<T extends Shape>(root: Group, kind: abstract new (...args: any[]) => T): T[] {
    const found: T[] = [];
    for (const node of root.descendants()) {
        if (node instanceof kind) found.push(node);
    }
    return found;
}

/** A custom marker shape (a triangle), which the out-of-the-box marker shadow must not apply to. */
export const customMarkerShape: AgMarkerShapeFn = ({ path, x, y, size }) => {
    path.moveTo(x - size / 2, y - size / 2);
    path.lineTo(x + size / 2, y - size / 2);
    path.lineTo(x, y + size / 2);
    path.closePath();
};

/**
 * The highlight the legend raises for the series' first legend item: per stage or sector, or the whole series.
 * Series without legend items, like a treemap or a heatmap with a colour scale, have nothing to hover.
 */
export const legendHighlight = (series: any) => {
    const [legendDatum] = series.getLegendData('category');
    if (legendDatum == null) return undefined;
    const { itemId, legendItemName } = legendDatum;
    return typeof itemId === 'number'
        ? { series, itemId: undefined, datum: undefined, datumIndex: itemId, legendItemName }
        : { series, itemId, datum: undefined, datumIndex: Number.NaN, legendItemName };
};
