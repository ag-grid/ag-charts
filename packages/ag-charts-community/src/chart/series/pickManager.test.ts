import { describe, expect, it } from '@jest/globals';

import type { PickedNode } from './pickManager';
import { getItemId } from './pickManager';

function mockNode(overrides: Partial<PickedNode> & { datum?: unknown; datumIndex?: any }): PickedNode {
    return {
        series: {} as any,
        datum: overrides.datum ?? {},
        datumIndex: overrides.datumIndex ?? 0,
        ...overrides,
    };
}

describe('getItemId', () => {
    it('should return node.itemId when set, even if dataIdKey is provided', () => {
        const node = mockNode({ itemId: 'foo', datum: { myId: 'bar' } });
        expect(getItemId(node, 'myId')).toBe('foo');
    });

    it('should return datum[dataIdKey] as string', () => {
        const node = mockNode({ datum: { myId: 'bar' } });
        expect(getItemId(node, 'myId')).toBe('bar');
    });

    it('should return datum[dataIdKey] as number', () => {
        const node = mockNode({ datum: { myId: 42 } });
        expect(getItemId(node, 'myId')).toBe(42);
    });

    it('should coerce non-number datum[dataIdKey] to string', () => {
        const node = mockNode({ datum: { myId: true } });
        expect(getItemId(node, 'myId')).toBe('true');
    });

    it('should fall back to datumIndex when no dataIdKey', () => {
        const node = mockNode({ datumIndex: 7 });
        expect(getItemId(node)).toBe(7);
    });

    it('should fall back to datumIndex when datum lacks dataIdKey field', () => {
        const node = mockNode({ datum: {}, datumIndex: 5 });
        expect(getItemId(node, 'myId')).toBe(5);
    });

    it('should fall back to datumIndex when datum[dataIdKey] is null', () => {
        const node = mockNode({ datum: { myId: null }, datumIndex: 3 });
        expect(getItemId(node, 'myId')).toBe(3);
    });

    it('should JSON.stringify complex datumIndex', () => {
        const node = mockNode({ datumIndex: { a: 1 } });
        expect(getItemId(node)).toBe('{"a":1}');
    });
});
