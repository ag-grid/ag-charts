/**
 * The curated editor layout: the essentials, in panel order. Every other public
 * param is reached through the panel's All Parameters search. Value type and
 * default are derived by the shared layer, so only presentation hints live here.
 */
import type { LengthIcon } from '@ag-website-shared/components/theme-builder/icons';
import { paramToVariableName } from '@ag-website-shared/theming/utils';

import { CHARTS_PARAM_DEFAULTS, PUBLIC_PARAM_NAMES } from './chartsTheme';

/** Named because the preview watches for them, to show what they style. See `editedGroup.ts`. */
export const TOOLTIPS_GROUP_ID = 'tooltips';
export const UI_GROUP_ID = 'ui';
export const CONTROLS_GROUP_ID = 'controls';
export const SCROLLBAR_GROUP_ID = 'scrollbar';

export interface ChartsParamConfig {
    key: string;
    label: string;
    icon?: LengthIcon;
    swipeAdjustmentDivisor?: number;
    /** Clamp for length editors (px). Colour and font params ignore these. */
    min?: number;
    max?: number;
}

/** A single param, or a pair laid out side by side on one row. */
export type ChartsParamEntry = ChartsParamConfig | [ChartsParamConfig, ChartsParamConfig];

export interface ChartsParamGroup {
    id: string;
    label: string;
    collapsed?: boolean;
    params: ChartsParamEntry[];
}

export const PARAM_GROUPS: ChartsParamGroup[] = [
    {
        id: 'general',
        label: 'General',
        params: [
            [
                { key: 'fontFamily', label: 'Font Family' },
                { key: 'fontSize', label: 'Font Size', min: 8, max: 24 },
            ],
            { key: 'backgroundColor', label: 'Background Color' },
            { key: 'foregroundColor', label: 'Foreground Color' },
            { key: 'accentColor', label: 'Accent Color' },
        ],
    },
    {
        id: 'borders',
        label: 'Borders & Spacing',
        collapsed: true,
        params: [
            { key: 'borderColor', label: 'Border Color' },
            {
                key: 'borderRadius',
                label: 'Border Radius',
                icon: 'radius',
                swipeAdjustmentDivisor: 20,
                min: 0,
                max: 24,
            },
            { key: 'chartPadding', label: 'Chart Padding', icon: 'horizontalSpacing', min: 0, max: 60 },
        ],
    },
    {
        id: 'axes',
        label: 'Axis & Grid',
        collapsed: true,
        params: [
            { key: 'axisTitleFontFamily', label: 'Axis Title Font Family' },
            [
                { key: 'axisTitleColor', label: 'Axis Title Color' },
                { key: 'axisTitleFontSize', label: 'Axis Title Size', min: 8, max: 24 },
            ],
            { key: 'axisLineColor', label: 'Axis Line Color' },
            { key: 'gridLineColor', label: 'Grid Line Color' },
        ],
    },
    {
        id: 'captions',
        label: 'Titles & Footnote',
        collapsed: true,
        params: [
            { key: 'titleFontFamily', label: 'Title Font Family' },
            [
                { key: 'titleColor', label: 'Title Color' },
                { key: 'titleFontSize', label: 'Title Size', min: 8, max: 32 },
            ],
            { key: 'subtitleFontFamily', label: 'Subtitle Font Family' },
            [
                { key: 'subtitleColor', label: 'Subtitle Color' },
                { key: 'subtitleFontSize', label: 'Subtitle Size', min: 8, max: 32 },
            ],
            { key: 'footnoteFontFamily', label: 'Footnote Font Family' },
            [
                { key: 'footnoteColor', label: 'Footnote Color' },
                { key: 'footnoteFontSize', label: 'Footnote Size', min: 8, max: 32 },
            ],
        ],
    },
];

export const groupParams = (group: ChartsParamGroup): ChartsParamConfig[] => group.params.flat();

export const CURATED_KEYS = PARAM_GROUPS.flatMap((group) => groupParams(group).map(({ key }) => key));

export const PALETTE_SECTION = 'Palette';
export const ALL_PARAMS_SECTION = 'All Parameters';

/** A param pinned into All Parameters was asked for explicitly, so a closed section would hide it. */
export const defaultOpenSections = (hasPinnedParams: boolean): string[] => [
    PALETTE_SECTION,
    ...PARAM_GROUPS.filter((group) => !group.collapsed).map((group) => group.label),
    ...(hasPinnedParams ? [ALL_PARAMS_SECTION] : []),
];

/**
 * Whether a param's default is derived from another param rather than chosen.
 * Covers every form a reference takes once translated - a bare `{ ref }`, a mix,
 * a composite whose members are references, and a raw CSS string naming a param
 * variable, which is how `focusShadow` tracks the accent colour.
 */
const isDerivedValue = (value: unknown): boolean => {
    if (typeof value === 'string') return value.includes('var(--ag-');
    if (typeof value !== 'object' || value == null || Array.isArray(value)) return false;
    return 'ref' in value || 'calc' in value || Object.values(value).some(isDerivedValue);
};

/** Which of a theme's params follow another one rather than standing alone. */
export const inheritedKeysOf = (params: Record<string, unknown>): Set<string> =>
    new Set(Object.keys(params).filter((key) => isDerivedValue(params[key])));

/**
 * The params that follow another one rather than standing alone. Read from the
 * defaults rather than listed here, so a param whose default becomes a reference
 * - or stops being one - changes side on its own. `params.test.ts` asserts the
 * classification holds for every stock theme.
 */
export const INHERITED_KEYS = inheritedKeysOf(CHARTS_PARAM_DEFAULTS);

/** `--ag-accent-color` back to `accentColor`, for a default written as raw CSS. */
const PARAM_BY_VARIABLE: Record<string, string | undefined> = Object.fromEntries(
    PUBLIC_PARAM_NAMES.map((property) => [paramToVariableName(property), property])
);

const collectSources = (value: unknown, found: string[]): void => {
    if (typeof value === 'string') {
        for (const [, variable] of value.matchAll(/var\((--ag-[a-z\d-]+)/g)) {
            const property = PARAM_BY_VARIABLE[variable];
            if (property != null) {
                found.push(property);
            }
        }
        return;
    }
    if (typeof value !== 'object' || value == null || Array.isArray(value)) {
        return;
    }
    const { ref, onto, calc } = value as { ref?: unknown; onto?: unknown; calc?: unknown };
    if (typeof calc === 'string') {
        found.push(...(calc.match(/[a-zA-Z]\w*/g) ?? []).filter((name) => PUBLIC_PARAM_NAMES.includes(name)));
        return;
    }
    if (typeof ref === 'string') {
        found.push(ref);
        if (typeof onto === 'string') {
            found.push(onto);
        }
        return;
    }
    // A composite - a border's colour and width - each member of which may be a
    // reference of its own.
    for (const member of Object.values(value)) {
        collectSources(member, found);
    }
};

/**
 * Which params a default follows, in the order it names them, so the panel can
 * say what an unset param inherits from rather than only that it inherits.
 */
export const inheritedSourcesOf = (value: unknown): string[] => {
    const found: string[] = [];
    collectSources(value, found);
    return [...new Set(found)];
};

/** What each inherited param follows, for the editor panel's footnotes. */
export const INHERITED_SOURCES: Record<string, string[] | undefined> = Object.fromEntries(
    [...INHERITED_KEYS].map((key) => [key, inheritedSourcesOf(CHARTS_PARAM_DEFAULTS[key])])
);
