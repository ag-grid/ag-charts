import type { Position } from 'geojson';

import type { LatLongBBox } from './LatLongBBox';
import { extendBbox } from './bboxUtil';
import { lineSegmentDistanceSquared } from './lineStringUtil';

export function polygonBbox(polygon: Position[], into: LatLongBBox | undefined): LatLongBBox | undefined {
    polygon.forEach((coordinates) => {
        const [lon, lat] = coordinates;
        into = extendBbox(into, lon, lat, lon, lat);
    });

    return into;
}

export function polygonCentroid(polygon: Position[]): Position | undefined {
    if (polygon.length === 0) return;

    let x = 0;
    let y = 0;
    let a: Position;
    let b = polygon[polygon.length - 1];
    let k = 0;

    for (let i = 0; i < polygon.length; i += 1) {
        a = b;
        b = polygon[i];
        const c = a[0] * b[1] - b[0] * a[1];
        k += c;
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
    }

    k *= 3;

    return [x / k, y / k];
}

export function inaccessibilityPole(polygons: Position[][], precision = 0.01): Position | undefined {
    const bbox = polygonBbox(polygons[0], undefined);
    if (bbox == null) return;

    const x0 = Math.min(bbox.lon0, bbox.lon1);
    const x1 = Math.max(bbox.lon0, bbox.lon1);
    const y0 = Math.min(bbox.lat0, bbox.lat1);
    const y1 = Math.max(bbox.lat0, bbox.lat1);
    const width = x1 - x0;
    const height = y1 - y0;
    const cellSize = Math.min(width, height);

    if (cellSize < precision) {
        return [(bbox.lon0 + bbox.lon1) / 2, (bbox.lat0 + bbox.lat1) / 2];
    }

    let [bestX, bestY] = polygonCentroid(polygons[0])!;
    let bestDistance = polygonDistance(polygons, bestX, bestY);

    const excessWidth = ((width / cellSize) % 1) * cellSize;
    const excessHeight = ((height / cellSize) % 1) * cellSize;

    const cells: Cell[] = [];
    for (let x = x0 + excessWidth / 2; x < x1; x += cellSize) {
        for (let y = y0 + excessHeight / 2; y < y1; y += cellSize) {
            const h = cellSize / 2;
            cells.push(new Cell(polygons, x + h, y + h, h));
        }
    }

    cells.sort(cellCmp);

    while (cells.length > 0) {
        const cell = cells.pop()!;

        if (cell.d < bestDistance) {
            bestDistance = cell.d;
            bestX = cell.x;
            bestY = cell.y;
        }

        if (bestDistance - cell.max <= precision) {
            continue;
        }

        const h = cell.h / 2;
        cells.push(new Cell(polygons, cell.x - h, cell.y - h, h));
        cells.push(new Cell(polygons, cell.x + h, cell.y - h, h));
        cells.push(new Cell(polygons, cell.x - h, cell.y + h, h));
        cells.push(new Cell(polygons, cell.x + h, cell.y + h, h));

        cells.sort(cellCmp);
    }

    return [bestX, bestY];
}

const cellCmp = (a: Cell, b: Cell) => b.max - a.max;

class Cell {
    d: number;
    max: number;

    constructor(
        polygons: Position[][],
        public x: number,
        public y: number,
        public h: number
    ) {
        this.d = polygonDistance(polygons, x, y);
        this.max = this.d - h * Math.SQRT2;
    }
}

/** Distance from a point to a polygon. Negative if inside the polygon. */
export function polygonDistance(polygons: Position[][], x: number, y: number) {
    let inside = false;
    let minDistanceSquared = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon[polygon.length - 1];
        let [x0, y0] = p0;

        for (let i = 0; i < polygon.length; i += 1) {
            const p1 = polygon[i];
            const [x1, y1] = p1;

            if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) {
                inside = !inside;
            }

            minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceSquared(p0, p1, x, y));
            p0 = p1;
            x0 = x1;
            y0 = y1;
        }
    }

    return (inside ? -1 : 1) * Math.sqrt(minDistanceSquared);
}
