import type { _ModuleSupport } from 'ag-charts-community';
import type { BBox, Logger, Point } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { PointType } from './utils/scale';

export type Constructor<T = object> = new (...args: any[]) => T;

export enum AnnotationType {
    // Lines
    Line = 'line',
    HorizontalLine = 'horizontal-line',
    VerticalLine = 'vertical-line',

    // Channels
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',

    // Fibonacci
    FibonacciRetracement = 'fibonacci-retracement',
    FibonacciRetracementTrendBased = 'fibonacci-retracement-trend-based',

    // Texts
    Callout = 'callout',
    Comment = 'comment',
    Note = 'note',
    Text = 'text',

    // Shapes
    Arrow = 'arrow',
    ArrowUp = 'arrow-up',
    ArrowDown = 'arrow-down',

    // Measurers
    DateRange = 'date-range',
    PriceRange = 'price-range',
    DatePriceRange = 'date-price-range',
    QuickDatePriceRange = 'quick-date-price-range',
}

type TextualAnnotationType =
    AnnotationType.Callout | AnnotationType.Comment | AnnotationType.Note | AnnotationType.Text;

type LineAnnotationType =
    AnnotationType.Line | AnnotationType.HorizontalLine | AnnotationType.VerticalLine | AnnotationType.Arrow;

type ChannelAnnotationType = AnnotationType.DisjointChannel | AnnotationType.ParallelChannel;

type MeasurerAnnotationType =
    | AnnotationType.DateRange
    | AnnotationType.PriceRange
    | AnnotationType.DatePriceRange
    | AnnotationType.QuickDatePriceRange;

type EphemeralAnnotationType = AnnotationType.QuickDatePriceRange;

export type FibonacciAnnotationType =
    AnnotationType.FibonacciRetracement | AnnotationType.FibonacciRetracementTrendBased;

export type HasColorAnnotationType = AnnotationType;
export type HasLineStyleAnnotationType = Exclude<
    LineAnnotationType | ChannelAnnotationType | MeasurerAnnotationType,
    EphemeralAnnotationType
>;
export type HasLineTextAnnotationType = Exclude<
    LineAnnotationType | ChannelAnnotationType | MeasurerAnnotationType,
    EphemeralAnnotationType
>;
export type HasFontSizeAnnotationType = Exclude<
    TextualAnnotationType | LineAnnotationType | ChannelAnnotationType | MeasurerAnnotationType,
    EphemeralAnnotationType
>;

const ANNOTATION_TYPES = Object.values(AnnotationType);

export function stringToAnnotationType(value: unknown) {
    for (const t of ANNOTATION_TYPES) {
        if (t === value) return t;
    }
}

export interface DataPoint {
    x?: PointType;
    y?: PointType;
}

export interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export type FibonacciBands = 10 | 6 | 4;
export interface AnnotationAxisContext extends Pick<
    _ModuleSupport.AxisContext,
    | 'continuous'
    | 'direction'
    | 'position'
    | 'scale'
    | 'scaleInvert'
    | 'formatScaleValue'
    | 'attachLabel'
    | 'inRange'
    | 'getRangeOverflow'
> {
    bounds: BBox;
    labelPadding: number;
    /** Distance from the edge of the series area to the outer edge of the axis's tick labels. */
    thickness: number;
    snapToGroup: boolean;
}

export interface AnnotationContext {
    logger: Logger;
    localeManager: _ModuleSupport.LocaleManager;
    seriesRect: BBox;
    xAxis: AnnotationAxisContext;
    yAxis: AnnotationAxisContext;
    isRtl: boolean;
    getVolume(from: DataPoint['x'], to: DataPoint['x']): AgNumericValue | undefined;
    /**
     * Snaps an offset in the series area to the nearest value of a datum, at its position, when the magnet is on. Creation
     * applies it to the point it places, and each scene to the point that a handle drag ends on, through
     * `snapPoint` or `magnetTranslation`; a new scene that moves a point with a handle must do the same. Moving a whole
     * annotation, or moving it by keyboard, is exempt, as it has no single point to snap.
     */
    magnet(offset: Point): Point;
}

export type AnnotationOptionsColorPickerType = 'line-color' | 'fill-color' | 'text-color';

export interface FibonacciAnnotationToolbarOptionsType {
    bands?: FibonacciBands;
    reverse?: boolean;
    showFill?: boolean;
}

/** The line styles the toolbar and settings dialog offer, each standing for a stock dash name. */
export type AnnotationLineStyleType = 'solid' | 'dash' | 'dot';

export interface AnnotationLineStyle {
    lineDash?: AnnotationLineStyleType;
    strokeWidth?: number;
}

export type LineTextAlignment = 'left' | 'center' | 'right';
export type LineTextPosition = 'top' | 'center' | 'bottom';
export type ChannelTextPosition = 'top' | 'inside' | 'bottom';
