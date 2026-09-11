/**
 * The curated editor layout, following Studio's data-driven approach: value type
 * and default are derived by the shared layer (param type from the name, default
 * from the rendered theme), so only presentation hints live here.
 *
 * Every one of AG Charts' 46 public params appears in exactly one group -
 * asserted by `params.test.ts`, so a param added to the API cannot quietly go
 * missing from the builder. All of them are shown; which ones follow another
 * param, and which they follow, is worked out at the foot of this file from the
 * defaults rather than listed by hand.
 */
import { paramToVariableName } from '@ag-website-shared/theming/utils';

import { CHARTS_PARAM_DEFAULTS, PUBLIC_PARAM_NAMES } from './chartsTheme';

export type LengthIcon = 'radius' | 'verticalSpacing' | 'horizontalSpacing';

export interface ChartsParamConfig {
    key: string;
    label: string;
    icon?: LengthIcon;
    swipeAdjustmentDivisor?: number;
    /** Clamp for length editors (px). Colour and font params ignore these. */
    min?: number;
    max?: number;
}

export interface ChartsParamGroup {
    id: string;
    label: string;
    /** Groups past the essentials start collapsed to keep the panel scannable. */
    collapsed?: boolean;
    params: ChartsParamConfig[];
}

export const PARAM_GROUPS: ChartsParamGroup[] = [
    {
        id: 'general',
        label: 'General',
        params: [
            { key: 'fontFamily', label: 'Font Family' },
            { key: 'fontSize', label: 'Font Size', min: 8, max: 24 },
            { key: 'fontWeight', label: 'Font Weight' },
            { key: 'backgroundColor', label: 'Background Color' },
            { key: 'foregroundColor', label: 'Foreground Color' },
            { key: 'accentColor', label: 'Accent Color' },
            { key: 'chartPadding', label: 'Chart Padding', icon: 'horizontalSpacing', min: 0, max: 60 },
            {
                key: 'borderRadius',
                label: 'Border Radius',
                icon: 'radius',
                swipeAdjustmentDivisor: 20,
                min: 0,
                max: 24,
            },
            { key: 'textColor', label: 'Text Color' },
            { key: 'subtleTextColor', label: 'Subtle Text Color' },
            // Follows the background colour by default, so it sits with the colour
            // it mirrors rather than in a section of its own.
            { key: 'chartBackgroundColor', label: 'Chart Background' },
        ],
    },
    {
        id: 'axes',
        label: 'Axes & Grid',
        params: [
            { key: 'axisLineColor', label: 'Axis Line Color' },
            { key: 'gridLineColor', label: 'Grid Line Color' },
            { key: 'groupedCategoryLineColor', label: 'Grouped Category Line' },
            { key: 'crosshairLabelBackgroundColor', label: 'Crosshair Label Background' },
            { key: 'crosshairLabelTextColor', label: 'Crosshair Label Text' },
        ],
    },
    {
        id: 'borders',
        label: 'Borders & Spacing',
        params: [
            { key: 'borderColor', label: 'Border Color' },
            { key: 'borderWidth', label: 'Border Width', min: 0, max: 8 },
        ],
    },
    {
        id: 'ui',
        label: 'UI Elements',
        collapsed: true,
        params: [
            { key: 'chromeBackgroundColor', label: 'Background Color' },
            { key: 'chromeTextColor', label: 'Text Color' },
            { key: 'chromeSubtleTextColor', label: 'Subtle Text Color' },
            { key: 'chromeFontFamily', label: 'Font Family' },
            { key: 'chromeFontSize', label: 'Font Size', min: 8, max: 24 },
            { key: 'chromeFontWeight', label: 'Font Weight' },
            { key: 'menuBackgroundColor', label: 'Menu Background' },
            { key: 'menuTextColor', label: 'Menu Text' },
            { key: 'menuBorder', label: 'Menu Border' },
            { key: 'menuBorderRadius', label: 'Menu Radius', icon: 'radius', min: 0, max: 24 },
            { key: 'panelBackgroundColor', label: 'Panel Background' },
            { key: 'panelSubtleTextColor', label: 'Panel Subtle Text' },
        ],
    },
    {
        id: 'tooltips',
        label: 'Tooltips',
        collapsed: true,
        params: [
            { key: 'tooltipBackgroundColor', label: 'Background Color' },
            { key: 'tooltipTextColor', label: 'Text Color' },
            { key: 'tooltipSubtleTextColor', label: 'Subtle Text Color' },
            { key: 'tooltipBorder', label: 'Border' },
            { key: 'tooltipBorderRadius', label: 'Border Radius', icon: 'radius', min: 0, max: 24 },
        ],
    },
    {
        id: 'controls',
        label: 'Buttons & Inputs',
        collapsed: true,
        params: [
            { key: 'buttonBackgroundColor', label: 'Button Background' },
            { key: 'buttonTextColor', label: 'Button Text' },
            { key: 'buttonBorder', label: 'Button Border' },
            { key: 'buttonBorderRadius', label: 'Button Radius', icon: 'radius', min: 0, max: 24 },
            { key: 'buttonFontWeight', label: 'Button Font Weight' },
            { key: 'inputBackgroundColor', label: 'Input Background' },
            { key: 'inputTextColor', label: 'Input Text' },
            { key: 'inputBorder', label: 'Input Border' },
            { key: 'inputBorderRadius', label: 'Input Radius', icon: 'radius', min: 0, max: 24 },
        ],
    },
    {
        id: 'effects',
        label: 'Effects',
        collapsed: true,
        params: [
            { key: 'focusShadow', label: 'Focus Shadow' },
            { key: 'popupShadow', label: 'Popup Shadow' },
        ],
    },
];

