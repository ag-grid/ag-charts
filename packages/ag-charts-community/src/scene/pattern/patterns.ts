import type { AgPatternName } from 'ag-charts-types';

import { toRadians } from 'ag-charts-core/utils/angle';
import type { ExtendedPath2D } from '../extendedPath2D';
import { align } from '../util/pixel';

interface PatternFnParams {
    width: number;
    height: number;
    pixelRatio: number;
    strokeWidth: number;
    padding: number;
}

function drawPatternUnitPolygon(
    path: ExtendedPath2D,
    params: PatternFnParams,
    moves: Array<readonly [number, number]>
) {
    const { width, height, padding, strokeWidth } = params;

    const x0 = width / 2;
    const y0 = height / 2;

    const w = Math.max(1, width - padding - strokeWidth / 2);
    const h = Math.max(1, height - padding - strokeWidth / 2);

    let didMove = false;
    for (const [dx, dy] of moves) {
        const x = x0 + (dx - 0.5) * w;
        const y = y0 + (dy - 0.5) * h;
        if (didMove) {
            path.lineTo(x, y);
        } else {
            path.moveTo(x, y);
        }
        didMove = true;
    }
    path.closePath();
}

export const PATTERNS: Record<AgPatternName, (path: ExtendedPath2D, params: PatternFnParams) => void> = {
    circles(path, { width, strokeWidth, padding }) {
        const c = width / 2;
        const r = Math.max(1, c - padding - strokeWidth / 2);

        path.arc(c, c, r, 0, Math.PI * 2);
    },
    squares(path, { width, height, pixelRatio, padding, strokeWidth }) {
        const offset = padding + strokeWidth / 2;

        path.moveTo(align(pixelRatio, offset), align(pixelRatio, offset));
        path.lineTo(align(pixelRatio, width - offset), align(pixelRatio, offset));
        path.lineTo(align(pixelRatio, width - offset), align(pixelRatio, height - offset));
        path.lineTo(align(pixelRatio, offset), align(pixelRatio, height - offset));
        path.closePath();
    },
    triangles(path, params) {
        drawPatternUnitPolygon(path, params, [
            [0.5, 0],
            [1, 1],
            [0, 1],
        ]);
    },
    diamonds(path, params) {
        drawPatternUnitPolygon(path, params, [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5],
        ]);
    },
    stars(path, { width, height, padding }) {
        const spikes = 5;
        const outerRadius = Math.max(1, (width - padding) / 2);
        const innerRadius = outerRadius / 2;
        const rotation = Math.PI / 2;

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - rotation;
            const xCoordinate = width / 2 + Math.cos(angle) * radius;
            const yCoordinate = height / 2 + Math.sin(angle) * radius;
            path.lineTo(xCoordinate, yCoordinate);
        }
        path.closePath();
    },
    hearts(path, { width, height, padding }) {
        const r = Math.max(1, width / 4 - padding / 2);
        const x = width / 2;
        const y = height / 2 + r / 2;

        path.arc(x - r, y - r, r, toRadians(130), toRadians(330));
        path.arc(x + r, y - r, r, toRadians(220), toRadians(50));
        path.lineTo(x, y + r);
        path.closePath();
    },
    crosses(path, params) {
        drawPatternUnitPolygon(path, params, [
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
    'vertical-lines'(path, { width, height, pixelRatio, strokeWidth }) {
        const x = align(pixelRatio, width / 2) - (strokeWidth % 2) / 2;
        path.moveTo(x, 0);
        path.lineTo(x, height);
    },
    'horizontal-lines'(path, { width, height, pixelRatio, strokeWidth }) {
        const y = align(pixelRatio, height / 2) - (strokeWidth % 2) / 2;
        path.moveTo(0, y);
        path.lineTo(width, y);
    },
    'forward-slanted-lines'(path, { width, height, strokeWidth }) {
        const angle = Math.atan2(height, width);
        const insetX = strokeWidth * Math.cos(angle);
        const insetY = strokeWidth * Math.sin(angle);
        path.moveTo(-insetX, insetY);
        path.lineTo(insetX, -insetY);
        path.moveTo(-insetX, height + insetY);
        path.lineTo(width + insetX, -insetY);
        path.moveTo(width - insetX, height + insetY);
        path.lineTo(width + insetX, height - insetY);
    },
    'backward-slanted-lines'(path, { width, height, strokeWidth }) {
        const angle = Math.atan2(height, width);
        const insetX = strokeWidth * Math.cos(angle);
        const insetY = strokeWidth * Math.sin(angle);
        path.moveTo(width - insetX, -insetY);
        path.lineTo(width + insetX, insetY);
        path.moveTo(-insetX, -insetY);
        path.lineTo(width + insetX, height + insetY);
        path.moveTo(-insetX, height - insetY);
        path.lineTo(insetX, height + insetY);
    },
};
