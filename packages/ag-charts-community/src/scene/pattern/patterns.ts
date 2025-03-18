import type { AgPatternName } from 'ag-charts-types';

import { toRadians } from '../../util/angle';
import { align } from '../util/pixel';

interface PatternFnParams {
    ctx: OffscreenCanvasRenderingContext2D;
    width: number;
    height: number;
    path?: string;
    pixelRatio: number;
    strokeWidth: number;
    padding: number;
}

function drawPatternUnitPolygon(params: PatternFnParams, moves: Array<readonly [number, number]>) {
    const { ctx, width, height, padding, strokeWidth } = params;

    const x0 = width / 2;
    const y0 = height / 2;

    const w = width - padding - strokeWidth / 2;
    const h = height - padding - strokeWidth / 2;

    ctx.beginPath();
    let didMove = false;
    for (const [dx, dy] of moves) {
        const x = x0 + (dx - 0.5) * w;
        const y = y0 + (dy - 0.5) * h;
        if (didMove) {
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x, y);
        }
        didMove = true;
    }
    ctx.closePath();
}

function drawSlant({
    ctx,
    x0,
    x1,
    y0,
    y1,
    offset,
}: {
    ctx: OffscreenCanvasRenderingContext2D;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    offset: number;
}) {
    ctx.beginPath();

    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x0 - offset, y0);
    ctx.lineTo(x1 - offset, y1);
    ctx.moveTo(x0 + offset, y0);
    ctx.lineTo(x1 + offset, y1);

    ctx.fill();
    ctx.stroke();
}

export const PATTERNS: Record<AgPatternName | 'custom', (params: PatternFnParams) => void> = {
    circles({ ctx, width, strokeWidth, padding }) {
        const c = width / 2;
        const r = c - padding - strokeWidth / 2;

        ctx.arc(c, c, r, 0, Math.PI * 2);

        ctx.fill();
        ctx.stroke();
    },
    squares({ ctx, width, height, pixelRatio, padding, strokeWidth }) {
        const offset = padding + strokeWidth / 2;

        ctx.beginPath();
        ctx.moveTo(align(pixelRatio, offset), align(pixelRatio, offset));
        ctx.lineTo(align(pixelRatio, width - offset), align(pixelRatio, offset));
        ctx.lineTo(align(pixelRatio, width - offset), align(pixelRatio, height - offset));
        ctx.lineTo(align(pixelRatio, offset), align(pixelRatio, height - offset));
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
    },
    triangles(params) {
        drawPatternUnitPolygon(params, [
            [0.5, 0],
            [1, 1],
            [0, 1],
        ]);

        params.ctx.fill();
        params.ctx.stroke();
    },
    diamonds(params) {
        drawPatternUnitPolygon(params, [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5],
        ]);

        params.ctx.fill();
        params.ctx.stroke();
    },
    stars({ ctx, width, height, padding }) {
        const spikes = 5;
        const outerRadius = (width - padding) / 2;
        const innerRadius = outerRadius / 2;
        const rotation = Math.PI / 2;

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - rotation;
            const xCoordinate = width / 2 + Math.cos(angle) * radius;
            const yCoordinate = height / 2 + Math.sin(angle) * radius;
            ctx.lineTo(xCoordinate, yCoordinate);
        }
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
    },
    hearts({ ctx, width, height, padding }) {
        const r = width / 4 - padding / 2;
        const x = width / 2;
        const y = height / 2 + r / 2;

        ctx.beginPath();
        ctx.arc(x - r, y - r, r, toRadians(130), toRadians(330));
        ctx.arc(x + r, y - r, r, toRadians(220), toRadians(50));
        ctx.lineTo(x, y + r);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
    },
    crosses(params) {
        drawPatternUnitPolygon(params, [
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

        params.ctx.stroke();
        params.ctx.fill();
    },
    'vertical-lines'({ ctx, width, height, pixelRatio, strokeWidth }) {
        ctx.moveTo(align(pixelRatio, width / 2) - strokeWidth / 2, align(pixelRatio, 0));
        ctx.lineTo(align(pixelRatio, width / 2) - strokeWidth / 2, align(pixelRatio, height));

        ctx.fill();
        ctx.stroke();
    },
    'horizontal-lines'({ ctx, width, height, pixelRatio, strokeWidth }) {
        ctx.moveTo(align(pixelRatio, 0), align(pixelRatio, height / 2) - strokeWidth / 2);
        ctx.lineTo(align(pixelRatio, width), align(pixelRatio, height / 2) - strokeWidth / 2);

        ctx.fill();
        ctx.stroke();
    },
    'forward-slanted-lines'({ ctx, width, height }) {
        const x0 = width + 0.5;
        const x1 = -0.5;
        const y0 = -0.5;
        const y1 = height + 0.5;
        const offset = width;

        drawSlant({ ctx, x0, x1, y0, y1, offset });
    },
    'backward-slanted-lines'({ ctx, width, height }) {
        const x0 = -0.5;
        const x1 = width + 0.5;
        const y0 = -0.5;
        const y1 = height + 0.5;
        const offset = width;

        drawSlant({ ctx, x0, x1, y0, y1, offset });
    },
    custom({ ctx, path }) {
        const path2D = new Path2D(path);

        ctx.stroke(path2D);
        ctx.fill(path2D);
    },
};
