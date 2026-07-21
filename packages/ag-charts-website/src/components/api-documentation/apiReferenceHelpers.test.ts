import { describe, expect, it } from 'vitest';

import {
    extractSearchData,
    formatTypeToCode,
    formatUnionSignature,
    getAliasedUnionVariants,
    getMemberType,
    normalizeType,
    processMembers,
} from './apiReferenceHelpers';

const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });

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

describe('formatTypeToCode', () => {
    const iface = (name: string, memberName: string) => ({
        kind: 'interface' as const,
        name,
        members: [{ kind: 'member', name: memberName, type: 'string', optional: false }],
    });

    // Mirrors `AgChartSeriesOptions = AgAreaSeriesOptions | AgBarSeriesOptions`, where each variant is
    // an interface with its own navigable page.
    const reference = new Map<string, any>(
        Object.entries({
            AgChartSeriesOptions: alias('AgChartSeriesOptions', union('AgAreaSeriesOptions', 'AgBarSeriesOptions')),
            AgAreaSeriesOptions: iface('AgAreaSeriesOptions', 'fillOpacity'),
            AgBarSeriesOptions: iface('AgBarSeriesOptions', 'cornerRadius'),
        })
    );
    const member = { kind: 'member', name: 'series', type: 'AgChartSeriesOptions', optional: false } as any;

    it('renders only the union alias when references are not expanded', () => {
        const code = formatTypeToCode(
            reference.get('AgChartSeriesOptions'),
            member,
            reference as any,
            new Set(),
            'series',
            false
        );

        expect(code).toContain('type AgChartSeriesOptions =');
        expect(code).toContain('AgAreaSeriesOptions');
        expect(code).toContain('AgBarSeriesOptions');
        expect(code).not.toContain('interface AgAreaSeriesOptions');
        expect(code).not.toContain('interface AgBarSeriesOptions');
    });

    it('inlines the variant interfaces by default', () => {
        const code = formatTypeToCode(
            reference.get('AgChartSeriesOptions'),
            member,
            reference as any,
            new Set(),
            'series'
        );

        expect(code).toContain('type AgChartSeriesOptions =');
        expect(code).toContain('interface AgAreaSeriesOptions');
        expect(code).toContain('interface AgBarSeriesOptions');
    });

    // Mirrors `AgChartContextMenuEvent = AgChartEvent<'contextMenuEvent', TContext>`: the resolved
    // node keeps `type: T` / `context?: TContext` members but carries a genericsMap that binds them.
    // The code block must substitute the generics just like the member table does.
    it('substitutes generic type parameters using the node genericsMap', () => {
        const eventNode = {
            kind: 'interface' as const,
            name: 'AgChartContextMenuEvent',
            typeParams: [{ kind: 'typeParam', name: 'TContext', default: 'ContextDefault' }],
            members: [
                { kind: 'member', name: 'type', type: 'T', optional: false },
                { kind: 'member', name: 'context', type: 'TContext', optional: true },
            ],
            genericsMap: { TContext: 'ContextDefault', T: "'contextMenuEvent'" },
        };
        const eventMember = { kind: 'member', name: 'action', type: 'AgChartContextMenuEvent', optional: true } as any;

        const code = formatTypeToCode(eventNode as any, eventMember, new Map() as any, new Set());

        expect(code).toContain("type: 'contextMenuEvent';");
        expect(code).toContain('context?: ContextDefault;');
        expect(code).not.toContain('type: T;');
        expect(code).not.toContain('context?: TContext;');
    });

    // Mirrors `AgSeriesSegmentation<SegmentOptions = AgSeriesShapeSegmentOptions>` with a
    // `segments: SegmentOptions[]` member: the generic is wrapped in an array, so it must resolve
    // to the default's element type rather than the raw parameter name.
    it('substitutes an array-wrapped generic parameter using its default', () => {
        const segmentationNode = {
            kind: 'interface' as const,
            name: 'AgSeriesSegmentation',
            typeParams: [{ kind: 'typeParam', name: 'SegmentOptions', default: 'AgSeriesShapeSegmentOptions' }],
            members: [{ kind: 'member', name: 'segments', type: { kind: 'array', type: 'SegmentOptions' } }],
            genericsMap: { SegmentOptions: 'AgSeriesShapeSegmentOptions' },
        };
        const segmentationMember = {
            kind: 'member',
            name: 'segmentation',
            type: 'AgSeriesSegmentation',
            optional: true,
        } as any;

        const code = formatTypeToCode(segmentationNode as any, segmentationMember, new Map() as any, new Set());

        expect(code).toContain('segments: AgSeriesShapeSegmentOptions[];');
        expect(code).not.toContain('segments: SegmentOptions[]');
    });
});

