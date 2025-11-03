import type { InternalAgColorType } from 'ag-charts-core';
import type { AgColorType, AgSeriesMarkerStyle } from 'ag-charts-types';

import { Group } from '../../scene/group';
import { Line } from '../../scene/shape/line';
import { Marker } from '../marker/marker';

export interface LegendMarker extends Omit<AgSeriesMarkerStyle, 'stroke'> {
    fill?: InternalAgColorType;
    stroke?: AgColorType;
    enabled?: boolean;
}

export interface LegendLine {
    enabled: boolean;
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

    const markerStrokeWidth = Math.min(symbol.marker.strokeWidth ?? 1, 2);
    const lineStrokeWidth = symbol.line?.enabled ? Math.min(symbol.line.strokeWidth, 2) : 0;

    const width = Math.max(symbol.marker.enabled === false ? 0 : size, symbol.line == null ? 0 : lineSize);
    const height = Math.max(symbol.marker.enabled === false ? 0 : size, lineStrokeWidth);

    if (symbol.line?.enabled) {
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
        const { shape, fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = symbol.marker;
        const marker = new Marker();
        marker.shape = shape ?? 'square';
        marker.size = size;
        marker.fill = fill;
        marker.fillOpacity = fillOpacity ?? 1;
        marker.stroke = stroke;
        marker.strokeOpacity = strokeOpacity ?? 1;
        marker.strokeWidth = markerStrokeWidth;
        marker.lineDash = lineDash;
        marker.lineDashOffset = lineDashOffset ?? 0;

        const anchor = Marker.anchor(shape);
        const x = width / 2 + (anchor.x - 0.5) * size;
        const y = height / 2 + (anchor.y - 0.5) * size;
        const scale = size / (size + markerStrokeWidth);

        marker.x = x;
        marker.y = y;

        marker.scalingCenterX = x;
        marker.scalingCenterY = y;
        marker.scalingX = scale;
        marker.scalingY = scale;

        group.append(marker);
    }

    return Group.toSVG(group, width, height);
}
