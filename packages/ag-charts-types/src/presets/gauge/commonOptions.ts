import type { AgAxisLabelFormatterParams, AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { Formatter } from '../../chart/callbackOptions';
import type { CssColor, Degree, FontFamily, FontSize, FontStyle, FontWeight, PixelSize } from '../../chart/types';

export interface AgGaugeScaleLabel {
    /** Set to `false` to hide the scale labels. */
    enabled?: boolean;
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels */
    fontFamily?: FontFamily;
    /** Padding in pixels between the scale label and the tick. */
    padding?: PixelSize;
    /** The colour to use for the labels */
    color?: CssColor;
    /** The rotation of the scale labels in degrees. Note: for integrated charts the default is 335 degrees, unless the scale shows grouped or default categories (indexes). The first row of labels in a grouped category scale is rotated perpendicular to the scale line. */
    rotation?: Degree;
    /** Avoid scale label collision by automatically reducing the number of ticks displayed. If set to `false`, scale labels may collide. */
    avoidCollisions?: boolean;
    /** Minimum gap in pixels between the scale labels before being removed to avoid collisions. */
    minSpacing?: PixelSize;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to render scale labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of `0.0005` would have `fractionDigits` set to `4` */
    formatter?: Formatter<AgAxisLabelFormatterParams>;
}

// Verification checks for completeness/correctness.
const __AXIS_LABEL_OPTIONS = {} as any as Required<AgGaugeScaleLabel>;
// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore
let __VERIFY_AXIS_LABELS_OPTIONS: Required<AgBaseAxisLabelOptions> = undefined as any;
__VERIFY_AXIS_LABELS_OPTIONS = __AXIS_LABEL_OPTIONS;

export interface AgGaugeSegmentationInterval {
    step?: number;
    values?: number[];
    count?: number;
}

export interface AgGaugeSegmentation {
    /** Configuration for the segmentation. */
    interval?: AgGaugeSegmentationInterval;
    /** The spacing between segments. */
    spacing?: number;
}

export type AgGaugeFillMode = 'continuous' | 'discrete';

export type AgGaugeCornerMode = 'container' | 'item';

export interface AgGaugeColorStop {
    color?: CssColor;
    stop?: number;
}

export interface FillsOptions {
    /** Configuration for two or more colours, and the values they are rendered at. */
    fills?: AgGaugeColorStop[];
    /** Configuration the fills should be rendered. */
    fillMode?: AgGaugeFillMode;
}
