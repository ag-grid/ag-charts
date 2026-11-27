import { describe, expect, it } from 'vitest';

import type { Position } from 'ag-charts-core';

import {
    type Ring,
    chamferedCorner,
    circle,
    coastArm,
    collinearBorder,
    microBorder,
    nearCollinearCoast,
    rampBetweenBorders,
    rect,
    region,
    reverseRing,
    scaleRing,
    sideBySide,
    thinNotch,
    tooth,
    tripoint,
} from '../map-test/gapSyntheticRings';
import { type GapTopology, createScene } from '../map-test/gapTestUtil';
import indonesiaTimorTopology from '../map-test/indonesiaTimorTopology.json';
import londonBoroughTopology from '../map-test/londonBoroughTopology.json';
import southernAfricaItalyTopology from '../map-test/southernAfricaItalyTopology.json';
import usTopology from '../map-test/usTopology.json';
import worldTopology from '../map-test/worldTopology.json';
import { MapShapeGapIndex } from './mapShapeGapIndex';
import { insetGapRing, insetPolygonRings, simplifyGapRing } from './polygonGapInset';

function indexOf(...regions: [boolean, Ring[]][]): MapShapeGapIndex {
    const index = new MapShapeGapIndex();
    index.build(regions.map(([hasGap, polygon]) => region(hasGap, polygon)));
    return index;
}

function indexRings(...rings: Ring[]): MapShapeGapIndex {
    return indexOf(...rings.map((ring): [boolean, Ring[]] => [true, [ring]]));
}

/** Insets a polygon whose rings were indexed as they are, after scaling them by `scale` into screen space. */
function inset(index: MapShapeGapIndex, polygon: Ring[], d: number, scale = 1): Position[][] | undefined {
    const screen = polygon.map((ring) => scaleRing(ring, scale));
    return insetPolygonRings(screen, index.getPolygonRingInfo(polygon) ?? [], d);
}

