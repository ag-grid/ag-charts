import { describe, expect, it } from 'vitest';

import {
    buildTypeArguments,
    extractSearchData,
    formatTypeToCode,
    formatUnionSignature,
    getAliasedUnionVariants,
    getMemberType,
    getVariantDiscriminator,
    normalizeType,
    processMembers,
    resolveReferenceType,
} from './apiReferenceHelpers';

const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });
const prop = (name: string, type: any) => ({ kind: 'member' as const, name, type, optional: false });

// Mirrors `AgContextMenuItem`: `type` is inherited from a mixin as a type reference, so `showOn` is
// the only string literal.
const contextMenuVariant = (name: string, showOn: string) => ({
    kind: 'interface' as const,
    name,
    members: [prop('type', 'AgContextMenuItemType'), prop('showOn', `'${showOn}'`), prop('label', 'string')],
});

const contextMenuReference = () =>
    new Map<string, any>(
        Object.entries({
            AgContextMenuOptions: {
                kind: 'interface',
                name: 'AgContextMenuOptions',
                members: [prop('items', { kind: 'array', type: 'AgContextMenuItem' })],
            },
            AgContextMenuItem: alias(
                'AgContextMenuItem',
                union('AgContextMenuAlwaysItem', 'AgContextMenuAxisItem', 'AgContextMenuItemLiteral')
            ),
            AgContextMenuAlwaysItem: contextMenuVariant('AgContextMenuAlwaysItem', 'always'),
            AgContextMenuAxisItem: contextMenuVariant('AgContextMenuAxisItem', 'axis'),
            AgContextMenuItemLiteral: alias('AgContextMenuItemLiteral', union("'separator'")),
        })
    );

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

    // A generic nested inside another type argument (`Wrapper<SegmentOptions[]>`) must still resolve.
    it('recurses into structured type arguments', () => {
        const holderNode = {
            kind: 'interface' as const,
            name: 'Holder',
            typeParams: [{ kind: 'typeParam', name: 'SegmentOptions', default: 'AgSeriesShapeSegmentOptions' }],
            members: [
                {
                    kind: 'member',
                    name: 'wrapped',
                    type: {
                        kind: 'typeRef',
                        type: 'Wrapper',
                        typeArguments: [{ kind: 'array', type: 'SegmentOptions' }],
                    },
                },
            ],
            genericsMap: { SegmentOptions: 'AgSeriesShapeSegmentOptions' },
        };

        const [member] = processMembers(holderNode as any, {});

        expect(member.type).toEqual({
            kind: 'typeRef',
            type: 'Wrapper',
            typeArguments: [{ kind: 'array', type: 'AgSeriesShapeSegmentOptions' }],
        });
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

    it('names variants by their literal member when type is a type reference', () => {
        const contextMenu = contextMenuReference();
        const result = getAliasedUnionVariants(contextMenu.get('AgContextMenuItem'), contextMenu as any)!;

        expect(result.variants).toEqual([
            { name: 'always', type: 'AgContextMenuAlwaysItem' },
            { name: 'axis', type: 'AgContextMenuAxisItem' },
        ]);
        expect(result.primitive).toBe('AgContextMenuItemLiteral');
    });

    it('leaves primitive undefined for a pure interface-only union', () => {
        const result = getAliasedUnionVariants(reference.get('PureUnion'), reference as any)!;

        expect(result.variants).toHaveLength(2);
        expect(result.primitive).toBeUndefined();
    });
});

