import type { AgNumericValue } from '../../chart/dataValues';
import type {
    AgColorRef,
    AgColorRefMixOnto,
    AgColorRefMixOntoColor,
    AgCssColorOrRef,
} from '../../chart/themeParamsOptions';
import type {
    CssColor,
    DatumKey,
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    Opacity,
    PixelSize,
    Ratio,
} from '../../chart/types';

export interface AgBaseCartesianSeriesAxisOptions {
    /**
     * The key of the x-axis to which this series is bound.
     *
     * Default: `'x'`
     */
    xKeyAxis?: string;
    /**
     * The key of the y-axis to which this series is bound.
     *
     * Default: `'y'`
     */
    yKeyAxis?: string;
}

/**
 * Represents configuration options for X and Y axes in a chart.
 */
export interface AxisOptions<TDatum> {
    /** The key used to retrieve x-values (categories) from the data. */
    xKey: DatumKey<TDatum>;
    /** The key used to retrieve y-values from the data. */
    yKey: DatumKey<TDatum>;
    /** A descriptive label for x-values. */
    xName?: string;
    /** A descriptive label for y-values. */
    yName?: string;
}

/**
 * Represents options for filling shapes in a chart.
 */
export interface FillOptions {
    /** The colour for filling shapes. A colour string, or an object for a gradient, pattern, or image fill. */
    fill?: AgColorType;
    /** The opacity of the fill colour. */
    fillOpacity?: Opacity;
}

export interface FillCssOptions {
    /** The colour for filling shapes. */
    fill?: CssColor;
    /** The opacity of the fill colour. */
    fillOpacity?: Opacity;
}

export type AgColorType =
    | CssColor
    | AgColorRef
    | AgColorRefMixOnto
    | AgColorRefMixOntoColor
    | AgGradientColor
    | AgPatternColor
    | AgImageFill;
export type AgColorTypeStrict = CssColor | AgGradientColorStrict;

export type AgGradientColorMode = 'continuous' | 'discrete';

export interface AgGradientColorStop {
    /** Colour of this category. */
    color?: AgCssColorOrRef;
    /** Stop value of this category. Defaults the maximum value if unset. */
    stop?: Ratio;
}

export interface AgColorScaleColorStop {
    /** Colour at this position. */
    color: AgCssColorOrRef;
    /** Position of this colour in the data domain. In continuous mode, the colour appears exactly at this value. In discrete mode, this is the first value of the next bin. */
    stop?: AgNumericValue;
    /** Display name for this bin, used in legend and tooltip labels. */
    name?: string;
}

export interface AgColorScale {
    /** Configuration for two or more colours, and the values they are rendered at. */
    fills?: AgColorScaleColorStop[];
    /** Fixed domain for the colour scale. If unset, the domain is derived from the data extent. */
    domain?: [AgNumericValue, AgNumericValue];
    /**
     * Whether the fills should be rendered as a continuous gradient or discrete bins.
     *
     * Default: `continuous`
     */
    mode?: AgGradientColorMode;
    /**
     * Fill colour for datums with no `colorKey` value. If unset, each series
     * preserves its default behaviour for missing data.
     */
    missingDataFill?: CssColor;
}

export interface AgGradientColor {
    type: 'gradient';
    /** Represents the position and color of stops in the gradient. */
    colorStops?: AgGradientColorStop[];
    /** The rotation angle of the line along which the gradient is rendered. */
    rotation?: number;
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
    /** The svg path for a custom pattern */
    path?: string;
    /** Width of the pattern unit. */
    width?: number;
    /** Height of the pattern unit. */
    height?: number;
    /** The rotation angle of the pattern. */
    rotation?: number;
    /** The scaling of the pattern. */
    scale?: number;
    /** The colour for filling closed shapes in the pattern. */
    fill?: CssColor;
    /** The opacity of the shapes fill colour. */
    fillOpacity?: Opacity;
    /** The colour for filling the background in the pattern. */
    backgroundFill?: CssColor;
    /** The opacity of the background fill colour. */
    backgroundFillOpacity?: Opacity;
    /** The colour for the strokes of shapes in the pattern. */
    stroke?: CssColor;
    /** The opacity of the shapes stroke colour. */
    strokeOpacity?: Opacity;
    /** The width of the stroke of shapes in pixels. */
    strokeWidth?: PixelSize;
}

export interface AgImageFill {
    type: 'image';
    /** URL of the image. */
    url: string;
    /** The colour for filling the background in the pattern. */
    backgroundFill?: CssColor;
    /** The colour for filling the background in the pattern. */
    backgroundFillOpacity?: Opacity;
    /** Height of the image. */
    width?: number;
    /** Width of the image. */
    height?: number;
    /** A string indicating how to repeat the pattern's unit.*/
    repeat?: AgColorRepeat;
    /** The fit mode of the image. */
    fit?: AgImageFillFit;
    /** The rotation angle of the image. */
    rotation?: number;
}

