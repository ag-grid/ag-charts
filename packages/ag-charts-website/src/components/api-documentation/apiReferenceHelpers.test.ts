import { describe, expect, it } from 'vitest';

import { extractSearchData } from './apiReferenceHelpers';

// Regression for the themes-api page failing to load with "RangeError: Maximum call stack size
// exceeded". The crash was not infinite recursion — `extractSearchData` builds a finite but very
// large index (the AgChartTheme tree reaches ~150k entries), and the previous implementation
// assembled it with `results.push(...childArray)`. Spreading a child array as call arguments
// overflows V8's argument limit (~125k in Node, lower in browsers) and throws. The fix flattens the
// recursion into a shared accumulator so no large array is ever spread as arguments.
//
// This builds a non-cyclic Root -> Wide -> Leaf structure whose Wide subtree expands to
// breadth + breadth^2 entries, comfortably above the argument limit, reproducing the overflow.
function makeLargeReference(breadth: number) {
    const member = (name: string, type: string) => ({ kind: 'member', name, type, optional: false });
    const reference: Record<string, unknown> = {
        Root: { kind: 'interface', name: 'Root', members: [member('wide', 'Wide')] },
        Wide: {
            kind: 'interface',
            name: 'Wide',
            members: Array.from({ length: breadth }, (_, i) => member(`p${i}`, 'Leaf')),
        },
        Leaf: {
            kind: 'interface',
            name: 'Leaf',
            members: Array.from({ length: breadth }, (_, j) => member(`q${j}`, 'string')),
        },
    };
    return new Map<string, any>(Object.entries(reference));
}

describe('extractSearchData', () => {
    it('flattens a large reference without overflowing the argument limit', () => {
        const breadth = 400;
        const reference = makeLargeReference(breadth);

        const run = () => extractSearchData(reference as any, reference.get('Root'), [{ name: 'r', type: 'Root' }]);

        // Pre-fix this threw "Maximum call stack size exceeded" while spreading the Wide subtree.
        expect(run).not.toThrow();
        // Root(1) + Wide members(breadth) + Leaf members per Wide member(breadth^2).
        expect(run()).toHaveLength(1 + breadth + breadth * breadth);
    });
});
