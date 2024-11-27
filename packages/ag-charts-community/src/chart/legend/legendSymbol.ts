import type { AgMarkerShape } from 'ag-charts-types';

import type { Gradient } from '../../scene/gradient/gradient';
import { Group } from '../../scene/group';
import { Line } from '../../scene/shape/line';
import { getMarker } from '../marker/util';

export interface LegendMarker {
    shape?: AgMarkerShape;
    fill?: string | Gradient;
    fillOpacity: number;
    stroke?: string | Gradient;
    strokeOpacity: number;
    strokeWidth: number;
    enabled?: boolean;
}

export interface LegendLine {
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
}

export interface LegendSymbolOptions {
    marker: LegendMarker;
    line?: LegendLine;
}

export function legendSymbolSvg(symbol: LegendSymbolOptions, size: number, lineSize = size * (5 / 3)) {
    const group = new Group();

    const markerSize = Math.ceil(size + symbol.marker.strokeWidth);
    const width = Math.max(symbol.marker.enabled === false ? 0 : markerSize, symbol.line == null ? 0 : lineSize);
    const height = Math.max(
        symbol.marker.enabled === false ? 0 : markerSize,
        symbol.line == null ? 0 : symbol.line.strokeWidth
    );

    if (symbol.line != null) {
        const { stroke, strokeOpacity, strokeWidth, lineDash } = symbol.line;
        const line = new Line();
        line.x1 = 0;
        line.y1 = height / 2;
        line.x2 = width;
        line.y2 = height / 2;
        line.stroke = stroke;
        line.strokeOpacity = strokeOpacity;
        line.strokeWidth = strokeWidth;
        line.lineDash = lineDash;
        group.append(line);
    }

    if (symbol.marker.enabled !== false) {
        const { shape, fill, fillOpacity, stroke, strokeOpacity, strokeWidth } = symbol.marker;
        const Marker = getMarker(shape);
        const marker = new Marker();
        const { center } = Marker;
        marker.size = size;
        marker.x = 0;
        marker.y = 0;
        marker.translationX = width / 2 + (center.x - 0.5) * size;
        marker.translationY = height / 2 + (center.y - 0.5) * size;
        marker.fill = fill;
        marker.fillOpacity = fillOpacity;
        marker.stroke = stroke;
        marker.strokeOpacity = strokeOpacity;
        marker.strokeWidth = strokeWidth;
        group.append(marker);
    }

    return Group.toSVG(group, width, height);
}
