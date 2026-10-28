import { normalizeType, parseJsDocs } from '@components/api-documentation/apiReferenceHelpers';

import { THEME_PARAM_GROUP_LINKS, getThemeParamGroups, themeParamDocsPath } from './getThemeParamGroups';

export interface ThemeParamRow {
    name: string;
    type: string;
    defaultValue: string;
    description: string;
}

export interface ThemeParamRowGroup {
    name: string;
    /** Docs pages covering the group, as site-relative paths. */
    links: { title: string; path: string }[];
    params: ThemeParamRow[];
}

/** Build-time only: every public theme param by group, with its type, default and description, for the markdown twin. */
export function getThemeParamRowGroups(): ThemeParamRowGroup[] {
    return getThemeParamGroups().map(({ name, members }) => ({
        name,
        links: (THEME_PARAM_GROUP_LINKS[name] ?? []).map((link) => ({
            title: link.title,
            path: themeParamDocsPath(link),
        })),
        params: members.map((member) => ({
            name: member.name,
            type: normalizeType(member.type),
            defaultValue: member.defaultValue ?? 'unset',
            description: parseJsDocs(member.docs) ?? '',
        })),
    }));
}
