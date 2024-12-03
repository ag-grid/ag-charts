import type { FormattableLabel } from './axisOptions';
import type { CssColor, Opacity, PixelSize } from './types';

export interface AgCrosshairOptions<LabelType = AgCrosshairLabel> {
    /** Whether to show the crosshair. */
    enabled?: boolean;
    /** When true, the crosshair snaps to the highlighted data point. By default this property is true. */
    snap?: boolean;
    /** The colour of the stroke for the lines. */
    stroke?: CssColor;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** The crosshair label configuration */
    label?: LabelType;
}

export interface AgCrosshairLabel extends AgBaseCrosshairLabel, FormattableLabel {}

export interface AgBaseCrosshairLabel {
    /** Whether to show label when the crosshair is visible. */
    enabled?: boolean;
    /** The horizontal offset in pixels for the label. */
    xOffset?: PixelSize;
    /** The vertical offset in pixels for the label. */
    yOffset?: PixelSize;
    /** Function used to create the content for the label. */
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
}

export interface AgCrosshairLabelRendererParams {
    /** Axis value that the label is being rendered for. */
    readonly value: any;
    /** If the axis value is a number, the fractional digits used to format the value. */
    readonly fractionDigits?: number;
}

export interface AgCrosshairLabelRendererResult {
    /** Text for the label. */
    text?: string;
    /** Label text colour. */
    color?: CssColor;
    /** Label background colour. */
    backgroundColor?: CssColor;
    /** Opacity of the label. */
    opacity?: Opacity;
}
