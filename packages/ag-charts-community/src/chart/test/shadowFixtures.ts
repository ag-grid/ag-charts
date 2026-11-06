import { Group, Shape } from 'ag-charts-core';
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

/** The series-level glow, with every field set, so that a bucket's field shows through only where it overrides. */
export const SERIES_GLOW: AgGlowOptions = { enabled: true, fill: '#aa0000', fillOpacity: 0.5, blur: 5, spread: 3 };

/** What a glow with no fields of its own casts, from the glow theme defaults. */
export const THEME_GLOW = { enabled: true, fillOpacity: 0.4, blur: 2, spread: 4 };

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

/**
 * What holds an enabled glow in a group under `root` that does not cast it, as a label for each: the shape and its group.
 * Only a batching or shared group casts the glow of a shape, other than a cutout, which casts its own: a shape in any
 * other group reads as glowing and draws nothing. Labels, as a failed assertion on the shapes would print the scene.
 */
export function uncastGlows(root: Group): string[] {
    return shapesOf(root, Shape)
        .filter(
            (shape) =>
                shape.fillGlow?.enabled === true &&
                shape.__drawingMode !== 'cutout' &&
                !(shape.parentNode instanceof Group && shape.parentNode.batchShadows !== false)
        )
        .map(
            (shape) =>
                `${shape.constructor.name} in ${shape.parentNode?.constructor.name} "${(shape.parentNode as Group | undefined)?.name}"`
        );
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
