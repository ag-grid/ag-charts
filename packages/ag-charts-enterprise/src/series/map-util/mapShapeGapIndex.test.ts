import { describe, expect, it } from 'vitest';

import {
    type Ring,
    rect,
    region,
    reverseRing,
    sideBySide,
    tJunction,
    tooth,
    tripoint,
} from '../map-test/gapSyntheticRings';
import { type GapTopology, createScene, topologyRegions } from '../map-test/gapTestUtil';
import indonesiaTimorTopology from '../map-test/indonesiaTimorTopology.json';
import londonBoroughTopology from '../map-test/londonBoroughTopology.json';
import southernAfricaItalyTopology from '../map-test/southernAfricaItalyTopology.json';
import usTopology from '../map-test/usTopology.json';
import worldTopology from '../map-test/worldTopology.json';
import { MapShapeGapIndex } from './mapShapeGapIndex';

function build(...regions: ReturnType<typeof region>[]): MapShapeGapIndex {
    const index = new MapShapeGapIndex();
    index.build(regions);
    return index;
}

function moved(index: MapShapeGapIndex, ring: Ring): number[] {
    const info = index.getRingInfo(ring);
    expect(info).toBeDefined();
    return Array.from(info!.movedEdges);
}

describe('MapShapeGapIndex', () => {
    describe('shared edges', () => {
        it('moves the edge two neighbours share exactly, on both rings', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(true, [b]));

            expect(moved(index, a)).toEqual([0, 1, 0, 0]);
            expect(moved(index, b)).toEqual([0, 0, 0, 1]);
            expect(index.getRingInfo(a)).toMatchObject({ vertexCount: 4, hole: false, orientation: 1 });
            expect(index.stats).toEqual({ rings: 2, vertices: 6, edges: 7, sharedEdges: 1, movedEdges: 1 });
        });

        it('moves a shared edge when only one of the two regions has a gap', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(false, [b]));

            expect(moved(index, a)).toEqual([0, 1, 0, 0]);
            expect(moved(index, b)).toEqual([0, 0, 0, 1]);
        });

        it('moves nothing when no region has a gap', () => {
            const { a, b } = sideBySide();
            const index = build(region(false, [a]), region(false, [b]));

            expect(index.getRingInfo(a)).toBeUndefined();
            expect(index.getRingInfo(b)).toBeUndefined();
            expect(index.getPolygonRingInfo([a])).toBeUndefined();
            expect(index.stats).toMatchObject({ sharedEdges: 1, movedEdges: 0 });
        });

        it('leaves unshared rings without info', () => {
            const island = rect(100, 100, 110, 110);
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(true, [b]), region(true, [island]));

            expect(index.getRingInfo(island)).toBeUndefined();
        });

        it('does not match edges that only partly overlap (T-junction)', () => {
            const { a, b } = tJunction();
            const index = build(region(true, [a]), region(true, [b]));

            expect(index.getRingInfo(a)).toBeUndefined();
            expect(index.getRingInfo(b)).toBeUndefined();
            expect(index.stats.sharedEdges).toBe(0);
        });

        it('matches rings of different polygons in the same region', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a], [b]));

            expect(moved(index, a)).toEqual([0, 1, 0, 0]);
            expect(moved(index, b)).toEqual([0, 0, 0, 1]);
        });

        it('aligns polygon ring infos with the polygon rings', () => {
            const { a, b } = sideBySide();
            const hole = rect(2, 2, 4, 4);
            const polygon = [a, hole];
            const index = build(region(true, polygon), region(true, [b]));

            const infos = index.getPolygonRingInfo(polygon);
            expect(infos).toHaveLength(2);
            expect(infos![0]).toBe(index.getRingInfo(a));
            expect(infos![1]).toBeUndefined();
        });

        it('rebuilds from scratch', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(true, [b]));
            index.build([region(true, [a])]);

            expect(index.getRingInfo(a)).toBeUndefined();
            expect(index.stats).toMatchObject({ rings: 1, sharedEdges: 0 });
        });
    });

    describe('duplicate rings', () => {
        it('indexes duplicate copies once and gives every copy the same info', () => {
            const { a, b } = sideBySide();
            const copy = a.map(([x, y]): [number, number] => [x, y]);
            const index = build(region(true, [a]), region(true, [copy]), region(true, [b]));

            expect(index.stats.rings).toBe(2);
            expect(index.getRingInfo(copy)).toBeDefined();
            expect(index.getRingInfo(copy)).toBe(index.getRingInfo(a));
        });

        it('does not make a duplicate neighbour its own copy', () => {
            const a = rect(0, 0, 10, 10);
            const copy = rect(0, 0, 10, 10);
            const index = build(region(true, [a]), region(true, [copy]));

            expect(index.getRingInfo(a)).toBeUndefined();
            expect(index.getRingInfo(copy)).toBeUndefined();
        });

        it('gaps a merged ring when any of its owners has a gap', () => {
            const { a, b } = sideBySide();
            const copy = rect(0, 0, 10, 10);
            const index = build(region(false, [a]), region(true, [copy]), region(false, [b]));

            expect(moved(index, a)).toEqual([0, 1, 0, 0]);
            expect(moved(index, copy)).toEqual([0, 1, 0, 0]);
            expect(moved(index, b)).toEqual([0, 0, 0, 1]);
        });

        it('treats the same ring as an exterior and as a hole as two rings', () => {
            const enclave = rect(10, 10, 20, 20);
            const host = [rect(0, 0, 30, 30), reverseRing(enclave)];
            const index = build(region(true, host), region(true, [enclave]));

            expect(index.stats.rings).toBe(3);
            expect(index.getRingInfo(host[1])).toMatchObject({ hole: true, orientation: -1 });
            expect(index.getRingInfo(enclave)).toMatchObject({ hole: false, orientation: 1 });
        });
    });

    describe('pinned vertices', () => {
        it('pins vertices shared by three rings', () => {
            const { r1, r2, r3 } = tripoint();
            const index = build(region(true, [r1]), region(true, [r2]), region(true, [r3]));

            expect(index.stats).toMatchObject({ rings: 3, sharedEdges: 3, movedEdges: 3 });
            expect(Array.from(index.getRingInfo(r1)!.pinned)).toEqual([1, 0, 0, 0]);
            expect(Array.from(index.getRingInfo(r2)!.pinned)).toEqual([1, 0, 0, 0]);
            expect(Array.from(index.getRingInfo(r3)!.pinned)).toEqual([1, 0, 0, 0, 0]);
        });

        it('does not pin vertices shared by two rings', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(true, [b]));

            expect(Array.from(index.getRingInfo(a)!.pinned)).toEqual([0, 0, 0, 0]);
        });
    });

    describe('runs', () => {
        it('gives both rings on a border the same canonical end', () => {
            const { a, b } = sideBySide();
            const index = build(region(true, [a]), region(true, [b]));

            // The canonical end is the lower coordinate key, (10, 0): the first vertex of a's run, the last of b's.
            expect(index.getRingInfo(a)!.runs).toEqual([{ start: 1, length: 1, reversed: false }]);
            expect(index.getRingInfo(b)!.runs).toEqual([{ start: 3, length: 1, reversed: true }]);
        });

        it('splits runs where the ring leaves the border and at tripoints', () => {
            const { r1, r2, r3 } = tripoint();
            const index = build(region(true, [r1]), region(true, [r2]), region(true, [r3]));

            // r1 shares (0,0)-(10,0) with r3 and (0,10)-(0,0) with r2, both ending at the pinned tripoint.
            expect(index.getRingInfo(r1)!.runs).toEqual([
                { start: 0, length: 1, reversed: false },
                { start: 3, length: 1, reversed: true },
            ]);
        });

        it('splits a long border into one run, whatever its direction', () => {
            const { a, b } = tooth();
            const index = build(region(true, [a]), region(true, [b]));
            const runsA = index.getRingInfo(a)!.runs;
            const runsB = index.getRingInfo(b)!.runs;

            expect(runsA.map((run) => run.length)).toEqual([5]);
            expect(runsB.map((run) => run.length)).toEqual([5]);
            expect(runsA[0].reversed).not.toBe(runsB[0].reversed);
        });

        it('anchors a closed run so both rings of an enclave walk it the same way', () => {
            const enclave = rect(10, 10, 20, 20);
            const hole = reverseRing(enclave);
            const index = build(region(true, [rect(0, 0, 30, 30), hole]), region(true, [enclave]));

            const enclaveInfo = index.getRingInfo(enclave)!;
            const holeInfo = index.getRingInfo(hole)!;
            expect(enclaveInfo.runs).toEqual([{ start: 0, length: 4, reversed: true }]);
            expect(holeInfo.runs).toEqual([{ start: 0, length: 4, reversed: false }]);
            expect(Array.from(enclaveInfo.pinned)).toEqual([1, 0, 0, 0]);
            expect(Array.from(holeInfo.pinned)).toEqual([1, 0, 0, 0]);
        });

        it('anchors a closed run on the same vertex whichever vertex the ring starts at', () => {
            const enclave = rect(10, 10, 20, 20);
            const rotated: Ring = [...enclave.slice(2, 4), ...enclave.slice(0, 2), enclave[2]];
            const index = build(region(true, [rect(0, 0, 30, 30), reverseRing(enclave)]), region(true, [rotated]));

            const info = index.getRingInfo(rotated)!;
            const anchor = info.runs[0].start;
            expect(rotated[anchor]).toEqual([10, 10]);
            expect(info.runs[0].length).toBe(4);
        });
    });

    describe('degenerate input', () => {
        it('skips rings that cannot border anything', () => {
            const { a, b } = sideBySide();
            const twoPoints: Ring = [
                [10, 0],
                [10, 10],
                [10, 0],
            ];
            const collinearRepeat: Ring = [
                [10, 0],
                [10, 10],
                [10, 0],
                [10, 10],
                [10, 0],
            ];
            const notANumber: Ring = [
                [10, 0],
                [Number.NaN, 10],
                [20, 20],
                [10, 0],
            ];
            const empty: Ring = [];
            const index = build(
                region(true, [a]),
                region(true, [b]),
                region(true, [twoPoints]),
                region(true, [collinearRepeat]),
                region(true, [notANumber]),
                region(true, [empty]),
                region(true, [])
            );

            expect(index.stats.rings).toBe(2);
            expect(index.getRingInfo(twoPoints)).toBeUndefined();
            expect(index.getRingInfo(collinearRepeat)).toBeUndefined();
            expect(index.getRingInfo(notANumber)).toBeUndefined();
            expect(moved(index, a)).toEqual([0, 1, 0, 0]);
        });

        it('indexes unclosed rings the same as closed ones', () => {
            const { a, b } = sideBySide();
            const open = a.slice(0, -1);
            const index = build(region(true, [open]), region(true, [b]));

            expect(Array.from(index.getRingInfo(open)!.movedEdges)).toEqual([0, 1, 0, 0]);
        });

        it('has empty stats before it is built and for no regions', () => {
            const index = new MapShapeGapIndex();
            expect(index.stats.rings).toBe(0);
            index.build([]);
            expect(index.stats).toEqual({ rings: 0, vertices: 0, edges: 0, sharedEdges: 0, movedEdges: 0 });
        });
    });

    describe('topologies', () => {
        const topologies: [string, GapTopology, number][] = [
            ['US states', usTopology as GapTopology, 582],
            ['world countries', worldTopology as GapTopology, 2677],
            ['London boroughs', londonBoroughTopology as GapTopology, 962],
        ];

        it.each(topologies)('finds every shared edge of the %s', (_name, topology, sharedEdges) => {
            const index = new MapShapeGapIndex();
            index.build(topologyRegions(topology));

            expect(index.stats.sharedEdges).toBe(sharedEdges);
            expect(index.stats.movedEdges).toBe(sharedEdges);
        });

        it('finds the closed enclave runs of Southern Africa and Italy', () => {
            const { index, fixed } = createScene(southernAfricaItalyTopology as GapTopology, 1);
            const closed = fixed
                .flat()
                .flatMap((ring) => {
                    const info = index.getRingInfo(ring);
                    return info == null ? [] : [info];
                })
                .filter((info) => info.runs.some((run) => run.length === info.vertexCount));

            expect(closed.length).toBeGreaterThanOrEqual(2);
        });

        it('finds the land border between Indonesia and Timor-Leste', () => {
            const index = new MapShapeGapIndex();
            index.build(topologyRegions(indonesiaTimorTopology as GapTopology));

            expect(index.stats.sharedEdges).toBeGreaterThan(0);
        });
    });
});
