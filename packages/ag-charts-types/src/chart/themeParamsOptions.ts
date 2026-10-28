import type { CssColor, CssShadow, FontFamilyFull, FontSize, FontWeight, PixelSize, Ratio, TextAlign } from './types';

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

// Declare each `@group`'s params in the order `orderThemeParams` lists them: explicit order first (Foundations,
// title*, subtitle*, footnote*), then after the param their `Default:` names, then alphabetically.

export interface AgBaseChartThemeParams {
    /**
     * Background colour of the chart. Most text, borders and backgrounds are defined as a blend between the background
     * and foreground colours. A colour string, or a theme-colour reference object.
     *
     * Default: `#ffffff`
     *
     * @group Foundations
     */
    backgroundColor?: AgCssColorOrRef;
    /**
     * Default colour for neutral UI elements. Most text, borders and backgrounds are defined as a blend between the
     * background and foreground colours. A colour string, or a theme-colour reference object.
     *
     * Default: `#181d1f`
     *
     * @group Foundations
     */
    foregroundColor?: AgCssColorOrRef;
    /**
     * The 'brand colour' for the chart, used wherever a non-neutral colour is required. Selections, focus outlines and
     * checkboxes use the accent colour by default. A colour string, or a theme-colour reference object.
     *
     * Default: `#2196f3`
     *
     * @group Foundations
     */
    accentColor?: AgCssColorOrRef;
    /**
     * Default colour for borders. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor 15% + backgroundColor 85%`
     *
     * @group Borders
     */
    borderColor?: AgCssColorOrRef;
    /**
     * Default corner radius for many UI elements such as menus and dialogs.
     *
     * Default: `4`
     *
     * @group Borders
     */
    borderRadius?: PixelSize;
    /**
     * Default width for borders.
     *
     * Default: `1`
     *
     * @group Borders
     */
    borderWidth?: PixelSize;
    /**
     * Background colour of buttons in the active (toggled or selected) state, such as a toggled toolbar button or a
     * selected menu item. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor 88% + accentColor 12%`
     *
     * @group Buttons
     */
    buttonActiveBackgroundColor?: AgCssColorOrRef;
    /**
     * Border of buttons in the active (toggled or selected) state. `true` to use `buttonBorder`, `false` for no visible
     * border, or an object to customise it. Any colour or width left unset in the object follows `buttonBorder`.
     *
     * Default: `color: accentColor`
     *
     * @group Buttons
     */
    buttonActiveBorder?: boolean | AgBorderThemeParam;
    /**
     * Text colour of buttons in the active (toggled or selected) state. A colour string, or a theme-colour reference object.
     *
     * Default: `accentColor`
     *
     * @group Buttons
     */
    buttonActiveTextColor?: AgCssColorOrRef;
    /**
     * Background colour of standard action buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor`
     *
     * @group Buttons
     */
    buttonBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around standard action buttons. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `color: borderColor, width: borderWidth`
     *
     * @group Buttons
     */
    buttonBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius for buttons.
     *
     * Default: `borderRadius`
     *
     * @group Buttons
     */
    buttonBorderRadius?: PixelSize;
    /**
     * Font weight of standard action buttons.
     *
     * Default: `400`
     *
     * @group Buttons
     */
    buttonFontWeight?: FontWeight;
    /**
     * Background colour of buttons when hovered. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor 88% + accentColor 12%`
     *
     * @group Buttons
     */
    buttonHoverBackgroundColor?: AgCssColorOrRef;
    /**
     * Text colour of standard action buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeTextColor`
     *
     * @group Buttons
     */
    buttonTextColor?: AgCssColorOrRef;
    /**
     * Background colour of disabled buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `buttonBackgroundColor 94% + foregroundColor 6%`
     *
     * @group Buttons
     */
    buttonDisabledBackgroundColor?: AgCssColorOrRef;
    /**
     * Border of disabled buttons. `true` to use `buttonBorder`, `false` for no visible border, or an object
     * to customise it. Any colour or width left unset in the object follows `buttonBorder`.
     *
     * Default: `buttonBorder`
     *
     * @group Buttons
     */
    buttonDisabledBorder?: boolean | AgBorderThemeParam;
    /**
     * Text colour of disabled buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor 50% + buttonTextColor 50%`
     *
     * @group Buttons
     */
    buttonDisabledTextColor?: AgCssColorOrRef;
    /**
     * Border of buttons when hovered. `true` to use `buttonBorder`, `false` for no visible border, or an object
     * to customise it. Any colour or width left unset in the object follows `buttonBorder`.
     *
     * Default: `buttonBorder`
     *
     * @group Buttons
     */
    buttonHoverBorder?: boolean | AgBorderThemeParam;
    /**
     * Text colour of buttons when hovered. A colour string, or a theme-colour reference object.
     *
     * Default: `buttonTextColor`
     *
     * @group Buttons
     */
    buttonHoverTextColor?: AgCssColorOrRef;
    /**
     * Background colour for menus, e.g. right-click context menus. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor`
     *
     * @group Menus & Popups
     */
    menuBackgroundColor?: AgCssColorOrRef;
    /**
     * Corner radius of the colour swatch in the colour picker. Defaults to half of `borderRadius`.
     *
     * Default: `0.5 × borderRadius`
     *
     * @group Colour Picker
     */
    colorPickerColorBorderRadius?: PixelSize;
    /**
     * Width of the ring drawn around the draggable thumbs of the colour picker.
     *
     * Default: `3`
     *
     * @group Colour Picker
     */
    colorPickerThumbBorderWidth?: PixelSize;
    /**
     * Size of the draggable thumbs of the colour picker.
     *
     * Default: `18`
     *
     * @group Colour Picker
     */
    colorPickerThumbSize?: PixelSize;
    /**
     * Corner radius of the hue and opacity tracks of the colour picker. Defaults to 99 times `borderRadius`.
     *
     * Default: `99 × borderRadius`
     *
     * @group Colour Picker
     */
    colorPickerTrackBorderRadius?: PixelSize;
    /**
     * Height of the hue and opacity tracks of the colour picker.
     *
     * Default: `12`
     *
     * @group Colour Picker
     */
    colorPickerTrackSize?: PixelSize;
    /**
     * Colour of the drag handle icons on dialogs and floating toolbars. The icon is drawn at half the opacity of this
     * colour. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeTextColor`
     *
     * @group Drag & Drop
     */
    dragHandleColor?: AgCssColorOrRef;
    /**
     * Shadow around UI controls that have focus e.g. text inputs and buttons. The value must be a valid CSS box-shadow.
     *
     * Default: `0 0 0 3px color-mix(in srgb, var(--ag-charts-accent-color) 50%, transparent)`
     *
     * @group Inputs
     */
    focusShadow?: CssShadow;
    /**
     * Font family used for all text. A single family name, or an array of names used as fallbacks.
     *
     * Default: `"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`
     *
     * @group Foundations
     */
    fontFamily?: FontFamilyFull;
    /**
     * Default font size used for all text. Titles and some other text are scaled to this font size.
     *
     * Default: `12`
     *
     * @group Foundations
     */
    fontSize?: FontSize;
    /**
     * Default font weight used for all text.
     *
     * Default: `400`
     *
     * @group Foundations
     */
    fontWeight?: FontWeight;
    /**
     * Background colour for text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor`
     *
     * @group Inputs
     */
    inputBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around text inputs. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `color: borderColor, width: borderWidth`
     *
     * @group Inputs
     */
    inputBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius for inputs.
     *
     * Default: `borderRadius`
     *
     * @group Inputs
     */
    inputBorderRadius?: PixelSize;
    /**
     * Colour of text within text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Inputs
     */
    inputTextColor?: AgCssColorOrRef;
    /**
     * Colour of placeholder text in text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `inputTextColor + inputBackgroundColor`
     *
     * @group Inputs
     */
    inputPlaceholderTextColor?: AgCssColorOrRef;
    /**
     * Border around menus. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `color: borderColor, width: borderWidth`
     *
     * @group Menus & Popups
     */
    menuBorder?: boolean | AgBorderThemeParam;
    /**
     * Colour of the separator lines between groups of items in menus, e.g. right-click context menus. A colour string,
     * or a theme-colour reference object.
     *
     * Default: `borderColor`
     *
     * @group Menus & Popups
     */
    menuSeparatorColor?: AgCssColorOrRef;
    /**
     * Text colour for menus. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeTextColor`
     *
     * @group Menus & Popups
     */
    menuTextColor?: AgCssColorOrRef;
    /**
     * Default shadow for elements that float above the chart and are intended to appear separated from it, e.g. dialogs, floating toolbars and context menus.
     *
     * Default: `0 0 16px rgba(0, 0, 0, 0.15)`
     *
     * @group Menus & Popups
     */
    popupShadow?: CssShadow;
    /**
     * Background colour for panels and dialogs. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor`
     *
     * @group Panels & Dialogs
     */
    panelBackgroundColor?: AgCssColorOrRef;
    /**
     * Shadow for elements that float above the chart and are intended to appear elevated but still attached, e.g. the
     * dropdown menus of the toolbars and the colour picker. Defaults to `popupShadow`. The value must be a valid CSS
     * box-shadow.
     *
     * Default: `popupShadow`
     *
     * @group Menus & Popups
     */
    cardShadow?: CssShadow;
    /**
     * Background colour of tooltips, menus, dialogs, toolbars and buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     *
     * @group Colours
     */
    chromeBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour of text that should stand out less than the default. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     *
     * @group Colours
     */
    subtleTextColor?: AgCssColorOrRef;
    /**
     * Default colour for all text. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor`
     *
     * @group Colours
     */
    textColor?: AgCssColorOrRef;
    /**
     * Background colour for tooltips. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeBackgroundColor`
     *
     * @group Tooltips
     */
    tooltipBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around tooltips. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `color: borderColor, width: borderWidth`
     *
     * @group Tooltips
     */
    tooltipBorder?: boolean | AgBorderThemeParam;
    /**
     * Text colour for tooltips. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeTextColor`
     *
     * @group Tooltips
     */
    tooltipTextColor?: AgCssColorOrRef;
}