describe('processMembers generic substitution', () => {
    const segmentationNode = {
        kind: 'interface' as const,
        name: 'AgSeriesSegmentation',
        typeParams: [{ kind: 'typeParam', name: 'SegmentOptions', default: 'AgSeriesShapeSegmentOptions' }],
        members: [{ kind: 'member', name: 'segments', type: { kind: 'array', type: 'SegmentOptions' } }],
        genericsMap: { SegmentOptions: 'AgSeriesShapeSegmentOptions' },
    };

    // The default binding stands in when a reference site provides no explicit type argument.
    it('resolves an array-wrapped generic to its default binding', () => {
        const [member] = processMembers(segmentationNode as any, {});

        expect(normalizeType(member.type)).toBe('AgSeriesShapeSegmentOptions[]');
        // getMemberType feeds the drill-in lookup, so the element must be the concrete interface name.
        expect(getMemberType(member)).toBe('AgSeriesShapeSegmentOptions');
    });

    // Line series references it as `AgSeriesSegmentation<AgSeriesLineSegmentOptions>`.
    it('resolves an array-wrapped generic to an explicit type argument', () => {
        const [member] = processMembers(segmentationNode as any, {}, ['AgSeriesLineSegmentOptions']);

        expect(normalizeType(member.type)).toBe('AgSeriesLineSegmentOptions[]');
        expect(getMemberType(member)).toBe('AgSeriesLineSegmentOptions');
    });
});

describe('getAliasedUnionVariants', () => {
    const variant = (name: string, typeValue: string) => ({
        kind: 'interface' as const,
        name,
        members: [{ kind: 'member', name: 'type', type: `'${typeValue}'`, optional: false }],
    });

    const reference = new Map<string, any>(
        Object.entries({
            MixedUnion: alias('MixedUnion', union('string', 'number', 'LineVariant', 'RangeVariant')),
            PureUnion: alias('PureUnion', union('LineVariant', 'RangeVariant')),
            LineVariant: variant('LineVariant', 'line'),
            RangeVariant: variant('RangeVariant', 'range'),
            // Mirrors `title.text`: TextOrSegments = TextValue | ContentSegment[], where the variants
            // are nested inside an array of a union alias of interfaces.
            TextOrSegments: alias('TextOrSegments', union('TextValue', { kind: 'array', type: 'ContentSegment' })),
            TextValue: alias('TextValue', union('string', 'number', 'Date')),
            ContentSegment: alias('ContentSegment', union('TextSegment', 'ImageSegment')),
            TextSegment: variant('TextSegment', 'text'),
            ImageSegment: variant('ImageSegment', 'image'),
        })
    );

    it('returns interface variants and the joined non-interface members for a mixed union', () => {
        const result = getAliasedUnionVariants(reference.get('MixedUnion'), reference as any)!;

        expect(result.variants).toEqual([
            { name: 'line', type: 'LineVariant' },
            { name: 'range', type: 'RangeVariant' },
        ]);
        expect(result.primitive).toBe('string | number');
        // Variants are direct interfaces, not array members.
        expect(result.isArray).toBe(false);
    });

    it('expands array and nested-union-alias members into their discriminated variants', () => {
        const result = getAliasedUnionVariants(reference.get('TextOrSegments'), reference as any)!;

        expect(result.variants).toEqual([
            { name: 'text', type: 'TextSegment' },
            { name: 'image', type: 'ImageSegment' },
        ]);
        // ContentSegment[] yields variants, so only the genuinely non-interface member is primitive.
        expect(result.primitive).toBe('TextValue');
        // The variants arrive through an array member, so the nav renders array brackets.
        expect(result.isArray).toBe(true);
    });

    it('leaves primitive undefined for a pure interface-only union', () => {
        const result = getAliasedUnionVariants(reference.get('PureUnion'), reference as any)!;

        expect(result.variants).toHaveLength(2);
        expect(result.primitive).toBeUndefined();
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
