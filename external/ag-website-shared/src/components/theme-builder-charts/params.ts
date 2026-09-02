/**
 * The curated editor layout, following Studio's data-driven approach: value type
 * and default are derived by the shared layer (param type from the name, default
 * from the rendered theme), so only presentation hints live here.
 *
 * Every one of AG Charts' 46 public params appears in exactly one group -
 * asserted by `params.test.ts`, so a param added to the API cannot quietly go
 * missing from the builder. Which of them the panel shows without being asked
 * is decided at the foot of this file, from the defaults rather than by hand.
 */
import { CHARTS_PARAM_DEFAULTS } from './chartsTheme';

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
            { key: 'textColor', label: 'Text Color' },
            { key: 'subtleTextColor', label: 'Subtle Text Color' },
        ],
    },
    {
        id: 'chart',
        label: 'Chart',
        params: [
            { key: 'chartBackgroundColor', label: 'Chart Background' },
            { key: 'chartPadding', label: 'Chart Padding', icon: 'horizontalSpacing', min: 0, max: 60 },
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
        label: 'Borders',
        params: [
            { key: 'borderColor', label: 'Border Color' },
            { key: 'borderWidth', label: 'Border Width', min: 0, max: 8 },
            {
                key: 'borderRadius',
                label: 'Border Radius',
                icon: 'radius',
                swipeAdjustmentDivisor: 20,
                min: 0,
                max: 24,
            },
        ],
    },
    {
        id: 'chrome',
        label: 'Chrome',
        collapsed: true,
        params: [
            { key: 'chromeBackgroundColor', label: 'Background Color' },
            { key: 'chromeTextColor', label: 'Text Color' },
            { key: 'chromeSubtleTextColor', label: 'Subtle Text Color' },
            { key: 'chromeFontFamily', label: 'Font Family' },
            { key: 'chromeFontSize', label: 'Font Size', min: 8, max: 24 },
            { key: 'chromeFontWeight', label: 'Font Weight' },
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
        id: 'surfaces',
        label: 'Menus & Panels',
        collapsed: true,
        params: [
            { key: 'menuBackgroundColor', label: 'Menu Background' },
            { key: 'menuTextColor', label: 'Menu Text' },
            { key: 'menuBorder', label: 'Menu Border' },
            { key: 'menuBorderRadius', label: 'Menu Radius', icon: 'radius', min: 0, max: 24 },
            { key: 'panelBackgroundColor', label: 'Panel Background' },
            { key: 'panelSubtleTextColor', label: 'Panel Subtle Text' },
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
 * The params the panel keeps out of the way until asked for: 35 of AG Charts'
 * 46, whose defaults follow another param.
 *
 * They are the ones a theme rarely has to state. Chrome's text colour is the
 * foreground colour, and the menu's and the tooltip's are the chrome's - so
 * setting the foreground colour alone recolours all four correctly, while a
 * panel that lists every link in that chain asks for four decisions where one
 * would do. Worse, each one answered is a colour pinned in place while the rest
 * of the theme moves around it.
 *
 * Read from the defaults rather than listed here, so a param whose default
 * becomes a reference - or stops being one - changes side on its own. The
 * classification is the same for every stock theme, which `params.test.ts`
 * asserts: the themes that override these swap one derivation for another
 * rather than replacing it with a literal.
 */
export const INHERITED_KEYS = inheritedKeysOf(CHARTS_PARAM_DEFAULTS);
