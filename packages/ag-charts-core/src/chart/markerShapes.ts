import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { toRadians } from '../geometry/angle';
import type { Point } from '../types/scene';

export type MarkerPathMove = { x: number; y: number; t?: 'move' };

export function drawMarkerUnitPolygon(params: AgMarkerShapeFnParams, moves: Array<readonly [number, number]>) {
    const { path, size } = params;
    const { x: x0, y: y0 } = params;

    path.clear();
    let didMove = false;
    for (const [dx, dy] of moves) {
        const x = x0 + (dx - 0.5) * size;
        const y = y0 + (dy - 0.5) * size;
        if (didMove) {
            path.lineTo(x, y);
        } else {
            path.moveTo(x, y);
        }
        didMove = true;
    }
    path.closePath();
}

export const MARKER_SHAPES: Record<Exclude<AgMarkerShape, AgMarkerShapeFn>, AgMarkerShapeFn> = {
    circle({ path, x, y, size }) {
        const r = size / 2;

        path.arc(x, y, r, 0, Math.PI * 2);
        path.closePath();
    },
    cross(params) {
        drawMarkerUnitPolygon(params, [
            [0.25, 0],
            [0.5, 0.25],
            [0.75, 0],
            [1, 0.25],
            [0.75, 0.5],
            [1, 0.75],
            [0.75, 1],
            [0.5, 0.75],
            [0.25, 1],
            [0, 0.75],
            [0.25, 0.5],
            [0, 0.25],
        ]);
    },
    diamond(params) {
        drawMarkerUnitPolygon(params, [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5],
        ]);
    },
    heart({ path, x, y, size }) {
        const r = size / 4;
        y = y + r / 2;

        path.arc(x - r, y - r, r, toRadians(130), toRadians(330));
        path.arc(x + r, y - r, r, toRadians(220), toRadians(50));
        path.lineTo(x, y + r);
        path.closePath();
    },
    pin({ path, x, y, size: s }) {
        const cx = 0.5;
        const cy = 0.5;

        /**
         * M 0.891 0.391
         * C 0.891 0.606 0.5 1 0.5 1
         * C 0.5 1 0.109 0.606 0.109 0.391
         * C 0.109 0.175 0.284 0 0.5 0
         * C 0.716 0 0.891 0.175 0.891 0.391
         * Z
         */

        path.moveTo(x + (0.891 - cx) * s, y + (0.391 - cy) * s);
        path.cubicCurveTo(
            x + (0.891 - cx) * s,
            y + (0.606 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.5 - cx) * s,
            y + (1 - cy) * s,
            x + (0.109 - cx) * s,
            y + (0.606 - cy) * s,
            x + (0.109 - cx) * s,
            y + (0.391 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.109 - cx) * s,
            y + (0.175 - cy) * s,
            x + (0.284 - cx) * s,
            y + (0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.716 - cx) * s,
            y + (0 - cy) * s,
            x + (0.891 - cx) * s,
            y + (0.175 - cy) * s,
            x + (0.891 - cx) * s,
            y + (0.391 - cy) * s
        );
        path.closePath();
    },
    plus(params) {
        drawMarkerUnitPolygon(params, [
            [1 / 3, 0],
            [2 / 3, 0],
            [2 / 3, 1 / 3],
            [1, 1 / 3],
            [1, 2 / 3],
            [2 / 3, 2 / 3],
            [2 / 3, 1],
            [1 / 3, 1],
            [1 / 3, 2 / 3],
            [0, 2 / 3],
            [0, 1 / 3],
            [1 / 3, 1 / 3],
        ]);
    },
    square({ path, x, y, size }) {
        const hs = size / 2;

        // Pixel-alignment for crisp edges is applied at the per-marker translate target
        // (see Marker.drawPath); the shape geometry stays origin-relative for cache sharing.
        path.moveTo(x - hs, y - hs);
        path.lineTo(x + hs, y - hs);
        path.lineTo(x + hs, y + hs);
        path.lineTo(x - hs, y + hs);
        path.closePath();
    },
    star({ path, x, y, size }) {
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = outerRadius / 2;
        const rotation = Math.PI / 2;

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - rotation;
            const xCoordinate = x + Math.cos(angle) * radius;
            const yCoordinate = y + Math.sin(angle) * radius;
            path.lineTo(xCoordinate, yCoordinate);
        }
        path.closePath();
    },
    triangle(params) {
        drawMarkerUnitPolygon(params, [
            [0.5, 0],
            [1, 0.87],
            [0, 0.87],
        ]);
    },
    'triangle-down'(params) {
        drawMarkerUnitPolygon(params, [
            [0, 0.13],
            [1, 0.13],
            [0.5, 1],
        ]);
    },
    hourglass(params) {
        drawMarkerUnitPolygon(params, [
            [0, 0],
            [1, 0],
            [0.5, 0.5],
            [1, 1],
            [0, 1],
            [0.5, 0.5],
        ]);
    },
};

