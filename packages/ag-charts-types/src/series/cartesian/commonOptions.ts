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
    fill?: AgColorType;
    /** The opacity of the fill colour. */
    fillOpacity?: Opacity;
}

export type AgColorType = CssColor | AgGradientColor | AgPatternColor;
export type AgColorTypeStrict = CssColor | AgGradientColorStrict;

export type AgGradientColorMode = 'continuous' | 'discrete';

export interface AgGradientColorStop {
    /** Colour of this category. */
    color?: CssColor;
    /** Stop value of this category. Defaults the maximum value if unset. */
    stop?: Ratio;
}

export interface AgGradientColor {
    type: 'gradient';
    /** Format of the gradient */
    gradient?: AgGradientType;
    /** Represents the position and color of stops in the gradient. */
    colorStops?: AgGradientColorStop[];
    /** The domain of the color gradient, defaults to item. */
    bounds?: AgGradientColorBounds;
    /** The rotation angle of the line along which the gradient is rendered. */
    rotation?: number;
    /** Reverse the order of colour stops. */
    reverse?: boolean;
}

export interface AgGradientColorStrict extends AgGradientColor {
    colorStops: AgGradientColorStop[];
}

export type AgGradientType = 'linear' | 'radial' | 'conic';
export type AgGradientColorBounds = 'series' | 'item' | 'axis';

export interface AgPatternColor {
    type: 'pattern';
    /** The stock pattern to apply. */
    pattern?: AgPatternName;
    /** Width of the pattern unit. */
    width?: number;
    /** Height of the pattern unit. */
    height?: number;
    /** Padding for the shape in the pattern unit. */
    padding?: number;
    /** The colour for filling closed shapes in the pattern. */
    fill?: string;
    /** The opacity of the shapes fill colour. */
    fillOpacity?: Opacity;
    /** The colour for filling the background in the pattern. */
    backgroundFill?: string;
    /** The opacity of the background fill colour. */
    backgroundFillOpacity?: Opacity;
    /** The colour for the strokes of shapes in the pattern. */
    stroke?: string;
    /** The width of the stroke of shapes in pixels. */
    strokeWidth?: PixelSize;
}

export type AgPatternName =
    | 'vertical-lines'
    | 'horizontal-lines'
    | 'forward-slanted-lines'
    | 'backward-slanted-lines'
    | 'squares'
    | 'circles'
    | 'triangles'
    | 'diamonds'
    | 'stars'
    | 'hearts'
    | 'crosses';

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