describe('getVariantDiscriminator', () => {
    it('prefers a string-literal type member', () => {
        const node = {
            kind: 'interface' as const,
            name: 'AgLineCrossLineOptions',
            members: [prop('type', "'line'"), prop('value', 'AgNumericValue')],
        };

        expect(getVariantDiscriminator(node as any)).toEqual({ key: 'type', value: 'line' });
    });

    it('falls back to the literal member when type is a type reference', () => {
        const node = contextMenuReference().get('AgContextMenuAxisItem');

        expect(getVariantDiscriminator(node)).toEqual({ key: 'showOn', value: 'axis' });
    });

    // Mirrors `AgStateSerializableDate`, whose discriminator is named `__type` rather than `type`.
    it('falls back to a literal member the interface declares under any name', () => {
        const node = {
            kind: 'interface' as const,
            name: 'AgStateSerializableDate',
            members: [prop('__type', "'date'"), prop('value', 'string')],
        };

        expect(getVariantDiscriminator(node as any)).toEqual({ key: '__type', value: 'date' });
    });

    it('returns undefined for an interface with no string-literal member', () => {
        const node = {
            kind: 'interface' as const,
            name: 'AgBaseAxisOptions',
            members: [prop('type', 'string'), prop('label', 'AgAxisLabelOptions')],
        };

        expect(getVariantDiscriminator(node as any)).toBeUndefined();
    });

    it('returns undefined for a generic type parameter member', () => {
        const node = {
            kind: 'interface' as const,
            name: 'AgNodeClickEvent',
            members: [prop('type', 'TEvent'), prop('series', 'AgSeriesOptions')],
        };

        expect(getVariantDiscriminator(node as any)).toBeUndefined();
    });
});

describe('extractSearchData', () => {
    it('labels union variants by their own discriminator', () => {
        const reference = contextMenuReference();

        const data = extractSearchData(
            reference as any,
            reference.get('AgContextMenuOptions'),
            [{ name: 'contextMenu', type: 'AgContextMenuOptions' }],
            'contextMenu.'
        );
        const labels = data.map(({ label }) => label);

        expect(labels).toContain("contextMenu.items[showOn='always']");
        expect(labels).toContain("contextMenu.items[showOn='axis']");
        expect(labels).toContain("contextMenu.items[showOn='axis'].label");
        expect(data.find(({ label }) => label === "contextMenu.items[showOn='axis']")?.navPath).toEqual([
            { name: 'contextMenu', type: 'AgContextMenuOptions' },
            { name: 'items', type: 'AgContextMenuItem' },
            { name: 'axis', type: 'AgContextMenuAxisItem' },
        ]);
    });

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

describe('resolveReferenceType', () => {
    const reference = new Map<string, any>(
        Object.entries({
            LabelOptions: { kind: 'interface', name: 'LabelOptions', members: [] },
            Label: alias('Label', 'LabelOptions'),
            Dangling: alias('Dangling', 'NotInReference'),
            CssColor: alias('CssColor', union('string')),
        })
    );

    it('resolves a plain interface to its node', () => {
        expect(resolveReferenceType(reference as any, 'LabelOptions')).toBe(reference.get('LabelOptions'));
    });

    it('resolves an alias to a known type as the alias and its target', () => {
        expect(resolveReferenceType(reference as any, 'Label')).toEqual([
            reference.get('Label'),
            reference.get('LabelOptions'),
        ]);
    });

    it('resolves an alias to an unknown type as the alias alone', () => {
        expect(resolveReferenceType(reference as any, 'Dangling')).toBe(reference.get('Dangling'));
    });

    it.each([
        ['a name hidden from the docs', 'CssColor'],
        ['a name absent from the reference', 'Missing'],
    ])('returns undefined for %s', (_label, typeName) => {
        expect(resolveReferenceType(reference as any, typeName)).toBeUndefined();
    });
});

describe('buildTypeArguments', () => {
    const member = (type: any) => ({ kind: 'member' as const, name: 'selection', type });

    it('resolves a type-param argument through the generics map', () => {
        const type = { kind: 'typeRef', type: 'Selection', typeArguments: ['ItemStyle', 'Explicit'] };

        expect(buildTypeArguments(member(type) as any, { ItemStyle: 'StyleOptions' })).toEqual([
            'StyleOptions',
            'Explicit',
        ]);
    });

    it('returns undefined for a typeRef without arguments', () => {
        expect(buildTypeArguments(member({ kind: 'typeRef', type: 'Selection' }) as any, {})).toBeUndefined();
    });

    // getMemberType unwraps `Foo<Bar>[]` to `Foo`, so the arguments must be read from the element
    // type too — otherwise the resolved interface falls back to its type-param defaults.
    it('unwraps an array member to read its element type arguments', () => {
        const type = { kind: 'array', type: { kind: 'typeRef', type: 'CrossLine', typeArguments: ['NumericValue'] } };

        expect(buildTypeArguments(member(type) as any, {})).toEqual(['NumericValue']);
    });

    it('returns undefined for a member that is not a typeRef', () => {
        expect(buildTypeArguments(member('boolean') as any, {})).toBeUndefined();
    });
});
