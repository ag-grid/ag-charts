import type { LineDashOptions, StrokeOptions } from 'ag-charts-types';

import type { FontOptions } from '../../util/textMeasurer';

export function setSvgFontAttributes(element: SVGElement, options: FontOptions) {
    const { fontStyle, fontWeight, fontSize, fontFamily } = options;
    if (fontStyle) element.setAttribute('font-style', fontStyle);
    if (fontWeight) element.setAttribute('font-weight', String(fontWeight));
    if (fontSize != null) element.setAttribute('font-size', String(fontSize));
    if (fontFamily) element.setAttribute('font-family', fontFamily);
}

export function setSvgStrokeAttributes(element: SVGElement, options: StrokeOptions) {
    const { stroke, strokeWidth, strokeOpacity } = options;
    if (stroke) element.setAttribute('stroke', stroke);
    if (strokeWidth != null) element.setAttribute('stroke-width', String(strokeWidth));
    if (strokeOpacity != null) element.setAttribute('stroke-opacity', String(strokeOpacity));
}

export function setSvgLineDashAttributes(element: SVGElement, options: LineDashOptions) {
    const { lineDash, lineDashOffset } = options;
    if (lineDash?.some((d) => d !== 0)) {
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#segments
        // If the number of elements in the array is odd, the elements of the array get copied and concatenated
        const lineDashArray = lineDash.length % 2 === 1 ? [...lineDash, ...lineDash] : lineDash;
        element.setAttribute('stroke-dasharray', lineDashArray.join(' '));
        if (lineDashOffset != null) element.setAttribute('stroke-dashoffset', String(lineDashOffset));
    }
}
