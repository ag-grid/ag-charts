import { describe, expect, it } from 'vitest';

import { entries } from 'ag-charts-core';

import {
    buildTypeArgumentsFromGenericsMap,
    extractSearchData,
    getAliasedUnionVariants,
    processMembers,
} from './apiReferenceHelpers';

// Mirrors how the type generator emits an axis-specific cross-line option: a member-less interface
// whose single heritage is a union alias, with the per-axis label type supplied via genericsMap.
const reference = new Map<string, any>(
    entries({
        AgCartesianCrossLineOptions: {
            kind: 'interface',
            name: 'AgCartesianCrossLineOptions',
            members: [],
            heritage: [
                {
                    kind: 'typeRef',
                    type: 'AgBaseCrossLineOptions',
                    typeArguments: ['TValue', 'AgCartesianCrossLineLabelOptions'],
                },
            ],
            genericsMap: { TValue: 'AxisValue', LabelType: 'AgCartesianCrossLineLabelOptions' },
        },
        AgBaseCrossLineOptions: {
            kind: 'typeAlias',
            name: 'AgBaseCrossLineOptions',
            type: {
                kind: 'union',
                type: [
                    { kind: 'typeRef', type: 'AgLineCrossLineOptions', typeArguments: ['TValue', 'LabelType'] },
                    { kind: 'typeRef', type: 'AgRangeCrossLineOptions', typeArguments: ['TValue', 'LabelType'] },
                ],
            },
            genericsMap: { TValue: 'AxisValue', LabelType: 'AgCartesianCrossLineLabelOptions' },
        },
        AgLineCrossLineOptions: {
            kind: 'interface',
            name: 'AgLineCrossLineOptions',
            members: [
                { kind: 'member', name: 'type', type: "'line'", optional: false },
                { kind: 'member', name: 'value', type: 'TValue', optional: false },
                { kind: 'member', name: 'stroke', type: 'CssColor', optional: true },
                { kind: 'member', name: 'label', type: 'LabelType', optional: true },
            ],
            typeParams: [
                { kind: 'typeParam', name: 'TValue', default: 'AxisValue' },
                { kind: 'typeParam', name: 'LabelType', default: 'AgBaseCrossLineLabelOptions' },
            ],
            genericsMap: { TValue: 'AxisValue', LabelType: 'AgBaseCrossLineLabelOptions' },
        },
        AgRangeCrossLineOptions: {
            kind: 'interface',
            name: 'AgRangeCrossLineOptions',
            members: [
                { kind: 'member', name: 'type', type: "'range'", optional: false },
                { kind: 'member', name: 'range', type: { kind: 'tuple', type: ['TValue', 'TValue'] }, optional: false },
                { kind: 'member', name: 'stroke', type: 'CssColor', optional: true },
                { kind: 'member', name: 'label', type: 'LabelType', optional: true },
            ],
            typeParams: [
                { kind: 'typeParam', name: 'TValue', default: 'AxisValue' },
                { kind: 'typeParam', name: 'LabelType', default: 'AgBaseCrossLineLabelOptions' },
            ],
            genericsMap: { TValue: 'AxisValue', LabelType: 'AgBaseCrossLineLabelOptions' },
        },
        AgCartesianCrossLineLabelOptions: {
            kind: 'interface',
            name: 'AgCartesianCrossLineLabelOptions',
            members: [
                { kind: 'member', name: 'position', type: 'string', optional: true },
                { kind: 'member', name: 'rotation', type: 'number', optional: true },
            ],
        },
    })
);

const crossLineInterface = () => reference.get('AgCartesianCrossLineOptions');

describe('cross-line union navigation', () => {
    describe('search index (extractSearchData)', () => {
        const labels = () =>
            extractSearchData(reference as any, crossLineInterface(), [
                { name: 'x', type: 'AgCartesianCrossLineOptions' },
            ]).map((d) => d.label);

        it('expands an alias-to-union interface into discriminated branches', () => {
            const result = labels();
            expect(result.some((l) => l.includes("[type='line']"))).toBe(true);
            expect(result.some((l) => l.includes("[type='range']"))).toBe(true);
            expect(result.some((l) => l.endsWith("[type='line'].value"))).toBe(true);
            expect(result.some((l) => l.endsWith("[type='range'].range"))).toBe(true);
            expect(result.some((l) => l.endsWith("[type='line'].stroke"))).toBe(true);
        });

        it("resolves the variants' generic label member to the per-axis label type", () => {
            const result = labels();
            expect(result.some((l) => l.endsWith("[type='line'].label.position"))).toBe(true);
            expect(result.some((l) => l.endsWith("[type='line'].label.rotation"))).toBe(true);
        });
    });

    describe('nav tree variant resolution', () => {
        it('resolves the alias interface to its discriminated variants', () => {
            const union = getAliasedUnionVariants(crossLineInterface(), reference as any);
            expect(union?.variants.map((v) => v.name).sort()).toEqual(['line', 'range']);
            expect(union?.variants.map((v) => v.type).sort()).toEqual([
                'AgLineCrossLineOptions',
                'AgRangeCrossLineOptions',
            ]);
        });

        it("threads the alias genericsMap so a variant's label resolves to the per-axis type", () => {
            const union = getAliasedUnionVariants(crossLineInterface(), reference as any)!;
            const lineRef = reference.get('AgLineCrossLineOptions');
            const typeArguments = buildTypeArgumentsFromGenericsMap(lineRef, union.genericsMap);
            const labelMember = processMembers(lineRef, {}, typeArguments).find((m) => m.name === 'label');
            expect(labelMember?.type).toBe('AgCartesianCrossLineLabelOptions');
        });
    });
});

