import { toRadians } from 'ag-charts-core';
import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { align } from '../../scene/util/pixel';

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
         * M 0.1563 0.3438
         * C 0.1563 0.1515 0.3077 0.0 0.5 0.0
         * C 0.6923 0.0 0.8436 0.1515 0.8438 0.3438
         * C 0.8438 0.4938 0.7846 0.6002 0.7165 0.6954
         * C 0.6990 0.7198 0.6813 0.7431 0.6638 0.7661
         * C 0.6119 0.8344 0.5622 0.8997 0.5289 0.9806
         * C 0.5240 0.9924 0.5127 1.0 0.5 1.0
         * C 0.4873 1.0 0.4758 0.9924 0.4711 0.9806
         * C 0.4378 0.8997 0.3881 0.8344 0.3362 0.7661
         * C 0.3188 0.7431 0.3010 0.7198 0.2835 0.6954
         * C 0.2154 0.6002 0.1563 0.4938 0.1563 0.3438
         * Z
         * */

        path.moveTo(x + (0.15625 - cx) * s, y + (0.34375 - cy) * s);
        path.cubicCurveTo(
            x + (0.156 - cx) * s,
            y + (0.152 - cy) * s,
            x + (0.308 - cx) * s,
            y + (0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.692 - cx) * s,
            y + (0 - cy) * s,
            x + (0.844 - cx) * s,
            y + (0.152 - cy) * s,
            x + (0.844 - cx) * s,
            y + (0.344 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.844 - cx) * s,
            y + (0.494 - cy) * s,
            x + (0.785 - cx) * s,
            y + (0.6 - cy) * s,
            x + (0.717 - cx) * s,
            y + (0.695 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.699 - cx) * s,
            y + (0.72 - cy) * s,
            x + (0.681 - cx) * s,
            y + (0.743 - cy) * s,
            x + (0.664 - cx) * s,
            y + (0.766 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.612 - cx) * s,
            y + (0.834 - cy) * s,
            x + (0.562 - cx) * s,
            y + (0.9 - cy) * s,
            x + (0.529 - cx) * s,
            y + (0.981 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.524 - cx) * s,
            y + (0.992 - cy) * s,
            x + (0.513 - cx) * s,
            y + (1 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487 - cx) * s,
            y + (1 - cy) * s,
            x + (0.476 - cx) * s,
            y + (0.992 - cy) * s,
            x + (0.471 - cx) * s,
            y + (0.981 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487 - cx) * s,
            y + (1 - cy) * s,
            x + (0.476 - cx) * s,
            y + (0.992 - cy) * s,
            x + (0.471 - cx) * s,
            y + (0.981 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.438 - cx) * s,
            y + (0.9 - cy) * s,
            x + (0.388 - cx) * s,
            y + (0.834 - cy) * s,
            x + (0.336 - cx) * s,
            y + (0.766 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.319 - cx) * s,
            y + (0.743 - cy) * s,
            x + (0.301 - cx) * s,
            y + (0.72 - cy) * s,
            x + (0.284 - cx) * s,
            y + (0.695 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.215 - cx) * s,
            y + (0.6 - cy) * s,
            x + (0.156 - cx) * s,
            y + (0.494 - cy) * s,
            x + (0.156 - cx) * s,
            y + (0.344 - cy) * s
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
    square({ path, x, y, size, pixelRatio }) {
        const hs = size / 2;

        path.moveTo(align(pixelRatio, x - hs), align(pixelRatio, y - hs));
        path.lineTo(align(pixelRatio, x + hs), align(pixelRatio, y - hs));
        path.lineTo(align(pixelRatio, x + hs), align(pixelRatio, y + hs));
        path.lineTo(align(pixelRatio, x - hs), align(pixelRatio, y + hs));
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
};
