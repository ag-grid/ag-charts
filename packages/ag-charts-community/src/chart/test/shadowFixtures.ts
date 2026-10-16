import type { AgDropShadowOptions, AgMarkerShapeFn } from 'ag-charts-types';

/** The shadow the marker shadow tests turn on. */
export const MARKER_SHADOW: AgDropShadowOptions = { enabled: true, color: '#000000', xOffset: 4, yOffset: 4, blur: 6 };

/** The series-level shadow the highlight tests turn on. */
export const SERIES_SHADOW: AgDropShadowOptions = {
    enabled: true,
    color: '#112233',
    xOffset: 4,
    yOffset: 4,
    blur: 6,
};

/** The shadow the highlight tests set on `highlightedItem`, distinct from `SERIES_SHADOW` in every field. */
export const HIGHLIGHT_SHADOW: AgDropShadowOptions = {
    enabled: true,
    color: '#aa0000',
    xOffset: 8,
    yOffset: 8,
    blur: 2,
};

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
