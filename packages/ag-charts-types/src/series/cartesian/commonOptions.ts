import type {
    CssColor,
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    Opacity,
    PixelSize,
    Ratio,
} from '../../chart/types';

/**
 * Represents configuration options for X and Y axes in a chart.
 */
export interface AxisOptions {
    /** The key used to retrieve x-values (categories) from the data. */
    xKey: string;
    /** The key used to retrieve y-values from the data. */
    yKey: string;
    /** A descriptive label for x-values. */
    xName?: string;
    /** A descriptive label for y-values. */
    yName?: string;
}

/**
 * Represents options for filling shapes in a chart.
 */
export interface FillOptions {
    /** The colour for filling shapes. */
    fill?: AgFillType;
    /** The opacity of the fill colour. */
    fillOpacity?: Opacity;
}

export type AgFillType = CssColor | AgGradientFill;

export type AgGradientFillMode = 'continuous' | 'discrete';

export interface AgGradientColorStop {
    /** Colour of this category. */
    color?: CssColor;
    /** Stop value of this category. Defaults the maximum value if unset. */
    stop?: Ratio;
}

export interface AgGradientFill {
    type: 'gradient';
    /** Format of the gradient */
    gradient?: AgGradientType;
    /** Represents the position and color of stops in the gradient. */
    colorStops?: AgGradientColorStop[];
    /** The domain of the color gradient, defaults to item. */
    bounds?: AgGradientFillBounds;
    /** The rotation angle of the line along which the gradient is rendered. */
    rotation?: number;
}

export type AgGradientType = 'linear' | 'radial' | 'conic';
export type AgGradientFillBounds = 'series' | 'item' | 'axis';

/**
 * Represents options for the strokes in a chart.
 */
export interface StrokeOptions {
    /** The colour for the stroke. */
    stroke?: CssColor;
    /** The width of the stroke in pixels. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke colour. */
    strokeOpacity?: Opacity;
}

/**
 * Represents options for defining dashed strokes in a chart.
 */
export interface LineDashOptions {
    /** An array specifying the length in pixels of alternating dashes and gaps. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
}

/**
 * Represents font styling options for text elements in a chart.
 */
export interface FontOptions {
    /** The colour for text elements. */
    color?: CssColor;
    /** The style to use for text elements. */
    fontStyle?: FontStyle;
    /** The font weight to use for text elements. */
    fontWeight?: FontWeight;
    /** The size of the font in pixels for text elements. */
    fontSize?: FontSize;
    /** The font family for text elements. */
    fontFamily?: FontFamily;
}

/**
 * Represents toggleable options for chart elements.
 */
export interface Toggleable {
    /** Determines whether the associated elements should be displayed on the chart. */
    enabled?: boolean;
}

export interface Visible {
    /** Whether the element should be visible. */
    visible?: boolean;
}