export interface AgChartThemeParams extends AgBaseChartThemeParams {
    /**
     * Colour of axis tick labels. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Axes
     */
    axisLabelColor?: AgCssColorOrRef;
    /**
     * Font family of axis tick labels. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Axes
     */
    axisLabelFontFamily?: FontFamilyFull;
    /**
     * Font size of axis tick labels.
     *
     * Default: `fontSize`
     *
     * @group Axes
     */
    axisLabelFontSize?: FontSize;
    /**
     * Font weight of axis tick labels.
     *
     * Default: `fontWeight`
     *
     * @group Axes
     */
    axisLabelFontWeight?: FontWeight;
    /**
     * Line height of axis tick labels, as a ratio of their font size.
     *
     * Default: `lineHeight`
     *
     * @group Axes
     */
    axisLabelLineHeight?: Ratio;
    /**
     * Default colour for axis lines and ticks. A colour string, or a theme-colour reference object.
     *
     * Default: `borderColor`
     *
     * @group Axes
     */
    axisLineColor?: AgCssColorOrRef;
    /**
     * Default width for axis lines. Does not apply to ticks.
     *
     * Default: `1`
     *
     * @group Axes
     */
    axisLineWidth?: PixelSize;
    /**
     * Colour of axis titles. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Axes
     */
    axisTitleColor?: AgCssColorOrRef;
    /**
     * Font family of axis titles. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Axes
     */
    axisTitleFontFamily?: FontFamilyFull;
    /**
     * Font size of axis titles. Follows fontSize, keeping the same proportion to it.
     *
     * Default: `13`
     *
     * @group Axes
     */
    axisTitleFontSize?: FontSize;
    /**
     * Font weight of axis titles.
     *
     * Default: `fontWeight`
     *
     * @group Axes
     */
    axisTitleFontWeight?: FontWeight;
    /**
     * Line height of axis titles, as a ratio of their font size.
     *
     * Default: `lineHeight`
     *
     * @group Axes
     */
    axisTitleLineHeight?: Ratio;
    /**
     * Colour of the band highlight. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     *
     * @group Axes
     */
    bandHighlightColor?: AgCssColorOrRef;
    /**
     * Colour painted behind the chart. Follows backgroundColor, which is also blended into text, borders and other
     * backgrounds - so change that one to shift the whole theme, and this one to repaint the chart alone. A colour
     * string, or a theme-colour reference object.
     *
     * Default: `backgroundColor`
     *
     * @group Colours
     */
    chartBackgroundColor?: AgCssColorOrRef;
    /**
     * The outer chart padding.
     *
     * Default: `20`
     *
     * @group Spacing & Sizing
     */
    chartPadding?: PixelSize;
    /**
     * Default line height for all text, as a ratio of each text element's font size, e.g. `1.5`. When unset, text
     * uses the natural line height of its font.
     *
     * @group Spacing & Sizing
     */
    lineHeight?: Ratio;
    /**
     * Font family used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Toolbars
     */
    chromeFontFamily?: FontFamilyFull;
    /**
     * Font size used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontSize`
     *
     * @group Toolbars
     */
    chromeFontSize?: FontSize;
    /**
     * Font weight used for text in tooltips, menus, dialogs, toolbars, buttons and text inputs.
     *
     * Default: `fontWeight`
     *
     * @group Toolbars
     */
    chromeFontWeight?: FontWeight;
    /**
     * Line height of text in tooltips, menus, dialogs, toolbars, buttons and text inputs, as a ratio of their font size.
     *
     * Default: `lineHeight`
     *
     * @group Toolbars
     */
    chromeLineHeight?: Ratio;
    /**
     * Colour of text that should stand out less than the default in tooltips, menus, dialogs, toolbars and buttons. A colour string, or a theme-colour reference object.
     *
     * Default: `subtleTextColor`
     *
     * @group Toolbars
     */
    chromeSubtleTextColor?: AgCssColorOrRef;
    /**
     * Default colour for text in tooltips, menus, dialogs, toolbars, buttons and text inputs. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Toolbars
     */
    chromeTextColor?: AgCssColorOrRef;
    /**
     * Background colour of crosshair labels. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor`
     *
     * @group Crosshairs
     */
    crosshairLabelBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour for text in crosshair labels. A colour string, or a theme-colour reference object.
     *
     * Default: `backgroundColor`
     *
     * @group Crosshairs
     */
    crosshairLabelTextColor?: AgCssColorOrRef;
    /**
     * Colour of the chart title text. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Titles
     */
    titleColor?: AgCssColorOrRef;
    /**
     * Font family of the chart title. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Titles
     */
    titleFontFamily?: FontFamilyFull;
    /**
     * Font size of the chart title. Follows fontSize, keeping the same proportion to it.
     *
     * Default: `17`
     *
     * @group Titles
     */
    titleFontSize?: FontSize;
    /**
     * Font weight of the chart title.
     *
     * Default: `fontWeight`
     *
     * @group Titles
     */
    titleFontWeight?: FontWeight;
    /**
     * Line height of the chart title, as a ratio of its font size.
     *
     * Default: `lineHeight`
     *
     * @group Titles
     */
    titleLineHeight?: Ratio;
    /**
     * Colour of the chart subtitle text. A colour string, or a theme-colour reference object.
     *
     * Default: `subtleTextColor`
     *
     * @group Titles
     */
    subtitleColor?: AgCssColorOrRef;
    /**
     * Font family of the chart subtitle. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Titles
     */
    subtitleFontFamily?: FontFamilyFull;
    /**
     * Font size of the chart subtitle. Follows fontSize, keeping the same proportion to it.
     *
     * Default: `13`
     *
     * @group Titles
     */
    subtitleFontSize?: FontSize;
    /**
     * Font weight of the chart subtitle.
     *
     * Default: `fontWeight`
     *
     * @group Titles
     */
    subtitleFontWeight?: FontWeight;
    /**
     * Line height of the chart subtitle, as a ratio of its font size.
     *
     * Default: `lineHeight`
     *
     * @group Titles
     */
    subtitleLineHeight?: Ratio;
    /**
     * Colour of the chart footnote text. A colour string, or a theme-colour reference object.
     *
     * Default: `subtleTextColor`
     *
     * @group Titles
     */
    footnoteColor?: AgCssColorOrRef;
    /**
     * Font family of the chart footnote. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Titles
     */
    footnoteFontFamily?: FontFamilyFull;
    /**
     * Font size of the chart footnote. Follows fontSize, keeping the same proportion to it.
     *
     * Default: `13`
     *
     * @group Titles
     */
    footnoteFontSize?: FontSize;
    /**
     * Font weight of the chart footnote.
     *
     * Default: `fontWeight`
     *
     * @group Titles
     */
    footnoteFontWeight?: FontWeight;
    /**
     * Line height of the chart footnote, as a ratio of its font size.
     *
     * Default: `lineHeight`
     *
     * @group Titles
     */
    footnoteLineHeight?: Ratio;
    /**
     * Default width for grid lines.
     *
     * Default: `1`
     *
     * @group Axes
     */
    gridLineWidth?: PixelSize;
    /**
     * Default colour for grouped-category separation lines. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor 17% + backgroundColor 83%`
     *
     * @group Axes
     */
    groupedCategoryLineColor?: AgCssColorOrRef;
    /**
     * Default colour for grid lines. A colour string, or a theme-colour reference object.
     *
     * Default: `axisLineColor 65% + backgroundColor 35%`
     *
     * @group Axes
     */
    gridLineColor?: AgCssColorOrRef;
    /**
     * Border around the legend and the gradient legend. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `false`
     *
     * @group Legend
     */
    legendBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of the legend and the gradient legend.
     *
     * Default: `borderRadius`
     *
     * @group Legend
     */
    legendBorderRadius?: PixelSize;
    /**
     * Horizontal padding around each legend item. Applies to the legend only, not the gradient legend.
     *
     * Default: `8`
     *
     * @group Legend
     */
    legendItemHorizontalPadding?: PixelSize;
    /**
     * Vertical padding around each legend item. Applies to the legend only, not the gradient legend.
     *
     * Default: `4`
     *
     * @group Legend
     */
    legendItemVerticalPadding?: PixelSize;
    /**
     * Colour of the legend item labels, the legend pagination label and the gradient legend scale labels. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Legend
     */
    legendLabelColor?: AgCssColorOrRef;
    /**
     * Font family of the legend item labels, the legend pagination label and the gradient legend scale labels. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Legend
     */
    legendLabelFontFamily?: FontFamilyFull;
    /**
     * Font size of the legend item labels, the legend pagination label and the gradient legend scale labels.
     *
     * Default: `fontSize`
     *
     * @group Legend
     */
    legendLabelFontSize?: FontSize;
    /**
     * Font weight of the legend item labels and the gradient legend scale labels.
     *
     * Default: `fontWeight`
     *
     * @group Legend
     */
    legendLabelFontWeight?: FontWeight;
    /**
     * Line height of the legend item labels, the legend pagination label and the gradient legend scale labels, as a ratio of their font size.
     *
     * Default: `lineHeight`
     *
     * @group Legend
     */
    legendLabelLineHeight?: Ratio;
    /**
     * Size of the legend item markers. Applies to the legend only, not the gradient legend.
     *
     * Default: `15`
     *
     * @group Legend
     */
    legendMarkerSize?: PixelSize;
    /**
     * Padding inside the legend and the gradient legend. Applied only when the legend has a border or a `fill` set in its options.
     *
     * Default: `5`
     *
     * @group Legend
     */
    legendPadding?: PixelSize;
    /**
     * Thickness of the scrollbar track.
     *
     * Default: `12`
     *
     * @group Scrollbars
     */
    scrollbarThickness?: PixelSize;
    /**
     * Background colour of the scrollbar thumb. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     *
     * @group Scrollbars
     */
    scrollbarThumbBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around the scrollbar thumb. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `borderColor + foregroundColor`
     *
     * @group Scrollbars
     */
    scrollbarThumbBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of the scrollbar thumb.
     *
     * Default: `6`
     *
     * @group Scrollbars
     */
    scrollbarThumbBorderRadius?: PixelSize;
    /**
     * Background colour of the scrollbar track. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor + backgroundColor`
     *
     * @group Scrollbars
     */
    scrollbarTrackBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around the scrollbar track. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `borderColor + foregroundColor`
     *
     * @group Scrollbars
     */
    scrollbarTrackBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of the scrollbar track.
     *
     * Default: `6`
     *
     * @group Scrollbars
     */
    scrollbarTrackBorderRadius?: PixelSize;
    /**
     * Background colour of the scrollbar thumb when hovered. A colour string, or a theme-colour reference object.
     *
     * Default: `scrollbarThumbBackgroundColor + foregroundColor`
     *
     * @group Scrollbars
     */
    scrollbarThumbHoverBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around the scrollbar thumb when hovered. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `scrollbarThumbBorder + foregroundColor`
     *
     * @group Scrollbars
     */
    scrollbarThumbHoverBorder?: boolean | AgBorderThemeParam;
    /**
     * Background colour of the navigator handles. A colour string, or a theme-colour reference object.
     *
     * Default: `chartBackgroundColor`
     *
     * @group Navigator
     */
    navigatorHandleBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around the navigator handles. Its colour also colours the handle grip. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `borderColor`
     *
     * @group Navigator
     */
    navigatorHandleBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of the navigator handles.
     *
     * Default: `borderRadius`
     *
     * @group Navigator
     */
    navigatorHandleBorderRadius?: PixelSize;
    /**
     * Background colour of the navigator thumb, the selected range between the handles. A colour string, or a theme-colour reference object.
     *
     * Default: `transparent`
     *
     * @group Navigator
     */
    navigatorThumbBackgroundColor?: AgCssColorOrRef;
    /**
     * Background colour of the navigator track, the dimmed area outside the selected range. A colour string, or a theme-colour reference object.
     *
     * Default: `foregroundColor`
     *
     * @group Navigator
     */
    navigatorTrackBackgroundColor?: AgCssColorOrRef;
    /**
     * Border around the navigator track. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `borderColor`
     *
     * @group Navigator
     */
    navigatorTrackBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of the navigator track. Also rounds the selected range and the mini chart.
     *
     * Default: `borderRadius`
     *
     * @group Navigator
     */
    navigatorTrackBorderRadius?: PixelSize;
    /**
     * Border around series labels. A border otherwise shows only where a series enables `label.border`. `true` for the default border, `false` to disable, or an object to customise it.
     *
     * Default: `false`
     *
     * @group Series Labels
     */
    seriesLabelBorder?: boolean | AgBorderThemeParam;
    /**
     * Corner radius of series label backgrounds and borders.
     *
     * Default: `borderRadius`
     *
     * @group Series Labels
     */
    seriesLabelBorderRadius?: PixelSize;
    /**
     * Font family used for series labels. A single family name, or an array of names used as fallbacks.
     *
     * Default: `fontFamily`
     *
     * @group Series Labels
     */
    seriesLabelFontFamily?: FontFamilyFull;
    /**
     * Font size used for series labels. Secondary series labels scale relative to it.
     *
     * Default: `fontSize`
     *
     * @group Series Labels
     */
    seriesLabelFontSize?: FontSize;
    /**
     * Font weight used for series labels. Treemap secondary labels and map-shape labels keep their own default weights (normal and bold) unless this differs from `fontWeight`. To change them when the two are equal, set `fontWeight` on the series label directly.
     *
     * Default: `fontWeight`
     *
     * @group Series Labels
     */
    seriesLabelFontWeight?: FontWeight;
    /**
     * Background colour of series labels placed inside series shapes, such as bar labels with an `inside-*` placement and pie sector labels. A fully transparent colour, such as `'transparent'`, draws no background box; any other colour boxes the label, which adds padding and can hide labels that no longer fit. A colour string, or a theme-colour reference object.
     *
     * Default: `'transparent'`
     *
     * @group Series Labels
     */
    seriesLabelInsideBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour for text of series labels placed inside series shapes, such as bar labels with an `inside-*` placement and pie sector labels. Range-area inside labels use `textColor` instead. A colour string, or a theme-colour reference object.
     *
     * Default: `chartBackgroundColor`
     *
     * @group Series Labels
     */
    seriesLabelInsideTextColor?: AgCssColorOrRef;
    /**
     * Line height of series labels, as a ratio of their font size.
     *
     * Default: `lineHeight`
     *
     * @group Series Labels
     */
    seriesLabelLineHeight?: Ratio;
    /**
     * Background colour of series labels placed outside series shapes, such as bar labels with an `outside-*` placement and pie callout labels. A fully transparent colour, such as `'transparent'`, draws no background box; any other colour boxes the label, which adds padding and can hide labels that no longer fit. A colour string, or a theme-colour reference object.
     *
     * Default: `'transparent'`
     *
     * @group Series Labels
     */
    seriesLabelOutsideBackgroundColor?: AgCssColorOrRef;
    /**
     * Colour for text of series labels placed outside series shapes, such as bar labels with an `outside-*` placement and pie callout labels. A colour string, or a theme-colour reference object.
     *
     * Default: `textColor`
     *
     * @group Series Labels
     */
    seriesLabelOutsideTextColor?: AgCssColorOrRef;
    /**
     * Colour of text that should stand out less in panels and dialogs. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeSubtleTextColor`
     *
     * @group Panels & Dialogs
     */
    panelSubtleTextColor?: AgCssColorOrRef;
    /**
     * Corner radius for menus.
     *
     * Default: `borderRadius`
     *
     * @group Menus & Popups
     */
    menuBorderRadius?: PixelSize;
    /**
     * Corner radius for tooltips.
     *
     * Default: `borderRadius`
     *
     * @group Tooltips
     */
    tooltipBorderRadius?: PixelSize;
    /**
     * Colour of text that should stand out less in tooltips. A colour string, or a theme-colour reference object.
     *
     * Default: `chromeSubtleTextColor`
     *
     * @group Tooltips
     */
    tooltipSubtleTextColor?: AgCssColorOrRef;
}

export interface AgChartPrivateThemeParams {
    // TODO: move `separateLinesColor` to this interface.

    focusColor?: CssColor;
    annotationColor?: CssColor;
    annotationTextColor?: CssColor;
    annotationHandleColor?: CssColor;
    annotationTextboxTextColor?: CssColor;
    annotationTextboxBackgroundColor?: CssColor;
    annotationTextboxBorderColor?: CssColor;
    annotationDividerColor?: CssColor;
    shadowColor?: CssColor;
    glowColor?: CssColor;
    glowBlur?: PixelSize;
    captionLayoutStyle?: 'block' | 'overlay';
    captionAlignment?: TextAlign;
}

export interface AgChartAllThemeParams extends AgChartThemeParams, AgChartPrivateThemeParams {}