/** Radii of a built-in marker shape and the reach of its stroke, as fractions of the marker size. */
export interface MarkerShapeGeometry {
    /** Radius of the largest circle about the marker centre that the fill holds; `0` when the centre is unfilled. */
    readonly inR: number;
    /** Radius about the marker centre that holds the whole outline. */
    readonly circumR: number;
    /** Half-strokes a miter join reaches past the outline at the sharpest outward corner (canvas miter limit 10). */
    readonly miter: number;
    /** Device pixels pixel snapping may move a drawn edge from its nominal position. */
    readonly snap: number;
}

export const MARKER_SHAPE_GEOMETRY: Record<keyof typeof MARKER_SHAPES, MarkerShapeGeometry> = {
    circle: { inR: 0.5, circumR: 0.5, miter: 1, snap: 0 },
    cross: { inR: 0.25, circumR: 0.5591, miter: Math.SQRT2, snap: 0 },
    diamond: { inR: Math.SQRT2 / 4, circumR: 0.5, miter: Math.SQRT2, snap: 0 },
    heart: { inR: 0.25, circumR: 0.531, miter: 1.26, snap: 0 },
    pin: { inR: 0.32, circumR: 0.501, miter: 1.43, snap: 0 },
    plus: { inR: Math.SQRT2 / 6, circumR: 0.5271, miter: Math.SQRT2, snap: 0 },
    // Its size and origin each round to a device pixel: up to half a pixel, plus half of half a pixel.
    square: { inR: 0.5, circumR: Math.SQRT1_2, miter: Math.SQRT2, snap: 0.75 },
    star: { inR: 0.25, circumR: 0.5, miter: 2.27, snap: 0 },
    triangle: { inR: 0.248, circumR: 0.6221, miter: 2.01, snap: 0 },
    'triangle-down': { inR: 0.248, circumR: 0.6221, miter: 2.01, snap: 0 },
    hourglass: { inR: 0, circumR: Math.SQRT1_2, miter: 2.62, snap: 0 },
};

// Frozen so the renderer can return them per frame without allocating.
const PIN_ANCHOR: Point = Object.freeze({ x: 0.5, y: 1 });
const CENTRE_ANCHOR: Point = Object.freeze({ x: 0.5, y: 0.5 });

function isAnchorPoint(value: unknown): value is Point {
    return (
        typeof value === 'object' &&
        value != null &&
        'x' in value &&
        'y' in value &&
        typeof value.x === 'number' &&
        typeof value.y === 'number'
    );
}

/** Where a marker of `shape` sits against its point, as fractions of its size. */
export function markerShapeAnchor(shape: AgMarkerShape | undefined): Point {
    if (shape === 'pin') return PIN_ANCHOR;
    // Undocumented API - used by FC annotations
    if (typeof shape === 'function' && 'anchor' in shape && isAnchorPoint(shape.anchor)) return shape.anchor;
    return CENTRE_ANCHOR;
}

/** Px pixel snapping may move a drawn edge of `shape` from its nominal position at `pixelRatio`. */
export function markerSnapAllowance(shape: keyof typeof MARKER_SHAPES, pixelRatio: number): number {
    return MARKER_SHAPE_GEOMETRY[shape].snap / pixelRatio;
}
