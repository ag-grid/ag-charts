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
