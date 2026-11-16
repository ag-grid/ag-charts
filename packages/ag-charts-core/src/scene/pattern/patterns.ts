import type { AgPatternName } from 'ag-charts-types';

import { toRadians } from '../../geometry/angle';
import { align } from '../../rendering/pixel';
import type { ExtendedPath2D } from '../extendedPath2D';

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

function drawCircle(path: ExtendedPath2D, { width, strokeWidth, padding }: PatternFnParams) {
    const c = width / 2;
    const r = Math.max(1, c - padding - strokeWidth / 2);

    path.arc(c, c, r, 0, Math.PI * 2);
}

function drawForwardSlantedLines(path: ExtendedPath2D, { width, height, strokeWidth }: PatternFnParams) {
    const angle = Math.atan2(height, width);
    const insetX = strokeWidth * Math.cos(angle);
    const insetY = strokeWidth * Math.sin(angle);
    path.moveTo(-insetX, insetY);
    path.lineTo(insetX, -insetY);
    path.moveTo(-insetX, height + insetY);
    path.lineTo(width + insetX, -insetY);
    path.moveTo(width - insetX, height + insetY);
    path.lineTo(width + insetX, height - insetY);
}

function drawBackwardSlantedLines(path: ExtendedPath2D, { width, height, strokeWidth }: PatternFnParams) {
    const angle = Math.atan2(height, width);
    const insetX = strokeWidth * Math.cos(angle);
    const insetY = strokeWidth * Math.sin(angle);
    path.moveTo(width - insetX, -insetY);
    path.lineTo(width + insetX, insetY);
    path.moveTo(-insetX, -insetY);
    path.lineTo(width + insetX, height + insetY);
    path.moveTo(-insetX, height - insetY);
    path.lineTo(insetX, height + insetY);
}

/** Patterns painted with stroke only: open line segments a fill would close, and hollow outlines. */
export const STROKE_ONLY_PATTERNS: ReadonlySet<AgPatternName> = new Set<AgPatternName>([
    'vertical-lines',
    'horizontal-lines',
    'forward-slanted-lines',
    'backward-slanted-lines',
    'vertical-dashed-lines',
    'horizontal-dashed-lines',
    'waves',
    'criss-cross',
    'zig-zag',
    'hollow-circles',
]);

export const PATTERNS: Record<AgPatternName, (path: ExtendedPath2D, params: PatternFnParams) => void> = {
    circles: drawCircle,
    'hollow-circles': drawCircle,
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
    'polka-dots'(path, { width, height, strokeWidth, padding }) {
        const r = Math.max(1, Math.min(width, height) / 5 - padding / 2 - strokeWidth / 2);
        // Corner dots are completed by the neighbouring tiles, staggering them against the centre dot.
        for (const [x, y] of [
            [width / 2, height / 2],
            [0, 0],
            [width, 0],
            [0, height],
            [width, height],
        ] as const) {
            path.moveTo(x + r, y);
            path.arc(x, y, r, 0, Math.PI * 2);
        }
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
    'vertical-dashed-lines'(path, { width, height, pixelRatio, strokeWidth }) {
        const x = align(pixelRatio, width / 2) - (strokeWidth % 2) / 2;
        path.moveTo(x, 0);
        path.lineTo(x, (height * 2) / 3);
    },
    'horizontal-dashed-lines'(path, { width, height, pixelRatio, strokeWidth }) {
        const y = align(pixelRatio, height / 2) - (strokeWidth % 2) / 2;
        path.moveTo(0, y);
        path.lineTo((width * 2) / 3, y);
    },
    waves(path, { width, height }) {
        const amplitude = height / 4;
        const y = height / 2;
        const half = width / 2;
        // A symmetric cubic crests at 3/4 of its control height, so 4/3 * amplitude puts the crest on the amplitude.
        const k = half * 0.3642;
        path.moveTo(-half, y);
        for (let x = -half, sign = 1; x < width + half; x += half, sign = -sign) {
            const control = y - (sign * amplitude * 4) / 3;
            path.cubicCurveTo(x + k, control, x + half - k, control, x + half, y);
        }
    },
    'forward-slanted-lines': drawForwardSlantedLines,
    'backward-slanted-lines': drawBackwardSlantedLines,
    'criss-cross'(path, params) {
        drawForwardSlantedLines(path, params);
        drawBackwardSlantedLines(path, params);
    },
    'zig-zag'(path, { width, height }) {
        const top = height / 4;
        const bottom = height - top;
        const half = width / 2;
        path.moveTo(-half, top);
        for (let x = 0, atBottom = true; x <= width + half; x += half, atBottom = !atBottom) {
            path.lineTo(x, atBottom ? bottom : top);
        }
    },
};
