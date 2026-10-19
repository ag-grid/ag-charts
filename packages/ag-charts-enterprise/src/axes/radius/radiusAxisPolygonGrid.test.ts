import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { getAxisGridGroup, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import { Path } from 'ag-charts-core';

import { collectShapes, createEnterpriseChart } from '../../test/utils';

interface Ring {
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

    const createOptions = (categories: number): AgChartOptions => ({
        data: Array.from({ length: categories }, (_, i) => ({ category: `C${i}`, value: 1 + (i % 9) })),
        series: [{ type: 'radar-line', angleKey: 'category', radiusKey: 'value' }],
        axes: {
            angle: { type: 'angle-category', shape: 'polygon' },
            radius: { type: 'radius-number', shape: 'polygon', min: 0, max: 10 },
        },
        legend: { enabled: false },
    });

    async function readGridRings(categories: number): Promise<Ring[]> {
        chart = await createEnterpriseChart(createOptions(categories));
        const gridPaths = collectShapes(getAxisGridGroup(chart, 'radius')).filter(
            (shape): shape is Path => shape instanceof Path
        );

        const rings: Ring[] = [];
        for (const node of gridPaths) {
            const ring: Ring = { moveTo: 0, lineTo: 0, closePath: 0, vertices: [] };
            for (const [, command, x, y] of node.path.toSVG().matchAll(/([MLZ])(?: (-?[\d.e-]+) (-?[\d.e-]+))?/g)) {
                if (command === 'Z') {
                    ring.closePath++;
                    continue;
                }
                ring[command === 'M' ? 'moveTo' : 'lineTo']++;
                ring.vertices.push([Number(x), Number(y)]);
            }
            rings.push(ring);
        }
        return rings;
    }

    it.each([3, 26, 208])(
        'draws every grid ring as one moveTo, n - 1 lineTo and one closePath for %i categories',
        async (categories) => {
            const rings = await readGridRings(categories);

            expect(rings.length).toBeGreaterThan(1);
            for (const ring of rings) {
                expect(ring.moveTo).toBe(1);
                expect(ring.lineTo).toBe(categories - 1);
                expect(ring.closePath).toBe(1);

                // Each vertex once, all at the ring's radius.
                const radii = ring.vertices.map(([x, y]) => Math.hypot(x, y));
                for (const r of radii) {
                    expect(r).toBeCloseTo(radii[0], 4);
                }
                const unique = new Set(ring.vertices.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`));
                expect(unique.size).toBe(categories);
            }

            const ringRadii = rings.map((ring) => Math.hypot(...ring.vertices[0]).toFixed(3));
            expect(new Set(ringRadii).size).toBe(rings.length);
        }
    );
});
