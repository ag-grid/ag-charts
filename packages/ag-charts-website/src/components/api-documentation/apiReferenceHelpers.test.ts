import { describe, expect, it } from 'vitest';

import { extractSearchData, formatTypeToCode, normalizeType } from './apiReferenceHelpers';

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

describe('normalizeType', () => {
    it('throws on a nameless type-literal so genuinely-anonymous user-facing typings stay flagged', () => {
        expect(() => normalizeType({ kind: 'typeLiteral', members: [] } as any)).toThrow(/type-literals/);
    });

    it('renders the AgCssColorOrRef union without throwing once the color-ref members are interfaces', () => {
        const colorOrRef = {
            kind: 'union',
            type: [
                { kind: 'typeRef', type: 'CssColor' },
                { kind: 'typeRef', type: 'AgColorRef' },
                { kind: 'typeRef', type: 'AgColorRefMixOnto' },
            ],
        };

        expect(() => normalizeType(colorOrRef as any)).not.toThrow();
        expect(normalizeType(colorOrRef as any)).toBe('CssColor | AgColorRef | AgColorRefMixOnto');
    });
});

// Regression for the Options page crashing when expanding an Axes or Series section. The `formatter`
// option uses `RichFormatter`, whose normalised return type wrapped its segment variant in an inline
// `{ color?: CssColor }` object literal. The generator emitted that as a nameless `typeLiteral`, and
// rendering the formatter's code sample threw "Avoid using type-literals...". Naming the variant as an
// interface keeps it expandable. Mirrors the generator emission for `RichFormatter`'s return type.
describe('RichFormatter normalised return type', () => {
    const baseReference = {
        CssColor: { kind: 'typeAlias', name: 'CssColor', type: 'string' },
        ImageSegment: {
            kind: 'interface',
            name: 'ImageSegment',
            members: [{ kind: 'member', name: 'url', type: 'string', optional: false }],
        },
        NormalisedTextOrSegments: {
            kind: 'typeAlias',
            name: 'NormalisedTextOrSegments',
            type: {
                kind: 'union',
                type: [
                    'TextValue',
                    { kind: 'array', type: { kind: 'union', type: ['NormalisedTextSegment', 'ImageSegment'] } },
                ],
            },
        },
    };

    it('renders without throwing when the segment variant is a named interface', () => {
        const reference = new Map<string, any>(
            Object.entries({
                ...baseReference,
                NormalisedTextSegment: {
                    kind: 'interface',
                    name: 'NormalisedTextSegment',
                    members: [
                        { kind: 'member', name: 'text', type: 'TextValue', optional: false },
                        { kind: 'member', name: 'color', type: 'CssColor', optional: true },
                    ],
                },
            })
        );
        const node = reference.get('NormalisedTextOrSegments');
        expect(() => formatTypeToCode(node, { name: 'formatter' } as any, reference, new Set())).not.toThrow();
    });

    it('throws when the segment variant is a nameless type-literal (the pre-fix shape)', () => {
        const reference = new Map<string, any>(
            Object.entries({
                ...baseReference,
                NormalisedTextOrSegments: {
                    kind: 'typeAlias',
                    name: 'NormalisedTextOrSegments',
                    type: {
                        kind: 'union',
                        type: [
                            'TextValue',
                            {
                                kind: 'array',
                                type: {
                                    kind: 'union',
                                    type: [
                                        {
                                            kind: 'typeLiteral',
                                            members: [
                                                { kind: 'member', name: 'color', type: 'CssColor', optional: true },
                                            ],
                                        },
                                        'ImageSegment',
                                    ],
                                },
                            },
                        ],
                    },
                },
            })
        );
        const node = reference.get('NormalisedTextOrSegments');
        expect(() => formatTypeToCode(node, { name: 'formatter' } as any, reference, new Set())).toThrow(
            /type-literals/
        );
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