export type AgColorRepeat = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
export type AgImageFillFit = 'stretch' | 'cover' | 'contain' | 'none';

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
    stroke?: AgCssColorOrRef;
    /** The width of the stroke in pixels. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke colour. */
    strokeOpacity?: Opacity;
}

/**
 * Represents options for the boxing style on labels.
 */
export interface LabelBoxOptions extends FillOptions {
    /** Stroke options for the box border. */
    border?: BorderOptions;
    /** Apply rounded corners to the label box. */
    cornerRadius?: PixelSize;
    /** Distance between the label text and the border. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
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
 * Represents font styling options.
 */
export interface FontOptions {
    /** The size of the font in pixels for text elements. */
    fontSize?: FontSize;
    /** The font family for text elements. */
    fontFamily?: FontFamily;
    /** The style to use for text elements. */
    fontStyle?: FontStyle;
    /** The font weight to use for text elements. */
    fontWeight?: FontWeight;
}

/**
 * Represents styling options for text elements in a chart.
 */
export interface TextOptions extends FontOptions {
    /** The colour for text elements. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
}

export type Padding = PixelSize | PaddingOptions;

export interface PaddingOptions {
    /** The number of pixels of padding at the top. */
    top?: PixelSize;
    /** The number of pixels of padding at the right. */
    right?: PixelSize;
    /** The number of pixels of padding at the bottom. */
    bottom?: PixelSize;
    /** The number of pixels of padding at the left. */
    left?: PixelSize;
}

export interface BorderOptions extends Toggleable, StrokeOptions {}

/**
 * Represents toggleable options for chart elements.
 */
export interface Toggleable {
    /** Whether the associated elements and properties should be used in the chart. */
    enabled?: boolean;
}

export interface Visible {
    /** Whether the element should be visible. */
    visible?: boolean;
}

export type TextValue = string | number | Date;

export interface TextSegment extends TextOptions {
    /**
     * Discriminator separating text segments from image segments. Optional on text segments.
     */
    type?: 'text';
    /** A segment of text. */
    text: TextValue;
    /**
     * Baseline used to align this segment vertically against the rest of the line. Useful when a segment with
     * a larger `fontSize` (an emoji or an icon glyph) should centre against text rendered at the default size.
     *
     * Default: `'baseline'`
     */
    verticalAlign?: 'baseline' | 'top' | 'middle' | 'bottom';
    /**
     * Explicit line height in pixels for the line containing this segment. When several segments on the same
     * line declare a `lineHeight`, the largest value wins. When omitted, the line uses the natural font line
     * height of its tallest segment.
     */
    lineHeight?: PixelSize;
}

/**
 * Inline image embedded alongside text segments. Reserves a box of `width` x `height` so that
 * async image loading does not reflow the surrounding layout.
 */
export interface ImageSegment {
    /** Discriminator marking this entry as an image rather than a text segment. */
    type: 'image';
    /** URL of the image. */
    url: string;
    /** Box width in pixels. */
    width: PixelSize;
    /** Box height in pixels. */
    height: PixelSize;
    /**
     * Textual description of the image, used for
     * accessibility and consumers that flatten labels to strings (tooltips, exports).
     * Omitting `alt` causes an image-only label to read as empty.
     */
    alt?: string;
    /**
     * Positions the image box vertically relative to the adjacent text; the text position stays
     * fixed and only the image moves.
     *
     * - `'top'` — the image's top edge aligns with the top of the text (the image extends below it).
     * - `'middle'` — the image's centre aligns with the text's midline.
     * - `'bottom'` — the image's bottom edge aligns with the text's descender line (the image extends above it).
     * - `'baseline'` — the image's bottom edge sits on the text baseline (like a text glyph).
     *
     * For block images (`block: true`) the default is `'middle'` instead.
     *
     * Default: `'baseline'`
     */
    verticalAlign?: 'baseline' | 'top' | 'middle' | 'bottom';
    /**
     * Drop priority when the label exceeds its allotted box. `'hide'` images are dropped before
     * text is truncated. `'keep'` images take priority over text: trailing text segments are
     * dropped to fit the image, and the image itself is only dropped when it cannot fit the
     * label box on its own.
     *
     * Default: `'hide'`
     */
    overflowStrategy?: 'keep' | 'hide';
    /** Padding around the image inside its reserved box. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    /** Rounds the corners of the image and the background decoration. */
    cornerRadius?: PixelSize;
    /**
     * Background colour drawn underneath the image. Also used as the placeholder fill while the
     * image loads, and as the fallback fill if loading fails.
     */
    backgroundFill?: CssColor;
    /**
     * When `true`, this image starts a block row: it is anchored to the left of the label and
     * subsequent segments flow into a wrapped column to its right. A block row begins when this
     * image is the first segment of the label, when the preceding segment is also a block image,
     * or when the preceding text segment ends with a `\n` line break. Multiple block rows stack
     * vertically. When the flag appears mid-line (preceded by inline content with no `\n`), it
     * is ignored and the image renders inline.
     *
     * Default: `false`
     */
    block?: boolean;
}

export type ContentSegment = TextSegment | ImageSegment;

export type TextOrSegments = TextValue | ContentSegment[];
