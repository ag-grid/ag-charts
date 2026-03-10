import type { FillOptions, LineDashOptions, StrokeOptions, Toggleable } from '../series/cartesian/commonOptions';
import type { PixelSize } from './types';

export type AgScrollbarVisibility = 'auto' | 'always' | 'never';
export type AgScrollbarPlacement = 'inner' | 'outer';

export interface AgScrollbarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners. */
    cornerRadius?: PixelSize;
    /** The opacity for the scrollbar element. */
    opacity?: number;
}

export interface AgScrollbarTrackStyle extends AgScrollbarStyle {}

export interface AgScrollbarThumbHoverStyle {
    /** The colour for the hovered thumb fill. */
    fill?: FillOptions['fill'];
    /** The colour for the hovered thumb stroke. */
    stroke?: StrokeOptions['stroke'];
}

export interface AgScrollbarThumbStyle extends AgScrollbarStyle {
    /** Minimum size of the thumb in pixels */
    minSize?: number;
    /** Styling applied to the thumb on hover. */
    hoverStyle?: AgScrollbarThumbHoverStyle;
}

export interface AgScrollbarBaseOptions extends Toggleable {
    /**  Set to `true` to enable the scrollbar. */
    enabled?: boolean;
    /**  Thickness of the scrollbar in pixels (height for horizontal, width for vertical). */
    thickness?: number;
    /**  Spacing in pixels between the scrollbar and the series area or axis labels, depending on placement. */
    spacing?: number;
    /**  Spacing in pixels between ticks on the scrollbar (if applicable). */
    tickSpacing?: number;
    /** Styling options for the scrollbar track. */
    track?: AgScrollbarTrackStyle;
    /** Styling options for the scrollbar thumb. */
    thumb?: AgScrollbarThumbStyle;
    /** Controls when the scrollbar is shown. */
    visible?: AgScrollbarVisibility;
    /** Controls whether the scrollbar is placed inside the axis label and ticks or outside. */
    placement?: AgScrollbarPlacement;
}

export interface AgScrollbarHorizontalOrientationOptions extends AgScrollbarBaseOptions {
    /** Which horizontal axis position the scrollbar should use. */
    position?: 'top' | 'bottom';
}

export interface AgScrollbarVerticalOrientationOptions extends AgScrollbarBaseOptions {
    /** Which vertical axis position the scrollbar should use. */
    position?: 'left' | 'right';
}

export interface AgScrollbarOptions extends AgScrollbarBaseOptions {
    /** */
    enableAxisScrolling?: boolean;
    /** */
    enableSeriesAreaScrolling?: boolean;
    /** Options applied to the horizontal scrollbar. */
    horizontal?: AgScrollbarHorizontalOrientationOptions;
    /** Options applied to the vertical scrollbar. */
    vertical?: AgScrollbarVerticalOrientationOptions;
}

export interface AgScrollbarThemeableOptions extends AgScrollbarOptions {}
