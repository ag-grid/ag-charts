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
         * M 0.15625 0.34375
         * C 0.15625 0.151491 0.307741 0.0 0.5 0.0
         * C 0.692259 0.0 0.84375 0.151491 0.84375 0.34375
         * C 0.84375 0.493824 0.784625 0.600181 0.716461 0.695393
         * C 0.699009 0.719769 0.681271 0.743104 0.663785 0.766105
         * C 0.611893 0.834367 0.562228 0.899699 0.528896 0.980648
         * C 0.524075 0.992358 0.512663 1.0 0.5 1.0
         * C 0.487337 1.0 0.475925 0.992358 0.471104 0.980648
         * C 0.437772 0.899699 0.388107 0.834367 0.336215 0.766105
         * C 0.318729 0.743104 0.300991 0.719769 0.283539 0.695393
         * C 0.215375 0.600181 0.15625 0.493824 0.15625 0.34375
         * Z
         * */

        path.moveTo(x + (0.15625 - cx) * s, y + (0.34375 - cy) * s);
        path.cubicCurveTo(
            x + (0.15625 - cx) * s,
            y + (0.151491 - cy) * s,
            x + (0.307741 - cx) * s,
            y + (0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.692259 - cx) * s,
            y + (0 - cy) * s,
            x + (0.84375 - cx) * s,
            y + (0.151491 - cy) * s,
            x + (0.84375 - cx) * s,
            y + (0.34375 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.84375 - cx) * s,
            y + (0.493824 - cy) * s,
            x + (0.784625 - cx) * s,
            y + (0.600181 - cy) * s,
            x + (0.716461 - cx) * s,
            y + (0.695393 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.699009 - cx) * s,
            y + (0.719769 - cy) * s,
            x + (0.681271 - cx) * s,
            y + (0.743104 - cy) * s,
            x + (0.663785 - cx) * s,
            y + (0.766105 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.611893 - cx) * s,
            y + (0.834367 - cy) * s,
            x + (0.562228 - cx) * s,
            y + (0.899699 - cy) * s,
            x + (0.528896 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.524075 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.512663 - cx) * s,
            y + (1 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487337 - cx) * s,
            y + (1 - cy) * s,
            x + (0.475925 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.471104 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487337 - cx) * s,
            y + (1 - cy) * s,
            x + (0.475925 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.471104 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.437772 - cx) * s,
            y + (0.899699 - cy) * s,
            x + (0.388107 - cx) * s,
            y + (0.834367 - cy) * s,
            x + (0.336215 - cx) * s,
            y + (0.766105 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.318729 - cx) * s,
            y + (0.743104 - cy) * s,
            x + (0.300991 - cx) * s,
            y + (0.719769 - cy) * s,
            x + (0.283539 - cx) * s,
            y + (0.695393 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.215375 - cx) * s,
            y + (0.600181 - cy) * s,
            x + (0.15625 - cx) * s,
            y + (0.493824 - cy) * s,
            x + (0.15625 - cx) * s,
            y + (0.34375 - cy) * s
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
