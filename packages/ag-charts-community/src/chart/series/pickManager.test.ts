import { describe, expect, it } from 'vitest';

import { testLogger } from 'ag-charts-test';

import { DataSet } from '../data/dataSet';
import type { PickedNode } from './pickManager';
import { getItemId } from './pickManager';

function mockNode(overrides: Partial<PickedNode> & { datum?: unknown; datumIndex?: any }): PickedNode {
    return {
        // The helper under test never reads the series, so an empty stand-in is enough.
        series: {} as PickedNode['series'],
        datum: overrides.datum ?? {},
        datumIndex: overrides.datumIndex ?? 0,
        ...overrides,
    };
}

const ids = (dataIdKey: string) => DataSet.empty(testLogger, dataIdKey);

describe('getItemId', () => {
    it('should return node.itemId when set, even if dataIdKey is provided', () => {
        const node = mockNode({ itemId: 'foo', datum: { myId: 'bar' } });
        expect(getItemId(node, ids('myId'))).toBe('foo');
    });

    it('should return datum[dataIdKey] as string', () => {
        const node = mockNode({ datum: { myId: 'bar' } });
        expect(getItemId(node, ids('myId'))).toBe('bar');
    });

    it('should return datum[dataIdKey] as number', () => {
        const node = mockNode({ datum: { myId: 42 } });
        expect(getItemId(node, ids('myId'))).toBe(42);
    });

    it('should coerce non-number datum[dataIdKey] to string', () => {
        const node = mockNode({ datum: { myId: true } });
        expect(getItemId(node, ids('myId'))).toBe('true');
    });

    it('should fall back to datumIndex when no dataIdKey', () => {
        const node = mockNode({ datumIndex: 7 });
        expect(getItemId(node)).toBe(7);
    });

    it('should fall back to datumIndex when datum lacks dataIdKey field', () => {
        const node = mockNode({ datum: {}, datumIndex: 5 });
        expect(getItemId(node, ids('myId'))).toBe(5);
    });

    it('should fall back to datumIndex when datum[dataIdKey] is null', () => {
        const node = mockNode({ datum: { myId: null }, datumIndex: 3 });
        expect(getItemId(node, ids('myId'))).toBe(3);
    });
});