export const CURATED_KEYS = PARAM_GROUPS.flatMap((group) => group.params.map(({ key }) => key));

/**
 * Whether a param's default is derived from another param rather than chosen.
 *
 * Covers all three forms a reference takes once translated: a bare `{ ref }`, a
 * mix of two of them, and a composite whose members are references - a border's
 * colour and width. A raw CSS string counts too when it names a param variable,
 * which is how `focusShadow` tracks the accent colour.
 */
const isDerivedValue = (value: unknown): boolean => {
    if (typeof value === 'string') return value.includes('var(--ag-');
    if (typeof value !== 'object' || value == null || Array.isArray(value)) return false;
    return 'ref' in value || Object.values(value).some(isDerivedValue);
};

/** Which of a theme's params follow another one rather than standing alone. */
export const inheritedKeysOf = (params: Record<string, unknown>): Set<string> =>
    new Set(
        Object.entries(params)
            .filter(([, value]) => isDerivedValue(value))
            .map(([key]) => key)
    );

/**
 * The params that follow another one rather than standing alone: 35 of AG
 * Charts' 46.
 *
 * They are the ones a theme rarely has to state. Chrome's text colour is the
 * foreground colour, and the menu's and the tooltip's are the chrome's - so
 * setting the foreground colour alone recolours all four correctly, and each of
 * the three answered by hand is a colour pinned in place while the rest of the
 * theme moves around it. The panel shows them all the same, and says under each
 * one that its value is inherited, so that the difference is visible before it
 * is a surprise.
 *
 * Read from the defaults rather than listed here, so a param whose default
 * becomes a reference - or stops being one - changes side on its own. The
 * classification is the same for every stock theme, which `params.test.ts`
 * asserts: the themes that override these swap one derivation for another
 * rather than replacing it with a literal.
 */
export const INHERITED_KEYS = inheritedKeysOf(CHARTS_PARAM_DEFAULTS);

/** `--ag-accent-color` back to `accentColor`, for a default written as raw CSS. */
const PARAM_BY_VARIABLE: Record<string, string> = Object.fromEntries(
    PUBLIC_PARAM_NAMES.map((property) => [paramToVariableName(property), property])
);

const collectSources = (value: unknown, found: string[]): void => {
    if (typeof value === 'string') {
        for (const [, variable] of value.matchAll(/var\((--ag-[a-z\d-]+)/g)) {
            const property = PARAM_BY_VARIABLE[variable];
            if (property) {
                found.push(property);
            }
        }
        return;
    }
    if (typeof value !== 'object' || value == null || Array.isArray(value)) {
        return;
    }
    const { ref, onto } = value as { ref?: unknown; onto?: unknown };
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
 * Which params a default follows, in the order it names them: the one a `{ ref }`
 * points at, both ends of a blend, each member of a composite, and the
 * `var(--ag-*)` names in a default written as raw CSS.
 *
 * Named so the panel can say what an unset param inherits from, rather than
 * only that it inherits.
 */
export const inheritedSourcesOf = (value: unknown): string[] => {
    const found: string[] = [];
    collectSources(value, found);
    return [...new Set(found)];
};

/** What each inherited param follows, for the editor panel's footnotes. */
export const INHERITED_SOURCES: Record<string, string[]> = Object.fromEntries(
    [...INHERITED_KEYS].map((key) => [key, inheritedSourcesOf(CHARTS_PARAM_DEFAULTS[key])])
);
