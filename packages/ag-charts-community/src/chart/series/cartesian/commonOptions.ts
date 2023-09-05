import type { CssColor, Opacity, PixelSize } from '../../options/types';

export interface AxisOptions {
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** Human-readable description of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface FillOptions {
    /** The colour to use for the fill of the columns. */
    fill?: CssColor;
    /** The opacity of the fill for the columns. */
    fillOpacity?: Opacity;
}

export interface StrokeOptions {
    /** The colours to use for the stroke of the columns. */
    stroke?: CssColor;
    /** The width in pixels of the stroke for the columns. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the columns. */
    strokeOpacity?: Opacity;
}

export interface LineDashOptions {
    /** Defines how the column strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
}
