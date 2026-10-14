import { describe, expect, it } from 'vitest';

import { drawPolygonRing } from './polygonRing';

function recordRing(count: number, radius: number) {
    const angles = Array.from({ length: count }, (_, i) => (i / count) * 2 * Math.PI - Math.PI / 2);
    const calls: Array<[string, ...number[]]> = [];
    drawPolygonRing(
        {
            moveTo: (x, y) => calls.push(['moveTo', x, y]),
            lineTo: (x, y) => calls.push(['lineTo', x, y]),
            closePath: () => calls.push(['closePath']),
        },
        angles,
        radius
    );
    return { angles, calls };
}

describe('drawPolygonRing', () => {
    it.each([3, 26, 208, 416])('emits one moveTo, n - 1 lineTo and one closePath for %i vertices', (count) => {
        const { calls } = recordRing(count, 100);

        expect(calls).toHaveLength(count + 1);
        expect(calls.filter(([name]) => name === 'moveTo')).toHaveLength(1);
        expect(calls.filter(([name]) => name === 'lineTo')).toHaveLength(count - 1);
        expect(calls.filter(([name]) => name === 'closePath')).toHaveLength(1);
        expect(calls[0][0]).toBe('moveTo');
        expect(calls.at(-1)?.[0]).toBe('closePath');
    });

    it('visits every vertex once, in angle order, at the given radius', () => {
        const radius = 50;
        const { angles, calls } = recordRing(5, radius);

        for (const [i, angle] of angles.entries()) {
            const [, x, y] = calls[i];
            expect(x).toBeCloseTo(radius * Math.cos(angle));
            expect(y).toBeCloseTo(radius * Math.sin(angle));
        }
    });
});