function exterior(index: MapShapeGapIndex, ring: Ring, d: number, scale = 1): Position[] | undefined {
    return inset(index, [ring], d, scale)?.[0];
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

/** The distinct vertices of a closed ring, rounded and rotated to start at the lowest, to compare rings by shape. */
function vertices(ring: readonly Position[] | undefined): Position[] {
    expect(ring).toBeDefined();
    const open = ring!.slice(0, -1).map(([x, y]): Position => [round(x), round(y)]);
    let first = 0;
    for (const [i, [x, y]] of open.entries()) {
        if (x < open[first][0] || (x === open[first][0] && y < open[first][1])) first = i;
    }
    return [...open.slice(first), ...open.slice(0, first)];
}

function expectRing(actual: readonly Position[] | undefined, expected: Position[]): void {
    expect(vertices(actual)).toEqual(vertices([...expected, expected[0]]));
}

function signedArea(ring: readonly Position[]): number {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
        area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return area / 2;
}

function keyOf([x, y]: Position): string {
    return `${x},${y}`;
}

describe('insetPolygonRings', () => {
    describe('shared borders', () => {
        it('moves a border back by d on both sides and leaves the coast alone', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);

            expectRing(exterior(index, a, 2), [
                [0, 0],
                [8, 0],
                [8, 10],
                [0, 10],
            ]);
            expectRing(exterior(index, b, 2), [
                [12, 0],
                [20, 0],
                [20, 10],
                [12, 10],
            ]);
        });

        it('moves a border by the same number of pixels at any scale', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);

            for (const scale of [1, 8, 64]) {
                const drawn = exterior(index, a, 2.5, scale)!;
                expect(Math.max(...drawn.map(([x]) => x))).toBeCloseTo(10 * scale - 2.5, 9);
                expect(Math.min(...drawn.map(([x]) => x))).toBe(0);
            }
        });

        it('moves a border that only one of the regions has a gap on', () => {
            const { a, b } = sideBySide();
            const index = indexOf([true, [a]], [false, [b]]);

            expect(exterior(index, a, 2)).toBeDefined();
            expect(Math.max(...exterior(index, a, 2)!.map(([x]) => x))).toBe(8);
        });

        it('keeps the vertices of a collinear border and moves them with it (parallel mitre)', () => {
            const { a, b } = collinearBorder();
            const index = indexRings(a, b);

            expectRing(exterior(index, a, 2), [
                [0, 0],
                [8, 0],
                [8, 5],
                [8, 10],
                [0, 10],
            ]);
            expectRing(exterior(index, b, 2), [
                [12, 0],
                [20, 0],
                [20, 10],
                [12, 10],
                [12, 5],
            ]);
        });

        it('insets every part of a multi-part region and the neighbour between them', () => {
            const left = rect(0, 0, 10, 10);
            const middle = rect(10, 0, 20, 10);
            const right = rect(20, 0, 30, 10);
            const index = indexOf([true, [left]], [true, [middle]], [true, [right]]);

            expectRing(exterior(index, left, 2), [
                [0, 0],
                [8, 0],
                [8, 10],
                [0, 10],
            ]);
            expectRing(exterior(index, middle, 2), [
                [12, 0],
                [18, 0],
                [18, 10],
                [12, 10],
            ]);
            expectRing(exterior(index, right, 2), [
                [22, 0],
                [30, 0],
                [30, 10],
                [22, 10],
            ]);
        });

        it('draws separate copies of the same region identically and leaves their coast alone', () => {
            const { a, b } = sideBySide();
            const copy = scaleRing(a, 1);
            const index = indexOf([true, [a]], [true, [copy]], [true, [b]]);

            expect(exterior(index, copy, 2)).toEqual(exterior(index, a, 2));
            expect(Math.min(...exterior(index, copy, 2)!.map(([x]) => x))).toBe(0);
        });
    });

    describe('tripoints', () => {
        it('meets three regions at mitred corners', () => {
            const { r1, r2, r3 } = tripoint();
            const index = indexRings(r1, r2, r3);

            expectRing(exterior(index, r1, 2), [
                [10, 2],
                [10, 10],
                [2, 10],
                [2, 2],
            ]);
            expectRing(exterior(index, r2, 2), [
                [-2, 10],
                [-10, 10],
                [-10, 2],
                [-2, 2],
            ]);
            expectRing(exterior(index, r3, 2), [
                [-10, -2],
                [-10, -10],
                [10, -10],
                [10, -2],
                [0, -2],
            ]);
        });
    });

    describe('coast junctions', () => {
        it('slides a border end along the coast it meets', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);

            expect(exterior(index, a, 2)).toContainEqual([8, 0]);
            expect(exterior(index, a, 2)).toContainEqual([8, 10]);
        });

        it('steps square to a coast too shallow to slide along', () => {
            const { a, b } = nearCollinearCoast();
            const index = indexRings(a, b);

            expectRing(exterior(index, a, 2), [
                [0, 0],
                [8, 0],
                [8, 5],
                [10, 5],
                [10.2, 10],
                [0, 10],
            ]);
        });

        it('never draws the ramp between two borders backwards, whatever slides both ends ask for', () => {
            const { a, b, c } = rampBetweenBorders();
            const index = indexRings(a, b, c);
            const info = index.getRingInfo(a)!;
            const simplified = simplifyGapRing(a, info)!;
            const ramp = simplified.points.findIndex(([x, y]) => x === 10.5 && y === 11);
            expect(ramp).toBeGreaterThanOrEqual(0);

            for (const d of [0.2, 0.5, 1, 2, 3]) {
                const drawn = insetGapRing(simplified.points, simplified.moved, d, true)!;
                const edge = drawn.edges.find((e) => e.edge === ramp);
                expect(edge).toBeDefined();
                const dot = (edge!.x1 - edge!.x0) * -1 + (edge!.y1 - edge!.y0) * -1;
                expect(dot).toBeGreaterThanOrEqual(0);
            }
        });

        it('shortens a ramp by the slides at both ends when it is long enough for them', () => {
            const { a, b, c } = rampBetweenBorders();
            const index = indexRings(a, b, c);

            expectRing(exterior(index, a, 0.2), [
                [0, 0],
                [20, 0],
                [20, 10.8],
                [10.3, 10.8],
                [9.3, 9.8],
                [0, 9.8],
            ]);
        });
    });

    describe('joins', () => {
        it('mitres the convex tip of a thin tooth', () => {
            const { a, b } = thinNotch();
            const index = indexRings(a, b);
            const d = 0.5;
            const tip = exterior(index, b, d)!.filter(([, y]) => y < 35);

            expect(tip).toHaveLength(1);
            expect(tip[0][0]).toBeCloseTo(20, 2);
            expect(tip[0][1]).toBeCloseTo(20 + d * Math.hypot(20, 1), 2);
        });

        it('bevels the reflex tip of a thin notch instead of mitring far outside the region', () => {
            const { a, b } = thinNotch();
            const index = indexRings(a, b);
            const drawn = exterior(index, a, 2)!;
            const tip = drawn.slice(0, -1).filter(([, y]) => y > 5 && y < 25);

            expect(tip).toHaveLength(2);
            expect(round(tip[0][0] + tip[1][0])).toBe(40);
            expect(Math.min(...drawn.map(([, y]) => y))).toBeGreaterThanOrEqual(0);
        });

        it('removes a moved edge that reverses once its neighbours are offset', () => {
            const { a, right, top, corner } = chamferedCorner();
            const index = indexRings(a, right, top, corner);

            expectRing(exterior(index, a, 2), [
                [0, 0],
                [8, 0],
                [8, 8],
                [0, 8],
            ]);
        });

        it('keeps the chamfer while it survives the offset', () => {
            const { a, right, top, corner } = chamferedCorner();
            const index = indexRings(a, right, top, corner);

            expect(vertices(exterior(index, a, 0.2))).toHaveLength(5);
        });
    });

    describe('enclaves and holes', () => {
        it('insets an enclave and grows the hole it fills in its host', () => {
            const enclave = rect(10, 10, 20, 20);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);

            const drawnHost = inset(index, host, 2)!;
            expect(drawnHost).toHaveLength(2);
            expectRing(reverseRing(drawnHost[1]), [
                [8, 8],
                [22, 8],
                [22, 22],
                [8, 22],
            ]);
            expectRing(exterior(index, enclave, 2), [
                [12, 12],
                [18, 12],
                [18, 18],
                [12, 18],
            ]);
        });

        it('collapses a host whose holes grow to fill it', () => {
            const enclave = rect(10, 10, 20, 20);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);

            expect(inset(index, host, 9)).toBeDefined();
            expect(inset(index, host, 10)).toBeUndefined();
        });
    });

    describe('unchanged polygons', () => {
        it('returns the same rings when d is not positive', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);
            const polygon = [scaleRing(a, 1)];
            const infos = index.getPolygonRingInfo([a])!;

            expect(insetPolygonRings(polygon, infos, 0)).toBe(polygon);
            expect(insetPolygonRings(polygon, infos, -1)).toBe(polygon);
            expect(insetPolygonRings(polygon, infos, Number.NaN)).toBe(polygon);
        });

        it('returns the same array for a polygon with no moved edge, however small', () => {
            const { a, b } = sideBySide();
            const island = [rect(100, 100, 100.1, 100.1)];
            const index = indexOf([true, [a]], [true, [b]], [true, island]);

            expect(index.getPolygonRingInfo(island)).toBeUndefined();
            expect(insetPolygonRings(island, [], 4)).toBe(island);
        });

        it('returns the unmoved rings of a polygon as the same arrays', () => {
            const enclave = rect(10, 10, 20, 20);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);
            const drawn = insetPolygonRings(host, index.getPolygonRingInfo(host)!, 2)!;

            expect(drawn[0]).toBe(host[0]);
        });
    });

    describe('collapse', () => {
        function narrow(width: number): { index: MapShapeGapIndex; a: Ring } {
            const a = rect(0, 0, width, 3);
            const b = rect(width, 0, width + 10, 3);
            return { index: indexRings(a, b), a };
        }

        it('collapses a polygon narrower than the inset', () => {
            const { index, a } = narrow(3);

            expect(exterior(index, a, 2)).toBeDefined();
            expect(exterior(index, a, 3)).toBeUndefined();
            expect(exterior(index, a, 4)).toBeUndefined();
        });

        it('collapses a polygon whose drawn area is under half a pixel', () => {
            const { index, a } = narrow(3);

            expect(exterior(index, a, 2.8)).toBeDefined();
            expect(exterior(index, a, 2.9)).toBeUndefined();
        });

        it('collapses a polygon with a coordinate that is not finite', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);
            const screen = scaleRing(a, 1);
            screen[2] = [Number.NaN, 10];

            expect(insetPolygonRings([screen], index.getPolygonRingInfo([a])!, 2)).toBeUndefined();
        });
    });

    describe('sub-pixel vertices', () => {
        const kept = (index: MapShapeGapIndex, ring: Ring, scale: number): Set<string> => {
            const simplified = simplifyGapRing(scaleRing(ring, scale), index.getRingInfo(ring)!)!;
            const keys = new Set<string>();
            for (const [x, y] of simplified.points) {
                if (x / scale > 9.9 && x / scale < 10.1) keys.add(keyOf([round(x / scale), round(y / scale)]));
            }
            return keys;
        };

        it('drops the same vertices from both rings of a border at every zoom', () => {
            const { a, b } = microBorder();
            const index = indexRings(a, b);

            const sizes: number[] = [];
            for (const scale of [1, 5, 20]) {
                const onA = kept(index, a, scale);
                const onB = kept(index, b, scale);
                expect(onB).toEqual(onA);
                sizes.push(onA.size);
            }
            expect(sizes[0]).toBeLessThan(sizes[1]);
            expect(sizes[1]).toBeLessThanOrEqual(sizes[2]);
            expect(sizes[2]).toBe(32);
        });

        it('drops the same vertices from both rings of an enclave', () => {
            const enclave = circle(80, 5);
            const hole = reverseRing(circle(80, 5, 17));
            const host = [rect(-20, -20, 20, 20), hole];
            const index = indexOf([true, host], [true, [enclave]]);

            const sizes: number[] = [];
            for (const scale of [1, 1.25, 4]) {
                const onEnclave = simplifyGapRing(scaleRing(enclave, scale), index.getRingInfo(enclave)!)!;
                const onHole = simplifyGapRing(scaleRing(hole, scale), index.getRingInfo(hole)!)!;
                const a = new Set(onEnclave.points.map(([x, y]) => keyOf([round(x / scale), round(y / scale)])));
                const b = new Set(onHole.points.map(([x, y]) => keyOf([round(x / scale), round(y / scale)])));
                expect(b).toEqual(a);
                sizes.push(a.size);
            }
            expect(sizes[0]).toBeLessThan(80);
            expect(sizes[2]).toBe(80);
        });

        it('never drops a tripoint or the end of a run', () => {
            const { r1, r2, r3 } = tripoint();
            const index = indexRings(r1, r2, r3);
            const info = index.getRingInfo(r1)!;
            const simplified = simplifyGapRing(scaleRing(r1, 0.01), info)!;

            expect(simplified.points).toHaveLength(4);
        });
    });

    describe('corridors', () => {
        it('paints at most the corridor deficit past the far edge of a strip between two shared edges', () => {
            const { a, b, width } = tooth();
            const index = indexRings(a, b);
            const d = 2;
            const reach = d - width;

            const drawnA = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
            expect(drawnA.length).toBeGreaterThan(0);
            expect(Math.min(...drawnA.map(([, y]) => y))).toBeGreaterThanOrEqual(4 - reach - 1e-9);
            expect(Math.max(...drawnA.map(([, y]) => y))).toBeLessThanOrEqual(5 + reach + 1e-9);
        });

        it('keeps the paint inside the neighbour gap when both sides have the same inset', () => {
            const { a, b } = tooth();
            const index = indexRings(a, b);
            const d = 2;

            const drawnA = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
            const drawnB = exterior(index, b, d)!.filter(([x, y]) => x > 10 && y > 0 && y < 10);
            expect(Math.min(...drawnA.map(([, y]) => y))).toBeGreaterThan(Math.min(...drawnB.map(([, y]) => y)));
            expect(Math.max(...drawnA.map(([, y]) => y))).toBeLessThan(Math.max(...drawnB.map(([, y]) => y)));
        });

        it('reaches into an ungapped neighbour by the deficit and no further', () => {
            const { a, b, width } = tooth();
            const index = indexOf([true, [a]], [false, [b]]);
            const d = 2;

            expect(inset(index, [b], 0)).toEqual([b]);
            const drawnA = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
            expect(Math.max(...drawnA.map(([, y]) => y)) - 5).toBeLessThanOrEqual(d - width + 1e-9);
            expect(4 - Math.min(...drawnA.map(([, y]) => y))).toBeLessThanOrEqual(d - width + 1e-9);
        });

        it('draws a strip wider than the inset as a thinner strip', () => {
            const { a, b } = tooth();
            const index = indexRings(a, b);

            expectRing(exterior(index, a, 0.3), [
                [0, 0],
                [9.7, 0],
                [9.7, 4.3],
                [13.7, 4.3],
                [13.7, 4.7],
                [9.7, 4.7],
                [9.7, 10],
                [0, 10],
            ]);
        });

        it('paints at most the corridor deficit into the sea past a coast', () => {
            const { a, b, width } = coastArm();
            const index = indexRings(a, b);
            const d = 2;

            const arm = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
            expect(arm.length).toBeGreaterThan(0);
            expect(Math.min(...arm.map(([, y]) => y))).toBeGreaterThanOrEqual(4 - (d - width) - 1e-9);
        });
    });
});

