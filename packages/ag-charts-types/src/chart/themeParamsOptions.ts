import type { CssColor, FontFamily, FontSize, FontWeight, PixelSize } from './types';

export interface AgBaseChartThemeParams {
    /**
     * The 'brand colour' for the chart, used wherever a non-neutral colour is required. Selections, focus outlines and
     * checkboxes use the accent colour by default.
     */
    accentColor?: CssColor;
    /**
     * Background colour of the chart. Most text, borders and backgrounds are defined as a blend between the background
     * and foreground colors.
     */
    backgroundColor?: CssColor;
    /** Default colour for borders. */
    borderColor?: CssColor;
    /**
     * Default colour for neutral UI elements. Most text, borders and backgrounds are defined as a blend between the
     * background and foreground colors.
     */
    foregroundColor?: CssColor;
    /** Default font size used for all text. Titles and some other text are scaled to this font size. */
    fontSize?: FontSize;
    /**
     * Background colour for text inputs.
     *
     * Default: `backgroundColor`
     */
    inputBackgroundColor?: CssColor;
    /**
     * Colour of text within text inputs.
     *
     * Default: `textColor`
     */
    inputTextColor?: CssColor;
    /**
     * Colour of text that should stand out less than the default.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    subtleTextColor?: CssColor;
    /**
     * Default colour for all text.
     *
     * Default: `foregroundColor`
     */
    textColor?: CssColor;
}

export interface AgChartThemeParams extends AgBaseChartThemeParams {
    /** Default colour for axis lines and ticks. */
    axisColor?: CssColor;
    /**
     * Background colour of tooltips, menus, dialogs, toolbars and buttons.
     *
     * Default: `foregroundColor + backgroundColor`
     */
    chromeBackgroundColor?: CssColor;
    /**
     * Font family used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontFamily`
     */
    chromeFontFamily?: FontFamily;
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
    chromeTextColor?: CssColor;
    /**
     * Colour of text that should stand out less than the default in tooltips, menus, dialogs, toolbars and buttons.
     *
     * Default: `subtleTextColor`
     */
    chromeSubtleTextColor?: CssColor;
    /**
     * Background colour of crosshair labels.
     *
     * Default: `foregroundColor`
     */
    crosshairLabelBackgroundColor?: CssColor;
    /**
     * Colour for text in crosshair labels.
     *
     * Default: `backgroundColor`
     */
    crosshairLabelTextColor?: CssColor;
    /** Font family used for all text. */
    fontFamily?: FontFamily;
    /** Default font weight used for all text. */
    fontWeight?: FontWeight;
    /** Default colour for grid lines. */
    gridLineColor?: CssColor;
    /** The outer chart padding. */
    padding?: PixelSize;
}
