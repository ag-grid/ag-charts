import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { toRadians } from '../geometry/angle';
import { ExtendedPath2D } from '../scene/extendedPath2D';
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

/** `shape` traced at `size` on the origin; empty for a name with no built-in shape. */
export function traceMarkerShape(shape: AgMarkerShape, size: number, pixelRatio = 1): ExtendedPath2D {
    const path = new ExtendedPath2D();
    const draw: AgMarkerShapeFn | undefined = typeof shape === 'string' ? MARKER_SHAPES[shape] : shape;
    draw?.({ path, x: 0, y: 0, size, pixelRatio });
    return path;
}

// Soft cap on the distinct custom geometries remembered, cleared wholesale as the marker path cache is.
const MAX_CUSTOM_GEOMETRIES = 1024;

/**
 * `compute` cached per shape, holding a custom one weakly. A styler may return a fresh function per datum,
 * so functions whose traces at every `traceSizes` match share one result; `compute` must read no other size.
 */
export function memoiseByMarkerShape<T extends object | undefined>(
    compute: (shape: AgMarkerShape) => T,
    traceSizes: readonly number[]
): (shape: AgMarkerShape) => T {
    const builtIn = new Map<string, T>();
    const custom = new WeakMap<AgMarkerShapeFn, T>();
    const byGeometry = new Map<string, WeakRef<NonNullable<T>>>();
    const computeCustom = (shape: AgMarkerShapeFn): T => {
        const key = traceSizes.map((size) => traceMarkerShape(shape, size).toSVG()).join('|');
        const shared = byGeometry.get(key)?.deref();
        if (shared != null) return shared;
        const value = compute(shape);
        if (value != null) {
            if (byGeometry.size >= MAX_CUSTOM_GEOMETRIES) byGeometry.clear();
            byGeometry.set(key, new WeakRef(value));
        }
        return value;
    };
    return (shape) => {
        if (typeof shape === 'string') {
            if (!builtIn.has(shape)) builtIn.set(shape, compute(shape));
            return builtIn.get(shape)!;
        }
        if (!custom.has(shape)) custom.set(shape, computeCustom(shape));
        return custom.get(shape)!;
    };
}

const PIN_ANCHOR: Point = Object.freeze({ x: 0.5, y: 1 });
const CENTRE_ANCHOR: Point = Object.freeze({ x: 0.5, y: 0.5 });

/** The fraction of the marker box its point is drawn at: the tip of a pin, the centre of anything else. */
export function markerShapeAnchor(shape: AgMarkerShape | undefined): Point {
    if (shape === 'pin') return PIN_ANCHOR;
    // Undocumented API, used by FC annotations.
    if (typeof shape === 'function' && 'anchor' in shape) return shape.anchor as Point;
    return CENTRE_ANCHOR;
}
