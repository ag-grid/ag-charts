import type { CssColor, CssShadow, FontFamilyFull, FontSize, FontWeight, PixelSize } from './types';

type ColorKeys<T> = {
    [K in keyof T]: T[K] extends AgCssColorOrRef ? K : never;
}[keyof T];
export type AgThemeColorParam = ColorKeys<Required<AgChartThemeParams>>;

// A color ref operation must have `mix` if it has `onto`, they are not independently optional.
export interface AgColorRef {
    ref: AgThemeColorParam;
    mix?: number;
}
export interface AgColorRefMixOnto {
    ref: AgThemeColorParam;
    mix: number;
    onto: AgThemeColorParam;
}

export type AgCssColorOrRef = CssColor | AgColorRef | AgColorRefMixOnto;

export interface AgBorderThemeParam {
    color?: AgCssColorOrRef;
    width?: PixelSize;
}

// AgBaseChartThemeParams - Shared with Grid
// AgChartThemeParams - Unique to Charts

export interface AgBaseChartThemeParams {
    /**
     * The 'brand colour' for the chart, used wherever a non-neutral colour is required. Selections, focus outlines and
     * checkboxes use the accent colour by default.
     */
    accentColor?: AgCssColorOrRef;
    /**
     * Background colour of the chart. Most text, borders and backgrounds are defined as a blend between the background
     * and foreground colors.
     */
    backgroundColor?: AgCssColorOrRef;
    /** Default colour for borders. */
    borderColor?: AgCssColorOrRef;
    /** Default width for borders. */
    borderWidth?: PixelSize;
    /** Default corner radius for many UI elements such as menus and dialogs.  */
    borderRadius?: PixelSize;
    /** Background colour of standard action buttons. */
    buttonBackgroundColor?: AgCssColorOrRef;
    /** Border around standard action buttons. */
    buttonBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for buttons. */
    buttonBorderRadius?: PixelSize;
    /** Font weight of standard action buttons. */
    buttonFontWeight?: FontWeight;
    /** Text colour of standard action buttons. */
    buttonTextColor?: AgCssColorOrRef;
    /** Shadow around UI controls that have focus e.g. text inputs and buttons. The value must a valid CSS box-shadow. */
    focusShadow?: CssShadow;
    /**
     * Default colour for neutral UI elements. Most text, borders and backgrounds are defined as a blend between the
     * background and foreground colors.
     */
    foregroundColor?: AgCssColorOrRef;
    /** Font family used for all text. */
    fontFamily?: FontFamilyFull;
    /** Default font size used for all text. Titles and some other text are scaled to this font size. */
    fontSize?: FontSize;
    /**
     * Background colour for text inputs.
     *
     * Default: `backgroundColor`
     */
    inputBackgroundColor?: AgCssColorOrRef;
    /** Border around text inputs. */
    inputBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for inputs. */
    inputBorderRadius?: PixelSize;
    /**
     * Colour of text within text inputs.
     *
     * Default: `textColor`
     */
    inputTextColor?: AgCssColorOrRef;
    /** Background colour for menus, e.g. right-click context menus. */
    menuBackgroundColor?: AgCssColorOrRef;
    /** Border around menus. */
    menuBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for menus. */
    menuBorderRadius?: PixelSize;
    /** Text colour for menus. */
    menuTextColor?: AgCssColorOrRef;
    /** Background colour for panels and dialogs. */
    panelBackgroundColor?: AgCssColorOrRef;
    /** Colour of text that should stand out less in panels and dialogs. */
    panelSubtleTextColor?: AgCssColorOrRef;
    /** Default shadow for elements that float above the chart and are intended to appear separated from it, e.g. dialogs and menus. */
    popupShadow?: CssShadow;
    /**
     * Colour of text that should stand out less than the default.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    subtleTextColor?: AgCssColorOrRef;
    /**
     * Default colour for all text.
     *
     * Default: `foregroundColor`
     */
    textColor?: AgCssColorOrRef;
    /** Background colour for tooltips. */
    tooltipBackgroundColor?: AgCssColorOrRef;
    /** Border around tooltips. */
    tooltipBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for tooltips. */
    tooltipBorderRadius?: PixelSize;
    /** Text colour for tooltips. */
    tooltipTextColor?: AgCssColorOrRef;
    /** Colour of text that should stand out less in tooltips. */
    tooltipSubtleTextColor?: AgCssColorOrRef;
}

export interface AgChartThemeParams extends AgBaseChartThemeParams {
    /** Default colour for axis lines and ticks. */
    axisLineColor?: AgCssColorOrRef;
    /** Background colour of the chart. */
    chartBackgroundColor?: AgCssColorOrRef;
    /** The outer chart padding. */
    chartPadding?: PixelSize;
    /**
     * Background colour of tooltips, menus, dialogs, toolbars and buttons.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    chromeBackgroundColor?: AgCssColorOrRef;
    /**
     * Font family used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontFamily`
     */
    chromeFontFamily?: FontFamilyFull;
    /**
     * Font size used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontSize`
     */
    chromeFontSize?: FontSize;
    /**
     * Font weight used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontWeight`
     */
    chromeFontWeight?: FontWeight;
    /**
     * Default colour for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `textColor`
     */
    chromeTextColor?: AgCssColorOrRef;
    /**
     * Colour of text that should stand out less than the default in tooltips, menus, dialogs, toolbars and buttons.
     *
     * Default: `subtleTextColor`
     */
    chromeSubtleTextColor?: AgCssColorOrRef;
    /**
     * Background colour of crosshair labels.
     *
     * Default: `foregroundColor`
     */
    crosshairLabelBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour for text in crosshair labels.
     *
     * Default: `backgroundColor`
     */
    crosshairLabelTextColor?: AgCssColorOrRef;
    /** Default font weight used for all text. */
    fontWeight?: FontWeight;
    /** Default colour for grid lines. */
    gridLineColor?: AgCssColorOrRef;
    /** Default colour for grouped-category separation lines. */
    groupedCategoryLineColor?: AgCssColorOrRef;
}

export interface AgChartPrivateThemeParams {
    // TODO: move `separateLinesColor` to this interface.

    focusColor?: CssColor;
}

export interface AgChartAllThemeParams extends AgChartThemeParams, AgChartPrivateThemeParams {}
