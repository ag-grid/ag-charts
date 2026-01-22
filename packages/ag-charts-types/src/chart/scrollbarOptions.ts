import type { FillOptions, LineDashOptions, StrokeOptions, Toggleable } from '../series/cartesian/commonOptions';
import type { PixelSize } from './types';

export type AgScrollbarVisibility = 'auto' | 'always' | 'never';
export type AgScrollbarPlacement = 'inner' | 'outer';

export interface AgScrollbarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners. */
    cornerRadius?: PixelSize;
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
    minSize?: number;
    /** Styling applied to the thumb on hover. */
    hoverStyle?: AgScrollbarThumbHoverStyle;
}

export interface AgScrollbarBaseOptions extends Toggleable {
    thickness?: number;
    spacing?: number;
    tickSpacing?: number;
    track?: AgScrollbarTrackStyle;
    thumb?: AgScrollbarThumbStyle;
    visible?: AgScrollbarVisibility;
    placement?: AgScrollbarPlacement;
}

export interface AgScrollbarHorizontalOrientationOptions extends AgScrollbarBaseOptions {
    position?: 'top' | 'bottom';
}

export interface AgScrollbarVerticalOrientationOptions extends AgScrollbarBaseOptions {
    position?: 'left' | 'right';
}

export interface AgScrollbarOptions extends AgScrollbarBaseOptions {
    horizontal?: AgScrollbarHorizontalOrientationOptions;
    vertical?: AgScrollbarVerticalOrientationOptions;
}

export interface AgScrollbarThemeableOptions extends AgScrollbarOptions {}
