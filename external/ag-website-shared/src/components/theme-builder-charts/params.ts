/**
 * The curated editor layout, following Studio's data-driven approach: value type
 * and default are derived by the shared layer (param type from the name, default
 * from the rendered theme), so only presentation hints live here.
 *
 * Every one of AG Charts' 46 public params appears in exactly one group -
 * asserted by `params.test.ts`, so a param added to the API cannot quietly go
 * missing from the builder.
 */
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
