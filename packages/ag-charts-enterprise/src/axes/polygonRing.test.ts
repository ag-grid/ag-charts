import { describe, expect, it } from 'vitest';

import { drawPolygonRing } from './polygonRing';

describe('drawPolygonRing', () => {
    it('emits one moveTo, n - 1 lineTo and one closePath, visiting each vertex once in angle order', () => {
        const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const calls: Array<[string, ...number[]]> = [];

        drawPolygonRing(
            {
                moveTo: (x, y) => calls.push(['moveTo', x, y]),
                lineTo: (x, y) => calls.push(['lineTo', x, y]),
                closePath: () => calls.push(['closePath']),
            },
            angles,
            10
        );

        expect(calls.map(([name]) => name)).toEqual(['moveTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
        for (const [i, angle] of angles.entries()) {
            expect(calls[i][1]).toBeCloseTo(10 * Math.cos(angle));
            expect(calls[i][2]).toBeCloseTo(10 * Math.sin(angle));
        }
    });
});
