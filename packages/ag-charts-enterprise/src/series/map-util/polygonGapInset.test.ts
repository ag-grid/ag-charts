import { describe, expect, it } from 'vitest';

import type { Position } from 'ag-charts-core';

import {
    type Ring,
    chamferedCorner,
    circle,
    coastArm,
    collinearBorder,
    fullyNeighbouredChamfer,
    microBorder,
    narrowCoastTip,
    nearCollinearCoast,
    pinnedEnclave,
    rampBetweenBorders,
    rect,
    region,
    reverseRing,
    rotateRing,
    scaleRing,
    sideBySide,
    thinNotch,
    tooth,
    tripoint,
} from '../map-test/gapSyntheticRings';
import { type GapTopology, SWEEP_TOPOLOGIES, createScene, rotateTopology } from '../map-test/gapTestUtil';
import indonesiaTimorTopology from '../map-test/indonesiaTimorTopology.json';
import southernAfricaItalyTopology from '../map-test/southernAfricaItalyTopology.json';
import worldTopology from '../map-test/worldTopology.json';
import { lineStringDistance } from './lineStringUtil';
import { MapShapeGapIndex } from './mapShapeGapIndex';
import { type GapInsetEdge, insetGapRing, insetPolygonRings, simplifyGapRing } from './polygonGapInset';

function indexOf(...regions: [boolean, Ring[]][]): MapShapeGapIndex {
    const index = new MapShapeGapIndex();
    index.build(regions.map(([hasGap, polygon]) => region(hasGap, polygon)));
    return index;
}

