import { describe, expect, it } from 'vitest';

import type { SeriesNodeDatum } from './seriesTypes';
import { findNodeDatumInArray, visibleRangeIndices } from './util';

type TestNode = SeriesNodeDatum;

function mockNode(overrides: Partial<TestNode> & { datum?: unknown; datumIndex?: any }): TestNode {
    return {
        series: {} as any,
        datum: overrides.datum ?? {},
        datumIndex: overrides.datumIndex ?? 0,
        ...overrides,
    };
}

describe('findNodeDatumInArray', () => {
    it('should find by node.itemId (string)', () => {
        const target = mockNode({ itemId: 'a', datumIndex: 0 });
        const other = mockNode({ itemId: 'b', datumIndex: 1 });
        expect(findNodeDatumInArray('a', [other, target])).toBe(target);
    });

    it('should find by datumIndex (number)', () => {
        const target = mockNode({ datumIndex: 1 });
        const other = mockNode({ datumIndex: 0 });
        expect(findNodeDatumInArray(1, [other, target])).toBe(target);
    });

    it('should find by datum[dataIdKey] (string)', () => {
        const target = mockNode({ datum: { id: 'x' }, datumIndex: 0 });
        expect(findNodeDatumInArray('x', [target], 'id')).toBe(target);
    });

    it('should find by datum[dataIdKey] (number)', () => {
        const target = mockNode({ datum: { id: 42 }, datumIndex: 0 });
        expect(findNodeDatumInArray(42, [target], 'id')).toBe(target);
    });

    it('should coerce string to match numeric datum[dataIdKey]', () => {
        const target = mockNode({ datum: { id: 42 }, datumIndex: 0 });
        expect(findNodeDatumInArray('42', [target], 'id')).toBe(target);
    });

    it('should return undefined when no match', () => {
        const node = mockNode({ datumIndex: 0 });
        expect(findNodeDatumInArray('z', [node])).toBeUndefined();
    });

    it('should prefer node.itemId over dataIdKey', () => {
        const withItemId = mockNode({ itemId: 'x', datum: { id: 'y' }, datumIndex: 0 });
        const withDataId = mockNode({ datum: { id: 'x' }, datumIndex: 1 });
        expect(findNodeDatumInArray('x', [withItemId, withDataId], 'id')).toBe(withItemId);
    });

    it('should skip dataIdKey lookup when node.itemId is set', () => {
        const node = mockNode({ itemId: 'a', datum: { id: 'b' }, datumIndex: 0 });
        expect(findNodeDatumInArray('b', [node], 'id')).toBeUndefined();
    });

    it('should return undefined for empty nodeData', () => {
        expect(findNodeDatumInArray('a', [])).toBeUndefined();
        expect(findNodeDatumInArray('a', undefined)).toBeUndefined();
    });
});

describe('visibleRangeIndices', () => {
    const positions = [0, 10, 20, 30, 40];
    const ascending = (index: number): [number, number] => [positions[index], positions[index] + 5];
    const descending = (index: number): [number, number] => ascending(positions.length - 1 - index);

    it.each([
        [
            [-10, 100],
            [0, 5],
        ],
        [
            [0, 12],
            [0, 2],
        ],
        [
            [26, 100],
            [3, 5],
        ],
    ] as Array<[[number, number], [number, number]]>)(
        'finds the same range for range %j in either order',
        (range, expected) => {
            expect(visibleRangeIndices(1, positions.length, range, ascending)).toEqual(expected);

            const [start, end] = visibleRangeIndices(-1, positions.length, range, descending);
            expect([positions.length - end, positions.length - start]).toEqual(expected);
        }
    );

    it('includes the first index of descending data when it is in range', () => {
        expect(visibleRangeIndices(-1, positions.length, [38, 100], descending)).toEqual([0, 1]);
    });
});
