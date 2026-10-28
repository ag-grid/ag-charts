import type { ApiReferenceType } from '@components/api-documentation/apiReferenceHelpers';
import type { MemberNode } from '@generate-code-reference-plugin/doc-interfaces/types';

import { getInterfacesReference } from './getInterfacesReference';
import { interfaceChain } from './getThemeParamDocs';

const ROOT_INTERFACE = 'AgChartThemeParams';

export const THEME_PARAM_GROUP_ORDER = [
    'Foundations',
    'Colours',
    'Spacing & Sizing',
    'Borders',
    'Titles',
    'Axes',
    'Crosshairs',
    'Legend',
    'Series Labels',
    'Buttons',
    'Inputs',
    'Menus & Popups',
    'Panels & Dialogs',
    'Drag & Drop',
    'Tooltips',
    'Toolbars',
    'Colour Picker',
    'Scrollbars',
    'Navigator',
];

export interface ThemeParamGroupLink {
    title: string;
    /** A frameworkless docs path, resolved through the `/r/` redirect route. */
    page: string;
}

/** The docs pages that cover a group's params; groups without a relevant page are omitted. */
export const THEME_PARAM_GROUP_LINKS: Record<string, ThemeParamGroupLink[]> = {
    Foundations: [{ title: 'Themes', page: 'themes' }],
    Colours: [{ title: 'Colours', page: 'colours' }],
    Borders: [{ title: 'Themes', page: 'themes' }],
    Axes: [
        { title: 'Axis Configuration', page: 'axes-configuration' },
        { title: 'Axis Labels', page: 'axes-labels' },
        { title: 'Axis Grid Lines & Band Shading', page: 'axes-grid-lines' },
    ],
    Crosshairs: [{ title: 'Crosshairs and Band Highlight', page: 'axes-crosshairs' }],
    Legend: [{ title: 'Legend', page: 'legend' }],
    'Series Labels': [{ title: 'Series Labels', page: 'series-labels' }],
    'Menus & Popups': [{ title: 'Context Menu', page: 'context-menu' }],
    Tooltips: [{ title: 'Tooltips', page: 'tooltips' }],
    Scrollbars: [{ title: 'Scrollbar', page: 'scrollbar' }],
    Navigator: [{ title: 'Navigator', page: 'navigator' }],
};

/** The frameworkless path of a docs page, for `urlWithBaseUrl`. */
export const themeParamDocsPath = ({ page }: ThemeParamGroupLink) => `/r/${page}/`;

/**
 * Params that lead their group, in this order. A string names one param; a pattern takes every param it
 * matches. Everything else follows by {@link themeParamGroups}' inheritance and alphabetical rules.
 */
export const THEME_PARAM_EXPLICIT_ORDER: Record<string, (string | RegExp)[]> = {
    Foundations: ['backgroundColor', 'foregroundColor', 'accentColor', 'fontFamily', 'fontSize', 'fontWeight'],
    Titles: [/^title[A-Z]/, /^subtitle[A-Z]/, /^footnote[A-Z]/],
};

export const themeParamGroupId = (name: string) => `group-${name.toLowerCase().replaceAll(/\W+/g, '-')}`;

export interface ThemeParamGroup {
    name: string;
    members: MemberNode[];
}

/**
 * Orders a group's params, so the page and its markdown twin list them identically whichever interface
 * declares them:
 *
 * 1. Params named in {@link THEME_PARAM_EXPLICIT_ORDER}, in that order.
 * 2. By inheritance depth: params that take their default from no param in the group first, then params
 *    that inherit from one, so each follows the param it inherits from.
 * 3. Alphabetically within each depth.
 *
 * The `Default:` marker is what says a param inherits: it names the params the default derives from.
 */
export function orderThemeParams(group: string, members: MemberNode[]): MemberNode[] {
    const byName = new Map(members.map((member) => [member.name, member]));
    const explicit = THEME_PARAM_EXPLICIT_ORDER[group] ?? [];
    const explicitRank = (name: string) => {
        const index = explicit.findIndex((entry) => (typeof entry === 'string' ? entry === name : entry.test(name)));
        return index === -1 ? explicit.length : index;
    };

    const parents = (member: MemberNode) =>
        (member.defaultValue?.match(/[A-Za-z_]\w*/g) ?? []).flatMap((word) => {
            const parent = word === member.name ? undefined : byName.get(word);
            return parent ? [parent] : [];
        });
    const depths = new Map<string, number>();
    const depth = (member: MemberNode): number => {
        const known = depths.get(member.name);
        if (known != null) {
            return known;
        }
        depths.set(member.name, 0); // Guards against a cycle, which a `Default:` should never make.
        const result = Math.max(-1, ...parents(member).map(depth)) + 1;
        depths.set(member.name, result);
        return result;
    };

    return members
        .map((member) => ({ member, rank: explicitRank(member.name), depth: depth(member) }))
        .sort((a, b) => {
            const byRank = a.rank - b.rank;
            if (byRank !== 0) return byRank;
            const byDepth = a.depth - b.depth;
            return byDepth === 0 ? a.member.name.localeCompare(b.member.name) : byDepth;
        })
        .map(({ member }) => member);
}

/** The public theme params by `@group`, ordered by {@link orderThemeParams}. */
export function themeParamGroups(reference: ApiReferenceType): ThemeParamGroup[] {
    const members = new Map<string, MemberNode>();
    for (const node of interfaceChain(reference, ROOT_INTERFACE)) {
        for (const member of node.members) {
            members.set(member.name, member);
        }
    }

    const groups = new Map<string, MemberNode[]>();
    for (const member of members.values()) {
        const group = member.group ?? 'Other';
        groups.set(group, [...(groups.get(group) ?? []), member]);
    }

    const rank = (name: string) => {
        const index = THEME_PARAM_GROUP_ORDER.indexOf(name);
        return index === -1 ? THEME_PARAM_GROUP_ORDER.length : index;
    };
    return [...groups]
        .map(([name, groupMembers]) => ({ name, members: orderThemeParams(name, groupMembers) }))
        .sort((a, b) => rank(a.name) - rank(b.name));
}

/** Build-time only: reads the generated interface reference from disk. */
export const getThemeParamGroups = () => themeParamGroups(getInterfacesReference());
