import type { AgMarkerShapeFnParams, _ModuleSupport } from 'ag-charts-community';
import { Color, type InternalAgGradientColor, type NormalisedColorType } from 'ag-charts-core';
import type { CssColor } from 'ag-charts-types';

const LINE_FRACTION = 1 / 7;

interface HlcSymbolLine {
    stroke: CssColor;
    strokeOpacity: number;
    strokeWidth: number;
}

interface HlcSymbolBand extends HlcSymbolLine {
    fill: NormalisedColorType;
    fillOpacity: number;
}

function hlcBandsShape({ path, x, y, size }: AgMarkerShapeFnParams) {
    path.rect(x - size / 2, y - size / 2, size, size);
}

function withOpacity(color: CssColor, opacity: number) {
    // `Color` cannot parse 'none', which is a valid fill and stroke.
    const { r, g, b, a } = Color.fromString(color === 'none' ? 'transparent' : color);
    return new Color(r, g, b, a * opacity).toString();
}

// Gradient, pattern and image fills do not fit in a few pixels, so those bands show their edge colour.
function solidFill({ fill, fillOpacity, stroke }: HlcSymbolBand) {
    return withOpacity(typeof fill === 'string' ? fill : stroke, fillOpacity);
}

// A marker has one fill and stroke, so the lines and bands are sharp stops in a single vertical gradient.
export function hlcBandsMarker(
    high: HlcSymbolBand,
    low: HlcSymbolBand,
    close: HlcSymbolLine
): _ModuleSupport.LegendSymbolOptions['marker'] {
    const highLineEnd = high.strokeWidth > 0 ? LINE_FRACTION : 0;
    const closeStart = close.strokeWidth > 0 ? 0.5 - LINE_FRACTION / 2 : 0.5;
    const closeEnd = close.strokeWidth > 0 ? 0.5 + LINE_FRACTION / 2 : 0.5;
    const lowLineStart = low.strokeWidth > 0 ? 1 - LINE_FRACTION : 1;

    const colorStops: { color: string; stop: number }[] = [];
    const addSection = (color: string, from: number, to: number) => {
        colorStops.push({ color, stop: from }, { color, stop: to });
    };
    addSection(withOpacity(high.stroke, high.strokeOpacity), 0, highLineEnd);
    addSection(solidFill(high), highLineEnd, closeStart);
    addSection(withOpacity(close.stroke, close.strokeOpacity), closeStart, closeEnd);
    addSection(solidFill(low), closeEnd, lowLineStart);
    addSection(withOpacity(low.stroke, low.strokeOpacity), lowLineStart, 1);

    const fill: InternalAgGradientColor = {
        type: 'gradient',
        gradient: 'linear',
        rotation: 180,
        colorStops,
        reverse: false,
    };

    return { shape: hlcBandsShape, fill, fillOpacity: 1, strokeWidth: 0 };
}
