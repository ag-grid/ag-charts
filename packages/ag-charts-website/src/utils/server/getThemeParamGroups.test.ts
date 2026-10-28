import type { ApiReferenceType } from '@components/api-documentation/apiReferenceHelpers';
import type { InterfaceNode, MemberNode } from '@generate-code-reference-plugin/doc-interfaces/types';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
    THEME_PARAM_GROUP_LINKS,
    THEME_PARAM_GROUP_ORDER,
    orderThemeParams,
    themeParamGroups,
} from './getThemeParamGroups';

const member = (name: string, group?: string, defaultValue?: string): MemberNode => ({
    kind: 'member',
    name,
    type: 'string',
    group,
    defaultValue,
});
const iface = (name: string, members: MemberNode[], heritage?: string[]): InterfaceNode => ({
    kind: 'interface',
    name,
    members,
    ...(heritage ? { heritage } : {}),
});

const reference = (chartsMembers: MemberNode[], baseMembers: MemberNode[] = []): ApiReferenceType =>
    new Map<string, InterfaceNode>([
        ['AgBaseChartThemeParams', iface('AgBaseChartThemeParams', baseMembers)],
        ['AgChartThemeParams', iface('AgChartThemeParams', chartsMembers, ['AgBaseChartThemeParams'])],
    ]);

const names = (groups: ReturnType<typeof themeParamGroups>) =>
    groups.map(({ name, members }) => [name, members.map((m) => m.name)]);

describe('themeParamGroups', () => {
    it('collects params from the interfaces the root extends, by group', () => {
        const groups = themeParamGroups(
            reference(
                [member('axisLineColor', 'Axes'), member('legendPadding', 'Legend'), member('axisLineWidth', 'Axes')],
                [member('borderWidth', 'Foundations')]
            )
        );

        expect(names(groups)).toEqual([
            ['Foundations', ['borderWidth']],
            ['Axes', ['axisLineColor', 'axisLineWidth']],
            ['Legend', ['legendPadding']],
        ]);
    });

    it('orders a group the same whichever interface declares each param', () => {
        const groups = themeParamGroups(
            reference(
                [member('chartBackgroundColor', 'Colours'), member('chromeBackgroundColor', 'Colours')],
                [member('textColor', 'Colours'), member('subtleTextColor', 'Colours')]
            )
        );

        expect(names(groups)).toEqual([
            ['Colours', ['chartBackgroundColor', 'chromeBackgroundColor', 'subtleTextColor', 'textColor']],
        ]);
    });

    it('lists groups in the fixed order rather than the order they first appear', () => {
        const groups = themeParamGroups(
            reference([member('a', 'Navigator'), member('b', 'Titles'), member('c', 'Foundations')])
        );

        expect(groups.map(({ name }) => name)).toEqual(['Foundations', 'Titles', 'Navigator']);
    });

    it('lists a param once when it is redeclared, and puts ungrouped params last', () => {
        const groups = themeParamGroups(
            reference([member('fontSize', 'Foundations'), member('stray')], [member('fontSize', 'Titles')])
        );

        expect(names(groups)).toEqual([
            ['Foundations', ['fontSize']],
            ['Other', ['stray']],
        ]);
    });

    describe('orderThemeParams', () => {
        const order = (group: string, members: MemberNode[]) => orderThemeParams(group, members).map((m) => m.name);

        it('leads with the explicit order, then the rest alphabetically', () => {
            expect(
                order('Foundations', [
                    member('zebra'),
                    member('fontWeight'),
                    member('accentColor'),
                    member('backgroundColor'),
                    member('alpha'),
                ])
            ).toEqual(['backgroundColor', 'accentColor', 'fontWeight', 'alpha', 'zebra']);
        });

        it('takes every param a pattern matches, in pattern order', () => {
            expect(
                order('Titles', [
                    member('footnoteColor'),
                    member('subtitleColor'),
                    member('titleFontSize'),
                    member('titleColor'),
                ])
            ).toEqual(['titleColor', 'titleFontSize', 'subtitleColor', 'footnoteColor']);
        });

        it('puts a param that inherits after the param it inherits from, whatever their names', () => {
            expect(
                order('Scrollbars', [
                    member('aHover', undefined, '`zThumb + foregroundColor`'),
                    member('zThumb', undefined, '`foregroundColor`'),
                    member('mTrack', undefined, '`6`'),
                ])
            ).toEqual(['mTrack', 'zThumb', 'aHover']);
        });

        it('ignores inheritance from params in another group', () => {
            expect(order('Axes', [member('a', undefined, '`other`'), member('z')])).toEqual(['a', 'z']);
        });

        it('keeps a param that inherits from a descendant of itself finite', () => {
            expect(order('Axes', [member('a', undefined, '`b`'), member('b', undefined, '`a`')])).toHaveLength(2);
        });
    });

    it('has an order entry for every group the types declare', () => {
        const types = readThemeParamsSource();
        const declared = new Set([...types.matchAll(/@group (.+)$/gm)].map(([, group]) => group));

        expect([...declared].filter((group) => !THEME_PARAM_GROUP_ORDER.includes(group))).toEqual([]);
        expect(THEME_PARAM_GROUP_ORDER.filter((group) => !declared.has(group))).toEqual([]);
    });

    it('links only to groups in the order and to docs pages that exist', () => {
        const links = Object.entries(THEME_PARAM_GROUP_LINKS);

        expect(links.filter(([group]) => !THEME_PARAM_GROUP_ORDER.includes(group))).toEqual([]);
        expect(
            links.flatMap(([, pages]) =>
                pages.filter(
                    ({ page }) => !existsSync(new URL(`../../content/docs/${page}/index.mdoc`, import.meta.url))
                )
            )
        ).toEqual([]);
    });

    it('documents a default for every param except those that are unset by default', () => {
        const documented = [...readThemeParamsSource().matchAll(/\/\*\*([^]*?)\*\/\s*(\w+)\??:/g)].filter(([, docs]) =>
            docs.includes('@group')
        );
        const withoutDefault = documented.filter(([, docs]) => !docs.includes('Default:')).map(([, , name]) => name);

        expect(documented.length).toBeGreaterThan(100);
        expect(withoutDefault).toEqual(['lineHeight']);
    });
});

function readThemeParamsSource(): string {
    return readFileSync(
        new URL('../../../../ag-charts-types/src/chart/themeParamsOptions.ts', import.meta.url),
        'utf-8'
    );
}
