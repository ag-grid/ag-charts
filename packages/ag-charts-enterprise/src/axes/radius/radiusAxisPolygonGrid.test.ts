import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

interface RingSegments {
    moveTo: number;
    lineTo: number;
    closePath: number;
    vertices: Array<[number, number]>;
}

describe('RadiusAxis polygon grid', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createEnterpriseChart>> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const createOptions = (categories: number, shape: 'polygon' | 'circle'): AgChartOptions => ({
        data: Array.from({ length: categories }, (_, i) => ({ category: `C${i}`, value: 1 + (i % 9) })),
        series: [{ type: 'radar-line', angleKey: 'category', radiusKey: 'value' }],
        axes: {
            angle: { type: 'angle-category', shape },
            // Fixed domain so the number of grid rings does not depend on the category count.
            radius: { type: 'radius-number', shape, min: 0, max: 10 },
        },
        legend: { enabled: false },
    });

    async function readGridRings(categories: number, shape: 'polygon' | 'circle'): Promise<RingSegments[]> {
        chart = await createEnterpriseChart(createOptions(categories, shape));
        const axis = (chart as any).axes.find((a: any) => a.gridPathSelection != null);
        expect(axis).toBeDefined();

        const rings: RingSegments[] = [];
        axis.gridPathSelection.each((node: any) => {
            const tokens = String(node.path.toSVG()).split(' ').filter(Boolean);
            const ring: RingSegments = { moveTo: 0, lineTo: 0, closePath: 0, vertices: [] };
            for (let i = 0; i < tokens.length; i++) {
                switch (tokens[i]) {
                    case 'M':
                    case 'L':
                        ring[tokens[i] === 'M' ? 'moveTo' : 'lineTo']++;
                        ring.vertices.push([Number(tokens[i + 1]), Number(tokens[i + 2])]);
                        i += 2;
                        break;
                    case 'Z':
                        ring.closePath++;
                        break;
                }
            }
            rings.push(ring);
        });
        return rings;
    }

    it.each([3, 6, 26, 208])(
        'draws every grid ring as one moveTo, n - 1 lineTo and one closePath for %i categories',
        async (categories) => {
            const rings = await readGridRings(categories, 'polygon');

            expect(rings.length).toBeGreaterThan(1);
            for (const ring of rings) {
                expect(ring.moveTo).toBe(1);
                expect(ring.lineTo).toBe(categories - 1);
                expect(ring.closePath).toBe(1);
            }
        }
    );

    it('grows linearly with the category count', async () => {
        const total = async (categories: number) => {
            const rings = await readGridRings(categories, 'polygon');
            chart?.destroy();
            chart = undefined;
            return rings.reduce((sum, r) => sum + r.moveTo + r.lineTo + r.closePath, 0);
        };

        const small = await total(26);
        const large = await total(208);

        // Same ring count (fixed radius domain): 8x the vertices must cost about 8x the segments, not 64x.
        expect(large / small).toBeLessThan(8.5);
        expect(large / small).toBeGreaterThan(7);
    });

    it('places each ring vertex once, at the same distance from the centre', async () => {
        const categories = 12;
        const rings = await readGridRings(categories, 'polygon');

        for (const ring of rings) {
            expect(ring.vertices).toHaveLength(categories);
            const radii = ring.vertices.map(([x, y]) => Math.hypot(x, y));
            for (const r of radii) {
                expect(r).toBeCloseTo(radii[0], 4);
            }
            const unique = new Set(ring.vertices.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`));
            expect(unique.size).toBe(categories);
        }

        // Rings are concentric and distinct in size.
        const ringRadii = rings.map((ring) => Math.hypot(...ring.vertices[0]));
        expect(new Set(ringRadii.map((r) => r.toFixed(3))).size).toBe(rings.length);
    });

    it('keeps the circle grid as a single moveTo, arc and closePath', async () => {
        const rings = await readGridRings(208, 'circle');

        expect(rings.length).toBeGreaterThan(1);
        for (const ring of rings) {
            expect(ring.moveTo).toBe(1);
            expect(ring.lineTo).toBe(0);
        }
    });
});