interface SweepResult {
    problems: string[];
    moved: number;
    collapsed: number;
    untouched: number;
}

/** Insets every polygon of a scene and checks what must hold for any topology. */
function sweep(topology: GapTopology, zoom: number, d: number): SweepResult {
    const { index, fixed, screen } = createScene(topology, zoom);
    const result: SweepResult = { problems: [], moved: 0, collapsed: 0, untouched: 0 };
    const report = (p: number, message: string) => {
        if (result.problems.length < 20) result.problems.push(`polygon ${p}: ${message}`);
    };

    for (let p = 0; p < fixed.length; p += 1) {
        const polygon = screen[p];
        const infos = index.getPolygonRingInfo(fixed[p]);
        const drawn = insetPolygonRings(polygon, infos ?? [], d);

        if (infos == null) {
            result.untouched += 1;
            if (drawn !== polygon) report(p, 'a polygon with no moved edge was not returned as the same object');
            continue;
        }
        result.moved += 1;
        if (drawn == null) {
            result.collapsed += 1;
            continue;
        }

        const drawnKeys = new Set<string>();
        for (const ring of drawn) {
            for (const point of ring) {
                if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) report(p, 'not finite');
                drawnKeys.add(keyOf(point));
            }
        }
        if (Math.abs(signedArea(drawn[0])) > Math.abs(signedArea(polygon[0])) + 1e-6) report(p, 'the area grew');
        if (signedArea(drawn[0]) * signedArea(polygon[0]) <= 0) report(p, 'the exterior ring flipped');

        for (let r = 0; r < polygon.length; r += 1) {
            const info = infos[r];
            if (info == null) continue;
            const simplified = simplifyGapRing(polygon[r], info)!;
            const { points, moved } = simplified;
            const m = points.length;
            const fillLeft = info.orientation > 0 !== info.hole;

            for (let k = 0; k < m; k += 1) {
                if (moved[k] === 0 && moved[(k + m - 1) % m] === 0 && !drawnKeys.has(keyOf(points[k]))) {
                    report(p, `ring ${r} vertex ${k} between unmoved edges was moved or lost`);
                }
            }

            const trace = insetGapRing(points, moved, d, fillLeft);
            if (trace == null) continue;
            for (const e of trace.edges) {
                const [x0, y0] = points[e.edge];
                const [x1, y1] = points[(e.edge + 1) % m];
                const length = Math.hypot(x1 - x0, y1 - y0);
                const tx = (x1 - x0) / length;
                const ty = (y1 - y0) / length;
                if ((e.x1 - e.x0) * tx + (e.y1 - e.y0) * ty < -1e-6)
                    report(p, `ring ${r} edge ${e.edge} drawn backwards`);
                if (moved[e.edge] === 0) continue;

                const side = fillLeft ? 1 : -1;
                for (const [x, y] of [
                    [e.x0, e.y0],
                    [e.x1, e.y1],
                ]) {
                    const offset = side * ((x - x0) * -ty + (y - y0) * tx);
                    if (Math.abs(offset - d) > 0.01)
                        report(p, `ring ${r} edge ${e.edge} drawn ${round(offset)} from its edge`);
                }
            }
        }
    }
    return result;
}

