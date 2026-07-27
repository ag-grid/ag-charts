import { describe, expect, it, vi } from 'vitest';

import { buildApiReferenceTable } from './renderApiReferenceTable';

const member = (name: string, type: any, extra: Record<string, unknown> = {}) => ({
    kind: 'member' as const,
    name,
    type,
    optional: true,
    ...extra,
});
const iface = (name: string, members: any[], extra: Record<string, unknown> = {}) => ({
    kind: 'interface' as const,
    name,
    members,
    ...extra,
});
const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });
const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
const typeRef = (type: string, typeArguments?: string[]) => ({ kind: 'typeRef' as const, type, typeArguments });

const makeReference = (nodes: Record<string, unknown>) => new Map<string, any>(Object.entries(nodes)) as any;

/** Body rows as `[property, type, default, description]`, with markdownTable's pipe escaping undone. */
function bodyRows(table: string): string[][] {
    return table
        .split('\n')
        .slice(2)
        .map((line) =>
            line
                .split(/(?<!\\)\|/)
                .slice(1, -1)
                .map((cell) => cell.trim().replaceAll('\\|', '|'))
        );
}

/** The `Property` column of each body row, which is what carries the nesting. */
function propertyPaths(table: string): string[] {
    return bodyRows(table).map(([property]) => property);
}

function row(table: string, property: string): string[] | undefined {
    return bodyRows(table).find((cells) => cells[0] === property);
}

