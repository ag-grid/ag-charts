import { describe, expect, it } from '@jest/globals';

import type { DatumIndexType, SeriesNodeDatum } from './seriesTypes';
import { findNodeDatumInArray } from './util';

type TestNode = SeriesNodeDatum<DatumIndexType>;

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
