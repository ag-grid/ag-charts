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
    /**
     * The name of a theme parameter to blend `ref` onto, weighted by `mix`.
     *
     * Mutually exclusive with `ontoColor`; if both are set, `onto` takes precedence.
     */
    onto: AgThemeColorParam;
}
export interface AgColorRefMixOntoColor {
    ref: AgThemeColorParam;
    mix: number;
    /**
     * A literal CSS colour or a `var(--css-variable)` to blend `ref` onto, weighted by `mix`. Unlike `onto`, the
     * colour does not need to be registered as a theme parameter first.
     *
     * Mutually exclusive with `onto`; if both are set, `onto` takes precedence.
     */
    ontoColor: CssColor;
}

export type AgCssColorOrRef = CssColor | AgColorRef | AgColorRefMixOnto | AgColorRefMixOntoColor;

export interface AgBorderThemeParam {
    /** Colour of the border. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    width?: PixelSize;
}

// AgBaseChartThemeParams - Shared with Grid
// AgChartThemeParams - Unique to Charts

export interface AgBaseChartThemeParams {
    /**
     * The 'brand colour' for the chart, used wherever a non-neutral colour is required. Selections, focus outlines and
     * checkboxes use the accent colour by default. A colour string, or a theme-colour reference object.
     */
    accentColor?: AgCssColorOrRef;
    /**
     * Background colour of the chart. Most text, borders and backgrounds are defined as a blend between the background
     * and foreground colours. A colour string, or a theme-colour reference object.
     */
    backgroundColor?: AgCssColorOrRef;
    /** Default colour for borders. A colour string, or a theme-colour reference object. */
    borderColor?: AgCssColorOrRef;
    /** Default width for borders. */
    borderWidth?: PixelSize;
    /** Default corner radius for many UI elements such as menus and dialogs.  */
    borderRadius?: PixelSize;
    /**
     * Background colour of standard action buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor`
     */
    buttonBackgroundColor?: AgCssColorOrRef;
    /** Border around standard action buttons. `true` for the default border, `false` to disable, or an object to customise it. */
    buttonBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for buttons. */
    buttonBorderRadius?: PixelSize;
    /** Font weight of standard action buttons. */
    buttonFontWeight?: FontWeight;
    /** Text colour of standard action buttons. A colour string, or a theme-colour reference object. */
    buttonTextColor?: AgCssColorOrRef;
    /** Shadow around UI controls that have focus e.g. text inputs and buttons. The value must a valid CSS box-shadow. */
    focusShadow?: CssShadow;
    /**
     * Default colour for neutral UI elements. Most text, borders and backgrounds are defined as a blend between the
     * background and foreground colours. A colour string, or a theme-colour reference object.
     */
    foregroundColor?: AgCssColorOrRef;
    /** Font family used for all text. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
    /** Default font size used for all text. Titles and some other text are scaled to this font size. */
    fontSize?: FontSize;
    /**
     * Background colour for text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor`
     */
    inputBackgroundColor?: AgCssColorOrRef;
    /** Border around text inputs. `true` for the default border, `false` to disable, or an object to customise it. */
    inputBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for inputs. */
    inputBorderRadius?: PixelSize;
    /**
     * Colour of text within text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     */
    inputTextColor?: AgCssColorOrRef;
    /** Background colour for menus, e.g. right-click context menus. A colour string, or a theme-colour reference object. */
    menuBackgroundColor?: AgCssColorOrRef;
    /** Border around menus. `true` for the default border, `false` to disable, or an object to customise it. */
    menuBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for menus. */
    menuBorderRadius?: PixelSize;
    /** Text colour for menus. A colour string, or a theme-colour reference object. */
    menuTextColor?: AgCssColorOrRef;
    /** Background colour for panels and dialogs. A colour string, or a theme-colour reference object. */
    panelBackgroundColor?: AgCssColorOrRef;
    /** Colour of text that should stand out less in panels and dialogs. A colour string, or a theme-colour reference object. */
    panelSubtleTextColor?: AgCssColorOrRef;
    /** Default shadow for elements that float above the chart and are intended to appear separated from it, e.g. dialogs and menus. */
    popupShadow?: CssShadow;
    /**
     * Colour of text that should stand out less than the default. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    subtleTextColor?: AgCssColorOrRef;
    /**
     * Default colour for all text. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor`
     */
    textColor?: AgCssColorOrRef;
    /** Background colour for tooltips. A colour string, or a theme-colour reference object. */
    tooltipBackgroundColor?: AgCssColorOrRef;
    /** Border around tooltips. `true` for the default border, `false` to disable, or an object to customise it. */
    tooltipBorder?: boolean | AgBorderThemeParam;
    /** Corner radius for tooltips. */
    tooltipBorderRadius?: PixelSize;
    /** Text colour for tooltips. A colour string, or a theme-colour reference object. */
    tooltipTextColor?: AgCssColorOrRef;
    /** Colour of text that should stand out less in tooltips. A colour string, or a theme-colour reference object. */
    tooltipSubtleTextColor?: AgCssColorOrRef;
}

export interface AgChartThemeParams extends AgBaseChartThemeParams {
    /** Default colour for axis lines and ticks. A colour string, or a theme-colour reference object. */
    axisLineColor?: AgCssColorOrRef;
    /** Background colour of the chart. A colour string, or a theme-colour reference object. */
    chartBackgroundColor?: AgCssColorOrRef;
    /** The outer chart padding. */
    chartPadding?: PixelSize;
    /**
     * Background colour of tooltips, menus, dialogs, toolbars and buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    chromeBackgroundColor?: AgCssColorOrRef;
    /**
     * Font family used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs. A single family name, or an array of names used as fallbacks.
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
     * Default colour for text in tooltips, menus, dialogs, toolbars, buttons and text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     */
    chromeTextColor?: AgCssColorOrRef;
    /**
     * Colour of text that should stand out less than the default in tooltips, menus, dialogs, toolbars and buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `subtleTextColor`
     */
    chromeSubtleTextColor?: AgCssColorOrRef;
    /**
     * Background colour of crosshair labels. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor`
     */
    crosshairLabelBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour for text in crosshair labels. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor`
     */
    crosshairLabelTextColor?: AgCssColorOrRef;
    /** Default font weight used for all text. */
    fontWeight?: FontWeight;
    /** Default colour for grid lines. A colour string, or a theme-colour reference object. */
    gridLineColor?: AgCssColorOrRef;
    /** Default colour for grouped-category separation lines. A colour string, or a theme-colour reference object. */
    groupedCategoryLineColor?: AgCssColorOrRef;
}

export interface AgChartPrivateThemeParams {
    // TODO: move `separateLinesColor` to this interface.

    focusColor?: CssColor;
}

export interface AgChartAllThemeParams extends AgChartThemeParams, AgChartPrivateThemeParams {}
