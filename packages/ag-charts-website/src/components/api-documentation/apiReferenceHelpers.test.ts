import { describe, expect, it } from 'vitest';

import { extractSearchData, formatUnionSignature } from './apiReferenceHelpers';

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

describe('formatUnionSignature', () => {
    const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
    const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });
    const iface = (name: string) => ({ kind: 'interface' as const, name, members: [] });

    // Mirrors `TextOrSegments = TextValue | ContentSegment[]` where ContentSegment is a nested union
    // alias of two interfaces. The interfaces render as variant rows elsewhere, so the signature must
    // spell out the aliases but never inline the interface bodies.
    const reference = new Map<string, any>(
        Object.entries({
            TextOrSegments: alias('TextOrSegments', union('TextValue', { kind: 'array', type: 'ContentSegment' })),
            TextValue: alias('TextValue', union('string', 'number', 'Date')),
            ContentSegment: alias('ContentSegment', union('TextSegment', 'ImageSegment')),
            TextSegment: iface('TextSegment'),
            ImageSegment: iface('ImageSegment'),
            // AgColorType-like: a mixed union whose non-interface member is a hidden alias (CssColor).
            AgColorType: alias('AgColorType', union('CssColor', 'AgGradientColor')),
            AgGradientColor: iface('AgGradientColor'),
            // Pure interface-only union: nothing is lost, so no signature is needed.
            PureUnion: alias('PureUnion', union('AgGradientColor', 'TextSegment')),
        })
    );

    it('spells out alias members without inlining interface bodies', () => {
        const node = reference.get('TextOrSegments');
        const signature = formatUnionSignature(node.type, 'TextOrSegments', reference as any)!;

        expect(signature).toContain('type TextOrSegments =');
        expect(signature).toContain('TextValue');
        expect(signature).toContain('ContentSegment[]');
        expect(signature).toContain('type TextValue = string | number | Date;');
        expect(signature).toContain('type ContentSegment = TextSegment | ImageSegment;');
        // Interfaces are represented as variant rows, never inlined here.
        expect(signature).not.toContain('interface TextSegment');
        expect(signature).not.toContain('interface ImageSegment');
    });

    it('keeps a hidden alias member visible by name without expanding it', () => {
        const node = reference.get('AgColorType');
        const signature = formatUnionSignature(node.type, 'AgColorType', reference as any)!;

        expect(signature).toContain('CssColor');
        expect(signature).not.toContain('type CssColor');
    });

    it('returns undefined for a pure interface-only union', () => {
        const node = reference.get('PureUnion');
        expect(formatUnionSignature(node.type, 'PureUnion', reference as any)).toBeUndefined();
    });
});

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