describe('gap sweep', () => {
    const topologies: [string, GapTopology][] = [
        ['US states', usTopology as GapTopology],
        ['world countries', worldTopology as GapTopology],
        ['London boroughs', londonBoroughTopology as GapTopology],
    ];
    const cases = topologies.flatMap(([name, topology]) =>
        [1, 16].flatMap((zoom) => [2.5, 4].map((d) => ({ name, topology, zoom, d })))
    );

    it.each(cases)('$name at zoom $zoom with d = $d draws a consistent outline', ({ topology, zoom, d }) => {
        const first = sweep(topology, zoom, d);

        expect(first.problems).toEqual([]);
        expect(first.moved).toBeGreaterThan(0);
        expect(sweep(topology, zoom, d)).toEqual(first);
    });
});

describe('gap on real topologies', () => {
    it('separates Lesotho from South Africa on every side and keeps the host hole open', () => {
        const topology = southernAfricaItalyTopology as GapTopology;
        const { index, fixed, screen, features } = createScene(topology, 1);
        const byName = (name: string) => features.find((f) => f.name === name)!;

        const lesotho = byName('Lesotho');
        const southAfrica = byName('South Africa');
        const lesothoPolygon = lesotho.first;
        const drawnLesotho = insetPolygonRings(
            screen[lesothoPolygon],
            index.getPolygonRingInfo(fixed[lesothoPolygon])!,
            4
        )!;
        expect(drawnLesotho).toBeDefined();
        expect(Math.abs(signedArea(drawnLesotho[0]))).toBeLessThan(Math.abs(signedArea(screen[lesothoPolygon][0])));

        const hostPolygon = Array.from({ length: southAfrica.count }, (_, i) => southAfrica.first + i).find(
            (p) => screen[p].length > 1
        )!;
        const drawnHost = insetPolygonRings(screen[hostPolygon], index.getPolygonRingInfo(fixed[hostPolygon])!, 4)!;
        expect(drawnHost).toHaveLength(screen[hostPolygon].length);
        expect(Math.abs(signedArea(drawnHost[1]))).toBeGreaterThan(Math.abs(signedArea(screen[hostPolygon][1])));
    });

    it('does not draw microstates narrower than their share of the gap, and still draws their host', () => {
        const topology = southernAfricaItalyTopology as GapTopology;
        const { index, fixed, screen, features } = createScene(topology, 1);

        for (const name of ['Vatican City', 'San Marino']) {
            const { first } = features.find((f) => f.name === name)!;
            expect(index.getPolygonRingInfo(fixed[first])).toBeDefined();
            expect(insetPolygonRings(screen[first], index.getPolygonRingInfo(fixed[first])!, 4)).toBeUndefined();
        }

        const italy = features.find((f) => f.name === 'Italy')!;
        const mainland = Array.from({ length: italy.count }, (_, i) => italy.first + i).find(
            (p) => screen[p].length > 1
        )!;
        const holeAreas = screen[mainland].slice(1).map((ring) => Math.abs(signedArea(ring)));
        const drawn = insetPolygonRings(screen[mainland], index.getPolygonRingInfo(fixed[mainland])!, 4)!;

        // The sub-pixel Vatican City hole is dropped; San Marino's hole grows by the inset on every side.
        expect(drawn).toHaveLength(2);
        expect(Math.abs(signedArea(drawn[1]))).toBeGreaterThan(Math.max(...holeAreas));
    });

    it('insets the borders of Indonesia, Timor-Leste and Papua New Guinea and not their other coasts', () => {
        const { index, fixed, screen, features } = createScene(indonesiaTimorTopology as GapTopology, 1);

        for (const name of ['Indonesia', 'Timor-Leste', 'Papua New Guinea']) {
            const { first, count } = features.find((f) => f.name === name)!;
            const polygons = Array.from({ length: count }, (_, i) => first + i);
            const insets = polygons
                .filter((p) => index.getPolygonRingInfo(fixed[p]) != null)
                .map((p) => ({ p, drawn: insetPolygonRings(screen[p], index.getPolygonRingInfo(fixed[p])!, 3) }));
            const survivors = insets.filter(({ drawn }) => drawn != null);

            expect(survivors.length).toBeGreaterThan(0);
            expect(
                survivors.every(({ p, drawn }) => Math.abs(signedArea(drawn![0])) < Math.abs(signedArea(screen[p][0])))
            ).toBe(true);
            const others = polygons.filter((p) => index.getPolygonRingInfo(fixed[p]) == null);
            expect(others.every((p) => insetPolygonRings(screen[p], [], 3) === screen[p])).toBe(true);
        }
    });

    it('does not draw a Timor-Leste enclave narrower than its share of the gap', () => {
        const { index, fixed, screen, features } = createScene(indonesiaTimorTopology as GapTopology, 1);
        const { first, count } = features.find((f) => f.name === 'Timor-Leste')!;
        const drawn = Array.from({ length: count }, (_, i) => first + i).map((p) =>
            insetPolygonRings(screen[p], index.getPolygonRingInfo(fixed[p]) ?? [], 3)
        );

        expect(drawn.filter((polygon) => polygon != null)).toHaveLength(1);
    });

    it.each([1, 16])('draws islands that share no edge exactly as they were at zoom %d', (zoom) => {
        const { index, fixed, screen, features } = createScene(worldTopology as GapTopology, zoom);

        for (const name of ['Malta', 'Faroes', 'Mauritius']) {
            const { first, count } = features.find((f) => f.name === name)!;
            for (let p = first; p < first + count; p += 1) {
                expect(index.getPolygonRingInfo(fixed[p])).toBeUndefined();
                expect(insetPolygonRings(screen[p], [], 4)).toBe(screen[p]);
            }
        }
    });
});