describe('buildApiReferenceTable', () => {
    it('renders a flat interface of primitives', () => {
        const reference = makeReference({
            Root: iface('Root', [
                member('enabled', 'boolean', { docs: ['Whether it is on.'] }),
                member('name', 'string', { optional: false }),
            ]),
        });

        expect(buildApiReferenceTable(reference, { id: 'Root' })).toBe(
            [
                '| Property | Type | Default | Description |',
                '| --- | --- | --- | --- |',
                '| enabled | boolean |  | Whether it is on. |',
                '| name (required) | string |  |  |',
            ].join('\n')
        );
    });

    it('expands a nested interface as dotted-path rows directly after its parent', () => {
        const reference = makeReference({
            Root: iface('Root', [member('selection', typeRef('Selection')), member('width', 'number')]),
            Selection: iface('Selection', [member('enabled', 'boolean'), member('containment', 'string')]),
        });

        const table = buildApiReferenceTable(reference, { id: 'Root' });

        expect(propertyPaths(table)).toEqual(['selection', 'selection.enabled', 'selection.containment', 'width']);
        // The parent keeps its own docs and interface name; the name is what ties the dotted rows to it.
        expect(row(table, 'selection')).toEqual(['selection', 'Selection', '', '']);
    });

    it('composes paths across three levels', () => {
        const reference = makeReference({
            A: iface('A', [member('b', typeRef('B'))]),
            B: iface('B', [member('c', typeRef('C'))]),
            C: iface('C', [member('leaf', 'string')]),
        });

        expect(propertyPaths(buildApiReferenceTable(reference, { id: 'A' }))).toEqual(['b', 'b.c', 'b.c.leaf']);
    });

    it('emits a member default in the Default column', () => {
        const reference = makeReference({
            Root: iface('Root', [member('containment', 'string', { defaultValue: 'chart.selection.containment' })]),
        });

        expect(row(buildApiReferenceTable(reference, { id: 'Root' }), 'containment')).toEqual([
            'containment',
            'string',
            'chart.selection.containment',
            '',
        ]);
    });

    describe('cycles', () => {
        it('stops a mutual cycle without dropping the row that closes it', () => {
            const reference = makeReference({
                A: iface('A', [member('b', typeRef('B'))]),
                B: iface('B', [member('a', typeRef('A'))]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'A' }))).toEqual(['b', 'b.a']);
        });

        it('stops a self-reference', () => {
            const reference = makeReference({
                A: iface('A', [member('a', typeRef('A')), member('name', 'string')]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'A' }))).toEqual(['a', 'name']);
        });

        it('expands a shared type under each parent that references it', () => {
            const reference = makeReference({
                Root: iface('Root', [member('start', typeRef('Point')), member('end', typeRef('Point'))]),
                Point: iface('Point', [member('x', 'number')]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual([
                'start',
                'start.x',
                'end',
                'end.x',
            ]);
        });
    });

    // Mirrors `AgBarSeriesOptions.selection`, which is
    // `AgSelectionOptions<AgSelectionStyleOptions, AgSelectionStyleOptions>` — without the member's
    // own type arguments the children render the type-param names and dead-end there.
    it('substitutes generics so nested members resolve and keep expanding', () => {
        const reference = makeReference({
            Root: iface('Root', [member('selection', typeRef('Selection', ['StyleOptions', 'StyleOptions']))]),
            Selection: iface(
                'Selection',
                [member('selectedItem', 'ItemStyle'), member('unselectedItem', 'SeriesStyle')],
                {
                    typeParams: [
                        { kind: 'typeParam', name: 'ItemStyle', default: 'StyleOptions' },
                        { kind: 'typeParam', name: 'SeriesStyle', default: 'ItemStyle' },
                    ],
                }
            ),
            StyleOptions: iface('StyleOptions', [member('fill', 'string')]),
        });

        const table = buildApiReferenceTable(reference, { id: 'Root' });

        expect(propertyPaths(table)).toEqual([
            'selection',
            'selection.selectedItem',
            'selection.selectedItem.fill',
            'selection.unselectedItem',
            'selection.unselectedItem.fill',
        ]);
        expect(row(table, 'selection.selectedItem')?.[1]).toBe('StyleOptions');
    });

    describe('config attributes', () => {
        const reference = makeReference({
            Root: iface('Root', [
                member('a', typeRef('Child')),
                member('b', 'string'),
                member('c', 'string', { optional: false }),
            ]),
            Child: iface('Child', [member('b', 'number'), member('c', 'number', { optional: false })]),
        });

        it('scopes exclude to the top level so a nested member of the same name survives', () => {
            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root', exclude: ['b'] }))).toEqual([
                'a',
                'a.b',
                'a.c (required)',
                'c (required)',
            ]);
        });

        it('scopes include to the top level', () => {
            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root', include: ['a'] }))).toEqual([
                'a',
                'a.b',
                'a.c (required)',
            ]);
        });

        it('hides the required marker at every depth', () => {
            const paths = propertyPaths(buildApiReferenceTable(reference, { id: 'Root', hideRequired: true }));

            expect(paths).toEqual(['a', 'a.b', 'a.c', 'b', 'c']);
        });
    });

    describe('type cell', () => {
        it('expands a union alias so its variants survive', () => {
            const reference = makeReference({
                Root: iface('Root', [member('fill', typeRef('FillOptions'))]),
                FillOptions: alias('FillOptions', union('string', 'GradientFill')),
                GradientFill: iface('GradientFill', [member('stops', 'string')]),
            });

            expect(row(buildApiReferenceTable(reference, { id: 'Root' }), 'fill')?.[1]).toBe('string | GradientFill');
        });

        it('keeps arrayness when expanding a union alias', () => {
            const reference = makeReference({
                Root: iface('Root', [member('annotations', { kind: 'array', type: typeRef('Annotation') })]),
                Annotation: alias('Annotation', union('LineAnnotation', 'BoxAnnotation')),
                LineAnnotation: iface('LineAnnotation', [member('type', 'line')]),
                BoxAnnotation: iface('BoxAnnotation', [member('type', 'box')]),
            });

            expect(row(buildApiReferenceTable(reference, { id: 'Root' }), 'annotations')?.[1]).toBe(
                'Array<LineAnnotation | BoxAnnotation>'
            );
        });

        it('keeps the alias name when the expansion is too long to read', () => {
            const variants = Array.from({ length: 40 }, (_, i) => `'icon-name-${i}'`);
            const reference = makeReference({
                Root: iface('Root', [member('icon', typeRef('IconName'))]),
                IconName: alias('IconName', union(...variants)),
            });

            expect(row(buildApiReferenceTable(reference, { id: 'Root' }), 'icon')?.[1]).toBe('IconName');
        });

        it('leaves an inline union alone', () => {
            const reference = makeReference({
                Root: iface('Root', [member('position', union("'top'", "'bottom'"))]),
            });

            expect(row(buildApiReferenceTable(reference, { id: 'Root' }), 'position')?.[1]).toBe("'top' | 'bottom'");
        });
    });

    describe('members that must not expand', () => {
        it('leaves a union of interfaces flat', () => {
            const reference = makeReference({
                Root: iface('Root', [member('fill', typeRef('FillOptions'))]),
                FillOptions: alias('FillOptions', union('SolidFill', 'GradientFill')),
                SolidFill: iface('SolidFill', [member('colour', 'string')]),
                GradientFill: iface('GradientFill', [member('stops', 'string')]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual(['fill']);
        });

        it('leaves a hidden interface flat', () => {
            const reference = makeReference({
                Root: iface('Root', [member('colour', typeRef('CssColor'))]),
                CssColor: iface('CssColor', [member('internal', 'string')]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual(['colour']);
        });

        it('leaves an alias to an interface flat', () => {
            const reference = makeReference({
                Root: iface('Root', [member('label', typeRef('Label'))]),
                Label: alias('Label', 'LabelOptions'),
                LabelOptions: iface('LabelOptions', [member('text', 'string')]),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual(['label']);
        });

        it('leaves an enum flat', () => {
            const reference = makeReference({
                Root: iface('Root', [member('mode', typeRef('Mode'))]),
                Mode: { kind: 'enum', name: 'Mode', members: { A: 'a', B: 'b' } },
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual(['mode']);
        });

        it('leaves an empty interface flat', () => {
            const reference = makeReference({
                Root: iface('Root', [member('empty', typeRef('Empty'))]),
                Empty: iface('Empty', []),
            });

            expect(propertyPaths(buildApiReferenceTable(reference, { id: 'Root' }))).toEqual(['empty']);
        });
    });

    it('warns and clamps rather than emitting an unbounded table', () => {
        // A chain long enough to trip the depth cap: each level nests one further interface.
        const nodes: Record<string, unknown> = {};
        for (let i = 0; i < 20; i++) {
            nodes[`N${i}`] = iface(`N${i}`, [member('next', typeRef(`N${i + 1}`))]);
        }
        nodes.N20 = iface('N20', [member('leaf', 'string')]);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const paths = propertyPaths(buildApiReferenceTable(makeReference(nodes), { id: 'N0' }));

        expect(paths.length).toBe(8);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('apiReference "N0"'));
        warn.mockRestore();
    });

    describe('degrades to an empty string', () => {
        const reference = makeReference({
            Root: iface('Root', [member('a', 'string')]),
            NotAnInterface: alias('NotAnInterface', 'string'),
        });

        it.each([
            ['no id attribute', {}],
            ['an unknown id', { id: 'Missing' }],
            ['an id that is not an interface', { id: 'NotAnInterface' }],
            ['an interface with no members', { id: 'Root', exclude: ['a'] }],
        ])('for %s', (_label, attributes) => {
            expect(buildApiReferenceTable(reference, attributes)).toBe('');
        });
    });
});