// Mirrors the current generator output: the axis-specific cross-line alias is now a direct union
// type alias over the per-axis Line/Range interfaces (`resolveAliasedUnion`'s first branch), and
// each variant interface carries the per-axis label type on its own `genericsMap` rather than on
// the alias. Node shapes copied from `resolved-interfaces.AUTO.json`.
const directUnionReference = new Map<string, any>(
    entries({
        AgCartesianCrossLineOptions: {
            kind: 'typeAlias',
            name: 'AgCartesianCrossLineOptions',
            type: {
                kind: 'union',
                type: [
                    {
                        kind: 'typeRef',
                        type: 'AgCartesianLineCrossLineOptions',
                        typeArguments: ['TValue', 'TContext'],
                    },
                    {
                        kind: 'typeRef',
                        type: 'AgCartesianRangeCrossLineOptions',
                        typeArguments: ['TValue', 'TContext'],
                    },
                ],
            },
            typeParams: [
                { kind: 'typeParam', name: 'TValue', default: 'AxisValue' },
                { kind: 'typeParam', name: 'TContext', default: 'ContextDefault' },
            ],
            genericsMap: { TValue: 'AxisValue', TContext: 'ContextDefault' },
        },
        AgCartesianLineCrossLineOptions: {
            kind: 'interface',
            name: 'AgCartesianLineCrossLineOptions',
            members: [
                { kind: 'member', name: 'type', type: "'line'", optional: false },
                { kind: 'member', name: 'value', type: 'TValue', optional: false },
                { kind: 'member', name: 'stroke', type: 'AgCssColorOrRef', optional: true },
                { kind: 'member', name: 'label', type: 'LabelType', optional: true },
            ],
            typeParams: [
                { kind: 'typeParam', name: 'TValue', default: 'AxisValue' },
                { kind: 'typeParam', name: 'TContext', default: 'ContextDefault' },
            ],
            genericsMap: {
                TValue: 'AxisValue',
                TContext: 'ContextDefault',
                LabelType: 'AgCartesianCrossLineLabelOptions',
            },
        },
        AgCartesianRangeCrossLineOptions: {
            kind: 'interface',
            name: 'AgCartesianRangeCrossLineOptions',
            members: [
                { kind: 'member', name: 'type', type: "'range'", optional: false },
                {
                    kind: 'member',
                    name: 'range',
                    type: { kind: 'tuple', type: ['TValue', 'TValue'] },
                    optional: false,
                },
                { kind: 'member', name: 'stroke', type: 'AgCssColorOrRef', optional: true },
                { kind: 'member', name: 'label', type: 'LabelType', optional: true },
            ],
            typeParams: [
                { kind: 'typeParam', name: 'TValue', default: 'AxisValue' },
                { kind: 'typeParam', name: 'TContext', default: 'ContextDefault' },
            ],
            genericsMap: {
                TValue: 'AxisValue',
                TContext: 'ContextDefault',
                LabelType: 'AgCartesianCrossLineLabelOptions',
            },
        },
        AgCartesianCrossLineLabelOptions: {
            kind: 'interface',
            name: 'AgCartesianCrossLineLabelOptions',
            members: [
                { kind: 'member', name: 'position', type: 'AgCrossLineLabelPosition', optional: true },
                { kind: 'member', name: 'rotation', type: 'Degree', optional: true },
            ],
        },
    })
);

const directUnionCrossLineAlias = () => directUnionReference.get('AgCartesianCrossLineOptions');

describe('cross-line union navigation (direct union alias)', () => {
    describe('search index (extractSearchData)', () => {
        const labels = () =>
            extractSearchData(directUnionReference as any, directUnionCrossLineAlias(), [
                { name: 'x', type: 'AgCartesianCrossLineOptions' },
            ]).map((d) => d.label);

        it('expands the direct union alias into discriminated branches with the per-axis label', () => {
            const result = labels();
            expect(result.some((l) => l.endsWith("[type='line'].label.position"))).toBe(true);
            expect(result.some((l) => l.endsWith("[type='line'].label.rotation"))).toBe(true);
        });
    });

    describe('nav tree variant resolution', () => {
        it('resolves the direct union alias to its two per-axis variants', () => {
            const union = getAliasedUnionVariants(directUnionCrossLineAlias(), directUnionReference as any);
            expect(union?.variants.map((v) => v.name).sort()).toEqual(['line', 'range']);
            expect(union?.variants.map((v) => v.type).sort()).toEqual([
                'AgCartesianLineCrossLineOptions',
                'AgCartesianRangeCrossLineOptions',
            ]);
        });

        it("resolves a variant's label from its own genericsMap, since the alias' genericsMap now carries only TValue/TContext", () => {
            const union = getAliasedUnionVariants(directUnionCrossLineAlias(), directUnionReference as any)!;
            expect(union.genericsMap).toEqual({ TValue: 'AxisValue', TContext: 'ContextDefault' });

            const lineVariant = union.variants.find((v) => v.name === 'line')!;
            const lineRef = directUnionReference.get(lineVariant.type);
            const typeArguments = buildTypeArgumentsFromGenericsMap(lineRef, lineRef.genericsMap);
            const labelMember = processMembers(lineRef, {}, typeArguments).find((m) => m.name === 'label');
            expect(labelMember?.type).toBe('AgCartesianCrossLineLabelOptions');
        });
    });
});
