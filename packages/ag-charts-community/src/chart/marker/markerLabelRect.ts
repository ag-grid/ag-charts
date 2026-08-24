import type { FitRegionMask } from 'ag-charts-core';
import type { AgMarkerShape } from 'ag-charts-types';

import { getSharedMarkerPath } from './markerPathCache';

/** Largest axis-aligned rectangle that fits inside a marker shape, as fractions of the marker diameter. */
export interface MarkerLabelRect {
    /** Rectangle width, as a fraction of the marker diameter. */
    width: number;
    /** Rectangle height, as a fraction of the marker diameter. */
    height: number;
    /** Rectangle centre offset from the marker centre (x, y down), as a fraction of the marker diameter. */
    cx: number;
    cy: number;
}

// Conservative fallback: the square inscribed in the marker's bounding circle, centred on the marker.
// Used for shapes whose path is too thin or complex to analyse.
const INSCRIBED_SQUARE: MarkerLabelRect = { width: Math.SQRT1_2, height: Math.SQRT1_2, cx: 0, cy: 0 };

// Odd resolution so a sample row/column lands on each centre line. 33² samples per shape, computed once.
const GRID = 33;
// Below this fraction of the diameter the rectangle is too small to be a useful label box, so we treat
// the shape as unanalysable and fall back to the inscribed square.
const MIN_FACTOR = 0.1;

const cache = new Map<AgMarkerShape, MarkerLabelRect>();

/** The largest inscribed label rectangle for a marker shape, analysed once per shape and cached. */
export function markerLabelRect(shape: AgMarkerShape | undefined): MarkerLabelRect {
    if (shape == null) {
        return INSCRIBED_SQUARE;
    }
    let rect = cache.get(shape);
    if (rect == null) {
        rect = computeLabelRect(shape) ?? INSCRIBED_SQUARE;
        cache.set(shape, rect);
    }
    return rect;
}

const rowCache = new Map<AgMarkerShape, FitRegionMask | undefined>();

/**
 * The per-row inside spans of a marker shape, in fractions of the marker diameter, analysed once per shape
 * and cached. The same mask {@link markerLabelRect} reduces to one rectangle, kept whole so a label can use
 * the room a row actually offers.
 */
export function markerRowSpans(shape: AgMarkerShape | undefined): FitRegionMask | undefined {
    if (shape == null) return undefined;
    if (!rowCache.has(shape)) {
        rowCache.set(shape, computeRowSpans(shape));
    }
    return rowCache.get(shape);
}

function computeRowSpans(shape: AgMarkerShape): FitRegionMask | undefined {
    const sampled = sampleShape(shape);
    if (sampled == null) return undefined;

    const { bbox, inside, cellW, cellH } = sampled;
    const best = largestInsideRect(inside);
    if (best == null) return undefined;

    // A row is only usable through the run the label sits in: a shape with a notch or two lobes (a heart,
    // a star) has inside cells either side of ground that is outside it.
    const anchorCol = Math.round((best.c0 + best.c1) / 2);
    const rows: (readonly [number, number] | undefined)[] = [];
    for (let row = 0; row < GRID; row++) {
        const at = (col: number) => inside[row * GRID + col];
        if (!at(anchorCol)) {
            rows.push(undefined);
            continue;
        }
        let lo = anchorCol;
        let hi = anchorCol;
        while (lo > 0 && at(lo - 1)) lo--;
        while (hi < GRID - 1 && at(hi + 1)) hi++;
        // Spans run centre-of-cell to centre-of-cell, matching how the rectangle search reads the mask.
        rows.push([bbox.x + (lo + 0.5) * cellW, bbox.x + (hi + 0.5) * cellW]);
    }
    return { rows, top: bbox.y, rowHeight: cellH };
}

function sampleShape(shape: AgMarkerShape) {
    const path = getSharedMarkerPath(shape, 1);
    const bbox = path.computeBBox();
    if (bbox.width <= 0 || bbox.height <= 0) {
        return undefined;
    }

    const polygons = path.flatten();
    const cellW = bbox.width / GRID;
    const cellH = bbox.height / GRID;
    const inside: boolean[] = new Array(GRID * GRID);
    for (let row = 0; row < GRID; row++) {
        const y = bbox.y + (row + 0.5) * cellH;
        for (let col = 0; col < GRID; col++) {
            const x = bbox.x + (col + 0.5) * cellW;
            inside[row * GRID + col] = pointInPolygons(x, y, polygons);
        }
    }
    return { bbox, inside, cellW, cellH };
}

function computeLabelRect(shape: AgMarkerShape): MarkerLabelRect | undefined {
    const sampled = sampleShape(shape);
    if (sampled == null) {
        return undefined;
    }

    const { bbox, inside, cellW, cellH } = sampled;
    const best = largestInsideRect(inside);
    if (best == null) {
        return undefined;
    }

    // Rectangle spans from the centre of the first inside cell to the centre of the last, so its corners
    // sit on sampled inside points.
    const width = (best.c1 - best.c0) * cellW;
    const height = (best.r1 - best.r0) * cellH;
    if (width < MIN_FACTOR || height < MIN_FACTOR) {
        return undefined;
    }
    const cx = bbox.x + ((best.c0 + best.c1) / 2 + 0.5) * cellW;
    const cy = bbox.y + ((best.r0 + best.r1) / 2 + 0.5) * cellH;
    return { width, height, cx, cy };
}

// Even-odd point-in-polygon across all subpaths, with the half-open edge convention so shared vertices
// are counted exactly once (robust where a ray would otherwise graze a vertex).
function pointInPolygons(x: number, y: number, polygons: { x: number; y: number }[][]): boolean {
    let inside = false;
    for (const poly of polygons) {
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const { x: xi, y: yi } = poly[i];
            const { x: xj, y: yj } = poly[j];
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
    }
    return inside;
}

interface RectCells {
    r0: number;
    r1: number;
    c0: number;
    c1: number;
}

// Maximal-area rectangle of `true` cells (largest-rectangle-in-histogram, row by row).
function largestInsideRect(inside: boolean[]): RectCells | undefined {
    const heights = new Array(GRID).fill(0);
    const stack: number[] = [];
    let best: RectCells | undefined;
    let bestArea = 0;

    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            heights[col] = inside[row * GRID + col] ? heights[col] + 1 : 0;
        }
        stack.length = 0;
        for (let col = 0; col <= GRID; col++) {
            const h = col < GRID ? heights[col] : 0;
            while (stack.length > 0 && heights[stack.at(-1)!] > h) {
                const top = stack.pop()!;
                const barHeight = heights[top];
                const left = stack.length > 0 ? stack.at(-1)! + 1 : 0;
                const area = barHeight * (col - left);
                if (area > bestArea) {
                    bestArea = area;
                    best = { r0: row - barHeight + 1, r1: row, c0: left, c1: col - 1 };
                }
            }
            stack.push(col);
        }
    }
    return best;
}