function indexRegions(...regions: ReturnType<typeof region>[]): MapShapeGapIndex {
    const index = new MapShapeGapIndex();
    index.build(regions);
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

/** Like `expectRing` for a ring wound clockwise, whatever vertex it starts at. */
function expectReversedRing(actual: readonly Position[] | undefined, expected: Position[]): void {
    expect(actual).toBeDefined();
    expectRing(reverseRing([...actual!]), expected);
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
                const edges: GapInsetEdge[] = [];
                expect(insetGapRing(simplified.points, simplified.moved, d, true, edges)).toBeDefined();
                const edge = edges.find((e) => e.edge === ramp);
                expect(edge).toBeDefined();
                const dot = (edge!.x1 - edge!.x0) * -1 + (edge!.y1 - edge!.y0) * -1;
                expect(dot).toBeGreaterThanOrEqual(0);
            }
        });

        it('slides both ends of a ramp that is long enough for them, and keeps its length', () => {
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

    describe('two slides on one short coast edge (DR2-1)', () => {
        it('never lets the slides at both ends of a 1-long coast tip add up to more than the tip', () => {
            const { a, b, c } = narrowCoastTip();
            const index = indexRings(a, b, c);
            const simplified = simplifyGapRing(a, index.getRingInfo(a)!)!;
            const tip = simplified.points.findIndex(([x, y]) => x === 14 && y === 4);
            expect(simplified.moved[tip]).toBe(0);

            for (const d of [0.75, 1, 2]) {
                const edges: GapInsetEdge[] = [];
                expect(insetGapRing(simplified.points, simplified.moved, d, true, edges)).toBeDefined();
                const drawn = edges.find((e) => e.edge === tip)!;
                // The tip runs from (14, 4) up to (14, 5): it is never drawn downwards, whatever the two ends ask for.
                expect(drawn.y1 - drawn.y0).toBeGreaterThanOrEqual(0);
                // Past the cap the slides give way to a step at the tip's own end: the top side starts from (14, 5).
                expect(drawn.x0).toBe(14);
                expect(drawn.x1).toBe(14);
                expect(drawn.y1).toBe(5);
            }
        });

        it('slides both ends of the tip when it is long enough for them', () => {
            const { a, b, c } = narrowCoastTip();
            const index = indexRings(a, b, c);
            const simplified = simplifyGapRing(a, index.getRingInfo(a)!)!;
            const tip = simplified.points.findIndex(([x, y]) => x === 14 && y === 4);
            const edges: GapInsetEdge[] = [];

            insetGapRing(simplified.points, simplified.moved, 0.25, true, edges);
            const drawn = edges.find((e) => e.edge === tip)!;
            expect([drawn.y0, drawn.y1]).toEqual([4.25, 4.75]);
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

    describe('start vertex', () => {
        const starts = [0, 1, 2, 3, 4];

        it.each([0.2, 2, 4])(
            'draws a ring whose every edge is shared as the same ring from every start vertex, at d = %d',
            (d) => {
                const { a, neighbours } = fullyNeighbouredChamfer();
                const drawn = starts.map((shift) => {
                    const rotated = rotateRing(a, shift);
                    return exterior(indexRings(rotated, ...neighbours), rotated, d);
                });

                for (const ring of drawn) {
                    expect(vertices(ring)).toEqual(vertices(drawn[0]));
                }
                // The chamfer is shorter than the offset at d = 2 and longer at d = 0.2.
                expect(vertices(drawn[0])).toHaveLength(d === 0.2 ? 5 : 4);
            }
        );

        it.each([
            {
                name: 'a spike on a pentagon',
                d: 0.5,
                ring: [
                    [7, 6],
                    [2, 0],
                    [4, 2],
                    [5, 2],
                    [7, 2],
                ],
            },
            {
                name: 'a notch on a hexagon',
                d: 0.5,
                ring: [
                    [1, 1],
                    [3, 3],
                    [2, 2],
                    [4, 4],
                    [7, 2],
                    [1, 7],
                ],
            },
        ])('removes the reversed edges of $name the same whichever edge the ring starts at (D-14)', ({ ring, d }) => {
            const points = ring as Position[];
            const moved = new Uint8Array(points.length).fill(1);
            const drawn = starts.slice(0, points.length).map((shift) => {
                const rotated = [...points.slice(shift), ...points.slice(0, shift)];
                return insetGapRing(rotated, moved, d, true);
            });

            expect(drawn[0]).toBeDefined();
            for (const result of drawn) {
                expect(vertices(result)).toEqual(vertices(drawn[0]));
            }
        });

        it.each([2.5, 4, 5])(
            'draws a closed enclave and the hole it fills the same from every start vertex, at d = %d',
            (d) => {
                const enclave = rect(10, 10, 20, 20);
                const results = starts.map((shift) => {
                    const rotated = rotateRing(enclave, shift);
                    const host = [rect(0, 0, 30, 30), reverseRing(rotateRing(enclave, (shift + 2) % 4))];
                    const index = indexOf([true, host], [true, [rotated]]);
                    const drawn = exterior(index, rotated, d);
                    return {
                        enclave: drawn && vertices(drawn),
                        host: inset(index, host, d)?.map((ring) => vertices(ring)),
                    };
                });

                for (const result of results) {
                    expect(result).toEqual(results[0]);
                }
            }
        );
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

        it('opens a gap box around an enclave too small to inset, wound like the hole', () => {
            const enclave = rect(10, 10, 10.2, 10.2);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);

            expect(inset(index, [enclave], 2)).toBeUndefined();
            const drawn = inset(index, host, 2)!;
            expect(drawn).toHaveLength(2);
            expectRing(reverseRing(drawn[1]), [
                [8, 8],
                [12, 8],
                [12, 12],
                [8, 12],
            ]);
            expect(signedArea(drawn[1])).toBeCloseTo(-16, 9);
        });

        it('draws the grown box for a hole whose inset ring has fewer than 3 distinct vertices (D-15)', () => {
            // A self-crossing hole: its one shared edge, (0, 0) to (0, 1), is offset by 2 to the opposite side of the
            // lobe that wins on net winding, and the surviving edges only ever visit 2 distinct points.
            const hole: Ring = [
                [1, 2],
                [0, 0],
                [0, 1],
                [3, 4],
                [1, 2],
            ];
            const host = [rect(-50, -50, 50, 50), hole];
            const neighbour = rect(-5, 0, 0, 1);
            const index = indexOf([true, host], [true, [neighbour]]);

            const drawn = inset(index, host, 2)!;
            expect(drawn).toHaveLength(2);
            expect(index.getRingInfo(hole)).toMatchObject({ hole: true, orientation: -1 });
            expectRing(reverseRing(drawn[1]), [
                [-2, -2],
                [5, -2],
                [5, 6],
                [-2, 6],
            ]);
            expect(signedArea(drawn[1])).toBeCloseTo(-56, 9);
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

        it('collapses a polygon whose exterior has fewer than 3 distinct vertices (D-15)', () => {
            // At d = 3 the drawn ring is a zero-width strip: 4 vertices, only 2 of them distinct.
            const { index, a } = narrow(3);

            expect(exterior(index, a, 3)).toBeUndefined();
        });

        it('collapses a polygon whose signed area has flipped sign (D-15)', () => {
            const { index, a } = narrow(3);

            expect(exterior(index, a, 3.5)).toBeUndefined();
        });

        it('does not throw for a screen ring whose points all coincide, and for non-finite inputs', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);

            expect(() => inset(index, [a], 2, 0)).not.toThrow();
            expect(inset(index, [a], 2, 0)).toBeUndefined();
            expect(() => inset(index, [a], Number.POSITIVE_INFINITY)).not.toThrow();
            const withNaN = scaleRing(a, 1).map(([x, y]): Position => [x, y]);
            withNaN[1] = [Number.NaN, Number.NaN];
            expect(() => insetPolygonRings([withNaN], index.getPolygonRingInfo([a])!, 2)).not.toThrow();
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

        it('drops the same vertices from both rings of an enclave pinned at one vertex by a third ring', () => {
            const { enclave, host, touching, pin } = pinnedEnclave();
            const hole = host[1];
            const index = indexOf([true, host], [true, [enclave]], [true, [touching]]);

            for (const ring of [enclave, hole]) {
                const info = index.getRingInfo(ring)!;
                expect(info.runs).toHaveLength(1);
                expect(info.runs[0].length).toBe(info.vertexCount);
                expect(ring[info.runs[0].start]).toEqual(pin);
            }

            const sizes: number[] = [];
            for (const scale of [1, 1.25, 4]) {
                const onEnclave = simplifyGapRing(scaleRing(enclave, scale), index.getRingInfo(enclave)!)!;
                const onHole = simplifyGapRing(scaleRing(hole, scale), index.getRingInfo(hole)!)!;
                const a = new Set(onEnclave.points.map(([x, y]) => keyOf([round(x / scale), round(y / scale)])));
                const b = new Set(onHole.points.map(([x, y]) => keyOf([round(x / scale), round(y / scale)])));
                expect(b).toEqual(a);
                expect(a.has(keyOf(pin))).toBe(true);
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

        it.each([2.5, 4])(
            'reaches into a neighbour with a smaller inset by at most d - w - dN, at d = %s (V9)',
            (d) => {
                const { a, b, width } = tooth();
                const index = indexRings(a, b);
                const dN = 0.5;

                const paintA = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
                const boundaryB = exterior(index, b, dN)!.filter(([x, y]) => x > 11 && y > 0 && y < 10);
                const [bLow, bHigh] = [
                    Math.min(...boundaryB.map(([, y]) => y)),
                    Math.max(...boundaryB.map(([, y]) => y)),
                ];
                expect([bLow, bHigh].map(round)).toEqual([4 - dN, 5 + dN]);

                const allowed = Math.max(0, d - width - dN);
                expect(bLow - Math.min(...paintA.map(([, y]) => y))).toBeLessThanOrEqual(allowed + 1e-9);
                expect(Math.max(...paintA.map(([, y]) => y)) - bHigh).toBeLessThanOrEqual(allowed + 1e-9);
            }
        );

        it('stays out of the neighbour entirely when both sides inset by the same distance', () => {
            const { a, b } = tooth();
            const index = indexRings(a, b);
            const d = 2.5;

            const paintA = exterior(index, a, d)!.filter(([x, y]) => x > 5 && y > 0 && y < 10);
            const boundaryB = exterior(index, b, d)!.filter(([x, y]) => x > 11 && y > 0 && y < 10);
            expect(Math.min(...paintA.map(([, y]) => y))).toBeGreaterThanOrEqual(
                Math.min(...boundaryB.map(([, y]) => y))
            );
            expect(Math.max(...paintA.map(([, y]) => y))).toBeLessThanOrEqual(Math.max(...boundaryB.map(([, y]) => y)));
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

    describe('distances', () => {
        it('moves each side of a border by its own distance (D-8: a gap 0 neighbour still moves by its stroke half)', () => {
            const { a, b } = sideBySide();
            const index = indexOf([true, [a]], [false, [b]]);

            expectRing(exterior(index, a, 2.5), [
                [0, 0],
                [7.5, 0],
                [7.5, 10],
                [0, 10],
            ]);
            expectRing(exterior(index, b, 0.5), [
                [10.5, 0],
                [20, 0],
                [20, 10],
                [10.5, 10],
            ]);
        });

        it('draws the same shape whatever the winding of the rings', () => {
            const { a, b } = sideBySide();
            const cwA = reverseRing(a);
            const cwB = reverseRing(b);
            const index = indexRings(cwA, cwB);

            expect(index.getRingInfo(cwA)).toMatchObject({ orientation: -1, hole: false });
            expectReversedRing(exterior(index, cwA, 2), [
                [0, 0],
                [8, 0],
                [8, 10],
                [0, 10],
            ]);
            expectReversedRing(exterior(index, cwB, 2), [
                [12, 0],
                [20, 0],
                [20, 10],
                [12, 10],
            ]);
        });

        it('grows the hole of a host whose rings are wound the other way', () => {
            const enclave = reverseRing(rect(10, 10, 20, 20));
            const host = [reverseRing(rect(0, 0, 30, 30)), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);

            const drawnHost = inset(index, host, 2)!;
            expectRing(drawnHost[1], [
                [8, 8],
                [22, 8],
                [22, 22],
                [8, 22],
            ]);
            expectReversedRing(exterior(index, enclave, 2), [
                [12, 12],
                [18, 12],
                [18, 18],
                [12, 18],
            ]);
        });

        it('moves a border by the same number of pixels wherever the chart is panned to', () => {
            const { a, b } = sideBySide();
            const index = indexRings(a, b);
            const pan = 123456;
            const panned = [scaleRing(a, 1).map(([x, y]): Position => [x + pan, y - pan])];
            const drawn = insetPolygonRings(panned, index.getPolygonRingInfo([a])!, 2.5)!;

            expect(Math.max(...drawn[0].map(([x]) => x))).toBeCloseTo(pan + 7.5, 6);
            expect(Math.min(...drawn[0].map(([x]) => x))).toBe(pan);
        });

        it('does not change the rings it is given', () => {
            const enclave = rect(10, 10, 20, 20);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = indexOf([true, host], [true, [enclave]]);
            const screen = host.map((ring) => scaleRing(ring, 3));
            const before = JSON.parse(JSON.stringify(screen));

            insetPolygonRings(screen, index.getPolygonRingInfo(host)!, 2);
            expect(screen).toEqual(before);
        });
    });

    describe('multi-part regions', () => {
        it('collapses one polygon without touching the other polygons of its region', () => {
            const { a, b } = sideBySide();
            const sliver = rect(0, 20, 3, 23);
            const sliverNeighbour = rect(3, 20, 13, 23);
            const index = indexRegions(region(true, [a], [sliver]), region(true, [b], [sliverNeighbour]));

            expect(inset(index, [sliver], 3)).toBeUndefined();
            expect(inset(index, [a], 3)).toBeDefined();
            expect(inset(index, [sliverNeighbour], 3)).toBeDefined();
            expectRing(exterior(index, a, 3), [
                [0, 0],
                [7, 0],
                [7, 10],
                [0, 10],
            ]);
            expect(inset(index, [sliver], 3)).toBeUndefined();
        });

        it('keeps an island of a region that has a neighbour as the same object', () => {
            const { a, b } = sideBySide();
            const island = [rect(100, 100, 100.1, 100.1)];
            const index = indexRegions(region(true, [a], island), region(true, [b]));

            expect(inset(index, [a], 2)).toBeDefined();
            expect(insetPolygonRings(island, index.getPolygonRingInfo(island) ?? [], 4)).toBe(island);
        });
    });

    describe('slides', () => {
        it('slides a border end along the coast edge it meets, and steps square when the edge is shorter', () => {
            const neighbour = rect(10, 0, 20, 10);
            // The coast leaves the end of the border up and to the left at 45 degrees: the end slides along it by d.
            const long: Ring = [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 20],
                [0, 0],
            ];
            const slid = exterior(indexRings(long, neighbour), long, 2)!;
            expect(slid.some(([x, y]) => Math.abs(x - 8) < 1e-9 && Math.abs(y - 12) < 1e-9)).toBe(true);

            // The same corner with a 0.7-long coast edge: the 2.8-long slide is past the edge, so the corner steps.
            const short: Ring = [
                [0, 0],
                [10, 0],
                [10, 10],
                [9.5, 10.5],
                [0, 10.5],
                [0, 0],
            ];
            const stepped = exterior(indexRings(short, neighbour), short, 2)!;
            expect(stepped).toContainEqual([8, 10]);
            expect(stepped).toContainEqual([10, 10]);
        });
    });

    describe('reflex slides', () => {
        const unitCoast = (tx: number): Position => [tx, Math.sqrt(1 - tx * tx)];
        const neighbour = rect(10, 0, 20, 10);
        const d = 2;

        // The border runs up x = 10 and the coast leaves its end to the right, a reflex corner for the fill: the moved
        // border meets the coast behind the original vertex, so the slide is negative.
        function reflexRing(tx: number, length: number): Ring {
            const [ux, uy] = unitCoast(tx);
            return [
                [0, 0],
                [10, 0],
                [10, 10],
                [10 + ux * length, 10 + uy * length],
                [0, 10 + uy * length],
                [0, 0],
            ];
        }

        const cases = [
            { name: 'a coast edge shorter than the slide', tx: Math.SQRT1_2, length: 0.7, slides: true },
            { name: 'a coast edge longer than the slide', tx: 0.6, length: 20, slides: true },
            { name: 'a slide past twice the distance', tx: 0.4, length: 20, slides: false },
        ];

        const has = (ring: Position[], [px, py]: Position) =>
            ring.some(([x, y]) => Math.abs(x - px) < 1e-9 && Math.abs(y - py) < 1e-9);

        function expectSlide(ring: Ring, other: Ring, tx: number, slides: boolean) {
            const drawn = exterior(indexRings(ring, other), ring, d)!;
            const [ux, uy] = unitCoast(tx);

            expect(has(drawn, [10 - d, 10 - (d * uy) / ux])).toBe(slides);
            expect(has(drawn, [10 - d, 10])).toBe(!slides);
        }

        it.each(cases)(
            'slides back past the corner only within twice the distance, with $name (coast edge second)',
            ({ tx, length, slides }) => {
                expectSlide(reflexRing(tx, length), neighbour, tx, slides);
            }
        );

        it.each(cases)(
            'slides back past the corner only within twice the distance, with $name (coast edge first)',
            ({ tx, length, slides }) => {
                expectSlide(reverseRing(reflexRing(tx, length)), reverseRing(neighbour), tx, slides);
            }
        );
    });

    describe('near-parallel joins', () => {
        it('offsets a vertex whose two moved edges are parallel within 1e-6 rad along the shared normal', () => {
            const a: Ring = [
                [0, 0],
                [10, 0],
                [10, 5],
                [10 + 5e-8, 10],
                [0, 10],
                [0, 0],
            ];
            const b: Ring = [
                [10, 0],
                [20, 0],
                [20, 10],
                [10 + 5e-8, 10],
                [10, 5],
                [10, 0],
            ];
            const index = indexRings(a, b);
            const drawn = exterior(index, a, 2)!;

            expect(drawn.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
            expect(drawn.some(([x, y]) => Math.abs(x - 8) < 1e-6 && Math.abs(y - 5) < 1e-6)).toBe(true);
            expect(Math.max(...drawn.map(([x]) => x))).toBeLessThan(8 + 1e-6);
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
        if (drawn.length !== polygon.length) report(p, 'a hole was dropped');
        if (Math.abs(signedArea(drawn[0])) > Math.abs(signedArea(polygon[0])) + 1e-6) report(p, 'the area grew');
        if (signedArea(drawn[0]) * signedArea(polygon[0]) <= 0) report(p, 'the exterior ring flipped');
        // DR2-7: the polygon's signed area, exterior plus holes (holes wind the other way), never grows.
        const total = (rings: readonly Position[][]) => rings.reduce((sum, ring) => sum + signedArea(ring), 0);
        if (Math.abs(total(drawn)) > Math.abs(total(polygon)) + 1e-6) report(p, 'the polygon area grew');
        for (let r = 0; r < polygon.length; r += 1) {
            if (infos[r] == null && !drawn.includes(polygon[r])) report(p, `unmoved ring ${r} was not kept as it was`);
        }

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

            const trace: GapInsetEdge[] = [];
            if (insetGapRing(points, moved, d, fillLeft, trace) == null) continue;
            for (const e of trace) {
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
    const topologies = SWEEP_TOPOLOGIES;
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

/** What a topology draws, per polygon: `null` for a collapsed one, else the signed area of each drawn ring. */
function outlines(topology: GapTopology, zoom: number, d: number): (number[] | null)[] {
    const { index, fixed, screen } = createScene(topology, zoom);
    return screen.map((polygon, p) => {
        const drawn = insetPolygonRings(polygon, index.getPolygonRingInfo(fixed[p]) ?? [], d);
        return drawn == null ? null : drawn.map((ring) => signedArea(ring));
    });
}

describe('gap sweep: start vertex', () => {
    const cases = SWEEP_TOPOLOGIES.flatMap(([name, topology]) =>
        [1, 16].flatMap((zoom) => [2.5, 4].map((d) => ({ name, topology, zoom, d })))
    );

    it.each(cases)(
        '$name at zoom $zoom with d = $d draws the same whichever vertex every ring starts at',
        ({ topology, zoom, d }) => {
            const expected = outlines(topology, zoom, d);
            expect(expected.some((areas) => areas != null)).toBe(true);

            for (const shift of [1, 3]) {
                const actual = outlines(rotateTopology(topology, shift), zoom, d);
                const differing: string[] = [];
                for (const [p, areas] of expected.entries()) {
                    const other = actual[p];
                    const same =
                        areas == null || other == null
                            ? areas === other
                            : areas.length === other.length &&
                              areas.every((area, r) => Math.abs(area - other[r]) <= 1e-6 * Math.max(1, Math.abs(area)));
                    if (!same)
                        differing.push(
                            `polygon ${p} shift ${shift}: ${JSON.stringify(areas)} vs ${JSON.stringify(other)}`
                        );
                }
                expect(differing.slice(0, 5)).toEqual([]);
            }
        }
    );
});

describe('gap sweep: both sides of a border', () => {
    const edgeKey = ([x0, y0]: Position, [x1, y1]: Position): string =>
        x0 < x1 || (x0 === x1 && y0 < y1) ? `${x0},${y0}|${x1},${y1}` : `${x1},${y1}|${x0},${y0}`;

    const topologies = SWEEP_TOPOLOGIES;
    const cases = topologies.flatMap(([name, topology]) => [1, 4, 16].map((zoom) => ({ name, topology, zoom })));

    it.each(cases)('$name at zoom $zoom: both rings of a border keep the same edges (D-13)', ({ topology, zoom }) => {
        const { index, fixed, screen } = createScene(topology, zoom);
        const owners = new Map<string, number>();

        for (let p = 0; p < fixed.length; p += 1) {
            for (let r = 0; r < fixed[p].length; r += 1) {
                const info = index.getRingInfo(fixed[p][r]);
                if (info == null) continue;
                const simplified = simplifyGapRing(screen[p][r], info)!;
                const { points, moved } = simplified;
                const keys = new Set<string>();
                for (let k = 0; k < points.length; k += 1) {
                    if (moved[k] === 1) keys.add(edgeKey(points[k], points[(k + 1) % points.length]));
                }
                for (const key of keys) owners.set(key, (owners.get(key) ?? 0) + 1);
            }
        }

        expect(owners.size).toBeGreaterThan(0);
        const unmatched = [...owners].filter(([, count]) => count !== 2).map(([key]) => key);
        expect(unmatched.slice(0, 5)).toEqual([]);
    });

    it.each(topologies)(
        '%s drawn twice from separate copies draws each copy exactly as one copy (V17)',
        (_name, topology) => {
            const single = createScene(topology, 1);
            const doubled = createScene({ features: [...topology.features, ...topology.features] }, 1);
            const half = doubled.fixed.length / 2;
            expect(half).toBe(single.fixed.length);

            const drawn = (scene: typeof single, p: number) =>
                insetPolygonRings(scene.screen[p], scene.index.getPolygonRingInfo(scene.fixed[p]) ?? [], 2.5);
            expect(doubled.index.stats.sharedEdges).toBe(single.index.stats.sharedEdges);
            expect(doubled.index.stats.rings).toBe(single.index.stats.rings);
            for (let p = 0; p < half; p += 1) {
                const expected = drawn(single, p);
                expect(drawn(doubled, p)).toEqual(expected);
                expect(drawn(doubled, p + half)).toEqual(expected);
            }
        }
    );
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

    it.each([
        [4, 2.5],
        [4, 4],
        [16, 4],
    ])('keeps Lesotho 2d from its host on every side at zoom %d with d = %d (V7)', (zoom, d) => {
        const { index, fixed, screen, features } = createScene(southernAfricaItalyTopology as GapTopology, zoom);
        const lesotho = features.find((f) => f.name === 'Lesotho')!.first;
        const southAfrica = features.find((f) => f.name === 'South Africa')!;
        const host = Array.from({ length: southAfrica.count }, (_, i) => southAfrica.first + i).find(
            (p) => screen[p].length > 1
        )!;

        const drawnLesotho = insetPolygonRings(screen[lesotho], index.getPolygonRingInfo(fixed[lesotho])!, d)!;
        const drawnHost = insetPolygonRings(screen[host], index.getPolygonRingInfo(fixed[host])!, d)!;
        const hole = drawnHost[1];

        const separation = Math.min(
            ...drawnLesotho[0].map((point) => lineStringDistance(hole, point[0], point[1])),
            ...hole.map((point) => lineStringDistance(drawnLesotho[0], point[0], point[1]))
        );
        expect(separation).toBeGreaterThanOrEqual(2 * d - 1e-6);
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
        const holes = screen[mainland].slice(1);
        const drawn = insetPolygonRings(screen[mainland], index.getPolygonRingInfo(fixed[mainland])!, 4)!;

        // Each hole is drawn grown, wound like the original, even where its enclave is not drawn.
        expect(drawn).toHaveLength(screen[mainland].length);
        for (const [i, hole] of holes.entries()) {
            expect(signedArea(drawn[i + 1]) * signedArea(hole)).toBeGreaterThan(0);
            expect(Math.abs(signedArea(drawn[i + 1]))).toBeGreaterThan(Math.abs(signedArea(hole)));
        }
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
