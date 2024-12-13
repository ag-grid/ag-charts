import type { AgMarkerShape } from 'ag-charts-types';

import type { Gradient } from '../../scene/gradient/gradient';
import { Group } from '../../scene/group';
import { Line } from '../../scene/shape/line';
import { Marker } from '../marker/marker';

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

    const markerStrokeWidth = Math.min(symbol.marker.strokeWidth, 2);
    const lineStrokeWidth = Math.min(symbol.line?.strokeWidth ?? 0, 2);

    const width = Math.max(symbol.marker.enabled === false ? 0 : size, symbol.line == null ? 0 : lineSize);
    const height = Math.max(symbol.marker.enabled === false ? 0 : size, lineStrokeWidth);

    if (symbol.line != null) {
        const { stroke, strokeOpacity, lineDash } = symbol.line;
        const line = new Line();
        line.x1 = 0;
        line.y1 = height / 2;
        line.x2 = width;
        line.y2 = height / 2;
        line.stroke = stroke;
        line.strokeOpacity = strokeOpacity;
        line.strokeWidth = lineStrokeWidth;
        line.lineDash = lineDash;
        group.append(line);
    }

    if (symbol.marker.enabled !== false) {
        const { shape, fill, fillOpacity, stroke, strokeOpacity } = symbol.marker;
        const marker = new Marker();
        marker.shape = shape;
        marker.size = size;
        marker.fill = fill;
        marker.fillOpacity = fillOpacity;
        marker.stroke = stroke;
        marker.strokeOpacity = strokeOpacity;
        marker.strokeWidth = markerStrokeWidth;

        const anchor = Marker.anchor(shape);

        const x = width / 2 + (anchor.x - 0.5) * size;
        const y = height / 2 + (anchor.y - 0.5) * size;

        if (typeof shape === 'string') {
            const scale = size / (size + markerStrokeWidth);
            marker.translationX = x;
            marker.translationY = y;
            marker.scalingX = scale;
            marker.scalingY = scale;
        } else {
            // Custom marker - force it to fit in the box
            const bbox = marker.getBBox();
            const scale = Math.min(
                width / (bbox.width + markerStrokeWidth),
                height / (bbox.height + markerStrokeWidth),
                1
            );
            marker.translationX = x * scale - bbox.x * scale + (width - bbox.width * scale) / 2;
            marker.translationY = y * scale - bbox.y * scale + (height - bbox.height * scale) / 2;
            marker.scalingX = scale;
            marker.scalingY = scale;
        }

        group.append(marker);
    }

    return Group.toSVG(group, width, height);
}
