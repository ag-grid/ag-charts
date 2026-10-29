/**
 * The curated editor layout. Value type and default are derived by the shared
 * layer, so only presentation hints live here. A public param in no group is
 * edited from the All Parameters search instead.
 */
import type { ParamIcon } from '@ag-website-shared/components/theme-builder/icons';
import { paramToVariableName } from '@ag-website-shared/theming/utils';

import { CHARTS_PARAM_DEFAULTS, PUBLIC_PARAM_NAMES } from './chartsTheme';

/** Named because the preview watches for it, to show what it styles. See `editedGroup.ts`. */
export const TOOLTIPS_GROUP_ID = 'tooltips';

export interface ChartsParamConfig {
    key: string;
    label: string;
    icon?: ParamIcon;
    swipeAdjustmentDivisor?: number;
    /** Clamp for length editors (px). Colour and font params ignore these. */
    min?: number;
    max?: number;
}

/** A line of the panel: one param, or a wide one with a narrow one beside it. */
export type ChartsParamRow = ChartsParamConfig | [ChartsParamConfig, ChartsParamConfig];

export interface ChartsParamGroup {
    id: string;
    label: string;
    /** Open by default. The rest start collapsed to keep the panel scannable. */
    expanded?: boolean;
    params: ChartsParamRow[];
}

export const GENERAL_GROUP_ID = 'general';

export const PARAM_GROUPS: ChartsParamGroup[] = [
    {
        id: GENERAL_GROUP_ID,
        label: 'General',
        expanded: true,
        params: [
            [
                { key: 'fontFamily', label: 'Font Family' },
                { key: 'fontSize', label: 'Font Size', min: 8, max: 24 },
            ],
            { key: 'backgroundColor', label: 'Background Color' },
            { key: 'foregroundColor', label: 'Foreground Color' },
            { key: 'accentColor', label: 'Accent Color' },
            { key: 'chartPadding', label: 'Chart Padding', icon: 'horizontalSpacing', min: 0, max: 60 },
        ],
    },
    {
        id: 'captions',
        label: 'Titles',
        params: [
            { key: 'titleFontFamily', label: 'Title Font Family' },
            [
                { key: 'titleColor', label: 'Title Color' },
                { key: 'titleFontSize', label: 'Font Size', min: 8, max: 32 },
            ],
            { key: 'subtitleFontFamily', label: 'Subtitle Font Family' },
            [
                { key: 'subtitleColor', label: 'Subtitle Color' },
                { key: 'subtitleFontSize', label: 'Font Size', min: 8, max: 32 },
            ],
        ],
    },
    {
        id: 'axes',
        label: 'Axis & Grid',
        params: [
            { key: 'axisTitleFontFamily', label: 'Axis Title Font Family' },
            [
                { key: 'axisTitleColor', label: 'Axis Title Color' },
                { key: 'axisTitleFontSize', label: 'Font Size', min: 8, max: 24 },
            ],
            { key: 'axisLineColor', label: 'Axis Line Color' },
            { key: 'axisLineWidth', label: 'Axis Line Width', min: 0, max: 8 },
            { key: 'gridLineColor', label: 'Grid Line Color' },
            { key: 'axisLabelFontFamily', label: 'Axis Label Font Family' },
            [
                { key: 'axisLabelColor', label: 'Axis Label Color' },
                { key: 'axisLabelFontSize', label: 'Font Size', min: 8, max: 24 },
            ],
        ],
    },
    {
        id: 'legend',
        label: 'Legend',
        params: [
            { key: 'legendLabelFontFamily', label: 'Label Font Family' },
            [
                { key: 'legendLabelColor', label: 'Label Color' },
                { key: 'legendLabelFontSize', label: 'Font Size', min: 8, max: 24 },
            ],
            { key: 'legendMarkerSize', label: 'Marker Size', min: 4, max: 40 },
        ],
    },
    {
        id: 'seriesLabels',
        label: 'Series Labels',
        params: [
            { key: 'seriesLabelFontFamily', label: 'Label Font Family' },
            [
                { key: 'seriesLabelInsideTextColor', label: 'Inside Label Color' },
                { key: 'seriesLabelFontSize', label: 'Font Size', min: 8, max: 24 },
            ],
            { key: 'seriesLabelOutsideTextColor', label: 'Outside Label Color' },
        ],
    },
    {
        id: TOOLTIPS_GROUP_ID,
        label: 'Tooltips',
        params: [
            { key: 'tooltipBackgroundColor', label: 'Background Color' },
            { key: 'tooltipBorder', label: 'Border', icon: 'tooltipBorder' },
            { key: 'tooltipBorderRadius', label: 'Border Radius', icon: 'radius', min: 0, max: 24 },
            { key: 'tooltipTextColor', label: 'Label Color' },
        ],
    },
];

export const CURATED_KEYS = PARAM_GROUPS.flatMap((group) => group.params.flat().map(({ key }) => key));

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
